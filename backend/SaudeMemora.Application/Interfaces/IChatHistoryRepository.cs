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

    Task<IReadOnlyList<ChatHistorico>> GetByPacienteIdAndDayAsync(
        string pacienteId,
        string chatDate,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(string Date, int MessageCount, DateTime UpdatedAt)>> GetChatDaysByPacienteIdAsync(
        string pacienteId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatHistorico>> GetRecentByPacienteAndSessionAsync(
        string pacienteId,
        string chatDate,
        string sessionId,
        int limit,
        CancellationToken cancellationToken = default);

    Task SaveExchangeAsync(
        string pacienteId,
        string chatDate,
        string sessionId,
        string pergunta,
        string resposta,
        IReadOnlyList<ChatHistoricoCitacao> citacoes,
        CancellationToken cancellationToken = default);

    Task DeleteByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default);
}
