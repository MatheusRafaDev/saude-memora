using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace SaudeMemora.Api.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    // Item 8: ISistemaLogRepository é Scoped — não pode ser injetado no construtor de Singleton.
    // Usamos IServiceScopeFactory e criamos scope dentro do TryHandleAsync.
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Uma exceção não tratada ocorreu durante a requisição {Path}", httpContext.Request.Path);

        var userId = httpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier);

        // Registrar no log (dentro de scope para resolver serviço Scoped)
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var logRepo = scope.ServiceProvider.GetRequiredService<ISistemaLogRepository>();
            await logRepo.CriarLogAsync(new SistemaLog
            {
                Nivel = "Error",
                Acao = "ExcecaoGlobal",
                Detalhes = $"[{httpContext.Request.Method} {httpContext.Request.Path}] {exception.GetType().Name}\n{exception.StackTrace}",
                PacienteId = userId
            });
        }
        catch (Exception logEx)
        {
            _logger.LogWarning(logEx, "Falha ao registrar exceção global no log.");
        }

        // Configurar a resposta ProblemDetails
        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Ocorreu um erro interno no servidor.",
            Detail = "Não foi possível processar a sua requisição. Nossa equipe já foi notificada.",
            Instance = httpContext.Request.Path
        };

        // Item 8: ArgumentException e InvalidOperationException genéricas → 500 (sem expor Message).
        // Apenas exceções de domínio mapeadas explicitamente → 4xx.
        if (exception is UnauthorizedAccessException)
        {
            problemDetails.Status = StatusCodes.Status401Unauthorized;
            problemDetails.Title = "Não autorizado";
            problemDetails.Detail = "Você não tem permissão para realizar esta ação.";
        }

        httpContext.Response.StatusCode = problemDetails.Status.Value;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
