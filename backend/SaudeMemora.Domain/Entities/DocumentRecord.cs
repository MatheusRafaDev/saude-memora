using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SaudeMemora.Domain.Entities;

public class DocumentMedicine
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("dosage")]
    public string Dosage { get; set; } = string.Empty;

    [BsonElement("schedule")]
    public string Schedule { get; set; } = string.Empty;
}

public class DocumentRecord
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("patientId")]
    public string PatientId { get; set; } = string.Empty;

    // Campos exibidos no frontend
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("type")]
    public string Type { get; set; } = string.Empty; // exame | receita | laudo

    [BsonElement("status")]
    public string Status { get; set; } = "processando"; // processando | pronto | arquivado

    // Receita specific
    [BsonElement("doctor")]
    public string Doctor { get; set; } = string.Empty;

    [BsonElement("crm")]
    public string Crm { get; set; } = string.Empty;

    [BsonElement("medicines")]
    public List<DocumentMedicine> Medicines { get; set; } = new();

    // Exame specific
    [BsonElement("examName")]
    public string ExamName { get; set; } = string.Empty;

    [BsonElement("examType")]
    public string ExamType { get; set; } = string.Empty;

    [BsonElement("clinic")]
    public string Clinic { get; set; } = string.Empty;

    [BsonElement("result")]
    public string Result { get; set; } = string.Empty;

    // Documento Clínico specific
    [BsonElement("specialty")]
    public string Specialty { get; set; } = string.Empty;

    [BsonElement("clinicalType")]
    public string ClinicalType { get; set; } = string.Empty;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("conclusions")]
    public string Conclusions { get; set; } = string.Empty;

    // Common fields
    [BsonElement("date")]
    public string Date { get; set; } = string.Empty;

    [BsonElement("observations")]
    public string Observations { get; set; } = string.Empty;

    [BsonElement("summary")]
    public string Summary { get; set; } = string.Empty;

    [BsonElement("diagnosis")]
    public string Diagnosis { get; set; } = string.Empty;

    // Armazenamento original
    [BsonElement("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [BsonElement("publicId")]
    public string PublicId { get; set; } = string.Empty;

    [BsonElement("extractedText")]
    public string ExtractedText { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
