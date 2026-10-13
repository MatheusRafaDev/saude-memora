using Microsoft.AspNetCore.Http;

namespace SaudeMemora.Api.Helpers;

public static class NetworkHelpers
{
    public static string GetIpKey(HttpContext ctx)
    {
        var ip = ctx.Connection.RemoteIpAddress;
        if (ip == null) return "anon";
        if (ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
        
        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            var bytes = ip.GetAddressBytes();
            return $"{bytes[0]:x2}{bytes[1]:x2}:{bytes[2]:x2}{bytes[3]:x2}:{bytes[4]:x2}{bytes[5]:x2}::/48";
        }
        return ip.ToString();
    }

    public static string GetTruncatedIp(HttpContext ctx)
    {
        var ip = ctx.Connection.RemoteIpAddress;
        if (ip == null) return "Unknown";
        if (ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();

        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            var bytes = ip.GetAddressBytes();
            return $"{bytes[0]}.{bytes[1]}.{bytes[2]}.***";
        }
        else if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            var bytes = ip.GetAddressBytes();
            for (int i = 6; i < 16; i++) bytes[i] = 0;
            return new System.Net.IPAddress(bytes).ToString();
        }
        return "Unknown";
    }
}
