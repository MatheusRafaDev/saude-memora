using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

[BsonIgnoreExtraElements]
public class DocumentChunk
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("documentoId")]
    public string DocumentoId { get; set; } = string.Empty;

    [BsonElement("pacienteId")]
    public string PacienteId { get; set; } = string.Empty;

    [BsonElement("chunkIndex")]
    public int ChunkIndex { get; set; }

    [BsonElement("titulo")]
    public string Titulo { get; set; } = string.Empty;

    [BsonElement("tipo")]
    public string Tipo { get; set; } = string.Empty;

    [BsonElement("data")]
    public string Data { get; set; } = string.Empty;

    [BsonElement("texto")]
    public string Texto { get; set; } = string.Empty;

    [BsonElement("embedding")]
    public List<float> Embedding { get; set; } = new();

    [BsonElement("modeloEmbedding")]
    public string ModeloEmbedding { get; set; } = "text-embedding-004";

    [BsonElement("versao")]
    public int Versao { get; set; } = 1;

    [BsonElement("criadoEm")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    [BsonElement("atualizadoEm")]
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}
