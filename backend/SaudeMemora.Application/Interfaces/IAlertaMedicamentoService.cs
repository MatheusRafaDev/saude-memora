using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface IAlertaMedicamentoService
{
    Task<List<AlertaDocumento>> GerarAlertasAsync(RegistroDocumento documento, FichaMedica ficha);
}
