namespace SaudeMemora.Application.Interfaces;

public interface IEmbeddingService
{
    string ModelName { get; }
    Task<float[]?> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<float[]>> GenerateEmbeddingsBatchAsync(IReadOnlyList<string> texts, CancellationToken cancellationToken = default);
}
