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
    private readonly string? _groqApiKey;
    private readonly ILogger<DocumentProcessingService> _logger;

    public DocumentProcessingService(HttpClient httpClient, IConfiguration config, ILogger<DocumentProcessingService> logger)
    {
        _httpClient = httpClient;
        _ocrSpaceApiKey = Environment.GetEnvironmentVariable("OCR_SPACE_API_KEY") ?? config["OcrSpace:ApiKey"];
        _groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? config["Groq:ApiKey"];
        _logger = logger;
    }

    public async Task<DocumentoExtraidoDto> ExtractDocumentDataAsync(string imageUrl, string documentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_groqApiKey))
        {
            throw new Exception("Faltam chaves de API (OCR_SPACE_API_KEY ou GROQ_API_KEY). Configure no .env.");
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

        // 2. Unificar textos com a Groq
        string unifiedText = await UnifyTextsWithGroqAsync(textEngine1, textEngine2, cancellationToken);

        // 3. Extrair dados estruturados
        return await ExtractStructuredDataAsync(unifiedText, documentType, cancellationToken);
    }

    public async Task<DocumentoExtraidoDto> ExtractMultipleDocumentsDataAsync(List<string> imageUrls, string documentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_groqApiKey))
            throw new Exception("Faltam chaves de API (OCR_SPACE_API_KEY ou GROQ_API_KEY). Configure no .env.");

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
                
            string unifiedText = await UnifyTextsWithGroqAsync(textEngine1, textEngine2, cancellationToken);
            allTexts.Add(unifiedText);
        }

        if (allTexts.Count == 0)
            throw new Exception("Nenhum texto encontrado em nenhuma das imagens enviadas.");

        string finalUnifiedText = string.Join("\n\n--- PRÓXIMA PÁGINA/IMAGEM ---\n\n", allTexts);

        return await ExtractStructuredDataAsync(finalUnifiedText, documentType, cancellationToken);
    }

    public async Task<CarteirinhaExtraidaDto> ExtractCarteirinhaDataAsync(string imageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_groqApiKey))
            return new CarteirinhaExtraidaDto();

        var engine1Task = CallOcrSpaceAsync(imageUrl, 1, cancellationToken);
        var engine2Task = CallOcrSpaceAsync(imageUrl, 2, cancellationToken);
        await Task.WhenAll(engine1Task, engine2Task);
        
        string textEngine1 = engine1Task.Result;
        string textEngine2 = engine2Task.Result;

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
            return new CarteirinhaExtraidaDto();

        string unifiedText = await UnifyTextsWithGroqAsync(textEngine1, textEngine2, cancellationToken);

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
            model = "llama-3.1-70b-versatile",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            response_format = new { type = "json_object" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        request.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            var jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
            
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
            _logger.LogError("Groq falhou na extração de carteirinha. HTTP {StatusCode}: {Error}", response.StatusCode, err);
        }

        return new CarteirinhaExtraidaDto();
    }

    private async Task<string> CallOcrSpaceAsync(string imageUrl, int engine, CancellationToken cancellationToken)
    {
        var encodedUrl = Uri.EscapeDataString(imageUrl);
        var url = $"https://api.ocr.space/parse/imageurl?apikey={_ocrSpaceApiKey}&url={encodedUrl}&ocrengine={engine}&language=por";
        
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

    private async Task<string> UnifyTextsWithGroqAsync(string text1, string text2, CancellationToken cancellationToken)
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
            model = "llama-3.1-70b-versatile",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
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
        var jsonFormat = @"
        {
            ""tipoIdentificado"": ""analise o documento e classifique estritamente como 'receita', 'exame' ou 'clinico'. Pedido médico, receita ou prescrição é 'receita'. Laudo de exame ou resultado laboratorial é 'exame'. Atestados, relatórios ou outros são 'clinico'."",
            ""titulo"": ""Título principal do documento (ex: Receita da Dra. Amanda, Hemograma Completo, etc)"",
            ""medico"": ""Nome do médico se houver"",
            ""clinica"": ""Laboratório ou clínica se houver"",
            ""data"": ""Data legível no formato dd/MM/yyyy"",
            ""resumo"": ""Resumo do documento clínico/resultado"",
            ""diagnostico"": ""Diagnóstico, CID ou conclusão médica se houver"",
            ""medicamentos"": [
                { ""nome"": ""nome do remédio"", ""dosagem"": ""dosagem"", ""horario"": ""forma de uso/horário"" }
            ],
            ""conteudoIndentado"": [
                { ""tipo"": ""use 'header' (para seções/títulos), 'keyvalue' (para campos como Nome: João), 'bullet' (itens de lista) ou 'text' (texto corrido)"", ""texto"": ""texto completo da linha estruturada"", ""chave"": ""se for keyvalue, qual a chave"", ""valor"": ""se for keyvalue, qual o valor"" }
            ]
        }";

        var prompt = $@"
ATENÇÃO: VOCÊ É UM EXTRATOR DE DADOS DE TEXTO ESTRUTURADOS.
Extraia as informações do texto unificado abaixo. O usuário sugeriu que é um '{documentType}', mas você deve inferir o 'tipoIdentificado' correto.
Identifique blocos de texto e converta em um 'conteudoIndentado' lógico para ser lido no frontend.
Se não achar algum campo, retorne string vazia """".

Texto unificado:
{unifiedText}

Retorne ESTRITAMENTE um JSON no seguinte formato:
{jsonFormat}
";

        var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
        var payload = new
        {
            model = "llama-3.1-70b-versatile",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            response_format = new { type = "json_object" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        request.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
        request.Content = JsonContent.Create(payload);

        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                var jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
                
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                try
                {
                    var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options) ?? new DocumentoExtraidoDto();
                    dto.TextoExtraido = unifiedText;
                    return dto;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao deserializar extração. JSON: {JsonResult}", jsonResult);
                    return new DocumentoExtraidoDto { TextoExtraido = unifiedText, Resumo = $"Erro de conversão (JSON): {ex.Message}" };
                }
            }
            else
            {
                var err = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Groq falhou na extração de dados estruturados. HTTP {StatusCode}: {Error}", response.StatusCode, err);
                return new DocumentoExtraidoDto { TextoExtraido = unifiedText, Resumo = $"Erro na API da IA (Groq): {response.StatusCode} - {err}" };
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada Groq de extração cancelada.");
            return new DocumentoExtraidoDto { TextoExtraido = unifiedText, Resumo = "Extração cancelada pelo usuário." };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro na chamada HTTP para a Groq.");
            return new DocumentoExtraidoDto { TextoExtraido = unifiedText, Resumo = "Falha ao extrair dados estruturados." };
        }
    }
}
