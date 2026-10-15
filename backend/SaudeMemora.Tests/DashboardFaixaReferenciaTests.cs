using SaudeMemora.Api.Endpoints;

namespace SaudeMemora.Tests;

/// <summary>
/// A Visão geral marca resultados de exames como "fora da faixa" a partir dos limites de
/// referência extraídos do próprio documento. Marcar um valor como alterado sem base seria
/// pior do que não marcar, então a regra é conservadora por decisão explícita.
/// </summary>
public class DashboardFaixaReferenciaTests
{
    [Theory]
    [InlineData(5, 10, 20, true)]    // abaixo do mínimo
    [InlineData(30, 10, 20, true)]   // acima do máximo
    [InlineData(10, 10, 20, false)]  // no limite inferior, dentro da faixa
    [InlineData(20, 10, 20, false)]  // no limite superior, dentro da faixa
    [InlineData(15, 10, 20, false)]  // dentro
    public void EstaForaDaFaixa_ComparaComOsDoisLimites(double valor, double refMin, double refMax, bool esperado)
    {
        Assert.Equal(esperado, DashboardEndpoints.EstaForaDaFaixa(valor, refMin, refMax));
    }

    [Fact]
    public void EstaForaDaFaixa_SemValorNumerico_NaoAfirmaNada()
    {
        // Sem valor extraído não há como afirmar que está alterado.
        Assert.False(DashboardEndpoints.EstaForaDaFaixa(null, 10, 20));
    }

    [Fact]
    public void EstaForaDaFaixa_SemFaixaDeReferencia_NaoAfirmaNada()
    {
        Assert.False(DashboardEndpoints.EstaForaDaFaixa(999, null, null));
    }

    [Fact]
    public void EstaForaDaFaixa_ComApenasLimiteInferior()
    {
        Assert.True(DashboardEndpoints.EstaForaDaFaixa(4, 10, null));
        Assert.False(DashboardEndpoints.EstaForaDaFaixa(40, 10, null));
    }

    [Fact]
    public void EstaForaDaFaixa_ComApenasLimiteSuperior()
    {
        Assert.True(DashboardEndpoints.EstaForaDaFaixa(40, null, 10));
        Assert.False(DashboardEndpoints.EstaForaDaFaixa(4, null, 10));
    }

    [Fact]
    public void EstaForaDaFaixa_FaixaInvertida_NaoMarcaComoAlterado()
    {
        // Dado inconsistente (mínimo maior que o máximo) não deve gerar alarme falso
        // para todo valor: a validação de entrada bloqueia esse caso na escrita.
        var resultado = DashboardEndpoints.EstaForaDaFaixa(15, 20, 10);

        Assert.False(resultado);
    }
}
