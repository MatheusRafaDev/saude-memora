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
        return await _pacientes.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<bool> TryUpdateSecurityStampAsync(string id, string currentStamp, string newStamp)
    {
        var filter = Builders<Paciente>.Filter.And(
            Builders<Paciente>.Filter.Eq(p => p.Id, id),
            Builders<Paciente>.Filter.Eq(p => p.SecurityStamp, currentStamp),
            Builders<Paciente>.Filter.Ne(p => p.IsDeleting, true));
        var result = await _pacientes.UpdateOneAsync(
            filter,
            Builders<Paciente>.Update.Set(p => p.SecurityStamp, newStamp));

        if (result.MatchedCount == 0)
        {
            return false;
        }

        await _cache.SafeRemoveAsync($"secstamp_{id}");
        return true;
    }

    public async Task<Paciente> CreateAsync(Paciente paciente)
    {
        await _pacientes.InsertOneAsync(paciente);
        return paciente;
    }

    public async Task UpdateAsync(Paciente paciente)
    {
        var update = Builders<Paciente>.Update
            .Set(p => p.Nome, paciente.Nome)
            .Set(p => p.DataNascimento, paciente.DataNascimento)
            .Set(p => p.Sexo, paciente.Sexo)
            .Set(p => p.Email, paciente.Email)
            .Set(p => p.Telefone, paciente.Telefone)
            .Set(p => p.Endereco, paciente.Endereco)
            .Set(p => p.PlanoSaude, paciente.PlanoSaude)
            .Set(p => p.NumeroCarteirinha, paciente.NumeroCarteirinha)
            .Set(p => p.UrlCarteirinha, paciente.UrlCarteirinha)
            .Set(p => p.IdPublicoCarteirinha, paciente.IdPublicoCarteirinha)
            .Set(p => p.ConsentimentoIa, paciente.ConsentimentoIa)
            .Set(p => p.TokenEmergencia, paciente.TokenEmergencia)
            .Set(p => p.ResetPasswordToken, paciente.ResetPasswordToken)
            .Set(p => p.ResetPasswordExpiry, paciente.ResetPasswordExpiry)
            .Set(p => p.IsDeleting, paciente.IsDeleting)
            .Set(p => p.SecurityStamp, paciente.SecurityStamp)
            .Set(p => p.ContatoEmergencia, paciente.ContatoEmergencia)
            .Set(p => p.TokenEmergenciaExpiraEm, paciente.TokenEmergenciaExpiraEm);

        if (!string.IsNullOrEmpty(paciente.Senha)) 
        {
            update = update.Set(p => p.Senha, paciente.Senha);
        }

        await _pacientes.UpdateOneAsync(p => p.Id == paciente.Id, update);
        await _cache.SafeRemoveAsync($"paciente_v2_{paciente.Id}");
        await _cache.SafeRemoveAsync($"secstamp_{paciente.Id}");
    }

    public async Task DeleteAsync(string id)
    {
        await _pacientes.DeleteOneAsync(p => p.Id == id);
        await _cache.SafeRemoveAsync($"paciente_v2_{id}");
        await _cache.SafeRemoveAsync($"secstamp_{id}");
    }

    public async Task<IEnumerable<Paciente>> GetUsersMarkedForDeletionAsync()
    {
        return await _pacientes.Find(p => p.IsDeleting == true).ToListAsync();
    }
}
