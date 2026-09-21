using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class PacienteRepository : IPacienteRepository
{
    private readonly IMongoCollection<Paciente> _pacientes;

    public PacienteRepository(MongoDbContext context)
    {
        _pacientes = context.Pacientes;
    }

    public async Task<Paciente?> GetByEmailAsync(string email)
    {
        return await _pacientes.Find(p => p.Email == email).FirstOrDefaultAsync();
    }

    public async Task<Paciente?> GetByCpfAsync(string cpf)
    {
        return await _pacientes.Find(p => p.Cpf == cpf).FirstOrDefaultAsync();
    }

    public async Task<Paciente?> GetByIdAsync(string id)
    {
        return await _pacientes.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Paciente> CreateAsync(Paciente paciente)
    {
        await _pacientes.InsertOneAsync(paciente);
        return paciente;
    }

    public async Task UpdateAsync(Paciente paciente)
    {
        await _pacientes.ReplaceOneAsync(p => p.Id == paciente.Id, paciente);
    }

    public async Task DeleteAsync(string id)
    {
        await _pacientes.DeleteOneAsync(p => p.Id == id);
    }
}
