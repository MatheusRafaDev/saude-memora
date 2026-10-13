using FluentValidation;
using System.Globalization;

namespace SaudeMemora.Application.DTOs;

public class RegisterPacienteDtoValidator : AbstractValidator<RegisterPacienteDto>
{
    public RegisterPacienteDtoValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Nome é obrigatório.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Email inválido.");
        RuleFor(x => x.DataNascimento)
            .NotEmpty().WithMessage("Data de nascimento é obrigatória.")
            .Must(value =>
                DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
                && date <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Informe uma data de nascimento válida, que não seja futura.");
        RuleFor(x => x.Sexo)
            .NotEmpty().WithMessage("Sexo é obrigatório.")
            .Must(value => new[] { "Feminino", "Masculino", "Outro" }.Contains(value, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Selecione uma opção válida para o sexo.");

        RuleFor(x => x.Senha).NotEmpty().MinimumLength(8).WithMessage("A senha deve ter no mínimo 8 caracteres.");
    }
}

public class LoginPacienteDtoValidator : AbstractValidator<LoginPacienteDto>
{
    public LoginPacienteDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Email inválido.");
        RuleFor(x => x.Senha).NotEmpty().WithMessage("Senha é obrigatória.");
    }
}
