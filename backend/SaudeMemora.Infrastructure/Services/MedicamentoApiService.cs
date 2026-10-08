using System.Text.Json;
using System.Text.RegularExpressions;
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

    public MedicamentoApiService(
        HttpClient httpClient,
        BularioApiOptions options,
        ILogger<MedicamentoApiService> logger,
        IMedicamentoCatalogoRepository? catalogoRepository = null)
    {
        _httpClient = httpClient;
        _options = options;
        _logger = logger;
        _catalogoRepository = catalogoRepository;
    }

    public async Task<MedicamentoDescricao?> BuscarDescricaoAsync(string nome, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(nome))
            return null;

        try
        {
            var searchUrl = $"api/consulta/bulario?count={_options.PageSize}&filter%5BnomeProduto%5D={Uri.EscapeDataString(nome.Trim())}&page=1";
            using var searchResponse = await _httpClient.GetAsync(searchUrl, cancellationToken);
            if (!searchResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("A API da ANVISA retornou {StatusCode} para {Nome}.", (int)searchResponse.StatusCode, nome);
                return await BuscarNoCatalogoAsync(nome.Trim(), cancellationToken);
            }

            using var searchDocument = JsonDocument.Parse(await searchResponse.Content.ReadAsStringAsync(cancellationToken));
            if (!searchDocument.RootElement.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.Array || content.GetArrayLength() == 0)
                return await BuscarNoCatalogoAsync(nome.Trim(), cancellationToken);

            var firstResult = content[0];
            if (!firstResult.TryGetProperty("numProcesso", out var processId) || processId.ValueKind != JsonValueKind.Number)
                return await BuscarNoCatalogoAsync(nome.Trim(), cancellationToken);

            var processNumber = processId.GetRawText();
            using var detailResponse = await _httpClient.GetAsync(
                $"api/consulta/medicamento/produtos/{processNumber}",
                cancellationToken);
            if (!detailResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("A API da ANVISA retornou {StatusCode} ao consultar o medicamento {ProcessNumber}.", (int)detailResponse.StatusCode, processNumber);
                return await BuscarNoCatalogoAsync(nome.Trim(), cancellationToken);
            }

            using var detailDocument = JsonDocument.Parse(await detailResponse.Content.ReadAsStringAsync(cancellationToken));
            var details = detailDocument.RootElement;
            var descricao = GetString(details, "descricao", "descricaoProduto", "nomeProduto", "tipoProduto");
            var medicamento = GetString(details, "nomeProduto") ?? GetString(firstResult, "nomeProduto") ?? nome.Trim();

            if (string.IsNullOrWhiteSpace(descricao))
                return await BuscarNoCatalogoAsync(nome.Trim(), cancellationToken);

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
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogWarning(ex, "Não foi possível consultar a descrição de {Nome} na ANVISA.", nome);
        }

        return await BuscarNoCatalogoAsync(nome.Trim(), cancellationToken);
    }

    private async Task<MedicamentoDescricao?> BuscarNoCatalogoAsync(string nome, CancellationToken cancellationToken)
    {
        if (_catalogoRepository is null)
            return null;

        var searchTerms = new[]
        {
            nome.Trim(),
            Regex.Replace(nome, @"\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|μg|g|ml|mcg/ml|mg/ml)\b", "", RegexOptions.IgnoreCase).Trim(),
        }
        .Where(term => term.Length >= 3)
        .Distinct(StringComparer.OrdinalIgnoreCase);

        MedicamentoCatalogo? medicamento = null;
        foreach (var searchTerm in searchTerms)
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
