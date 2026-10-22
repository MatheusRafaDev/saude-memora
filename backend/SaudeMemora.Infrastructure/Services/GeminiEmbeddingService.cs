using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

public class GeminiEmbeddingService : IEmbeddingService
{
    private const string DefaultModel = "gemini-embedding-2";
    private readonly string? _apiKey;
    private readonly string _modelName;
    private readonly HttpClient _httpClient;
    private readonly ResilientHttpSender _sender;
    private readonly ILogger<GeminiEmbeddingService> _logger;

    public string ModelName => _modelName;

    public GeminiEmbeddingService(
        HttpClient httpClient,
        ResilientHttpSender sender,
        IConfiguration config,
        ILogger<GeminiEmbeddingService> logger)
    {
        _httpClient = httpClient;
        _sender = sender;
        _logger = logger;
        _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? config["Gemini:ApiKey"];
        _modelName = DefaultModel;
    }

    public async Task<float[]?> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var results = await GenerateEmbeddingsBatchAsync([text], cancellationToken);
        return results.Count > 0 ? results[0] : null;
    }

    public async Task<IReadOnlyList<float[]>> GenerateEmbeddingsBatchAsync(
        IReadOnlyList<string> texts,
        CancellationToken cancellationToken = default)
    {
        var validTexts = texts.Where(t => !string.IsNullOrWhiteSpace(t)).ToList();
        if (string.IsNullOrWhiteSpace(_apiKey) || validTexts.Count == 0)
        {
            return Array.Empty<float[]>();
        }

        var modelPath = $"models/{_modelName}";
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var requests = validTexts.Select(t => new
            {
                model = modelPath,
                content = new { parts = new[] { new { text = t } } }
            }).ToArray();

            var requestBody = new { requests };
            var jsonPayload = JsonSerializer.Serialize(requestBody);

            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/{modelPath}:batchEmbedContents?key={_apiKey}";

            var response = await _sender.SendAsync(
                _httpClient,
                () => new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
                },
                provedor: "GeminiEmbeddings",
                timeoutPorTentativa: TimeSpan.FromSeconds(15),
                cancellationToken: cancellationToken,
                maxTentativas: 2);

            stopwatch.Stop();

            if (response == null || !response.IsSuccessStatusCode)
            {
                var statusCode = response?.StatusCode.ToString() ?? "NoResponse";
                var providerDetail = response is null
                    ? null
                    : await response.Content.ReadAsStringAsync(cancellationToken);
                AiModelMetrics.Record("embedding", "Gemini", _modelName, "failure", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning(
                    "Gemini embeddings batch request failed. Model={Model} StatusCode={StatusCode} ProviderDetail={ProviderDetail}",
                    _modelName, statusCode, FormatProviderDetail(providerDetail));
                return Array.Empty<float[]>();
            }

            var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(contentStream, cancellationToken: cancellationToken);

            if (!doc.RootElement.TryGetProperty("embeddings", out var embeddingsElement) || embeddingsElement.ValueKind != JsonValueKind.Array)
            {
                AiModelMetrics.Record("embedding", "Gemini", _modelName, "invalid_contract", stopwatch.Elapsed.TotalMilliseconds);
                return Array.Empty<float[]>();
            }

            var embeddingsList = new List<float[]>();
            foreach (var item in embeddingsElement.EnumerateArray())
            {
                if (item.TryGetProperty("values", out var valuesElement) && valuesElement.ValueKind == JsonValueKind.Array)
                {
                    var vector = new List<float>();
                    foreach (var val in valuesElement.EnumerateArray())
                    {
                        if (val.TryGetSingle(out var f))
                            vector.Add(f);
                    }
                    embeddingsList.Add(vector.ToArray());
                }
            }

            AiModelMetrics.Record("embedding", "Gemini", _modelName, "success", stopwatch.Elapsed.TotalMilliseconds);
            return embeddingsList;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            AiModelMetrics.Record("embedding", "Gemini", _modelName, "exception", stopwatch.Elapsed.TotalMilliseconds);
            _logger.LogWarning("Failed to generate Gemini embeddings. FailureType={FailureType}", ex.GetType().Name);
            return Array.Empty<float[]>();
        }
    }

    private static string FormatProviderDetail(string? value)
    {
        var normalized = string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        return normalized.Length <= 1000 ? normalized : normalized[..1000];
    }
}
