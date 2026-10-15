using SaudeMemora.Api.Helpers;

namespace SaudeMemora.Tests;

/// <summary>
/// Cobertura do endurecimento de CORS: o curinga amplo (*.vercel.app) foi removido
/// porque, com AllowCredentials, qualquer aplicação publicada na Vercel poderia
/// chamar a API em nome do usuário logado. Agora cada host dinâmico precisa ser
/// declarado explicitamente em CORS_ALLOWED_ORIGIN_PATTERNS.
/// </summary>
public class CorsOriginPatternTests
{
    [Fact]
    public void ParseAllowedOriginPatterns_RejectsOverlyBroadWildcards()
    {
        // "*" e "https://*.vercel.app" não são aceitos: permitiriam qualquer subdomínio
        // de terceiros sob um domínio que não pertence ao projeto.
        var result = CorsSettings.ParseAllowedOriginPatterns("*, *.vercel.app, https://*.vercel.app, *");

        Assert.Empty(result);
    }

    [Fact]
    public void ParseAllowedOriginPatterns_RejectsBareWildcardEntriesWithoutScheme()
    {
        // Sem esquema não é uma origem válida.
        var result = CorsSettings.ParseAllowedOriginPatterns("*.preview.exemplo.com");

        Assert.Empty(result);
    }

    [Fact]
    public void ParseAllowedOriginPatterns_AcceptsWildcardLabelFollowedByConcreteDomain()
    {
        // O curinga precisa ser um rótulo inteiro: "*.preview.exemplo.com".
        var result = CorsSettings.ParseAllowedOriginPatterns(
            "https://*.preview.exemplo.com, https://app.exemplo.com");

        Assert.Equal(2, result.Length);
        Assert.Contains("https://*.preview.exemplo.com", result);
        Assert.Contains("https://app.exemplo.com", result);
    }

    [Fact]
    public void ParseAllowedOriginPatterns_RejectsWildcardInsideLabel()
    {
        // "app-*-time.exemplo.com" é ambíguo: o curinga não ocupa um rótulo inteiro.
        var result = CorsSettings.ParseAllowedOriginPatterns("https://app-*-time.exemplo.com");

        Assert.Empty(result);
    }

    [Fact]
    public void ParseAllowedOriginPatterns_RejectsInvalidSchemeAndPath()
    {
        var result = CorsSettings.ParseAllowedOriginPatterns(
            "not-a-url, ftp://app.exemplo.com, https://app.exemplo.com/caminho, http://localhost");

        Assert.Empty(result);
    }

    [Fact]
    public void MatchesAnyPattern_MatchesSingleSubdomainLabel()
    {
        var patterns = CorsSettings.ParseAllowedOriginPatterns("https://*.preview.exemplo.com");

        Assert.True(CorsSettings.MatchesAnyPattern("https://pr-42.preview.exemplo.com", patterns));
    }

    [Fact]
    public void MatchesAnyPattern_RejectsUnrelatedHost()
    {
        var patterns = CorsSettings.ParseAllowedOriginPatterns("https://*.preview.exemplo.com");

        // Domínio não relacionado não pode ser aceito.
        Assert.False(CorsSettings.MatchesAnyPattern("https://app-malicioso.exemplo.com", patterns));
        // O domínio base (sem o rótulo de preview) também não.
        Assert.False(CorsSettings.MatchesAnyPattern("https://preview.exemplo.com", patterns));
        // Esquema diferente não corresponde ao padrão.
        Assert.False(CorsSettings.MatchesAnyPattern("http://pr-1.preview.exemplo.com", patterns));
        // Porta diferente não corresponde.
        Assert.False(CorsSettings.MatchesAnyPattern("https://pr-1.preview.exemplo.com:8443", patterns));
    }

    [Fact]
    public void MatchesAnyPattern_RejectsMultiLabelSuffixInjection()
    {
        var patterns = CorsSettings.ParseAllowedOriginPatterns("https://*.preview.exemplo.com");

        // O curinga cobre exatamente um rótulo.
        Assert.False(CorsSettings.MatchesAnyPattern("https://a.b.preview.exemplo.com", patterns));
        Assert.True(CorsSettings.MatchesAnyPattern("https://a.preview.exemplo.com", patterns));
    }

    [Fact]
    public void MatchesAnyPattern_WithoutPatterns_NothingMatches()
    {
        var patterns = CorsSettings.ParseAllowedOriginPatterns(null);

        Assert.Empty(patterns);
        Assert.False(CorsSettings.MatchesAnyPattern("https://qualquer.vercel.app", patterns));
    }
}
