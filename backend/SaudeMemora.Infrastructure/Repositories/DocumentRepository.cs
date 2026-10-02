using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly IMongoCollection<RegistroDocumento> _documents;

    public DocumentRepository(MongoDbContext context)
    {
        _documents = context.Documentos;
    }

    public async Task<IEnumerable<RegistroDocumento>> GetAllByPacienteIdAsync(string userId)
    {
        return await _documents.Find(d => d.PacienteId == userId).ToListAsync();
    }

    public async Task<RegistroDocumento?> GetByIdAsync(string id)
    {
        return await _documents.Find(d => d.Id == id).FirstOrDefaultAsync();
    }

    public async Task<RegistroDocumento> CreateAsync(RegistroDocumento docRecord)
    {
        await _documents.InsertOneAsync(docRecord);
        return docRecord;
    }

    public async Task DeleteAsync(string id)
    {
        await _documents.DeleteOneAsync(d => d.Id == id);
    }

    public async Task UpdateAsync(RegistroDocumento docRecord)
    {
        await _documents.ReplaceOneAsync(d => d.Id == docRecord.Id, docRecord);
    }
}
