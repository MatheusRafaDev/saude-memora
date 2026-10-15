using SaudeMemora.Api.Endpoints;

namespace SaudeMemora.Tests;

/// <summary>
/// O token de emergência dá acesso anônimo a dados clínicos e viaja em URL/QR code.
/// A validade padrão caiu de 7 dias para 12 horas.
/// </summary>
public class EmergenciaTokenValidadeTests
{
    private const int HorasPadrao = 12;
    private const int HorasMaximas = 24 * 7;

    [Fact]
    public void ResolverHorasValidade_UsaPadraoQuandoNaoConfigurado()
    {
        var anterior = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO");
        try
        {
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", null);

            Assert.Equal(HorasPadrao, EmergenciaEndpoints.ResolverHorasValidade(HorasPadrao, HorasMaximas));
        }
        finally
        {
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", anterior);
        }
    }

    [Theory]
    [InlineData("1", 1)]
    [InlineData("6", 6)]
    [InlineData("168", 168)]
    public void ResolverHorasValidade_RespeitaValorDentroDoLimite(string configurado, int esperado)
    {
        var anterior = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO");
        try
        {
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", configurado);

            Assert.Equal(esperado, EmergenciaEndpoints.ResolverHorasValidade(HorasPadrao, HorasMaximas));
        }
        finally
        {
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", anterior);
        }
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("169")]
    [InlineData("99999")]
    [InlineData("sete")]
    [InlineData("")]
    public void ResolverHorasValidade_RecusaValoresForaDoLimite(string configurado)
    {
        var anterior = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO");
        try
        {
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", configurado);

            Assert.Equal(HorasPadrao, EmergenciaEndpoints.ResolverHorasValidade(HorasPadrao, HorasMaximas));
        }
        finally
        {
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", anterior);
        }
    }

    [Fact]
    public void ResolverHorasValidade_NaoAceitaConfiguracaoQueAmpliaAlemDoTeto()
    {
        var anterior = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO");
        try
        {
            // Um valor absurdo não deve virar uma janela de exposição enorme.
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", "8760");

            var horas = EmergenciaEndpoints.ResolverHorasValidade(HorasPadrao, HorasMaximas);

            Assert.Equal(HorasPadrao, horas);
            Assert.True(horas <= HorasMaximas);
        }
        finally
        {
            Environment.SetEnvironmentVariable("EMERGENCIA_TOKEN_HORAS_EXPIRACAO", anterior);
        }
    }
}
