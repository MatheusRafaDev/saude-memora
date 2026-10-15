namespace SaudeMemora.Application.DTOs;

/// <summary>
/// Contrato de atualização de documento (PUT /api/documents/{id}).
/// Atualização é parcial: apenas campos não nulos são aplicados.
/// </summary>
public class DocumentUpdateDto
{
    public const int MaxTextLength = 20000;
    public const int MaxItensColecao = 500;

    /// <summary>Caminhos de campo que o usuário confirmou na revisão (ex.: "medicamentos[0].dosagem").</summary>
    public List<string>? CamposConfirmados { get; set; }

    public string? Titulo { get; set; }
    public string? Tipo { get; set; }
    public string? Medico { get; set; }
    public string? Clinica { get; set; }
    public string? Data { get; set; }
    public string? Resumo { get; set; }
    public string? Diagnostico { get; set; }
    public string? Crm { get; set; }
    public string? Cid { get; set; }
    public string? Cnes { get; set; }
    public string? NomeExame { get; set; }
    public string? TipoExame { get; set; }
    public string? Resultado { get; set; }
    public string? Especialidade { get; set; }
    public string? TipoClinico { get; set; }
    public string? Conteudo { get; set; }
    public string? Conclusoes { get; set; }
    public string? Observacoes { get; set; }
    public string? TextoExtraido { get; set; }
    public List<MedicamentoDocumentoUpdateDto>? Medicamentos { get; set; }
    public List<LinhaIndentadaDocumentoUpdateDto>? ConteudoIndentado { get; set; }
    public List<ResultadoExameUpdateDto>? ResultadosExame { get; set; }
}

public class MedicamentoDocumentoUpdateDto
{
    public string? Nome { get; set; }
    public string? Dosagem { get; set; }
    public string? Horario { get; set; }
}

public class LinhaIndentadaDocumentoUpdateDto
{
    public string? Tipo { get; set; }
    public string? Texto { get; set; }
    public string? Chave { get; set; }
    public string? Valor { get; set; }
}

public class ResultadoExameUpdateDto
{
    public string? Nome { get; set; }
    public string? NomeNormalizado { get; set; }
    public double? Valor { get; set; }
    public string? ValorTexto { get; set; }
    public string? Unidade { get; set; }
    public double? RefMin { get; set; }
    public double? RefMax { get; set; }
    public string? ReferenciaTexto { get; set; }
    public string? Status { get; set; }
    public double Confianca { get; set; } = 1.0;
    public bool ConfirmacaoNecessaria { get; set; }
    public string? MotivoConfirmacao { get; set; }
}

/// <summary>Perfil do titular (PATCH /api/pacientes/me/perfil).</summary>
public class PerfilUpdateDto
{
    public string? Nome { get; set; }
    public string? DataNascimento { get; set; }
    public string? Email { get; set; }
    public string? PlanoSaude { get; set; }
    public string? NumeroCarteirinha { get; set; }
    public string? SenhaAtual { get; set; }
    public string? ContatoEmergencia { get; set; }
    public string? Sexo { get; set; }
}

/// <summary>Dados de contato do titular (PATCH /api/pacientes/me/contato).</summary>
public class ContatoDto
{
    public string? Telefone { get; set; }
    public string? Endereco { get; set; }
    public string? ContatoEmergencia { get; set; }
}

/// <summary>Troca de senha autenticada (POST /api/auth/alterar-senha).</summary>
public class AlterarSenhaDto
{
    public string SenhaAtual { get; set; } = string.Empty;
    public string NovaSenha { get; set; } = string.Empty;
}

/// <summary>Exclusão de conta (DELETE /api/pacientes/me).</summary>
public class DeleteAccountDto
{
    public string Senha { get; set; } = string.Empty;
}

/// <summary>Medicamento de uso contínuo informado na ficha médica.</summary>
public record MedicamentoContinuoDto(string Nome, string Dosagem, string Horario);

/// <summary>Consentimento LGPD por finalidade (POST /api/pacientes/me/consentimento).</summary>
public class ConsentimentoDto
{
    public bool Aceito { get; set; }
    public string? Finalidade { get; set; }
    public bool Dispensar { get; set; }
}
