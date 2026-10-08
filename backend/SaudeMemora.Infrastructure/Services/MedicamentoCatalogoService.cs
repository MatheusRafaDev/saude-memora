using System.Text;
using MongoDB.Bson;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Infrastructure.Services;

public sealed class MedicamentoCatalogoService : IMedicamentoCatalogoService
{
    private const int MaxFileSizeBytes = 64 * 1024 * 1024;
    private const int MaxRows = 250_000;
    private static readonly char[] Separadores = [';', '\t', ','];

    private readonly IMedicamentoCatalogoRepository _repository;

    public MedicamentoCatalogoService(IMedicamentoCatalogoRepository repository)
    {
        _repository = repository;
    }

    public async Task<ImportacaoCatalogoResult> ImportarAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        if (stream is null || stream.CanSeek && stream.Length > MaxFileSizeBytes)
        {
            throw new InvalidDataException($"O arquivo deve ser menor que {MaxFileSizeBytes / 1024 / 1024} MB.");
        }

        var bytes = await ReadAllBytesAsync(stream, cancellationToken);
        var encoding = DetectEncoding(bytes);
        var text = encoding.GetString(bytes);
        var lines = ParseCsvRows(text)
            .Where(row => row.Length > 0 && row.Any(value => !string.IsNullOrWhiteSpace(value)))
            .ToList();

        if (lines.Count < 2)
        {
            throw new InvalidDataException("O arquivo deve conter cabeçalho e pelo menos um registro.");
        }

        if (lines.Count - 1 > MaxRows)
        {
            throw new InvalidDataException($"O arquivo não pode conter mais de {MaxRows} registros.");
        }

        var header = lines[0];
        var columns = MapColumns(header);
        var medicamentos = new List<MedicamentoCatalogo>();
        var invalidos = 0;
        var duplicados = 0;
        var produtos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var importadoEm = DateTime.UtcNow;

        foreach (var values in lines.Skip(1))
        {
            var registro = ParseRegistro(values, columns, importadoEm);
            if (registro is null)
            {
                invalidos++;
                continue;
            }

            if (!produtos.Add($"{registro.ProcessoAnvisa}\u001f{registro.NomeNormalizado}"))
            {
                duplicados++;
                continue;
            }

            medicamentos.Add(registro);
        }

        await _repository.ReplaceAllAsync(medicamentos, cancellationToken);
        return new ImportacaoCatalogoResult(medicamentos.Count, invalidos, duplicados, importadoEm);
    }

    public Task<IReadOnlyList<MedicamentoCatalogo>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
        => _repository.BuscarAsync(query, Math.Clamp(limit, 1, 100), cancellationToken);

    private static Dictionary<string, int> MapColumns(IReadOnlyList<string> header)
    {
        var columns = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < header.Count; index++)
        {
            var name = Normalizar(header[index]);
            if (!string.IsNullOrWhiteSpace(name))
            {
                columns[name] = index;
            }
        }

        MapAlias(columns, "numprocesso", "numprocesso", "numeroprocesso", "processoanvisa");
        MapAlias(columns, "nomeproduto", "nomeproduto");
        MapAlias(columns, "descricao", "descricao");
        MapAlias(columns, "principioativo", "principioativo", "substanciaativa");
        MapAlias(columns, "fabricante", "fabricante", "empresadetentoraregistro", "empresadetentorregistro");
        MapAlias(columns, "tipoproduto", "tipoproduto", "categoriaregulatoria");
        MapAlias(columns, "classterapeutica", "classterapeutica");
        MapAlias(columns, "registroanvisa", "registroanvisa", "numeroregistroproduto");
        MapAlias(columns, "situacaoregistro", "situacaoregistro");

        if (!columns.ContainsKey("numprocesso") ||
            !columns.ContainsKey("nomeproduto") ||
            (!columns.ContainsKey("descricao") && !columns.ContainsKey("principioativo")))
        {
            throw new InvalidDataException("O cabeçalho deve conter número de processo, nome do produto e descrição ou princípio ativo.");
        }

        return columns;
    }

    private static MedicamentoCatalogo? ParseRegistro(
        IReadOnlyList<string> values,
        IReadOnlyDictionary<string, int> columns,
        DateTime importadoEm)
    {
        if (values.Count == 0 || values.All(string.IsNullOrWhiteSpace))
        {
            return null;
        }

        var processo = GetValue(values, columns, "numprocesso").Trim();
        var nome = GetValue(values, columns, "nomeproduto").Trim();
        var registro = GetValue(values, columns, "registroanvisa").Trim();
        var principioAtivo = GetValue(values, columns, "principioativo").Trim();
        var classeTerapeutica = GetValue(values, columns, "classterapeutica").Trim();
        var descricao = GetValue(values, columns, "descricao").Trim();
        if (string.IsNullOrWhiteSpace(descricao))
        {
            descricao = string.Join(" ", new[]
            {
                string.IsNullOrWhiteSpace(principioAtivo) ? null : $"Princípio ativo: {principioAtivo}.",
                string.IsNullOrWhiteSpace(classeTerapeutica) ? null : $"Classe terapêutica: {classeTerapeutica}."
            }.Where(value => value is not null));
        }

        if ((string.IsNullOrWhiteSpace(processo) && string.IsNullOrWhiteSpace(registro)) ||
            string.IsNullOrWhiteSpace(nome) ||
            string.IsNullOrWhiteSpace(descricao))
        {
            return null;
        }

        var normalized = Normalizar(nome);
        return new MedicamentoCatalogo
        {
            Id = ObjectId.GenerateNewId().ToString(),
            ProcessoAnvisa = string.IsNullOrWhiteSpace(processo) ? registro : processo,
            Nome = nome,
            NomeNormalizado = normalized,
            PrincipioAtivo = principioAtivo,
            PrincipioAtivoNormalizado = Normalizar(principioAtivo),
            Descricao = descricao,
            Fabricante = GetValue(values, columns, "fabricante").Trim(),
            TipoProduto = GetValue(values, columns, "tipoproduto").Trim(),
            ClasseTerapeutica = classeTerapeutica,
            RegistroAnvisa = registro,
            SituacaoRegistro = GetValue(values, columns, "situacaoregistro").Trim(),
            ImportadoEm = importadoEm
        };
    }

    private static void MapAlias(IDictionary<string, int> columns, string target, params string[] aliases)
    {
        foreach (var alias in aliases)
        {
            if (columns.TryGetValue(alias, out var index))
            {
                columns[target] = index;
                return;
            }
        }
    }

    private static string GetValue(IReadOnlyList<string> values, IReadOnlyDictionary<string, int> columns, string column)
        => columns.TryGetValue(column, out var index) && index < values.Count ? values[index] : string.Empty;

    private static IReadOnlyList<string> ParseLine(string line)
    {
        var separator = Separadores.FirstOrDefault(character => line.Contains(character));
        return separator == default
            ? new[] { line }
            : line.Split(separator, StringSplitOptions.None);
    }

    private static async Task<byte[]> ReadAllBytesAsync(Stream stream, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, cancellationToken);
        return buffer.ToArray();
    }

    private static Encoding DetectEncoding(byte[] bytes)
    {
        if (bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF)
        {
            return Encoding.UTF8;
        }

        if (bytes.Length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xFE)
        {
            return Encoding.Unicode;
        }

        try
        {
            _ = new UTF8Encoding(false, true).GetString(bytes);
            return Encoding.UTF8;
        }
        catch (DecoderFallbackException)
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            return Encoding.GetEncoding("windows-1252");
        }
    }

    private static List<string[]> ParseCsvRows(string text)
    {
        var rows = new List<string[]>();
        var row = new List<string>();
        var field = new StringBuilder();
        var quoted = false;

        for (var index = 0; index < text.Length; index++)
        {
            var character = text[index];
            if (character == '"')
            {
                if (quoted && index + 1 < text.Length && text[index + 1] == '"')
                {
                    field.Append('"');
                    index++;
                }
                else
                {
                    quoted = !quoted;
                }
            }
            else if (character is '\r' or '\n')
            {
                if (character == '\r' && index + 1 < text.Length && text[index + 1] == '\n')
                {
                    index++;
                }

                if (!quoted)
                {
                    row.Add(field.ToString());
                    rows.Add(row.ToArray());
                    row.Clear();
                    field.Clear();
                }
                else
                {
                    field.Append(' ');
                }
            }
            else
            {
                var separator = Separadores.FirstOrDefault(separator => separator == character && !quoted);
                if (separator != default)
                {
                    row.Add(field.ToString());
                    field.Clear();
                }
                else
                {
                    field.Append(character);
                }
            }
        }

        if (field.Length > 0 || row.Count > 0)
        {
            row.Add(field.ToString());
            rows.Add(row.ToArray());
        }

        return rows;
    }

    private static string Normalizar(string value)
    {
        var normalized = value.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
        var builder = new StringBuilder();
        foreach (var character in normalized)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(character);
            }
        }

        return builder.ToString();
    }
}
