using System.Globalization;
using Microsoft.Extensions.Configuration;

namespace SaudeMemora.Infrastructure.Services;

public static class AiCostEstimator
{
    public static decimal? Estimate(
        IConfiguration configuration,
        string provider,
        int? inputTokens,
        int? outputTokens)
    {
        if (inputTokens is null || outputTokens is null)
            return null;

        var isGemini = provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase);
        var prefix = isGemini ? "GEMINI" : "GROQ";
        var section = isGemini ? "Gemini" : "Groq";
        var inputPrice = ReadPrice(configuration, $"{prefix}_INPUT_PRICE_PER_MILLION", $"{section}:InputPricePerMillion");
        var outputPrice = ReadPrice(configuration, $"{prefix}_OUTPUT_PRICE_PER_MILLION", $"{section}:OutputPricePerMillion");
        if (inputPrice is null || outputPrice is null)
            return null;

        return Math.Round(((inputTokens.Value * inputPrice.Value) + (outputTokens.Value * outputPrice.Value)) / 1_000_000m, 8);
    }

    private static decimal? ReadPrice(IConfiguration configuration, string name, string configurationKey)
    {
        var raw = Environment.GetEnvironmentVariable(name) ?? configuration[name] ?? configuration[configurationKey];
        return decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out var price) && price >= 0
            ? price
            : null;
    }
}
