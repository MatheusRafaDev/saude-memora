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

    public static async Task EnsureIndexesAsync(MongoDbContext context, CancellationToken ct = default)
    {
        var collection = context.Pacientes;

        var emailIndex = new CreateIndexModel<Paciente>(
            Builders<Paciente>.IndexKeys.Ascending(p => p.Email),
            new CreateIndexOptions { Name = "ix_email", Unique = true }
        );

        var resetTokenIndex = new CreateIndexModel<Paciente>(
            Builders<Paciente>.IndexKeys.Ascending(p => p.ResetPasswordToken),
            new CreateIndexOptions { Name = "ix_reset_token", Sparse = true }
        );

        var emergenciaTokenIndex = new CreateIndexModel<Paciente>(
            Builders<Paciente>.IndexKeys.Ascending(p => p.TokenEmergencia),
            new CreateIndexOptions { Name = "ix_emergencia_token", Sparse = true }
        );

        await collection.Indexes.CreateManyAsync(new[] { emailIndex, resetTokenIndex, emergenciaTokenIndex }, ct);
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
        try
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                return JsonSerializer.Deserialize<Paciente>(cached);
            }
        }
        catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }

        var paciente = await _pacientes.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (paciente != null)
        {
            var cacheable = JsonSerializer.Deserialize<Paciente>(JsonSerializer.Serialize(paciente));
            if (cacheable != null)
            {
                cacheable.Senha = "";
                cacheable.ResetPasswordToken = null;
                cacheable.TokenEmergencia = null;
            }

            try
            {
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(cacheable), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
                });
            }
            catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }
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
