namespace SaudeMemora.Infrastructure.Services;

public sealed class BularioApiOptions
{
    public const string SectionName = "BularioApi";

    public string BaseUrl { get; set; } = "https://consultas.anvisa.gov.br/";
    public int PageSize { get; set; } = 1;
    public int RequestTimeoutSeconds { get; set; } = 15;
}
