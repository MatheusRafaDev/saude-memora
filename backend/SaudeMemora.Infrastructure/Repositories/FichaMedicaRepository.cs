using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class FichaMedicaRepository : IFichaMedicaRepository
{
    private readonly IMongoCollection<FichaMedica> _fichas;

    public FichaMedicaRepository(MongoDbContext context)
    {
        _fichas = context.FichaMedicas; // Assuming context.FichaMedicas exists
    }

    public async Task<FichaMedica> CreateAsync(FichaMedica ficha)
    {
        await _fichas.InsertOneAsync(ficha);
        return ficha;
    }

    public async Task<FichaMedica?> GetByPacienteIdAsync(string PacienteId)
    {
        var filter = Builders<FichaMedica>.Filter.Eq(f => f.PacienteId, PacienteId);
        return await _fichas.Find(filter).FirstOrDefaultAsync();
    }

    public async Task UpdateAsync(FichaMedica ficha)
    {
        await _fichas.ReplaceOneAsync(f => f.Id == ficha.Id, ficha);
    }
}


