using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

/// <summary>
/// Trilha de auditoria de acesso a dados sensíveis de saúde.
/// Deliberadamente <b>não</b> armazena conteúdo clínico: apenas quem acessou o quê,
/// quando, de onde (IP truncado) e com qual resultado.
/// </summary>
public class AuditoriaAcesso
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>Titular dos dados acessados.</summary>
    [BsonElement("pacienteId")]
    public string? PacienteId { get; set; }

    /// <summary>Quem acessou. Em acesso anônimo (link de emergência), "anonimo".</summary>
    [BsonElement("ator")]
    public string Ator { get; set; } = "desconhecido";

    /// <summary>Leitura, Criacao, Alteracao, Exclusao ou AcessoEmergencia.</summary>
    [BsonElement("operacao")]
    public string Operacao { get; set; } = string.Empty;

    /// <summary>Recurso afetado, por exemplo "Documento", "FichaMedica", "Perfil".</summary>
    [BsonElement("recurso")]
    public string Recurso { get; set; } = string.Empty;

    /// <summary>Identificador do recurso, quando aplicável. Nunca conteúdo clínico.</summary>
    [BsonElement("recursoId")]
    public string? RecursoId { get; set; }

    /// <summary>Sucesso, Negado ou NaoEncontrado.</summary>
    [BsonElement("resultado")]
    public string Resultado { get; set; } = "Sucesso";

    [BsonElement("ipTruncado")]
    public string? IpTruncado { get; set; }
}

public static class AuditoriaOperacao
{
    public const string Leitura = "Leitura";
    public const string Criacao = "Criacao";
    public const string Alteracao = "Alteracao";
    public const string Exclusao = "Exclusao";
    public const string AcessoEmergencia = "AcessoEmergencia";
}

public static class AuditoriaResultado
{
    public const string Sucesso = "Sucesso";
    public const string Negado = "Negado";
    public const string NaoEncontrado = "NaoEncontrado";
}
