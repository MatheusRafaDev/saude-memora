using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface ICnesCatalogoRepository
{
    Task EnsureIndexesAsync(CancellationToken cancellationToken = default);
    Task ClearAllAsync(CancellationToken cancellationToken = default);
    Task InsertBatchAsync(IEnumerable<CnesRegistro> registros, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CnesRegistro>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default);
    Task<long> ContarAsync(CancellationToken cancellationToken = default);
}
