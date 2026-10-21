using System.Diagnostics.Metrics;

namespace SaudeMemora.Infrastructure.Services;

/// <summary>
/// Low-cardinality provider metrics. No patient, document, prompt, or response values
/// are accepted as tags.
/// </summary>
public static class AiModelMetrics
{
    private static readonly Meter Meter = new("SaudeMemora.AI", "1.0.0");
    private static readonly Counter<long> Requests = Meter.CreateCounter<long>("saudememora.ai.requests");
    private static readonly Histogram<double> Duration = Meter.CreateHistogram<double>("saudememora.ai.duration", "ms");
    private static readonly Counter<long> InputTokens = Meter.CreateCounter<long>("saudememora.ai.input_tokens", "token");
    private static readonly Counter<long> OutputTokens = Meter.CreateCounter<long>("saudememora.ai.output_tokens", "token");
    private static readonly Counter<double> EstimatedCost = Meter.CreateCounter<double>("saudememora.ai.estimated_cost", "USD");

    public static void Record(
        string operation,
        string provider,
        string model,
        string outcome,
        double durationMs,
        int? inputTokens = null,
        int? outputTokens = null,
        decimal? estimatedCostUsd = null)
    {
        KeyValuePair<string, object?>[] tags =
        [
            new("operation", operation),
            new("provider", provider),
            new("model", model),
            new("outcome", outcome)
        ];

        Requests.Add(1, tags);
        Duration.Record(durationMs, tags);
        if (inputTokens is > 0) InputTokens.Add(inputTokens.Value, tags);
        if (outputTokens is > 0) OutputTokens.Add(outputTokens.Value, tags);
        if (estimatedCostUsd is >= 0) EstimatedCost.Add((double)estimatedCostUsd.Value, tags);
    }
}
