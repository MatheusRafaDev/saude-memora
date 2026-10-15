using FluentValidation;
using System.Globalization;

namespace SaudeMemora.Application.DTOs;

/// <summary>
/// Validação dos contratos de escrita que carregam dados clínicos.
/// Antes só Register/Login eram validados, e os campos da ficha médica e dos documentos
/// iam direto para o MongoDB com validação apenas ad hoc dentro do handler.
/// </summary>
public static class DominioClinico
{
    public static readonly string[] TiposSanguineos =
    {
        "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
    };

    public static readonly string[] Sexos = { "Feminino", "Masculino", "Outro" };

    public static readonly string[] TiposDocumento =
    {
        "exame", "receita", "laudo", "atestado", "vacina", "encaminhamento", "outro"
    };

    public static readonly string[] StatusResultadoExame =
    {
        "normal", "baixo", "alto", "indefinido"
    };

    public const int MaxTextoCurto = 200;
    public const int MaxTextoLivre = 20000;
    public const int MaxItensLista = 200;
    public const int MaxItensColecao = 500;

    public static bool DataNaoFutura(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return false;

        DateOnly data;
        if (!DateOnly.TryParseExact(valor, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out data)
            && !DateOnly.TryParseExact(valor, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out data))
            return false;

        return data <= DateOnly.FromDateTime(DateTime.UtcNow);
    }
}

public class UpdateFichaMedicaDtoValidator : AbstractValidator<UpdateFichaMedicaDto>
{
    public UpdateFichaMedicaDtoValidator()
    {
        RuleFor(x => x.TipoSanguineo)
            .Must(valor => string.IsNullOrWhiteSpace(valor)
                || DominioClinico.TiposSanguineos.Contains(valor.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Tipo sanguíneo inválido. Use um de: {string.Join(", ", DominioClinico.TiposSanguineos)}.");

        RuleFor(x => x.HistoricoFamiliar).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.Cirurgias).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.HabitosGerais).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.Observacoes).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.OutrasDoencas).MaximumLength(DominioClinico.MaxTextoLivre);

        RuleFor(x => x.Alergias)
            .Must(lista => lista is null || lista.Count <= DominioClinico.MaxItensLista)
            .WithMessage($"Informe no máximo {DominioClinico.MaxItensLista} alergias.")
            .Must(lista => lista is null || lista.All(item => item is null || item.Length <= DominioClinico.MaxTextoCurto))
            .WithMessage($"Cada alergia deve ter no máximo {DominioClinico.MaxTextoCurto} caracteres.");

        RuleFor(x => x.DoencasCronicas)
            .Must(lista => lista is null || lista.Count <= DominioClinico.MaxItensLista)
            .WithMessage($"Informe no máximo {DominioClinico.MaxItensLista} doenças crônicas.")
            .Must(lista => lista is null || lista.All(item => item is null || item.Length <= DominioClinico.MaxTextoCurto))
            .WithMessage($"Cada doença crônica deve ter no máximo {DominioClinico.MaxTextoCurto} caracteres.");

        RuleFor(x => x.MedicamentosContinuos)
            .Must(lista => lista is null || lista.Count <= DominioClinico.MaxItensLista)
            .WithMessage($"Informe no máximo {DominioClinico.MaxItensLista} medicamentos contínuos.")
            .Must(lista => lista is null || lista.All(item => item is null || item.Length <= DominioClinico.MaxTextoCurto))
            .WithMessage($"Cada medicamento deve ter no máximo {DominioClinico.MaxTextoCurto} caracteres.");

        RuleFor(x => x.Condicoes)
            .Must(lista => lista is null || lista.Count <= DominioClinico.MaxItensLista)
            .WithMessage($"Informe no máximo {DominioClinico.MaxItensLista} condições.");

        RuleForEach(x => x.Condicoes).ChildRules(condicao =>
        {
            condicao.RuleFor(c => c.Nome)
                .NotEmpty().WithMessage("O nome da condição é obrigatório.")
                .MaximumLength(DominioClinico.MaxTextoCurto);
            condicao.RuleFor(c => c.Detalhes).MaximumLength(DominioClinico.MaxTextoLivre);
        });
    }
}

public class DocumentUpdateDtoValidator : AbstractValidator<DocumentUpdateDto>
{
    public DocumentUpdateDtoValidator()
    {
        RuleFor(x => x.Tipo)
            .Must(valor => string.IsNullOrWhiteSpace(valor)
                || DominioClinico.TiposDocumento.Contains(valor.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Tipo de documento inválido. Use um de: {string.Join(", ", DominioClinico.TiposDocumento)}.");

        // A data clínica chega como texto livre do usuário; aceitamos vazio ou data válida.
        RuleFor(x => x.Data)
            .Must(valor => string.IsNullOrWhiteSpace(valor) || DominioClinico.DataNaoFutura(valor))
            .WithMessage("Informe uma data válida (dd/mm/aaaa), que não seja futura.");

        RuleFor(x => x.Titulo).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Medico).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Clinica).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Crm).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Cid).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Cnes).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Especialidade).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.NomeExame).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.TipoExame).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Resumo).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.Diagnostico).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.Conteudo).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.Conclusoes).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.Observacoes).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.TextoExtraido).MaximumLength(DominioClinico.MaxTextoLivre);

        RuleFor(x => x.Medicamentos)
            .Must(lista => lista is null || lista.Count <= DominioClinico.MaxItensColecao)
            .WithMessage($"Informe no máximo {DominioClinico.MaxItensColecao} medicamentos.");

        RuleForEach(x => x.Medicamentos).ChildRules(medicamento =>
        {
            medicamento.RuleFor(m => m.Nome).MaximumLength(DominioClinico.MaxTextoCurto);
            medicamento.RuleFor(m => m.Dosagem).MaximumLength(DominioClinico.MaxTextoCurto);
            medicamento.RuleFor(m => m.Horario).MaximumLength(DominioClinico.MaxTextoCurto);
        });

        RuleFor(x => x.ResultadosExame)
            .Must(lista => lista is null || lista.Count <= DominioClinico.MaxItensColecao)
            .WithMessage($"Informe no máximo {DominioClinico.MaxItensColecao} resultados de exame.");

        RuleForEach(x => x.ResultadosExame).ChildRules(resultado =>
        {
            resultado.RuleFor(r => r.Nome).MaximumLength(DominioClinico.MaxTextoCurto);
            resultado.RuleFor(r => r.Unidade).MaximumLength(DominioClinico.MaxTextoCurto);
            resultado.RuleFor(r => r.Status)
                .Must(valor => string.IsNullOrWhiteSpace(valor)
                    || DominioClinico.StatusResultadoExame.Contains(valor.Trim(), StringComparer.OrdinalIgnoreCase))
                .WithMessage($"Status de resultado inválido. Use um de: {string.Join(", ", DominioClinico.StatusResultadoExame)}.");
            // Faixa de referência coerente: mínimo não pode superar o máximo.
            resultado.RuleFor(r => r)
                .Must(r => !r.RefMin.HasValue || !r.RefMax.HasValue || r.RefMin.Value <= r.RefMax.Value)
                .WithMessage("A referência mínima não pode ser maior que a máxima.");
            resultado.RuleFor(r => r.Confianca)
                .InclusiveBetween(0d, 1d)
                .WithMessage("A confiança deve estar entre 0 e 1.");
        });

        RuleFor(x => x.CamposConfirmados)
            .Must(lista => lista is null || lista.Count <= DominioClinico.MaxItensColecao)
            .WithMessage($"Informe no máximo {DominioClinico.MaxItensColecao} campos confirmados.");
    }
}

public class PerfilUpdateDtoValidator : AbstractValidator<PerfilUpdateDto>
{
    public PerfilUpdateDtoValidator()
    {
        RuleFor(x => x.Nome)
            .MaximumLength(DominioClinico.MaxTextoCurto)
            .Must(nome => string.IsNullOrWhiteSpace(nome) || nome.Trim().Length >= 2)
            .WithMessage("O nome deve ter ao menos 2 caracteres.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email inválido.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.DataNascimento)
            .Must(valor => string.IsNullOrWhiteSpace(valor) || DominioClinico.DataNaoFutura(valor))
            .WithMessage("Informe uma data de nascimento válida, que não seja futura.");

        RuleFor(x => x.Sexo)
            .Must(valor => string.IsNullOrWhiteSpace(valor)
                || DominioClinico.Sexos.Contains(valor.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Selecione uma opção válida para o sexo: {string.Join(", ", DominioClinico.Sexos)}.");

        RuleFor(x => x.PlanoSaude).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.NumeroCarteirinha).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.ContatoEmergencia).MaximumLength(DominioClinico.MaxTextoCurto);
    }
}

public class ContatoDtoValidator : AbstractValidator<ContatoDto>
{
    public ContatoDtoValidator()
    {
        RuleFor(x => x.Telefone).MaximumLength(DominioClinico.MaxTextoCurto);
        RuleFor(x => x.Endereco).MaximumLength(DominioClinico.MaxTextoLivre);
        RuleFor(x => x.ContatoEmergencia).MaximumLength(DominioClinico.MaxTextoCurto);
    }
}

public class AlterarSenhaDtoValidator : AbstractValidator<AlterarSenhaDto>
{
    public AlterarSenhaDtoValidator()
    {
        RuleFor(x => x.SenhaAtual).NotEmpty().WithMessage("Informe a senha atual.");
        RuleFor(x => x.NovaSenha)
            .NotEmpty().WithMessage("Informe a nova senha.")
            .MinimumLength(8).WithMessage("A nova senha deve ter no mínimo 8 caracteres.")
            .MaximumLength(128).WithMessage("A nova senha deve ter no máximo 128 caracteres.")
            .NotEqual(x => x.SenhaAtual).WithMessage("A nova senha deve ser diferente da senha atual.");
    }
}

public class DeleteAccountDtoValidator : AbstractValidator<DeleteAccountDto>
{
    public DeleteAccountDtoValidator()
    {
        RuleFor(x => x.Senha).NotEmpty().WithMessage("Informe a senha para confirmar a exclusão.");
    }
}

public class ConsentimentoDtoValidator : AbstractValidator<ConsentimentoDto>
{
    public ConsentimentoDtoValidator()
    {
        RuleFor(x => x.Finalidade)
            .Must(finalidade => string.IsNullOrWhiteSpace(finalidade)
                || finalidade.Trim().ToLowerInvariant() is "ocr" or "chat")
            .WithMessage("Finalidade inválida. Use 'ocr' ou 'chat'.");
    }
}
