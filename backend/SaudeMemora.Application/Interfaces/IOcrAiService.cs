using SaudeMemora.Application.DTOs;

namespace SaudeMemora.Application.Interfaces;

public interface IOcrAiService
{
    Task<ExtractedDocumentDto> ExtractDocumentDataAsync(string imageUrl, string documentType);
}

public class ExtractedDocumentDto
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Doctor { get; set; } = string.Empty;
    public string Clinic { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string Crm { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string ExamType { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string ClinicalType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Conclusions { get; set; } = string.Empty;
    public string Observations { get; set; } = string.Empty;
    public List<ExtractedMedicineDto> Medicines { get; set; } = new();
    public string ExtractedText { get; set; } = string.Empty;
}

public class ExtractedMedicineDto
{
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Schedule { get; set; } = string.Empty;
}
