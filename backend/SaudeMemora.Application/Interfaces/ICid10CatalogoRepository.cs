using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface ICid10CatalogoRepository
{
    Task EnsureIndexesAsync(CancellationToken cancellationToken = default);
    Task ClearAllAsync(CancellationToken cancellationToken = default);
    Task InsertBatchAsync(IEnumerable<Cid10Registro> registros, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Cid10Registro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default);
    Task<long> ContarAsync(CancellationToken cancellationToken = default);
}
