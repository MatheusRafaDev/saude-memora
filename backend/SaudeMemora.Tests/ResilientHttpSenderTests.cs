using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Tests;

/// <summary>
/// O pipeline de IA encadeia três provedores externos por documento. Antes, um 429/5xx
/// ou timeout consumia a tentativa do documento; agora há retentativa com backoff.
/// </summary>
public class ResilientHttpSenderTests
{
    private static ResilientHttpSender CriarSender() =>
        new(NullLogger<ResilientHttpSender>.Instance, new CircuitBreakerRegistry());

    [Fact]
    public async Task SendAsync_RetentaEmErroTransitorioEDevolveSucesso()
    {
        var tentativas = 0;
        var handler = new StubHandler(_ =>
        {
            tentativas++;
            if (tentativas < 3)
            {
                return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);
            }

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("ok")
            };
        });

        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://provedor.example.com/") };
        var sender = CriarSender();

        var resposta = await sender.SendAsync(
            client,
            () => new HttpRequestMessage(HttpMethod.Get, "https://provedor.example.com/recurso"),
            "Provedor",
            TimeSpan.FromSeconds(5),
            CancellationToken.None);

        Assert.NotNull(resposta);
        Assert.True(resposta!.IsSuccessStatusCode);
        Assert.Equal(3, tentativas);
    }

    [Fact]
    public async Task SendAsync_NaoRetentaEmErroPermanente()
    {
        var tentativas = 0;
        var handler = new StubHandler(_ =>
        {
            tentativas++;
            return new HttpResponseMessage(HttpStatusCode.BadRequest);
        });

        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://provedor.example.com/") };
        var sender = CriarSender();

        var resposta = await sender.SendAsync(
            client,
            () => new HttpRequestMessage(HttpMethod.Get, "https://provedor.example.com/recurso"),
            "Provedor",
            TimeSpan.FromSeconds(5),
            CancellationToken.None);

        Assert.NotNull(resposta);
        Assert.Equal(HttpStatusCode.BadRequest, resposta!.StatusCode);
        // 400 é erro do pedido: repetir não ajudaria.
        Assert.Equal(1, tentativas);
    }

    [Fact]
    public async Task SendAsync_AbreCircuitoAposFalhasConsecutivas()
    {
        var breaker = new CircuitBreakerRegistry();
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.InternalServerError));
        var sender = new ResilientHttpSender(NullLogger<ResilientHttpSender>.Instance, breaker);

        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://provedor.example.com/") };

        // Cada chamada gasta maxTentativas (3) e registra uma falha no circuito.
        // O limite é 5, então são necessárias 5 chamadas malsucedidas.
        for (var i = 0; i < CircuitBreakerRegistry.LimiteFalhas; i++)
        {
            await sender.SendAsync(
                client,
                () => new HttpRequestMessage(HttpMethod.Get, "https://provedor.example.com/recurso"),
                "Provedor",
                TimeSpan.FromSeconds(5),
                CancellationToken.None);
        }

        Assert.True(breaker.EstaAberto("provedor.example.com", out var restante));
        Assert.True(restante > TimeSpan.Zero);

        // Com o circuito aberto, a requisição nem é enviada.
        var enviosAntes = handler.Contagem;
        var resposta = await sender.SendAsync(
            client,
            () => new HttpRequestMessage(HttpMethod.Get, "https://provedor.example.com/recurso"),
            "Provedor",
            TimeSpan.FromSeconds(5),
            CancellationToken.None);

        Assert.Null(resposta);
        Assert.Equal(enviosAntes, handler.Contagem);
    }

    [Fact]
    public async Task SendAsync_CircuitoNaoAbreEmErroPermanenteDoCliente()
    {
        var breaker = new CircuitBreakerRegistry();
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.BadRequest));
        var sender = new ResilientHttpSender(NullLogger<ResilientHttpSender>.Instance, breaker);

        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://provedor.example.com/") };

        for (var i = 0; i < CircuitBreakerRegistry.LimiteFalhas + 2; i++)
        {
            await sender.SendAsync(
                client,
                () => new HttpRequestMessage(HttpMethod.Get, "https://provedor.example.com/recurso"),
                "Provedor",
                TimeSpan.FromSeconds(5),
                CancellationToken.None);
        }

        // 400 é erro do pedido: não indica indisponibilidade do provedor.
        Assert.False(breaker.EstaAberto("provedor.example.com", out _));
    }

    [Fact]
    public async Task SendAsync_AbortaQuandoTimeoutPorTentativaExpira()
    {
        var handler = new StubHandler(async _ =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30));
            return new HttpResponseMessage(HttpStatusCode.OK);
        });

        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://provedor.example.com/") };
        var sender = CriarSender();

        // Timeout curto por tentativa; o envio deve falhar rápido em vez de esperar 30s.
        var excecao = await Assert.ThrowsAnyAsync<Exception>(() => sender.SendAsync(
            client,
            () => new HttpRequestMessage(HttpMethod.Get, "https://provedor.example.com/recurso"),
            "Provedor",
            TimeSpan.FromMilliseconds(200),
            CancellationToken.None,
            maxTentativas: 1));

        Assert.IsType<TimeoutException>(excecao);
    }

    [Fact]
    public async Task SendAsync_PropagaCancelamentoDoHost()
    {
        using var cts = new CancellationTokenSource();
        var handler = new StubHandler(async _ =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30));
            return new HttpResponseMessage(HttpStatusCode.OK);
        });

        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://provedor.example.com/") };
        var sender = CriarSender();

        cts.CancelAfter(TimeSpan.FromMilliseconds(100));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => sender.SendAsync(
            client,
            () => new HttpRequestMessage(HttpMethod.Get, "https://provedor.example.com/recurso"),
            "Provedor",
            TimeSpan.FromSeconds(10),
            cts.Token));
    }

    [Fact]
    public void CircuitBreaker_FechaNovamenteAposSucesso()
    {
        var breaker = new CircuitBreakerRegistry();

        for (var i = 0; i < CircuitBreakerRegistry.LimiteFalhas; i++)
        {
            breaker.RegistrarFalha("host.example.com");
        }

        Assert.True(breaker.EstaAberto("host.example.com", out _));

        breaker.RegistrarSucesso("host.example.com");

        Assert.False(breaker.EstaAberto("host.example.com", out _));
    }

    [Fact]
    public void CircuitBreaker_NaoAbreAntesDoLimite()
    {
        var breaker = new CircuitBreakerRegistry();

        for (var i = 0; i < CircuitBreakerRegistry.LimiteFalhas - 1; i++)
        {
            breaker.RegistrarFalha("host.example.com");
        }

        Assert.False(breaker.EstaAberto("host.example.com", out _));
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, Task<HttpResponseMessage>> _handler;
        private int _contagem;

        public StubHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
            : this(request => Task.FromResult(handler(request)))
        {
        }

        public StubHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> handler)
        {
            _handler = async request =>
            {
                Interlocked.Increment(ref _contagem);
                return await handler(request);
            };
        }

        public int Contagem => _contagem;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
            => _handler(request);
    }
}
