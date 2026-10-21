using System.Globalization;
using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Api.Services;

/// <summary>
/// Provedor de busca vetorial semântica e híbrida para RAG do paciente autenticado.
/// Combina similaridade de cosseno de embeddings gerados pelo Gemini (text-embedding-004)
/// com pontuação lexical, garantindo isolamento estrito de paciente e fallback transparente
/// para busca puramente lexical caso o serviço de embeddings esteja indisponível.
/// </summary>
public sealed class HybridPatientDocumentSearch : IPatientDocumentSearch
{
    private readonly IDocumentVectorRepository _vectorRepo;
    private readonly IEmbeddingService _embeddingService;
    private readonly LexicalPatientDocumentSearch _lexicalFallback;
    private readonly ILogger<HybridPatientDocumentSearch> _logger;

    public HybridPatientDocumentSearch(
        IDocumentVectorRepository vectorRepo,
        IEmbeddingService embeddingService,
        LexicalPatientDocumentSearch lexicalFallback,
        ILogger<HybridPatientDocumentSearch> logger)
    {
        _vectorRepo = vectorRepo;
        _embeddingService = embeddingService;
        _lexicalFallback = lexicalFallback;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PatientDocumentExcerpt>> SearchAsync(
        string authenticatedPatientId,
        string query,
        string? documentType,
        int limit,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(authenticatedPatientId) || string.IsNullOrWhiteSpace(query))
        {
            return Array.Empty<PatientDocumentExcerpt>();
        }

        // 1. Gera embedding para a consulta do usuário
        float[]? queryEmbedding = null;
        try
        {
            queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(query, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to generate query embedding. Falling back to lexical search. FailureType={FailureType}", ex.GetType().Name);
        }

        if (queryEmbedding == null || queryEmbedding.Length == 0)
        {
            return await _lexicalFallback.SearchAsync(authenticatedPatientId, query, documentType, limit, cancellationToken);
        }

        // 2. Busca chunks pré-indexados para o paciente autenticado
        var chunks = await _vectorRepo.GetChunksByPacienteIdAsync(authenticatedPatientId, documentType, cancellationToken);
        if (chunks.Count == 0)
        {
            // Paciente ainda não tem documentos vetorizados: fallback imediato para busca lexical
            return await _lexicalFallback.SearchAsync(authenticatedPatientId, query, documentType, limit, cancellationToken);
        }

        var terms = PatientChatTools.GetTerms(query);

        // 3. Calcula similaridade semântica (cosseno) e sobreposição lexical
        var scoredChunks = chunks
            .Where(chunk => string.Equals(chunk.PacienteId, authenticatedPatientId, StringComparison.Ordinal)
                && chunk.Embedding is { Count: > 0 }
                && !string.IsNullOrWhiteSpace(chunk.DocumentoId))
            .Select(chunk =>
            {
                var semanticSim = CosineSimilarity(queryEmbedding, chunk.Embedding);
                var lexScore = PatientChatTools.MatchScore(chunk.Texto, terms);
                var normalizedLex = terms.Count > 0 ? Math.Min(1.0f, (float)lexScore / terms.Count) : 0f;

                // Score híbrido ponderado: 75% semântico + 25% lexical
                var hybridScore = (semanticSim * 0.75f) + (normalizedLex * 0.25f);

                return new
                {
                    Chunk = chunk,
                    SemanticSimilarity = semanticSim,
                    HybridScore = hybridScore,
                    Date = ParseDate(chunk.Data, chunk.CriadoEm)
                };
            })
            .Where(item => item.HybridScore > 0.25f || item.SemanticSimilarity > 0.35f)
            .ToList();

        if (scoredChunks.Count == 0)
        {
            // Se nenhum chunk vetorial atingiu relevância suficiente, tenta o fallback lexical
            return await _lexicalFallback.SearchAsync(authenticatedPatientId, query, documentType, limit, cancellationToken);
        }

        // 4. Agrupa por DocumentoId para não retornar múltiplos trechos do mesmo documento
        var rankedDocuments = scoredChunks
            .GroupBy(item => item.Chunk.DocumentoId)
            .Select(group => group.OrderByDescending(item => item.HybridScore).First())
            .OrderByDescending(item => item.HybridScore)
            .ThenByDescending(item => item.Date)
            .Take(limit)
            .Select(item => new PatientDocumentExcerpt(
                item.Chunk.DocumentoId,
                Trim(item.Chunk.Titulo, 180),
                Trim(item.Chunk.Data, 40),
                Trim(item.Chunk.Tipo, 40),
                Trim(item.Chunk.Texto, 1500)))
            .ToArray();

        return rankedDocuments;
    }

    public static float CosineSimilarity(IReadOnlyList<float> a, IReadOnlyList<float> b)
    {
        if (a == null || b == null || a.Count == 0 || b.Count == 0 || a.Count != b.Count)
        {
            return 0f;
        }

        double dot = 0.0;
        double magA = 0.0;
        double magB = 0.0;

        for (int i = 0; i < a.Count; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        var denominator = Math.Sqrt(magA) * Math.Sqrt(magB);
        if (denominator < 1e-7) return 0f;

        return (float)(dot / denominator);
    }

    private static DateTime ParseDate(string? dateString, DateTime fallback)
    {
        return DateTime.TryParse(dateString, CultureInfo.GetCultureInfo("pt-BR"), DateTimeStyles.AssumeUniversal, out var parsed)
            ? parsed
            : fallback;
    }

    private static string Trim(string? value, int maxCharacters)
    {
        var normalized = value?.Trim() ?? string.Empty;
        return normalized.Length <= maxCharacters ? normalized : normalized[..maxCharacters];
    }
}
