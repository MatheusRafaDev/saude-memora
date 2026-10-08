using System.Text.RegularExpressions;
using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public sealed class CnesCatalogoRepository : ICnesCatalogoRepository
{
    private readonly IMongoCollection<CnesRegistro> _registros;

    public CnesCatalogoRepository(MongoDbContext context)
    {
        _registros = context.CnesCatalogo;
    }

    public async Task EnsureIndexesAsync(CancellationToken cancellationToken = default)
    {
        await _registros.Indexes.CreateOneAsync(
            new CreateIndexModel<CnesRegistro>(
                Builders<CnesRegistro>.IndexKeys.Ascending(r => r.CodigoNormalizado),
                new CreateIndexOptions { Name = "ix_cnes_codigo" }),
            cancellationToken: cancellationToken);
        await _registros.Indexes.CreateOneAsync(
            new CreateIndexModel<CnesRegistro>(
                Builders<CnesRegistro>.IndexKeys.Ascending(r => r.DescricaoNormalizada),
                new CreateIndexOptions { Name = "ix_cnes_descricao" }),
            cancellationToken: cancellationToken);
    }

    public Task ClearAllAsync(CancellationToken cancellationToken = default)
        => _registros.DeleteManyAsync(Builders<CnesRegistro>.Filter.Empty, cancellationToken: cancellationToken);

    public Task InsertBatchAsync(IEnumerable<CnesRegistro> registros, CancellationToken cancellationToken = default)
        => _registros.InsertManyAsync(registros, cancellationToken: cancellationToken);

    public async Task<IReadOnlyList<CnesRegistro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
    {
        var normalizado = Normalizar(query);
        var filter = Builders<CnesRegistro>.Filter.Or(
            Builders<CnesRegistro>.Filter.Regex(r => r.CodigoNormalizado, $"^{Regex.Escape(normalizado)}"),
            Builders<CnesRegistro>.Filter.Regex(r => r.DescricaoNormalizada, Regex.Escape(normalizado)));

        return await _registros
            .Find(filter)
            .Limit(limit)
            .Sort(Builders<CnesRegistro>.Sort.Ascending(r => r.Codigo))
            .ToListAsync(cancellationToken);
    }

    public Task<long> ContarAsync(CancellationToken cancellationToken = default)
        => _registros.CountDocumentsAsync(Builders<CnesRegistro>.Filter.Empty, cancellationToken: cancellationToken);

    private static string Normalizar(string value)
        => new string(value.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD)
            .Where(char.IsLetterOrDigit).ToArray());
}
