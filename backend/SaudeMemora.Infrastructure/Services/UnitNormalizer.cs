namespace SaudeMemora.Infrastructure.Services;

/// <summary>
/// Normaliza unidades de medida extraídas pela IA para padrões clínicos BR.
/// A chave é (analitoNormalizado, unidadeRaw) — conversões só para analitos conhecidos.
/// Para analito/unidade desconhecidos retorna null (sem conversão silenciosa).
/// </summary>
public static class UnitNormalizer
{
    // Chave: (analito_lower, unidade_lower_sem_espaço)  →  (unidadeCanônica, fator)
    private static readonly Dictionary<(string Analito, string Unidade), (string CanonUnit, double Factor)> _map =
        new(new KeyComparer())
    {
        // Glicose: mmol/L → mg/dL  (fator 18,02)
        { ("glicemia",           "mmol/l"),  ("mg/dL", 18.02) },
        { ("glicose",            "mmol/l"),  ("mg/dL", 18.02) },
        { ("glicemia_jejum",     "mmol/l"),  ("mg/dL", 18.02) },
        { ("glicemia_2h",        "mmol/l"),  ("mg/dL", 18.02) },
        { ("hemoglobina_glicada","mmol/l"),  ("mg/dL", 18.02) },

        // Colesterol total / HDL / LDL: mmol/L → mg/dL  (fator 38,67)
        { ("colesterol_total",   "mmol/l"),  ("mg/dL", 38.67) },
        { ("colesterol_hdl",     "mmol/l"),  ("mg/dL", 38.67) },
        { ("colesterol_ldl",     "mmol/l"),  ("mg/dL", 38.67) },

        // Triglicerídeos: mmol/L → mg/dL  (fator 88,57)
        { ("triglicerideos",     "mmol/l"),  ("mg/dL", 88.57) },

        // Creatinina: µmol/L → mg/dL
        { ("creatinina",         "µmol/l"),  ("mg/dL", 0.011312) },
        { ("creatinina",         "umol/l"),  ("mg/dL", 0.011312) },
        { ("creatinina",         "μmol/l"),  ("mg/dL", 0.011312) },

        // Ácido úrico: µmol/L → mg/dL
        { ("acido_urico",        "µmol/l"),  ("mg/dL", 0.016807) },
        { ("acido_urico",        "umol/l"),  ("mg/dL", 0.016807) },
        { ("acido_urico",        "μmol/l"),  ("mg/dL", 0.016807) },

        // Vitamina D: nmol/L → ng/mL
        { ("vitamina_d",         "nmol/l"),  ("ng/mL", 0.4006) },

        // Vitamina B12: pmol/L → pg/mL
        { ("vitamina_b12",       "pmol/l"),  ("pg/mL", 1.355) },

        // Hemoglobina: g/L → g/dL
        { ("hemoglobina",        "g/l"),     ("g/dL",  0.1) },

        // TSH / Hormônios: mIU/L → mUI/mL
        { ("tsh",  "miu/l"),    ("mUI/mL", 1.0) },
        { ("tsh",  "miu/ml"),   ("mUI/mL", 1.0) },
        { ("tsh",  "muiu/ml"),  ("mUI/mL", 1.0) },
        { ("tsh",  "µiu/ml"),   ("mUI/mL", 1.0) },
        { ("tsh",  "uiu/ml"),   ("mUI/mL", 1.0) },
        { ("tsh",  "mui/l"),    ("mUI/mL", 0.001) }, // mUI/L → mUI/mL
    };

    // Normalizações de unidade puras (capitalização/notação), sem depender do analito
    private static readonly Dictionary<string, (string CanonUnit, double Factor)> _unitOnly =
        new(StringComparer.OrdinalIgnoreCase)
    {
        { "x10^9/l",   ("/µL", 1000.0) },
        { "x10³/µl",   ("/µL", 1.0)    },
        { "x10³/ul",   ("/µL", 1.0)    },
        { "x109/l",    ("/µL", 1000.0) },
        { "10^9/l",    ("/µL", 1000.0) },
        { "mil/µl",    ("/µL", 1000.0) },
        { "mil/ul",    ("/µL", 1000.0) },
        { "/µl",       ("/µL", 1.0)    },
        { "/ul",       ("/µL", 1.0)    },
        { "g/dl",      ("g/dL", 1.0)   },
        { "mg/dl",     ("mg/dL", 1.0)  },
        { "ng/ml",     ("ng/mL", 1.0)  },
        { "pg/ml",     ("pg/mL", 1.0)  },
        { "miu/ml",    ("mUI/mL", 1.0) },
        { "muiu/ml",   ("mUI/mL", 1.0) },
        { "µiu/ml",    ("mUI/mL", 1.0) },
        { "uiu/ml",    ("mUI/mL", 1.0) },
        { "%",         ("%", 1.0)       },
    };

    /// <summary>
    /// Tenta normalizar a unidade e, se necessário, converte o valor.
    /// Retorna null se o par (analito, unidade) não for reconhecido.
    /// </summary>
    public static (double Value, string Unit)? TryNormalize(string analitoNormalizado, double value, string rawUnit)
    {
        if (string.IsNullOrWhiteSpace(rawUnit)) return null;

        var unitKey = rawUnit.Trim().ToLowerInvariant().Replace(" ", "");
        var analitoKey = (analitoNormalizado ?? "").Trim().ToLowerInvariant();

        // 1. Conversão específica por (analito, unidade)
        if (_map.TryGetValue((analitoKey, unitKey), out var specific))
            return (Math.Round(value * specific.Factor, 4), specific.CanonUnit);

        // 2. Normalização de unidade pura (só capitalização/notação)
        if (_unitOnly.TryGetValue(unitKey, out var unitMap))
            return (Math.Round(value * unitMap.Factor, 4), unitMap.CanonUnit);

        return null; // desconhecido: sem conversão silenciosa
    }

    private sealed class KeyComparer : IEqualityComparer<(string Analito, string Unidade)>
    {
        public bool Equals((string Analito, string Unidade) x, (string Analito, string Unidade) y)
            => string.Equals(x.Analito, y.Analito, StringComparison.OrdinalIgnoreCase)
            && string.Equals(x.Unidade, y.Unidade, StringComparison.OrdinalIgnoreCase);

        public int GetHashCode((string Analito, string Unidade) obj)
            => HashCode.Combine(
                obj.Analito?.ToLowerInvariant(),
                obj.Unidade?.ToLowerInvariant());
    }
}
