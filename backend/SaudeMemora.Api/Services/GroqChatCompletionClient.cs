using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Api.Services;

public sealed class GroqChatCompletionClient : IChatCompletionClient
{
    private const string ProviderName = "Groq";
    private const string BaseUrl = "https://api.groq.com/openai/v1/";
    // Model selection belongs to the application code, not deployment settings.
    public const string DefaultModel = "llama-3.1-8b-instant";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ResilientHttpSender _sender;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GroqChatCompletionClient> _logger;

    public GroqChatCompletionClient(
        IHttpClientFactory httpClientFactory,
        ResilientHttpSender sender,
        IConfiguration configuration,
        ILogger<GroqChatCompletionClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _sender = sender;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ChatCompletionResult> CompleteAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken)
    {
        var apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY")
            ?? Environment.GetEnvironmentVariable("GROQ_KEY")
            ?? _configuration["GROQ_API_KEY"]
            ?? _configuration["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ChatProviderException("GROQ_API_KEY is not configured. Configure a variável GROQ_API_KEY no arquivo .env ou no servidor.");

        var payload = CreatePayload(request);
        var serializedPayload = JsonSerializer.Serialize(payload);
        var estimatedInputTokens = EstimateTokens(serializedPayload.Length);
        if (estimatedInputTokens > request.MaxInputTokens)
            throw new ChatContextBudgetExceededException(estimatedInputTokens, request.MaxInputTokens);

        using var client = _httpClientFactory.CreateClient();
        client.Timeout = Timeout.InfiniteTimeSpan;
        client.BaseAddress = new Uri(BaseUrl);
        var stopwatch = Stopwatch.StartNew();

        HttpResponseMessage? response;
        try
        {
            response = await _sender.SendAsync(
                client,
                () =>
                {
                    var message = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
                    {
                        Content = new StringContent(serializedPayload, Encoding.UTF8, "application/json")
                    };
                    message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                    message.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    return message;
                },
                ProviderName,
                TimeSpan.FromSeconds(25),
                cancellationToken,
                maxTentativas: 2);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            AiModelMetrics.Record("chat", ProviderName, request.Model, "cancelled", stopwatch.Elapsed.TotalMilliseconds);
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or TimeoutException)
        {
            AiModelMetrics.Record("chat", ProviderName, request.Model, "transport_error", stopwatch.Elapsed.TotalMilliseconds);
            _logger.LogWarning(
                "AI request failed. Provider={Provider} Model={Model} CorrelationId={CorrelationId} FailureType={FailureType}",
                ProviderName, request.Model, request.CorrelationId, ex.GetType().Name);
            throw new ChatProviderException("The AI provider could not complete the request.", innerException: ex);
        }

        if (response is null)
        {
            AiModelMetrics.Record("chat", ProviderName, request.Model, "circuit_open", stopwatch.Elapsed.TotalMilliseconds);
            _logger.LogWarning(
                "AI request skipped by circuit breaker. Provider={Provider} Model={Model} CorrelationId={CorrelationId}",
                ProviderName, request.Model, request.CorrelationId);
            throw new ChatProviderException("The AI provider circuit breaker is open.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                stopwatch.Stop();
                AiModelMetrics.Record("chat", ProviderName, request.Model, "http_error", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning(
                    "AI request returned an error. Provider={Provider} Model={Model} StatusCode={StatusCode} DurationMs={DurationMs} CorrelationId={CorrelationId}",
                    ProviderName, request.Model, (int)response.StatusCode, stopwatch.ElapsedMilliseconds, request.CorrelationId);
                throw new ChatProviderException("The AI provider rejected or could not complete the request.", (int)response.StatusCode);
            }

            try
            {
                await using var body = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var json = await JsonDocument.ParseAsync(body, cancellationToken: cancellationToken);
                var result = ParseResponse(json.RootElement);
                stopwatch.Stop();
                var estimatedCost = AiCostEstimator.Estimate(
                    _configuration, ProviderName, result.Usage.PromptTokens, result.Usage.CompletionTokens);
                AiModelMetrics.Record(
                    "chat", ProviderName, request.Model, "success", stopwatch.Elapsed.TotalMilliseconds,
                    result.Usage.PromptTokens, result.Usage.CompletionTokens, estimatedCost);
                _logger.LogInformation(
                    "AI request completed. Provider={Provider} Model={Model} DurationMs={DurationMs} InputTokens={InputTokens} OutputTokens={OutputTokens} TotalTokens={TotalTokens} EstimatedCostUsd={EstimatedCostUsd} CorrelationId={CorrelationId}",
                    ProviderName, request.Model, stopwatch.ElapsedMilliseconds, result.Usage.PromptTokens,
                    result.Usage.CompletionTokens, result.Usage.TotalTokens, estimatedCost, request.CorrelationId);
                return result;
            }
            catch (JsonException ex)
            {
                AiModelMetrics.Record("chat", ProviderName, request.Model, "invalid_response", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning(
                    "AI provider returned invalid JSON. Provider={Provider} Model={Model} CorrelationId={CorrelationId}",
                    ProviderName, request.Model, request.CorrelationId);
                throw new ChatProviderException("The AI provider returned an invalid response.", (int)response.StatusCode, ex);
            }
            catch (InvalidDataException ex)
            {
                AiModelMetrics.Record("chat", ProviderName, request.Model, "invalid_response", stopwatch.Elapsed.TotalMilliseconds);
                _logger.LogWarning(
                    "AI provider returned an unexpected response shape. Provider={Provider} Model={Model} CorrelationId={CorrelationId}",
                    ProviderName, request.Model, request.CorrelationId);
                throw new ChatProviderException("The AI provider returned an unexpected response.", (int)response.StatusCode, ex);
            }
        }
    }

    internal static int EstimateTokens(int characterCount) => (int)Math.Ceiling(characterCount / 3d);

    private static object CreatePayload(ChatCompletionRequest request)
    {
        var messages = request.Messages.Select(message =>
        {
            var mapped = new Dictionary<string, object?>
            {
                ["role"] = message.Role,
                ["content"] = message.Content
            };

            if (message.ToolCallId is not null)
                mapped["tool_call_id"] = message.ToolCallId;

            if (message.ToolCalls is not null)
            {
                mapped["tool_calls"] = message.ToolCalls.Select(call => new
                {
                    id = call.Id,
                    type = "function",
                    function = new { name = call.Name, arguments = call.Arguments }
                }).ToArray();
            }

            return mapped;
        }).ToArray();

        var payload = new Dictionary<string, object?>
        {
            ["model"] = request.Model,
            ["messages"] = messages,
            ["temperature"] = 0.2,
            ["max_tokens"] = request.MaxOutputTokens,
        };

        if (request.EnableTools)
        {
            payload["tools"] = PatientChatTools.Definitions;
            payload["tool_choice"] = "auto";
        }
        else
        {
            payload["response_format"] = new { type = "json_object" };
        }

        return payload;
    }

    private static ChatCompletionResult ParseResponse(JsonElement root)
    {
        if (!root.TryGetProperty("choices", out var choices)
            || choices.ValueKind != JsonValueKind.Array
            || choices.GetArrayLength() == 0
            || !choices[0].TryGetProperty("message", out var message))
            throw new InvalidDataException("Missing completion choice.");

        string? content = null;
        if (message.TryGetProperty("content", out var contentElement)
            && contentElement.ValueKind == JsonValueKind.String)
            content = contentElement.GetString();
        else if (contentElement.ValueKind is not (JsonValueKind.Null or JsonValueKind.Undefined))
            throw new InvalidDataException("Completion content must be a string or null.");

        var calls = new List<ChatToolCall>();
        if (message.TryGetProperty("tool_calls", out var toolCallsElement))
        {
            if (toolCallsElement.ValueKind != JsonValueKind.Array || toolCallsElement.GetArrayLength() > 8)
                throw new InvalidDataException("Invalid tool call list.");

            foreach (var item in toolCallsElement.EnumerateArray())
            {
                var id = item.GetProperty("id").GetString();
                var function = item.GetProperty("function");
                var name = function.GetProperty("name").GetString();
                var arguments = function.GetProperty("arguments").GetString();
                if (string.IsNullOrWhiteSpace(id) || id.Length > 128
                    || string.IsNullOrWhiteSpace(name) || name.Length > 100
                    || arguments is null || arguments.Length > 4096)
                    throw new InvalidDataException("Invalid tool call data.");
                calls.Add(new ChatToolCall(id, name, arguments));
            }
        }

        var usage = root.TryGetProperty("usage", out var usageElement)
            ? new ChatUsage(ReadInt(usageElement, "prompt_tokens"), ReadInt(usageElement, "completion_tokens"), ReadInt(usageElement, "total_tokens"))
            : new ChatUsage(null, null, null);

        return new ChatCompletionResult(content, calls, usage);
    }

    private static int? ReadInt(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.TryGetInt32(out var number) ? number : null;
}
