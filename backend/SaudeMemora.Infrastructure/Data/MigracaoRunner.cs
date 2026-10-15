using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Infrastructure.Repositories;
using SaudeMemora.Infrastructure.Services;
using System.Diagnostics;

namespace SaudeMemora.Infrastructure.Data;

/// <summary>
/// Executa migrações de banco versionadas e idempotentes antes de a aplicação aceitar
/// tráfego. Antes, a criação de índices e a carga dos catálogos acontecia em uma
/// <c>Task.Run</c> não aguardada, então a API atendia requisições sem os índices prontos.
/// </summary>
public class MigracaoRunner
{
    private readonly MongoDbContext _context;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MigracaoRunner> _logger;
    private readonly IMongoCollection<MigracaoAplicada> _migracoes;

    public MigracaoRunner(
        MongoDbContext context,
        IServiceScopeFactory scopeFactory,
        ILogger<MigracaoRunner> logger)
    {
        _context = context;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _migracoes = context.Database.GetCollection<MigracaoAplicada>("Migracoes");
    }

    public async Task ExecutarAsync(CancellationToken cancellationToken = default)
    {
        var migracoes = new (string Id, Func<CancellationToken, Task> Executar)[]
        {
            ("20261014_01_indices_documentos", IndicesDocumentosAsync),
            ("20261014_02_indices_pacientes", IndicesPacientesAsync),
            ("20261014_03_indices_ficha_medica", IndicesFichaMedicaAsync),
            ("20261014_04_indices_chat", IndicesChatAsync),
            ("20261014_05_indices_logs_e_auditoria", IndicesLogsEAuditoriaAsync),
            ("20261014_06_indices_catalogos", IndicesCatalogosAsync),
            ("20261014_07_seed_catalogos", SeedCatalogosAsync),
            ("20261014_08_backfill_security_stamp", BackfillSecurityStampAsync),
        };

        foreach (var (id, executar) in migracoes)
        {
            if (cancellationToken.IsCancellationRequested) break;

            if (await JaAplicadaAsync(id, cancellationToken))
            {
                _logger.LogDebug("[Migração] {MigracaoId} já aplicada.", id);
                continue;
            }

            var cronometro = Stopwatch.StartNew();
            try
            {
                await executar(cancellationToken);
                cronometro.Stop();

                await RegistrarAsync(id, cronometro.ElapsedMilliseconds, sucesso: true, erro: null, cancellationToken);
                _logger.LogInformation("[Migração] {MigracaoId} aplicada em {Ms} ms.", id, cronometro.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                cronometro.Stop();
                await RegistrarAsync(id, cronometro.ElapsedMilliseconds, sucesso: false, erro: ex.Message, cancellationToken);
                _logger.LogError(ex, "[Migração] Falha ao aplicar {MigracaoId}.", id);

                // Sem os índices esperados, seguir em frente degrada consultas e pode permitir
                // duplicidade. Falhar no startup é preferível a operar em estado inconsistente.
                throw;
            }
        }
    }

    private async Task<bool> JaAplicadaAsync(string id, CancellationToken cancellationToken)
    {
        var filtro = Builders<MigracaoAplicada>.Filter.And(
            Builders<MigracaoAplicada>.Filter.Eq(m => m.Id, id),
            Builders<MigracaoAplicada>.Filter.Eq(m => m.Sucesso, true));

        return await _migracoes.Find(filtro).AnyAsync(cancellationToken);
    }

    private async Task RegistrarAsync(
        string id,
        long duracaoMs,
        bool sucesso,
        string? erro,
        CancellationToken cancellationToken)
    {
        var registro = new MigracaoAplicada
        {
            Id = id,
            AplicadaEm = DateTime.UtcNow,
            DuracaoMs = duracaoMs,
            Sucesso = sucesso,
            Erro = erro
        };

        await _migracoes.ReplaceOneAsync(
            Builders<MigracaoAplicada>.Filter.Eq(m => m.Id, id),
            registro,
            new ReplaceOptions { IsUpsert = true },
            cancellationToken);
    }

    private Task IndicesDocumentosAsync(CancellationToken ct)
        => DocumentRepository.EnsureIndexesAsync(_context, ct);

    private Task IndicesPacientesAsync(CancellationToken ct)
        => PacienteRepository.EnsureIndexesAsync(_context, ct);

    private Task IndicesFichaMedicaAsync(CancellationToken ct)
        => FichaMedicaRepository.EnsureIndexesAsync(_context, ct);

    private Task IndicesChatAsync(CancellationToken ct)
        => ChatHistoryRepository.EnsureIndexesAsync(_context, ct);

    private async Task IndicesLogsEAuditoriaAsync(CancellationToken ct)
    {
        await SistemaLogRepository.EnsureIndexesAsync(_context, ct);
        await AuditoriaAcessoRepository.EnsureIndexesAsync(_context, ct);
    }

    private async Task IndicesCatalogosAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();

        await scope.ServiceProvider.GetRequiredService<IMedicamentoCatalogoRepository>().EnsureIndexesAsync(ct);
        await scope.ServiceProvider.GetRequiredService<ICid10CatalogoRepository>().EnsureIndexesAsync(ct);
        await scope.ServiceProvider.GetRequiredService<ICnesCatalogoRepository>().EnsureIndexesAsync(ct);
    }

    /// <summary>
    /// Carga inicial dos catálogos (ANVISA, CID-10, CNES) quando as coleções estão vazias.
    /// A carga em si continua sendo por arquivo embutido na imagem; aqui apenas garantimos
    /// que rodar de novo não duplica dados.
    /// </summary>
    private async Task SeedCatalogosAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var contentRoot = AppContext.BaseDirectory;

        var medicamentosRepo = scope.ServiceProvider.GetRequiredService<IMedicamentoCatalogoRepository>();
        if (await medicamentosRepo.ContarAsync(ct) == 0)
        {
            var caminho = Path.Combine(contentRoot, "Data", "medicamentos.csv");
            if (File.Exists(caminho))
            {
                await using var stream = File.OpenRead(caminho);
                var servico = scope.ServiceProvider.GetRequiredService<IMedicamentoCatalogoService>();
                var resultado = await servico.ImportarAsync(stream, ct);
                _logger.LogInformation(
                    "[Medicamentos] Catálogo inicializado: {Importados} importados, {Invalidos} inválidos, {Duplicados} duplicados.",
                    resultado.RegistrosImportados, resultado.RegistrosInvalidos, resultado.RegistrosDuplicados);
            }
            else
            {
                _logger.LogWarning("[Medicamentos] Arquivo não encontrado em {Caminho}; catálogo não será populado.", caminho);
            }
        }

        var cid10Repo = scope.ServiceProvider.GetRequiredService<ICid10CatalogoRepository>();
        if (await cid10Repo.ContarAsync(ct) == 0)
        {
            var caminho = Environment.GetEnvironmentVariable("CID10_CATALOG_PATH")
                ?? Path.Combine(contentRoot, "Data", "CID-10-SUBCATEGORIAS.CSV");
            if (File.Exists(caminho))
            {
                await using var stream = File.OpenRead(caminho);
                var servico = scope.ServiceProvider.GetRequiredService<ICid10CatalogoService>();
                var resultado = await servico.ImportarAsync(stream, ct);
                _logger.LogInformation(
                    "[CID-10] Catálogo inicializado: {Importados} importados, {Invalidos} inválidos, {Duplicados} duplicados.",
                    resultado.RegistrosImportados, resultado.RegistrosInvalidos, resultado.RegistrosDuplicados);
            }
            else
            {
                _logger.LogWarning("[CID-10] Arquivo não encontrado em {Caminho}; catálogo não será populado.", caminho);
            }
        }

        var cnesRepo = scope.ServiceProvider.GetRequiredService<ICnesCatalogoRepository>();
        if (await cnesRepo.ContarAsync(ct) == 0)
        {
            var caminho = Environment.GetEnvironmentVariable("CNES_CATALOG_PATH")
                ?? Path.Combine(contentRoot, "Data", "cnes_estabelecimentos.json");
            if (File.Exists(caminho))
            {
                await using var stream = File.OpenRead(caminho);
                var servico = scope.ServiceProvider.GetRequiredService<ICnesCatalogoService>();
                var resultado = await servico.ImportarAsync(stream, ct);
                _logger.LogInformation(
                    "[CNES] Catálogo inicializado: {Importados} importados, {Invalidos} inválidos, {Duplicados} duplicados.",
                    resultado.RegistrosImportados, resultado.RegistrosInvalidos, resultado.RegistrosDuplicados);
            }
            else
            {
                _logger.LogWarning("[CNES] Arquivo não encontrado em {Caminho}; catálogo não será populado.", caminho);
            }
        }
    }

    /// <summary>
    /// Preenche SecurityStamp em cadastros antigos que não possuem o campo.
    /// Sem ele a revogação de sessão não consegue invalidar tokens já emitidos.
    /// </summary>
    private async Task BackfillSecurityStampAsync(CancellationToken ct)
    {
        var filtro = Builders<Paciente>.Filter.Exists(nameof(Paciente.SecurityStamp), false);
        var semStamp = await _context.Pacientes.Find(filtro).ToListAsync(ct);

        foreach (var paciente in semStamp)
        {
            if (ct.IsCancellationRequested) break;

            await _context.Pacientes.UpdateOneAsync(
                Builders<Paciente>.Filter.Eq(p => p.Id, paciente.Id),
                Builders<Paciente>.Update.Set(nameof(Paciente.SecurityStamp), Guid.NewGuid().ToString("N")),
                cancellationToken: ct);
        }

        if (semStamp.Count > 0)
        {
            _logger.LogInformation(
                "[SecurityStamp] Preenchido em {Count} cadastros que não possuíam o campo.", semStamp.Count);
        }
    }
}
