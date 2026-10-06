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

namespace SaudeMemora.Api.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly ISistemaLogRepository _logRepo;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, ISistemaLogRepository logRepo)
    {
        _logger = logger;
        _logRepo = logRepo;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Uma exceção não tratada ocorreu durante a requisição {Path}", httpContext.Request.Path);

        var userId = httpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier);

        // Registrar no log
        await _logRepo.CriarLogAsync(new SistemaLog
        {
            Nivel = "Error",
            Acao = "ExcecaoGlobal",
            Detalhes = $"[{httpContext.Request.Method} {httpContext.Request.Path}] {exception.Message}\n{exception.StackTrace}",
            PacienteId = userId
        });

        // Configurar a resposta ProblemDetails
        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Ocorreu um erro interno no servidor.",
            Detail = "Não foi possível processar a sua requisição. Nossa equipe já foi notificada.",
            Instance = httpContext.Request.Path
        };

        if (exception is ArgumentException || exception is InvalidOperationException)
        {
            problemDetails.Status = StatusCodes.Status400BadRequest;
            problemDetails.Title = "Requisição inválida";
            problemDetails.Detail = exception.Message;
        }
        else if (exception is UnauthorizedAccessException)
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
