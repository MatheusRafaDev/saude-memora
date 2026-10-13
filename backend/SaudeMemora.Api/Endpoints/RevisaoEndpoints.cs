using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Api.Endpoints;

public static class RevisaoEndpoints
{
    public static void MapRevisaoEndpoints(this WebApplication app)
    {
        app.MapPost("/api/documents/{id}/revisao/confirmar", async (
            string id,
            ClaimsPrincipal user,
            IDocumentRepository repo,
            Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var doc = await repo.GetByIdAsync(id);
            if (doc == null || doc.PacienteId != userId) return Results.NotFound();

            if (doc.CamposBaixaConfianca?.Count > 0)
                return Results.Conflict(new { error = "Edite e confirme cada campo destacado antes de concluir a revisão." });

            using var scope = app.Services.CreateScope();
            var sp = scope.ServiceProvider;
            var pacienteRepo = sp.GetRequiredService<IPacienteRepository>();

            doc.RevisaoPendente = false;
            doc.CamposBaixaConfianca = new List<string>();
            doc.RevisadoEm = DateTime.UtcNow;
            var paciente = await pacienteRepo.GetByIdAsync(userId);
            
            if (paciente?.ConsentimentoIa?.HasOcrConsent() == true)
            {
                var alertaService = sp.GetRequiredService<SaudeMemora.Application.Interfaces.IAlertaMedicamentoService>();
                var fichaRepo = sp.GetRequiredService<SaudeMemora.Application.Interfaces.IFichaMedicaRepository>();
                var ficha = await fichaRepo.GetByPacienteIdAsync(userId);
                var fichaMedica = ficha ?? new SaudeMemora.Domain.Entities.FichaMedica();
                
                doc.Alertas = await alertaService.GerarAlertasAsync(doc, fichaMedica);
            }

            await repo.UpdateAsync(doc);
            await cache.SafeRemoveAsync(SaudeMemora.Infrastructure.Repositories.DocumentRepository.UserDocumentsCacheKey(userId));
            await cache.SafeRemoveAsync(SaudeMemora.Infrastructure.Repositories.DocumentRepository.UserDocumentCountCacheKey(userId));
            
            return Results.Ok(new { message = "Revisão confirmada com sucesso." });
        }).Produces<ApiMessageResponse>().RequireAuthorization();
    }
}
