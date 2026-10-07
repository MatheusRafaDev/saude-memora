namespace SaudeMemora.Api.Helpers;

public static class CorsSettings
{
    public static string[] ParseAllowedOrigins(string? configuredValue)
    {
        if (string.IsNullOrWhiteSpace(configuredValue))
            return Array.Empty<string>();

        var parsed = configuredValue
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(origin => origin.Trim())
            .Where(origin => !string.IsNullOrWhiteSpace(origin) && !origin.Equals("*", StringComparison.Ordinal))
            .Where(origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    return false;

                return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
            })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return parsed;
    }
}
