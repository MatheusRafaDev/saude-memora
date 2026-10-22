using System.Diagnostics;
using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SaudeMemora.Api.Services;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Api.Endpoints;

public static class ChatEndpoints
{
    public static void MapChatEndpoints(this WebApplication app)
    {
        app.MapGet("/api/chat/history", async (
            [FromQuery(Name = "date")] string? chatDate,
            ClaimsPrincipal user,
            IChatHistoryRepository chatHistoryRepo,
            CancellationToken cancellationToken) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();

            var date = string.IsNullOrWhiteSpace(chatDate)
                ? DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : chatDate;
            if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                return Results.BadRequest(new { message = "Data inválida. Use o formato yyyy-MM-dd." });

            var history = await chatHistoryRepo.GetByPacienteIdAndDayAsync(userId, date, cancellationToken);
            var messages = history.SelectMany(item => new[]
            {
                new ChatHistoryMessage(item.Id + "-user", "user", item.Pergunta, item.CriadoEm, item.SessaoId, Array.Empty<ChatCitation>()),
                new ChatHistoryMessage(item.Id + "-assistant", "assistant", item.Resposta, item.CriadoEm, item.SessaoId,
                    (item.Citacoes ?? []).Select(citation => new ChatCitation(citation.Id, citation.Titulo, citation.Data)).ToArray())
            });

            return Results.Ok(new ChatHistoryResponse(date, messages.ToArray()));
        }).Produces<ChatHistoryResponse>().RequireAuthorization();

        app.MapGet("/api/chat/history/days", async (
            ClaimsPrincipal user,
            IChatHistoryRepository chatHistoryRepo,
            CancellationToken cancellationToken) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();

            var days = await chatHistoryRepo.GetChatDaysByPacienteIdAsync(userId, cancellationToken);
            return Results.Ok(new ChatHistoryDaysResponse(days.Select(day => new ChatHistoryDay(
                day.Date,
                day.MessageCount * 2,
                day.UpdatedAt)).ToArray()));
        }).Produces<ChatHistoryDaysResponse>().RequireAuthorization();

        app.MapGet("/api/chat/documentos-consultados", async (
            ClaimsPrincipal user,
            IChatHistoryRepository chatHistoryRepo,
            CancellationToken cancellationToken) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();

            var history = await chatHistoryRepo.GetAllByPacienteIdAsync(userId, cancellationToken);
            var result = history
                .Where(item => item.Citacoes != null && item.Citacoes.Count > 0)
                .SelectMany(item => item.Citacoes.Select(c => new DocumentoConsultadoItem(
                    c.Id,
                    c.Titulo,
                    c.Data,
                    item.Pergunta,
                    item.CriadoEm,
                    item.DataChat
                )))
                .OrderByDescending(x => x.DataConsulta)
                .ToArray();

            return Results.Ok(result);
        }).Produces<DocumentoConsultadoItem[]>().RequireAuthorization();

        app.MapPost("/api/chat/reindex", async (
            ClaimsPrincipal user,
            IDocumentVectorIndexer vectorIndexer,
            CancellationToken cancellationToken) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();

            var count = await vectorIndexer.IndexPendingDocumentsForPatientAsync(userId, cancellationToken);
            return Results.Ok(new
            {
                message = $"{count} documento(s) indexado(s) com embeddings para busca vetorial.",
                indexados = count
            });
        }).RequireAuthorization();

        app.MapPost("/api/chat", async (
            ChatRequest req,
            ClaimsPrincipal user,
            IPacienteRepository pacienteRepo,
            IChatHistoryRepository chatHistoryRepo,
            IConfiguration config,
            PatientChatOrchestrator orchestrator,
            CancellationToken cancellationToken) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(req.Message))
                return Results.BadRequest(new { error = "A pergunta é obrigatória." });
            if (req.Message.Length > 1000)
                return Results.BadRequest(new { error = "A pergunta deve ter no máximo 1000 caracteres." });

            var chatDate = string.IsNullOrWhiteSpace(req.ChatDate)
                ? DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : req.ChatDate;
            if (!DateOnly.TryParseExact(chatDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                return Results.BadRequest(new { message = "Data da conversa inválida. Use o formato yyyy-MM-dd." });
            if (string.IsNullOrWhiteSpace(req.SessionId) || req.SessionId.Length > 80)
                return Results.BadRequest(new { message = "Identificador da conversa inválido." });

            var paciente = await pacienteRepo.GetByIdAsync(userId);
            if (paciente?.ConsentimentoIa?.HasChatConsent() != true)
                return Results.Json(new { message = "consentimento_necessario" }, statusCode: StatusCodes.Status403Forbidden);

            var groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY")
                ?? Environment.GetEnvironmentVariable("GROQ_KEY")
                ?? config["GROQ_API_KEY"]
                ?? config["Groq:ApiKey"];
            if (string.IsNullOrWhiteSpace(groqApiKey))
            {
                app.Logger.LogError("GROQ_API_KEY is not configured.");
                return Results.Problem(
                    title: "Serviço de IA indisponível",
                    detail: "A chave do Groq não está configurada no servidor. Configure a variável GROQ_API_KEY no arquivo .env ou no painel da Vercel.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            var model = Environment.GetEnvironmentVariable("GROQ_MODEL")
                ?? config["GROQ_MODEL"]
                ?? config["Groq:Model"]
                ?? "llama3-8b-8192";

            var toolsEnabled = ReadBooleanSetting(
                config,
                "GROQ_CHAT_TOOL_CALLING_ENABLED",
                "Groq:ChatToolCallingEnabled",
                defaultValue: false);
            var inputBudget = ReadBoundedSetting(
                config,
                "GROQ_CHAT_INPUT_TOKEN_BUDGET",
                "Groq:ChatInputTokenBudget",
                defaultValue: 12000,
                minimum: 4096,
                maximum: 64000);
            var outputLimit = ReadBoundedSetting(
                config,
                "GROQ_CHAT_OUTPUT_TOKEN_LIMIT",
                "Groq:ChatOutputTokenLimit",
                defaultValue: 800,
                minimum: 128,
                maximum: 4096);
            var correlationId = Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");

            PatientChatTurnResult turn;
            try
            {
                var recentHistory = await chatHistoryRepo.GetRecentByPacienteAndSessionAsync(
                    userId, chatDate, req.SessionId, 10, cancellationToken);
                var messages = ChatPromptBuilder.CreateMessages(
                    ChatPromptBuilder.CreateSystemPrompt(toolsEnabled),
                    recentHistory,
                    req.Message,
                    inputBudget,
                    toolsEnabled);

                turn = await orchestrator.CompleteAsync(
                    userId,
                    model,
                    messages,
                    req.Message,
                    toolsEnabled,
                    inputBudget,
                    outputLimit,
                    correlationId,
                    cancellationToken);
            }
            catch (ChatContextBudgetExceededException ex)
            {
                app.Logger.LogWarning(
                    "Chat input exceeded its configured context budget. EstimatedTokens={EstimatedTokens} MaxTokens={MaxTokens} CorrelationId={CorrelationId}",
                    ex.EstimatedTokens, ex.MaxTokens, correlationId);
                return Results.Json(new
                {
                    title = "Contexto muito extenso",
                    detail = "Reduza a pergunta ou ajuste o limite de contexto configurado para o modelo."
                }, statusCode: StatusCodes.Status413PayloadTooLarge);
            }
            catch (ChatProviderException ex)
            {
                app.Logger.LogWarning(
                    "Chat provider failure. Provider=Groq StatusCode={StatusCode} CorrelationId={CorrelationId}",
                    ex.StatusCode, correlationId);
                return Results.Json(new
                {
                    title = "Serviço de IA indisponível",
                    detail = "Não foi possível gerar a resposta. Verifique a configuração do provedor e tente novamente mais tarde."
                }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                app.Logger.LogWarning(
                    "Chat request failed. FailureType={FailureType} CorrelationId={CorrelationId}",
                    ex.GetType().Name, correlationId);
                return Results.Json(new
                {
                    title = "Resposta da IA inválida",
                    detail = "O serviço de IA respondeu com um formato inesperado. Tente novamente."
                }, statusCode: StatusCodes.Status502BadGateway);
            }

            if (!ChatPromptBuilder.TryParseAnswer(turn.Completion.Content, out var answer))
            {
                app.Logger.LogWarning(
                    "Chat provider response did not satisfy the answer contract. Model={Model} CorrelationId={CorrelationId}",
                    model, correlationId);
                return Results.Json(new
                {
                    title = "Resposta da IA inválida",
                    detail = "O serviço de IA respondeu com um formato inesperado. Tente novamente."
                }, statusCode: StatusCodes.Status502BadGateway);
            }

            var savedCitations = ChatPromptBuilder.ResolveCitations(answer, turn.RetrievedDocuments)
                .Select(document => new ChatHistoricoCitacao
                {
                    Id = document.Id,
                    Titulo = document.Title,
                    Data = document.Date
                })
                .ToArray();

            try
            {
                await chatHistoryRepo.SaveExchangeAsync(
                    userId, chatDate, req.SessionId, req.Message, answer.Response, savedCitations, cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                app.Logger.LogError(
                    "Could not save the chat exchange. FailureType={FailureType} CorrelationId={CorrelationId}",
                    ex.GetType().Name, correlationId);
                return Results.Problem(
                    title: "Não foi possível salvar a conversa",
                    detail: "A resposta foi gerada, mas não pôde ser salva. Tente novamente.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            return Results.Ok(new ChatResponse(
                answer.Response,
                savedCitations.Select(citation => new ChatCitation(citation.Id, citation.Titulo, citation.Data)).ToArray()));
        }).Produces<ChatResponse>().RequireAuthorization().RequireRateLimiting("chat");
    }

    private static bool ReadBooleanSetting(IConfiguration configuration, string environmentName, string configurationKey, bool defaultValue)
    {
        var raw = Environment.GetEnvironmentVariable(environmentName)
            ?? configuration[environmentName]
            ?? configuration[configurationKey];
        return bool.TryParse(raw, out var value) ? value : defaultValue;
    }

    private static int ReadBoundedSetting(
        IConfiguration configuration,
        string environmentName,
        string configurationKey,
        int defaultValue,
        int minimum,
        int maximum)
    {
        var raw = Environment.GetEnvironmentVariable(environmentName)
            ?? configuration[environmentName]
            ?? configuration[configurationKey];
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value)
            ? Math.Clamp(value, minimum, maximum)
            : defaultValue;
    }
}

public sealed class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string ChatDate { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
}

public record ChatHistoryMessage(string Id, string Role, string Content, DateTime CreatedAt, string? SessionId, ChatCitation[] Citations);
public record ChatHistoryResponse(string Date, ChatHistoryMessage[] Messages);
public record ChatHistoryDay(string Date, int MessageCount, DateTime UpdatedAt);
public record ChatHistoryDaysResponse(ChatHistoryDay[] Days);
public record ChatCitation(string Id, string Titulo, string Data);
public record ChatResponse(string Response, ChatCitation[] Citations);
public record DocumentoConsultadoItem(string DocumentoId, string Titulo, string DataDocumento, string Pergunta, DateTime DataConsulta, string? DataChat);
