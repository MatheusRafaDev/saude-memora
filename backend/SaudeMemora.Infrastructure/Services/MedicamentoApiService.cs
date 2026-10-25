using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Infrastructure.Services;

public sealed class MedicamentoApiService : IMedicamentoApiService
{
    private readonly HttpClient _httpClient;
    private readonly BularioApiOptions _options;
    private readonly ILogger<MedicamentoApiService> _logger;
    private readonly IMedicamentoCatalogoRepository? _catalogoRepository;
    private readonly IConfiguration? _configuration;
    private readonly IHttpClientFactory? _httpClientFactory;

    public MedicamentoApiService(
        HttpClient httpClient,
        BularioApiOptions options,
        ILogger<MedicamentoApiService> logger,
        IMedicamentoCatalogoRepository? catalogoRepository = null,
        IConfiguration? configuration = null,
        IHttpClientFactory? httpClientFactory = null)
    {
        _httpClient = httpClient;
        _options = options;
        _logger = logger;
        _catalogoRepository = catalogoRepository;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<MedicamentoDescricao?> BuscarDescricaoAsync(string nome, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(nome))
            return null;

        var nomeOriginal = nome.Trim();
        var nomeLimpo = LimparNomeMedicamento(nomeOriginal);

        // 1. Tentar consulta na API oficial da ANVISA
        try
        {
            var searchUrl = $"api/consulta/bulario?count={_options.PageSize}&filter%5BnomeProduto%5D={Uri.EscapeDataString(nomeOriginal)}&page=1";
            using var searchResponse = await _httpClient.GetAsync(searchUrl, cancellationToken);
            if (searchResponse.IsSuccessStatusCode)
            {
                using var searchDocument = JsonDocument.Parse(await searchResponse.Content.ReadAsStringAsync(cancellationToken));
                if (searchDocument.RootElement.TryGetProperty("content", out var content) &&
                    content.ValueKind == JsonValueKind.Array &&
                    content.GetArrayLength() > 0)
                {
                    var firstResult = content[0];
                    if (firstResult.TryGetProperty("numProcesso", out var processId) && processId.ValueKind == JsonValueKind.Number)
                    {
                        var processNumber = processId.GetRawText();
                        using var detailResponse = await _httpClient.GetAsync(
                            $"api/consulta/medicamento/produtos/{processNumber}",
                            cancellationToken);

                        if (detailResponse.IsSuccessStatusCode)
                        {
                            using var detailDocument = JsonDocument.Parse(await detailResponse.Content.ReadAsStringAsync(cancellationToken));
                            var details = detailDocument.RootElement;
                            var descricao = GetString(details, "descricao", "descricaoProduto", "nomeProduto", "tipoProduto");
                            var medicamento = GetString(details, "nomeProduto") ?? GetString(firstResult, "nomeProduto") ?? nomeOriginal;

                            if (!string.IsNullOrWhiteSpace(descricao))
                            {
                                return new MedicamentoDescricao(
                                    medicamento,
                                    descricao.Trim(),
                                    "ANVISA",
                                    GetString(details, firstResult, "principioAtivo", "substanciaAtiva", "principioAtivoProduto"),
                                    GetString(details, firstResult, "fabricante", "empresa", "razaoSocial"),
                                    GetString(details, firstResult, "tipoProduto", "categoriaRegulatoria"),
                                    GetString(details, firstResult, "classeTerapeutica", "classesTerapeuticas"),
                                    GetString(details, firstResult, "registroAnvisa", "numeroRegistro", "numRegistro", "registro"),
                                    GetString(details, firstResult, "situacaoRegistro", "situacao"));
                            }
                        }
                    }
                }
            }
            else
            {
                _logger.LogWarning("A API da ANVISA retornou {StatusCode} para {Nome}.", (int)searchResponse.StatusCode, nomeOriginal);
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogWarning(ex, "Não foi possível consultar a descrição de {Nome} na ANVISA.", nomeOriginal);
        }

        // 2. Tentar busca no catálogo local
        var resultadoCatalogo = await BuscarNoCatalogoAsync(nomeOriginal, cancellationToken);
        if (resultadoCatalogo is not null)
            return resultadoCatalogo;

        // 3. Tentar busca no Dicionário Clínico Oficial Embutido
        var resultadoDicionario = BuscarNoDicionario(nomeOriginal, nomeLimpo);
        if (resultadoDicionario is not null)
            return resultadoDicionario;

        // 4. Fallback de IA se disponível (Gemini/Groq)
        var termoParaIa = nomeLimpo.Length >= 3 ? nomeLimpo : nomeOriginal;
        var resultadoIa = await ConsultarIaAsync(termoParaIa, cancellationToken);
        if (resultadoIa is not null)
            return resultadoIa;

        return null;
    }

    private async Task<MedicamentoDescricao?> BuscarNoCatalogoAsync(string nome, CancellationToken cancellationToken)
    {
        if (_catalogoRepository is null)
            return null;

        var searchTerms = new List<string>
        {
            nome.Trim(),
            Regex.Replace(nome, @"\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|μg|g|ml|mcg/ml|mg/ml)\b", "", RegexOptions.IgnoreCase).Trim()
        };

        var limpo = LimparNomeMedicamento(nome);
        if (!string.IsNullOrWhiteSpace(limpo) && !searchTerms.Contains(limpo, StringComparer.OrdinalIgnoreCase))
            searchTerms.Add(limpo);

        var primeiraPalavra = limpo.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(primeiraPalavra) && primeiraPalavra.Length >= 3 && !searchTerms.Contains(primeiraPalavra, StringComparer.OrdinalIgnoreCase))
            searchTerms.Add(primeiraPalavra);

        var terms = searchTerms
            .Where(term => term.Length >= 3)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        MedicamentoCatalogo? medicamento = null;
        foreach (var searchTerm in terms)
        {
            var matches = await _catalogoRepository.BuscarAsync(searchTerm, 10, cancellationToken);
            medicamento = matches.FirstOrDefault();
            if (medicamento is not null)
                break;
        }

        if (medicamento is null || string.IsNullOrWhiteSpace(medicamento.Descricao))
            return null;

        return new MedicamentoDescricao(
            medicamento.Nome,
            medicamento.Descricao.Trim(),
            "CATALOGO-OFICIAL",
            medicamento.PrincipioAtivo,
            medicamento.Fabricante,
            medicamento.TipoProduto,
            medicamento.ClasseTerapeutica,
            medicamento.RegistroAnvisa,
            medicamento.SituacaoRegistro);
    }

    private static MedicamentoDescricao? BuscarNoDicionario(string nomeOriginal, string nomeLimpo)
    {
        if (!string.IsNullOrWhiteSpace(nomeLimpo))
        {
            var item = MedicamentoDicionarioClinico.Buscar(nomeLimpo);
            if (item is not null)
                return item;
        }

        var itemOrig = MedicamentoDicionarioClinico.Buscar(nomeOriginal);
        if (itemOrig is not null)
            return itemOrig;

        var primeiraPalavra = (nomeLimpo ?? nomeOriginal).Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(primeiraPalavra) && primeiraPalavra.Length >= 3)
        {
            var itemPalavra = MedicamentoDicionarioClinico.Buscar(primeiraPalavra);
            if (itemPalavra is not null)
                return itemPalavra;
        }

        return null;
    }

    private async Task<MedicamentoDescricao?> ConsultarIaAsync(string nome, CancellationToken cancellationToken)
    {
        var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
            ?? _configuration?["Gemini:ApiKey"]
            ?? Environment.GetEnvironmentVariable("GROQ_API_KEY")
            ?? _configuration?["Groq:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey) || nome.Length < 3)
            return null;

        try
        {
            var isGroq = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GROQ_API_KEY")) && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GEMINI_API_KEY"));
            var endpoint = isGroq
                ? "https://api.groq.com/openai/v1/chat/completions"
                : "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
            var model = isGroq ? "llama-3.3-70b-versatile" : "gemini-3.8-flash";

            var prompt = $@"
Você é uma enciclopédia farmacêutica clínica no Brasil.
Descreva o medicamento '{nome}'.
Devolva estritamente um JSON no seguinte formato (sem formatação markdown adicional):
{{
  ""nome"": ""Nome Comercial / Oficial"",
  ""principioAtivo"": ""Princípio Ativo"",
  ""descricao"": ""Explicação clara ao paciente de o que é o medicamento, para que serve e indicação principal."",
  ""classeTerapeutica"": ""Classe Farmacológica"",
  ""fabricante"": ""Fabricantes no Brasil"",
  ""tipoProduto"": ""Medicamento"",
  ""situacaoRegistro"": ""Válido""
}}";

            var payload = new
            {
                model,
                messages = new[]
                {
                    new { role = "system", content = "Você é um assistente de bulário e farmacologia clínica. Retorne estritamente JSON válido." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.0
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            using var client = _httpClientFactory?.CreateClient() ?? new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(8);
            var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return null;

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(content);
            var rawText = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrWhiteSpace(rawText))
                return null;

            rawText = rawText.Replace("```json", "").Replace("```", "").Trim();
            using var jsonDoc = JsonDocument.Parse(rawText);
            var root = jsonDoc.RootElement;

            var nomeMed = root.TryGetProperty("nome", out var n) ? n.GetString() : nome;
            var desc = root.TryGetProperty("descricao", out var d) ? d.GetString() : null;
            var principio = root.TryGetProperty("principioAtivo", out var p) ? p.GetString() : "";
            var classe = root.TryGetProperty("classeTerapeutica", out var c) ? c.GetString() : "";
            var fab = root.TryGetProperty("fabricante", out var f) ? f.GetString() : "";
            var tipo = root.TryGetProperty("tipoProduto", out var t) ? t.GetString() : "Medicamento";

            if (string.IsNullOrWhiteSpace(desc))
                return null;

            return new MedicamentoDescricao(
                nomeMed ?? nome,
                desc.Trim(),
                "Base Farmacêutica Inteligente (Padrão ANVISA)",
                principio ?? "",
                fab ?? "",
                tipo ?? "Medicamento",
                classe ?? "",
                "Consultar Portal ANVISA",
                "Válido");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao gerar descrição com IA para {Nome}", nome);
            return null;
        }
    }

    private static string LimparNomeMedicamento(string nome)
    {
        if (string.IsNullOrWhiteSpace(nome)) return string.Empty;

        var limpo = nome.Trim();
        // 1. Remove qualquer conteúdo entre parênteses: (GENERICO), (RIVOTRIL), etc.
        limpo = Regex.Replace(limpo, @"\(.*?\)", " ");

        // 2. Se houver vírgula ou traço separando fabricante/detalhes (ex: PRATI, DONADUZZI):
        var partes = Regex.Split(limpo, @"[,;/\-]");
        if (partes.Length > 0 && partes[0].Trim().Length >= 3)
        {
            limpo = partes[0].Trim();
        }

        // 3. Remove dosagens (ex: 500mg, 3mg/ml, 0,25mg, 100mcg, 10ml, etc.)
        limpo = Regex.Replace(limpo, @"\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|μg|g|ml|mcg/ml|mg/ml|ui|%)\b", " ", RegexOptions.IgnoreCase);

        // 4. Remove formas farmacêuticas comuns
        limpo = Regex.Replace(limpo, @"\b(generico|genérico|suspensao|suspensão|sol\s*or\w*|solucao|solução|oral|comp\w*|caps\w*|gotas|gts|xarope|pomada|creme|gel|spray|aerossol|aerosol|inalacao|inalação|injetavel|injetável|frasco|cx|fr|ampola|flaconete|comprimido|comprimidos|capsula|cápsula|drágea|drageas)\b", " ", RegexOptions.IgnoreCase);

        // 5. Remove nomes de laboratórios frequentes se ficarem sobrando
        limpo = Regex.Replace(limpo, @"\b(prati|donaduzzi|ems|medley|ache|aché|eurofarma|neo\s*quimica|neo\s*química|sandoz|teva|biolab|libbs|legrand|geolab|cristalia|cristália|hypera|sanofi|novartis|pfizer|astrazeneca)\b", " ", RegexOptions.IgnoreCase);

        // 6. Remove caracteres especiais
        limpo = Regex.Replace(limpo, @"[^\p{L}\s]", " ");
        limpo = Regex.Replace(limpo, @"\s+", " ").Trim();

        return limpo;
    }

    private static string? GetString(JsonElement element, params string[] propertyNames)
    {
        if (element.ValueKind != JsonValueKind.Object)
            return null;

        foreach (var propertyName in propertyNames)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (!string.Equals(propertyName, property.Name, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (property.Value.ValueKind == JsonValueKind.String)
                    return property.Value.GetString();

                if (property.Value.ValueKind == JsonValueKind.Number)
                    return property.Value.GetRawText();
            }
        }

        return null;
    }

    private static string GetString(JsonElement first, JsonElement second, params string[] propertyNames)
        => GetString(first, propertyNames) ?? GetString(second, propertyNames) ?? string.Empty;
}
