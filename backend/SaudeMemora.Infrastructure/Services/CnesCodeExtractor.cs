using System.Text.RegularExpressions;

namespace SaudeMemora.Infrastructure.Services;

public static class CnesCodeExtractor
{
    private static readonly Regex LabeledCodePattern = new(
        @"(?:\bCNES\b|Cadastro\s+Nacional\s+de\s+Estabelecimentos\s+de\s+Sa[uú]de)\s*(?:n[º°o.]?\s*)?[:#-]?\s*((?:\d[\s.-]*){6}\d)(?!\d)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static string Extract(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var match = LabeledCodePattern.Match(text);
        if (!match.Success)
            return string.Empty;

        var code = new string(match.Groups[1].Value.Where(char.IsDigit).ToArray());
        return code.Length == 7 ? code : string.Empty;
    }
}
