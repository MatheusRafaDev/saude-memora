using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Api.Endpoints;

public static class MedicamentoCatalogoEndpoints
{
    public static void MapMedicamentoCatalogoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/catalogo-medicamentos").RequireAuthorization();

        group.MapGet("", async (
            [FromQuery] string query,
            [FromQuery] int limit,
            IMedicamentoCatalogoService service,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 3)
            {
                return Results.BadRequest(new { message = "A consulta deve conter pelo menos 3 caracteres." });
            }

            var medicamentos = await service.BuscarAsync(query, limit > 0 ? limit : 20, cancellationToken);
            return Results.Ok(new
            {
                query = query.Trim(),
                count = medicamentos.Count,
                medicamentos = medicamentos.Select(m => new
                {
                    m.ProcessoAnvisa,
                    m.Nome,
                    m.Descricao,
                    m.Fabricante,
                    m.TipoProduto,
                    m.ClasseTerapeutica
                })
            });
        });

        group.MapPost("/importar", async (
            [FromForm] IFormFile file,
            IMedicamentoCatalogoService service,
            CancellationToken cancellationToken) =>
        {
            if (file is null || file.Length == 0)
            {
                return Results.BadRequest(new { message = "Um arquivo CSV é obrigatório." });
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new { message = "Apenas arquivos CSV são aceitos." });
            }

            await using var stream = file.OpenReadStream();
            var result = await service.ImportarAsync(stream, cancellationToken);
            return Results.Ok(result);
        }).AddEndpointFilter<ImportacaoCatalogoFilter>();
    }
}

public class ImportacaoCatalogoFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var expectedToken = Environment.GetEnvironmentVariable("CATALOGO_IMPORT_TOKEN");
        if (string.IsNullOrWhiteSpace(expectedToken))
        {
            return new ObjectResult(new
            {
                title = "Importação indisponível",
                detail = "CATALOGO_IMPORT_TOKEN não está configurado."
            })
            {
                StatusCode = StatusCodes.Status503ServiceUnavailable
            };
        }

        var actualToken = context.HttpContext.Request.Headers["X-Import-Token"].FirstOrDefault();
        var expectedHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(expectedToken)));
        var actualHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(actualToken ?? string.Empty)));
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expectedHash), Encoding.UTF8.GetBytes(actualHash)))
        {
            return new ObjectResult(new { title = "Token inválido", detail = "O token de importação é obrigatório." })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
        }

        return await next(context);
    }
}
