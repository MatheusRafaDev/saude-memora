using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly IMongoCollection<RegistroDocumento> _documents;
    private readonly IDistributedCache _cache;

    public DocumentRepository(MongoDbContext context, IDistributedCache cache)
    {
        _documents = context.Documentos;
        _cache = cache;
    }

    public async Task<IEnumerable<RegistroDocumento>> GetAllByPacienteIdAsync(string userId)
    {
        var cacheKey = $"docs_user_{userId}";
        var cachedData = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedData))
        {
            return JsonSerializer.Deserialize<IEnumerable<RegistroDocumento>>(cachedData)!;
        }

        var docs = await _documents.Find(d => d.PacienteId == userId).ToListAsync();
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(docs), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
        });
        
        return docs;
    }

    public async Task<RegistroDocumento?> GetByIdAsync(string id)
    {
        var cacheKey = $"doc_{id}";
        var cachedData = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedData))
        {
            return JsonSerializer.Deserialize<RegistroDocumento>(cachedData);
        }

        var doc = await _documents.Find(d => d.Id == id).FirstOrDefaultAsync();
        if (doc != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(doc), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });
        }
        return doc;
    }

    public async Task<RegistroDocumento> CreateAsync(RegistroDocumento docRecord)
    {
        await _documents.InsertOneAsync(docRecord);
        await _cache.RemoveAsync($"docs_user_{docRecord.PacienteId}");
        return docRecord;
    }

    public async Task DeleteAsync(string id)
    {
        var doc = await GetByIdAsync(id);
        if (doc != null)
        {
            await _documents.DeleteOneAsync(d => d.Id == id);
            await _cache.RemoveAsync($"doc_{id}");
            await _cache.RemoveAsync($"docs_user_{doc.PacienteId}");
        }
    }

    public async Task UpdateAsync(RegistroDocumento docRecord)
    {
        await _documents.ReplaceOneAsync(d => d.Id == docRecord.Id, docRecord);
        await _cache.RemoveAsync($"doc_{docRecord.Id}");
        await _cache.RemoveAsync($"docs_user_{docRecord.PacienteId}");
    }
}
