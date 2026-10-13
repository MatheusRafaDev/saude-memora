using SaudeMemora.Api.Helpers;

namespace SaudeMemora.Tests;

public class CsrfRequestGuardTests
{
    [Theory]
    [InlineData("GET")]
    [InlineData("HEAD")]
    [InlineData("OPTIONS")]
    public void IsValid_AllowsSafeMethodsWithoutHeader(string method)
    {
        Assert.True(CsrfRequestGuard.IsValid(method, null));
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("PATCH")]
    [InlineData("DELETE")]
    public void IsValid_RejectsMutationWithoutExpectedHeader(string method)
    {
        Assert.False(CsrfRequestGuard.IsValid(method, null));
        Assert.False(CsrfRequestGuard.IsValid(method, "other"));
        Assert.True(CsrfRequestGuard.IsValid(method, CsrfRequestGuard.HeaderValue));
    }
}