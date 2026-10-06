namespace SaudeMemora.Infrastructure.Services;

/// <summary>
/// Normaliza unidades de medida extraídas pela IA para padrões clínicos BR.
/// Evita que o mesmo analito apareça com unidades incompatíveis na série histórica.
/// </summary>
public static class UnitNormalizer
{
    // Mapa: unidade original (lowercase, sem espaço) → unidade canônica + fator multiplicador
    private static readonly Dictionary<string, (string Unit, double Factor)> _map = new(StringComparer.OrdinalIgnoreCase)
    {
        // Colesterol / Lipídios: tudo para mg/dL
        { "mmol/l",   ("mg/dL", 38.67) },  // colesterol/triglicerídeos
        { "mmol/l ",  ("mg/dL", 38.67) },
        { "mmoll",    ("mg/dL", 38.67) },

        // Glicemia: mmol/L → mg/dL
        // Overlapping: se for glicose, fator é 18.02; usamos heurística no caller
        // (mmol/L já coberto acima com fator genérico de lipídios; glicose tratada separado)

        // Hemoglobina: g/dL → g/dL (sem conversão), mas normaliza caps
        { "g/dl",  ("g/dL",  1.0) },
        { "g/l",   ("g/dL",  0.1) },  // g/L → g/dL

        // Creatinina: μmol/L → mg/dL
        { "µmol/l",   ("mg/dL", 0.011312) },
        { "umol/l",   ("mg/dL", 0.011312) },
        { "μmol/l",   ("mg/dL", 0.011312) },

        // TSH / Hormônios: mIU/L → mUI/mL (equivalentes, só normaliza o nome)
        { "miu/ml",  ("mUI/mL", 1.0) },
        { "miu/l",   ("mUI/mL", 1.0) },
        { "muiu/ml", ("mUI/mL", 1.0) },
        { "µiu/ml",  ("mUI/mL", 1.0) },
        { "uiu/ml",  ("mUI/mL", 1.0) },

        // Vitamina D: nmol/L → ng/mL
        { "nmol/l",  ("ng/mL", 0.4006) },

        // Vitamina B12: pmol/L → pg/mL
        { "pmol/l",  ("pg/mL", 1.355) },

        // Ferritina, PSA: já geralmente em ng/mL
        { "ng/ml",   ("ng/mL", 1.0) },

        // Percentual: mantém
        { "%",       ("%", 1.0) },

        // Contagem (leucócitos, plaquetas): padroniza notação
        { "x10^9/l",    ("/µL", 1000.0) },
        { "x10³/µl",    ("/µL", 1.0) },
        { "x10³/ul",    ("/µL", 1.0) },
        { "10^9/l",     ("/µL", 1000.0) },
        { "mil/µl",     ("/µL", 1000.0) },
        { "mil/ul",     ("/µL", 1000.0) },
        { "/µl",        ("/µL", 1.0) },
        { "/ul",        ("/µL", 1.0) },
    };

    // Analitos que usam fator de glicose para mmol/L → mg/dL
    private static readonly HashSet<string> _glucoseAnalitos = new(StringComparer.OrdinalIgnoreCase)
    {
        "glicemia", "glicose", "glicemia_jejum", "glicemia_2h", "hemoglobina_glicada"
    };

    /// <summary>
    /// Tenta normalizar a unidade e, se necessário, converte o valor.
    /// Retorna null se a unidade não for reconhecida (nenhuma conversão feita).
    /// </summary>
    public static (double Value, string Unit)? TryNormalize(string analitoNormalizado, double value, string rawUnit)
    {
        if (string.IsNullOrWhiteSpace(rawUnit)) return null;

        var key = rawUnit.Trim().ToLowerInvariant().Replace(" ", "");

        // Caso especial: mmol/L com analito de glicose → usar fator 18.02
        if ((key == "mmol/l" || key == "mmoll") && _glucoseAnalitos.Contains(analitoNormalizado))
        {
            return (Math.Round(value * 18.02, 2), "mg/dL");
        }

        if (_map.TryGetValue(key, out var mapping))
        {
            return (Math.Round(value * mapping.Factor, 4), mapping.Unit);
        }

        // Normaliza apenas a capitalização para mg/dL, se já está lá
        if (key == "mg/dl") return (value, "mg/dL");

        return null; // Unidade já está no padrão ou não é reconhecida
    }
}
