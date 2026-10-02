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

    public async Task<FichaMedica> CreateAsync(FichaMedica ficha)
    {
        await _fichas.InsertOneAsync(ficha);
        await _cache.RemoveAsync($"ficha_user_{ficha.PacienteId}");
        return ficha;
    }

    public async Task<FichaMedica?> GetByPacienteIdAsync(string PacienteId)
    {
        var cacheKey = $"ficha_user_{PacienteId}";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
        {
            return JsonSerializer.Deserialize<FichaMedica>(cached);
        }

        var filter = Builders<FichaMedica>.Filter.Eq(f => f.PacienteId, PacienteId);
        var ficha = await _fichas.Find(filter).FirstOrDefaultAsync();

        if (ficha != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(ficha), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });
        }
        return ficha;
    }

    public async Task UpdateAsync(FichaMedica ficha)
    {
        await _fichas.ReplaceOneAsync(f => f.Id == ficha.Id, ficha);
        await _cache.RemoveAsync($"ficha_user_{ficha.PacienteId}");
    }
}


