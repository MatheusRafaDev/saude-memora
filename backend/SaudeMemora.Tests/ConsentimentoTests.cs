using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Tests;

public class ConsentimentoTests
{
    [Fact]
    public void LegacyConsent_GrantsBothPurposesUntilExplicitlyChanged()
    {
        var consent = new ConsentimentoIa
        {
            Aceito = true,
            VersaoTermo = ConsentimentoIa.VersaoTermoAtual
        };

        Assert.True(consent.HasOcrConsent());
        Assert.True(consent.HasChatConsent());
    }

    [Fact]
    public void ExplicitPurposeConsentOverridesLegacyValueIndependently()
    {
        var consent = new ConsentimentoIa
        {
            Aceito = true,
            VersaoTermo = ConsentimentoIa.VersaoTermoAtual,
            Ocr = new ConsentimentoFinalidade
            {
                Aceito = false,
                VersaoTermo = ConsentimentoIa.VersaoTermoAtual
            }
        };

        Assert.False(consent.HasOcrConsent());
        Assert.True(consent.HasChatConsent());
    }

    [Fact]
    public void ShouldShowPromptAfterDeferralExpiresOrTermsChange()
    {
        var now = DateTime.UtcNow;
        var consent = new ConsentimentoIa
        {
            DispensadoAte = now.AddDays(7),
            VersaoDispensada = ConsentimentoIa.VersaoTermoAtual
        };

        Assert.False(consent.ShouldShowPrompt(now));
        Assert.True(consent.ShouldShowPrompt(now.AddDays(8)));

        consent.DispensadoAte = now.AddDays(7);
        consent.VersaoDispensada = "old-version";
        Assert.True(consent.ShouldShowPrompt(now));
    }
}