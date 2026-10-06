using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Api.Endpoints;

public static class ReprocessamentoEndpoints
{
    public static void MapReprocessamentoEndpoints(this WebApplication app)
    {
        app.MapPost("/api/documents/{id}/reprocessar", async (
            string id,
            ClaimsPrincipal user,
            IDocumentRepository repo,
            IPacienteRepository pacienteRepo,
            Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await pacienteRepo.GetByIdAsync(userId);
            if (paciente?.ConsentimentoIa?.Aceito != true)
                return Results.BadRequest(new { error = "É necessário consentir com o processamento por IA." });

            var doc = await repo.GetByIdAsync(id);
            if (doc == null || doc.PacienteId != userId) return Results.NotFound();

            if (doc.Status == "processing") return Results.BadRequest(new { message = "Documento já está em processamento." });
            if (doc.ReprocessCount >= 5) return Results.BadRequest(new { message = "Limite de reprocessamentos atingido para este documento." });

            doc.Status = "pending";
            doc.Progress = 0;
            doc.LockedUntil = null;
            doc.LockedBy = string.Empty;
            doc.Attempts = 0; 
            doc.ReprocessCount++;
            doc.ErrorMessage = string.Empty;

            await repo.UpdateAsync(doc);
            await cache.RemoveAsync($"documents_v3_{userId}");
            await cache.RemoveAsync($"documents_count_v3_{userId}");
            
            return Results.Ok(new { message = "Documento enviado para reprocessamento na fila." });
        }).RequireAuthorization().RequireRateLimiting("upload");
    }
}
