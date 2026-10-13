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

        // 1. Garante que apenas UMA ficha médica exista por usuário, consolidando quaisquer duplicatas históricas
        try
        {
            var allFichas = await collection.Find(FilterDefinition<FichaMedica>.Empty).ToListAsync(ct);
            var groupedByPaciente = allFichas
                .Where(f => !string.IsNullOrWhiteSpace(f.PacienteId))
                .GroupBy(f => f.PacienteId);

            foreach (var group in groupedByPaciente)
            {
                if (group.Count() > 1)
                {
                    // Mantém a mais recente atualizada e remove os registros excedentes
                    var sorted = group.OrderByDescending(f => f.UpdatedAt).ToList();
                    for (int i = 1; i < sorted.Count; i++)
                    {
                        var dupId = sorted[i].Id;
                        if (!string.IsNullOrEmpty(dupId))
                        {
                            await collection.DeleteOneAsync(f => f.Id == dupId, ct);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[FichaMedica] Aviso ao consolidar duplicatas: {ex.Message}");
        }

        // 2. Índice Único obrigatório por pacienteId (restringe a exatamente 1 por usuário no MongoDB)
        var pacienteIdIndex = new CreateIndexModel<FichaMedica>(
            Builders<FichaMedica>.IndexKeys.Ascending(f => f.PacienteId),
            new CreateIndexOptions { Name = "ix_pacienteId", Unique = true }
        );

        await collection.Indexes.CreateOneAsync(pacienteIdIndex, cancellationToken: ct);
    }

    public async Task<FichaMedica> CreateAsync(FichaMedica ficha)
    {
        // Regra de unicidade: se já existe ficha para o usuário, atualiza a existente em vez de criar outra
        var filter = Builders<FichaMedica>.Filter.Eq(f => f.PacienteId, ficha.PacienteId);
        var existing = await _fichas.Find(filter).SortByDescending(f => f.UpdatedAt).FirstOrDefaultAsync();

        if (existing != null)
        {
            ficha.Id = existing.Id;
            ficha.UpdatedAt = DateTime.UtcNow;
            await _fichas.ReplaceOneAsync(f => f.Id == existing.Id, ficha);
        }
        else
        {
            try
            {
                await _fichas.InsertOneAsync(ficha);
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                // Tratamento de concorrência: se outra requisição inseriu simultaneamente
                var concurrentExisting = await _fichas.Find(filter).FirstOrDefaultAsync();
                if (concurrentExisting != null)
                {
                    ficha.Id = concurrentExisting.Id;
                    ficha.UpdatedAt = DateTime.UtcNow;
                    await _fichas.ReplaceOneAsync(f => f.Id == concurrentExisting.Id, ficha);
                }
            }
        }

        await _cache.RemoveAsync($"ficha_user_{ficha.PacienteId}");
        await _cache.RemoveAsync($"ficha_v2_{ficha.PacienteId}");
        return ficha;
    }

    public async Task<FichaMedica?> GetByPacienteIdAsync(string PacienteId)
    {
        var cacheKey = $"ficha_user_{PacienteId}";
        try
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                return JsonSerializer.Deserialize<FichaMedica>(cached);
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[Ignored Exception] " + ex.Message);
        }

        var filter = Builders<FichaMedica>.Filter.Eq(f => f.PacienteId, PacienteId);
        var fichas = await _fichas.Find(filter).SortByDescending(f => f.UpdatedAt).ToListAsync();

        if (fichas.Count == 0) return null;

        var ficha = fichas[0];

        // Sanidade: se houver mais de uma ficha por erro antigo, remove duplicatas mantendo a principal
        if (fichas.Count > 1)
        {
            for (int i = 1; i < fichas.Count; i++)
            {
                var dupId = fichas[i].Id;
                if (!string.IsNullOrEmpty(dupId))
                {
                    await _fichas.DeleteOneAsync(f => f.Id == dupId);
                }
            }
        }

        if (ficha != null)
        {
            try
            {
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(ficha), new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30) });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("[Ignored Exception] " + ex.Message);
            }
        }
        return ficha;
    }

    public async Task UpdateAsync(FichaMedica ficha)
    {
        var filter = Builders<FichaMedica>.Filter.Eq(f => f.PacienteId, ficha.PacienteId);
        var existing = await _fichas.Find(filter).SortByDescending(f => f.UpdatedAt).FirstOrDefaultAsync();

        if (existing != null)
        {
            ficha.Id = existing.Id;
            ficha.UpdatedAt = DateTime.UtcNow;
            await _fichas.ReplaceOneAsync(f => f.Id == existing.Id, ficha);
        }
        else
        {
            await CreateAsync(ficha);
            return;
        }

        await _cache.RemoveAsync($"ficha_user_{ficha.PacienteId}");
        await _cache.RemoveAsync($"ficha_v2_{ficha.PacienteId}");
    }

    public async Task DeleteAsync(string id)
    {
        await _fichas.DeleteOneAsync(f => f.Id == id);
    }
}
