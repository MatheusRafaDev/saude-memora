using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public class MedicamentoContinuo
{
    [BsonElement("nome")]
    public string Nome { get; set; } = string.Empty;

    [BsonElement("dosagem")]
    public string Dosagem { get; set; } = string.Empty;

    [BsonElement("horario")]
    public string Horario { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Paciente
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("nome")]
    public string Nome { get; set; } = string.Empty;

    [BsonElement("cpf")]
    public string Cpf { get; set; } = string.Empty;

    [BsonElement("dataNascimento")]
    public string DataNascimento { get; set; } = string.Empty;

    [BsonElement("sexo")]
    public string Sexo { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("senha")]
    public string Senha { get; set; } = string.Empty;

    [BsonElement("telefone")]
    public string? Telefone { get; set; }

    [BsonElement("endereco")]
    public string? Endereco { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
