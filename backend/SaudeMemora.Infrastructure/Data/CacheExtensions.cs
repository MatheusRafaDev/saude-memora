using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace SaudeMemora.Infrastructure.Data
{
    public static class DistributedCacheExtensions
    {
        public static async Task<string?> SafeGetStringAsync(this IDistributedCache cache, string key, CancellationToken ct = default)
        {
            try { return await cache.GetStringAsync(key, ct); } catch { return null; }
        }
        public static async Task SafeSetStringAsync(this IDistributedCache cache, string key, string value, DistributedCacheEntryOptions options, CancellationToken ct = default)
        {
            try { await cache.SetStringAsync(key, value, options, ct); } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
        }
        public static async Task SafeRemoveAsync(this IDistributedCache cache, string key, CancellationToken ct = default)
        {
            try { await cache.RemoveAsync(key, ct); } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
        }
    }
}
