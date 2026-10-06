using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class FichaMedicaRepository : IFichaMedicaRepository
{
    private readonly IMongoCollection<FichaMedica> _fichas;
    private readonly IDistributedCache _cache;

    public FichaMedicaRepository(MongoDbContext context, IDistributedCache cache)
    {
        _fichas = context.FichaMedicas;
        _cache = cache;
    }

    public static async Task EnsureIndexesAsync(MongoDbContext context, CancellationToken ct = default)
    {
        var collection = context.FichaMedicas;

        var pacienteIdIndex = new CreateIndexModel<FichaMedica>(
            Builders<FichaMedica>.IndexKeys.Ascending(f => f.PacienteId),
            new CreateIndexOptions { Name = "ix_pacienteId", Unique = true }
        );

        await collection.Indexes.CreateOneAsync(pacienteIdIndex, cancellationToken: ct);
    }

    public async Task<FichaMedica> CreateAsync(FichaMedica ficha)
    {
        await _fichas.InsertOneAsync(ficha);
        await _cache.RemoveAsync($"ficha_user_{ficha.PacienteId}");
        return ficha;
    }

    public async Task<FichaMedica?> GetByPacienteIdAsync(string PacienteId)
    {
        var cacheKey = $"ficha_user_{PacienteId}";
        try { var cached = await _cache.GetStringAsync(cacheKey); if (!string.IsNullOrEmpty(cached)) { return JsonSerializer.Deserialize<FichaMedica>(cached); } } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }

        var filter = Builders<FichaMedica>.Filter.Eq(f => f.PacienteId, PacienteId);
        var ficha = await _fichas.Find(filter).FirstOrDefaultAsync();

        if (ficha != null)
        {
            try { await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(ficha), new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30) }); } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
        }
        return ficha;
    }

    public async Task UpdateAsync(FichaMedica ficha)
    {
        await _fichas.ReplaceOneAsync(f => f.Id == ficha.Id, ficha);
        await _cache.RemoveAsync($"ficha_user_{ficha.PacienteId}");
    }

    public async Task DeleteAsync(string id)
    {
        await _fichas.DeleteOneAsync(f => f.Id == id);
    }
}
