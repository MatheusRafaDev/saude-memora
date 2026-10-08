using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface IChatHistoryRepository
{
    Task<IReadOnlyList<ChatHistorico>> GetAllByPacienteIdAsync(
        string pacienteId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatHistorico>> GetRecentByPacienteIdAsync(
        string pacienteId,
        int limit,
        CancellationToken cancellationToken = default);

    Task SaveExchangeAsync(
        string pacienteId,
        string pergunta,
        string resposta,
        CancellationToken cancellationToken = default);

    Task DeleteByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default);
}
