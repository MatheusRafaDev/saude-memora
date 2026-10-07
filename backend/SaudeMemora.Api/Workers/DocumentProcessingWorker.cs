using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Application.Exceptions;
using SaudeMemora.Domain.Entities;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using SaudeMemora.Infrastructure.Data;
using SaudeMemora.Infrastructure.Repositories;

namespace SaudeMemora.Api.Workers;

public class DocumentProcessingWorker : BackgroundService
{
    private readonly ILogger<DocumentProcessingWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string _workerId;

    public DocumentProcessingWorker(ILogger<DocumentProcessingWorker> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _workerId = Guid.NewGuid().ToString("N");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DocumentProcessingWorker started. WorkerId: {WorkerId}", _workerId);

        using (var scope = _scopeFactory.CreateScope())
        {
            var repo = scope.ServiceProvider.GetRequiredService<IDocumentRepository>();
            try 
            {
                var resetCount = await repo.ResetExpiredProcessingAsync();
                if (resetCount > 0)
                {
                    _logger.LogInformation("Resetados {Count} documentos com lock expirado para pendente.", resetCount);
                }
            } 
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao resetar documentos expirados na inicialização.");
            }
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var processedAny = await ProcessNextDocumentAsync(stoppingToken);

                // Se não encontrou nenhum documento ou se houve erro rápido, dorme um pouco para não fritar a CPU e o BD
                if (!processedAny)
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                // Ignora quando está desligando
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro fatal no loop do DocumentProcessingWorker.");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("DocumentProcessingWorker is stopping.");
    }

    private async Task<bool> ProcessNextDocumentAsync(CancellationToken stoppingToken)
    {
        // Precisamos criar um escopo para resolver serviços Scoped (como Repositories e MongoDbContext)
        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IDocumentRepository>();
        var logRepo = scope.ServiceProvider.GetRequiredService<ISistemaLogRepository>();
        var ocrAiService = scope.ServiceProvider.GetRequiredService<IOcrAiService>();
        var cache = scope.ServiceProvider.GetRequiredService<IDistributedCache>();
        var storage = scope.ServiceProvider.GetRequiredService<IImageStorageService>();

        // Busca o próximo documento e coloca um lock de 10 minutos (tempo generoso para IA/OCR processar)
        var lockDuration = TimeSpan.FromMinutes(10);
        var doc = await repo.DequeuePendingAsync(_workerId, lockDuration);

        if (doc == null)
        {
            return false; // Nenhum documento na fila
        }

        _logger.LogInformation("Processando documento {DocId} (Status: {Status}, Tentativa: {Attempt})", doc.Id, doc.Status, doc.Attempts + 1);
        
        await logRepo.CriarLogAsync(new SistemaLog 
        { 
            Nivel = "Info", 
            Acao = "ProcessamentoIniciado", 
            Detalhes = $"Iniciando processamento com IA para o documento (Tentativa {doc.Attempts + 1})", 
            DocumentoId = doc.Id, 
            PacienteId = doc.PacienteId 
        });

        try
        {
            if (doc.UrlImagens.Count == 0)
            {
                throw new Exception("Documento não possui URL de imagens para processamento.");
            }

            // Verifica o consentimento
            var pacienteRepo = scope.ServiceProvider.GetRequiredService<IPacienteRepository>();
            var paciente = await pacienteRepo.GetByIdAsync(doc.PacienteId);
            if (paciente == null || paciente.ConsentimentoIa?.Aceito != true)
            {
                throw new ConsentimentoNecessarioException();
            }

            // Atualiza o progresso inicial (já em 'processing' pelo lock)
            var docId = doc.Id ?? throw new InvalidOperationException("Documento sem identificador ao iniciar processamento.");
            doc.Progress = 40; // Exemplo: Iniciando OCR
            await repo.UpdateProgressAsync(docId, doc.Progress);
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(doc.PacienteId));

            // Chamada para o Serviço de OCR e IA (que faz OCR.space + Gemini/Groq)
            var extractedData = await ocrAiService.ExtractMultipleDocumentsDataAsync(doc.UrlImagens, doc.Tipo, stoppingToken);

            doc.Progress = 90; // Exemplo: OCR e IA finalizados
            await repo.UpdateProgressAsync(doc.Id, doc.Progress);
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(doc.PacienteId));

            if (!extractedData.DocumentoValido)
            {
                throw new InvalidDocumentException();
            }

            if (!string.IsNullOrEmpty(extractedData.Resumo) && extractedData.Resumo.StartsWith("Erro de conversão"))
            {
                throw new Exception($"Falha na extração de dados pela IA: {extractedData.Resumo}");
            }

            // Popula o RegistroDocumento com os dados extraídos
            doc.TextoExtraido = extractedData.TextoExtraido;
            // doc.TextoFormatado = extractedData.TextoFormatado; // Se tivermos no Entity
            if (!string.IsNullOrEmpty(extractedData.TipoIdentificado))
            {
                var t = extractedData.TipoIdentificado.ToLowerInvariant();
                if (t == "clinico" || t.Contains("laudo")) t = "laudo";
                else if (t.Contains("receita") || t.Contains("prescrição") || t.Contains("prescricao")) t = "receita";
                else if (t.Contains("exame")) t = "exame";
                else if (t.Contains("atestado")) t = "atestado";
                else if (t.Contains("vacina") || t.Contains("carteira")) t = "vacina";
                else if (t.Contains("relatorio") || t.Contains("relatório")) t = "relatorio";
                else if (t.Contains("encaminhamento")) t = "encaminhamento";
                else t = "outro";
                doc.Tipo = t;
            }
            doc.Titulo = extractedData.Titulo;
            doc.Medico = extractedData.Medico;
            doc.Clinica = extractedData.Clinica;
            doc.Data = extractedData.Data;
            doc.Resumo = extractedData.Resumo;
            doc.Diagnostico = extractedData.Diagnostico;
            doc.Crm = extractedData.Crm;
            doc.NomeExame = extractedData.NomeExame;
            doc.TipoExame = extractedData.TipoExame;
            doc.Resultado = extractedData.Resultado;
            doc.Especialidade = extractedData.Especialidade;
            doc.TipoClinico = extractedData.TipoClinico;
            doc.Conteudo = extractedData.Conteudo;
            doc.Conclusoes = extractedData.Conclusoes;
            doc.Observacoes = extractedData.Observacoes;

            if (extractedData.Medicamentos != null && extractedData.Medicamentos.Any())
            {
                doc.Medicamentos = extractedData.Medicamentos.Select(m => new SaudeMemora.Domain.Entities.MedicamentoDocumento
                {
                    Nome = m.Nome,
                    Dosagem = m.Dosagem,
                    Horario = m.Horario
                }).ToList();
            }

            if (extractedData.ConteudoIndentado != null && extractedData.ConteudoIndentado.Any())
            {
                doc.ConteudoIndentado = extractedData.ConteudoIndentado.Select(l => new SaudeMemora.Domain.Entities.LinhaIndentadaDocumento
                {
                    Tipo = l.Tipo,
                    Texto = l.Texto,
                    Chave = l.Chave,
                    Valor = l.Valor
                }).ToList();
            }

            if (extractedData.ResultadosExame != null && extractedData.ResultadosExame.Any())
            {
                doc.ResultadosExame = extractedData.ResultadosExame.Select(r => new SaudeMemora.Domain.Entities.ResultadoExameItem
                {
                    Nome = r.Nome,
                    NomeNormalizado = r.NomeNormalizado,
                    Valor = r.Valor,
                    ValorTexto = r.ValorTexto,
                    Unidade = r.Unidade,
                    RefMin = r.RefMin,
                    RefMax = r.RefMax,
                    ReferenciaTexto = r.ReferenciaTexto,
                    Status = r.Status,
                    Confianca = r.Confianca
                }).ToList();
            }

            // Processamento de Confianças e Revisão
            var camposBaixos = new List<string>();
            if (extractedData.Confiancas != null)
            {
                camposBaixos.AddRange(extractedData.Confiancas.Where(c => c.Valor < 0.80).Select(c => c.Campo));
            }
            
            // Regra extra: dosagem ilegível ou vazia em medicamento sempre marca revisão
            if (doc.Medicamentos != null)
            {
                for (int i = 0; i < doc.Medicamentos.Count; i++)
                {
                    if (string.IsNullOrWhiteSpace(doc.Medicamentos[i].Dosagem))
                    {
                        camposBaixos.Add($"medicamentos[{i}].dosagem");
                    }
                }
            }

            if (camposBaixos.Any())
            {
                doc.RevisaoPendente = true;
                doc.CamposBaixaConfianca = camposBaixos.Distinct().ToList();
            }
            else
            {
                doc.RevisaoPendente = false;
                doc.CamposBaixaConfianca = new List<string>();
            }

            // FASE 4: Alerta de interação e alergia
            if (!doc.RevisaoPendente && paciente.ConsentimentoIa?.Aceito == true)
            {
                var alertaService = scope.ServiceProvider.GetRequiredService<IAlertaMedicamentoService>();
                var fichaRepo = scope.ServiceProvider.GetRequiredService<IFichaMedicaRepository>();
                var ficha = await fichaRepo.GetByPacienteIdAsync(doc.PacienteId);
                var fichaMedica = ficha ?? new FichaMedica();
                
                doc.Alertas = await alertaService.GerarAlertasAsync(doc, fichaMedica);
            }

            // Finaliza o processamento com sucesso
            var currentDocId = doc.Id;
            RegistroDocumento? persistedDoc = string.IsNullOrWhiteSpace(currentDocId) ? null : await repo.GetByIdAsync(currentDocId);
            if (persistedDoc != null)
            {
                // Preserva edições do usuário que ocorreram enquanto o worker estava processando
                if (string.IsNullOrEmpty(persistedDoc.Titulo) || persistedDoc.Titulo == "Novo Documento" || persistedDoc.Titulo == "Documento em Processamento" || persistedDoc.Titulo == "Desconhecido" || persistedDoc.Titulo == doc.Titulo)
                    persistedDoc.Titulo = doc.Titulo;
                if (string.IsNullOrEmpty(persistedDoc.Tipo) || persistedDoc.Tipo == "desconhecido" || persistedDoc.Tipo == "outro" || persistedDoc.Tipo == doc.Tipo) persistedDoc.Tipo = doc.Tipo;
                if (string.IsNullOrEmpty(persistedDoc.Medico) || persistedDoc.Medico == doc.Medico) persistedDoc.Medico = doc.Medico;
                if (string.IsNullOrEmpty(persistedDoc.Clinica) || persistedDoc.Clinica == doc.Clinica) persistedDoc.Clinica = doc.Clinica;
                if (string.IsNullOrEmpty(persistedDoc.Data) || persistedDoc.Data == doc.Data) persistedDoc.Data = doc.Data;
                if (string.IsNullOrEmpty(persistedDoc.Resumo) || persistedDoc.Resumo == doc.Resumo) persistedDoc.Resumo = doc.Resumo;
                if (string.IsNullOrEmpty(persistedDoc.Diagnostico) || persistedDoc.Diagnostico == doc.Diagnostico) persistedDoc.Diagnostico = doc.Diagnostico;
                if (string.IsNullOrEmpty(persistedDoc.Crm) || persistedDoc.Crm == doc.Crm) persistedDoc.Crm = doc.Crm;
                if (string.IsNullOrEmpty(persistedDoc.NomeExame) || persistedDoc.NomeExame == doc.NomeExame) persistedDoc.NomeExame = doc.NomeExame;
                if (string.IsNullOrEmpty(persistedDoc.TipoExame) || persistedDoc.TipoExame == doc.TipoExame) persistedDoc.TipoExame = doc.TipoExame;
                if (string.IsNullOrEmpty(persistedDoc.Resultado) || persistedDoc.Resultado == doc.Resultado) persistedDoc.Resultado = doc.Resultado;
                if (string.IsNullOrEmpty(persistedDoc.Especialidade) || persistedDoc.Especialidade == doc.Especialidade) persistedDoc.Especialidade = doc.Especialidade;
                if (string.IsNullOrEmpty(persistedDoc.TipoClinico) || persistedDoc.TipoClinico == doc.TipoClinico) persistedDoc.TipoClinico = doc.TipoClinico;
                if (string.IsNullOrEmpty(persistedDoc.Conteudo) || persistedDoc.Conteudo == doc.Conteudo) persistedDoc.Conteudo = doc.Conteudo;
                if (string.IsNullOrEmpty(persistedDoc.Conclusoes) || persistedDoc.Conclusoes == doc.Conclusoes) persistedDoc.Conclusoes = doc.Conclusoes;
                if (string.IsNullOrEmpty(persistedDoc.Observacoes) || persistedDoc.Observacoes == doc.Observacoes) persistedDoc.Observacoes = doc.Observacoes;

                persistedDoc.TextoExtraido = doc.TextoExtraido;
                persistedDoc.Medicamentos = doc.Medicamentos ?? new List<MedicamentoDocumento>();
                persistedDoc.ConteudoIndentado = doc.ConteudoIndentado ?? new List<LinhaIndentadaDocumento>();
                persistedDoc.ResultadosExame = doc.ResultadosExame ?? new List<ResultadoExameItem>();
                persistedDoc.CamposBaixaConfianca = doc.CamposBaixaConfianca ?? new List<string>();
                persistedDoc.RevisaoPendente = doc.RevisaoPendente;
                persistedDoc.Alertas = doc.Alertas ?? new List<AlertaDocumento>();

                persistedDoc.Status = "pronto";
                persistedDoc.Progress = 100;
                persistedDoc.ErrorMessage = string.Empty;
                persistedDoc.LockedBy = string.Empty;
                persistedDoc.LockedUntil = null;
                doc = persistedDoc;
            }
            else
            {
                doc.Status = "pronto";
                doc.Progress = 100;
                doc.ErrorMessage = string.Empty;
                doc.LockedBy = string.Empty;
                doc.LockedUntil = null;
            }
            
            await repo.UpdateAsync(doc);
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(doc.PacienteId));
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(doc.PacienteId));

            _logger.LogInformation("Documento {DocId} processado com SUCESSO.", doc.Id);
            
            await logRepo.CriarLogAsync(new SistemaLog 
            { 
                Nivel = "Info", 
                Acao = "ProcessamentoSucesso", 
                Detalhes = "Documento analisado e estruturado com sucesso pela IA.", 
                DocumentoId = doc.Id, 
                PacienteId = doc.PacienteId 
            });

            return true;
        }
        catch (InvalidDocumentException ex)
        {
            // Documento inválido (não é médico / ilegível): NÃO guardamos nada. Remove imagens e registro
            // e deixa um marcador temporário para o front avisar o usuário a tirar outra foto.
            _logger.LogWarning("Documento {DocId} recusado: não é um documento médico válido.", doc.Id);
            await RejectInvalidDocumentAsync(doc, ex.Message, repo, storage, cache, logRepo);
            return true;
        }
        catch (ConsentimentoNecessarioException ex)
        {
            _logger.LogWarning("Documento {DocId} falhou: consentimento de IA não foi aceito ou foi revogado.", doc.Id);
            
            await logRepo.CriarLogAsync(new SistemaLog 
            { 
                Nivel = "Warning", 
                Acao = "ProcessamentoFalhouConsentimento", 
                Detalhes = "Processamento abortado. Consentimento de IA necessário.", 
                DocumentoId = doc.Id, 
                PacienteId = doc.PacienteId 
            });
            
            doc.Status = "failed";
            doc.Progress = 0;
            doc.ErrorMessage = ex.Message;
            doc.LockedBy = string.Empty;
            doc.LockedUntil = null;
            
            await repo.UpdateAsync(doc);
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(doc.PacienteId));
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(doc.PacienteId));

            return true;
        }
        catch (OperationCanceledException)
        {
            // Ignora quando está desligando
            _logger.LogInformation("Processamento cancelado por shutdown.");
            doc.Status = "pending";
            doc.LockedBy = string.Empty;
            doc.LockedUntil = null;
            await repo.UpdateAsync(doc);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar o documento {DocId}.", doc.Id);
            
            await logRepo.CriarLogAsync(new SistemaLog 
            { 
                Nivel = "Error", 
                Acao = "ProcessamentoFalhou", 
                Detalhes = $"Erro durante a IA ou OCR: {ex.Message}", 
                DocumentoId = doc.Id, 
                PacienteId = doc.PacienteId 
            });
            
            doc.Attempts++;
            if (doc.Attempts >= 3)
            {
                doc.Status = "failed";
                doc.Progress = 0;
            }
            else
            {
                // Devolve para pending para retry automático mais tarde
                doc.Status = "pending";
                doc.Progress = 25; // Volta ao estágio original
                doc.NextAttemptAt = DateTime.UtcNow.AddSeconds(doc.Attempts == 1 ? 30 : doc.Attempts == 2 ? 120 : 600);
            }

            doc.ErrorMessage = ex.Message;
            doc.LockedBy = string.Empty;
            doc.LockedUntil = null; // Libera o lock
            
            await repo.UpdateAsync(doc);
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(doc.PacienteId));
            await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(doc.PacienteId));

            return true; // Retorna true porque ele de fato pegou um item da fila (mesmo que com erro)
        }
    }

    // Chaves de cache compartilhadas com a API (GET /api/documents/{id} e upload)
    public static string RejectedDocKey(string docId) => $"doc_rejected_{docId}";
    public static string RejectedHashKey(string userId, string fileHash) => $"doc_rejected_hash_{userId}_{fileHash}";

    private async Task RejectInvalidDocumentAsync(RegistroDocumento doc, string message, IDocumentRepository repo,
        IImageStorageService storage, IDistributedCache cache, ISistemaLogRepository logRepo)
    {
        // 1. Remove as imagens do Cloudinary (dado sensível não deve ficar armazenado sem uso - LGPD)
        foreach (var publicId in doc.IdPublicos.Where(p => !string.IsNullOrWhiteSpace(p)))
        {
            try { await storage.DeleteImageAsync(publicId); }
            catch (Exception ex) { _logger.LogWarning(ex, "[Rejeição] Falha ao remover imagem {PublicId} do Cloudinary.", publicId); }
        }

        // 2. Remove o registro (o documento nunca é adicionado ao histórico)
        if (!string.IsNullOrEmpty(doc.Id)) await repo.DeleteAsync(doc.Id);

        // 3. Marcadores temporários: o front (polling) descobre que foi recusado; reenviar o mesmo arquivo é recusado na hora
        var marker = JsonSerializer.Serialize(new { userId = doc.PacienteId, message });
        if (!string.IsNullOrEmpty(doc.Id))
            await cache.SafeSetStringAsync(RejectedDocKey(doc.Id), marker,
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) });
        if (!string.IsNullOrEmpty(doc.FileHash))
            await cache.SafeSetStringAsync(RejectedHashKey(doc.PacienteId, doc.FileHash), message,
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24) });

        await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(doc.PacienteId));
        await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(doc.PacienteId));

        await logRepo.CriarLogAsync(new SistemaLog
        {
            Nivel = "Warning",
            Acao = "DocumentoRecusado",
            Detalhes = "Arquivo recusado: não é um documento médico legível. Imagens e registro removidos.",
            DocumentoId = doc.Id,
            PacienteId = doc.PacienteId
        });
    }
}
