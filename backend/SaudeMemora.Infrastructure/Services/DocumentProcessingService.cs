using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
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

        foreach (var url in imageUrls)
        {
            var engine1Task = CallOcrSpaceAsync(url, 1, cancellationToken);
            var engine2Task = CallOcrSpaceAsync(url, 2, cancellationToken);
            await Task.WhenAll(engine1Task, engine2Task);
            
            string textEngine1 = engine1Task.Result.Text;
            string textEngine2 = engine2Task.Result.Text;
            
            if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
            {
                if (!engine1Task.Result.Succeeded && !engine2Task.Result.Succeeded) 
                {
                    throw new Exception("Falha na API de OCR ao processar uma das páginas.");
                }
                continue;
            }
                
            string unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);
            allTexts.Add(unifiedText);
        }

        if (allTexts.Count == 0)
        {
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

        var prompt = string.Format(AiPrompts.CarteirinhaPrompt, unifiedText, AiPrompts.CarteirinhaFormat);

        var groqUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        var payload = new
        {
            model = "gemini-3.8-flash",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            max_tokens = 8192,
            reasoning_effort = "low",
            response_format = new { type = "json_object" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        if (!string.IsNullOrWhiteSpace(_geminiApiKey))
            request.Headers.Add("Authorization", $"Bearer {_geminiApiKey}");
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
            _logger.LogError("Gemini falhou na extração de carteirinha. HTTP {StatusCode}: {Error}", response.StatusCode, err);
        }

        return new CarteirinhaExtraidaDto();
    }

    private async Task<OcrCallResult> CallOcrSpaceAsync(string imageUrl, int engine, CancellationToken cancellationToken)
    {
        var encodedUrl = Uri.EscapeDataString(imageUrl);
        var url = $"https://api.ocr.space/parse/imageurl?url={encodedUrl}&ocrengine={engine}&language=por&scale=true&isTable=true";
        
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("apikey", _ocrSpaceApiKey);
            var response = await _httpClient.SendAsync(request, cancellationToken);
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
        var prompt = string.Format(AiPrompts.UnifyPrompt, text1, text2);
        var groqUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        var payload = new
        {
            model = "gemini-3.8-flash",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        if (!string.IsNullOrWhiteSpace(_geminiApiKey))
            request.Headers.Add("Authorization", $"Bearer {_geminiApiKey}");
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
        var docType = (documentType ?? "").ToLower().Trim();
        string prompt;

        if (docType.Contains("receita") || docType.Contains("prescri"))
        {
            prompt = string.Format(AiPrompts.ReceitaPrompt, unifiedText, AiPrompts.JsonSchema);
        }
        else if (docType.Contains("atestado"))
        {
            prompt = string.Format(AiPrompts.AtestadoPrompt, unifiedText, AiPrompts.JsonSchema);
        }
        else if (docType.Contains("laudo") || docType.Contains("relat") || docType.Contains("clinico"))
        {
            prompt = string.Format(AiPrompts.LaudoPrompt, unifiedText, AiPrompts.JsonSchema);
        }
        else if (docType.Contains("exame") || docType.Contains("sangue") || docType.Contains("laborat") || docType.Contains("hemograma") || docType.Contains("bioquim"))
        {
            var textLower = unifiedText.ToLowerInvariant();
            var isImagem = textLower.Contains("raio") || textLower.Contains("ultra") || textLower.Contains("ressonancia") || textLower.Contains("tomografia") || docType.Contains("imagem");

            if (isImagem)
            {
                prompt = string.Format(AiPrompts.ExameImagemPrompt, unifiedText, AiPrompts.JsonSchema);
            }
            else
            {
                prompt = string.Format(AiPrompts.ExameLaboratorialPrompt, unifiedText, AiPrompts.JsonSchema);
            }
        }
        else if (docType.Contains("encaminhamento"))
        {
            prompt = string.Format(AiPrompts.EncaminhamentoPrompt, unifiedText, AiPrompts.JsonSchema);
        }
        else if (docType.Contains("vacina"))
        {
            prompt = string.Format(AiPrompts.VacinaPrompt, unifiedText, AiPrompts.JsonSchema);
        }
        else
        {
            prompt = string.Format(AiPrompts.GenericoPrompt, documentType, unifiedText, AiPrompts.JsonSchema);
        }

        var extractedData = await FallbackToGeminiAsync(unifiedText, prompt, cancellationToken);
        if (string.IsNullOrWhiteSpace(extractedData.Cnes))
            extractedData.Cnes = CnesCodeExtractor.Extract(unifiedText);

        return extractedData;
    }



    private async Task<DocumentoExtraidoDto> FallbackToGeminiAsync(string unifiedText, string prompt, CancellationToken cancellationToken)
    {
        var groqKey = _geminiApiKey;
        if (string.IsNullOrWhiteSpace(groqKey))
        {
            _logger.LogWarning("Chave GROQ_API_KEY não encontrada. Usando modo de segurança string.");
            var fallbackDto = ParseFallback(unifiedText);
            fallbackDto.RevisaoPendente = true;
            return fallbackDto;
        }

        var groqUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        var payload = new
        {
            model = "gemini-3.8-flash",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            max_tokens = 8192,
            reasoning_effort = "low",
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
            
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            options.Converters.Add(new FlexibleBooleanConverter());
            var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options) ?? new DocumentoExtraidoDto();
            dto.TextoExtraido = !string.IsNullOrWhiteSpace(dto.TextoFormatado) ? dto.TextoFormatado : unifiedText;
            _logger.LogInformation("Extração estruturada realizada com sucesso via fallback Gemini (Flash).");
            return dto;
        }
        else
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Gemini falhou no fallback. HTTP {StatusCode}: {Error}", response.StatusCode, err);
            
            if (!string.IsNullOrWhiteSpace(_groqApiKey))
            {
                _logger.LogInformation("Tentando extração estruturada via fallback Groq.");
                try 
                {
                    var groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
                    var groqPayload = new
                    {
                        model = "llama3-8b-8192",
                        messages = new[] { new { role = "user", content = prompt } },
                        temperature = 0.0,
                        response_format = new { type = "json_object" }
                    };
                    
                    var groqRequest = new HttpRequestMessage(HttpMethod.Post, groqApiUrl);
                    groqRequest.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
                    groqRequest.Content = JsonContent.Create(groqPayload);
                    
                    var groqResponse = await _httpClient.SendAsync(groqRequest, cancellationToken);
                    if (groqResponse.IsSuccessStatusCode)
                    {
                        var groqJson = await groqResponse.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                        var jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
                        jsonResult = jsonResult.Replace("```json", "").Replace("```", "").Trim();
                        
                        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        options.Converters.Add(new FlexibleBooleanConverter());
                        var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options) ?? new DocumentoExtraidoDto();
                        dto.TextoExtraido = !string.IsNullOrWhiteSpace(dto.TextoFormatado) ? dto.TextoFormatado : unifiedText;
                        _logger.LogInformation("Extração estruturada realizada com sucesso via fallback Groq.");
                        return dto;
                    }
                    else 
                    {
                        var groqErr = await groqResponse.Content.ReadAsStringAsync(cancellationToken);
                        _logger.LogError("Groq falhou no fallback. HTTP {StatusCode}: {Error}", groqResponse.StatusCode, groqErr);
                    }
                } 
                catch (Exception groqEx) 
                {
                    _logger.LogError(groqEx, "Erro na chamada do Groq.");
                }
            }
            
            _logger.LogWarning("Retornando fallback básico devido à falha da API.");
            var fallbackDto = ParseFallback(unifiedText);
            fallbackDto.RevisaoPendente = true;
            
            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests || err.Contains("Quota exceeded") || err.Contains("RESOURCE_EXHAUSTED"))
            {
                fallbackDto.Resumo = "Aviso: A API de inteligência artificial está com alto volume de uso/esgotada no momento. Os dados abaixo foram extraídos apenas via OCR.";
            }
            else
            {
                fallbackDto.Resumo = "Aviso: Falha na extração de IA. Os dados abaixo foram extraídos apenas via OCR.";
            }
            
            return fallbackDto;
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

public class FlexibleBooleanConverter : System.Text.Json.Serialization.JsonConverter<bool>
{
    public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString()?.ToLowerInvariant();
            if (str == "true" || str == "1" || str == "yes" || str == "sim" || str == "verdadeiro" || str == "s") return true;
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
