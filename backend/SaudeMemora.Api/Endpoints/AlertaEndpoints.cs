using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Domain.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace SaudeMemora.Api.Endpoints;

public static class AlertaEndpoints
{
    public static void MapAlertaEndpoints(this WebApplication app)
    {
        app.MapPost("/api/documents/{id}/alertas/{alertaId}/dispensar", async (
            string id, 
            string alertaId, 
            ClaimsPrincipal user, 
            IDocumentRepository repo,
            IDistributedCache cache) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var doc = await repo.GetByIdAsync(id);
            if (doc == null || doc.PacienteId != userId) return Results.NotFound();

            var alerta = doc.Alertas.FirstOrDefault(a => a.Id == alertaId);
            if (alerta == null) return Results.NotFound();

            alerta.Dispensado = true;

            await repo.UpdateAsync(doc);
            await cache.RemoveAsync($"documents_v3_{userId}");

            return Results.Ok(new { message = "Alerta dispensado com sucesso." });
        }).RequireAuthorization();
    }
}
