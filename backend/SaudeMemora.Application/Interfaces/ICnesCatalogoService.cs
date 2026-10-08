using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface ICnesCatalogoService
{
    Task<ImportacaoCatalogoResult> ImportarAsync(Stream stream, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CnesRegistro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default);
}
