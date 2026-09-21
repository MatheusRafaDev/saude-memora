using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Domain.Interfaces;

public interface IDocumentRepository
{
    Task<IEnumerable<DocumentRecord>> GetAllByPatientIdAsync(string userId);
    Task<DocumentRecord?> GetByIdAsync(string id);
    Task<DocumentRecord> CreateAsync(DocumentRecord docRecord);
    Task DeleteAsync(string id);
}
