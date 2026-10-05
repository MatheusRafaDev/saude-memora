using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Api.Endpoints;

public class ResultadoSerieDto
{
    public string DataStr { get; set; } = string.Empty;
    public long DataTicks { get; set; }
    public double Valor { get; set; }
    public string Unidade { get; set; } = string.Empty;
    public double? RefMin { get; set; }
    public double? RefMax { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DocumentoId { get; set; } = string.Empty;
}

public static class ExamesEndpoints
{
    public static void MapExamesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/exames").RequireAuthorization();

        group.MapGet("/analitos", async (
            ClaimsPrincipal user,
            IDocumentRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var docs = await repo.GetAllByPacienteIdAsync(userId);
            var exames = docs.Where(d => d.Tipo == "exame" && d.Status == "pronto" && d.ResultadosExame != null);

            var analitos = exames
                .SelectMany(d => d.ResultadosExame)
                .Where(r => !string.IsNullOrEmpty(r.NomeNormalizado))
                .GroupBy(r => r.NomeNormalizado)
                .Select(g => new
                {
                    nomeNormalizado = g.Key,
                    nome = g.First().Nome, // Pega o nome amigável do primeiro que achar
                    unidade = g.Where(x => !string.IsNullOrEmpty(x.Unidade)).Select(x => x.Unidade).FirstOrDefault() ?? "",
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .ToList();

            return Results.Ok(analitos);
        });

        group.MapGet("/serie", async (
            [FromQuery] string analito,
            [FromQuery] int meses,
            ClaimsPrincipal user,
            IDocumentRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            if (string.IsNullOrEmpty(analito)) return Results.BadRequest("Analito é obrigatório.");

            var docs = await repo.GetAllByPacienteIdAsync(userId);
            
            var dataLimite = DateTime.UtcNow.AddMonths(-meses);

            var resultados = new List<ResultadoSerieDto>();

            foreach (var doc in docs)
            {
                if (doc.Tipo != "exame" || doc.Status != "pronto" || doc.ResultadosExame == null) continue;
                if (string.IsNullOrEmpty(doc.Data)) continue;

                // Tenta fazer o parse da data brasileira DD/MM/YYYY
                if (!DateTime.TryParseExact(doc.Data, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out DateTime docData))
                {
                    continue; // Pula documento com data inválida
                }

                if (docData < dataLimite) continue;

                var item = doc.ResultadosExame.FirstOrDefault(r => r.NomeNormalizado == analito);
                if (item != null && item.Valor.HasValue)
                {
                    resultados.Add(new ResultadoSerieDto
                    {
                        DataStr = doc.Data,
                        DataTicks = docData.Ticks,
                        Valor = item.Valor.Value,
                        Unidade = item.Unidade ?? "",
                        RefMin = item.RefMin,
                        RefMax = item.RefMax,
                        Status = item.Status,
                        DocumentoId = doc.Id
                    });
                }
            }

            var serieOrdenada = resultados
                .OrderBy(r => r.DataTicks)
                .Select(r => new
                {
                    data = r.DataStr,
                    valor = r.Valor,
                    unidade = r.Unidade,
                    refMin = r.RefMin,
                    refMax = r.RefMax,
                    status = r.Status,
                    documentoId = r.DocumentoId
                })
                .ToList();

            return Results.Ok(serieOrdenada);
        });
    }
}
