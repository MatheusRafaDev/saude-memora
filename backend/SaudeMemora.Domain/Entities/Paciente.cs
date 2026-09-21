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

    [BsonElement("tipoSanguineo")]
    public string? TipoSanguineo { get; set; }

    [BsonElement("doadorOrgaos")]
    public bool? DoadorOrgaos { get; set; }

    [BsonElement("alergias")]
    public List<string> Alergias { get; set; } = new();

    [BsonElement("doencasCronicas")]
    public List<string> DoencasCronicas { get; set; } = new();

    [BsonElement("medicamentosContinuos")]
    public List<MedicamentoContinuo> MedicamentosContinuos { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
