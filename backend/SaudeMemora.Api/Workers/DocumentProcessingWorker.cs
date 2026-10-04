using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using System.Text.Json;

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

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var processedAny = await ProcessNextDocumentAsync(stoppingToken);

                // Se não encontrou nenhum documento ou se houve erro rápido, dorme um pouco para não fritar a CPU e o BD
                if (!processedAny)
                {
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
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

            // Atualiza o progresso inicial (já em 'processing' pelo lock)
            doc.Progress = 40; // Exemplo: Iniciando OCR
            await repo.UpdateAsync(doc);

            // Chamada para o Serviço de OCR e IA (que faz OCR.space + Gemini/Groq)
            var extractedData = await ocrAiService.ExtractMultipleDocumentsDataAsync(doc.UrlImagens, doc.Tipo, stoppingToken);

            doc.Progress = 90; // Exemplo: OCR e IA finalizados
            await repo.UpdateAsync(doc);

            if (!extractedData.DocumentoValido)
            {
                throw new Exception("O arquivo enviado não é um documento médico válido (parece ser uma foto aleatória, em branco, ou de assunto não relacionado à saúde).");
            }

            // Popula o RegistroDocumento com os dados extraídos
            doc.TextoExtraido = extractedData.TextoExtraido;
            // doc.TextoFormatado = extractedData.TextoFormatado; // Se tivermos no Entity
            // doc.TipoIdentificado = extractedData.TipoIdentificado; // Não existe no RegistroDocumento
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

            // Finaliza o processamento com sucesso
            doc.Status = "pronto";
            doc.Progress = 100;
            doc.ErrorMessage = string.Empty;
            doc.LockedBy = string.Empty;
            doc.LockedUntil = null;
            
            await repo.UpdateAsync(doc);

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
            }

            doc.ErrorMessage = ex.Message;
            doc.LockedBy = string.Empty;
            doc.LockedUntil = null; // Libera o lock
            
            await repo.UpdateAsync(doc);

            return true; // Retorna true porque ele de fato pegou um item da fila (mesmo que com erro)
        }
    }
}
