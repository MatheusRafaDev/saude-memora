using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace SaudeMemora.Api.Endpoints;

public static class EmergenciaEndpoints
{
    public static void MapEmergenciaEndpoints(this WebApplication app)
    {
        // 1. Gera ou recupera o token de emergência
        app.MapGet("/api/pacientes/me/emergencia", async (
            ClaimsPrincipal user, 
            IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            if (string.IsNullOrEmpty(paciente.TokenEmergencia))
            {
                paciente.TokenEmergencia = Guid.NewGuid().ToString("N");
                await repo.UpdateAsync(paciente);
            }

            return Results.Ok(new { token = paciente.TokenEmergencia });
        }).RequireAuthorization();

        // 2. Endpoint público que retorna os dados a partir do token
        app.MapGet("/api/emergencia/{token}", async (
            string token,
            IPacienteRepository repo,
            IFichaMedicaRepository fichaRepo,
            IDocumentRepository docRepo) =>
        {
            var paciente = await repo.GetByEmergenciaTokenAsync(token);
            if (paciente == null) return Results.NotFound();

            var ficha = await fichaRepo.GetByPacienteIdAsync(paciente.Id!);
            var docs = await docRepo.GetAllByPacienteIdAsync(paciente.Id!);
            
            var result = new
            {
                nome = paciente.Nome,
                tipoSanguineo = ficha?.TipoSanguineo ?? "Não informado",
                alergias = ficha?.Alergias ?? new List<string>(),
                doencasCronicas = ficha?.DoencasCronicas ?? new List<string>(),
                medicamentosContinuos = ficha?.MedicamentosContinuos ?? new List<string>(),
                contatosEmergencia = paciente.Telefone ?? "Não informado"
            };

            return Results.Ok(result);
        }).AllowAnonymous();

        // 3. Endpoint para rotacionar/revogar o token de emergência
        app.MapPost("/api/pacientes/me/emergencia/rotate", async (
            ClaimsPrincipal user, 
            IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            paciente.TokenEmergencia = Guid.NewGuid().ToString("N");
            await repo.UpdateAsync(paciente);

            return Results.Ok(new { token = paciente.TokenEmergencia });
        }).RequireAuthorization();
    }
}
