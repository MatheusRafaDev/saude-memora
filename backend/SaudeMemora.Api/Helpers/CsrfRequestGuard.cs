namespace SaudeMemora.Api.Helpers;

public static class CsrfRequestGuard
{
    public const string HeaderName = "X-Requested-With";
    public const string HeaderValue = "XMLHttpRequest";

    public static bool IsValid(string method, string? headerValue)
    {
        if (method.Equals("GET", StringComparison.OrdinalIgnoreCase)
            || method.Equals("HEAD", StringComparison.OrdinalIgnoreCase)
            || method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(headerValue, HeaderValue, StringComparison.Ordinal);
    }
}