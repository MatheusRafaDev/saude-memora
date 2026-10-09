using System.Text;
using MongoDB.Bson;
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
        Assert.Equal(24, repository.Imported[0].Id.Length);
        Assert.IsType<BsonObjectId>(repository.Imported[0].ToBsonDocument()["_id"]);
    }

    [Fact]
    public async Task Cid10_ImportaFormatoOficialDeSubcategorias()
    {
        var repository = new StubCid10Repository();
        var service = new Cid10CatalogoService(repository);
        const string csv = "SUBCAT;CLASSIF;RESTRSEXO;CAUSAOBITO;DESCRICAO;DESCRABREV;REFER;EXCLUIDOS;\n" +
            "A000;;;;\"Cólera, devida a Vibrio cholerae\";A00.0;;;\n";
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        await using var stream = new MemoryStream(Encoding.GetEncoding(1252).GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal("A000", repository.Imported.Single().Codigo);
        Assert.Equal("Cólera, devida a Vibrio cholerae", repository.Imported.Single().Descricao);
        Assert.Equal("subcategoria", repository.Imported.Single().Nivel);
        Assert.IsType<BsonObjectId>(repository.Imported.Single().ToBsonDocument()["_id"]);
    }

    [Fact]
    public async Task Cid10_ArquivoSemRegistroValidoNaoSubstituiCatalogoExistente()
    {
        var repository = new StubCid10Repository();
        repository.Imported.Add(new Cid10Registro { Id = ObjectId.GenerateNewId().ToString(), Codigo = "A000" });
        var service = new Cid10CatalogoService(repository);
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes("codigo;descricao\n;Sem código\n"));

        await Assert.ThrowsAsync<InvalidDataException>(() => service.ImportarAsync(stream));

        Assert.Equal("A000", repository.Imported.Single().Codigo);
    }

    [Fact]
    public async Task Cid10_FalhaNoMeioDaImportacaoMantemCatalogoAnterior()
    {
        var repository = new StubCid10Repository();
        repository.Imported.Add(new Cid10Registro { Id = ObjectId.GenerateNewId().ToString(), Codigo = "B000" });
        var service = new Cid10CatalogoService(repository);
        const string csv = "codigo;descricao\nA000;Registro válido\n\"linha sem fechamento";
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        await Assert.ThrowsAsync<InvalidDataException>(() => service.ImportarAsync(stream));

        Assert.Equal("B000", repository.Imported.Single().Codigo);
    }

    [Fact]
    public async Task Cnes_ImportaRegistroValidoEDetectaDuplicata()
    {
        var repository = new StubCnesRepository();
        var service = new CnesCatalogoService(repository);
        const string csv = "codigo;descricao;categoria\n" +
            "1234567;Dor de cabeça;sintoma\n" +
            "1234567;Dor de cabeça;sintoma\n";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal(1, result.RegistrosDuplicados);
        Assert.Single(repository.Imported);
        Assert.IsType<BsonObjectId>(repository.Imported.Single().ToBsonDocument()["_id"]);
    }

    [Fact]
    public async Task Cnes_ImportaCsvComCabecalhoOficial()
    {
        var repository = new StubCnesRepository();
        var service = new CnesCatalogoService(repository);
        const string csv = "CO_CNES;NO_RAZAO_SOCIAL;DS_ATIVIDADE\n1234567;Unidade de Saúde;Atendimento\n";
        await using var stream = new MemoryStream(Encoding.GetEncoding(1252).GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal("Unidade de Saúde", repository.Imported.Single().Descricao);
        Assert.Equal("Atendimento", repository.Imported.Single().Categoria);
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
            "<Row><CO_CNES>1234567</CO_CNES><NO_RAZAO_SOCIAL>Dor de cabeça</NO_RAZAO_SOCIAL><DS_ATIVIDADE>Dolor</DS_ATIVIDADE></Row>" +
            "</Rows>";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(xml));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(0, result.RegistrosInvalidos);
        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal("1234567", repository.Imported.Single().Codigo);
        Assert.Equal("Dolor", repository.Imported.Single().Categoria);
        Assert.IsType<BsonObjectId>(repository.Imported.Single().ToBsonDocument()["_id"]);
    }

    [Fact]
    public async Task Cnes_ImportaXmlDeStreamNaoPesquisavel()
    {
        var repository = new StubCnesRepository();
        var service = new CnesCatalogoService(repository);
        const string xml = "<Rows><Row><CO_CNES>7654321</CO_CNES><NO_RAZAO_SOCIAL>Unidade</NO_RAZAO_SOCIAL></Row></Rows>";
        await using var stream = new NonSeekableReadStream(
            new MemoryStream(Encoding.UTF8.GetBytes(xml)));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal("7654321", repository.Imported.Single().Codigo);
    }

    [Fact]
    public async Task Cnes_RejeitaCodigoForaDoFormatoEConservaCatalogoAtual()
    {
        var repository = new StubCnesRepository();
        repository.Imported.Add(new CnesRegistro { Id = ObjectId.GenerateNewId().ToString(), Codigo = "7654321" });
        var service = new CnesCatalogoService(repository);
        const string xml = "<?xml version=\"1.0\"?><Rows><Row><CO_CNES>123456</CO_CNES><NO_RAZAO_SOCIAL>Inválido</NO_RAZAO_SOCIAL></Row></Rows>";
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(xml));

        await Assert.ThrowsAsync<InvalidDataException>(() => service.ImportarAsync(stream));

        Assert.Equal("7654321", repository.Imported.Single().Codigo);
    }

    [Fact]
    public async Task CatalogoXmlReader_LeiaRegistroXml()
    {
        const string xml = "<?xml version=\"1.0\"?><Rows><Row><CO_CNES>1234567</CO_CNES><NO_RAZAO_SOCIAL>Dor de cabeça</NO_RAZAO_SOCIAL></Row></Rows>";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(xml));

        var rows = new List<Dictionary<string, string>>();
        await foreach (var parsedItem in CatalogoXmlReader.ReadRowsAsync(stream, CancellationToken.None))
        {
            rows.Add(parsedItem);
        }

        var parsedRow = Assert.Single(rows);
        Assert.Equal("1234567", parsedRow["CO_CNES"]);
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
            xml.Append($"<Row><CO_CNES>{index:D7}</CO_CNES><NO_RAZAO_SOCIAL>Registro {index}</NO_RAZAO_SOCIAL></Row>");
        }
        xml.Append("</Rows>");
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(xml.ToString()));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(5001, result.RegistrosImportados);
        Assert.Equal(2, repository.BatchCount);
        Assert.Equal(1, repository.ReplaceCount);
        Assert.Equal(5001, repository.Imported.Count);
    }

    private sealed class StubCid10Repository : ICid10CatalogoRepository
    {
        public List<Cid10Registro> Imported { get; } = [];
        public Task ReplaceAllAsync(IAsyncEnumerable<Cid10Registro> registros, CancellationToken cancellationToken = default)
            => ReplaceAsync(registros, Imported, cancellationToken);
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

        private static async Task ReplaceAsync(
            IAsyncEnumerable<Cid10Registro> registros,
            List<Cid10Registro> existing,
            CancellationToken cancellationToken)
        {
            var staged = new List<Cid10Registro>();
            await foreach (var registro in registros.WithCancellation(cancellationToken)) staged.Add(registro);
            if (staged.Count == 0) throw new InvalidDataException("Sem registros.");
            existing.Clear();
            existing.AddRange(staged);
        }
    }

    private sealed class StubCnesRepository : ICnesCatalogoRepository
    {
        public List<CnesRegistro> Imported { get; } = [];
        public int ReplaceCount { get; private set; }
        public int BatchCount { get; private set; }
        public async Task ReplaceAllAsync(IAsyncEnumerable<CnesRegistro> registros, CancellationToken cancellationToken = default)
        {
            ReplaceCount++;
            var staged = new List<CnesRegistro>();
            await foreach (var registro in registros.WithCancellation(cancellationToken))
            {
                staged.Add(registro);
                if (staged.Count % 5_000 == 0 || staged.Count == 5_001) BatchCount++;
            }
            if (staged.Count == 0) throw new InvalidDataException("Sem registros.");
            Imported.Clear();
            Imported.AddRange(staged);
        }
        public Task EnsureIndexesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ClearAllAsync(CancellationToken cancellationToken = default)
        {
            Imported.Clear();
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

    private sealed class NonSeekableReadStream(Stream inner) : Stream
    {
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override int Read(byte[] buffer, int offset, int count) => inner.Read(buffer, offset, count);
        public override int Read(Span<byte> buffer) => inner.Read(buffer);
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
            => inner.ReadAsync(buffer, cancellationToken);
        public override void Flush() => throw new NotSupportedException();
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        protected override void Dispose(bool disposing)
        {
            if (disposing) inner.Dispose();
            base.Dispose(disposing);
        }
    }
}
