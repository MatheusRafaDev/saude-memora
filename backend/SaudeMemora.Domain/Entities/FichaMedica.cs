using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace SaudeMemora.Domain.Entities;

public class FichaMedica
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("patientId")]
    [Required]
    public string PatientId { get; set; } = string.Empty;

    [BsonElement("historicoFamiliar")]
    public string HistoricoFamiliar { get; set; } = string.Empty;

    [BsonElement("cirurgias")]
    public string Cirurgias { get; set; } = string.Empty;

    [BsonElement("fuma")]
    public bool Fuma { get; set; } = false;

    [BsonElement("bebe")]
    public bool Bebe { get; set; } = false;

    [BsonElement("habitosGerais")]
    public string HabitosGerais { get; set; } = string.Empty;

    [BsonElement("observacoes")]
    public string Observacoes { get; set; } = string.Empty;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
