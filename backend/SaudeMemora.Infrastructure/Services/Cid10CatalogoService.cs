using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Infrastructure.Services;

public sealed class Cid10CatalogoService : ICid10CatalogoService
{
    private const int BatchSize = 5_000;

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
        var códigos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var registros = new List<Cid10Registro>(BatchSize);
        var invalidos = 0;
        var duplicados = 0;

        await _repository.ClearAllAsync(cancellationToken);
        while (await enumerator.MoveNextAsync())
        {
            var registro = ParseRegistro(enumerator.Current, columns, importadoEm);
            if (registro is null)
            {
                invalidos++;
                continue;
            }

            if (!códigos.Add(registro.CodigoNormalizado))
            {
                duplicados++;
                continue;
            }

            registros.Add(registro);
            if (registros.Count == BatchSize)
            {
                await _repository.InsertBatchAsync(registros, cancellationToken);
                registros.Clear();
            }
        }

        if (registros.Count > 0)
        {
            await _repository.InsertBatchAsync(registros, cancellationToken);
        }

        return new ImportacaoCatalogoResult(códigos.Count, invalidos, duplicados, importadoEm);
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
            columns[header[index].Trim().ToLowerInvariant()] = index;
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
            Id = Guid.NewGuid().ToString("N"),
            Codigo = codigo,
            CodigoNormalizado = Normalizar(codigo),
            Descricao = descricao,
            DescricaoNormalizada = Normalizar(descricao),
            Nivel = GetValue(row, columns, "nivel").Trim(),
            Categoria = GetValue(row, columns, "categoria").Trim(),
            Origem = "LOCAL",
            ImportadoEm = importadoEm
        };
    }

    private static string GetValue(string[] row, IReadOnlyDictionary<string, int> columns, string name)
        => columns.TryGetValue(name, out var index) && index < row.Length ? row[index] : string.Empty;

    private static string Normalizar(string value)
        => new string(value.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD)
            .Where(char.IsLetterOrDigit).ToArray());
}
