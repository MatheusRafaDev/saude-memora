namespace SaudeMemora.Application.Interfaces;

public interface IMedicamentoApiService
{
    Task<MedicamentoDescricao?> BuscarDescricaoAsync(string nome, CancellationToken cancellationToken = default);
}

public sealed record MedicamentoDescricao(
    string Nome,
    string Descricao,
    string Fonte,
    string PrincipioAtivo = "",
    string Fabricante = "",
    string TipoProduto = "",
    string ClasseTerapeutica = "",
    string RegistroAnvisa = "",
    string SituacaoRegistro = "");
