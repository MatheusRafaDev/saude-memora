using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Application.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace SaudeMemora.Api.Workers;

public class AccountCleanupWorker : BackgroundService
{
    private readonly ILogger<AccountCleanupWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Pode ajustar o intervalo

    public AccountCleanupWorker(ILogger<AccountCleanupWorker> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AccountCleanupWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDeletionsAsync(stoppingToken);
                await Task.Delay(_checkInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Ignora quando está desligando
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro fatal no loop do AccountCleanupWorker.");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("AccountCleanupWorker is stopping.");
    }

    private async Task ProcessDeletionsAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var pacienteRepo = scope.ServiceProvider.GetRequiredService<IPacienteRepository>();
        var docRepo = scope.ServiceProvider.GetRequiredService<IDocumentRepository>();
        var fichaRepo = scope.ServiceProvider.GetRequiredService<IFichaMedicaRepository>();
        var chatHistoryRepo = scope.ServiceProvider.GetRequiredService<IChatHistoryRepository>();
        var logRepo = scope.ServiceProvider.GetRequiredService<ISistemaLogRepository>();
        var storage = scope.ServiceProvider.GetRequiredService<IImageStorageService>();

        var patientsToDelete = await pacienteRepo.GetUsersMarkedForDeletionAsync();

        foreach (var paciente in patientsToDelete)
        {
            if (stoppingToken.IsCancellationRequested) break;
            
            if (paciente.Id == null) continue;

            _logger.LogInformation("Processando exclusão do paciente {PacienteId}", paciente.Id);

            try
            {
                // 1. Apaga imagens do Cloudinary dos documentos
                var docs = await docRepo.GetAllByPacienteIdAsync(paciente.Id);
                foreach (var doc in docs)
                {
                    if (doc.IdPublicos != null)
                    {
                        foreach (var pubId in doc.IdPublicos)
                        {
                            if (!string.IsNullOrWhiteSpace(pubId))
                            {
                                try { await storage.DeleteImageAsync(pubId); }
                                catch (Exception ex) { _logger.LogWarning(ex, "Erro ao remover imagem {PubId}", pubId); }
                            }
                        }
                    }
                    if (doc.Id != null)
                    {
                        await docRepo.DeleteAsync(doc.Id);
                    }
                }

                // 2. Apaga a imagem da carteirinha
                if (!string.IsNullOrWhiteSpace(paciente.IdPublicoCarteirinha))
                {
                    try { await storage.DeleteImageAsync(paciente.IdPublicoCarteirinha); }
                    catch (Exception ex) { _logger.LogWarning(ex, "Erro ao remover carteirinha {PubId}", paciente.IdPublicoCarteirinha); }
                }

                // 3. Apaga a ficha médica
                var ficha = await fichaRepo.GetByPacienteIdAsync(paciente.Id);
                if (ficha?.Id != null)
                {
                    await fichaRepo.DeleteAsync(ficha.Id);
                }

                // 4. Apaga o histórico do chat
                await chatHistoryRepo.DeleteByPacienteIdAsync(paciente.Id, stoppingToken);

                // 5. Apaga logs
                await logRepo.DeleteByPacienteIdAsync(paciente.Id);

                // 6. Apaga o paciente
                await pacienteRepo.DeleteAsync(paciente.Id);

                _logger.LogInformation("Paciente {PacienteId} e seus dados foram excluídos com sucesso.", paciente.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao excluir dados do paciente {PacienteId}", paciente.Id);
            }
        }
    }
}
