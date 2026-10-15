using SaudeMemora.Application.Interfaces;
using System.Security.Claims;

namespace SaudeMemora.Api.Helpers;

/// <summary>
/// Monta o <see cref="AuditoriaContexto"/> a partir da requisição HTTP.
/// Fica na camada Api para manter a Application livre de dependência de ASP.NET Core.
/// </summary>
public static class AuditoriaContextoExtensions
{
    public static AuditoriaContexto ParaAuditoria(this HttpContext? context)
    {
        if (context is null) return AuditoriaContexto.Anonimo();

        var pacienteId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return new AuditoriaContexto(pacienteId, NetworkHelpers.GetTruncatedIp(context));
    }

    /// <summary>Contexto para acesso anônimo (ex.: ficha pública de emergência).</summary>
    public static AuditoriaContexto ParaAuditoriaAnonima(this HttpContext? context)
    {
        if (context is null) return AuditoriaContexto.Anonimo();
        return AuditoriaContexto.Anonimo(NetworkHelpers.GetTruncatedIp(context));
    }
}
