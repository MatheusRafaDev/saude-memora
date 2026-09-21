using FluentValidation;

namespace SaudeMemora.Application.DTOs;

public class RegisterPacienteDtoValidator : AbstractValidator<RegisterPacienteDto>
{
    public RegisterPacienteDtoValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Nome é obrigatório.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Email inválido.");
        RuleFor(x => x.Cpf).NotEmpty().WithMessage("CPF é obrigatório.");
        RuleFor(x => x.Senha).NotEmpty().MinimumLength(6).WithMessage("A senha deve ter no mínimo 6 caracteres.");
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
