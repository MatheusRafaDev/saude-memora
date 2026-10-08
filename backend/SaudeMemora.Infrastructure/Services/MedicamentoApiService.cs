using System.Text.Json;
using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;

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
            var descricao = GetString(details, "descricao")
                ?? GetString(details, "descricaoProduto")
                ?? GetString(details, "nomeProduto")
                ?? GetString(details, "tipoProduto");
            var medicamento = GetString(details, "nomeProduto") ?? GetString(firstResult, "nomeProduto") ?? nome.Trim();

            if (string.IsNullOrWhiteSpace(descricao))
                return await BuscarNoCatalogoAsync(nome.Trim(), cancellationToken);

            return new MedicamentoDescricao(medicamento, descricao.Trim(), "ANVISA");
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

        var medicamentos = await _catalogoRepository.BuscarAsync(nome, 1, cancellationToken);
        var medicamento = medicamentos.FirstOrDefault();
        if (medicamento is null || string.IsNullOrWhiteSpace(medicamento.Descricao))
            return null;

        return new MedicamentoDescricao(
            medicamento.Nome,
            medicamento.Descricao.Trim(),
            "CATALOGO-OFICIAL");
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.String)
            return null;

        return property.GetString();
    }
}
