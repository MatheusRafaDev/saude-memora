using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class SistemaLogRepository : ISistemaLogRepository
{
    private readonly IMongoCollection<SistemaLog> _logs;

    public SistemaLogRepository(MongoDbContext context)
    {
        _logs = context.Logs;
    }

    public async Task CriarLogAsync(SistemaLog log)
    {
        await _logs.InsertOneAsync(log);
    }

    public async Task<List<SistemaLog>> ObterLogsAsync(int limit = 100)
    {
        return await _logs.Find(_ => true)
                          .SortByDescending(l => l.Timestamp)
                          .Limit(limit)
                          .ToListAsync();
    }

    public async Task DeleteByPacienteIdAsync(string pacienteId)
    {
        await _logs.DeleteManyAsync(l => l.PacienteId == pacienteId);
    }

    public static async Task EnsureIndexesAsync(MongoDbContext context, CancellationToken cancellationToken = default)
    {
        var logs = context.Logs;
        var indexKeysDefinition = Builders<SistemaLog>.IndexKeys.Ascending(l => l.Timestamp);
        var indexOptions = new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(30) };
        var indexModel = new CreateIndexModel<SistemaLog>(indexKeysDefinition, indexOptions);
        await logs.Indexes.CreateOneAsync(indexModel, cancellationToken: cancellationToken);
    }
}
