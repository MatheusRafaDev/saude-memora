using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;

namespace SaudeMemora.Api.Endpoints;

/// <summary>
/// Resumo agregado para a tela de Visão geral.
///
/// Motivo de existir: os indicadores que a tela precisa (exames fora da faixa de
/// referência, alertas ativos, consultas por profissional, cobertura da ficha médica)
/// dependem do conteúdo completo de cada documento. Calcular isso no navegador exigiria
/// uma requisição de detalhe por documento — dezenas delas no login do usuário.
/// Aqui a agregação acontece no servidor, em uma única chamada.
/// </summary>
public static class DashboardEndpoints
{
    private const int MaxDocumentosRecentes = 5;
    private const int MaxAlertas = 8;
    private const int MaxBiomarcadores = 5;
    private const int MaxConsultas = 5;
    private const int MaxMedicamentosAtivos = 6;

    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard/resumo", async (
            ClaimsPrincipal user,
            IDocumentRepository docRepo,
            IFichaMedicaRepository fichaRepo,
            IPacienteRepository pacienteRepo) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var documentos = (await docRepo.GetAllByPacienteIdAsync(userId)).ToList();
            var prontos = documentos.Where(d => d.Status == "pronto").ToList();
            var hoje = DateTime.Today;

            var ficha = await fichaRepo.GetByPacienteIdAsync(userId);
            var paciente = await pacienteRepo.GetByIdAsync(userId);

            var resumo = new DashboardResumoResponse(
                CalcularIndicadores(documentos, prontos, hoje),
                CalcularAtencao(documentos, hoje),
                CalcularDistribuicao(documentos),
                CalcularBiomarcadores(prontos),
                CalcularConsultas(prontos),
                CalcularMedicamentosRecentes(prontos),
                CalcularFicha(ficha, paciente, documentos),
                CalcularDocumentosRecentes(documentos),
                CalcularAlertas(documentos));

            return Results.Ok(resumo);
        }).Produces<DashboardResumoResponse>().RequireAuthorization();
    }

    private static DashboardIndicadores CalcularIndicadores(
        List<RegistroDocumento> documentos,
        List<RegistroDocumento> prontos,
        DateTime hoje)
    {
        var limiarReceitaAtiva = hoje.AddDays(-30);

        return new DashboardIndicadores(
            Total: documentos.Count,
            Prontos: prontos.Count,
            Processando: documentos.Count(d => d.Status is "pending" or "processing"),
            Falhados: documentos.Count(d => d.Status == "failed"),
            Exames: prontos.Count(d => d.Tipo == "exame"),
            Receitas: prontos.Count(d => d.Tipo == "receita"),
            ReceitasAtivas: prontos.Count(d =>
                d.Tipo == "receita"
                && (string.IsNullOrEmpty(d.Data) || ExtrairData(d.Data) is { } data && data >= limiarReceitaAtiva)),
            RevisaoPendente: documentos.Count(d => d.RevisaoPendente));
    }

    private static List<DashboardItemAtencao> CalcularAtencao(
        List<RegistroDocumento> documentos,
        DateTime hoje)
    {
        var itens = new List<DashboardItemAtencao>();

        foreach (var doc in documentos.Where(d => d.RevisaoPendente))
        {
            itens.Add(new DashboardItemAtencao(
                Tipo: "revisao",
                Severidade: "moderada",
                Titulo: string.IsNullOrWhiteSpace(doc.Titulo) ? "Documento sem título" : doc.Titulo!,
                Descricao: "A leitura automática precisa da sua conferência.",
                DocumentoId: doc.Id));
        }

        foreach (var doc in documentos.Where(d => d.Status == "failed"))
        {
            itens.Add(new DashboardItemAtencao(
                Tipo: "falha",
                Severidade: "alta",
                Titulo: string.IsNullOrWhiteSpace(doc.Titulo) ? "Documento sem título" : doc.Titulo!,
                Descricao: "Não foi possível processar este documento.",
                DocumentoId: doc.Id));
        }

        // Alertas clínicos já calculados e não dispensados (alergia, interação, duplicidade).
        foreach (var doc in documentos)
        {
            foreach (var alerta in doc.Alertas ?? new List<AlertaDocumento>())
            {
                if (alerta.Dispensado) continue;

                itens.Add(new DashboardItemAtencao(
                    Tipo: alerta.Tipo,
                    Severidade: string.IsNullOrWhiteSpace(alerta.Severidade) ? "baixa" : alerta.Severidade,
                    Titulo: string.IsNullOrWhiteSpace(doc.Titulo) ? "Documento" : doc.Titulo!,
                    Descricao: alerta.Mensagem,
                    DocumentoId: doc.Id));
            }
        }

        // Receitas vencidas: o usuário pode continuar tomando algo que já expirou.
        foreach (var doc in documentos.Where(d => d.Tipo == "receita" && d.Status == "pronto"))
        {
            var data = ExtrairData(doc.Data);
            if (data is null || data >= hoje.AddDays(-90)) continue;

            itens.Add(new DashboardItemAtencao(
                Tipo: "receita_vencida",
                Severidade: "baixa",
                Titulo: string.IsNullOrWhiteSpace(doc.Titulo) ? "Receita" : doc.Titulo!,
                Descricao: $"Receita de {data.Value:dd/MM/yyyy} com mais de 90 dias.",
                DocumentoId: doc.Id));
        }

        return itens
            .OrderByDescending(i => PesoSeveridade(i.Severidade))
            .Take(MaxAlertas)
            .ToList();
    }

    private static List<DashboardDistribuicao> CalcularDistribuicao(List<RegistroDocumento> documentos)
    {
        var rotulos = new (string Tipo, string Rotulo)[]
        {
            ("exame", "Exames"),
            ("receita", "Receitas"),
            ("laudo", "Laudos"),
            ("atestado", "Atestados"),
            ("vacina", "Vacinas"),
            ("encaminhamento", "Encaminhamentos"),
            ("relatorio", "Relatórios"),
            ("outro", "Outros")
        };

        var total = documentos.Count;

        return rotulos
            .Select(item =>
            {
                var quantidade = documentos.Count(d => d.Tipo == item.Tipo);
                var percentual = total == 0 ? 0 : (int)Math.Round(quantidade * 100d / total);
                return new DashboardDistribuicao(item.Tipo, item.Rotulo, quantidade, percentual);
            })
            .Where(item => item.Quantidade > 0)
            .OrderByDescending(item => item.Quantidade)
            .ToList();
    }

    /// <summary>
    /// Um resultado está fora da faixa quando há faixa informada e o valor a extrapola.
    /// Sem valor numérico ou sem faixa, não afirmamos nada — evita marcar como alterado
    /// algo que apenas não foi extraído. Faixa invertida (mínimo maior que o máximo) é
    /// tratada como dado inconsistente e também não gera marcação: caso contrário todo
    /// valor apareceria como alterado.
    /// </summary>
    internal static bool EstaForaDaFaixa(double? valor, double? refMin, double? refMax)
    {
        if (!valor.HasValue) return false;
        if (refMin.HasValue && refMax.HasValue && refMin.Value > refMax.Value) return false;
        if (refMin.HasValue && valor.Value < refMin.Value) return true;
        if (refMax.HasValue && valor.Value > refMax.Value) return true;
        return false;
    }

    private static List<DashboardBiomarcador> CalcularBiomarcadores(List<RegistroDocumento> prontos)
    {
        var agrupado = prontos
            .Where(d => d.Tipo == "exame" && d.ResultadosExame != null)
            .SelectMany(d => d.ResultadosExame!
                .Where(r => !string.IsNullOrWhiteSpace(r.Nome))
                .Select(r => (Resultado: r, Documento: d)))
            .GroupBy(x => string.IsNullOrWhiteSpace(x.Resultado.NomeNormalizado)
                ? x.Resultado.Nome.Trim().ToLowerInvariant()
                : x.Resultado.NomeNormalizado!)
            .Where(g => g.Key.Length > 0);

        var lista = new List<DashboardBiomarcador>();

        foreach (var grupo in agrupado)
        {
            var ultimo = grupo
                .Where(x => x.Resultado.Valor.HasValue)
                .OrderByDescending(x => ExtrairData(x.Documento.Data) ?? DateTime.MinValue)
                .ThenByDescending(x => x.Documento.CriadoEm)
                .FirstOrDefault();

            if (ultimo.Resultado is null) continue;

            var valor = ultimo.Resultado.Valor;
            var foraDaFaixa = EstaForaDaFaixa(valor, ultimo.Resultado.RefMin, ultimo.Resultado.RefMax);

            lista.Add(new DashboardBiomarcador(
                Nome: ultimo.Resultado.Nome,
                NomeNormalizado: grupo.Key,
                UltimoValor: valor,
                ValorTexto: ultimo.Resultado.ValorTexto ?? string.Empty,
                Unidade: ultimo.Resultado.Unidade ?? string.Empty,
                RefMin: ultimo.Resultado.RefMin,
                RefMax: ultimo.Resultado.RefMax,
                Status: ultimo.Resultado.Status ?? string.Empty,
                ForaDaFaixa: foraDaFaixa,
                Data: ultimo.Documento.Data ?? string.Empty,
                DocumentoId: ultimo.Documento.Id,
                Medicoes: grupo.Count()));
        }

        return lista
            .OrderByDescending(b => b.ForaDaFaixa)
            .ThenByDescending(b => b.Medicoes)
            .Take(MaxBiomarcadores)
            .ToList();
    }

    private static List<DashboardConsulta> CalcularConsultas(List<RegistroDocumento> prontos)
    {
        var comProfissional = prontos
            .Where(d => !string.IsNullOrWhiteSpace(d.Medico) || !string.IsNullOrWhiteSpace(d.Clinica));

        var agrupado = comProfissional
            .GroupBy(d => (
                Medico: (d.Medico ?? string.Empty).Trim(),
                Clinica: (d.Clinica ?? string.Empty).Trim()))
            .Select(g => new
            {
                g.Key.Medico,
                g.Key.Clinica,
                Total = g.Count(),
                Especialidade = g
                    .Select(d => (d.Especialidade ?? string.Empty).Trim())
                    .FirstOrDefault(e => e.Length > 0) ?? string.Empty,
                UltimaData = g
                    .Select(d => ExtrairData(d.Data))
                    .Where(data => data.HasValue)
                    .Select(data => data!.Value)
                    .DefaultIfEmpty(DateTime.MinValue)
                    .Max()
            })
            .OrderByDescending(x => x.UltimaData)
            .ThenByDescending(x => x.Total)
            .Take(MaxConsultas);

        return agrupado
            .Select(x => new DashboardConsulta(
                Medico: x.Medico,
                Clinica: x.Clinica,
                Especialidade: x.Especialidade,
                TotalDocumentos: x.Total,
                UltimaData: x.UltimaData == DateTime.MinValue
                    ? string.Empty
                    : x.UltimaData.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)))
            .ToList();
    }

    private static List<DashboardMedicamento> CalcularMedicamentosRecentes(List<RegistroDocumento> prontos)
    {
        var medicamentos = prontos
            .Where(d => d.Medicamentos != null)
            .SelectMany(d => d.Medicamentos!
                .Where(m => !string.IsNullOrWhiteSpace(m.Nome))
                .Select(m => (Medicamento: m, Documento: d)));

        var agrupado = medicamentos
            .GroupBy(x => x.Medicamento.Nome.Trim().ToLowerInvariant())
            .Select(g =>
            {
                var maisRecente = g
                    .OrderByDescending(x => ExtrairData(x.Documento.Data) ?? DateTime.MinValue)
                    .ThenByDescending(x => x.Documento.CriadoEm)
                    .First();

                return new DashboardMedicamento(
                    Nome: maisRecente.Medicamento.Nome.Trim(),
                    Dosagem: (maisRecente.Medicamento.Dosagem ?? string.Empty).Trim(),
                    Horario: (maisRecente.Medicamento.Horario ?? string.Empty).Trim(),
                    DocumentoId: maisRecente.Documento.Id,
                    Data: maisRecente.Documento.Data ?? string.Empty,
                    Prescricoes: g.Count());
            })
            .OrderByDescending(m => ExtrairData(m.Data) ?? DateTime.MinValue)
            .ToList();

        // Prescrições mais recentes primeiro, sem repetir o mesmo medicamento.
        return agrupado.Take(MaxMedicamentosAtivos).ToList();
    }

    private static DashboardFicha CalcularFicha(
        FichaMedica? ficha,
        Paciente? paciente,
        List<RegistroDocumento> documentos)
    {
        var alergias = Limpar(ficha?.Alergias);
        var cronicas = Limpar(ficha?.DoencasCronicas);
        var condicoes = (ficha?.Condicoes ?? new List<CondicaoMedica>())
            .Where(c => c.Tem && !string.IsNullOrWhiteSpace(c.Nome))
            .Select(c => c.Nome.Trim())
            .ToList();
        var medicamentosContinuos = Limpar(ficha?.MedicamentosContinuos);
        var outras = (ficha?.OutrasDoencas ?? string.Empty).Trim();

        var condicoesConsolidadas = cronicas
            .Concat(condicoes)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var temHistorico = !string.IsNullOrWhiteSpace(ficha?.HistoricoFamiliar)
            || !string.IsNullOrWhiteSpace(ficha?.Cirurgias);
        var temHabitos = ficha is not null
            && (ficha.Fuma || ficha.Bebe || !string.IsNullOrWhiteSpace(ficha.HabitosGerais));

        var itens = new List<(string Rotulo, bool Preenchido)>
        {
            ("Tipo sanguíneo", !string.IsNullOrWhiteSpace(ficha?.TipoSanguineo)),
            ("Alergias", alergias.Count > 0),
            ("Condições de saúde", condicoesConsolidadas.Count > 0 || outras.Length > 0),
            ("Medicamentos contínuos", medicamentosContinuos.Count > 0),
            ("Histórico familiar e cirurgias", temHistorico),
            ("Hábitos", temHabitos),
            ("Contato de emergência", !string.IsNullOrWhiteSpace(paciente?.ContatoEmergencia)),
            ("Documentos enviados", documentos.Count > 0)
        };

        var preenchidos = itens.Count(i => i.Preenchido);
        var percentual = (int)Math.Round(preenchidos * 100d / itens.Count);

        return new DashboardFicha(
            TipoSanguineo: string.IsNullOrWhiteSpace(ficha?.TipoSanguineo) ? string.Empty : ficha!.TipoSanguineo!,
            DoadorOrgaos: ficha?.DoadorOrgaos ?? false,
            Alergias: alergias,
            Condicoes: condicoesConsolidadas,
            OutrasDoencas: outras,
            MedicamentosContinuos: medicamentosContinuos,
            Cirurgias: (ficha?.Cirurgias ?? string.Empty).Trim(),
            HistoricoFamiliar: (ficha?.HistoricoFamiliar ?? string.Empty).Trim(),
            Fuma: ficha?.Fuma ?? false,
            Bebe: ficha?.Bebe ?? false,
            HabitosGerais: (ficha?.HabitosGerais ?? string.Empty).Trim(),
            ContatoEmergencia: (paciente?.ContatoEmergencia ?? string.Empty).Trim(),
            PlanoSaude: (paciente?.PlanoSaude ?? string.Empty).Trim(),
            NumeroCarteirinha: (paciente?.NumeroCarteirinha ?? string.Empty).Trim(),
            CoberturaPercentual: percentual,
            ItensPendentes: itens.Where(i => !i.Preenchido).Select(i => i.Rotulo).ToList());
    }

    private static List<DashboardDocumentoRecente> CalcularDocumentosRecentes(List<RegistroDocumento> documentos)
        => documentos
            .OrderByDescending(d => d.CriadoEm)
            .Take(MaxDocumentosRecentes)
            .Select(d => new DashboardDocumentoRecente(
                Id: d.Id,
                Titulo: string.IsNullOrWhiteSpace(d.Titulo) ? "Documento sem título" : d.Titulo!,
                Tipo: d.Tipo ?? string.Empty,
                Data: d.Data ?? string.Empty,
                Medico: (d.Medico ?? string.Empty).Trim(),
                Clinica: (d.Clinica ?? string.Empty).Trim(),
                Status: d.Status ?? string.Empty,
                CriadoEm: d.CriadoEm))
            .ToList();

    /// <summary>
    /// Alertas clínicos já calculados e persistidos no processamento do documento.
    /// A Visão geral lê esse resultado em vez de reexecutar a verificação: o
    /// <see cref="IAlertaMedicamentoService"/> chama a IA para detectar interações, e
    /// repetir isso a cada abertura da tela seria lento e caro. Como efeito positivo,
    /// a tela e a página do documento nunca discordam sobre os mesmos alertas.
    /// </summary>
    private static List<DashboardAlerta> CalcularAlertas(List<RegistroDocumento> documentos)
        => documentos
            .SelectMany(d => (d.Alertas ?? new List<AlertaDocumento>())
                .Where(a => !a.Dispensado)
                .Select(a => new DashboardAlerta(
                    Tipo: a.Tipo,
                    Severidade: a.Severidade,
                    Mensagem: a.Mensagem,
                    Medicamentos: a.Medicamentos ?? new List<string>(),
                    DocumentoId: d.Id,
                    Titulo: string.IsNullOrWhiteSpace(d.Titulo) ? "Documento" : d.Titulo!)))
            .OrderByDescending(a => PesoSeveridade(a.Severidade))
            .Take(MaxAlertas)
            .ToList();

    private static int PesoSeveridade(string? severidade) => (severidade ?? string.Empty).ToLowerInvariant() switch
    {
        "alta" => 3,
        "moderada" => 2,
        "media" or "média" => 2,
        _ => 1
    };

    private static List<string> Limpar(IEnumerable<string>? valores)
        => (valores ?? Enumerable.Empty<string>())
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    /// <summary>Aceita as duas grafias de data usadas no sistema.</summary>
    private static DateTime? ExtrairData(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return null;

        if (DateTime.TryParseExact(valor, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var br))
            return br;

        if (DateTime.TryParse(valor, CultureInfo.InvariantCulture, DateTimeStyles.None, out var livre))
            return livre;

        return null;
    }
}

public record DashboardResumoResponse(
    DashboardIndicadores Indicadores,
    List<DashboardItemAtencao> Atencao,
    List<DashboardDistribuicao> Distribuicao,
    List<DashboardBiomarcador> Biomarcadores,
    List<DashboardConsulta> Consultas,
    List<DashboardMedicamento> MedicamentosRecentes,
    DashboardFicha Ficha,
    List<DashboardDocumentoRecente> DocumentosRecentes,
    List<DashboardAlerta> Alertas);

public record DashboardIndicadores(
    int Total,
    int Prontos,
    int Processando,
    int Falhados,
    int Exames,
    int Receitas,
    int ReceitasAtivas,
    int RevisaoPendente);

public record DashboardItemAtencao(
    string Tipo,
    string Severidade,
    string Titulo,
    string Descricao,
    string? DocumentoId);

public record DashboardDistribuicao(
    string Tipo,
    string Rotulo,
    int Quantidade,
    int Percentual);

public record DashboardBiomarcador(
    string Nome,
    string NomeNormalizado,
    double? UltimoValor,
    string ValorTexto,
    string Unidade,
    double? RefMin,
    double? RefMax,
    string Status,
    bool ForaDaFaixa,
    string Data,
    string? DocumentoId,
    int Medicoes);

public record DashboardConsulta(
    string Medico,
    string Clinica,
    string Especialidade,
    int TotalDocumentos,
    string UltimaData);

public record DashboardMedicamento(
    string Nome,
    string Dosagem,
    string Horario,
    string? DocumentoId,
    string Data,
    int Prescricoes);

public record DashboardFicha(
    string TipoSanguineo,
    bool DoadorOrgaos,
    List<string> Alergias,
    List<string> Condicoes,
    string OutrasDoencas,
    List<string> MedicamentosContinuos,
    string Cirurgias,
    string HistoricoFamiliar,
    bool Fuma,
    bool Bebe,
    string HabitosGerais,
    string ContatoEmergencia,
    string PlanoSaude,
    string NumeroCarteirinha,
    int CoberturaPercentual,
    List<string> ItensPendentes);

public record DashboardDocumentoRecente(
    string? Id,
    string Titulo,
    string Tipo,
    string Data,
    string Medico,
    string Clinica,
    string Status,
    DateTime CriadoEm);

public record DashboardAlerta(
    string Tipo,
    string Severidade,
    string Mensagem,
    List<string> Medicamentos,
    string? DocumentoId,
    string Titulo);
