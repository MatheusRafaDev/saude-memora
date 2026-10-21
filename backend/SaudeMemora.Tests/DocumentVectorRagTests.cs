using Microsoft.Extensions.Logging.Abstractions;
using SaudeMemora.Api.Services;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Services;
using Xunit;

namespace SaudeMemora.Tests;

public class DocumentVectorRagTests
{
    [Fact]
    public void DocumentChunker_GeneratesStructuredChunks_WithMetadata()
    {
        var chunker = new DocumentChunker();
        var doc = new RegistroDocumento
        {
            Id = "doc-101",
            PacienteId = "paciente-abc",
            Titulo = "Exame de Sangue e Glicemia",
            Tipo = "exame",
            Data = "15/05/2025",
            Resumo = "Glicemia de jejum e hemoglobina glicada dentro da meta.",
            Diagnostico = "Pré-diabetes controlado",
            Medicamentos =
            [
                new MedicamentoDocumento { Nome = "Metformina", Dosagem = "500mg", Horario = "12/12h" }
            ],
            ResultadosExame =
            [
                new ResultadoExameItem { Nome = "Glicose", ValorTexto = "95", Unidade = "mg/dL", ReferenciaTexto = "70 a 99", Status = "normal" }
            ],
            Conteudo = "Paciente assintomático, mantendo dieta equilibrada e exercícios físicos regulares."
        };

        var chunks = chunker.CreateChunks(doc);

        Assert.NotEmpty(chunks);
        Assert.All(chunks, chunk =>
        {
            Assert.Equal("doc-101", chunk.DocumentoId);
            Assert.Equal("paciente-abc", chunk.PacienteId);
            Assert.Equal("exame", chunk.Tipo);
            Assert.Equal(chunker.CurrentVersion, chunk.Versao);
            Assert.False(string.IsNullOrWhiteSpace(chunk.Texto));
        });

        // Deve conter chunk com medicamentos e resultados laboratoriais
        Assert.Contains(chunks, c => c.Texto.Contains("Metformina") && c.Texto.Contains("Glicose"));
    }

    [Fact]
    public void CosineSimilarity_ComputesExpectedValues()
    {
        // Vetores idênticos -> similaridade 1.0
        var v1 = new float[] { 1f, 2f, 3f };
        var v2 = new float[] { 1f, 2f, 3f };
        var simIdentical = HybridPatientDocumentSearch.CosineSimilarity(v1, v2);
        Assert.True(Math.Abs(simIdentical - 1.0f) < 0.0001f);

        // Vetores ortogonais -> similaridade 0.0
        var v3 = new float[] { 1f, 0f };
        var v4 = new float[] { 0f, 1f };
        var simOrthogonal = HybridPatientDocumentSearch.CosineSimilarity(v3, v4);
        Assert.True(Math.Abs(simOrthogonal - 0.0f) < 0.0001f);

        // Vetores vazios ou com comprimentos diferentes -> 0.0 seguro
        Assert.Equal(0f, HybridPatientDocumentSearch.CosineSimilarity(Array.Empty<float>(), [1f]));
        Assert.Equal(0f, HybridPatientDocumentSearch.CosineSimilarity([1f, 2f], [1f, 2f, 3f]));
    }

    [Fact]
    public async Task HybridPatientDocumentSearch_FiltersByAuthenticatedPatient_AndRanksSemantically()
    {
        var ownedChunkHigh = new DocumentChunk
        {
            Id = "c1",
            DocumentoId = "doc-owned-1",
            PacienteId = "paciente-1",
            Titulo = "Exame de Glicemia",
            Tipo = "exame",
            Data = "10/01/2025",
            Texto = "Resultado de glicose em jejum: 88 mg/dL. Normal.",
            Embedding = [0.9f, 0.1f, 0.0f]
        };

        var ownedChunkLow = new DocumentChunk
        {
            Id = "c2",
            DocumentoId = "doc-owned-2",
            PacienteId = "paciente-1",
            Titulo = "Raio-X de Tórax",
            Tipo = "exame",
            Data = "05/01/2025",
            Texto = "Campos pleuropulmonares limpos e sem alterações.",
            Embedding = [0.0f, 0.1f, 0.9f]
        };

        var foreignChunk = new DocumentChunk
        {
            Id = "c3",
            DocumentoId = "doc-foreign",
            PacienteId = "paciente-outro", // OUTRO PACIENTE!
            Titulo = "Exame de Glicemia",
            Tipo = "exame",
            Data = "10/01/2025",
            Texto = "Glicose 450 mg/dL perigosa de outro paciente.",
            Embedding = [0.99f, 0.05f, 0.0f] // Alta similaridade vetorial, mas pertence a outro titular!
        };

        var vectorRepo = new MemoryDocumentVectorRepository([ownedChunkHigh, ownedChunkLow, foreignChunk]);
        var embeddingService = new StubEmbeddingService(_ => [0.95f, 0.05f, 0.0f]); // Consulta de glicose
        var lexicalFallback = new LexicalPatientDocumentSearch(new PatientChatAiTests_MemoryDocumentRepo());

        var search = new HybridPatientDocumentSearch(
            vectorRepo,
            embeddingService,
            lexicalFallback,
            NullLogger<HybridPatientDocumentSearch>.Instance);

        var results = await search.SearchAsync("paciente-1", "qual foi minha glicose?", null, 4, CancellationToken.None);

        Assert.NotEmpty(results);
        // O documento do paciente autenticado com maior similaridade vetorial deve ser o primeiro
        Assert.Equal("doc-owned-1", results[0].Id);
        // JAMAIS deve vazar o chunk do outro paciente
        Assert.DoesNotContain(results, r => r.Id == "doc-foreign");
        Assert.DoesNotContain(results, r => r.Excerpt.Contains("450"));
    }

    [Fact]
    public async Task HybridPatientDocumentSearch_FallsBackToLexical_WhenEmbeddingServiceFails()
    {
        var ownedDoc = new RegistroDocumento
        {
            Id = "doc-lexical",
            PacienteId = "paciente-1",
            Titulo = "Receita de Amoxicilina",
            Tipo = "receita",
            Status = "pronto",
            TextoExtraido = "Tomar amoxicilina 500mg de 8 em 8 horas por 7 dias."
        };

        var vectorRepo = new MemoryDocumentVectorRepository([]);
        var failingEmbeddingService = new StubEmbeddingService(_ => null); // Falha de embeddings
        var lexicalFallback = new LexicalPatientDocumentSearch(new PatientChatAiTests_MemoryDocumentRepo([ownedDoc]));

        var search = new HybridPatientDocumentSearch(
            vectorRepo,
            failingEmbeddingService,
            lexicalFallback,
            NullLogger<HybridPatientDocumentSearch>.Instance);

        var results = await search.SearchAsync("paciente-1", "amoxicilina", null, 4, CancellationToken.None);

        Assert.Single(results);
        Assert.Equal("doc-lexical", results[0].Id);
        Assert.Contains("amoxicilina", results[0].Excerpt, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DocumentVectorIndexer_IdempotentlyIndexesDocument()
    {
        var doc = new RegistroDocumento
        {
            Id = "doc-idx-1",
            PacienteId = "paciente-1",
            Titulo = "Atestado Médico",
            Tipo = "atestado",
            Status = "pronto",
            Data = "01/06/2025",
            Resumo = "Repouso por 2 dias decorrente de quadro viral."
        };

        var vectorRepo = new MemoryDocumentVectorRepository([]);
        var chunker = new DocumentChunker();
        var embeddingService = new StubEmbeddingService(_ => [0.1f, 0.2f, 0.3f]);

        var indexer = new DocumentVectorIndexer(
            chunker,
            embeddingService,
            vectorRepo,
            new PatientChatAiTests_MemoryDocumentRepo([doc]),
            NullLogger<DocumentVectorIndexer>.Instance);

        // 1ª Indexação
        var success1 = await indexer.IndexDocumentAsync(doc);
        Assert.True(success1);
        var count1 = await vectorRepo.CountByPacienteIdAsync("paciente-1");
        Assert.True(count1 > 0);

        // 2ª Indexação (idempotência): não deve duplicar os chunks
        var success2 = await indexer.IndexDocumentAsync(doc);
        Assert.True(success2);
        var count2 = await vectorRepo.CountByPacienteIdAsync("paciente-1");
        Assert.Equal(count1, count2);

        // Exclusão
        await indexer.DeleteDocumentIndexAsync("doc-idx-1");
        var countAfterDelete = await vectorRepo.CountByPacienteIdAsync("paciente-1");
        Assert.Equal(0, countAfterDelete);
    }

    private sealed class StubEmbeddingService(Func<string, float[]?> generate) : IEmbeddingService
    {
        public string ModelName => "text-embedding-004";

        public Task<float[]?> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
            => Task.FromResult(generate(text));

        public Task<IReadOnlyList<float[]>> GenerateEmbeddingsBatchAsync(IReadOnlyList<string> texts, CancellationToken cancellationToken = default)
        {
            var list = new List<float[]>();
            foreach (var t in texts)
            {
                var emb = generate(t);
                if (emb != null) list.Add(emb);
            }
            return Task.FromResult<IReadOnlyList<float[]>>(list);
        }
    }

    private sealed class MemoryDocumentVectorRepository : IDocumentVectorRepository
    {
        private readonly List<DocumentChunk> _chunks;

        public MemoryDocumentVectorRepository(IEnumerable<DocumentChunk> initial)
        {
            _chunks = initial.ToList();
        }

        public Task UpsertChunksAsync(string pacienteId, string documentoId, IEnumerable<DocumentChunk> chunks, CancellationToken cancellationToken = default)
        {
            _chunks.RemoveAll(c => c.PacienteId == pacienteId && c.DocumentoId == documentoId);
            _chunks.AddRange(chunks);
            return Task.CompletedTask;
        }

        public Task DeleteByDocumentoIdAsync(string documentoId, CancellationToken cancellationToken = default)
        {
            _chunks.RemoveAll(c => c.DocumentoId == documentoId);
            return Task.CompletedTask;
        }

        public Task DeleteAllByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default)
        {
            _chunks.RemoveAll(c => c.PacienteId == pacienteId);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<DocumentChunk>> GetChunksByPacienteIdAsync(string pacienteId, string? tipoDocumento = null, CancellationToken cancellationToken = default)
        {
            var res = _chunks
                .Where(c => c.PacienteId == pacienteId && (tipoDocumento == null || string.Equals(c.Tipo, tipoDocumento, StringComparison.OrdinalIgnoreCase)))
                .ToList();
            return Task.FromResult<IReadOnlyList<DocumentChunk>>(res);
        }

        public Task<long> CountByPacienteIdAsync(string pacienteId, CancellationToken cancellationToken = default)
        {
            long count = _chunks.Count(c => c.PacienteId == pacienteId);
            return Task.FromResult(count);
        }

        public Task<bool> HasIndexedChunksAsync(string pacienteId, string documentoId, CancellationToken cancellationToken = default)
        {
            bool exists = _chunks.Any(c => c.PacienteId == pacienteId && c.DocumentoId == documentoId);
            return Task.FromResult(exists);
        }
    }

    private sealed class PatientChatAiTests_MemoryDocumentRepo : IDocumentRepository
    {
        private readonly List<RegistroDocumento> _docs;

        public PatientChatAiTests_MemoryDocumentRepo(IEnumerable<RegistroDocumento>? docs = null)
        {
            _docs = docs?.ToList() ?? [];
        }

        public Task<IEnumerable<RegistroDocumento>> GetAllForChatByPacienteIdAsync(string userId, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<RegistroDocumento>>(_docs.Where(d => d.PacienteId == userId));

        public Task<IEnumerable<RegistroDocumento>> GetAllByPacienteIdAsync(string userId) => Task.FromResult<IEnumerable<RegistroDocumento>>(_docs.Where(d => d.PacienteId == userId));
        public Task<IEnumerable<RegistroDocumento>> GetPendingByPacienteIdAsync(string userId) => Task.FromResult<IEnumerable<RegistroDocumento>>([]);
        public Task<long> CountByPacienteIdAsync(string userId) => Task.FromResult((long)_docs.Count(d => d.PacienteId == userId));
        public Task<(IEnumerable<RegistroDocumento> Items, long TotalCount)> GetPagedByPacienteIdAsync(string userId, int page, int pageSize, string? tipo = null, string? status = null, string? search = null, DateTime? dataInicio = null, DateTime? dataFim = null) => Task.FromResult((Enumerable.Empty<RegistroDocumento>(), 0L));
        public Task<RegistroDocumento?> GetByIdAsync(string id) => Task.FromResult(_docs.FirstOrDefault(d => d.Id == id));
        public Task<RegistroDocumento?> GetByHashAsync(string userId, string fileHash) => Task.FromResult(_docs.FirstOrDefault(d => d.PacienteId == userId && d.FileHash == fileHash));
        public Task<RegistroDocumento> CreateAsync(RegistroDocumento docRecord) { _docs.Add(docRecord); return Task.FromResult(docRecord); }
        public Task<(RegistroDocumento Document, bool Created)> CreateOrGetByHashAsync(RegistroDocumento docRecord) { _docs.Add(docRecord); return Task.FromResult((docRecord, true)); }
        public Task<bool> RequeueFailedAsync(string id, string userId) => Task.FromResult(false);
        public Task UpdateAsync(RegistroDocumento docRecord) => Task.CompletedTask;
        public Task UpdateProgressAsync(string id, int progress) => Task.CompletedTask;
        public Task DeleteAsync(string id) { _docs.RemoveAll(d => d.Id == id); return Task.CompletedTask; }
        public Task<RegistroDocumento?> DequeuePendingAsync(string workerId, TimeSpan lockDuration) => Task.FromResult<RegistroDocumento?>(null);
        public Task<int> ResetExpiredProcessingAsync() => Task.FromResult(0);
    }
}
