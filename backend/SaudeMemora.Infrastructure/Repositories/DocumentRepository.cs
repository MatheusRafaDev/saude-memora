using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using MongoDB.Bson;
using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private const string QueueIndexName = "ix_status_lockedUntil";
    private const string IdempotencyIndexName = "ux_pacienteId_fileHash";

    private readonly IMongoCollection<RegistroDocumento> _documents;
    private readonly IDistributedCache _cache;

    public DocumentRepository(MongoDbContext context, IDistributedCache cache)
    {
        _documents = context.Documentos;
        _cache = cache;
    }

    /// <summary>
    /// Cria os índices da coleção de documentos. Deve ser chamado UMA vez no startup
    /// (e não no construtor, que roda a cada request por ser Scoped).
    /// </summary>
    public static async Task EnsureIndexesAsync(MongoDbContext context, CancellationToken ct = default)
    {
        var collection = context.Documentos;

        // Remove a versão antiga (sparse) do índice de idempotência criada na Etapa 1.
        // Em índice composto, sparse NÃO exclui docs legados (pacienteId sempre existe),
        // então vários docs com fileHash ausente colidiam no índice único.
        using (var cursor = await collection.Indexes.ListAsync(ct))
        {
            var existing = await cursor.ToListAsync(ct);
            foreach (var idx in existing)
            {
                var name = idx.GetValue("name", "").AsString;
                var keys = idx.GetValue("key", new BsonDocument()).AsBsonDocument;
                var isIdempotencyKey = keys.ElementCount == 2 && keys.Contains("pacienteId") && keys.Contains("fileHash");
                if (isIdempotencyKey && name != IdempotencyIndexName)
                {
                    await collection.Indexes.DropOneAsync(name, ct);
                }
            }
        }

        // Índice da fila: o worker busca por Status + LockedUntil
        var queueModel = new CreateIndexModel<RegistroDocumento>(
            Builders<RegistroDocumento>.IndexKeys
                .Ascending(d => d.Status)
                .Ascending(d => d.LockedUntil),
            new CreateIndexOptions { Name = QueueIndexName });

        // Índice único PARCIAL: só indexa documentos que possuem fileHash (string).
        // Documentos legados (sem fileHash) ficam de fora e não violam a unicidade.
        var idempotencyModel = new CreateIndexModel<RegistroDocumento>(
            Builders<RegistroDocumento>.IndexKeys
                .Ascending(d => d.PacienteId)
                .Ascending(d => d.FileHash),
            new CreateIndexOptions<RegistroDocumento>
            {
                Name = IdempotencyIndexName,
                Unique = true,
                PartialFilterExpression = Builders<RegistroDocumento>.Filter.Type(d => d.FileHash, BsonType.String)
            });

        var pacienteIdModel = new CreateIndexModel<RegistroDocumento>(
            Builders<RegistroDocumento>.IndexKeys.Ascending(d => d.PacienteId),
            new CreateIndexOptions { Name = "ix_pacienteId" }
        );

        await collection.Indexes.CreateManyAsync(new[] { queueModel, idempotencyModel, pacienteIdModel }, ct);
    }

    public async Task<IEnumerable<RegistroDocumento>> GetAllByPacienteIdAsync(string userId)
    {
        var cacheKey = $"docs_user_{userId}";
        try
        {
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<IEnumerable<RegistroDocumento>>(cachedData)!;
            }
        }
        catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); } // ignora erro se redis cair

        var projection = Builders<RegistroDocumento>.Projection
            .Exclude(d => d.TextoExtraido)
            .Exclude(d => d.Conteudo);

        var docs = await _documents.Find(d => d.PacienteId == userId)
                                   .Project<RegistroDocumento>(projection)
                                   .ToListAsync();
        
        try
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(docs), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            });
        }
        catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }

        return docs;
    }

    public async Task<RegistroDocumento?> GetByIdAsync(string id)
    {
        var doc = await _documents.Find(d => d.Id == id).FirstOrDefaultAsync();
        return doc;
    }

    public async Task<RegistroDocumento?> GetByHashAsync(string userId, string fileHash)
    {
        return await _documents.Find(d => d.PacienteId == userId && d.FileHash == fileHash).FirstOrDefaultAsync();
    }

    public async Task<RegistroDocumento> CreateAsync(RegistroDocumento docRecord)
    {
        await _documents.InsertOneAsync(docRecord);
        try {
            await _cache.RemoveAsync($"docs_user_{docRecord.PacienteId}");
            await _cache.RemoveAsync($"documents_count_v3_{docRecord.PacienteId}");
        } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
        return docRecord;
    }

    public async Task<(RegistroDocumento Document, bool Created)> CreateOrGetByHashAsync(RegistroDocumento docRecord)
    {
        try
        {
            await _documents.InsertOneAsync(docRecord);
            try {
                await _cache.RemoveAsync($"docs_user_{docRecord.PacienteId}");
                await _cache.RemoveAsync($"documents_count_v3_{docRecord.PacienteId}");
            } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
            return (docRecord, true);
        }
        catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey
                                             && !string.IsNullOrEmpty(docRecord.FileHash))
        {
            // Outro request concorrente venceu a corrida: devolve o documento dele.
            var existing = await GetByHashAsync(docRecord.PacienteId, docRecord.FileHash!);
            if (existing == null) throw; // não deveria acontecer, mas não mascara o erro
            return (existing, false);
        }
    }

    public async Task<bool> RequeueFailedAsync(string id, string userId)
    {
        var filter = Builders<RegistroDocumento>.Filter.Where(d => d.Id == id && d.PacienteId == userId && d.Status == "failed");
        var update = Builders<RegistroDocumento>.Update
            .Set(d => d.Status, "pending")
            .Set(d => d.Progress, 25)
            .Set(d => d.Attempts, 0)
            .Set(d => d.ErrorMessage, string.Empty)
            .Set(d => d.LockedUntil, null)
            .Set(d => d.LockedBy, string.Empty)
            .Inc(d => d.Version, 1);

        var result = await _documents.UpdateOneAsync(filter, update);
        if (result.ModifiedCount == 0) return false;

        try {
            await _cache.RemoveAsync($"docs_user_{userId}");
            await _cache.RemoveAsync($"documents_count_v3_{userId}");
        } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
        return true;
    }

    public async Task DeleteAsync(string id)
    {
        var doc = await GetByIdAsync(id);
        if (doc != null)
        {
            await _documents.DeleteOneAsync(d => d.Id == id);
            try {
                await _cache.RemoveAsync($"docs_user_{doc.PacienteId}");
                await _cache.RemoveAsync($"documents_count_v3_{doc.PacienteId}");
            } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
        }
    }

    public async Task UpdateAsync(RegistroDocumento docRecord)
    {
        var filter = Builders<RegistroDocumento>.Filter.Where(d => d.Id == docRecord.Id && d.Version == docRecord.Version);
        var oldVersion = docRecord.Version;
        docRecord.Version++;

        var result = await _documents.ReplaceOneAsync(filter, docRecord);
        if (result.ModifiedCount == 0)
        {
            var dbDoc = await GetByIdAsync(docRecord.Id!);
            if (dbDoc != null)
            {
                // Conflito: releitura e merge simples de versão
                docRecord.Version = dbDoc.Version + 1;
                await _documents.ReplaceOneAsync(d => d.Id == docRecord.Id && d.Version == dbDoc.Version, docRecord);
            }
        }

        try {
            await _cache.RemoveAsync($"docs_user_{docRecord.PacienteId}");
            await _cache.RemoveAsync($"documents_count_v3_{docRecord.PacienteId}");
        } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
    }

    public async Task UpdateProgressAsync(string id, int progress)
    {
        var filter = Builders<RegistroDocumento>.Filter.Eq(d => d.Id, id);
        var update = Builders<RegistroDocumento>.Update
            .Set(d => d.Progress, progress)
            .Inc(d => d.Version, 1);
            
        await _documents.UpdateOneAsync(filter, update);
    }

    public async Task<RegistroDocumento?> DequeuePendingAsync(string workerId, TimeSpan lockDuration)
    {
        var now = DateTime.UtcNow;
        var filter = Builders<RegistroDocumento>.Filter.And(
            Builders<RegistroDocumento>.Filter.In(d => d.Status, new[] { "pending", "processing" }),
            Builders<RegistroDocumento>.Filter.Or(
                Builders<RegistroDocumento>.Filter.Eq(d => d.LockedUntil, null),
                Builders<RegistroDocumento>.Filter.Lt(d => d.LockedUntil, now)
            )
        );

        var update = Builders<RegistroDocumento>.Update
            .Set(d => d.Status, "processing")
            .Set(d => d.LockedBy, workerId)
            .Set(d => d.LockedUntil, now.Add(lockDuration))
            .Inc(d => d.Version, 1);

        var options = new FindOneAndUpdateOptions<RegistroDocumento>
        {
            ReturnDocument = ReturnDocument.After,
            Sort = Builders<RegistroDocumento>.Sort.Ascending(d => d.CriadoEm) // Processa os mais antigos primeiro
        };

        var doc = await _documents.FindOneAndUpdateAsync(filter, update, options);
        if (doc != null)
        {
            try {
                await _cache.RemoveAsync($"docs_user_{doc.PacienteId}");
                await _cache.RemoveAsync($"documents_count_v3_{doc.PacienteId}");
            } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
        }

        return doc;
    }

    public async Task<int> ResetExpiredProcessingAsync()
    {
        var now = DateTime.UtcNow;
        var filter = Builders<RegistroDocumento>.Filter.And(
            Builders<RegistroDocumento>.Filter.Eq(d => d.Status, "processing"),
            Builders<RegistroDocumento>.Filter.Lt(d => d.LockedUntil, now)
        );

        var update = Builders<RegistroDocumento>.Update
            .Set(d => d.Status, "pending")
            .Set(d => d.LockedBy, string.Empty)
            .Set(d => d.LockedUntil, null)
            .Inc(d => d.Version, 1);

        var result = await _documents.UpdateManyAsync(filter, update);
        return (int)result.ModifiedCount;
    }
}
