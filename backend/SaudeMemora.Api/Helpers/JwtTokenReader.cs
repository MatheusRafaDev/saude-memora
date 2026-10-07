using Microsoft.AspNetCore.Http;

namespace SaudeMemora.Api.Helpers;

public static class JwtTokenReader
{
    public static string? GetJwtTokenFromRequest(HttpRequest request)
    {
        var authHeader = request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authHeader["Bearer ".Length..].Trim();
        }

        var cookieToken = request.Cookies["auth_token"];
        if (!string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken;
        }

        return null;
    }
}
