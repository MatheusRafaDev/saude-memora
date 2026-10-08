using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface ICid10CatalogoService
{
    Task<ImportacaoCatalogoResult> ImportarAsync(Stream stream, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Cid10Registro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default);
}
