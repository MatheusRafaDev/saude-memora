using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public sealed class MedicamentoCatalogo
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("processoAnvisa")]
    public string ProcessoAnvisa { get; set; } = string.Empty;

    [BsonElement("nome")]
    public string Nome { get; set; } = string.Empty;

    [BsonElement("nomeNormalizado")]
    public string NomeNormalizado { get; set; } = string.Empty;

    [BsonElement("principioAtivo")]
    public string PrincipioAtivo { get; set; } = string.Empty;

    [BsonElement("principioAtivoNormalizado")]
    public string PrincipioAtivoNormalizado { get; set; } = string.Empty;

    [BsonElement("descricao")]
    public string Descricao { get; set; } = string.Empty;

    [BsonElement("fabricante")]
    public string Fabricante { get; set; } = string.Empty;

    [BsonElement("tipoProduto")]
    public string TipoProduto { get; set; } = string.Empty;

    [BsonElement("classeTerapeutica")]
    public string ClasseTerapeutica { get; set; } = string.Empty;

    [BsonElement("registroAnvisa")]
    public string RegistroAnvisa { get; set; } = string.Empty;

    [BsonElement("situacaoRegistro")]
    public string SituacaoRegistro { get; set; } = string.Empty;

    [BsonElement("origem")]
    public string Origem { get; set; } = "ANVISA";

    [BsonElement("importadoEm")]
    public DateTime ImportadoEm { get; set; }
}
