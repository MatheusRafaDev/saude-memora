using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Data;
using System.Globalization;

namespace SaudeMemora.Infrastructure.Repositories;

public class ChatHistoryRepository : IChatHistoryRepository
{
    private readonly IMongoCollection<ChatHistorico> _history;

    public ChatHistoryRepository(MongoDbContext context)
    {
        _history = context.ChatHistoricos;
    }

    public async Task<IReadOnlyList<ChatHistorico>> GetAllByPacienteIdAsync(
        string pacienteId,
        CancellationToken cancellationToken = default)
    {
        return await _history.Find(item => item.PacienteId == pacienteId)
            .SortBy(item => item.CriadoEm)
            .ThenBy(item => item.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ChatHistorico>> GetRecentByPacienteIdAsync(
        string pacienteId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var recent = await _history.Find(item => item.PacienteId == pacienteId)
            .SortByDescending(item => item.CriadoEm)
            .ThenByDescending(item => item.Id)
            .Limit(limit)
            .ToListAsync(cancellationToken);

        recent.Reverse();
        return recent;
    }

    public async Task<IReadOnlyList<ChatHistorico>> GetByPacienteIdAndDayAsync(
        string pacienteId,
        string chatDate,
        CancellationToken cancellationToken = default)
    {
        var start = DateTime.ParseExact(chatDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal);
        var end = start.AddDays(1);
        return await _history.Find(item => item.PacienteId == pacienteId
                && (item.DataChat == chatDate
                    || (item.DataChat == null && item.CriadoEm >= start && item.CriadoEm < end)))
            .SortBy(item => item.CriadoEm)
            .ThenBy(item => item.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<(string Date, int MessageCount, DateTime UpdatedAt)>> GetChatDaysByPacienteIdAsync(
        string pacienteId,
        CancellationToken cancellationToken = default)
    {
        var records = await _history.Find(item => item.PacienteId == pacienteId)
            .Project(item => new { item.DataChat, item.CriadoEm })
            .ToListAsync(cancellationToken);

        return records
            .GroupBy(item => string.IsNullOrWhiteSpace(item.DataChat)
                ? item.CriadoEm.ToUniversalTime().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : item.DataChat!)
            .Select(group => (Date: group.Key, MessageCount: group.Count(), UpdatedAt: group.Max(item => item.CriadoEm)))
            .OrderByDescending(item => item.Date, StringComparer.Ordinal)
            .ToArray();
    }

    public async Task<IReadOnlyList<ChatHistorico>> GetRecentByPacienteAndSessionAsync(
        string pacienteId,
        string chatDate,
        string sessionId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var recent = await _history.Find(item => item.PacienteId == pacienteId
                && item.DataChat == chatDate
                && item.SessaoId == sessionId)
            .SortByDescending(item => item.CriadoEm)
            .ThenByDescending(item => item.Id)
            .Limit(limit)
            .ToListAsync(cancellationToken);

        recent.Reverse();
        return recent;
    }

    public async Task SaveExchangeAsync(
        string pacienteId,
        string chatDate,
        string sessionId,
        string pergunta,
        string resposta,
        IReadOnlyList<ChatHistoricoCitacao> citacoes,
        CancellationToken cancellationToken = default)
    {
        await _history.InsertOneAsync(
            new ChatHistorico
            {
                PacienteId = pacienteId,
                DataChat = chatDate,
                SessaoId = sessionId,
                Pergunta = pergunta,
                Resposta = resposta,
                Citacoes = citacoes.ToList(),
                CriadoEm = DateTime.UtcNow
            },
            cancellationToken: cancellationToken);
    }

    public async Task DeleteByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default)
    {
        await _history.DeleteManyAsync(item => item.PacienteId == pacienteId, cancellationToken);
    }

    public static async Task EnsureIndexesAsync(
        MongoDbContext context,
        CancellationToken cancellationToken = default)
    {
        var index = new CreateIndexModel<ChatHistorico>(
            Builders<ChatHistorico>.IndexKeys
                .Ascending(item => item.PacienteId)
                .Ascending(item => item.CriadoEm),
            new CreateIndexOptions { Name = "ix_pacienteId_criadoEm" });

        await context.ChatHistoricos.Indexes.CreateOneAsync(index, cancellationToken: cancellationToken);

        var sessionIndex = new CreateIndexModel<ChatHistorico>(
            Builders<ChatHistorico>.IndexKeys
                .Ascending(item => item.PacienteId)
                .Ascending(item => item.SessaoId)
                .Ascending(item => item.CriadoEm),
            new CreateIndexOptions { Name = "ix_pacienteId_sessaoId_criadoEm" });

        await context.ChatHistoricos.Indexes.CreateOneAsync(sessionIndex, cancellationToken: cancellationToken);
    }
}
