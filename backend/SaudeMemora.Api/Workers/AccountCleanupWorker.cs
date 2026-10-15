using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Api.Workers;

/// <summary>
/// Rede de segurança para a exclusão de contas (LGPD).
/// O caminho normal é o disparo imediato feito pelo endpoint <c>DELETE /api/pacientes/me</c>;
/// este worker apenas reprocessa solicitações que falharam ou ficaram pendentes
/// (por exemplo, indisponibilidade do Cloudinary no momento do pedido).
/// </summary>
public class AccountCleanupWorker : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(1);
    private static readonly TimeSpan ErrorDelay = TimeSpan.FromMinutes(30);

    private readonly ILogger<AccountCleanupWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public AccountCleanupWorker(ILogger<AccountCleanupWorker> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AccountCleanupWorker started (rede de segurança da exclusão de contas).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var deletionService = scope.ServiceProvider.GetRequiredService<IAccountDeletionService>();

                var pendentes = await deletionService.ProcessarPendentesAsync(stoppingToken);
                if (pendentes > 0)
                {
                    _logger.LogInformation(
                        "AccountCleanupWorker concluiu {Count} exclusões que estavam pendentes.", pendentes);
                }

                await Task.Delay(CheckInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Desligando.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no ciclo do AccountCleanupWorker.");
                await Task.Delay(ErrorDelay, stoppingToken);
            }
        }

        _logger.LogInformation("AccountCleanupWorker is stopping.");
    }
}
