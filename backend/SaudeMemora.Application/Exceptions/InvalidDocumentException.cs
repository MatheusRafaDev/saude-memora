namespace SaudeMemora.Application.Exceptions;

/// <summary>
/// Lançada quando o arquivo enviado não é um documento médico legível
/// (foto aleatória, imagem em branco/borrada, assunto não relacionado à saúde).
/// Diferente de falhas transitórias (API fora do ar, rate limit), NÃO deve ser
/// reprocessada: o documento é recusado e o usuário é orientado a tirar outra foto.
/// </summary>
public class InvalidDocumentException : Exception
{
    public const string DefaultUserMessage =
        "Não conseguimos reconhecer um documento médico nesta imagem. Tire outra foto com boa iluminação, enquadrando o documento inteiro e sem cortes.";

    public InvalidDocumentException(string? message = null)
        : base(string.IsNullOrWhiteSpace(message) ? DefaultUserMessage : message) { }
}
