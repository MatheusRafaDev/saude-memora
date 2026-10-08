using System.Text.RegularExpressions;
using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public sealed class Cid10CatalogoRepository : ICid10CatalogoRepository
{
    private readonly IMongoCollection<Cid10Registro> _registros;

    public Cid10CatalogoRepository(MongoDbContext context)
    {
        _registros = context.Cid10Catalogo;
    }

    public async Task EnsureIndexesAsync(CancellationToken cancellationToken = default)
    {
        await _registros.Indexes.CreateOneAsync(
            new CreateIndexModel<Cid10Registro>(
                Builders<Cid10Registro>.IndexKeys.Ascending(r => r.CodigoNormalizado),
                new CreateIndexOptions { Name = "ix_cid10_codigo" }),
            cancellationToken: cancellationToken);
        await _registros.Indexes.CreateOneAsync(
            new CreateIndexModel<Cid10Registro>(
                Builders<Cid10Registro>.IndexKeys.Ascending(r => r.DescricaoNormalizada),
                new CreateIndexOptions { Name = "ix_cid10_descricao" }),
            cancellationToken: cancellationToken);
    }

    public Task ClearAllAsync(CancellationToken cancellationToken = default)
        => _registros.DeleteManyAsync(Builders<Cid10Registro>.Filter.Empty, cancellationToken: cancellationToken);

    public Task InsertBatchAsync(IEnumerable<Cid10Registro> registros, CancellationToken cancellationToken = default)
        => _registros.InsertManyAsync(registros, cancellationToken: cancellationToken);

    public async Task<IReadOnlyList<Cid10Registro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
    {
        var normalizado = Normalizar(query);
        var filter = Builders<Cid10Registro>.Filter.Or(
            Builders<Cid10Registro>.Filter.Regex(r => r.CodigoNormalizado, $"^{Regex.Escape(normalizado)}"),
            Builders<Cid10Registro>.Filter.Regex(r => r.DescricaoNormalizada, Regex.Escape(normalizado)));

        return await _registros
            .Find(filter)
            .Limit(limit)
            .Sort(Builders<Cid10Registro>.Sort.Ascending(r => r.Codigo))
            .ToListAsync(cancellationToken);
    }

    public Task<long> ContarAsync(CancellationToken cancellationToken = default)
        => _registros.CountDocumentsAsync(Builders<Cid10Registro>.Filter.Empty, cancellationToken: cancellationToken);

    private static string Normalizar(string value)
        => new string(value.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD)
            .Where(char.IsLetterOrDigit).ToArray());
}
