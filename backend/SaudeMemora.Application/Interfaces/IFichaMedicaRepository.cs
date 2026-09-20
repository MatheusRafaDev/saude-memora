using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Application.Interfaces;

public interface IFichaMedicaRepository
{
    Task<FichaMedica> CreateAsync(FichaMedica ficha);
    Task<FichaMedica?> GetByPatientIdAsync(string patientId);
    Task UpdateAsync(FichaMedica ficha);
}
