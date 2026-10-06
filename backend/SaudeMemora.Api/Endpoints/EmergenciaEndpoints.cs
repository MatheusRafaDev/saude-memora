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
        // 1. Gera o token de emergência (agora como POST)
        app.MapPost("/api/pacientes/me/emergencia", async (
            ClaimsPrincipal user, 
            IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            var rawToken = Guid.NewGuid().ToString("N");
            paciente.TokenEmergencia = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken)));
            
            var expirationDaysString = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_DIAS_EXPIRACAO");
            int expirationDays = int.TryParse(expirationDaysString, out var days) ? days : 30;
            paciente.TokenEmergenciaExpiraEm = DateTime.UtcNow.AddDays(expirationDays);

            await repo.UpdateAsync(paciente);

            return Results.Ok(new { token = rawToken, expiraEm = paciente.TokenEmergenciaExpiraEm });
        }).RequireAuthorization();

        // 2. Endpoint público que retorna os dados a partir do token
        app.MapGet("/api/emergencia/{token}", async (
            string token,
            HttpContext context,
            IPacienteRepository repo,
            IFichaMedicaRepository fichaRepo) =>
        {
            var tokenHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));
            var paciente = await repo.GetByEmergenciaTokenAsync(tokenHash);
            if (paciente == null) return Results.NotFound();

            if (paciente.TokenEmergenciaExpiraEm.HasValue && paciente.TokenEmergenciaExpiraEm.Value < DateTime.UtcNow)
            {
                return Results.NotFound(); // Retornar 404 para token expirado, conforme solicitado
            }

            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Acesso de emergência ao perfil do paciente {PacienteId}", paciente.Id);

            var ficha = await fichaRepo.GetByPacienteIdAsync(paciente.Id!);
            
            var result = new
            {
                nome = paciente.Nome,
                tipoSanguineo = ficha?.TipoSanguineo ?? "Não informado",
                alergias = ficha?.Alergias ?? new List<string>(),
                doencasCronicas = ficha?.DoencasCronicas ?? new List<string>(),
                medicamentosContinuos = ficha?.MedicamentosContinuos ?? new List<string>(),
                contatosEmergencia = paciente.ContatoEmergencia ?? "Não informado"
            };

            return Results.Ok(result);
        }).AllowAnonymous().RequireRateLimiting("emergencia");

        // 3. Endpoint para rotacionar/revogar o token de emergência
        app.MapPost("/api/pacientes/me/emergencia/rotate", async (
            ClaimsPrincipal user, 
            IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            var rawToken = Guid.NewGuid().ToString("N");
            paciente.TokenEmergencia = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken)));
            
            var expirationDaysString = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_DIAS_EXPIRACAO");
            int expirationDays = int.TryParse(expirationDaysString, out var days) ? days : 30;
            paciente.TokenEmergenciaExpiraEm = DateTime.UtcNow.AddDays(expirationDays);

            await repo.UpdateAsync(paciente);

            return Results.Ok(new { token = rawToken, expiraEm = paciente.TokenEmergenciaExpiraEm });
        }).RequireAuthorization();
    }
}
