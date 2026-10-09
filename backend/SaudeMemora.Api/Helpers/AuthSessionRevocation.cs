using Microsoft.Extensions.Caching.Distributed;
using SaudeMemora.Domain.Interfaces;
namespace SaudeMemora.Api.Helpers;

public static class AuthSessionRevocation
{
    public static async Task<bool> RevokeAsync(
        string userId,
        string tokenStamp,
        IPacienteRepository repository,
        IDistributedCache cache,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(tokenStamp))
        {
            return false;
        }

        var revokedStamp = Guid.NewGuid().ToString("N");
        if (!await repository.TryUpdateSecurityStampAsync(userId, tokenStamp, revokedStamp))
        {
            return false;
        }

        await cache.SetStringAsync(
            $"secstamp_{userId}",
            revokedStamp,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60)
            },
            cancellationToken);

        return true;
    }
}
