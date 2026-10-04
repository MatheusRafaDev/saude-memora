using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Domain.Interfaces;

public interface IDocumentRepository
{
    Task<IEnumerable<RegistroDocumento>> GetAllByPacienteIdAsync(string userId);
    Task<RegistroDocumento?> GetByIdAsync(string id);
    Task<RegistroDocumento?> GetByHashAsync(string userId, string fileHash);
    Task<RegistroDocumento> CreateAsync(RegistroDocumento docRecord);

    /// <summary>
    /// Insere o documento de forma idempotente. Se outro request concorrente já inseriu
    /// um documento com o mesmo (PacienteId, FileHash), retorna o existente com Created = false.
    /// </summary>
    Task<(RegistroDocumento Document, bool Created)> CreateOrGetByHashAsync(RegistroDocumento docRecord);

    /// <summary>
    /// Recoloca atomicamente na fila um documento com Status = "failed".
    /// Retorna false se o documento não estava em "failed" (ex: já foi re-enfileirado).
    /// </summary>
    Task<bool> RequeueFailedAsync(string id, string userId);
    Task UpdateAsync(RegistroDocumento docRecord);
    Task DeleteAsync(string id);

    /// <summary>
    /// Busca e "trava" (lock) um documento pendente para processamento.
    /// Usa FindOneAndUpdate para garantir atomicidade.
    /// </summary>
    Task<RegistroDocumento?> DequeuePendingAsync(string workerId, TimeSpan lockDuration);
}
