using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Domain.Interfaces;

public interface IAuditoriaAcessoRepository
{
    Task RegistrarAsync(AuditoriaAcesso registro, CancellationToken cancellationToken = default);

    Task<List<AuditoriaAcesso>> ObterPorPacienteAsync(
        string pacienteId,
        int limit = 100,
        CancellationToken cancellationToken = default);

    Task DeleteByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default);
}
