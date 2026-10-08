using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public sealed class CnesRegistro
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("codigo")]
    public string Codigo { get; set; } = string.Empty;

    [BsonElement("codigoNormalizado")]
    public string CodigoNormalizado { get; set; } = string.Empty;

    [BsonElement("descricao")]
    public string Descricao { get; set; } = string.Empty;

    [BsonElement("descricaoNormalizada")]
    public string DescricaoNormalizada { get; set; } = string.Empty;

    [BsonElement("categoria")]
    public string Categoria { get; set; } = string.Empty;

    [BsonElement("origem")]
    public string Origem { get; set; } = "LOCAL";

    [BsonElement("importadoEm")]
    public DateTime ImportadoEm { get; set; }
}
