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
}
