using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public class SistemaLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string Nivel { get; set; } = "Info"; // Info, Warning, Error

    public string Acao { get; set; } = string.Empty;

    public string Detalhes { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string? DocumentoId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? PacienteId { get; set; }
}
