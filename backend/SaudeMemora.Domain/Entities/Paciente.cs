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

    [BsonElement("isDeleting")]
    public bool IsDeleting { get; set; } = false;

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

    [BsonElement("planoSaude")]
    public string? PlanoSaude { get; set; }

    [BsonElement("numeroCarteirinha")]
    public string? NumeroCarteirinha { get; set; }

    [BsonElement("urlCarteirinha")]
    public string? UrlCarteirinha { get; set; }

    [BsonElement("idPublicoCarteirinha")]
    public string? IdPublicoCarteirinha { get; set; }

    [BsonElement("tokenEmergencia")]
    public string? TokenEmergencia { get; set; }

    [BsonElement("contatoEmergencia")]
    public string? ContatoEmergencia { get; set; }

    [BsonElement("resetPasswordToken")]
    public string? ResetPasswordToken { get; set; }

    [BsonElement("resetPasswordExpiry")]
    public DateTime? ResetPasswordExpiry { get; set; }

    [BsonElement("securityStamp")]
    public string SecurityStamp { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("consentimentoIa")]
    public ConsentimentoIa? ConsentimentoIa { get; set; }
}

public class ConsentimentoIa
{
    [BsonElement("aceito")]
    public bool Aceito { get; set; }

    [BsonElement("versaoTermo")]
    public string VersaoTermo { get; set; } = string.Empty;

    [BsonElement("aceitoEm")]
    public DateTime? AceitoEm { get; set; }

    [BsonElement("revogadoEm")]
    public DateTime? RevogadoEm { get; set; }

    [BsonElement("ipTruncado")]
    public string? IpTruncado { get; set; }

    [BsonElement("historico")]
    public List<ConsentimentoHistorico> Historico { get; set; } = new();
}

public class ConsentimentoHistorico
{
    [BsonElement("acao")]
    public string Acao { get; set; } = string.Empty;

    [BsonElement("dataHora")]
    public DateTime DataHora { get; set; } = DateTime.UtcNow;

    [BsonElement("ipTruncado")]
    public string? IpTruncado { get; set; }
}
