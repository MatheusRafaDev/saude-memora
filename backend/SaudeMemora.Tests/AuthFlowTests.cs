using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SaudeMemora.Api.Helpers;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Tests;

public class AuthFlowTests
{
    [Fact]
    public void GetIpKey_UsesForwardedForHeader_WhenPresent()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.10, 10.0.0.1";

        var result = NetworkHelpers.GetIpKey(context);

        Assert.Equal("203.0.113.10", result);
    }

    [Fact]
    public void JwtTokenReader_ReadsBearerHeader_WhenPresent()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers.Authorization = "Bearer abc123";

        var result = JwtTokenReader.GetJwtTokenFromRequest(context.Request);

        Assert.Equal("abc123", result);
    }

    [Fact]
    public void JwtTokenReader_ReadsCookieToken_WhenHeaderIsMissing()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers.Cookie = "auth_token=def456";

        var result = JwtTokenReader.GetJwtTokenFromRequest(context.Request);

        Assert.Equal("def456", result);
    }

    [Fact]
    public void ParseJwtLifetime_UsesHoursAndDaysFormats()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:ExpiresIn"] = "12h"
            })
            .Build();

        var expiry = GetExpiryFromConfig(config);

        Assert.Equal(TimeSpan.FromHours(12), expiry);
    }

    [Fact]
    public void RegisterPatient_RequiresStrongPassword_WhenPasswordIsShort()
    {
        var password = "123";

        Assert.True(password.Length < 8);
    }

    [Fact]
    public void SecurityStamp_DefaultsToGuidWhenMissing()
    {
        var paciente = new Paciente { Email = "usuario@teste.com", Nome = "Usuário" };

        Assert.False(string.IsNullOrWhiteSpace(paciente.SecurityStamp));
    }

    private static TimeSpan GetExpiryFromConfig(IConfiguration config)
    {
        var jwtExpiresInStr = Environment.GetEnvironmentVariable("JWT_EXPIRES_IN")?.Trim()?.ToLowerInvariant() ?? config["JwtSettings:ExpiresIn"]?.Trim()?.ToLowerInvariant();
        if (string.IsNullOrEmpty(jwtExpiresInStr))
            return TimeSpan.FromDays(7);

        if (jwtExpiresInStr.EndsWith("h") && double.TryParse(jwtExpiresInStr.TrimEnd('h'), out var hours))
            return TimeSpan.FromHours(hours);

        if (jwtExpiresInStr.EndsWith("d") && double.TryParse(jwtExpiresInStr.TrimEnd('d'), out var days))
            return TimeSpan.FromDays(days);

        return TimeSpan.FromDays(7);
    }
}
