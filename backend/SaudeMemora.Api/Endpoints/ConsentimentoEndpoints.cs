using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Application.DTOs;
using System.Security.Claims;
using SaudeMemora.Api.Helpers;

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

            string ipTruncado = NetworkHelpers.GetTruncatedIp(context);

            if (paciente.ConsentimentoIa == null)
            {
                paciente.ConsentimentoIa = new ConsentimentoIa();
            }

            if (dto.Aceito)
            {
                if (!paciente.ConsentimentoIa.Aceito)
                {
                    paciente.ConsentimentoIa.Aceito = true;
                    paciente.ConsentimentoIa.VersaoTermo = "v1.0";
                    paciente.ConsentimentoIa.AceitoEm = DateTime.UtcNow; // Atualiza sempre ao reaceitar
                    paciente.ConsentimentoIa.IpTruncado = ipTruncado;
                    paciente.ConsentimentoIa.RevogadoEm = null; // Limpa revogação
                    
                    paciente.ConsentimentoIa.Historico.Add(new ConsentimentoHistorico
                    {
                        Acao = "Aceitou",
                        DataHora = DateTime.UtcNow,
                        IpTruncado = ipTruncado
                    });
                }
            }
            else
            {
                if (paciente.ConsentimentoIa.Aceito)
                {
                    paciente.ConsentimentoIa.Aceito = false;
                    paciente.ConsentimentoIa.RevogadoEm = DateTime.UtcNow;
                    paciente.ConsentimentoIa.Historico.Add(new ConsentimentoHistorico
                    {
                        Acao = "Revogou",
                        DataHora = DateTime.UtcNow,
                        IpTruncado = ipTruncado
                    });
                }
            }

            await repo.UpdateAsync(paciente);
            return Results.Ok(paciente.ConsentimentoIa);
        });

        group.MapDelete("/", async (ClaimsPrincipal user, IPacienteRepository repo, HttpContext context) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            if (paciente.ConsentimentoIa != null && paciente.ConsentimentoIa.Aceito)
            {
                string ipTruncado = NetworkHelpers.GetTruncatedIp(context);

                paciente.ConsentimentoIa.Aceito = false;
                paciente.ConsentimentoIa.RevogadoEm = DateTime.UtcNow;
                paciente.ConsentimentoIa.Historico.Add(new ConsentimentoHistorico
                {
                    Acao = "Revogou",
                    DataHora = DateTime.UtcNow,
                    IpTruncado = ipTruncado
                });

                await repo.UpdateAsync(paciente);
            }

            return Results.NoContent();
        });
    }
}
