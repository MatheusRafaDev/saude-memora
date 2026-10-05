using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Application.DTOs;
using System.Security.Claims;

namespace SaudeMemora.Api.Endpoints;

public class ConsentimentoDto
{
    public bool Aceito { get; set; }
}

public static class ConsentimentoEndpoints
{
    public static void MapConsentimentoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/pacientes/me/consentimento")
                       .RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            return Results.Ok(paciente.ConsentimentoIa ?? new ConsentimentoIa { Aceito = false, VersaoTermo = "" });
        });

        group.MapPost("/", async ([FromBody] ConsentimentoDto dto, ClaimsPrincipal user, IPacienteRepository repo, HttpContext context) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            string? ip = context.Connection.RemoteIpAddress?.ToString();
            string ipTruncado = string.Empty;
            
            if (!string.IsNullOrEmpty(ip))
            {
                // Mask the IP: 192.168.1.5 -> 192.168.1.***
                var parts = ip.Split('.');
                if (parts.Length == 4)
                {
                    ipTruncado = $"{parts[0]}.{parts[1]}.{parts[2]}.***";
                }
                else
                {
                    // Fallback for IPv6 or other formats
                    ipTruncado = ip.Length > 4 ? ip.Substring(0, ip.Length - 4) + "****" : "****";
                }
            }

            paciente.ConsentimentoIa = new ConsentimentoIa
            {
                Aceito = dto.Aceito,
                VersaoTermo = "v1.0", // Hardcoded per requirements
                AceitoEm = DateTime.UtcNow,
                IpTruncado = ipTruncado
            };

            await repo.UpdateAsync(paciente);
            return Results.Ok(paciente.ConsentimentoIa);
        });

        group.MapDelete("/", async (ClaimsPrincipal user, IPacienteRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            if (paciente.ConsentimentoIa != null)
            {
                paciente.ConsentimentoIa.Aceito = false;
                paciente.ConsentimentoIa.AceitoEm = DateTime.UtcNow;
                // keep the term version and IP for auditing purposes
                await repo.UpdateAsync(paciente);
            }

            return Results.NoContent();
        });
    }
}
