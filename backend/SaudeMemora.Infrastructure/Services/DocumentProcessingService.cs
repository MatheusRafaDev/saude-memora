using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SaudeMemora.Application.DTOs;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

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

        string textEngine1 = engine1Task.Result;
        string textEngine2 = engine2Task.Result;

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
        {
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

        foreach (var url in imageUrls)
        {
            var engine1Task = CallOcrSpaceAsync(url, 1, cancellationToken);
            var engine2Task = CallOcrSpaceAsync(url, 2, cancellationToken);
            await Task.WhenAll(engine1Task, engine2Task);
            
            string textEngine1 = engine1Task.Result;
            string textEngine2 = engine2Task.Result;
            
            if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
                continue;
                
            string unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);
            allTexts.Add(unifiedText);
        }

        if (allTexts.Count == 0)
            throw new Exception("Nenhum texto encontrado em nenhuma das imagens enviadas.");

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
        
        string textEngine1 = engine1Task.Result;
        string textEngine2 = engine2Task.Result;

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

        var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_geminiApiKey}";
        var payload = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { temperature = 0.0 }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, geminiUrl);
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            var geminiJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            var jsonResult = geminiJson.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
            
            jsonResult = jsonResult.Replace("```json", "").Replace("```", "").Trim();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
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
            _logger.LogError("Gemini falhou na extração de carteirinha. HTTP {StatusCode}: {Error}", response.StatusCode, err);
        }

        return new CarteirinhaExtraidaDto();
    }

    private async Task<string> CallOcrSpaceAsync(string imageUrl, int engine, CancellationToken cancellationToken)
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
                return "";
            }
            
            using var doc = JsonDocument.Parse(rawJson);
            var result = doc.RootElement;
            
            if (result.TryGetProperty("IsErroredOnProcessing", out var isErrored) && isErrored.GetBoolean())
            {
                var errMessage = result.TryGetProperty("ErrorMessage", out var msg) ? msg.ToString() : "Erro desconhecido";
                _logger.LogWarning("Erro do Motor OCR {Engine}: {ErrMessage}", engine, errMessage);
                return "";
            }

            if (result.TryGetProperty("ParsedResults", out var parsedResults) && parsedResults.GetArrayLength() > 0)
            {
                var parsedText = parsedResults[0].GetProperty("ParsedText").GetString();
                return parsedText ?? "";
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada OCR Engine {Engine} foi cancelada.", engine);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro OCR Engine {Engine}", engine);
        }
        return "";
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
        var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={_geminiApiKey}";
        var payload = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { temperature = 0.0 }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, geminiUrl);
        request.Content = JsonContent.Create(payload);

        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var geminiJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                return geminiJson.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
            }
            else 
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini falhou na unificação de texto. HTTP {StatusCode}: {Error}", response.StatusCode, err);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada Gemini de unificação cancelada.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro na unificação via Gemini.");
        }
        
        // Em caso de falha, retorna o que tiver mais conteúdo
        return text1.Length > text2.Length ? text1 : text2;
    }

    private async Task<DocumentoExtraidoDto> ExtractStructuredDataAsync(string unifiedText, string documentType, CancellationToken cancellationToken)
    {
        var jsonFormat = @"
        {
            ""tipoIdentificado"": ""classifique estritamente como 'receita', 'exame' ou 'clinico'."",
            ""textoFormatado"": ""O texto cru original do OCR vem sem quebras de linha e muito confuso. Reescreva TODO o texto bruto fornecido de forma idêntica (sem resumir ou inventar), mas APLICANDO espaçamentos, indentação e quebras de linha lógicas para deixá-lo legível para um ser humano. Retorne com as quebras de linha devidamente escapadas para JSON (use \\n)."",
            ""titulo"": ""Título do documento: use o nome do exame ou procedimento principal (ex: 'Radiografia do Cavum', 'Tomografia Computadorizada de Joelho', 'Receita de Amoxicilina'). NUNCA use 'Documento Digitalizado' se houver um exame identificável."",
            ""medico"": ""APENAS o nome completo do médico/profissional que assina ou emite o documento (ex: 'Dr. Tadao Mori', 'Dra. Amanda Lima'). NÃO coloque CRM aqui. Se não houver, deixe vazio."",
            ""crm"": ""Apenas o número do CRM com a UF (ex: '16356 SP'). Procure por 'CRM' seguido de números no texto. NÃO coloque nome aqui."",
            ""clinica"": ""Nome do laboratório, clínica, hospital ou radiologia onde foi realizado (ex: 'Radioclínica Tadao Mori', 'Fleury', 'Delboni'). Se não houver, deixe vazio."",
            ""data"": ""Data do exame/emissão no formato dd/MM/yyyy. Procure por 'Entrada', 'Data', ou data no cabeçalho."",
            ""resumo"": ""Resumo clínico objetivo do laudo/resultado em 1-2 frases."",
            ""diagnostico"": ""Diagnóstico, conclusão médica ou achados principais se houver."",
            ""medicamentos"": [
                { ""nome"": ""nome do remédio"", ""dosagem"": ""dosagem"", ""horario"": ""forma de uso/horário"" }
            ],
            ""conteudoIndentado"": [
                { ""tipo"": ""use 'header', 'keyvalue', 'bullet' ou 'text'"", ""texto"": ""texto da linha"", ""chave"": ""se keyvalue, a chave"", ""valor"": ""se keyvalue, o valor"" }
            ]
        }";

        var prompt = $@"
ATENÇÃO: VOCÊ É UM EXTRATOR DE DADOS DE DOCUMENTOS MÉDICOS BRASILEIROS.
Extraia com MÁXIMA PRECISÃO as informações do texto abaixo.

REGRAS CRÍTICAS:
- 'medico': APENAS o nome do profissional (ex: 'Tadao Mori'). NUNCA inclua 'CRM', números ou siglas.
- 'crm': APENAS os dígitos do CRM (ex: '16356'). Procure explicitamente por 'CRM' no texto.
- 'titulo': use o nome do EXAME/PROCEDIMENTO (ex: 'RADIOGRAFIA DO CAVUM'). Nunca use 'Documento Digitalizado'.
- 'clinica': nome da clínica, hospital ou laboratório (ex: 'Radioclínica Tadao Mori').
- 'data': procure por 'Entrada:' ou 'Data:' no cabeçalho.
- 'conteudoIndentado': CUIDADO COM OCR EM COLUNAS! Muitas vezes o OCR lê primeiro um bloco de chaves (ex: 'Sr(a).', 'Dr(a).', 'Convênio') e DEPOIS um bloco de valores (ex: ': MIGUEL', ': MARCELO', ': AMIL'). Você DEVE ALINHAR CORRETAMENTE: a 1ª chave com o 1º valor (Sr(a) -> MIGUEL), a 2ª chave com o 2º valor, etc. Nunca repita a mesma chave (ex: Convênio) para múltiplos valores distintos!
- Se um campo não existir, retorne string vazia """".

O usuário sugeriu que é um '{documentType}', mas você deve inferir o 'tipoIdentificado' correto.

Texto do documento:
{unifiedText}

Retorne ESTRITAMENTE um JSON no seguinte formato (sem markdown, sem explicações):
{jsonFormat}
";

        var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={_geminiApiKey}";
        var payload = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new
            {
                temperature = 0.0,
                maxOutputTokens = 4096,
                responseMimeType = "application/json"
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, geminiUrl);
        request.Content = JsonContent.Create(payload);

        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var geminiJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                var jsonResult = geminiJson.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
                
                jsonResult = jsonResult.Replace("```json", "").Replace("```", "").Trim();

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                try
                {
                    var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options) ?? new DocumentoExtraidoDto();
                    dto.TextoExtraido = !string.IsNullOrWhiteSpace(dto.TextoFormatado) ? dto.TextoFormatado : unifiedText;
                    return dto;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao deserializar extração via Gemini. JSON: {JsonResult}", jsonResult);
                    _logger.LogWarning("Acionando fallback Groq devido a JSON malformado do Gemini.");
                    return await FallbackToGroqAsync(unifiedText, prompt, cancellationToken);
                }
            }
            else
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini falhou na extração de dados estruturados. HTTP {StatusCode}: {Error}", response.StatusCode, err);
                return await FallbackToGroqAsync(unifiedText, prompt, cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada Gemini de extração cancelada.");
            return await FallbackToGroqAsync(unifiedText, prompt, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro na chamada HTTP para a Gemini.");
            return await FallbackToGroqAsync(unifiedText, prompt, cancellationToken);
        }
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
                model = "llama-3.1-8b-instant",
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
