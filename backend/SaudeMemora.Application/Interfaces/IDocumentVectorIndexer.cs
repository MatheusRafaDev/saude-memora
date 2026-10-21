using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface IDocumentVectorIndexer
{
    Task<bool> IndexDocumentAsync(RegistroDocumento document, CancellationToken cancellationToken = default);
    Task DeleteDocumentIndexAsync(string documentoId, CancellationToken cancellationToken = default);
    Task DeletePatientIndexAsync(string pacienteId, CancellationToken cancellationToken = default);
    Task<int> IndexPendingDocumentsForPatientAsync(string pacienteId, CancellationToken cancellationToken = default);
}
