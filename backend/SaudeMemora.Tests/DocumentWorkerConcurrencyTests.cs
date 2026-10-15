using SaudeMemora.Api.Workers;

namespace SaudeMemora.Tests;

/// <summary>
/// A vazão do worker era de um documento por instância. Agora é configurável,
/// com padrão 3 e teto 16 para não saturar MongoDB e os provedores de IA.
/// </summary>
public class DocumentWorkerConcurrencyTests
{
    [Fact]
    public void ResolverConcorrencia_UsaPadraoQuandoNaoConfigurado()
    {
        var anterior = Environment.GetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY");
        try
        {
            Environment.SetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY", null);

            Assert.Equal(3, DocumentProcessingWorker.ResolverConcorrencia());
        }
        finally
        {
            Environment.SetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY", anterior);
        }
    }

    [Theory]
    [InlineData("1", 1)]
    [InlineData("8", 8)]
    [InlineData("16", 16)]
    public void ResolverConcorrencia_RespeitaValorConfigurado(string configurado, int esperado)
    {
        var anterior = Environment.GetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY");
        try
        {
            Environment.SetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY", configurado);

            Assert.Equal(esperado, DocumentProcessingWorker.ResolverConcorrencia());
        }
        finally
        {
            Environment.SetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY", anterior);
        }
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-4")]
    [InlineData("999")]
    [InlineData("abc")]
    [InlineData("")]
    public void ResolverConcorrencia_RecusaValoresInvalidos(string configurado)
    {
        var anterior = Environment.GetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY");
        try
        {
            Environment.SetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY", configurado);

            Assert.Equal(3, DocumentProcessingWorker.ResolverConcorrencia());
        }
        finally
        {
            Environment.SetEnvironmentVariable("DOCUMENT_WORKER_CONCURRENCY", anterior);
        }
    }
}
