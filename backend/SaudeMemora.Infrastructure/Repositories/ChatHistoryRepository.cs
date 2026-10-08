using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Data;

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

    public async Task SaveExchangeAsync(
        string pacienteId,
        string pergunta,
        string resposta,
        CancellationToken cancellationToken = default)
    {
        await _history.InsertOneAsync(
            new ChatHistorico
            {
                PacienteId = pacienteId,
                Pergunta = pergunta,
                Resposta = resposta,
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
    }
}
