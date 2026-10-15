namespace SaudeMemora.Api.Helpers;

public static class CorsSettings
{
    /// <summary>Partes de uma origem CORS já validadas.</summary>
    private readonly record struct Origem(string Scheme, string Host, int Port);

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

    /// <summary>
    /// Lê padrões de origem com curinga, usados para hosts dinâmicos (ex.: previews).
    /// O curinga precisa ser o <b>primeiro rótulo inteiro</b> do host e ser seguido por um
    /// domínio concreto com ao menos três rótulos — assim <c>https://*.preview.exemplo.com</c>
    /// é aceito, enquanto <c>*</c> e <c>https://*.vercel.app</c> são rejeitados por serem
    /// amplos demais para uso com credenciais.
    /// </summary>
    public static string[] ParseAllowedOriginPatterns(string? configuredValue)
    {
        if (string.IsNullOrWhiteSpace(configuredValue))
            return Array.Empty<string>();

        return configuredValue
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(pattern => pattern.Trim())
            .Where(IsValidPattern)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public static bool MatchesAnyPattern(string? origin, IEnumerable<string> patterns)
    {
        // A origem vem do header Origin, então não contém curinga: Uri é suficiente.
        if (string.IsNullOrWhiteSpace(origin) || !Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
            return false;

        foreach (var pattern in patterns)
        {
            if (!TryParseOrigem(pattern, out var patternUri))
                continue;

            if (!string.Equals(originUri.Scheme, patternUri.Scheme, StringComparison.OrdinalIgnoreCase))
                continue;

            if (originUri.Port != patternUri.Port)
                continue;

            if (!HostMatchesPattern(originUri.Host, patternUri.Host))
                continue;

            return true;
        }

        return false;
    }

    private static bool HostMatchesPattern(string host, string patternHost)
    {
        if (patternHost.StartsWith("*.", StringComparison.Ordinal))
        {
            var suffix = patternHost[1..]; // ".meu-time.vercel.app"
            if (!host.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
                return false;

            // Exige exatamente um rótulo antes do sufixo, para que o próprio domínio do
            // time não seja aceito e para que "a.b-time..." não escape do padrão.
            var rotulo = host[..^suffix.Length];
            return rotulo.Length > 0 && !rotulo.Contains('.');
        }

        return string.Equals(host, patternHost, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsValidPattern(string pattern)
    {
        if (!TryParseOrigem(pattern, out var origem))
            return false;

        if (origem.Host.Contains('*'))
        {
            // O único formato aceito é um curinga como rótulo inteiro no início do host.
            // Qualquer outro uso do caractere (ex.: "app-*-time.exemplo.com") é rejeitado,
            // porque abriria espaço para correspondências inesperadas.
            if (!origem.Host.StartsWith("*.", StringComparison.Ordinal)
                || origem.Host.Count(c => c == '*') != 1)
            {
                return false;
            }

            // Padrão com curinga: o host concreto precisa ter rótulos suficientes para
            // identificar um dono. "*.meu-time.vercel.app" (3 rótulos) é aceitável;
            // "*.vercel.app" (2 rótulos) cobriria toda a plataforma e é rejeitado.
            var hostConcretoComCuringa = origem.Host[2..];
            var rotulosComCuringa = hostConcretoComCuringa.Split('.', StringSplitOptions.RemoveEmptyEntries);
            return rotulosComCuringa.Length >= 3;
        }

        // Origem exata: basta um domínio com dois rótulos (ex.: exemplo.com.br).
        var rotulos = origem.Host.Split('.', StringSplitOptions.RemoveEmptyEntries);
        return rotulos.Length >= 2;
    }

    /// <summary>
    /// Interpreta o padrão sem usar <see cref="Uri"/>, porque <c>Uri</c> descarta o
    /// caractere <c>*</c> do host — o que silenciosamente transformaria
    /// <c>https://app-*-time.vercel.app</c> em <c>https://app--time.vercel.app</c>.
    /// </summary>
    private static bool TryParseOrigem(string? valor, out Origem origem)
    {
        origem = default;

        if (string.IsNullOrWhiteSpace(valor)) return false;

        var texto = valor.Trim();

        var separadorEsquema = texto.IndexOf("://", StringComparison.Ordinal);
        if (separadorEsquema <= 0) return false;

        var scheme = texto[..separadorEsquema];
        if (!string.Equals(scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return false;

        var resto = texto[(separadorEsquema + 3)..];

        // Sem caminho, sem query, sem fragmento: apenas host e porta opcional.
        if (resto.Length == 0) return false;
        if (resto.Contains('/') || resto.Contains('?') || resto.Contains('#')) return false;

        // Porta: apenas dígitos após o último ':' — evita confundir com IPv6, que não suportamos aqui.
        var host = resto;
        var porta = string.Equals(scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) ? 443 : 80;

        var separadorPorta = resto.LastIndexOf(':');
        if (separadorPorta >= 0)
        {
            host = resto[..separadorPorta];
            var portaTexto = resto[(separadorPorta + 1)..];
            if (!int.TryParse(portaTexto, out var portaInformada) || portaInformada < 1 || portaInformada > 65535)
                return false;

            porta = portaInformada;
        }

        if (string.IsNullOrWhiteSpace(host)) return false;
        if (host.Contains(' ') || host.Contains('\\')) return false;

        origem = new Origem(scheme.ToLowerInvariant(), host.ToLowerInvariant(), porta);
        return true;
    }
}
