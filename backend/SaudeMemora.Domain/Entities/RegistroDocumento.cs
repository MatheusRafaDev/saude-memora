using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public class MedicamentoDocumento
{
    [BsonElement("nome")]
    public string Nome { get; set; } = string.Empty;

    [BsonElement("dosagem")]
    public string Dosagem { get; set; } = string.Empty;

    [BsonElement("horario")]
    public string Horario { get; set; } = string.Empty;
}

public class LinhaIndentadaDocumento
{
    [BsonElement("tipo")]
    public string Tipo { get; set; } = string.Empty;

    [BsonElement("texto")]
    public string Texto { get; set; } = string.Empty;

    [BsonElement("chave")]
    public string Chave { get; set; } = string.Empty;

    [BsonElement("valor")]
    public string Valor { get; set; } = string.Empty;
}

public class RegistroDocumento
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("pacienteId")]
    public string PacienteId { get; set; } = string.Empty;

    // Campos exibidos no frontend
    [BsonElement("titulo")]
    public string Titulo { get; set; } = string.Empty;

    [BsonElement("tipo")]
    public string Tipo { get; set; } = string.Empty; // exame | receita | laudo

    [BsonElement("status")]
    public string Status { get; set; } = "processando"; // processando | pronto | arquivado

    // Receita specific
    [BsonElement("medico")]
    public string Medico { get; set; } = string.Empty;

    [BsonElement("crm")]
    public string Crm { get; set; } = string.Empty;

    [BsonElement("medicamentos")]
    public List<MedicamentoDocumento> Medicamentos { get; set; } = new();

    // Exame specific
    [BsonElement("nomeExame")]
    public string NomeExame { get; set; } = string.Empty;

    [BsonElement("tipoExame")]
    public string TipoExame { get; set; } = string.Empty;

    [BsonElement("clinica")]
    public string Clinica { get; set; } = string.Empty;

    [BsonElement("resultado")]
    public string Resultado { get; set; } = string.Empty;

    // Documento Clínico specific
    [BsonElement("especialidade")]
    public string Especialidade { get; set; } = string.Empty;

    [BsonElement("tipoClinico")]
    public string TipoClinico { get; set; } = string.Empty;

    [BsonElement("conteudo")]
    public string Conteudo { get; set; } = string.Empty;

    [BsonElement("conclusoes")]
    public string Conclusoes { get; set; } = string.Empty;

    // Common fields
    [BsonElement("data")]
    public string Data { get; set; } = string.Empty;

    [BsonElement("observacoes")]
    public string Observacoes { get; set; } = string.Empty;

    [BsonElement("resumo")]
    public string Resumo { get; set; } = string.Empty;

    [BsonElement("diagnostico")]
    public string Diagnostico { get; set; } = string.Empty;

    // Armazenamento de imagens (suporta múltiplas páginas)
    [BsonElement("urlImagens")]
    public List<string> UrlImagens { get; set; } = new();

    [BsonElement("idPublicos")]
    public List<string> IdPublicos { get; set; } = new();

    [BsonElement("textoExtraido")]
    public string TextoExtraido { get; set; } = string.Empty;

    [BsonElement("conteudoIndentado")]
    public List<LinhaIndentadaDocumento> ConteudoIndentado { get; set; } = new();

    [BsonElement("criadoEm")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
