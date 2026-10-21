using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class DocumentVectorRepository : IDocumentVectorRepository
{
    private readonly IMongoCollection<DocumentChunk> _chunks;

    public DocumentVectorRepository(MongoDbContext context)
    {
        _chunks = context.DocumentoChunks;
    }

    public static async Task EnsureIndexesAsync(MongoDbContext context, CancellationToken ct = default)
    {
        var collection = context.DocumentoChunks;

        var pacienteDocModel = new CreateIndexModel<DocumentChunk>(
            Builders<DocumentChunk>.IndexKeys
                .Ascending(c => c.PacienteId)
                .Ascending(c => c.DocumentoId),
            new CreateIndexOptions { Name = "ix_pacienteId_documentoId" });

        var pacienteTipoModel = new CreateIndexModel<DocumentChunk>(
            Builders<DocumentChunk>.IndexKeys
                .Ascending(c => c.PacienteId)
                .Ascending(c => c.Tipo),
            new CreateIndexOptions { Name = "ix_pacienteId_tipo" });

        var documentoIdModel = new CreateIndexModel<DocumentChunk>(
            Builders<DocumentChunk>.IndexKeys
                .Ascending(c => c.DocumentoId),
            new CreateIndexOptions { Name = "ix_documentoId" });

        await collection.Indexes.CreateManyAsync([pacienteDocModel, pacienteTipoModel, documentoIdModel], ct);
    }

    public async Task UpsertChunksAsync(
        string pacienteId,
        string documentoId,
        IEnumerable<DocumentChunk> chunks,
        CancellationToken cancellationToken = default)
    {
        var chunkList = chunks.ToList();

        // 1. Remove qualquer chunk pré-existente desse documento para garantir idempotência
        await _chunks.DeleteManyAsync(
            c => c.PacienteId == pacienteId && c.DocumentoId == documentoId,
            cancellationToken);

        // 2. Insere os novos chunks (se houver)
        if (chunkList.Count > 0)
        {
            await _chunks.InsertManyAsync(chunkList, cancellationToken: cancellationToken);
        }
    }

    public async Task DeleteByDocumentoIdAsync(string documentoId, CancellationToken cancellationToken = default)
    {
        await _chunks.DeleteManyAsync(c => c.DocumentoId == documentoId, cancellationToken);
    }

    public async Task DeleteAllByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default)
    {
        await _chunks.DeleteManyAsync(c => c.PacienteId == pacienteId, cancellationToken);
    }

    public async Task<IReadOnlyList<DocumentChunk>> GetChunksByPacienteIdAsync(
        string pacienteId,
        string? tipoDocumento = null,
        CancellationToken cancellationToken = default)
    {
        var filterBuilder = Builders<DocumentChunk>.Filter;
        var filter = filterBuilder.Eq(c => c.PacienteId, pacienteId);

        if (!string.IsNullOrWhiteSpace(tipoDocumento))
        {
            filter &= filterBuilder.Eq(c => c.Tipo, tipoDocumento.ToLowerInvariant());
        }

        return await _chunks.Find(filter).ToListAsync(cancellationToken);
    }

    public async Task<long> CountByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default)
    {
        return await _chunks.CountDocumentsAsync(c => c.PacienteId == pacienteId, cancellationToken: cancellationToken);
    }

    public async Task<bool> HasIndexedChunksAsync(string pacienteId, string documentoId, CancellationToken cancellationToken = default)
    {
        return await _chunks.Find(c => c.PacienteId == pacienteId && c.DocumentoId == documentoId).AnyAsync(cancellationToken);
    }
}
