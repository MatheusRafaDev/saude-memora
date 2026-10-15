using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

/// <summary>
/// Dados de contexto necessários para auditar um acesso, sem depender de ASP.NET Core.
/// A camada Api monta esta estrutura a partir do <c>HttpContext</c>.
/// </summary>
public readonly record struct AuditoriaContexto(string? PacienteId, string? IpTruncado)
{
    public static AuditoriaContexto Anonimo(string? ipTruncado = null) => new(null, ipTruncado);
}

/// <summary>
/// Registra acessos a dados sensíveis de saúde em trilha de auditoria.
/// A implementação nunca deve lançar: falha de auditoria não pode derrubar a requisição,
/// mas é registrada no log da aplicação.
/// </summary>
public interface IAuditoriaService
{
    Task RegistrarAsync(
        AuditoriaContexto contexto,
        string operacao,
        string recurso,
        string? recursoId = null,
        string resultado = AuditoriaResultado.Sucesso,
        string? pacienteId = null,
        CancellationToken cancellationToken = default);
}
