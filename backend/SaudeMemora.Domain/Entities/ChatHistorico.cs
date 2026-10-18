using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

[BsonIgnoreExtraElements]
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

    [BsonElement("dataChat")]
    public string? DataChat { get; set; }

    [BsonElement("sessaoId")]
    public string? SessaoId { get; set; }

    [BsonElement("citacoes")]
    public List<ChatHistoricoCitacao> Citacoes { get; set; } = [];

    [BsonElement("criadoEm")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class ChatHistoricoCitacao
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("titulo")]
    public string Titulo { get; set; } = string.Empty;

    [BsonElement("data")]
    public string Data { get; set; } = string.Empty;
}
