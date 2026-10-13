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
        }).Produces<EmergencyStatusResponse>().RequireAuthorization();

        // Gera token novo
        app.MapPost("/api/pacientes/me/emergencia", async (ClaimsPrincipal user, IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            var (rawToken, expiraEm) = await GerarNovoTokenEmergenciaAsync(paciente, repo);
            return Results.Ok(new { token = rawToken, expiraEm });
        }).Produces<EmergencyTokenResponse>().RequireAuthorization();

        // Rotaciona token (mesma lógica do POST)
        app.MapPost("/api/pacientes/me/emergencia/rotate", async (ClaimsPrincipal user, IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            var (rawToken, expiraEm) = await GerarNovoTokenEmergenciaAsync(paciente, repo);
            return Results.Ok(new { token = rawToken, expiraEm });
        }).Produces<EmergencyTokenResponse>().RequireAuthorization();

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
            int? idade = null;
            if (DateTime.TryParseExact(paciente.DataNascimento, new[] { "dd/MM/yyyy", "yyyy-MM-dd" },
                System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dataNascimento))
            {
                var hoje = DateTime.UtcNow.Date;
                idade = hoje.Year - dataNascimento.Year;
                if (dataNascimento.Date > hoje.AddYears(-idade.Value)) idade--;
            }

            var result = new EmergencyPublicResponse(
                paciente.Nome,
                idade,
                paciente.Sexo,
                ficha?.TipoSanguineo ?? "Não informado",
                ficha?.Alergias ?? new List<string>(),
                (ficha?.DoencasCronicas ?? new List<string>())
                    .Concat(ficha?.Condicoes?.Where(condicao => condicao.Tem).Select(condicao => condicao.Nome)
                        ?? Enumerable.Empty<string>())
                    .Where(condicao => !string.IsNullOrWhiteSpace(condicao))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList(),
                ficha?.MedicamentosContinuos ?? new List<string>(),
                paciente.ContatoEmergencia ?? "Não informado",
                ficha?.DoadorOrgaos,
                ficha?.Cirurgias ?? string.Empty);

            context.Response.Headers.CacheControl = "no-store";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";

            return Results.Ok(result);
        }).Produces<EmergencyPublicResponse>().AllowAnonymous().RequireRateLimiting("emergencia");
    }

    private static async Task<(string rawToken, DateTime? expiraEm)> GerarNovoTokenEmergenciaAsync(SaudeMemora.Domain.Entities.Paciente paciente, IPacienteRepository repo)
    {
        var rawToken = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var tokenHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken)));
        var expirationDaysString = Environment.GetEnvironmentVariable("EMERGENCIA_TOKEN_DIAS_EXPIRACAO");
        if (!int.TryParse(expirationDaysString, out var days) || days < 1 || days > 30)
        {
            days = 7;
        }
        var expiraEm = DateTime.UtcNow.AddDays(days);
        paciente.TokenEmergencia = tokenHash;
        paciente.TokenEmergenciaExpiraEm = expiraEm;
        await repo.UpdateAsync(paciente);
        return (rawToken, expiraEm);
    }
}

public record EmergencyStatusResponse(bool PossuiToken, DateTime? ExpiraEm);
public record EmergencyTokenResponse(string Token, DateTime? ExpiraEm);
public record EmergencyPublicResponse(
    string Nome,
    int? Idade,
    string Sexo,
    string TipoSanguineo,
    List<string> Alergias,
    List<string> DoencasCronicas,
    List<string> MedicamentosContinuos,
    string ContatosEmergencia,
    bool? DoadorOrgaos,
    string Cirurgias);
