using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SaudeMemora.Application.DTOs;
using SaudeMemora.Application.Exceptions;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

/// <summary>Resultado de uma chamada ao OCR.space. Succeeded=false indica falha da API (não do documento).</summary>
internal readonly record struct OcrCallResult(string Text, bool Succeeded);

public class DocumentProcessingService : IOcrAiService
{
    private readonly HttpClient _httpClient;
    private readonly string? _ocrSpaceApiKey;
    private readonly string? _geminiApiKey;
    private readonly string? _groqApiKey;
    private readonly ILogger<DocumentProcessingService> _logger;

    public DocumentProcessingService(HttpClient httpClient, IConfiguration config, ILogger<DocumentProcessingService> logger)
    {
        _httpClient = httpClient;
        _ocrSpaceApiKey = Environment.GetEnvironmentVariable("OCR_SPACE_API_KEY") ?? config["OcrSpace:ApiKey"];
        _geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? config["Gemini:ApiKey"];
        _groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? config["Groq:ApiKey"];
        _logger = logger;
    }

    public async Task<DocumentoExtraidoDto> ExtractDocumentDataAsync(string imageUrl, string documentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_geminiApiKey))
        {
            throw new Exception("Faltam chaves de API (OCR_SPACE_API_KEY ou GEMINI_API_KEY). Configure no .env.");
        }

        // 1. Chamar os dois motores do OCR.space em paralelo
        var engine1Task = CallOcrSpaceAsync(imageUrl, 1, cancellationToken);
        var engine2Task = CallOcrSpaceAsync(imageUrl, 2, cancellationToken);

        await Task.WhenAll(engine1Task, engine2Task);

        string textEngine1 = engine1Task.Result.Text;
        string textEngine2 = engine2Task.Result.Text;

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
        {
            if (engine1Task.Result.Succeeded || engine2Task.Result.Succeeded)
                throw new InvalidDocumentException(); // OCR funcionou, mas a imagem não tem texto legível
            throw new Exception("Nenhum texto encontrado pela OCR.space em nenhum dos motores.");
        }

        // 2. Unificar textos com a Gemini
        string unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);

        // 3. Extrair dados estruturados
        return await ExtractStructuredDataAsync(unifiedText, documentType, cancellationToken);
    }

    public async Task<DocumentoExtraidoDto> ExtractMultipleDocumentsDataAsync(List<string> imageUrls, string documentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_geminiApiKey))
            throw new Exception("Faltam chaves de API (OCR_SPACE_API_KEY ou GEMINI_API_KEY). Configure no .env.");

        var allTexts = new List<string>();
        var anyOcrApiFailure = false;

        foreach (var url in imageUrls)
        {
            var engine1Task = CallOcrSpaceAsync(url, 1, cancellationToken);
            var engine2Task = CallOcrSpaceAsync(url, 2, cancellationToken);
            await Task.WhenAll(engine1Task, engine2Task);
            
            string textEngine1 = engine1Task.Result.Text;
            string textEngine2 = engine2Task.Result.Text;
            
            if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
            {
                if (!engine1Task.Result.Succeeded && !engine2Task.Result.Succeeded) anyOcrApiFailure = true;
                continue;
            }
                
            string unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);
            allTexts.Add(unifiedText);
        }

        if (allTexts.Count == 0)
        {
            // Se a API do OCR falhou, é transitório (retry). Se rodou e não achou texto, a imagem é inválida.
            if (anyOcrApiFailure)
                throw new Exception("Nenhum texto encontrado em nenhuma das imagens enviadas (falha na API de OCR).");
            throw new InvalidDocumentException();
        }

        string finalUnifiedText = string.Join("\n\n--- PRÓXIMA PÁGINA/IMAGEM ---\n\n", allTexts);

        return await ExtractStructuredDataAsync(finalUnifiedText, documentType, cancellationToken);
    }

    public async Task<CarteirinhaExtraidaDto> ExtractCarteirinhaDataAsync(string imageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_geminiApiKey))
            return new CarteirinhaExtraidaDto();

        var engine1Task = CallOcrSpaceAsync(imageUrl, 1, cancellationToken);
        var engine2Task = CallOcrSpaceAsync(imageUrl, 2, cancellationToken);
        await Task.WhenAll(engine1Task, engine2Task);
        
        string textEngine1 = engine1Task.Result.Text;
        string textEngine2 = engine2Task.Result.Text;

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
            return new CarteirinhaExtraidaDto();

        string unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);

        var jsonFormat = @"
        {
            ""planoSaude"": ""Nome do plano de saúde ou seguradora (ex: Bradesco Saúde, Amil, Unimed, SulAmérica, NotreDame, Cassi, etc.)"",
            ""numeroCarteirinha"": ""Número de identificação do segurado/carteirinha. Apenas números e letras, sem formatação extra.""
        }";

        var prompt = $@"
Você é um EXTRATOR DE DADOS DE CARTEIRINHAS DE PLANO DE SAÚDE.
Extraia as informações do texto OCR da carteirinha abaixo.
Se não achar algo de forma óbvia, retorne string vazia """".

Texto unificado:
{unifiedText}

Retorne ESTRITAMENTE um JSON no seguinte formato:
{jsonFormat}
";

        var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
        var payload = new
        {
            model = "openai/gpt-oss-120b",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            response_format = new { type = "json_object" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        if (!string.IsNullOrWhiteSpace(_groqApiKey))
            request.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            var jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
            
            jsonResult = jsonResult.Replace("```json", "").Replace("```", "").Trim();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            options.Converters.Add(new FlexibleBooleanConverter());
            try
            {
                return JsonSerializer.Deserialize<CarteirinhaExtraidaDto>(jsonResult, options) ?? new CarteirinhaExtraidaDto();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao deserializar carteirinha: {JsonResult}", jsonResult);
            }
        }
        else
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Groq falhou na extração de carteirinha. HTTP {StatusCode}: {Error}", response.StatusCode, err);
        }

        return new CarteirinhaExtraidaDto();
    }

    private async Task<OcrCallResult> CallOcrSpaceAsync(string imageUrl, int engine, CancellationToken cancellationToken)
    {
        var encodedUrl = Uri.EscapeDataString(imageUrl);
        var url = $"https://api.ocr.space/parse/imageurl?apikey={_ocrSpaceApiKey}&url={encodedUrl}&ocrengine={engine}&language=por&scale=true&isTable=true";
        
        try
        {
            var response = await _httpClient.GetAsync(url, cancellationToken);
            var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Erro OCR API HTTP {StatusCode}: {RawJson}", response.StatusCode, rawJson);
                return new OcrCallResult("", false);
            }
            
            using var doc = JsonDocument.Parse(rawJson);
            var result = doc.RootElement;
            
            if (result.TryGetProperty("IsErroredOnProcessing", out var isErrored) && isErrored.GetBoolean())
            {
                var errMessage = result.TryGetProperty("ErrorMessage", out var msg) ? msg.ToString() : "Erro desconhecido";
                _logger.LogWarning("Erro do Motor OCR {Engine}: {ErrMessage}", engine, errMessage);
                return new OcrCallResult("", false);
            }

            if (result.TryGetProperty("ParsedResults", out var parsedResults) && parsedResults.GetArrayLength() > 0)
            {
                var parsedText = parsedResults[0].GetProperty("ParsedText").GetString();
                return new OcrCallResult(parsedText ?? "", true);
            }

            // Resposta válida da API, porém sem resultados = imagem sem texto legível
            return new OcrCallResult("", true);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada OCR Engine {Engine} foi cancelada.", engine);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro OCR Engine {Engine}", engine);
        }
        return new OcrCallResult("", false);
    }

    private async Task<string> UnifyTextsWithGeminiAsync(string text1, string text2, CancellationToken cancellationToken)
    {
        var prompt = $@"
Você é um assistente médico de transcrição altamente preciso.
Abaixo estão duas leituras de OCR da MESMA imagem. O Motor 1 foca em texto corrido, e o Motor 2 em tabelas.
Sua tarefa: Unificar as duas extrações no texto final mais correto, corrigindo possíveis erros de digitação (ortografia) causados pelo OCR, mas SEMPRE mantendo as dosagens e números intocados.
NÃO INCLUA NENHUM RACIOCÍNIO. NÃO INCLUA INTRODUÇÕES, CONCLUSÕES OU EXPLICAÇÕES. RETORNE APENAS O TEXTO UNIFICADO E CORRIGIDO DIRETAMENTE.
[Motor 1]:
{text1}

[Motor 2]:
{text2}
";
        var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
        var payload = new
        {
            model = "openai/gpt-oss-120b",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        if (!string.IsNullOrWhiteSpace(_groqApiKey))
            request.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
        request.Content = JsonContent.Create(payload);

        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                return groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
            }
            else 
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Groq falhou na unificação de texto. HTTP {StatusCode}: {Error}", response.StatusCode, err);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada Groq de unificação cancelada.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro na unificação via Groq.");
        }
        
        // Em caso de falha, retorna o que tiver mais conteúdo
        return text1.Length > text2.Length ? text1 : text2;
    }

    private async Task<DocumentoExtraidoDto> ExtractStructuredDataAsync(string unifiedText, string documentType, CancellationToken cancellationToken)
    {
        var docType = (documentType ?? "").ToLower().Trim();
        string prompt;

        // ── Shared JSON schema description ────────────────────────────────
        var jsonSchema = @"{
  ""documentoValido"": ""boolean (true se a imagem/texto for um exame, atestado, receita ou documento médico real. false se for lixo, foto aleatória sem sentido, paisagem, etc)"",
  ""tipoIdentificado"": ""string"",
  ""titulo"": ""string"",
  ""medico"": ""string"",
  ""crm"": ""string"",
  ""clinica"": ""string"",
  ""data"": ""string (dd/MM/yyyy)"",
  ""resumo"": ""string"",
  ""diagnostico"": ""string"",
  ""textoFormatado"": ""string"",
  ""medicamentos"": [{ ""nome"": ""string"", ""dosagem"": ""string"", ""horario"": ""string"" }],
  ""conteudoIndentado"": [{ ""tipo"": ""string (header|keyvalue|bullet|text)"", ""texto"": ""string"", ""chave"": ""string"", ""valor"": ""string"" }]
}";

        // ── RECEITA MÉDICA / PRESCRIÇÃO ────────────────────────────────────
        if (docType.Contains("receita") || docType.Contains("prescri"))
        {
            prompt = $@"Você é um FARMACÊUTICO ESPECIALISTA em leitura de receitas médicas brasileiras.
Sua tarefa é extrair com PRECISÃO MÁXIMA todos os dados de uma receita médica.

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": SEMPRE ""receita""
- ""titulo"": Use ""Receita Médica"" ou o nome específico (ex: ""Receita de Controle Especial"", ""Receita Azul"")
- ""medico"": SOMENTE o nome do médico prescritor. Nunca inclua CRM aqui.
- ""crm"": Apenas o número e UF (ex: ""12345/SP""). Se não houver, deixe vazio.
- ""clinica"": Nome da clínica, consultório ou hospital onde foi emitida. Vazio se não constar.
- ""data"": Data de emissão no formato dd/MM/yyyy.
- ""resumo"": Uma frase descrevendo o objetivo (ex: ""Prescrição de antibiótico amoxicilina e antifebril para tratamento de infecção"").
- ""diagnostico"": APENAS se a receita mencionar expressamente um CID ou diagnóstico. Na maioria das receitas, estará vazio.
- ""textoFormatado"": TODO o texto bruto, reescrito com espaçamento e quebras de linha lógicas (\n).
- ""medicamentos"": CAMPO MAIS IMPORTANTE. Liste CADA medicamento com:
    - ""nome"": Nome comercial ou genérico completo
    - ""dosagem"": Concentração (mg, ml, cp) e quantidade (ex: ""500mg - 2 comprimidos"")
    - ""horario"": Posologia completa exatamente como está escrita (ex: ""1 comprimido a cada 8 horas por 7 dias"")
- ""conteudoIndentado"": Represente a estrutura da receita:
    - tipo ""header"": nome do médico/clínica no topo
    - tipo ""keyvalue"": Paciente, Data, etc.
    - tipo ""bullet"": cada medicamento
    - tipo ""text"": instruções gerais

## ATENÇÃO
- Se houver 3 medicamentos, o array ""medicamentos"" DEVE ter 3 objetos.
- NUNCA invente medicamentos. Apenas o que estiver explicitamente no texto.
- Dosagem e horário NUNCA devem ser deixados vazios se a informação estiver no texto.

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        // ── ATESTADO MÉDICO ────────────────────────────────────────────────
        else if (docType.Contains("atestado"))
        {
            prompt = $@"Você é um MÉDICO DO TRABALHO especialista em análise de atestados médicos brasileiros.
Sua tarefa é extrair com PRECISÃO as informações do atestado abaixo.

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": SEMPRE ""atestado""
- ""titulo"": ""Atestado Médico"" ou variação (ex: ""Declaração de Comparecimento"")
- ""medico"": Nome completo do médico emissor. Nunca inclua CRM aqui.
- ""crm"": Apenas o número e UF do CRM.
- ""clinica"": Nome da instituição/clínica/hospital.
- ""data"": Data de emissão no formato dd/MM/yyyy.
- ""resumo"": Descreva objetivamente o conteúdo (ex: ""Atestado de 2 dias de repouso por síndrome gripal"").
- ""diagnostico"": FUNDAMENTAL. Inclua o CID se constar, o diagnóstico E o número de dias de afastamento (ex: ""Gripe (J11) - 2 dias de repouso""). Este é o campo mais importante!
- ""medicamentos"": SEMPRE lista vazia [].
- ""textoFormatado"": TODO o texto reescrito com formatação lógica (\n).
- ""conteudoIndentado"": Represente a estrutura: header (nome do médico/clínica), keyvalue (Paciente, Data, Período de afastamento), text (justificativa médica).

## CAMPOS DE ATENÇÃO ESPECIAL
- Dias de afastamento / período de repouso: inclua no ""diagnostico"" e no ""resumo"".
- Nome do paciente: coloque como keyvalue no ""conteudoIndentado"".

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO E VALIDAÇÃO
- ""documentoValido"": Se a imagem for claramente lixo (foto de paisagem, meme, texto sem nenhuma relação com saúde, etc), retorne false. Se for um documento médico ou de saúde legítimo, retorne true.
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        // ── LAUDO MÉDICO / RELATÓRIO CLÍNICO ──────────────────────────────
        else if (docType.Contains("laudo") || docType.Contains("relat") || docType.Contains("clinico"))
        {
            prompt = $@"Você é um MÉDICO RADIOLOGISTA/PATOLOGISTA especialista em análise de laudos médicos brasileiros.
Sua tarefa é extrair com PRECISÃO CLÍNICA as informações do laudo/relatório abaixo.

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": SEMPRE ""laudo""
- ""titulo"": Nome do exame ou tipo de laudo (ex: ""Laudo de Ultrassonografia Abdominal"", ""Relatório de Ecocardiograma""). NUNCA ""Documento Digitalizado"".
- ""medico"": Nome do médico responsável pelo laudo (radiologista, cardiologista, etc.). Nunca inclua CRM aqui.
- ""crm"": Apenas número e UF.
- ""clinica"": Nome do laboratório, clínica ou hospital.
- ""data"": Data de realização no formato dd/MM/yyyy.
- ""resumo"": Breve descrição objetiva dos achados principais em 1-2 frases.
- ""diagnostico"": A CONCLUSÃO/IMPRESSÃO DIAGNÓSTICA do laudo. Copie a seção de conclusão ou impressão do médico.
- ""medicamentos"": SEMPRE lista vazia [].
- ""textoFormatado"": TODO o texto reescrito com formatação lógica (\n).
- ""conteudoIndentado"": Represente fielmente a estrutura do laudo:
    - header: título e dados da instituição
    - keyvalue: Paciente, Médico Solicitante, Data, Exame
    - text: corpo técnico do laudo
    - bullet: achados específicos listados

## ATENÇÃO
- A seção ""Conclusão"" ou ""Impressão"" do laudo é o ""diagnostico"".
- Para valores de exames (ex: fração de ejeção: 65%), use tipo ""keyvalue"".

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO E VALIDAÇÃO
- ""documentoValido"": Se a imagem for claramente lixo (foto de paisagem, meme, texto sem nenhuma relação com saúde, etc), retorne false. Se for um documento médico ou de saúde legítimo, retorne true.
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        // ── EXAME DE SANGUE / LABORATORIAL ────────────────────────────────
        else if (docType.Contains("sangue") || docType.Contains("laborat") || docType.Contains("hemograma") || docType.Contains("bioquim"))
        {
            prompt = $@"Você é um MÉDICO LABORATORISTA especialista em análise de exames de sangue e exames laboratoriais brasileiros.
Sua tarefa é extrair com PRECISÃO os dados do exame laboratorial abaixo.

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": SEMPRE ""exame""
- ""titulo"": Nome do painel de exames (ex: ""Hemograma Completo"", ""Perfil Lipídico"", ""Glicemia e HbA1c""). NUNCA genérico.
- ""medico"": Médico solicitante (se constar). Nunca inclua CRM aqui.
- ""crm"": Apenas número e UF do CRM do solicitante.
- ""clinica"": Nome do laboratório (ex: ""Fleury"", ""DASA"", ""Hermes Pardini"").
- ""data"": Data de coleta ou emissão no formato dd/MM/yyyy.
- ""resumo"": Descreva o painel de exames (ex: ""Painel de exames de rotina incluindo hemograma, colesterol e glicemia"").
- ""diagnostico"": Se houver algum valor fora do intervalo de referência, destaque aqui (ex: ""Glicemia elevada: 130 mg/dL (ref: 70-100)""). Se tudo normal, ""Todos os valores dentro dos parâmetros de referência"".
- ""medicamentos"": SEMPRE lista vazia [].
- ""textoFormatado"": TODO o texto reescrito com formatação lógica (\n).
- ""conteudoIndentado"": MUITO IMPORTANTE - Represente CADA exame como um keyvalue:
    - ""chave"": nome do exame (ex: ""Hemoglobina"")
    - ""valor"": resultado + unidade + referência (ex: ""14,5 g/dL (ref: 12,0-16,0)"")
    - Se valor estiver fora da referência, use tipo ""bullet"" com indicação [ALTO] ou [BAIXO].

## ATENÇÃO ESPECIAL - TABELAS DE OCR
- OCR em tabelas de exames frequentemente mistura as colunas. Alinhe: 1º exame com 1º resultado, 2º exame com 2º resultado.
- Nunca repita o mesmo exame. Nunca atribua resultado de um exame a outro.
- Preserve os valores decimais exatamente como estão.

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO E VALIDAÇÃO
- ""documentoValido"": Se a imagem for claramente lixo (foto de paisagem, meme, texto sem nenhuma relação com saúde, etc), retorne false. Se for um documento médico ou de saúde legítimo, retorne true.
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        // ── EXAME DE IMAGEM (Raio-X, Ultrassom, Ressonância, TC) ──────────
        else if (docType.Contains("imagem") || docType.Contains("raio") || docType.Contains("ultra") || docType.Contains("ressonancia") || docType.Contains("tomografia"))
        {
            prompt = $@"Você é um MÉDICO RADIOLOGISTA especialista em análise de exames de imagem brasileiros.
Sua tarefa é extrair com PRECISÃO os dados do exame de imagem abaixo.

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": SEMPRE ""exame""
- ""titulo"": Nome do exame de imagem (ex: ""Radiografia do Tórax PA"", ""Ultrassonografia Abdominal Total"", ""Ressonância Magnética da Coluna Lombar""). NUNCA genérico.
- ""medico"": Médico radiologista que assinou o laudo. Nunca inclua CRM aqui.
- ""crm"": Apenas número e UF.
- ""clinica"": Nome da clínica radiológica ou hospital (ex: ""Radioclínica"", ""Instituto de Radiologia"").
- ""data"": Data de realização no formato dd/MM/yyyy.
- ""resumo"": Técnica utilizada e região examinada (ex: ""Radiografia digital do tórax em PA e perfil com avaliação dos campos pulmonares"").
- ""diagnostico"": A IMPRESSÃO DIAGNÓSTICA ou CONCLUSÃO do radiologista. Copie o texto da conclusão.
- ""medicamentos"": SEMPRE lista vazia [].
- ""textoFormatado"": TODO o texto reescrito com formatação lógica (\n).
- ""conteudoIndentado"":
    - header: título do exame e dados da instituição
    - keyvalue: Paciente, Médico Solicitante, Data, Técnica
    - text: Descrição do exame (achados radiológicos)
    - text ou bullet: Impressão/Conclusão

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO E VALIDAÇÃO
- ""documentoValido"": Se a imagem for claramente lixo (foto de paisagem, meme, texto sem nenhuma relação com saúde, etc), retorne false. Se for um documento médico ou de saúde legítimo, retorne true.
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        // ── ENCAMINHAMENTO ─────────────────────────────────────────────────
        else if (docType.Contains("encaminhamento"))
        {
            prompt = $@"Você é um MÉDICO especialista em leitura de guias e encaminhamentos médicos brasileiros.
Sua tarefa é extrair com PRECISÃO os dados do encaminhamento abaixo.

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": SEMPRE ""encaminhamento""
- ""titulo"": ""Guia de Encaminhamento"" ou ""Solicitação de Consulta/Exame"" com a especialidade (ex: ""Encaminhamento para Cardiologista"").
- ""medico"": Médico que está solicitando o encaminhamento. Nunca inclua CRM aqui.
- ""crm"": CRM do médico solicitante.
- ""clinica"": Clínica ou serviço de destino (ex: ""Hospital das Clínicas - Cardiologia"").
- ""data"": Data de emissão no formato dd/MM/yyyy.
- ""resumo"": Motivo do encaminhamento (ex: ""Paciente encaminhado à Cardiologia por suspeita de arritmia cardíaca"").
- ""diagnostico"": Hipótese diagnóstica ou motivo clínico do encaminhamento.
- ""medicamentos"": SEMPRE lista vazia [].
- ""textoFormatado"": TODO o texto reescrito com formatação lógica (\n).
- ""conteudoIndentado"": header (médico solicitante), keyvalue (Paciente, Data, Especialidade solicitada), text (motivo clínico).

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO E VALIDAÇÃO
- ""documentoValido"": Se a imagem for claramente lixo (foto de paisagem, meme, texto sem nenhuma relação com saúde, etc), retorne false. Se for um documento médico ou de saúde legítimo, retorne true.
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        // ── VACINAÇÃO ──────────────────────────────────────────────────────
        else if (docType.Contains("vacina"))
        {
            prompt = $@"Você é um especialista em carteiras de vacinação e comprovantes de vacina brasileiros.
Sua tarefa é extrair com PRECISÃO os dados do documento de vacinação abaixo.

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": SEMPRE ""vacina""
- ""titulo"": ""Comprovante de Vacinação"" ou ""Carteira de Vacinação"" ou nome específico da vacina.
- ""medico"": Profissional de saúde responsável (se constar). Geralmente vazio.
- ""crm"": Geralmente vazio.
- ""clinica"": Unidade de saúde, clínica ou farmácia onde foi aplicada.
- ""data"": Data de aplicação no formato dd/MM/yyyy.
- ""resumo"": Descreva as vacinas aplicadas (ex: ""Vacinação COVID-19 - 3ª dose (Bivalente)"").
- ""diagnostico"": Vazio.
- ""medicamentos"": Use o array para cada dose de vacina:
    - ""nome"": Nome da vacina (ex: ""COVID-19 Bivalente"", ""Influenza Quadrivalente"")
    - ""dosagem"": Número da dose (ex: ""3ª Dose"", ""Dose única"") + lote se constar
    - ""horario"": Data de aplicação + próxima dose se houver
- ""textoFormatado"": TODO o texto reescrito com formatação lógica (\n).
- ""conteudoIndentado"": keyvalue para cada informação relevante (vacina, lote, data, local).

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        // ── GENÉRICO / EXAME NÃO CATEGORIZADO ─────────────────────────────
        else
        {
            prompt = $@"Você é um MÉDICO CLÍNICO GERAL especialista em análise de documentos médicos brasileiros.
Sua tarefa é extrair com PRECISÃO os dados do documento médico abaixo.
O usuário classificou como: ""{documentType}"".

## REGRAS OBRIGATÓRIAS
- ""tipoIdentificado"": Classifique como um dos tipos: ""exame"", ""receita"", ""laudo"", ""atestado"", ""encaminhamento"", ""vacina"" ou ""clinico"".
- ""titulo"": Nome ESPECÍFICO do documento. NUNCA use ""Documento Digitalizado"" ou termos genéricos.
- ""medico"": APENAS o nome do médico. Nunca inclua CRM aqui.
- ""crm"": Apenas número e UF.
- ""clinica"": Nome da instituição de saúde.
- ""data"": Data principal no formato dd/MM/yyyy.
- ""resumo"": 1-2 frases descrevendo objetivamente o documento.
- ""diagnostico"": Conclusão médica, CID ou achados principais se houver.
- ""medicamentos"": Lista de medicamentos se constar algum.
- ""textoFormatado"": TODO o texto reescrito com formatação lógica (\n).
- ""conteudoIndentado"": Represente a estrutura do documento fielmente.

## REGRAS GERAIS
- Se um campo não existir no texto, retorne string vazia """".
- Preserve números e dosagens EXATAMENTE como estão no texto.
- Não invente informações.

## Texto do documento:
{unifiedText}

## REGRAS GERAIS DE FORMATAÇÃO
- Nomes Próprios (médicos, clínicas, pacientes) DEVEM ser formatados estritamente em Title Case (Iniciais Maiúsculas, ex: 'Tadao Mori', 'Daniel Guidi Ferrari'). NUNCA retorne nomes em ALL CAPS (ex: 'DANIEL GUIDI FERRARI').

Retorne APENAS o JSON abaixo (sem markdown, sem explicações):
{jsonSchema}";
        }

        return await FallbackToGroqAsync(unifiedText, prompt, cancellationToken);
    }



    private async Task<DocumentoExtraidoDto> FallbackToGroqAsync(string unifiedText, string prompt, CancellationToken cancellationToken)
    {
        var groqKey = _groqApiKey;
        if (string.IsNullOrWhiteSpace(groqKey))
        {
            _logger.LogWarning("Chave GROQ_API_KEY não encontrada. Usando modo de segurança string.");
            return ParseFallback(unifiedText);
        }

        try
        {
            var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
            var payload = new
            {
                model = "openai/gpt-oss-120b",
                messages = new[] { new { role = "user", content = prompt } },
                temperature = 0.0,
                max_tokens = 4096,
                response_format = new { type = "json_object" }
            };
            
            var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
            request.Headers.Add("Authorization", $"Bearer {groqKey}");
            request.Content = JsonContent.Create(payload);
            var response = await _httpClient.SendAsync(request, cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                var jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
                
                jsonResult = jsonResult.Replace("```json", "").Replace("```", "").Trim();
                
                try 
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    options.Converters.Add(new FlexibleBooleanConverter());
                    var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options) ?? new DocumentoExtraidoDto();
                    dto.TextoExtraido = !string.IsNullOrWhiteSpace(dto.TextoFormatado) ? dto.TextoFormatado : unifiedText;
                    _logger.LogInformation("Extração estruturada realizada com sucesso via fallback Groq (Llama 3.1 8B).");
                    return dto;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao deserializar extração no Groq. JSON: {JsonResult}", jsonResult);
                    return new DocumentoExtraidoDto { TextoExtraido = unifiedText, Resumo = $"Erro de conversão (JSON): {ex.Message}" };
                }
            }
            else
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Groq falhou no fallback. HTTP {StatusCode}: {Error}", response.StatusCode, err);
                return ParseFallback(unifiedText);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro no fallback Groq.");
            return ParseFallback(unifiedText);
        }
    }

    private DocumentoExtraidoDto ParseFallback(string text)
    {
        var dto = new DocumentoExtraidoDto 
        { 
            TextoExtraido = text, 
            TipoIdentificado = "clinico",
            Titulo = "Documento Digitalizado",
            Medicamentos = new List<MedicamentoExtraidoDto>()
        };
        
        var lines = text.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
        var pacienteInfos = new List<string>();
        var conclusoes = new List<string>();
        var pendingLabels = new Queue<string>();

        foreach (var line in lines)
        {
            var l = line.Trim();
            if (string.IsNullOrWhiteSpace(l)) continue;

            var lower = l.ToLower();
            var isLabel = false;
            
            if (lower.StartsWith("dr(a)") || lower.StartsWith("dr.") || lower.StartsWith("médico") || lower.StartsWith("doutor")) { pendingLabels.Enqueue("Medico"); isLabel = true; }
            else if (lower.StartsWith("entrada") || lower.StartsWith("data")) { pendingLabels.Enqueue("Data"); isLabel = true; }
            else if (lower.StartsWith("sr(a)") || lower.StartsWith("paciente")) { pendingLabels.Enqueue("Paciente"); isLabel = true; }
            else if (lower.StartsWith("convênio")) { pendingLabels.Enqueue("Convenio"); isLabel = true; }
            else if (lower.StartsWith("idade")) { pendingLabels.Enqueue("Idade"); isLabel = true; }
            else if (lower.StartsWith("amostra")) { pendingLabels.Enqueue("Amostra"); isLabel = true; }
            else if (lower.StartsWith("prontuário")) { pendingLabels.Enqueue("Prontuario"); isLabel = true; }
            
            if (isLabel)
            {
                if (l.Contains(":"))
                {
                    var label = pendingLabels.Dequeue();
                    AssignFallbackValue(dto, pacienteInfos, label, l.Substring(l.IndexOf(':') + 1));
                }
                continue;
            }

            if (pendingLabels.Count > 0 && (l.StartsWith(":") || char.IsLetterOrDigit(l[0])))
            {
                var label = pendingLabels.Dequeue();
                var value = l.StartsWith(":") ? l.Substring(1).Trim() : l;
                AssignFallbackValue(dto, pacienteInfos, label, value);
                continue;
            }

            if (lower.Contains("clínica") || lower.Contains("hospital") || lower.Contains("radioclínica") || lower.Contains("laboratório"))
            {
                if (string.IsNullOrEmpty(dto.Clinica)) dto.Clinica = l;
            }
            else if (lower.StartsWith("crm"))
            {
                dto.Crm = l.Replace("CRM", "").Replace("crm", "").Replace(":", "").Trim();
            }
            else if (l.Length > 25 && !lower.Contains("www") && !lower.Contains("http") && !lower.Contains("rua ") && !lower.Contains("cep") && !lower.Contains("fone") && !lower.Contains("telefone"))
            {
                conclusoes.Add(l);
            }
        }
        
        if (conclusoes.Count > 0)
        {
            dto.Resumo = string.Join(" ", conclusoes);
            dto.Diagnostico = conclusoes[0]; 
        }
        else
        {
            dto.Resumo = pacienteInfos.Count > 0 ? string.Join(" | ", pacienteInfos) : "Documento extraído.";
        }

        if (pacienteInfos.Count > 0)
        {
            dto.Observacoes = string.Join(" | ", pacienteInfos);
        }
        
        return dto;
    }

    private void AssignFallbackValue(DocumentoExtraidoDto dto, List<string> infos, string label, string value)
    {
        value = value.Trim();
        if (string.IsNullOrEmpty(value)) return;

        switch (label)
        {
            case "Medico": dto.Medico = value; break;
            case "Data": dto.Data = value; break;
            case "Paciente": infos.Add($"Paciente: {value}"); break;
            case "Convenio": infos.Add($"Convênio: {value}"); break;
            case "Idade": infos.Add($"Idade: {value}"); break;
            case "Amostra": infos.Add($"Amostra: {value}"); break;
            case "Prontuario": infos.Add($"Prontuário: {value}"); break;
        }
    }
}

public class FlexibleBooleanConverter : JsonConverter<bool>
{
    public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString()?.ToLowerInvariant();
            if (str == "true" || str == "1" || str == "yes") return true;
            return false;
        }
        if (reader.TokenType == JsonTokenType.Number)
        {
            return reader.GetInt32() != 0;
        }
        if (reader.TokenType == JsonTokenType.True)
        {
            return true;
        }
        
        return false;
    }

    public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
    {
        writer.WriteBooleanValue(value);
    }
}
