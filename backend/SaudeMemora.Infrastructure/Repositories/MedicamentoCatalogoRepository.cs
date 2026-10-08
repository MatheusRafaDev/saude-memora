using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Infrastructure.Repositories;

public sealed class MedicamentoCatalogoRepository : IMedicamentoCatalogoRepository
{
    private readonly IMongoCollection<MedicamentoCatalogo> _medicamentos;

    public MedicamentoCatalogoRepository(MongoDbContext context)
    {
        _medicamentos = context.MedicamentosCatalogo;
    }

    public async Task EnsureIndexesAsync(CancellationToken cancellationToken = default)
    {
        var nomeIndex = new CreateIndexModel<MedicamentoCatalogo>(
            Builders<MedicamentoCatalogo>.IndexKeys.Ascending(m => m.NomeNormalizado),
            new CreateIndexOptions { Name = "ix_medicamento_nome_normalizado" });
        var principioAtivoIndex = new CreateIndexModel<MedicamentoCatalogo>(
            Builders<MedicamentoCatalogo>.IndexKeys.Ascending(m => m.PrincipioAtivoNormalizado),
            new CreateIndexOptions { Name = "ix_medicamento_principio_ativo_normalizado" });
        var processoNomeIndex = new CreateIndexModel<MedicamentoCatalogo>(
            Builders<MedicamentoCatalogo>.IndexKeys
                .Ascending(m => m.ProcessoAnvisa)
                .Ascending(m => m.NomeNormalizado),
            new CreateIndexOptions { Name = "ix_medicamento_processo_nome", Unique = true });

        await _medicamentos.Indexes.CreateOneAsync(nomeIndex, cancellationToken: cancellationToken);
        await _medicamentos.Indexes.CreateOneAsync(principioAtivoIndex, cancellationToken: cancellationToken);

        var indexes = await _medicamentos.Indexes.ListAsync(cancellationToken);
        var existingIndexes = await indexes.ToListAsync(cancellationToken);
        if (existingIndexes.Any(index => index.GetValue("name", "").AsString == "ix_medicamento_processo_anvisa"))
        {
            await _medicamentos.Indexes.DropOneAsync("ix_medicamento_processo_anvisa", cancellationToken);
        }

        await _medicamentos.Indexes.CreateOneAsync(processoNomeIndex, cancellationToken: cancellationToken);
    }

    public async Task ReplaceAllAsync(IEnumerable<MedicamentoCatalogo> medicamentos, CancellationToken cancellationToken = default)
    {
        var registros = medicamentos.ToList();
        if (registros.Count == 0)
        {
            await _medicamentos.DeleteManyAsync(Builders<MedicamentoCatalogo>.Filter.Empty, cancellationToken: cancellationToken);
            return;
        }

        await _medicamentos.DeleteManyAsync(Builders<MedicamentoCatalogo>.Filter.Empty, cancellationToken: cancellationToken);
        if (registros.Count > 0)
        {
            await _medicamentos.InsertManyAsync(registros, cancellationToken: cancellationToken);
        }
    }

    public async Task<IReadOnlyList<MedicamentoCatalogo>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Array.Empty<MedicamentoCatalogo>();
        }

        var normalizado = Normalizar(query);
        var filter = Builders<MedicamentoCatalogo>.Filter.Or(
            Builders<MedicamentoCatalogo>.Filter.Regex(m => m.NomeNormalizado, System.Text.RegularExpressions.Regex.Escape(normalizado)),
            Builders<MedicamentoCatalogo>.Filter.Regex(m => m.PrincipioAtivoNormalizado, System.Text.RegularExpressions.Regex.Escape(normalizado)));

        return await _medicamentos
            .Find(filter)
            .Limit(limit)
            .Sort(Builders<MedicamentoCatalogo>.Sort
                .Ascending(m => m.SituacaoRegistro)
                .Ascending(m => m.Nome))
            .ToListAsync(cancellationToken);
    }

    public Task<long> ContarAsync(CancellationToken cancellationToken = default)
        => _medicamentos.CountDocumentsAsync(Builders<MedicamentoCatalogo>.Filter.Empty, cancellationToken: cancellationToken);

    private static string Normalizar(string value)
    {
        var text = value.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
        return new string(text.Where(c => !char.IsPunctuation(c) && !char.IsSymbol(c)).ToArray());
    }
}
