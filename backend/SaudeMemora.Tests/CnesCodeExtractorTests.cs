using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Tests;

public sealed class CnesCodeExtractorTests
{
    [Theory]
    [InlineData("CNES: 1234567", "1234567")]
    [InlineData("CNES nº 1.234.567", "1234567")]
    [InlineData("Cadastro Nacional de Estabelecimentos de Saúde: 7654321", "7654321")]
    public void Extract_ExtraiCodigoCNESExplicitamenteIdentificado(string text, string expected)
    {
        Assert.Equal(expected, CnesCodeExtractor.Extract(text));
    }

    [Theory]
    [InlineData("CRM: 1234567")]
    [InlineData("CNES: 12345678")]
    [InlineData("CNES não informado")]
    public void Extract_NaoConfundeOutrosNumerosOuCodigosInvalidos(string text)
    {
        Assert.Empty(CnesCodeExtractor.Extract(text));
    }
}
