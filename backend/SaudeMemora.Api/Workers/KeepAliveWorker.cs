using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace SaudeMemora.Api.Workers
{
    public class KeepAliveWorker : BackgroundService
    {
        private readonly ILogger<KeepAliveWorker> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _apiUrl;

        public KeepAliveWorker(ILogger<KeepAliveWorker> logger)
        {
            _logger = logger;
            _httpClient = new HttpClient();
            // Pegamos a URL da API das variáveis de ambiente. Se não estiver configurada, não vai rodar o ping.
            _apiUrl = Environment.GetEnvironmentVariable("API_URL") ?? "";
            
            // Certifica de não terminar com barra
            if (_apiUrl.EndsWith("/"))
            {
                _apiUrl = _apiUrl.TrimEnd('/');
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (string.IsNullOrWhiteSpace(_apiUrl))
            {
                _logger.LogWarning("[KeepAlive] API_URL não configurada. O ping automático para evitar hibernação está desativado.");
                return;
            }

            _logger.LogInformation("[KeepAlive] Worker iniciado. Vai pingar {Url}/api/ping a cada 14 minutos.", _apiUrl);

            // A cada 14 minutos (Render hiberna após 15min)
            var pingInterval = TimeSpan.FromMinutes(14);
            var pingUrl = $"{_apiUrl}/api/ping";

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Espera primeiro para não dar ping assim que sobe
                    await Task.Delay(pingInterval, stoppingToken);

                    if (stoppingToken.IsCancellationRequested) break;

                    var response = await _httpClient.GetAsync(pingUrl, stoppingToken);
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("[KeepAlive] Ping realizado com sucesso no Render.");
                    }
                    else
                    {
                        _logger.LogWarning("[KeepAlive] Ping retornou status code {StatusCode}.", response.StatusCode);
                    }
                }
                catch (TaskCanceledException)
                {
                    // Ignora, foi cancelado
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[KeepAlive] Erro ao realizar ping automático.");
                }
            }
        }
    }
}
