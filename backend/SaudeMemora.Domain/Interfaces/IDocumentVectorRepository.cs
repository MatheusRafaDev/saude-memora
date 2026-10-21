using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Domain.Interfaces;

public interface IDocumentVectorRepository
{
    Task UpsertChunksAsync(string pacienteId, string documentoId, IEnumerable<DocumentChunk> chunks, CancellationToken cancellationToken = default);
    Task DeleteByDocumentoIdAsync(string documentoId, CancellationToken cancellationToken = default);
    Task DeleteAllByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DocumentChunk>> GetChunksByPacienteIdAsync(string pacienteId, string? tipoDocumento = null, CancellationToken cancellationToken = default);
    Task<long> CountByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default);
    Task<bool> HasIndexedChunksAsync(string pacienteId, string documentoId, CancellationToken cancellationToken = default);
}
