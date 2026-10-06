using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public class AlertaDocumento
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("tipo")]
    public string Tipo { get; set; } = string.Empty; // alergia | interacao | duplicidade

    [BsonElement("severidade")]
    public string Severidade { get; set; } = string.Empty; // baixa | moderada | alta

    [BsonElement("mensagem")]
    public string Mensagem { get; set; } = string.Empty;

    [BsonElement("medicamentos")]
    public List<string> Medicamentos { get; set; } = new();

    [BsonElement("geradoEm")]
    public DateTime GeradoEm { get; set; } = DateTime.UtcNow;

    [BsonElement("dispensado")]
    public bool Dispensado { get; set; } = false;
}

public class MedicamentoDocumento
{
    [BsonElement("nome")]
    public string Nome { get; set; } = string.Empty;

    [BsonElement("dosagem")]
    public string Dosagem { get; set; } = string.Empty;

    [BsonElement("horario")]
    public string Horario { get; set; } = string.Empty;
}

public class ResultadoExameItem
{
    [BsonElement("nome")]
    public string Nome { get; set; } = string.Empty;

    [BsonElement("nomeNormalizado")]
    public string NomeNormalizado { get; set; } = string.Empty;

    [BsonElement("valor")]
    public double? Valor { get; set; }

    [BsonElement("valorTexto")]
    public string ValorTexto { get; set; } = string.Empty;

    [BsonElement("unidade")]
    public string Unidade { get; set; } = string.Empty;

    [BsonElement("refMin")]
    public double? RefMin { get; set; }

    [BsonElement("refMax")]
    public double? RefMax { get; set; }

    [BsonElement("referenciaTexto")]
    public string ReferenciaTexto { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "indefinido"; // normal | baixo | alto | indefinido

    [BsonElement("confianca")]
    public double Confianca { get; set; } = 1.0;

    [BsonElement("confirmacaoNecessaria")]
    public bool ConfirmacaoNecessaria { get; set; } = false;

    [BsonElement("motivoConfirmacao")]
    public string MotivoConfirmacao { get; set; } = string.Empty;
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
    public string Status { get; set; } = "pending"; // pending | processing | failed | pronto

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

    [BsonElement("resultadosExame")]
    public List<ResultadoExameItem> ResultadosExame { get; set; } = new();

    [BsonElement("criadoEm")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    // --- Campos de Background Processing & Filas ---

    [BsonElement("fileHash")]
    [BsonIgnoreIfNull]
    public string? FileHash { get; set; }

    [BsonElement("progress")]
    public int Progress { get; set; } = 0; // 0 a 100

    [BsonElement("errorMessage")]
    public string ErrorMessage { get; set; } = string.Empty;

    [BsonElement("attempts")]
    public int Attempts { get; set; } = 0;

    [BsonElement("reprocessCount")]
    public int ReprocessCount { get; set; } = 0;

    [BsonElement("lockedUntil")]
    public DateTime? LockedUntil { get; set; }

    [BsonElement("lockedBy")]
    public string LockedBy { get; set; } = string.Empty;

    [BsonElement("version")]
    public int Version { get; set; } = 0;

    [BsonElement("revisaoPendente")]
    public bool RevisaoPendente { get; set; } = false;

    [BsonElement("revisadoEm")]
    [BsonIgnoreIfNull]
    public DateTime? RevisadoEm { get; set; }

    [BsonElement("camposBaixaConfianca")]
    public List<string> CamposBaixaConfianca { get; set; } = new();

    [BsonElement("alertas")]
    public List<AlertaDocumento> Alertas { get; set; } = new();
}
