using System.Text;
using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Tests;

public sealed class MedicamentoCatalogoTests
{
    [Fact]
    public void Normalizacao_RemoveAcentosEPontos()
    {
        var service = new MedicamentoCatalogoService(new StubRepository());
        var method = typeof(MedicamentoCatalogoService).GetMethod("Normalizar", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

        Assert.NotNull(method);
        Assert.Equal("paracetamol500mg", method.Invoke(null, ["Paracetamol 500mg!"]));
        Assert.Equal("amoxicilina", method.Invoke(null, ["Amoxicilina"]));
    }

    [Fact]
    public async Task ImportarAsync_RejectsHeaderWithoutRequiredColumns()
    {
        var service = new MedicamentoCatalogoService(new StubRepository());
        await using var stream = new MemoryStream("numProcesso;nomeProduto\n123;Aspirina\n"u8.ToArray());

        await Assert.ThrowsAsync<InvalidDataException>(() => service.ImportarAsync(stream));
    }

    [Fact]
    public async Task ImportarAsync_RegistersValidRecordsWithoutMongoDb()
    {
        var repository = new StubRepository();
        var service = new MedicamentoCatalogoService(repository);
        const string csv = "numProcesso;nomeProduto;descricao;fabricante;tipoProduto;classeTerapeutica\n" +
            "123;Paracetamol 500mg;Descrição;Fabricante;Comprimido;Analgésico\n" +
            "123;Paracetamol 500mg;Duplicata;Fabricante;Comprimido;Analgésico\n" +
            "invalid;;Sem nome;Fabricante;Comprimido;Analgésico\n";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        Assert.Equal(1, result.RegistrosInvalidos);
        Assert.Equal(1, result.RegistrosDuplicados);
        Assert.Single(repository.Imported);
        Assert.Equal("paracetamol500mg", repository.Imported[0].NomeNormalizado);
    }

    [Fact]
    public async Task ImportarAsync_LeArquivoOficialAnvisaComCabecalhosEmSnakeCase()
    {
        var repository = new StubRepository();
        var service = new MedicamentoCatalogoService(repository);
        const string csv =
            "TIPO_PRODUTO;NOME_PRODUTO;NUMERO_REGISTRO_PRODUTO;NUMERO_PROCESSO;CLASSE_TERAPEUTICA;EMPRESA_DETENTORA_REGISTRO;SITUACAO_REGISTRO;PRINCIPIO_ATIVO\n" +
            "\"MEDICAMENTO\";\"AMOXICILINA\";\"100430802\";\"25351168623200208\";\"PENICILINA DE AMPLO ESPECTRO\";\"EUROFARMA\";\"Ativo\";\"amoxicilina tri-hidratada\"\n";
        await using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(csv));

        var result = await service.ImportarAsync(stream);

        Assert.Equal(1, result.RegistrosImportados);
        var medicamento = Assert.Single(repository.Imported);
        Assert.Equal("AMOXICILINA", medicamento.Nome);
        Assert.Equal("amoxicilina tri-hidratada", medicamento.PrincipioAtivo);
        Assert.Equal("amoxicilinatrihidratada", medicamento.PrincipioAtivoNormalizado);
        Assert.Equal("Ativo", medicamento.SituacaoRegistro);
        Assert.Contains("Princípio ativo: amoxicilina tri-hidratada.", medicamento.Descricao);
        Assert.Equal(24, medicamento.Id.Length);
    }

    [Fact]
    public async Task ImportarAsync_LeArquivoAnvisaEmWindows1252()
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        var repository = new StubRepository();
        var service = new MedicamentoCatalogoService(repository);
        var bytes = Encoding.GetEncoding("windows-1252").GetBytes(
            "NUMERO_PROCESSO;NOME_PRODUTO;PRINCIPIO_ATIVO;EMPRESA_DETENTORA_REGISTRO\n" +
            "123;Medicamento;Substância ativa;Ação Farmacêutica\n");
        await using var stream = new MemoryStream(bytes);

        await service.ImportarAsync(stream);

        Assert.Equal("Ação Farmacêutica", Assert.Single(repository.Imported).Fabricante);
    }

    private sealed class StubRepository : SaudeMemora.Application.Interfaces.IMedicamentoCatalogoRepository
    {
        public List<SaudeMemora.Domain.Entities.MedicamentoCatalogo> Imported { get; } = [];

        public Task EnsureIndexesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task ReplaceAllAsync(IEnumerable<SaudeMemora.Domain.Entities.MedicamentoCatalogo> medicamentos, CancellationToken cancellationToken = default)
        {
            Imported.Clear();
            Imported.AddRange(medicamentos);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<SaudeMemora.Domain.Entities.MedicamentoCatalogo>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SaudeMemora.Domain.Entities.MedicamentoCatalogo>>(Array.Empty<SaudeMemora.Domain.Entities.MedicamentoCatalogo>());

        public Task<long> ContarAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(0L);
    }
}
