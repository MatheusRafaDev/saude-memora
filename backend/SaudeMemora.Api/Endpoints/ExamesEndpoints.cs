using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Services;

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
    public bool IsOutlier { get; set; } = false;
    public string? OutlierMotivo { get; set; }
}

public static class ExamesEndpoints
{
    // Limites fisiológicos absolutos por analito: (min plausível, max plausível)
    // Usados para detectar valores absurdamente impossíveis
    private static readonly Dictionary<string, (double PhysMin, double PhysMax)> _physiologicLimits = new(StringComparer.OrdinalIgnoreCase)
    {
        { "glicemia",           (10, 1500) },
        { "glicose",            (10, 1500) },
        { "hemoglobina_glicada",(1,  20) },
        { "colesterol_total",   (50, 1000) },
        { "colesterol_hdl",     (5,  200) },
        { "colesterol_ldl",     (5,  600) },
        { "triglicerideos",     (20, 10000) },
        { "tsh",                (0.0001, 200) },
        { "t4_livre",           (0.01, 10) },
        { "creatinina",         (0.1,  30) },
        { "ureia",              (2,   400) },
        { "tgo",                (1,   10000) },
        { "tgp",                (1,   10000) },
        { "vitamina_d",         (1,   500) },
        { "vitamina_b12",       (50,  5000) },
        { "ferritina",          (1,   50000) },
        { "psa",                (0,   1000) },
        { "acido_urico",        (0.5, 30) },
        { "calcio",             (4,   20) },
        { "potassio",           (1,   10) },
        { "sodio",              (100, 200) },
        { "ferro_serico",       (5,   1000) },
        { "insulina",           (1,   1000) },
        { "hemograma",          (0,   100) }, // genérico (porcentagem)
    };

    // Fator de desvio para outlier estatístico em relação ao histórico
    // Se novo valor > média ± (ZScoreFactor * desvio_padrão), é outlier
    private const double ZScoreFactor = 3.5;

    public static void MapExamesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/exames").RequireAuthorization();

        // GET /api/exames/analitos – lista todos os analitos disponíveis do paciente
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
                    nome = g.First().Nome,
                    unidade = g.Where(x => !string.IsNullOrEmpty(x.Unidade)).Select(x => x.Unidade).FirstOrDefault() ?? "",
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .ToList();

            return Results.Ok(analitos);
        });

        // GET /api/exames/serie – série histórica de um analito com normalização e detecção de outlier
        group.MapGet("/serie", async (
            [FromQuery] string analito,
            [FromQuery] int? meses,
            ClaimsPrincipal user,
            IDocumentRepository repo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            if (string.IsNullOrEmpty(analito)) return Results.BadRequest("Analito é obrigatório.");

            var docs = await repo.GetAllByPacienteIdAsync(userId);

            int m = meses ?? 12;
            if (m <= 0) m = 12;

            var dataLimite = DateTime.UtcNow.AddMonths(-m);
            var resultados = new List<ResultadoSerieDto>();

            foreach (var doc in docs)
            {
                if (doc.Tipo != "exame" || doc.Status != "pronto" || doc.ResultadosExame == null) continue;
                if (string.IsNullOrEmpty(doc.Data)) continue;

                if (!DateTime.TryParseExact(doc.Data, "dd/MM/yyyy",
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var docData)) continue;

                if (docData < dataLimite) continue;

                var item = doc.ResultadosExame.FirstOrDefault(r => r.NomeNormalizado == analito);
                if (item == null || !item.Valor.HasValue) continue;

                // 1. Normalização de unidade
                var valor = item.Valor.Value;
                var unidade = item.Unidade ?? "";
                var normalized = UnitNormalizer.TryNormalize(analito, valor, unidade);
                if (normalized.HasValue)
                {
                    valor = normalized.Value.Value;
                    unidade = normalized.Value.Unit;
                }

                // 2. Verificação fisiológica (limites absolutos)
                bool isFisiologicalOutlier = false;
                string outlierMotivo = string.Empty;
                if (_physiologicLimits.TryGetValue(analito, out var limits))
                {
                    if (valor < limits.PhysMin || valor > limits.PhysMax)
                    {
                        isFisiologicalOutlier = true;
                        outlierMotivo = $"Valor {valor} {unidade} está fora dos limites fisiológicos esperados ({limits.PhysMin}–{limits.PhysMax}).";
                    }
                }

                resultados.Add(new ResultadoSerieDto
                {
                    DataStr = doc.Data,
                    DataTicks = docData.Ticks,
                    Valor = valor,
                    Unidade = unidade,
                    RefMin = item.RefMin,
                    RefMax = item.RefMax,
                    Status = item.Status,
                    DocumentoId = doc.Id ?? "",
                    IsOutlier = isFisiologicalOutlier,
                    OutlierMotivo = isFisiologicalOutlier ? outlierMotivo : null
                });
            }

            // 3. Detecção de outlier estatístico com desvio AMOSTRAL e limiar 2,5-sigma
            // Exige mínimo de 4 pontos para ser estatisticamente significativo.
            if (resultados.Count >= 4)
            {
                var valores = resultados.Select(r => r.Valor).ToList();
                var media = valores.Average();
                // Desvio amostral (dividido por n-1)
                var desvio = valores.Count > 1
                    ? Math.Sqrt(valores.Sum(v => Math.Pow(v - media, 2)) / (valores.Count - 1))
                    : 0;

                if (desvio > 0)
                {
                    foreach (var r in resultados.Where(r => !r.IsOutlier))
                    {
                        var zScore = Math.Abs(r.Valor - media) / desvio;
                        if (zScore > 2.5)
                        {
                            r.IsOutlier = true;
                            r.OutlierMotivo = $"Valor {r.Valor} {r.Unidade} é estatisticamente atípico " +
                                              $"(Z-score={zScore:F1}, média={media:F1}, σ={desvio:F1}).";
                        }
                    }
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
                    documentoId = r.DocumentoId,
                    isOutlier = r.IsOutlier,
                    outlierMotivo = r.OutlierMotivo
                })
                .ToList();

            return Results.Ok(serieOrdenada);
        });
    }
}
