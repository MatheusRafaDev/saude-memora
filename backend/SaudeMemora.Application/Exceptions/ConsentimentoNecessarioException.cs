namespace SaudeMemora.Application.Exceptions;

/// <summary>
/// Lançada quando o documento não pode ser processado porque o paciente 
/// não deu consentimento (ou revogou) para o uso de IA.
/// O documento falha imediatamente, pois sem IA não tem como processar.
/// </summary>
public class ConsentimentoNecessarioException : Exception
{
    public const string DefaultUserMessage = "consentimento_necessario";

    public ConsentimentoNecessarioException(string? message = null)
        : base(string.IsNullOrWhiteSpace(message) ? DefaultUserMessage : message) { }
}
