using MongoDB.Driver;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public class AuditoriaAcessoRepository : IAuditoriaAcessoRepository
{
    private readonly IMongoCollection<AuditoriaAcesso> _auditoria;

    public AuditoriaAcessoRepository(MongoDbContext context)
    {
        _auditoria = context.AuditoriaAcessos;
    }

    public async Task RegistrarAsync(AuditoriaAcesso registro, CancellationToken cancellationToken = default)
    {
        await _auditoria.InsertOneAsync(registro, cancellationToken: cancellationToken);
    }

    public async Task<List<AuditoriaAcesso>> ObterPorPacienteAsync(
        string pacienteId,
        int limit = 100,
        CancellationToken cancellationToken = default)
    {
        return await _auditoria
            .Find(a => a.PacienteId == pacienteId)
            .SortByDescending(a => a.Timestamp)
            .Limit(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default)
    {
        await _auditoria.DeleteManyAsync(a => a.PacienteId == pacienteId, cancellationToken);
    }

    public static async Task EnsureIndexesAsync(MongoDbContext context, CancellationToken cancellationToken = default)
    {
        var auditoria = context.AuditoriaAcessos;

        var pacienteTimestamp = new CreateIndexModel<AuditoriaAcesso>(
            Builders<AuditoriaAcesso>.IndexKeys
                .Ascending(a => a.PacienteId)
                .Descending(a => a.Timestamp),
            new CreateIndexOptions { Name = "ix_auditoria_paciente_timestamp" });

        // Retenção: a trilha acompanha os dados do titular e expira com eles.
        // TTL acima do prazo legal de guarda aplicável deve ser ajustado por implantação.
        var ttl = new CreateIndexModel<AuditoriaAcesso>(
            Builders<AuditoriaAcesso>.IndexKeys.Ascending(a => a.Timestamp),
            new CreateIndexOptions { Name = "ix_auditoria_ttl", ExpireAfter = TimeSpan.FromDays(365) });

        await auditoria.Indexes.CreateManyAsync(new[] { pacienteTimestamp, ttl }, cancellationToken);
    }
}
