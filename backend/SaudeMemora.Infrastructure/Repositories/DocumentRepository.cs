using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly IMongoCollection<DocumentRecord> _documents;

    public DocumentRepository(MongoDbContext context)
    {
        _documents = context.Documents;
    }

    public async Task<IEnumerable<DocumentRecord>> GetAllByPatientIdAsync(string userId)
    {
        return await _documents.Find(d => d.PatientId == userId).ToListAsync();
    }

    public async Task<DocumentRecord?> GetByIdAsync(string id)
    {
        return await _documents.Find(d => d.Id == id).FirstOrDefaultAsync();
    }

    public async Task<DocumentRecord> CreateAsync(DocumentRecord docRecord)
    {
        await _documents.InsertOneAsync(docRecord);
        return docRecord;
    }

    public async Task DeleteAsync(string id)
    {
        await _documents.DeleteOneAsync(d => d.Id == id);
    }
}
