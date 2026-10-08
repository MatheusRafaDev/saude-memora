using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Api.Endpoints;

public static class CdosCatalogosEndpoints
{
    public static void MapCdosCatalogosEndpoints(this WebApplication app)
    {
        var cid10 = app.MapGroup("/api/catalogo-cid10").RequireAuthorization();
        cid10.MapGet("", async (
            [FromQuery] string query,
            [FromQuery] int limit,
            ICid10CatalogoService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 3)
            {
                return Results.BadRequest(new { message = "A consulta deve conter pelo menos 3 caracteres." });
            }

            var registros = await service.BuscarAsync(query, limit > 0 ? limit : 20, cancellationToken);
            return Results.Ok(new { query = query.Trim(), count = registros.Count, registros });
        });

        cid10.MapPost("/importar", async (
            [FromForm] IFormFile file,
            ICid10CatalogoService service,
            CancellationToken cancellationToken) =>
        {
            if (file is null || file.Length == 0) return Results.BadRequest(new { message = "Um arquivo CSV é obrigatório." });
            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)) return Results.BadRequest(new { message = "Apenas arquivos CSV são aceitos." });
            await using var stream = file.OpenReadStream();
            return Results.Ok(await service.ImportarAsync(stream, cancellationToken));
        }).AddEndpointFilter<ImportacaoCatalogoFilter>();

        var cnes = app.MapGroup("/api/catalogo-cnes").RequireAuthorization();
        cnes.MapGet("", async (
            [FromQuery] string query,
            [FromQuery] int limit,
            ICnesCatalogoService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 3)
            {
                return Results.BadRequest(new { message = "A consulta deve conter pelo menos 3 caracteres." });
            }

            var registros = await service.BuscarAsync(query, limit > 0 ? limit : 20, cancellationToken);
            return Results.Ok(new { query = query.Trim(), count = registros.Count, registros });
        });

        cnes.MapPost("/importar", async (
            [FromForm] IFormFile file,
            ICnesCatalogoService service,
            CancellationToken cancellationToken) =>
        {
            if (file is null || file.Length == 0) return Results.BadRequest(new { message = "Um arquivo CSV ou XML é obrigatório." });
            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)
                && !file.FileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new { message = "Apenas arquivos CSV ou XML são aceitos." });
            }
            await using var stream = file.OpenReadStream();
            return Results.Ok(await service.ImportarAsync(stream, cancellationToken));
        }).AddEndpointFilter<ImportacaoCatalogoFilter>();
    }
}
