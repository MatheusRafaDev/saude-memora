using System.Security.Claims;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Api.Endpoints;

public static class MedicamentoEndpoints
{
    public static void MapMedicamentoEndpoints(this WebApplication app)
    {
        app.MapGet("/api/medicamentos/{nome}/descricao", async (
            string nome,
            IMedicamentoApiService service,
            CancellationToken cancellationToken) =>
        {
            var descricao = await service.BuscarDescricaoAsync(nome, cancellationToken);
            return descricao is null
                ? Results.NotFound(new { message = "Descrição não encontrada." })
                : Results.Ok(descricao);
        }).RequireAuthorization();
    }
}
