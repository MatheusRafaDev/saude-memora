using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

public class DocumentVectorIndexer : IDocumentVectorIndexer
{
    private readonly IDocumentChunker _chunker;
    private readonly IEmbeddingService _embeddingService;
    private readonly IDocumentVectorRepository _vectorRepo;
    private readonly IDocumentRepository _documentRepo;
    private readonly ILogger<DocumentVectorIndexer> _logger;

    public DocumentVectorIndexer(
        IDocumentChunker chunker,
        IEmbeddingService embeddingService,
        IDocumentVectorRepository vectorRepo,
        IDocumentRepository documentRepo,
        ILogger<DocumentVectorIndexer> logger)
    {
        _chunker = chunker;
        _embeddingService = embeddingService;
        _vectorRepo = vectorRepo;
        _documentRepo = documentRepo;
        _logger = logger;
    }

    public async Task<bool> IndexDocumentAsync(RegistroDocumento document, CancellationToken cancellationToken = default)
    {
        if (document == null || string.IsNullOrWhiteSpace(document.Id) || string.IsNullOrWhiteSpace(document.PacienteId))
        {
            return false;
        }

        if (!string.Equals(document.Status, "pronto", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var chunks = _chunker.CreateChunks(document);
        if (chunks.Count == 0)
        {
            await _vectorRepo.DeleteByDocumentoIdAsync(document.Id, cancellationToken);
            return true;
        }

        var texts = chunks.Select(c => c.Texto).ToList();
        var embeddings = await _embeddingService.GenerateEmbeddingsBatchAsync(texts, cancellationToken);

        if (embeddings.Count != chunks.Count)
        {
            _logger.LogWarning(
                "Could not generate all embeddings for document indexing. ChunksCount={ChunksCount} EmbeddingsCount={EmbeddingsCount}",
                chunks.Count, embeddings.Count);
            return false;
        }

        for (int i = 0; i < chunks.Count; i++)
        {
            chunks[i].Embedding = embeddings[i].ToList();
            chunks[i].ModeloEmbedding = _embeddingService.ModelName;
            chunks[i].Versao = _chunker.CurrentVersion;
            chunks[i].AtualizadoEm = DateTime.UtcNow;
        }

        await _vectorRepo.UpsertChunksAsync(document.PacienteId, document.Id, chunks, cancellationToken);
        _logger.LogInformation("Document vector indexing completed. ChunksIndexed={ChunksCount}", chunks.Count);
        return true;
    }

    public async Task DeleteDocumentIndexAsync(string documentoId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(documentoId)) return;
        await _vectorRepo.DeleteByDocumentoIdAsync(documentoId, cancellationToken);
    }

    public async Task DeletePatientIndexAsync(string pacienteId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(pacienteId)) return;
        await _vectorRepo.DeleteAllByPacienteIdAsync(pacienteId, cancellationToken);
    }

    public async Task<int> IndexPendingDocumentsForPatientAsync(string pacienteId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(pacienteId)) return 0;

        var allDocs = await _documentRepo.GetAllForChatByPacienteIdAsync(pacienteId, cancellationToken);
        var readyDocs = allDocs
            .Where(d => d.PacienteId == pacienteId && string.Equals(d.Status, "pronto", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(d.Id))
            .ToList();

        var indexedCount = 0;
        foreach (var doc in readyDocs)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var alreadyIndexed = await _vectorRepo.HasIndexedChunksAsync(pacienteId, doc.Id!, cancellationToken);
            if (!alreadyIndexed)
            {
                var success = await IndexDocumentAsync(doc, cancellationToken);
                if (success) indexedCount++;
            }
        }

        return indexedCount;
    }
}
