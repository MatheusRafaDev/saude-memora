using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Api.Services;

public interface IPatientDocumentSearch
{
    Task<IReadOnlyList<PatientDocumentExcerpt>> SearchAsync(
        string authenticatedPatientId,
        string query,
        string? documentType,
        int limit,
        CancellationToken cancellationToken);
}

/// <summary>
/// Current MongoDB-compatible search adapter. It loads only the authenticated patient's
/// records, then ranks locally; a vector adapter can replace this behind the interface.
/// </summary>
public sealed class LexicalPatientDocumentSearch(IDocumentRepository documentRepository) : IPatientDocumentSearch
{
    public async Task<IReadOnlyList<PatientDocumentExcerpt>> SearchAsync(
        string authenticatedPatientId,
        string query,
        string? documentType,
        int limit,
        CancellationToken cancellationToken)
    {
        var documents = await documentRepository.GetAllForChatByPacienteIdAsync(authenticatedPatientId, cancellationToken);
        var ownedReadyDocuments = documents.Where(document =>
            string.Equals(document.PacienteId, authenticatedPatientId, StringComparison.Ordinal)
            && string.Equals(document.Status, "pronto", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(document.Id));

        return PatientChatTools.RankDocuments(ownedReadyDocuments, query, documentType, limit);
    }
}

/// <summary>
/// Local, read-only tools exposed to the Groq model. Authorization always comes from
/// the authenticated request; neither tool accepts a patient or document identifier.
/// </summary>
public sealed class PatientChatTools
{
    public const string SearchDocumentsName = "buscar_documentos_relevantes";
    public const string GetMedicalRecordName = "consultar_ficha_medica";
    private const int MaxResults = 4;
    private const int MaxExcerptCharacters = 1500;
    private const int MaxQueryCharacters = 300;

    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "a", "ao", "aos", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "me", "meu", "minha",
        "no", "nos", "na", "nas", "o", "os", "para", "por", "qual", "quais", "que", "se", "sobre", "um", "uma"
    };

    private static readonly HashSet<string> AllowedDocumentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "exame", "receita", "laudo", "atestado", "encaminhamento", "vacina", "clinico"
    };

    private static readonly Regex WordPattern = new(@"\p{L}[\p{L}\p{N}]*", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static readonly object[] Definitions =
    [
        new
        {
            type = "function",
            function = new
            {
                name = SearchDocumentsName,
                description = "Busca trechos relevantes nos documentos processados do paciente autenticado. Use quando a pergunta depender dos registros salvos.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        query = new { type = "string", minLength = 2, maxLength = MaxQueryCharacters, description = "Termos de saúde ou de documento que devem ser pesquisados." },
                        tipo = new { type = "string", @enum = AllowedDocumentTypes.OrderBy(value => value).ToArray(), description = "Filtro opcional pelo tipo de documento." },
                        limite = new { type = "integer", minimum = 1, maximum = MaxResults, description = "Quantidade máxima de documentos relevantes." }
                    },
                    required = new[] { "query" },
                    additionalProperties = false
                }
            }
        },
        new
        {
            type = "function",
            function = new
            {
                name = GetMedicalRecordName,
                description = "Consulta campos preenchidos da ficha médica do paciente autenticado, como alergias e medicamentos contínuos. Não recebe identificadores.",
                parameters = new
                {
                    type = "object",
                    properties = new Dictionary<string, object>(),
                    additionalProperties = false
                }
            }
        }
    ];

    private readonly IPatientDocumentSearch _documentSearch;
    private readonly IFichaMedicaRepository _medicalRecordRepository;

    public PatientChatTools(IPatientDocumentSearch documentSearch, IFichaMedicaRepository medicalRecordRepository)
    {
        _documentSearch = documentSearch;
        _medicalRecordRepository = medicalRecordRepository;
    }

    public async Task<ChatToolExecutionResult> ExecuteAsync(
        string toolName,
        string argumentsJson,
        string authenticatedPatientId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(authenticatedPatientId))
            return Error("Usuário não autenticado.");

        if (argumentsJson.Length > 4096)
            return Error("Argumentos excedem o limite permitido.");

        JsonDocument arguments;
        try
        {
            arguments = JsonDocument.Parse(argumentsJson);
        }
        catch (JsonException)
        {
            return Error("Argumentos inválidos.");
        }

        using (arguments)
        {
            if (arguments.RootElement.ValueKind != JsonValueKind.Object)
                return Error("Os argumentos devem ser um objeto JSON.");

            return toolName switch
            {
                SearchDocumentsName => await SearchDocumentsAsync(arguments.RootElement, authenticatedPatientId, cancellationToken),
                GetMedicalRecordName => await GetMedicalRecordAsync(arguments.RootElement, authenticatedPatientId, cancellationToken),
                _ => Error("Ferramenta indisponível.")
            };
        }
    }

    public static string CreateSearchArguments(string query, int limit = MaxResults) =>
        JsonSerializer.Serialize(new { query = query.Length > MaxQueryCharacters ? query[..MaxQueryCharacters] : query, limite = limit });

    public static bool ShouldLookupMedicalRecord(string question)
    {
        var normalized = Normalize(question);
        return new[]
        {
            "ficha", "alergia", "sanguineo", "doenca cronica", "medicamento continuo", "cirurgia",
            "historico familiar", "habito", "fuma", "bebe", "doador", "condicao"
        }.Any(keyword => normalized.Contains(keyword, StringComparison.Ordinal));
    }

    private async Task<ChatToolExecutionResult> SearchDocumentsAsync(
        JsonElement arguments,
        string authenticatedPatientId,
        CancellationToken cancellationToken)
    {
        if (HasUnexpectedProperties(arguments, "query", "tipo", "limite"))
            return Error("Argumentos de busca inválidos.");

        if (!arguments.TryGetProperty("query", out var queryElement)
            || queryElement.ValueKind != JsonValueKind.String)
            return Error("A busca precisa conter uma pergunta válida.");

        var query = queryElement.GetString()?.Trim() ?? string.Empty;
        if (query.Length is < 2 or > MaxQueryCharacters)
            return Error("A consulta deve ter entre 2 e 300 caracteres.");

        var limit = MaxResults;
        if (arguments.TryGetProperty("limite", out var limitElement))
        {
            if (limitElement.ValueKind != JsonValueKind.Number || !limitElement.TryGetInt32(out limit) || limit is < 1 or > MaxResults)
                return Error("O limite deve ser um número entre 1 e 4.");
        }

        string? documentType = null;
        if (arguments.TryGetProperty("tipo", out var typeElement))
        {
            if (typeElement.ValueKind != JsonValueKind.String)
                return Error("O tipo de documento é inválido.");
            documentType = typeElement.GetString();
            if (documentType is null || !AllowedDocumentTypes.Contains(documentType))
                return Error("O tipo de documento não é permitido.");
        }

        var matches = await _documentSearch.SearchAsync(authenticatedPatientId, query, documentType, limit, cancellationToken);

        var content = JsonSerializer.Serialize(new
        {
            resultados = matches.Select(document => new
            {
                id = document.Id,
                titulo = document.Title,
                data = document.Date,
                tipo = document.Type,
                trecho = document.Excerpt
            }).ToArray()
        });

        return new ChatToolExecutionResult(content, matches);
    }

    private async Task<ChatToolExecutionResult> GetMedicalRecordAsync(
        JsonElement arguments,
        string authenticatedPatientId,
        CancellationToken cancellationToken)
    {
        if (arguments.EnumerateObject().Any())
            return Error("Esta consulta não aceita parâmetros.");

        var record = await _medicalRecordRepository.GetByPacienteIdAsync(authenticatedPatientId);
        if (record is null || !string.Equals(record.PacienteId, authenticatedPatientId, StringComparison.Ordinal))
            return new ChatToolExecutionResult("{\"mensagem\":\"Nenhum dado foi encontrado na ficha médica.\"}", Array.Empty<PatientDocumentExcerpt>());

        var fields = new Dictionary<string, object?>();
        AddIfPresent(fields, "tipoSanguineo", record.TipoSanguineo);
        AddIfPresent(fields, "alergias", record.Alergias);
        AddIfPresent(fields, "doencasCronicas", record.DoencasCronicas);
        AddIfPresent(fields, "medicamentosContinuos", record.MedicamentosContinuos);
        AddIfPresent(fields, "historicoFamiliar", record.HistoricoFamiliar);
        AddIfPresent(fields, "cirurgias", record.Cirurgias);
        AddIfPresent(fields, "habitosGerais", record.HabitosGerais);
        AddIfPresent(fields, "observacoes", record.Observacoes);
        AddIfPresent(fields, "outrasDoencas", record.OutrasDoencas);
        AddIfPresent(fields, "fuma", record.Fuma);
        AddIfPresent(fields, "bebe", record.Bebe);
        AddIfPresent(fields, "doadorOrgaos", record.DoadorOrgaos);
        if (record.Condicoes is { Count: > 0 })
            fields["condicoes"] = record.Condicoes.Select(condition => new
            {
                nome = condition.Nome,
                possui = condition.Tem,
                detalhes = condition.Detalhes
            }).ToArray();

        var content = fields.Count == 0
            ? "{\"mensagem\":\"A ficha médica não contém campos preenchidos.\"}"
            : JsonSerializer.Serialize(fields);
        return new ChatToolExecutionResult(content, Array.Empty<PatientDocumentExcerpt>());
    }

    internal static IReadOnlyList<PatientDocumentExcerpt> RankDocuments(
        IEnumerable<RegistroDocumento> source,
        string query,
        string? documentType,
        int limit)
    {
        var terms = GetTerms(query);
        var matches = source
            .Where(document => documentType is null || string.Equals(document.Tipo, documentType, StringComparison.OrdinalIgnoreCase))
            .Select(document =>
            {
                var titleAndType = Join(document.Titulo, document.Tipo, document.NomeExame, document.TipoExame);
                var summary = Join(document.Resumo, document.Diagnostico, document.Conclusoes, document.Resultado);
                var details = Join(
                    document.Conteudo,
                    document.Observacoes,
                    string.Join(" ", (document.Medicamentos ?? []).Select(item => Join(item.Nome, item.Dosagem, item.Horario))),
                    string.Join(" ", (document.ResultadosExame ?? []).Select(item => Join(item.Nome, item.ValorTexto, item.Unidade, item.ReferenciaTexto))),
                    document.TextoExtraido);
                var score = MatchScore(titleAndType, terms) * 4
                    + MatchScore(summary, terms) * 2
                    + MatchScore(details, terms);
                return new { Document = document, Score = score, TitleAndType = titleAndType, Summary = summary, Details = details };
            })
            .Where(item => terms.Count == 0 || item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenByDescending(item => ParseDocumentDate(item.Document))
            .Take(limit)
            .Select(item => new PatientDocumentExcerpt(
                item.Document.Id!,
                Trim(item.Document.Titulo, 180),
                Trim(item.Document.Data, 40),
                Trim(item.Document.Tipo, 40),
                BuildExcerpt(item.Document, query, item.TitleAndType, item.Summary, item.Details)))
            .ToArray();

        return matches;
    }

    private static string BuildExcerpt(RegistroDocumento document, string query, string titleAndType, string summary, string details)
    {
        var builder = new StringBuilder();
        AddLine(builder, "Título e tipo", titleAndType, 260);
        AddLine(builder, "Data", document.Data, 40);
        AddLine(builder, "Resumo e conclusão", summary, 650);
        AddLine(builder, "Conteúdo", SelectRelevantParagraphs(details, query), MaxExcerptCharacters);
        return Trim(builder.ToString(), MaxExcerptCharacters);
    }

    private static string SelectRelevantParagraphs(string text, string query)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var terms = GetTerms(query);
        var paragraphs = Regex.Split(text, @"[\r\n]+|(?<=[.!?])\s+")
            .Select(paragraph => paragraph.Trim())
            .Where(paragraph => paragraph.Length > 0)
            .Select(paragraph => new
            {
                Text = Trim(paragraph, 450),
                Score = MatchScore(paragraph, terms)
            })
            .OrderByDescending(paragraph => paragraph.Score)
            .ThenBy(paragraph => paragraph.Text.Length)
            .Take(3)
            .ToArray();
        return string.Join("\n", paragraphs.Select(paragraph => paragraph.Text));
    }

    private static IReadOnlyList<string> GetTerms(string text) => WordPattern.Matches(Normalize(text))
        .Select(match => match.Value)
        .Where(term => term.Length > 2 && !StopWords.Contains(term))
        .Distinct(StringComparer.Ordinal)
        .Take(12)
        .ToArray();

    private static int MatchScore(string text, IReadOnlyList<string> terms)
    {
        if (terms.Count == 0 || string.IsNullOrWhiteSpace(text)) return 0;
        var normalized = Normalize(text);
        return terms.Count(term => normalized.Contains(term, StringComparison.Ordinal));
    }

    private static string Normalize(string text)
    {
        var decomposed = text.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                builder.Append(character);
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static DateTime ParseDocumentDate(RegistroDocumento document) =>
        DateTime.TryParse(document.Data, CultureInfo.GetCultureInfo("pt-BR"), DateTimeStyles.AssumeUniversal, out var date)
            ? date
            : document.CriadoEm;

    private static bool HasUnexpectedProperties(JsonElement value, params string[] allowed) =>
        value.EnumerateObject().Any(property => !allowed.Contains(property.Name, StringComparer.Ordinal));

    private static string Join(params string?[] values) => string.Join(" ", values.Where(value => !string.IsNullOrWhiteSpace(value)));

    private static string Trim(string? value, int maxCharacters)
    {
        var normalized = value?.Trim() ?? string.Empty;
        return normalized.Length <= maxCharacters ? normalized : normalized[..maxCharacters];
    }

    private static void AddLine(StringBuilder builder, string label, string? value, int maxCharacters)
    {
        var trimmed = Trim(value, maxCharacters);
        if (!string.IsNullOrWhiteSpace(trimmed))
            builder.Append(label).Append(": ").AppendLine(trimmed);
    }

    private static void AddIfPresent(IDictionary<string, object?> fields, string name, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value)) fields[name] = value;
    }

    private static void AddIfPresent(IDictionary<string, object?> fields, string name, IReadOnlyCollection<string>? values)
    {
        if (values is { Count: > 0 }) fields[name] = values;
    }

    private static void AddIfPresent(IDictionary<string, object?> fields, string name, bool value)
    {
        if (value) fields[name] = value;
    }

    private static ChatToolExecutionResult Error(string message) => new(
        JsonSerializer.Serialize(new { erro = message }),
        Array.Empty<PatientDocumentExcerpt>());
}
