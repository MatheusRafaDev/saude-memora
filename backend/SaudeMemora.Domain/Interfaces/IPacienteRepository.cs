using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Domain.Interfaces;

public interface IPacienteRepository
{
    Task<Paciente?> GetByEmailAsync(string email);
    Task<Paciente?> GetByResetTokenAsync(string token);
    Task<Paciente?> GetByEmergenciaTokenAsync(string token);

    Task<Paciente?> GetByIdAsync(string id);
    Task<Paciente> CreateAsync(Paciente paciente);
    Task UpdateAsync(Paciente paciente);
    Task DeleteAsync(string id);
}
