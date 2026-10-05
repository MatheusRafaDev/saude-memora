using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class PacienteRepository : IPacienteRepository
{
    private readonly IMongoCollection<Paciente> _pacientes;
    private readonly IDistributedCache _cache;

    public PacienteRepository(MongoDbContext context, IDistributedCache cache)
    {
        _pacientes = context.Pacientes;
        _cache = cache;
    }

    public async Task<Paciente?> GetByEmailAsync(string email)
    {
        return await _pacientes.Find(p => p.Email == email).FirstOrDefaultAsync();
    }

    public async Task<Paciente?> GetByResetTokenAsync(string token)
    {
        return await _pacientes.Find(p => p.ResetPasswordToken == token).FirstOrDefaultAsync();
    }

    public async Task<Paciente?> GetByEmergenciaTokenAsync(string token)
    {
        return await _pacientes.Find(p => p.TokenEmergencia == token).FirstOrDefaultAsync();
    }


    public async Task<Paciente?> GetByIdAsync(string id)
    {
        var cacheKey = $"paciente_{id}";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
        {
            return JsonSerializer.Deserialize<Paciente>(cached);
        }

        var paciente = await _pacientes.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (paciente != null)
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(paciente), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            });
        }
        return paciente;
    }

    public async Task<Paciente> CreateAsync(Paciente paciente)
    {
        await _pacientes.InsertOneAsync(paciente);
        return paciente;
    }

    public async Task UpdateAsync(Paciente paciente)
    {
        await _pacientes.ReplaceOneAsync(p => p.Id == paciente.Id, paciente);
        await _cache.RemoveAsync($"paciente_{paciente.Id}");
    }

    public async Task DeleteAsync(string id)
    {
        await _pacientes.DeleteOneAsync(p => p.Id == id);
        await _cache.RemoveAsync($"paciente_{id}");
    }
}
