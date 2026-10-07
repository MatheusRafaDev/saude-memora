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
        // Endpoint de status
        app.MapGet("/api/pacientes/me/emergencia/status", async (ClaimsPrincipal user, IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            return Results.Ok(new
            {
                possuiToken = !string.IsNullOrEmpty(paciente.TokenEmergencia) && 
                              (paciente.TokenEmergenciaExpiraEm == null || paciente.TokenEmergenciaExpiraEm > DateTime.UtcNow),
                expiraEm = paciente.TokenEmergenciaExpiraEm
            });
        }).RequireAuthorization();

        // Gera token novo
        app.MapPost("/api/pacientes/me/emergencia", async (ClaimsPrincipal user, IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            var (rawToken, expiraEm) = await GerarNovoTokenEmergenciaAsync(paciente, repo);
            return Results.Ok(new { token = rawToken, expiraEm });
        }).RequireAuthorization();

        // Rotaciona token (mesma lógica do POST)
        app.MapPost("/api/pacientes/me/emergencia/rotate", async (ClaimsPrincipal user, IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            var (rawToken, expiraEm) = await GerarNovoTokenEmergenciaAsync(paciente, repo);
            return Results.Ok(new { token = rawToken, expiraEm });
        }).RequireAuthorization();

        // Endpoint público que retorna os dados a partir do token
        app.MapGet("/api/emergencia/{token}", async (
            string token,
            HttpContext context,
            IPacienteRepository repo,
            IFichaMedicaRepository fichaRepo) =>
        {
            var tokenHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));
            var paciente = await repo.GetByEmergenciaTokenAsync(tokenHash);
            if (paciente == null || paciente.IsDeleting) return Results.NotFound();

            if (paciente.TokenEmergenciaExpiraEm.HasValue && paciente.TokenEmergenciaExpiraEm.Value < DateTime.UtcNow)
            {
                return Results.NotFound();
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
    }

    private static async Task<(string rawToken, DateTime? expiraEm)> GerarNovoTokenEmergenciaAsync(SaudeMemora.Domain.Entities.Paciente paciente, IPacienteRepository repo)
    {
        var rawToken = Guid.NewGuid().ToString("N");
        paciente.TokenEmergencia = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken)));
        
        var expirationDaysString = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_DIAS_EXPIRACAO");
        if (!int.TryParse(expirationDaysString, out var days) || days < 1 || days > 365)
        {
            days = 30;
        }
        paciente.TokenEmergenciaExpiraEm = DateTime.UtcNow.AddDays(days);

        await repo.UpdateAsync(paciente);
        return (rawToken, paciente.TokenEmergenciaExpiraEm);
    }
}
