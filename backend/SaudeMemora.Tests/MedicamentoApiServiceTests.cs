using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Tests;

public class MedicamentoApiServiceTests
{
    [Fact]
    public async Task BuscarDescricaoAsync_RespostaDaApi_ExtraiDescricao()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            Assert.Equal("Guest", request.Headers.Authorization!.Scheme);

            if (request.RequestUri!.AbsolutePath.EndsWith("/bulario", StringComparison.Ordinal))
            {
                Assert.Equal("https://consultas.anvisa.gov.br/api/consulta/bulario", request.RequestUri.GetLeftPart(UriPartial.Path));
                Assert.Equal("dipirona", request.RequestUri.Query.Split('&')[1].Split('=')[1]);
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        "{\"content\":[{\"numProcesso\":25351679903201454,\"nomeProduto\":\"DIPIRONA\"}]}",
                        Encoding.UTF8,
                        "application/json")
                };
            }

            Assert.Equal("https://consultas.anvisa.gov.br/api/consulta/medicamento/produtos/25351679903201454", request.RequestUri.AbsoluteUri);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"nomeProduto\":\"DIPIRONA\",\"descricao\":\"Medicamento para o tratamento de alergias\"}",
                    Encoding.UTF8,
                    "application/json")
            };
        });

        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://consultas.anvisa.gov.br/") };
        httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Guest");
        var service = new MedicamentoApiService(
            httpClient,
            new BularioApiOptions { BaseUrl = "https://consultas.anvisa.gov.br/", PageSize = 1 },
            NullLogger<MedicamentoApiService>.Instance);

        var result = await service.BuscarDescricaoAsync("dipirona");

        Assert.NotNull(result);
        Assert.Equal("DIPIRONA", result.Nome);
        Assert.Equal("Medicamento para o tratamento de alergias", result.Descricao);
        Assert.Equal("ANVISA", result.Fonte);
    }

    [Fact]
    public async Task BuscarDescricaoAsync_RespostaVazia_UsuarioSemDescricao()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"content\":[]}", Encoding.UTF8, "application/json")
        });

        var service = new MedicamentoApiService(
            new HttpClient(handler) { BaseAddress = new Uri("https://consultas.anvisa.gov.br/") },
            new BularioApiOptions { BaseUrl = "https://consultas.anvisa.gov.br/" },
            NullLogger<MedicamentoApiService>.Instance);

        Assert.Null(await service.BuscarDescricaoAsync("Medicamento inexistente"));
    }

    [Fact]
    public async Task BuscarDescricaoAsync_RespostaVazia_UsaCatalogoOficial()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"content\":[]}", Encoding.UTF8, "application/json")
        });
        var repository = new InMemoryMedicamentoCatalogoRepository(new MedicamentoCatalogo
        {
            Id = "1",
            ProcessoAnvisa = "25351679903201454",
            Nome = "DIPIRONA",
            NomeNormalizado = "dipirona",
            Descricao = "Medicamento para o tratamento de alergias",
            ImportadoEm = DateTime.UtcNow
        });
        var service = new MedicamentoApiService(
            new HttpClient(handler) { BaseAddress = new Uri("https://consultas.anvisa.gov.br/") },
            new BularioApiOptions { BaseUrl = "https://consultas.anvisa.gov.br/" },
            NullLogger<MedicamentoApiService>.Instance,
            repository);

        var result = await service.BuscarDescricaoAsync("dipirona");

        Assert.NotNull(result);
        Assert.Equal("DIPIRONA", result.Nome);
        Assert.Equal("Medicamento para o tratamento de alergias", result.Descricao);
        Assert.Equal("CATALOGO-OFICIAL", result.Fonte);
    }

    [Fact]
    public async Task BuscarDescricaoAsync_FalhaDaAnvisa_RemoveDosagemEConsultaCatalogo()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.NotFound));
        var repository = new QueryAwareMedicamentoRepository();
        var service = new MedicamentoApiService(
            new HttpClient(handler) { BaseAddress = new Uri("https://consultas.anvisa.gov.br/") },
            new BularioApiOptions { BaseUrl = "https://consultas.anvisa.gov.br/" },
            NullLogger<MedicamentoApiService>.Instance,
            repository);

        var result = await service.BuscarDescricaoAsync("Amoxicilina 500mg");

        Assert.NotNull(result);
        Assert.Equal("AMOXICILINA", result.Nome);
        Assert.Equal("Princípio ativo: amoxicilina tri-hidratada.", result.Descricao);
        Assert.Equal("CATALOGO-OFICIAL", result.Fonte);
        Assert.Equal(["Amoxicilina 500mg", "Amoxicilina"], repository.Queries);
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) => _handler = handler;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(_handler(request));
    }

    private sealed class InMemoryMedicamentoCatalogoRepository : IMedicamentoCatalogoRepository
    {
        private readonly MedicamentoCatalogo _medicamento;

        public InMemoryMedicamentoCatalogoRepository(MedicamentoCatalogo medicamento) => _medicamento = medicamento;

        public Task EnsureIndexesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReplaceAllAsync(IEnumerable<MedicamentoCatalogo> medicamentos, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<MedicamentoCatalogo>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<MedicamentoCatalogo>>(new[] { _medicamento });
        public Task<long> ContarAsync(CancellationToken cancellationToken = default) => Task.FromResult(1L);
    }

    private sealed class QueryAwareMedicamentoRepository : IMedicamentoCatalogoRepository
    {
        public List<string> Queries { get; } = [];

        public Task EnsureIndexesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ReplaceAllAsync(IEnumerable<MedicamentoCatalogo> medicamentos, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<long> ContarAsync(CancellationToken cancellationToken = default) => Task.FromResult(1L);

        public Task<IReadOnlyList<MedicamentoCatalogo>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
        {
            Queries.Add(query);
            IReadOnlyList<MedicamentoCatalogo> results = query == "Amoxicilina"
                ? [new MedicamentoCatalogo
                {
                    Id = "1",
                    ProcessoAnvisa = "25351168623200208",
                    Nome = "AMOXICILINA",
                    NomeNormalizado = "amoxicilina",
                    PrincipioAtivo = "amoxicilina tri-hidratada",
                    Descricao = "Princípio ativo: amoxicilina tri-hidratada."
                }]
                : Array.Empty<MedicamentoCatalogo>();

            return Task.FromResult(results);
        }
    }
}
