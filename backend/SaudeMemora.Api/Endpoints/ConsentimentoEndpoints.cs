using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Application.DTOs;
using System.Security.Claims;
using SaudeMemora.Api.Helpers;
using Microsoft.Extensions.Caching.Distributed;
using SaudeMemora.Infrastructure.Data;

namespace SaudeMemora.Api.Endpoints;

public class ConsentimentoDto
{
    public bool Aceito { get; set; }
    public string? Finalidade { get; set; }
    public bool Dispensar { get; set; }
}

public record ConsentimentoStatusResponse(
    bool Aceito,
    bool OcrAceito,
    bool ChatAceito,
    string VersaoTermo,
    DateTime? AceitoEm,
    DateTime? AdiadoAte,
    bool MostrarModal);

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

            return Results.Ok(ToResponse(paciente.ConsentimentoIa ?? new ConsentimentoIa()));
        }).Produces<ConsentimentoStatusResponse>();

        group.MapPost("/", async ([FromBody] ConsentimentoDto dto, ClaimsPrincipal user, IPacienteRepository repo, HttpContext context, IDistributedCache cache) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            var consentimento = paciente.ConsentimentoIa ??= new ConsentimentoIa();
            var agora = DateTime.UtcNow;
            var ipTruncado = NetworkHelpers.GetTruncatedIp(context);

            if (dto.Dispensar)
            {
                consentimento.DispensadoAte = agora.AddDays(7);
                consentimento.VersaoDispensada = ConsentimentoIa.VersaoTermoAtual;
                await repo.UpdateAsync(paciente);
                await cache.SafeRemoveAsync($"paciente_v2_{userId}");
                return Results.Ok(ToResponse(consentimento));
            }

            var finalidadeSolicitada = dto.Finalidade?.Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(finalidadeSolicitada)
                && finalidadeSolicitada is not ("ocr" or "chat"))
            {
                return Results.BadRequest(new { message = "Finalidade inválida. Use 'ocr' ou 'chat'." });
            }

            EnsurePurposeConsents(consentimento);
            var finalidades = finalidadeSolicitada switch
            {
                "ocr" => new[] { consentimento.Ocr! },
                "chat" => new[] { consentimento.Chat! },
                _ => new[] { consentimento.Ocr!, consentimento.Chat! }
            };

            foreach (var finalidade in finalidades)
            {
                var nomeFinalidade = ReferenceEquals(finalidade, consentimento.Ocr) ? "OCR" : "Chat";
                UpdatePurposeConsent(consentimento, finalidade, nomeFinalidade, dto.Aceito, ipTruncado, agora);
            }

            if (string.IsNullOrWhiteSpace(finalidadeSolicitada))
            {
                consentimento.Aceito = dto.Aceito;
                if (dto.Aceito)
                {
                    consentimento.VersaoTermo = ConsentimentoIa.VersaoTermoAtual;
                    consentimento.AceitoEm = agora;
                    consentimento.RevogadoEm = null;
                    consentimento.IpTruncado = ipTruncado;
                    consentimento.Historico.Add(new ConsentimentoHistorico
                    {
                        Acao = "Aceitou",
                        DataHora = agora,
                        IpTruncado = ipTruncado
                    });
                }
                else
                {
                    consentimento.RevogadoEm = agora;
                    consentimento.Historico.Add(new ConsentimentoHistorico
                    {
                        Acao = "Revogou",
                        DataHora = agora,
                        IpTruncado = ipTruncado
                    });
                }
            }
            else if (dto.Aceito && consentimento.Ocr!.Aceito && consentimento.Chat!.Aceito
                     && (!consentimento.Aceito || consentimento.VersaoTermo != ConsentimentoIa.VersaoTermoAtual))
            {
                consentimento.Aceito = true;
                consentimento.VersaoTermo = ConsentimentoIa.VersaoTermoAtual;
                consentimento.AceitoEm = agora;
                consentimento.RevogadoEm = null;
                consentimento.IpTruncado = ipTruncado;
                consentimento.DispensadoAte = null;
                consentimento.VersaoDispensada = null;
                consentimento.Historico.Add(new ConsentimentoHistorico
                {
                    Acao = "Aceitou",
                    DataHora = agora,
                    IpTruncado = ipTruncado
                });
            }

            if (string.IsNullOrWhiteSpace(finalidadeSolicitada) && dto.Aceito)
            {
                consentimento.DispensadoAte = null;
                consentimento.VersaoDispensada = null;
            }
            await repo.UpdateAsync(paciente);
            await cache.SafeRemoveAsync($"paciente_v2_{userId}");
            return Results.Ok(ToResponse(consentimento));
        }).Produces<ConsentimentoStatusResponse>();

        group.MapDelete("/", async (ClaimsPrincipal user, IPacienteRepository repo, HttpContext context, IDistributedCache cache) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var paciente = await repo.GetByIdAsync(userId);
            if (paciente == null) return Results.NotFound();

            if (paciente.ConsentimentoIa != null)
            {
                string ipTruncado = NetworkHelpers.GetTruncatedIp(context);
                var agora = DateTime.UtcNow;
                EnsurePurposeConsents(paciente.ConsentimentoIa);
                UpdatePurposeConsent(paciente.ConsentimentoIa, paciente.ConsentimentoIa.Ocr!, "OCR", false, ipTruncado, agora);
                UpdatePurposeConsent(paciente.ConsentimentoIa, paciente.ConsentimentoIa.Chat!, "Chat", false, ipTruncado, agora);
                paciente.ConsentimentoIa.Aceito = false;
                paciente.ConsentimentoIa.RevogadoEm = agora;
                paciente.ConsentimentoIa.Historico.Add(new ConsentimentoHistorico { Acao = "Revogou", DataHora = agora, IpTruncado = ipTruncado });
                await repo.UpdateAsync(paciente);
            }

            await cache.SafeRemoveAsync($"paciente_v2_{userId}");
            return Results.NoContent();
        }).Produces(StatusCodes.Status204NoContent);
    }

    private static void EnsurePurposeConsents(ConsentimentoIa consentimento)
    {
        consentimento.Ocr ??= FromLegacy(consentimento);
        consentimento.Chat ??= FromLegacy(consentimento);
    }

    private static ConsentimentoFinalidade FromLegacy(ConsentimentoIa consentimento) => new()
    {
        Aceito = consentimento.Aceito,
        VersaoTermo = consentimento.VersaoTermo,
        AceitoEm = consentimento.AceitoEm,
        RevogadoEm = consentimento.RevogadoEm,
        IpTruncado = consentimento.IpTruncado,
    };

    private static void UpdatePurposeConsent(ConsentimentoIa consentimento, ConsentimentoFinalidade finalidade, string nomeFinalidade, bool aceito, string? ipTruncado, DateTime agora)
    {
        if (finalidade.Aceito == aceito && (!aceito || finalidade.VersaoTermo == ConsentimentoIa.VersaoTermoAtual)) return;

        finalidade.Aceito = aceito;
        if (aceito)
        {
            finalidade.VersaoTermo = ConsentimentoIa.VersaoTermoAtual;
            finalidade.AceitoEm = agora;
            finalidade.RevogadoEm = null;
        }
        else
        {
            finalidade.RevogadoEm = agora;
        }
        finalidade.IpTruncado = ipTruncado;
        consentimento.Historico.Add(new ConsentimentoHistorico
        {
            Acao = $"{(aceito ? "Aceitou" : "Revogou")} {nomeFinalidade}",
            DataHora = agora,
            IpTruncado = ipTruncado
        });
    }

    private static ConsentimentoStatusResponse ToResponse(ConsentimentoIa consentimento)
    {
        var ocrAceito = consentimento.HasOcrConsent();
        var chatAceito = consentimento.HasChatConsent();
        return new ConsentimentoStatusResponse(
            consentimento.Aceito && consentimento.VersaoTermo == ConsentimentoIa.VersaoTermoAtual,
            ocrAceito,
            chatAceito,
            consentimento.VersaoTermo,
            consentimento.AceitoEm,
            consentimento.DispensadoAte,
            consentimento.ShouldShowPrompt(DateTime.UtcNow));
    }
}
