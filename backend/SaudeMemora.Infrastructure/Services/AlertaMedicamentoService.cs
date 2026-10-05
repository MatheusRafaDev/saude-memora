using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Infrastructure.Services;

public class AlertaMedicamentoService : IAlertaMedicamentoService
{
    private readonly ILogger<AlertaMedicamentoService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _groqApiKey;

    public AlertaMedicamentoService(ILogger<AlertaMedicamentoService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _httpClient = new HttpClient { BaseAddress = new Uri("https://api.groq.com/openai/v1/") };
        _groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? configuration["Groq:ApiKey"] ?? string.Empty;
    }

    public async Task<List<AlertaDocumento>> GerarAlertasAsync(RegistroDocumento documento, FichaMedica ficha)
    {
        var alertas = new List<AlertaDocumento>();

        if (documento.Tipo != "receita" || documento.Medicamentos == null || !documento.Medicamentos.Any())
        {
            return alertas;
        }

        // 1. Deterministic
        var medNovos = documento.Medicamentos.Select(m => Normalizar(m.Nome)).ToList();
        var medContinuos = ficha.MedicamentosContinuos?.Select(m => Normalizar(m)).Where(m => !string.IsNullOrEmpty(m)).ToList() ?? new List<string>();
        var alergias = ficha.Alergias?.Select(a => Normalizar(a)).Where(a => !string.IsNullOrEmpty(a)).ToList() ?? new List<string>();

        // Checar duplicidades
        foreach (var m in medNovos)
        {
            if (medContinuos.Any(c => c.Contains(m) || m.Contains(c)))
            {
                alertas.Add(new AlertaDocumento
                {
                    Tipo = "duplicidade",
                    Severidade = "moderada",
                    Mensagem = $"Possível duplicidade: Você já toma algo semelhante a {m}.",
                    Medicamentos = new List<string> { m }
                });
            }
        }

        // Checar alergias
        var alergiasClasses = MapearClassesAlergia(alergias);
        foreach (var m in medNovos)
        {
            if (alergiasClasses.Any(ac => ac.Contains(m) || m.Contains(ac)))
            {
                alertas.Add(new AlertaDocumento
                {
                    Tipo = "alergia",
                    Severidade = "alta",
                    Mensagem = $"Alerta de Alergia: {m} pode causar reação alérgica baseada no seu histórico.",
                    Medicamentos = new List<string> { m }
                });
            }
        }

        // 2. IA - Interações
        if (!string.IsNullOrEmpty(_groqApiKey) && medContinuos.Any())
        {
            try
            {
                var interacoes = await ChecarInteracoesComIA(medNovos, medContinuos);
                foreach (var inter in interacoes)
                {
                    alertas.Add(new AlertaDocumento
                    {
                        Tipo = "interacao",
                        Severidade = inter.Severidade,
                        Mensagem = inter.Explicacao + " Recomendação: " + inter.Recomendacao,
                        Medicamentos = inter.Medicamentos
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar interações com Groq.");
            }
        }

        return alertas;
    }

    private string Normalizar(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var t = text.Trim().ToLowerInvariant();
        
        // simple ascii normalization could go here
        var sb = new StringBuilder();
        foreach (var c in t.Normalize(NormalizationForm.FormD))
        {
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        return sb.ToString();
    }

    private List<string> MapearClassesAlergia(List<string> alergias)
    {
        var map = new Dictionary<string, List<string>>
        {
            { "dipirona", new List<string> { "dipirona", "metamizol", "novalgina", "lisador" } },
            { "aas", new List<string> { "aas", "acido acetilsalicilico", "aspirina", "somalgina" } },
            { "penicilina", new List<string> { "penicilina", "amoxicilina", "ampicilina", "benzilpenicilina" } }
        };

        var ampliado = new List<string>(alergias);
        foreach (var a in alergias)
        {
            foreach (var kvp in map)
            {
                if (a.Contains(kvp.Key) || kvp.Key.Contains(a))
                {
                    ampliado.AddRange(kvp.Value);
                }
            }
        }
        return ampliado.Distinct().ToList();
    }

    private async Task<List<InteracaoIA>> ChecarInteracoesComIA(List<string> novos, List<string> continuos)
    {
        var prompt = $@"
Analise possíveis interações medicamentosas entre as seguintes listas:
Novos Receitados: {string.Join(", ", novos)}
Contínuos: {string.Join(", ", continuos)}

Devolva um JSON estrito no formato abaixo, e responda em pt-BR:
{{
  ""interacoes"": [
    {{
      ""severidade"": ""baixa"", // baixa, moderada, alta
      ""explicacao"": ""Breve motivo da interação"",
      ""recomendacao"": ""consulte seu médico/farmacêutico"",
      ""medicamentos"": [""nome_1"", ""nome_2""]
    }}
  ]
}}

Seja conservador: na dúvida, não alerte com severidade alta. Se não houver interações, retorne lista vazia. Devolva apenas o JSON.
";

        var requestBody = new
        {
            model = "llama3-8b-8192",
            messages = new[]
            {
                new { role = "system", content = "Você é um assistente de checagem de interações medicamentosas. Devolva apenas JSON válido, sem texto em volta." },
                new { role = "user", content = prompt }
            },
            response_format = new { type = "json_object" },
            temperature = 0.0
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _groqApiKey);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var message = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

        if (string.IsNullOrWhiteSpace(message)) return new List<InteracaoIA>();

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var result = JsonSerializer.Deserialize<InteracoesResponse>(message, options);

        return result?.Interacoes ?? new List<InteracaoIA>();
    }

    private class InteracoesResponse
    {
        [JsonPropertyName("interacoes")]
        public List<InteracaoIA> Interacoes { get; set; } = new();
    }

    private class InteracaoIA
    {
        [JsonPropertyName("severidade")]
        public string Severidade { get; set; } = string.Empty;

        [JsonPropertyName("explicacao")]
        public string Explicacao { get; set; } = string.Empty;

        [JsonPropertyName("recomendacao")]
        public string Recomendacao { get; set; } = string.Empty;

        [JsonPropertyName("medicamentos")]
        public List<string> Medicamentos { get; set; } = new();
    }
}
