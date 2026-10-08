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
