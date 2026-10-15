using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

/// <summary>
/// Registro de uma migração já aplicada. Garante que cada migração rode uma única vez
/// por banco, de forma idempotente e observável.
/// </summary>
public class MigracaoAplicada
{
    [BsonId]
    public string Id { get; set; } = string.Empty;

    [BsonElement("aplicadaEm")]
    public DateTime AplicadaEm { get; set; } = DateTime.UtcNow;

    [BsonElement("duracaoMs")]
    public long DuracaoMs { get; set; }

    [BsonElement("sucesso")]
    public bool Sucesso { get; set; }

    [BsonElement("erro")]
    public string? Erro { get; set; }
}
