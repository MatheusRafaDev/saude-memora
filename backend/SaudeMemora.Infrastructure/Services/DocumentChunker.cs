using System.Text;
using System.Text.RegularExpressions;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Infrastructure.Services;

public class DocumentChunker : IDocumentChunker
{
    public const int DefaultVersion = 1;
    public int CurrentVersion => DefaultVersion;

    private const int MaxChunkChars = 800;
    private const int MinChunkChars = 30;

    public IReadOnlyList<DocumentChunk> CreateChunks(RegistroDocumento document, int? version = null)
    {
        if (document == null || string.IsNullOrWhiteSpace(document.Id) || string.IsNullOrWhiteSpace(document.PacienteId))
        {
            return Array.Empty<DocumentChunk>();
        }

        var activeVersion = version ?? CurrentVersion;
        var chunks = new List<DocumentChunk>();
        var chunkIndex = 0;

        // 1. Chunk de Cabeçalho e Síntese Clínica (Resumo, Diagnóstico, Conclusões)
        var summaryText = BuildSummaryChunkText(document);
        if (!string.IsNullOrWhiteSpace(summaryText) && summaryText.Length >= MinChunkChars)
        {
            chunks.Add(CreateChunk(document, summaryText, chunkIndex++, activeVersion));
        }

        // 2. Chunk de Itens Estruturados (Medicamentos e Resultados de Exames)
        var structuredItemsText = BuildStructuredItemsText(document);
        if (!string.IsNullOrWhiteSpace(structuredItemsText) && structuredItemsText.Length >= MinChunkChars)
        {
            chunks.Add(CreateChunk(document, structuredItemsText, chunkIndex++, activeVersion));
        }

        // 3. Chunks de Conteúdo Narrativo e Observações / Texto Extraído
        var narrativeText = JoinNotEmpty("\n\n", document.Conteudo, document.Observacoes);
        if (string.IsNullOrWhiteSpace(narrativeText) && chunks.Count == 0 && !string.IsNullOrWhiteSpace(document.TextoExtraido))
        {
            narrativeText = document.TextoExtraido;
        }

        if (!string.IsNullOrWhiteSpace(narrativeText))
        {
            var textSegments = SplitIntoChunks(narrativeText, MaxChunkChars);
            foreach (var segment in textSegments)
            {
                if (segment.Length >= MinChunkChars)
                {
                    var chunkText = $"Documento: {document.Titulo} ({document.Tipo})\nData: {document.Data}\nTrecho: {segment}";
                    chunks.Add(CreateChunk(document, chunkText, chunkIndex++, activeVersion));
                }
            }
        }

        // Se após tudo nenhum chunk passou pelo threshold, mas há algum texto básico, gera 1 chunk com o que temos
        if (chunks.Count == 0)
        {
            var fallback = JoinNotEmpty(" - ", document.Titulo, document.Tipo, document.Data, document.Resumo, document.TextoExtraido);
            if (!string.IsNullOrWhiteSpace(fallback))
            {
                chunks.Add(CreateChunk(document, fallback, chunkIndex++, activeVersion));
            }
        }

        return chunks;
    }

    private static DocumentChunk CreateChunk(RegistroDocumento document, string text, int index, int version)
    {
        return new DocumentChunk
        {
            Id = $"{document.Id}_c{index}",
            DocumentoId = document.Id!,
            PacienteId = document.PacienteId,
            ChunkIndex = index,
            Titulo = document.Titulo ?? string.Empty,
            Tipo = (document.Tipo ?? string.Empty).ToLowerInvariant(),
            Data = document.Data ?? string.Empty,
            Texto = text.Trim(),
            Embedding = new List<float>(),
            ModeloEmbedding = "text-embedding-004",
            Versao = version,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow
        };
    }

    private static string BuildSummaryChunkText(RegistroDocumento doc)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Documento: {doc.Titulo}");
        sb.AppendLine($"Tipo: {doc.Tipo} | Data: {doc.Data}");

        if (!string.IsNullOrWhiteSpace(doc.NomeExame) || !string.IsNullOrWhiteSpace(doc.TipoExame))
        {
            sb.AppendLine($"Exame: {JoinNotEmpty(" - ", doc.NomeExame, doc.TipoExame)}");
        }

        if (!string.IsNullOrWhiteSpace(doc.Especialidade))
        {
            sb.AppendLine($"Especialidade: {doc.Especialidade}");
        }

        if (!string.IsNullOrWhiteSpace(doc.Diagnostico))
        {
            sb.AppendLine($"Diagnóstico: {doc.Diagnostico}");
        }

        if (!string.IsNullOrWhiteSpace(doc.Resumo))
        {
            sb.AppendLine($"Resumo: {doc.Resumo}");
        }

        if (!string.IsNullOrWhiteSpace(doc.Conclusoes))
        {
            sb.AppendLine($"Conclusões: {doc.Conclusoes}");
        }

        if (!string.IsNullOrWhiteSpace(doc.Resultado))
        {
            sb.AppendLine($"Resultado Geral: {doc.Resultado}");
        }

        return sb.ToString().Trim();
    }

    private static string BuildStructuredItemsText(RegistroDocumento doc)
    {
        var sb = new StringBuilder();

        if (doc.Medicamentos is { Count: > 0 })
        {
            sb.AppendLine("Medicamentos prescritos/mencionados:");
            foreach (var med in doc.Medicamentos)
            {
                var line = $"- {med.Nome}";
                if (!string.IsNullOrWhiteSpace(med.Dosagem)) line += $" (Dosagem: {med.Dosagem})";
                if (!string.IsNullOrWhiteSpace(med.Horario)) line += $" [Horário: {med.Horario}]";
                sb.AppendLine(line);
            }
        }

        if (doc.ResultadosExame is { Count: > 0 })
        {
            sb.AppendLine("Resultados laboratoriais/exames:");
            foreach (var item in doc.ResultadosExame.Take(25)) // Limite de bom senso para caber no chunk
            {
                var val = !string.IsNullOrWhiteSpace(item.ValorTexto) ? item.ValorTexto : (item.Valor.HasValue ? item.Valor.ToString() : "");
                var line = $"- {item.Nome}: {val} {item.Unidade}".Trim();
                if (!string.IsNullOrWhiteSpace(item.ReferenciaTexto)) line += $" (Ref: {item.ReferenciaTexto})";
                if (!string.IsNullOrWhiteSpace(item.Status) && item.Status != "indefinido") line += $" [{item.Status}]";
                sb.AppendLine(line);
            }
        }

        return sb.ToString().Trim();
    }

    private static List<string> SplitIntoChunks(string text, int maxChars)
    {
        var chunks = new List<string>();
        if (string.IsNullOrWhiteSpace(text)) return chunks;

        if (text.Length <= maxChars)
        {
            chunks.Add(text);
            return chunks;
        }

        // Divide por quebras de linha ou pontuação final
        var paragraphs = Regex.Split(text, @"(\r?\n)+|(?<=[.!?])\s+")
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Select(p => p.Trim())
            .ToList();

        var current = new StringBuilder();
        foreach (var p in paragraphs)
        {
            if (current.Length + p.Length + 1 > maxChars && current.Length > 0)
            {
                chunks.Add(current.ToString().Trim());
                current.Clear();
            }

            if (p.Length > maxChars)
            {
                // Parágrafo gigante sem pontuação: divide em fatias
                for (int i = 0; i < p.Length; i += maxChars)
                {
                    int len = Math.Min(maxChars, p.Length - i);
                    chunks.Add(p.Substring(i, len).Trim());
                }
            }
            else
            {
                if (current.Length > 0) current.Append(' ');
                current.Append(p);
            }
        }

        if (current.Length > 0)
        {
            chunks.Add(current.ToString().Trim());
        }

        return chunks;
    }

    private static string JoinNotEmpty(string separator, params string?[] items)
    {
        return string.Join(separator, items.Where(i => !string.IsNullOrWhiteSpace(i)));
    }
}
