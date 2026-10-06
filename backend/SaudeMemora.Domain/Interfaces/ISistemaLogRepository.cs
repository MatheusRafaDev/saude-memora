using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Domain.Interfaces;

public interface ISistemaLogRepository
{
    Task CriarLogAsync(SistemaLog log);
    Task<List<SistemaLog>> ObterLogsAsync(int limit = 100);
    Task DeleteByPacienteIdAsync(string pacienteId);
}
