using SaudeMemora.Api.Helpers;

namespace SaudeMemora.Tests;

public class CorsSettingsTests
{
    [Fact]
    public void ParseAllowedOrigins_RejectsWildcardFallbackAndEmptyValues()
    {
        var result = CorsSettings.ParseAllowedOrigins(",, , ");

        Assert.Empty(result);
    }

    [Fact]
    public void ParseAllowedOrigins_KeepOnlySafeOrigins()
    {
        var result = CorsSettings.ParseAllowedOrigins("https://app.example.com, http://localhost:5173, *, https:// ");

        Assert.Equal(new[] { "https://app.example.com", "http://localhost:5173" }, result);
    }

    [Fact]
    public void ParseAllowedOrigins_RejectsMalformedOrigins()
    {
        var result = CorsSettings.ParseAllowedOrigins("not-a-url, ftp://example.com, https://app.example.com");

        Assert.Equal(new[] { "https://app.example.com" }, result);
    }
}
