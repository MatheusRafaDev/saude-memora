using System.Text;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Tests;

public sealed class CdosCatalogosTests
{
    [Fact]
    public async Task Cid10_ImportaRegistroValidoERejeitaRegistroInvalido()
    {
        var repository = new StubCid10Repository();
        var service = new Cid10CatalogoService(repository);
        const string csv = "codigo;descricao;nivel;categoria\n" +
            "A11.23;Encefalite aguda;grave;infectocontagiosa\n" +
            ";Sem codigo;leve;invalid\n";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal(1, result.RegistrosInvalidos);
        Assert.Single(repository.Imported);
        Assert.Equal("a1123", repository.Imported[0].CodigoNormalizado);
        Assert.Equal("encefaliteaguda", repository.Imported[0].DescricaoNormalizada);
    }

    [Fact]
    public async Task Cnes_ImportaRegistroValidoEDetectaDuplicata()
    {
        var repository = new StubCnesRepository();
        var service = new CnesCatalogoService(repository);
        const string csv = "codigo;descricao;categoria\n" +
            "123456;Dor de cabeça; sintoma\n" +
            "123456;Dor de cabeça; sintoma\n";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal(1, result.RegistrosDuplicados);
        Assert.Single(repository.Imported);
    }

    [Fact]
    public async Task Cid10_AceitaCamposCsvCitadosComPontosECremulas()
    {
        var repository = new StubCid10Repository();
        var service = new Cid10CatalogoService(repository);
        const string csv = "codigo;descricao;nivel;categoria\n" +
            "A11.23;\"Encefalite, aguda\";grave;infectocontagiosa\n";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal("Encefalite, aguda", repository.Imported.Single().Descricao);
    }

    [Fact]
    public async Task Cnes_ImportaXmlEMapeiaCamposDoRegistro()
    {
        var repository = new StubCnesRepository();
        var service = new CnesCatalogoService(repository);
        const string xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Rows>" +
            "<Row><CO_CNES>123456</CO_CNES><NO_RAZAO_SOCIAL>Dor de cabeça</NO_RAZAO_SOCIAL><DS_ATIVIDADE>Dolor</DS_ATIVIDADE></Row>" +
            "</Rows>";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(xml));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(0, result.RegistrosInvalidos);
        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal("123456", repository.Imported.Single().Codigo);
        Assert.Equal("Dolor", repository.Imported.Single().Categoria);
    }

    [Fact]
    public async Task CatalogoXmlReader_LeiaRegistroXml()
    {
        const string xml = "<?xml version=\"1.0\"?><Rows><Row><CO_CNES>123456</CO_CNES><NO_RAZAO_SOCIAL>Dor de cabeça</NO_RAZAO_SOCIAL></Row></Rows>";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(xml));

        var rows = new List<Dictionary<string, string>>();
        await foreach (var parsedItem in CatalogoXmlReader.ReadRowsAsync(stream, CancellationToken.None))
        {
            rows.Add(parsedItem);
        }

        var parsedRow = Assert.Single(rows);
        Assert.Equal("123456", parsedRow["CO_CNES"]);
        Assert.Equal("Dor de cabeça", parsedRow["NO_RAZAO_SOCIAL"]);
    }

    [Fact]
    public async Task Cnes_ImportaEmLotesEExecutaLimpezaUmaVez()
    {
        var repository = new StubCnesRepository();
        var service = new CnesCatalogoService(repository);
        var xml = new StringBuilder("<?xml version=\"1.0\"?><Rows>");
        for (var index = 0; index < 5001; index++)
        {
            xml.Append($"<Row><CO_CNES>{index:D6}</CO_CNES><NO_RAZAO_SOCIAL>Registro {index}</NO_RAZAO_SOCIAL></Row>");
        }
        xml.Append("</Rows>");
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(xml.ToString()));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(5001, result.RegistrosImportados);
        Assert.Equal(2, repository.BatchCount);
        Assert.Equal(1, repository.ClearCount);
        Assert.Equal(5001, repository.Imported.Count);
    }

    private sealed class StubCid10Repository : ICid10CatalogoRepository
    {
        public List<Cid10Registro> Imported { get; } = [];
        public Task EnsureIndexesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ClearAllAsync(CancellationToken cancellationToken = default)
        {
            Imported.Clear();
            return Task.CompletedTask;
        }
        public Task InsertBatchAsync(IEnumerable<Cid10Registro> registros, CancellationToken cancellationToken = default)
        {
            Imported.AddRange(registros);
            return Task.CompletedTask;
        }
        public Task<IReadOnlyList<Cid10Registro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Cid10Registro>>(Array.Empty<Cid10Registro>());
        public Task<long> ContarAsync(CancellationToken cancellationToken = default) => Task.FromResult(0L);
    }

    private sealed class StubCnesRepository : ICnesCatalogoRepository
    {
        public List<CnesRegistro> Imported { get; } = [];
        public int ClearCount { get; private set; }
        public int BatchCount { get; private set; }
        public Task EnsureIndexesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ClearAllAsync(CancellationToken cancellationToken = default)
        {
            ClearCount++;
            return Task.CompletedTask;
        }
        public Task InsertBatchAsync(IEnumerable<CnesRegistro> registros, CancellationToken cancellationToken = default)
        {
            BatchCount++;
            Imported.AddRange(registros);
            return Task.CompletedTask;
        }
        public Task<IReadOnlyList<CnesRegistro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<CnesRegistro>>(Array.Empty<CnesRegistro>());
        public Task<long> ContarAsync(CancellationToken cancellationToken = default) => Task.FromResult(0L);
    }
}
