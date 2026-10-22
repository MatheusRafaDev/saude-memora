using System.Net.Http.Json;
using System.Diagnostics;
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
    private const string GeminiModel = "gemini-3.8-flash";
    private const string GroqModel = "qwen/qwen3.8-27b";

    /// <summary>Tempo máximo por tentativa de OCR (imagem pode ser grande).</summary>
    private static readonly TimeSpan TimeoutOcr = TimeSpan.FromSeconds(45);

    /// <summary>Tempo máximo por tentativa de chamada de IA (unificação e extração).</summary>
    private static readonly TimeSpan TimeoutIa = TimeSpan.FromSeconds(60);

    private readonly HttpClient _httpClient;
    private readonly ResilientHttpSender _sender;
    private readonly string? _ocrSpaceApiKey;
    private readonly string? _geminiApiKey;
    private readonly string? _groqApiKey;
    private readonly string? _geminiModel;
    private readonly string? _groqModel;
    private readonly IConfiguration _configuration;

    private readonly ILogger<DocumentProcessingService> _logger;

    public DocumentProcessingService(
        HttpClient httpClient,
        ResilientHttpSender sender,
        IConfiguration config,
        ILogger<DocumentProcessingService> logger)
    {
        _httpClient = httpClient;
        _sender = sender;
        _ocrSpaceApiKey = Environment.GetEnvironmentVariable("OCR_SPACE_API_KEY") ?? config["OcrSpace:ApiKey"];
        _geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? config["Gemini:ApiKey"];
        _groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? config["Groq:ApiKey"];
        _geminiModel = GeminiModel;
        _groqModel = GroqModel;
        _configuration = config;

        _logger = logger;
    }

    private string GetGeminiModel() => !string.IsNullOrWhiteSpace(_geminiModel)
        ? _geminiModel
        : "gemini-3.8-flash";

    public async Task<DocumentoExtraidoDto> ExtractDocumentDataAsync(string imageUrl, string documentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey))
        {
            throw new Exception("Falta a chave OCR_SPACE_API_KEY. Configure-a no ambiente do servidor.");
        }

        // 1. Chamar os dois motores do OCR.space em paralelo
        var engine1Task = CallOcrSpaceAsync(imageUrl, 1, cancellationToken);
        var engine2Task = CallOcrSpaceAsync(imageUrl, 2, cancellationToken);

        var resultados = await Task.WhenAll(engine1Task, engine2Task);

        string textEngine1 = (resultados[0].Text ?? "").Trim();
        string textEngine2 = (resultados[1].Text ?? "").Trim();

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
        {
            if (resultados[0].Succeeded || resultados[1].Succeeded)
                throw new InvalidDocumentException(); // OCR funcionou, mas a imagem não tem texto legível
            throw new Exception("Nenhum texto encontrado pela OCR.space em nenhum dos motores.");
        }

        // 2. Unificar textos: se apenas um motor teve sucesso ou ambos trouxeram o mesmo texto, evita chamada desnecessária à IA
        string unifiedText;
        if (string.IsNullOrWhiteSpace(textEngine1))
        {
            unifiedText = textEngine2;
        }
        else if (string.IsNullOrWhiteSpace(textEngine2) || string.Equals(textEngine1, textEngine2, StringComparison.OrdinalIgnoreCase))
        {
            unifiedText = textEngine1;
        }
        else
        {
            unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);
        }

        // 3. Extrair dados estruturados
        return await ExtractStructuredDataAsync(unifiedText, documentType, cancellationToken);
    }

    public async Task<DocumentoExtraidoDto> ExtractMultipleDocumentsDataAsync(List<string> imageUrls, string documentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey))
            throw new Exception("Falta a chave OCR_SPACE_API_KEY. Configure-a no ambiente do servidor.");

        var allTexts = new List<string>();

        foreach (var url in imageUrls)
        {
            var engine1Task = CallOcrSpaceAsync(url, 1, cancellationToken);
            var engine2Task = CallOcrSpaceAsync(url, 2, cancellationToken);
            var resultados = await Task.WhenAll(engine1Task, engine2Task);

            string textEngine1 = (resultados[0].Text ?? "").Trim();
            string textEngine2 = (resultados[1].Text ?? "").Trim();

            if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
            {
                if (!resultados[0].Succeeded && !resultados[1].Succeeded)
                {
                    throw new Exception("Falha na API de OCR ao processar uma das páginas.");
                }
                continue;
            }

            string unifiedText;
            if (string.IsNullOrWhiteSpace(textEngine1))
            {
                unifiedText = textEngine2;
            }
            else if (string.IsNullOrWhiteSpace(textEngine2) || string.Equals(textEngine1, textEngine2, StringComparison.OrdinalIgnoreCase))
            {
                unifiedText = textEngine1;
            }
            else
            {
                unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);
            }

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
        var resultadosCarteirinha = await Task.WhenAll(engine1Task, engine2Task);

        string textEngine1 = resultadosCarteirinha[0].Text;
        string textEngine2 = resultadosCarteirinha[1].Text;

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
            return new CarteirinhaExtraidaDto();

        string unifiedText = await UnifyTextsWithGeminiAsync(textEngine1, textEngine2, cancellationToken);

        var prompt = AiPrompts.ProtectUntrustedSource(
            string.Format(AiPrompts.CarteirinhaPrompt, unifiedText, AiPrompts.CarteirinhaFormat));

        var groqUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        var payload = new
        {
            model = GetGeminiModel(),
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            max_tokens = 8192,
            reasoning_effort = "low",
            response_format = new { type = "json_object" }
        };

        var response = await _sender.SendAsync(
            _httpClient,
            () =>
            {
                var req = new HttpRequestMessage(HttpMethod.Post, groqUrl);
                if (!string.IsNullOrWhiteSpace(_geminiApiKey))
                    req.Headers.Add("Authorization", $"Bearer {_geminiApiKey}");
                req.Content = JsonContent.Create(payload);
                return req;
            },
            "Gemini (carteirinha)",
            TimeoutIa,
            cancellationToken);

        if (response is null)
        {
            return new CarteirinhaExtraidaDto();
        }

        using (response)
        {
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
                    _logger.LogWarning("Could not parse the structured health card response. FailureType={FailureType}.", ex.GetType().Name);
                }
            }
            else
            {
                _logger.LogWarning("Gemini card extraction failed. HTTP {StatusCode}.", (int)response.StatusCode);
            }
        }

        return new CarteirinhaExtraidaDto();
    }

    private async Task<OcrCallResult> CallOcrSpaceAsync(string imageUrl, int engine, CancellationToken cancellationToken)
    {
        var encodedUrl = Uri.EscapeDataString(imageUrl);
        var url = $"https://api.ocr.space/parse/imageurl?url={encodedUrl}&ocrengine={engine}&language=por&scale=true&isTable=true";

        try
        {
            var response = await _sender.SendAsync(
                _httpClient,
                () =>
                {
                    var request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.Add("apikey", _ocrSpaceApiKey);
                    return request;
                },
                $"OCR.Space (engine {engine})",
                TimeoutOcr,
                cancellationToken);

            if (response is null)
            {
                return new OcrCallResult("", false);
            }

            using (response)
            {
                var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("OCR provider request failed. HTTP {StatusCode}.", (int)response.StatusCode);
                    return new OcrCallResult("", false);
                }

                using var doc = JsonDocument.Parse(rawJson);
                var result = doc.RootElement;

                if (result.TryGetProperty("IsErroredOnProcessing", out var isErrored) && isErrored.GetBoolean())
                {
                    _logger.LogWarning("OCR engine returned an error. Engine={Engine}.", engine);
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
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada OCR Engine {Engine} foi cancelada.", engine);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("OCR request failed. Engine={Engine} FailureType={FailureType}.", engine, ex.GetType().Name);
        }
        return new OcrCallResult("", false);
    }

    private async Task<string> UnifyTextsWithGeminiAsync(string text1, string text2, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(text1)) return text2 ?? "";
        if (string.IsNullOrWhiteSpace(text2)) return text1 ?? "";
        if (string.Equals(text1.Trim(), text2.Trim(), StringComparison.OrdinalIgnoreCase)) return text1;

        if (string.IsNullOrWhiteSpace(_geminiApiKey))
            return text1.Length > text2.Length ? text1 : text2;

        var prompt = AiPrompts.ProtectUntrustedSource(string.Format(AiPrompts.UnifyPrompt, text1, text2));
        var groqUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        var payload = new
        {
            model = GetGeminiModel(),
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0
        };

        try
        {
            var response = await _sender.SendAsync(
                _httpClient,
                () =>
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, groqUrl);
                    if (!string.IsNullOrWhiteSpace(_geminiApiKey))
                        req.Headers.Add("Authorization", $"Bearer {_geminiApiKey}");
                    req.Content = JsonContent.Create(payload);
                    return req;
                },
                "Gemini (unificação)",
                TimeoutIa,
                cancellationToken);

            if (response is null)
            {
                return text1.Length > text2.Length ? text1 : text2;
            }

            using (response)
            {
                if (response.IsSuccessStatusCode)
                {
                    var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                    return groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
                }

                _logger.LogWarning("Gemini text unification failed. HTTP {StatusCode}.", (int)response.StatusCode);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Chamada Gemini de unificação cancelada.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Gemini text unification failed. FailureType={FailureType}.", ex.GetType().Name);
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

        prompt = AiPrompts.ProtectUntrustedSource(prompt);
        var extractedData = await FallbackToGeminiThenGroqAsync(unifiedText, prompt, cancellationToken);
        if (string.IsNullOrWhiteSpace(extractedData.Cnes))
            extractedData.Cnes = CnesCodeExtractor.Extract(unifiedText);

        return extractedData;
    }



    private async Task<DocumentoExtraidoDto> FallbackToGeminiThenGroqAsync(string unifiedText, string prompt, CancellationToken cancellationToken)
    {
        var gemini = await TryExtractWithProviderAsync(
            "Gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            _geminiApiKey, _geminiModel, prompt, unifiedText, cancellationToken, isGemini: true);
        if (gemini is not null) return gemini;

        var groq = await TryExtractWithProviderAsync(
            "Groq", "https://api.groq.com/openai/v1/chat/completions",
            _groqApiKey, _groqModel, prompt, unifiedText, cancellationToken, isGemini: false);
        if (groq is not null) return groq;

        _logger.LogWarning("Structured extraction providers were unavailable or returned invalid data; using OCR fallback.");
        var fallback = ParseFallback(unifiedText);
        fallback.RevisaoPendente = true;
        fallback.Resumo = "Aviso: não foi possível validar a extração estruturada. Os dados abaixo foram extraídos apenas via OCR e precisam de revisão.";
        return fallback;
    }

    private async Task<DocumentoExtraidoDto?> TryExtractWithProviderAsync(
        string provider,
        string url,
        string? apiKey,
        string? model,
        string prompt,
        string sourceText,
        CancellationToken cancellationToken,
        bool isGemini)
    {
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(model))
            return null;

        var payload = new
        {
            model,
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            max_tokens = 8192,
            response_format = new { type = "json_object" }
        };

        var stopwatch = Stopwatch.StartNew();
        var estimatedInputTokens = (int)Math.Ceiling((prompt.Length + 500) / 3d);
        try
        {
            using var response = await _sender.SendAsync(
                _httpClient,
                () =>
                {
                    var request = new HttpRequestMessage(HttpMethod.Post, url);
                    request.Headers.Add("Authorization", $"Bearer {apiKey}");
                    request.Content = JsonContent.Create(payload);
                    return request;
                },
                $"{provider} (extração)",
                TimeoutIa,
                cancellationToken);

            if (response is null)
            {
                stopwatch.Stop();
                AiModelMetrics.Record("document_extraction", provider, model, "circuit_open", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning("{Provider} extraction was skipped by the circuit breaker.", provider);
                return null;
            }

            if (!response.IsSuccessStatusCode)
            {
                stopwatch.Stop();
                AiModelMetrics.Record("document_extraction", provider, model, "http_error", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning("{Provider} extraction failed. HTTP {StatusCode}.", provider, (int)response.StatusCode);
                return null;
            }

            var providerResponse = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            var jsonResult = providerResponse.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrWhiteSpace(jsonResult) || jsonResult.Length > 60000)
            {
                stopwatch.Stop();
                AiModelMetrics.Record("document_extraction", provider, model, "invalid_response", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning("{Provider} extraction returned empty or oversized output.", provider);
                return null;
            }

            jsonResult = jsonResult.Replace("```json", "", StringComparison.OrdinalIgnoreCase)
                .Replace("```", "", StringComparison.Ordinal).Trim();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            options.Converters.Add(new FlexibleBooleanConverter());
            var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options);
            if (!IsValidExtraction(dto))
            {
                stopwatch.Stop();
                AiModelMetrics.Record("document_extraction", provider, model, "invalid_response", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning("{Provider} extraction did not satisfy the document data contract.", provider);
                return null;
            }

            dto!.TextoExtraido = !string.IsNullOrWhiteSpace(dto.TextoFormatado) ? dto.TextoFormatado : sourceText;
            stopwatch.Stop();
            var inputTokens = ReadTokenCount(providerResponse, "prompt_tokens");
            var outputTokens = ReadTokenCount(providerResponse, "completion_tokens");
            var estimatedCost = AiCostEstimator.Estimate(_configuration, provider, inputTokens, outputTokens);
            AiModelMetrics.Record(
                "document_extraction", provider, model, "success", stopwatch.Elapsed.TotalMilliseconds,
                inputTokens, outputTokens, estimatedCost);
            _logger.LogInformation(
                "Structured extraction completed. Provider={Provider} Model={Model} DurationMs={DurationMs} EstimatedInputTokens={EstimatedInputTokens} InputTokens={InputTokens} OutputTokens={OutputTokens} EstimatedCostUsd={EstimatedCostUsd} PromptVersion={PromptVersion} Fallback={Fallback}",
                provider, model, stopwatch.ElapsedMilliseconds, estimatedInputTokens, inputTokens, outputTokens,
                estimatedCost, AiPrompts.ExtractionPromptVersion, !isGemini);
            return dto;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            stopwatch.Stop();
            AiModelMetrics.Record("document_extraction", provider, model, "cancelled", stopwatch.Elapsed.TotalMilliseconds);
            throw;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            AiModelMetrics.Record("document_extraction", provider, model, "provider_error", stopwatch.Elapsed.TotalMilliseconds);
            _logger.LogWarning("{Provider} extraction failed. FailureType={FailureType}.", provider, ex.GetType().Name);
            return null;
        }
    }

    private static bool IsValidExtraction(DocumentoExtraidoDto? dto)
    {
        if (dto is null) return false;
        if (dto.Medicamentos is null || dto.ResultadosExame is null || dto.ConteudoIndentado is null || dto.Confiancas is null)
            return false;
        if (dto.Medicamentos.Count > 100 || dto.ResultadosExame.Count > 500
            || dto.ConteudoIndentado.Count > 500 || dto.Confiancas.Count > 500)
            return false;
        if (new[]
            {
                dto.Titulo, dto.Medico, dto.Clinica, dto.Data, dto.Resumo, dto.Diagnostico,
                dto.Crm, dto.Cid, dto.Cnes, dto.NomeExame, dto.TipoExame, dto.Resultado,
                dto.Especialidade, dto.TipoClinico, dto.Conteudo, dto.Conclusoes, dto.Observacoes,
                dto.TextoFormatado
            }.Any(value => value is { Length: > 20000 }))
            return false;
        if (dto.Medicamentos.Any(item => item is null || item.Nome is null || item.Dosagem is null || item.Horario is null
            || item.Nome.Length > 500 || item.Dosagem.Length > 500 || item.Horario.Length > 1000))
            return false;
        if (dto.Confiancas.Any(item => item is null || !double.IsFinite(item.Valor) || item.Valor is < 0 or > 1))
            return false;
        if (!dto.DocumentoValido)
            return true;

        var anyExtractedData = !string.IsNullOrWhiteSpace(dto.Titulo)
            || !string.IsNullOrWhiteSpace(dto.Resumo)
            || !string.IsNullOrWhiteSpace(dto.TextoFormatado)
            || dto.Medicamentos.Count > 0
            || dto.ResultadosExame.Count > 0
            || dto.ConteudoIndentado.Count > 0;
        return anyExtractedData
            && new[] { "exame", "receita", "laudo", "atestado", "encaminhamento", "vacina", "clinico" }
                .Contains(dto.TipoIdentificado, StringComparer.OrdinalIgnoreCase);
    }

    private static int? ReadTokenCount(JsonElement response, string fieldName) =>
        response.TryGetProperty("usage", out var usage)
        && usage.TryGetProperty(fieldName, out var value)
        && value.TryGetInt32(out var tokens)
            ? tokens
            : null;

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
                dto.Crm = new string(l.Where(char.IsDigit).ToArray());
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
