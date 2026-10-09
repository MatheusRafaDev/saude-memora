using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using MongoDB.Bson;
using System.Runtime.CompilerServices;

namespace SaudeMemora.Infrastructure.Services;

public sealed class Cid10CatalogoService : ICid10CatalogoService
{
    private readonly ICid10CatalogoRepository _repository;

    public Cid10CatalogoService(ICid10CatalogoRepository repository)
    {
        _repository = repository;
    }

    public async Task<ImportacaoCatalogoResult> ImportarAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(stream);
        if (stream.CanSeek && stream.Length > 2L * 1024 * 1024 * 1024)
        {
            throw new InvalidDataException("O arquivo não pode superar 2 GB.");
        }

        var importadoEm = DateTime.UtcNow;
        var rows = CatalogoCsvReader.ReadAsync(stream, cancellationToken);
        await using var enumerator = rows.GetAsyncEnumerator(cancellationToken);
        var columns = await ReadColumnsAsync(enumerator, cancellationToken);
        var stats = new ImportStats();
        await _repository.ReplaceAllAsync(
            ParseRowsAsync(enumerator, columns, importadoEm, stats, cancellationToken),
            cancellationToken);
        return new ImportacaoCatalogoResult(stats.Imported, stats.Invalid, stats.Duplicates, importadoEm);
    }

    public Task<IReadOnlyList<Cid10Registro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
        => _repository.BuscarAsync(query, Math.Clamp(limit, 1, 100), cancellationToken);

    private static async Task<IReadOnlyDictionary<string, int>> ReadColumnsAsync(
        IAsyncEnumerator<string[]> enumerator,
        CancellationToken cancellationToken)
    {
        if (!await enumerator.MoveNextAsync())
        {
            throw new InvalidDataException("O arquivo deve conter cabeçalho e pelo menos um registro.");
        }

        return MapColumns(enumerator.Current);
    }

    private static Dictionary<string, int> MapColumns(string[] header)
    {
        var columns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < header.Length; index++)
        {
            var name = header[index].Trim().TrimStart('\uFEFF').ToLowerInvariant();
            var canonicalName = name switch
            {
                "cat" or "subcat" => "codigo",
                "descricao" => "descricao",
                "classif" => "categoria",
                _ => name
            };
            columns[canonicalName] = index;
        }

        foreach (var required in new[] { "codigo", "descricao" })
        {
            if (!columns.ContainsKey(required))
            {
                throw new InvalidDataException($"O cabeçalho deve conter {required}.");
            }
        }

        return columns;
    }

    private static Cid10Registro? ParseRegistro(string[] row, IReadOnlyDictionary<string, int> columns, DateTime importadoEm)
    {
        var codigo = GetValue(row, columns, "codigo").Trim();
        var descricao = GetValue(row, columns, "descricao").Trim();
        if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(descricao)) return null;

        return new Cid10Registro
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Codigo = codigo,
            CodigoNormalizado = Normalizar(codigo),
            Descricao = descricao,
            DescricaoNormalizada = Normalizar(descricao),
            Nivel = columns.ContainsKey("nivel") ? GetValue(row, columns, "nivel").Trim() : "subcategoria",
            Categoria = GetValue(row, columns, "categoria").Trim(),
            Origem = "LOCAL",
            ImportadoEm = importadoEm
        };
    }

    private static async IAsyncEnumerable<Cid10Registro> ParseRowsAsync(
        IAsyncEnumerator<string[]> rows,
        IReadOnlyDictionary<string, int> columns,
        DateTime importadoEm,
        ImportStats stats,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        while (await rows.MoveNextAsync())
        {
            cancellationToken.ThrowIfCancellationRequested();
            var registro = ParseRegistro(rows.Current, columns, importadoEm);
            if (registro is null)
            {
                stats.Invalid++;
                continue;
            }

            if (!stats.Codes.Add(registro.CodigoNormalizado))
            {
                stats.Duplicates++;
                continue;
            }

            stats.Imported++;
            yield return registro;
        }
    }

    private static string GetValue(string[] row, IReadOnlyDictionary<string, int> columns, string name)
        => columns.TryGetValue(name, out var index) && index < row.Length ? row[index] : string.Empty;

    private static string Normalizar(string value)
        => new string(value.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD)
            .Where(char.IsLetterOrDigit).ToArray());

    private sealed class ImportStats
    {
        public HashSet<string> Codes { get; } = new(StringComparer.OrdinalIgnoreCase);
        public int Imported { get; set; }
        public int Invalid { get; set; }
        public int Duplicates { get; set; }
    }
}
