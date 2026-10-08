using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public class ChatHistorico
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("pacienteId")]
    public string PacienteId { get; set; } = string.Empty;

    [BsonElement("pergunta")]
    public string Pergunta { get; set; } = string.Empty;

    [BsonElement("resposta")]
    public string Resposta { get; set; } = string.Empty;

    [BsonElement("criadoEm")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
