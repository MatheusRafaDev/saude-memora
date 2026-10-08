using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface IMedicamentoCatalogoRepository
{
    Task EnsureIndexesAsync(CancellationToken cancellationToken = default);
    Task ReplaceAllAsync(IEnumerable<MedicamentoCatalogo> medicamentos, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MedicamentoCatalogo>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default);
    Task<long> ContarAsync(CancellationToken cancellationToken = default);
}
