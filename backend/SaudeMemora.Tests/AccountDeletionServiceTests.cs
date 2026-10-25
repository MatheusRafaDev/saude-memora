using Microsoft.Extensions.Logging.Abstractions;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Services;

namespace SaudeMemora.Tests;

/// <summary>
/// A exclusão de conta (LGPD, art. 18, VI) passou a ser disparada imediatamente pelo
/// endpoint, com o worker apenas como rede de segurança. Estes testes garantem que a
/// cascata remove todas as bases e que uma falha parcial não deixa o titular marcado
/// como excluído sem que os dados tenham sido apagados.
/// </summary>
public class AccountDeletionServiceTests
{
    private const string PacienteId = "507f1f77bcf86cd799439011";

    [Fact]
    public async Task ExcluirContaAsync_RemoveDadosDeTodasAsBases()
    {
        var paciente = new Paciente { Id = PacienteId, ExclusaoSolicitadaEm = DateTime.UtcNow.AddMinutes(-3) };
        var pacienteRepo = new StubPacienteRepository(paciente);
        var docRepo = new StubDocumentRepository(
            new RegistroDocumento { Id = "doc1", PacienteId = PacienteId, IdPublicos = new List<string> { "pub-1", "pub-2" } });
        var fichaRepo = new StubFichaRepository(new FichaMedica { Id = "ficha1", PacienteId = PacienteId });
        var chatRepo = new StubChatRepository();
        var logRepo = new StubLogRepository();
        var storage = new StubStorage();

        var servico = new AccountDeletionService(
            pacienteRepo, docRepo, fichaRepo, chatRepo, logRepo, storage,
            NullLogger<AccountDeletionService>.Instance);

        var concluido = await servico.ExcluirContaAsync(PacienteId);

        Assert.True(concluido);

        // Imagens e registros de documento
        Assert.Equal(new[] { "pub-1", "pub-2" }, storage.Removidos.OrderBy(x => x));
        Assert.Contains("doc1", docRepo.Excluidos);

        // Ficha, chat, logs e cadastro
        Assert.Contains("ficha1", fichaRepo.Excluidos);
        Assert.Equal(1, chatRepo.Exclusoes);
        Assert.Equal(1, logRepo.ExclusoesPorPaciente);
        Assert.Contains(PacienteId, pacienteRepo.Excluidos);

        // Evidência de auditoria gravada sem vínculo com o titular
        var evidencia = Assert.Single(logRepo.Criados, log => log.Acao == "ExclusaoContaConcluida");
        Assert.Null(evidencia.PacienteId);
        Assert.Contains("min após a solicitação", evidencia.Detalhes);
    }

    [Fact]
    public async Task ExcluirContaAsync_NaoRegistraEvidenciaQuandoNaoExistePaciente()
    {
        var pacienteRepo = new StubPacienteRepository(null);
        var logRepo = new StubLogRepository();

        var servico = new AccountDeletionService(
            pacienteRepo,
            new StubDocumentRepository(),
            new StubFichaRepository(null),
            new StubChatRepository(),
            logRepo,
            new StubStorage(),
            NullLogger<AccountDeletionService>.Instance);

        var concluido = await servico.ExcluirContaAsync(PacienteId);

        Assert.True(concluido); // nada pendente
        Assert.Empty(logRepo.Criados);
        Assert.Empty(pacienteRepo.Excluidos);
    }

    [Fact]
    public async Task ExcluirContaAsync_RetornaFalseQuandoFalhaParcial()
    {
        var paciente = new Paciente { Id = PacienteId };
        var pacienteRepo = new StubPacienteRepository(paciente)
        {
            FalharAoExcluir = true
        };
        var logRepo = new StubLogRepository();

        var servico = new AccountDeletionService(
            pacienteRepo,
            new StubDocumentRepository(),
            new StubFichaRepository(null),
            new StubChatRepository(),
            logRepo,
            new StubStorage(),
            NullLogger<AccountDeletionService>.Instance);

        var concluido = await servico.ExcluirContaAsync(PacienteId);

        // Falhou no último passo: a conta continua marcada e será reprocessada pelo worker.
        Assert.False(concluido);
        // Sem evidência de conclusão quando a exclusão não terminou.
        Assert.DoesNotContain(logRepo.Criados, log => log.Acao == "ExclusaoContaConcluida");
    }

    [Fact]
    public async Task ProcessarPendentesAsync_ProcessaTodasAsContasMarcadas()
    {
        var pendentes = new List<Paciente>
        {
            new() { Id = "507f1f77bcf86cd799439011" },
            new() { Id = "507f1f77bcf86cd799439012" }
        };
        var pacienteRepo = new StubPacienteRepository(null) { Pendentes = pendentes };

        var servico = new AccountDeletionService(
            pacienteRepo,
            new StubDocumentRepository(),
            new StubFichaRepository(null),
            new StubChatRepository(),
            new StubLogRepository(),
            new StubStorage(),
            NullLogger<AccountDeletionService>.Instance);

        var concluidas = await servico.ProcessarPendentesAsync();

        Assert.Equal(2, concluidas);
        Assert.Equal(2, pacienteRepo.Excluidos.Count);
    }

    [Fact]
    public async Task ExcluirContaAsync_ContinuaQuandoFalhaAoRemoverImagemDoStorage()
    {
        var paciente = new Paciente { Id = PacienteId };
        var docRepo = new StubDocumentRepository(
            new RegistroDocumento { Id = "doc1", PacienteId = PacienteId, IdPublicos = new List<string> { "pub-1" } });
        var storage = new StubStorage { FalharAoRemover = true };
        var pacienteRepo = new StubPacienteRepository(paciente);

        var servico = new AccountDeletionService(
            pacienteRepo,
            docRepo,
            new StubFichaRepository(null),
            new StubChatRepository(),
            new StubLogRepository(),
            storage,
            NullLogger<AccountDeletionService>.Instance);

        var concluido = await servico.ExcluirContaAsync(PacienteId);

        // Falha no Cloudinary não pode impedir a exclusão dos dados clínicos.
        Assert.True(concluido);
        Assert.Contains("doc1", docRepo.Excluidos);
        Assert.Contains(PacienteId, pacienteRepo.Excluidos);
    }

    private sealed class StubPacienteRepository(Paciente? paciente) : IPacienteRepository
    {
        public List<string> Excluidos { get; } = new();
        public List<Paciente> Pendentes { get; init; } = new();
        public bool FalharAoExcluir { get; init; }

        public Task<Paciente?> GetByIdAsync(string id)
        {
            if (paciente?.Id == id) return Task.FromResult<Paciente?>(paciente);
            return Task.FromResult(Pendentes.FirstOrDefault(p => p.Id == id));
        }

        public Task DeleteAsync(string id)
        {
            if (FalharAoExcluir) throw new InvalidOperationException("falha simulada ao excluir cadastro");
            Excluidos.Add(id);
            return Task.CompletedTask;
        }

        public Task<IEnumerable<Paciente>> GetUsersMarkedForDeletionAsync()
            => Task.FromResult<IEnumerable<Paciente>>(Pendentes);

        public Task<Paciente?> GetByEmailAsync(string email) => Task.FromResult<Paciente?>(null);
        public Task<Paciente?> GetByResetTokenAsync(string token) => Task.FromResult<Paciente?>(null);
        public Task<Paciente?> GetByEmergenciaTokenAsync(string token) => Task.FromResult<Paciente?>(null);
        public Task<Paciente> CreateAsync(Paciente p) => Task.FromResult(p);
        public Task UpdateAsync(Paciente p) => Task.CompletedTask;
        public Task<bool> TryUpdateSecurityStampAsync(string id, string atual, string novo) => Task.FromResult(true);
    }

    private sealed class StubDocumentRepository(params RegistroDocumento[] documentos) : IDocumentRepository
    {
        public List<string> Excluidos { get; } = new();

        public Task<IEnumerable<RegistroDocumento>> GetAllByPacienteIdAsync(string userId)
            => Task.FromResult<IEnumerable<RegistroDocumento>>(documentos);

        public Task DeleteAsync(string id)
        {
            Excluidos.Add(id);
            return Task.CompletedTask;
        }

        public Task<IEnumerable<RegistroDocumento>> GetAllForChatByPacienteIdAsync(string u, CancellationToken c = default)
            => Task.FromResult<IEnumerable<RegistroDocumento>>(Array.Empty<RegistroDocumento>());
        public Task<RegistroDocumento?> GetByIdAsync(string id) => Task.FromResult<RegistroDocumento?>(null);
        public Task<RegistroDocumento?> GetByHashAsync(string u, string h) => Task.FromResult<RegistroDocumento?>(null);
        public Task<RegistroDocumento> CreateAsync(RegistroDocumento d) => Task.FromResult(d);
        public Task<(RegistroDocumento Document, bool Created)> CreateOrGetByHashAsync(RegistroDocumento d)
            => Task.FromResult((d, true));
        public Task<bool> RequeueFailedAsync(string id, string userId) => Task.FromResult(false);
        public Task UpdateAsync(RegistroDocumento d) => Task.CompletedTask;
        public Task UpdateProgressAsync(string id, int progress) => Task.CompletedTask;
        public Task<RegistroDocumento?> DequeuePendingAsync(string workerId, TimeSpan lockDuration)
            => Task.FromResult<RegistroDocumento?>(null);
        public Task<int> ResetExpiredProcessingAsync() => Task.FromResult(0);
    }

    private sealed class StubFichaRepository(FichaMedica? ficha) : IFichaMedicaRepository
    {
        public List<string> Excluidos { get; } = new();

        public Task<FichaMedica?> GetByPacienteIdAsync(string patientId)
            => Task.FromResult(ficha?.PacienteId == patientId ? ficha : null);

        public Task DeleteAsync(string id)
        {
            Excluidos.Add(id);
            return Task.CompletedTask;
        }

        public Task<FichaMedica> CreateAsync(FichaMedica f) => Task.FromResult(f);
        public Task UpdateAsync(FichaMedica f) => Task.CompletedTask;
    }

    private sealed class StubChatRepository : IChatHistoryRepository
    {
        public int Exclusoes { get; private set; }

        public Task DeleteByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default)
        {
            Exclusoes++;
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<ChatHistorico>> GetAllByPacienteIdAsync(string p, CancellationToken c = default)
            => Task.FromResult<IReadOnlyList<ChatHistorico>>(Array.Empty<ChatHistorico>());
        public Task<IReadOnlyList<ChatHistorico>> GetRecentByPacienteIdAsync(string p, int l, CancellationToken c = default)
            => Task.FromResult<IReadOnlyList<ChatHistorico>>(Array.Empty<ChatHistorico>());
        public Task<IReadOnlyList<ChatHistorico>> GetByPacienteIdAndDayAsync(string p, string d, CancellationToken c = default)
            => Task.FromResult<IReadOnlyList<ChatHistorico>>(Array.Empty<ChatHistorico>());
        public Task<IReadOnlyList<(string Date, int MessageCount, DateTime UpdatedAt)>> GetChatDaysByPacienteIdAsync(string p, CancellationToken c = default)
            => Task.FromResult<IReadOnlyList<(string, int, DateTime)>>(Array.Empty<(string, int, DateTime)>());
        public Task<IReadOnlyList<ChatHistorico>> GetRecentByPacienteAndSessionAsync(string p, string d, string s, int l, CancellationToken c = default)
            => Task.FromResult<IReadOnlyList<ChatHistorico>>(Array.Empty<ChatHistorico>());
        public Task SaveExchangeAsync(string p, string d, string s, string q, string r,
            IReadOnlyList<ChatHistoricoCitacao> cit, CancellationToken c = default)
            => Task.CompletedTask;
        public Task RemoveCitationsByDocumentoIdAsync(string p, string d, CancellationToken c = default)
            => Task.CompletedTask;
    }

    private sealed class StubLogRepository : ISistemaLogRepository
    {
        public List<SistemaLog> Criados { get; } = new();
        public int ExclusoesPorPaciente { get; private set; }

        public Task CriarLogAsync(SistemaLog log)
        {
            Criados.Add(log);
            return Task.CompletedTask;
        }

        public Task<List<SistemaLog>> ObterLogsAsync(int limit = 100)
            => Task.FromResult(new List<SistemaLog>());

        public Task DeleteByPacienteIdAsync(string pacienteId)
        {
            ExclusoesPorPaciente++;
            return Task.CompletedTask;
        }
    }

    private sealed class StubStorage : IImageStorageService
    {
        public List<string> Removidos { get; } = new();
        public bool FalharAoRemover { get; init; }

        public Task DeleteImageAsync(string publicId)
        {
            if (FalharAoRemover) throw new InvalidOperationException("falha simulada no storage");
            Removidos.Add(publicId);
            return Task.CompletedTask;
        }

        public Task<(string imageUrl, string publicId)> UploadImageAsync(Stream stream, string fileName)
            => Task.FromResult(("url", "pub"));

        public string? GetSignedUrl(string publicId) => $"https://exemplo.invalid/{publicId}";
    }
}
