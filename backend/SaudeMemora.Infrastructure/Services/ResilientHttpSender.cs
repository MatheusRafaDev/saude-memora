using Microsoft.Extensions.Logging;
using System.Net;

namespace SaudeMemora.Infrastructure.Services;

/// <summary>
/// Envia requisições HTTP com timeout, retentativa exponencial com jitter e
/// "circuit breaker" simples por host.
///
/// Motivação: o pipeline de OCR/IA encadeia três provedores externos por documento
/// (OCR.Space em dois motores, Gemini e Groq). Antes, uma falha transitória
/// (429, 5xx ou timeout) consumia a tentativa do documento e o usuário via erro,
/// e não havia limite de tempo por operação.
///
/// Deliberadamente sem dependência nova: Polly está disponível no cache, mas
/// adicioná-la exigiria mudar o projeto e o ganho aqui é pequeno e localizado.
/// </summary>
public class ResilientHttpSender
{
    private static readonly TimeSpan[] BackoffPadrao =
    {
        TimeSpan.FromMilliseconds(500),
        TimeSpan.FromSeconds(2),
        TimeSpan.FromSeconds(6)
    };

    private readonly ILogger<ResilientHttpSender> _logger;
    private readonly CircuitBreakerRegistry _breaker;

    public ResilientHttpSender(ILogger<ResilientHttpSender> logger, CircuitBreakerRegistry breaker)
    {
        _logger = logger;
        _breaker = breaker;
    }

    /// <summary>
    /// Executa o envio com retentativas. O <paramref name="timeoutPorTentativa"/> limita
    /// cada tentativa individualmente (via <see cref="CancellationTokenSource"/>), de modo
    /// que um provedor lento não bloqueie o worker indefinidamente.
    /// </summary>
    public async Task<HttpResponseMessage?> SendAsync(
        HttpClient client,
        Func<HttpRequestMessage> criarRequisicao,
        string provedor,
        TimeSpan timeoutPorTentativa,
        CancellationToken cancellationToken,
        int maxTentativas = 3)
    {
        var host = client.BaseAddress?.Host ?? provedor;

        if (_breaker.EstaAberto(host, out var restante))
        {
            _logger.LogWarning(
                "[{Provedor}] Circuit breaker aberto por {Segundos:F0}s; chamada evitada.",
                provedor, restante.TotalSeconds);
            return null;
        }

        Exception? ultimaExcecao = null;

        for (var tentativa = 1; tentativa <= maxTentativas; tentativa++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(timeoutPorTentativa);

                using var requisicao = criarRequisicao();
                var resposta = await client.SendAsync(
                    requisicao, HttpCompletionOption.ResponseContentRead, timeoutCts.Token);

                if (DeveRetentar(resposta.StatusCode) && tentativa < maxTentativas)
                {
                    _logger.LogWarning(
                        "[{Provedor}] HTTP {StatusCode} na tentativa {Tentativa}/{Max}; retentando.",
                        provedor, (int)resposta.StatusCode, tentativa, maxTentativas);

                    resposta.Dispose();
                    await AguardarBackoffAsync(tentativa, cancellationToken);
                    continue;
                }

                if (resposta.IsSuccessStatusCode)
                {
                    _breaker.RegistrarSucesso(host);
                }
                else if ((int)resposta.StatusCode >= 500)
                {
                    _breaker.RegistrarFalha(host);
                }

                return resposta;
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                // Timeout da tentativa (não cancelamento do host).
                ultimaExcecao = new TimeoutException(
                    $"{provedor} excedeu o tempo limite de {timeoutPorTentativa.TotalSeconds:F0}s.");
                _logger.LogWarning(
                    "[{Provedor}] Timeout na tentativa {Tentativa}/{Max}.", provedor, tentativa, maxTentativas);
            }
            catch (HttpRequestException ex)
            {
                ultimaExcecao = ex;
                _logger.LogWarning(
                    ex, "[{Provedor}] Falha de rede na tentativa {Tentativa}/{Max}.", provedor, tentativa, maxTentativas);
            }

            if (tentativa < maxTentativas)
            {
                await AguardarBackoffAsync(tentativa, cancellationToken);
            }
        }

        _breaker.RegistrarFalha(host);
        _logger.LogError(ultimaExcecao, "[{Provedor}] Esgotadas {Max} tentativas.", provedor, maxTentativas);

        if (ultimaExcecao is not null) throw ultimaExcecao;
        return null;
    }

    private static bool DeveRetentar(HttpStatusCode status) =>
        status == HttpStatusCode.TooManyRequests
        || status == HttpStatusCode.RequestTimeout
        || (int)status >= 500;

    private static async Task AguardarBackoffAsync(int tentativa, CancellationToken cancellationToken)
    {
        var baseDelay = BackoffPadrao[Math.Min(tentativa - 1, BackoffPadrao.Length - 1)];
        // Jitter para evitar sincronização entre workers concorrentes.
        var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(0, 250));
        await Task.Delay(baseDelay + jitter, cancellationToken);
    }
}

/// <summary>
/// Estado do circuit breaker por host. Após <see cref="LimiteFalhas"/> falhas
/// consecutivas, novas chamadas ao host são evitadas por <see cref="JanelaAberta"/>.
/// </summary>
public class CircuitBreakerRegistry
{
    public const int LimiteFalhas = 5;
    public static readonly TimeSpan JanelaAberta = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan JanelaContagem = TimeSpan.FromMinutes(5);

    private readonly object _lock = new();
    private readonly Dictionary<string, Estado> _estados = new(StringComparer.OrdinalIgnoreCase);

    public bool EstaAberto(string host, out TimeSpan restante)
    {
        lock (_lock)
        {
            restante = TimeSpan.Zero;
            if (!_estados.TryGetValue(host, out var estado)) return false;

            var agora = DateTime.UtcNow;
            if (estado.AbertoAte.HasValue && estado.AbertoAte.Value > agora)
            {
                restante = estado.AbertoAte.Value - agora;
                return true;
            }

            // Janela expirada: permite meia-abertura.
            if (estado.AbertoAte.HasValue)
            {
                estado.AbertoAte = null;
                estado.Falhas = 0;
                estado.PrimeiraFalhaEm = null;
            }

            return false;
        }
    }

    public void RegistrarFalha(string host)
    {
        lock (_lock)
        {
            var agora = DateTime.UtcNow;
            if (!_estados.TryGetValue(host, out var estado))
            {
                estado = new Estado();
                _estados[host] = estado;
            }

            if (estado.PrimeiraFalhaEm is null || agora - estado.PrimeiraFalhaEm.Value > JanelaContagem)
            {
                estado.Falhas = 0;
                estado.PrimeiraFalhaEm = agora;
            }

            estado.Falhas++;

            if (estado.Falhas >= LimiteFalhas)
            {
                estado.AbertoAte = agora.Add(JanelaAberta);
            }
        }
    }

    public void RegistrarSucesso(string host)
    {
        lock (_lock)
        {
            if (_estados.TryGetValue(host, out var estado))
            {
                estado.Falhas = 0;
                estado.PrimeiraFalhaEm = null;
                estado.AbertoAte = null;
            }
        }
    }

    private class Estado
    {
        public int Falhas { get; set; }
        public DateTime? PrimeiraFalhaEm { get; set; }
        public DateTime? AbertoAte { get; set; }
    }
}
