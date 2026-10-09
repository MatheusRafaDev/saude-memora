using System.Runtime.CompilerServices;
using MongoDB.Bson;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Infrastructure.Services;

public sealed class CnesCatalogoService : ICnesCatalogoService
{
    private readonly ICnesCatalogoRepository _repository;

    public CnesCatalogoService(ICnesCatalogoRepository repository)
    {
        _repository = repository;
    }

    private static async IAsyncEnumerable<CnesRegistro> ParseCsvRowsAsync(
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

    private static async IAsyncEnumerable<CnesRegistro> ParseXmlRowsAsync(
        IAsyncEnumerable<Dictionary<string, string>> rows,
        DateTime importadoEm,
        ImportStats stats,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var row in rows.WithCancellation(cancellationToken))
        {
            var registro = ParseXmlRegistro(row, importadoEm);
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

    public async Task<ImportacaoCatalogoResult> ImportarAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(stream);
        if (stream.CanSeek && stream.Length > 2L * 1024 * 1024 * 1024)
        {
            throw new InvalidDataException("O arquivo não pode superar 2 GB.");
        }

        var prefix = new byte[4096];
        var bytesRead = await stream.ReadAsync(prefix, cancellationToken);
        var prefixText = System.Text.Encoding.UTF8.GetString(prefix, 0, bytesRead);
        var firstContentCharacter = prefixText.TrimStart('\uFEFF', ' ', '\t', '\r', '\n');
        var isXml = firstContentCharacter.StartsWith('<');
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }
        else
        {
            stream = new PrefixStream(prefix.AsMemory(0, bytesRead), stream);
        }

        return isXml
            ? await ImportarXmlAsync(stream, cancellationToken)
            : await ImportarCsvAsync(stream, cancellationToken);
    }

    public Task<IReadOnlyList<CnesRegistro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
        => _repository.BuscarAsync(query, Math.Clamp(limit, 1, 100), cancellationToken);

    private async Task<ImportacaoCatalogoResult> ImportarCsvAsync(Stream stream, CancellationToken cancellationToken)
    {
        var importadoEm = DateTime.UtcNow;
        var rows = CatalogoCsvReader.ReadAsync(stream, cancellationToken);
        await using var enumerator = rows.GetAsyncEnumerator(cancellationToken);
        var columns = await ReadColumnsAsync(enumerator, cancellationToken);
        var stats = new ImportStats();
        await _repository.ReplaceAllAsync(
            ParseCsvRowsAsync(enumerator, columns, importadoEm, stats, cancellationToken),
            cancellationToken);
        return new ImportacaoCatalogoResult(stats.Imported, stats.Invalid, stats.Duplicates, importadoEm);
    }

    private async Task<ImportacaoCatalogoResult> ImportarXmlAsync(Stream stream, CancellationToken cancellationToken)
    {
        var importadoEm = DateTime.UtcNow;
        var stats = new ImportStats();
        await _repository.ReplaceAllAsync(
            ParseXmlRowsAsync(CatalogoXmlReader.ReadRowsAsync(stream, cancellationToken), importadoEm, stats, cancellationToken),
            cancellationToken);
        return new ImportacaoCatalogoResult(stats.Imported, stats.Invalid, stats.Duplicates, importadoEm);
    }

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
                "co_cnes" => "codigo",
                "no_razao_social" => "descricao",
                "ds_atividade" => "categoria",
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

    private static CnesRegistro? ParseRegistro(string[] row, IReadOnlyDictionary<string, int> columns, DateTime importadoEm)
    {
        var codigo = GetValue(row, columns, "codigo").Trim();
        var descricao = GetValue(row, columns, "descricao").Trim();
        if (!IsValidCodigo(codigo) || string.IsNullOrWhiteSpace(descricao)) return null;

        return new CnesRegistro
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Codigo = codigo,
            CodigoNormalizado = Normalizar(codigo),
            Descricao = descricao,
            DescricaoNormalizada = Normalizar(descricao),
            Categoria = GetValue(row, columns, "categoria").Trim(),
            Origem = "LOCAL",
            ImportadoEm = importadoEm
        };
    }

    private static CnesRegistro? ParseXmlRegistro(IReadOnlyDictionary<string, string> row, DateTime importadoEm)
    {
        var codigo = row.GetValueOrDefault("CO_CNES")?.Trim() ?? string.Empty;
        var descricao = row.GetValueOrDefault("NO_RAZAO_SOCIAL")?.Trim() ?? string.Empty;
        if (!IsValidCodigo(codigo) || string.IsNullOrWhiteSpace(descricao)) return null;

        return new CnesRegistro
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Codigo = codigo,
            CodigoNormalizado = Normalizar(codigo),
            Descricao = descricao,
            DescricaoNormalizada = Normalizar(descricao),
            Categoria = row.GetValueOrDefault("DS_ATIVIDADE")?.Trim() ?? string.Empty,
            Origem = "LOCAL",
            ImportadoEm = importadoEm
        };
    }

    private static bool IsValidCodigo(string codigo)
        => codigo.Length == 7 && codigo.All(char.IsAsciiDigit);

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

    private sealed class PrefixStream : Stream
    {
        private readonly ReadOnlyMemory<byte> _prefix;
        private readonly Stream _inner;
        private int _offset;

        public PrefixStream(ReadOnlyMemory<byte> prefix, Stream inner)
        {
            _prefix = prefix;
            _inner = inner;
        }

        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            var copied = CopyPrefix(buffer.AsSpan(offset, count));
            return copied > 0 ? copied : _inner.Read(buffer, offset, count);
        }

        public override int Read(Span<byte> buffer)
        {
            var copied = CopyPrefix(buffer);
            return copied > 0 ? copied : _inner.Read(buffer);
        }

        public override async ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default)
        {
            var copied = CopyPrefix(buffer.Span);
            return copied > 0 ? copied : await _inner.ReadAsync(buffer, cancellationToken);
        }

        public override Task<int> ReadAsync(
            byte[] buffer,
            int offset,
            int count,
            CancellationToken cancellationToken)
        {
            var copied = CopyPrefix(buffer.AsSpan(offset, count));
            return copied > 0
                ? Task.FromResult(copied)
                : _inner.ReadAsync(buffer, offset, count, cancellationToken);
        }

        public override void Flush() { }
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        private int CopyPrefix(Span<byte> destination)
        {
            var remaining = _prefix.Length - _offset;
            if (remaining <= 0 || destination.IsEmpty) return 0;

            var count = Math.Min(remaining, destination.Length);
            _prefix.Span.Slice(_offset, count).CopyTo(destination);
            _offset += count;
            return count;
        }
    }
}
