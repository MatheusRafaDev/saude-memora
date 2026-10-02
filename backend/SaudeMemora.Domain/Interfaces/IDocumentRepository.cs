using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Domain.Interfaces;

public interface IDocumentRepository
{
    Task<IEnumerable<RegistroDocumento>> GetAllByPacienteIdAsync(string userId);
    Task<RegistroDocumento?> GetByIdAsync(string id);
    Task<RegistroDocumento> CreateAsync(RegistroDocumento docRecord);
    Task UpdateAsync(RegistroDocumento docRecord);
    Task DeleteAsync(string id);
}
