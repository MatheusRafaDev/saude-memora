using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

/// <summary>
/// Escreve a trilha de auditoria de acesso a dados sensíveis.
/// Nunca lança: se a auditoria falhar, a requisição segue e o erro vai para o log da aplicação.
/// </summary>
public class AuditoriaService : IAuditoriaService
{
    private readonly IAuditoriaAcessoRepository _repository;
    private readonly ILogger<AuditoriaService> _logger;

    public AuditoriaService(IAuditoriaAcessoRepository repository, ILogger<AuditoriaService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public Task RegistrarAsync(
        AuditoriaContexto contexto,
        string operacao,
        string recurso,
        string? recursoId = null,
        string resultado = AuditoriaResultado.Sucesso,
        string? pacienteId = null,
        CancellationToken cancellationToken = default)
        => RegistrarInternoAsync(
            contexto,
            operacao,
            recurso,
            recursoId,
            resultado,
            pacienteId ?? contexto.PacienteId,
            cancellationToken);

    private async Task RegistrarInternoAsync(
        AuditoriaContexto contexto,
        string operacao,
        string recurso,
        string? recursoId,
        string resultado,
        string? pacienteId,
        CancellationToken cancellationToken)
    {
        try
        {
            var registro = new AuditoriaAcesso
            {
                PacienteId = pacienteId,
                Ator = pacienteId ?? "anonimo",
                Operacao = operacao,
                Recurso = recurso,
                RecursoId = recursoId,
                Resultado = resultado,
                IpTruncado = contexto.IpTruncado
            };

            await _repository.RegistrarAsync(registro, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao gravar auditoria de acesso ({Operacao} {Recurso}).",
                operacao,
                recurso);
        }
    }
}
