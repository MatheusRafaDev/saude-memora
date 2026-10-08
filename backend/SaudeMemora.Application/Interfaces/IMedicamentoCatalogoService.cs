using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface IMedicamentoCatalogoService
{
    Task<ImportacaoCatalogoResult> ImportarAsync(Stream stream, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MedicamentoCatalogo>> BuscarAsync(string query, int limit, CancellationToken cancellationToken = default);
}

public sealed record ImportacaoCatalogoResult(
    int RegistrosImportados,
    int RegistrosInvalidos,
    int RegistrosDuplicados,
    DateTime ImportadoEm);
