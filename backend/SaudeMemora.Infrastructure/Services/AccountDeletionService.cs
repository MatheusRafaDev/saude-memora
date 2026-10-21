using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

/// <summary>
/// Executa a exclusão em cascata dos dados de um titular (LGPD, art. 18, VI).
/// Compartilhado entre o endpoint de exclusão (disparo imediato) e o worker
/// periódico, que atua apenas como rede de segurança para solicitações que não
/// conseguiram concluir na primeira tentativa.
/// </summary>
public interface IAccountDeletionService
{
    /// <summary>
    /// Remove todos os dados do paciente (imagens, documentos, ficha, chat, logs e cadastro).
    /// Retorna true quando a exclusão foi concluída.
    /// </summary>
    Task<bool> ExcluirContaAsync(string pacienteId, CancellationToken cancellationToken = default);

    /// <summary>Processa todas as contas marcadas que ainda não foram excluídas.</summary>
    Task<int> ProcessarPendentesAsync(CancellationToken cancellationToken = default);
}

public class AccountDeletionService : IAccountDeletionService
{
    private readonly IPacienteRepository _pacienteRepo;
    private readonly IDocumentRepository _docRepo;
    private readonly IFichaMedicaRepository _fichaRepo;
    private readonly IChatHistoryRepository _chatRepo;
    private readonly ISistemaLogRepository _logRepo;
    private readonly IImageStorageService _storage;
    private readonly ILogger<AccountDeletionService> _logger;
    private readonly IDocumentVectorRepository? _vectorRepo;

    public AccountDeletionService(
        IPacienteRepository pacienteRepo,
        IDocumentRepository docRepo,
        IFichaMedicaRepository fichaRepo,
        IChatHistoryRepository chatRepo,
        ISistemaLogRepository logRepo,
        IImageStorageService storage,
        ILogger<AccountDeletionService> logger,
        IDocumentVectorRepository? vectorRepo = null)
    {
        _pacienteRepo = pacienteRepo;
        _docRepo = docRepo;
        _fichaRepo = fichaRepo;
        _chatRepo = chatRepo;
        _logRepo = logRepo;
        _storage = storage;
        _logger = logger;
        _vectorRepo = vectorRepo;
    }

    public async Task<bool> ExcluirContaAsync(string pacienteId, CancellationToken cancellationToken = default)
    {
        var paciente = await _pacienteRepo.GetByIdAsync(pacienteId);
        if (paciente == null)
        {
            // Já foi removido (ou nunca existiu): nada pendente.
            return true;
        }

        _logger.LogInformation("Processing account deletion request.");

        try
        {
            // 1. Imagens no Cloudinary + registros de documentos.
            var docs = await _docRepo.GetAllByPacienteIdAsync(pacienteId);
            foreach (var doc in docs)
            {
                if (cancellationToken.IsCancellationRequested) return false;

                foreach (var pubId in doc.IdPublicos ?? new List<string>())
                {
                    if (string.IsNullOrWhiteSpace(pubId)) continue;
                    try { await _storage.DeleteImageAsync(pubId); }
                    catch (Exception ex) { _logger.LogWarning("Could not remove a document image. FailureType={FailureType}.", ex.GetType().Name); }
                }

                if (!string.IsNullOrEmpty(doc.Id))
                {
                    await _docRepo.DeleteAsync(doc.Id);
                }
            }

            // 1.1 Chunks vetoriais e embeddings do titular
            if (_vectorRepo != null)
            {
                try { await _vectorRepo.DeleteAllByPacienteIdAsync(pacienteId, cancellationToken); }
                catch (Exception ex) { _logger.LogWarning("Could not remove patient vector chunks. FailureType={FailureType}.", ex.GetType().Name); }
            }

            // 2. Imagem da carteirinha.
            if (!string.IsNullOrWhiteSpace(paciente.IdPublicoCarteirinha))
            {
                try { await _storage.DeleteImageAsync(paciente.IdPublicoCarteirinha); }
                catch (Exception ex) { _logger.LogWarning("Could not remove the health card image. FailureType={FailureType}.", ex.GetType().Name); }
            }

            // 3. Ficha médica.
            var ficha = await _fichaRepo.GetByPacienteIdAsync(pacienteId);
            if (ficha?.Id != null)
            {
                await _fichaRepo.DeleteAsync(ficha.Id);
            }

            // 4. Histórico de chat.
            await _chatRepo.DeleteByPacienteIdAsync(pacienteId, cancellationToken);

            // 5. Logs do titular.
            await _logRepo.DeleteByPacienteIdAsync(pacienteId);

            // 6. Cadastro.
            await _pacienteRepo.DeleteAsync(pacienteId);

            // 7. Evidência de auditoria da exclusão: gravada depois de apagar os dados do
            // titular e sem PacienteId, para registrar o cumprimento sem reintroduzir
            // qualquer vínculo com a pessoa.
            var solicitadoEm = paciente.ExclusaoSolicitadaEm;
            var prazo = solicitadoEm.HasValue
                ? $" Concluída {(DateTime.UtcNow - solicitadoEm.Value).TotalMinutes:F1} min após a solicitação."
                : string.Empty;

            await _logRepo.CriarLogAsync(new SistemaLog
            {
                Nivel = "Info",
                Acao = "ExclusaoContaConcluida",
                Detalhes = $"Exclusão de conta concluída em todas as bases.{prazo}"
            });

            _logger.LogInformation("Account deletion completed.");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError("Account deletion failed. FailureType={FailureType}.", ex.GetType().Name);
            return false;
        }
    }

    public async Task<int> ProcessarPendentesAsync(CancellationToken cancellationToken = default)
    {
        var pendentes = await _pacienteRepo.GetUsersMarkedForDeletionAsync();
        var concluidas = 0;

        foreach (var paciente in pendentes)
        {
            if (cancellationToken.IsCancellationRequested) break;
            if (paciente.Id == null) continue;

            if (await ExcluirContaAsync(paciente.Id, cancellationToken))
            {
                concluidas++;
            }
        }

        return concluidas;
    }
}
