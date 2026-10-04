using SaudeMemora.Application.DTOs;

namespace SaudeMemora.Application.Interfaces;

public interface IOcrAiService
{
    Task<DocumentoExtraidoDto> ExtractDocumentDataAsync(string imageUrl, string documentType, CancellationToken cancellationToken = default);
    Task<DocumentoExtraidoDto> ExtractMultipleDocumentsDataAsync(List<string> imageUrls, string documentType, CancellationToken cancellationToken = default);
    Task<CarteirinhaExtraidaDto> ExtractCarteirinhaDataAsync(string imageUrl, CancellationToken cancellationToken = default);
}

public class CarteirinhaExtraidaDto
{
    public string PlanoSaude { get; set; } = string.Empty;
    public string NumeroCarteirinha { get; set; } = string.Empty;
}

public class LinhaIndentadaDto
{
    public string Tipo { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public string Chave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
}

public class DocumentoExtraidoDto
{
    public bool DocumentoValido { get; set; } = true;
    public string Tipo { get; set; } = string.Empty;
    public string TipoIdentificado { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Medico { get; set; } = string.Empty;
    public string Clinica { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
    public string Resumo { get; set; } = string.Empty;
    public string Diagnostico { get; set; } = string.Empty;
    public string Crm { get; set; } = string.Empty;
    public string NomeExame { get; set; } = string.Empty;
    public string TipoExame { get; set; } = string.Empty;
    public string Resultado { get; set; } = string.Empty;
    public string Especialidade { get; set; } = string.Empty;
    public string TipoClinico { get; set; } = string.Empty;
    public string Conteudo { get; set; } = string.Empty;
    public string Conclusoes { get; set; } = string.Empty;
    public string Observacoes { get; set; } = string.Empty;
    public List<MedicamentoExtraidoDto> Medicamentos { get; set; } = new();
    public List<LinhaIndentadaDto> ConteudoIndentado { get; set; } = new();
    public string TextoExtraido { get; set; } = string.Empty;
    public string TextoFormatado { get; set; } = string.Empty;
}

public class MedicamentoExtraidoDto
{
    public string Nome { get; set; } = string.Empty;
    public string Dosagem { get; set; } = string.Empty;
    public string Horario { get; set; } = string.Empty;
}
