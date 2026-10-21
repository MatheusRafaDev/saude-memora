using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface IDocumentChunker
{
    int CurrentVersion { get; }
    IReadOnlyList<DocumentChunk> CreateChunks(RegistroDocumento document, int? version = null);
}
