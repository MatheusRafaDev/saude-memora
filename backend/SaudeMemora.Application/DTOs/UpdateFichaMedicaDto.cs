using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.DTOs;

public class UpdateFichaMedicaDto
{
    public string? PacienteId { get; set; }
    public string? HistoricoFamiliar { get; set; }
    public string? Cirurgias { get; set; }
    public bool? Fuma { get; set; }
    public bool? Bebe { get; set; }
    public string? HabitosGerais { get; set; }
    public string? Observacoes { get; set; }
    public string? OutrasDoencas { get; set; }
    public string? TipoSanguineo { get; set; }
    public bool? DoadorOrgaos { get; set; }
    public List<string>? Alergias { get; set; }
    public List<string>? DoencasCronicas { get; set; }
    public List<string>? MedicamentosContinuos { get; set; }
    public List<CondicaoMedica>? Condicoes { get; set; }
}
