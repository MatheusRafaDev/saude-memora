using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SaudeMemora.Application.DTOs;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

public class GeminiOcrService : IOcrAiService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public GeminiOcrService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? config["GeminiSettings:ApiKey"];
    }

    public async Task<ExtractedDocumentDto> ExtractDocumentDataAsync(string imageUrl, string documentType)
    {
        // Fallback gracioso: Se o usuário não providenciou a API Key ainda,
        // geramos um mock para não travar a aplicação dele na demonstração
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey == "YOUR_GEMINI_API_KEY")
        {
            await Task.Delay(2000); // simula delay de rede
            return new ExtractedDocumentDto
            {
                Title = $"Análise simulada de {documentType}",
                Doctor = "Dr. IA Mock (Chave Gemini não configurada)",
                Clinic = "Clínica SaúdeMemora",
                Date = DateTime.Now.ToString("dd/MM/yyyy"),
                Summary = "Isso é um dado de simulação. Para extrair os dados reais da imagem enviada, configure sua chave do Google Gemini no appsettings.json.",
                Diagnosis = "Processamento pendente de IA",
                ExtractedText = "[TEXTO MOCKADO DA IMAGEM]",
                Medicines = new List<ExtractedMedicineDto>
                {
                    new ExtractedMedicineDto { Name = "Configurar_Chave_Gemini", Dosage = "1 vez ao dia" }
                }
            };
        }

        // Caso a chave exista, faz a chamada real pro Google Gemini
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={_apiKey}";

        // O prompt pede para atuar apenas como OCR (Reconhecimento Óptico de Caracteres)
        var prompt = $@"
        Você é uma ferramenta de OCR (Reconhecimento Óptico de Caracteres).
        Apenas transcreva literalmente TODO o texto contido na imagem, de cima para baixo.
        Não adicione introduções, não tente organizar em JSON, não estruture os dados.
        Retorne única e exclusivamente o texto cru que você enxerga na imagem.
        URL DA IMAGEM: {imageUrl}
        ";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.0, // temperatura 0 para extração mecânica
                responseMimeType = "text/plain"
            }
        };

        string textContent = "";

        try 
        {
            var response = await _httpClient.PostAsJsonAsync(url, payload);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Erro na API Gemini: {error}");
            }

            var jsonResult = await response.Content.ReadFromJsonAsync<JsonElement>();
            textContent = jsonResult.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
            
            if (string.IsNullOrWhiteSpace(textContent))
                throw new Exception("OCR retornou resultado vazio.");
        }
        catch (Exception ex)
        {
            var groqKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
            if (!string.IsNullOrEmpty(groqKey))
            {
                Console.WriteLine($"[Gemini Falhou] Tentando Fallback para o Groq... Motivo: {ex.Message}");
                textContent = await CallGroqFallbackAsync(imageUrl, prompt, groqKey);
            }
            else
            {
                throw;
            }
        }

        // Passo 2: IA Estruturadora (Lê o texto do OCR e formata em JSON)
        var groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
        return await ParseTextToStructuredDataAsync(textContent, documentType, _apiKey, groqApiKey);
    }

    private async Task<ExtractedDocumentDto> ParseTextToStructuredDataAsync(string rawText, string documentType, string? apiKey, string? groqKey)
    {
        var prompt = $@"
        ATENÇÃO: VOCÊ É UM EXTRATOR DE DADOS DE TEXTO.
        Aqui está a transcrição bruta via OCR de um documento médico:
        
        {rawText}
        
        Sua tarefa é ler este texto e extrair os dados. Se não achar algo de forma óbvia, retorne string vazia.
        Retorne estritamente um JSON no seguinte formato:
        {{
            ""type"": ""O tipo de documento detectado: 'exame', 'receita', ou 'laudo'"",
            ""title"": ""O título que aparece no texto (ex: Receita Médica)"",
            ""doctor"": ""Nome literal do médico"",
            ""clinic"": ""Nome literal da clínica/hospital"",
            ""date"": ""Data legível no formato dd/MM/yyyy"",
            ""summary"": ""Uma única frase resumindo o que é."",
            ""diagnosis"": ""O CID ou diagnóstico, se houver explícito"",
            ""medicines"": [
                {{ ""name"": ""nome do remédio"", ""dosage"": ""dosagem escrita"" }}
            ]
        }}
        ";

        string jsonResult = "";

        // Tenta pelo Groq primeiro (modelo de texto ultra-rápido Llama 3)
        if (!string.IsNullOrEmpty(groqKey))
        {
            try
            {
                var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
                var payload = new
                {
                    model = "groq/compound",
                    messages = new[] { new { role = "user", content = prompt } },
                    temperature = 0.0,
                    response_format = new { type = "json_object" }
                };
                
                var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
                request.Headers.Add("Authorization", $"Bearer {groqKey}");
                request.Content = JsonContent.Create(payload);
                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>();
                    jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
                }
            }
            catch { /* Ignora e tenta o Gemini */ }
        }
        
        // Se o Groq falhar ou não existir chave, usa o Gemini Text
        if (string.IsNullOrEmpty(jsonResult) && !string.IsNullOrEmpty(apiKey))
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={apiKey}";
                var payload = new
                {
                    contents = new[] { new { parts = new[] { new { text = prompt } } } },
                    generationConfig = new { temperature = 0.0, responseMimeType = "application/json" }
                };
                var response = await _httpClient.PostAsJsonAsync(url, payload);
                if (response.IsSuccessStatusCode)
                {
                    var geminiJson = await response.Content.ReadFromJsonAsync<JsonElement>();
                    jsonResult = geminiJson.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "";
                }
            }
            catch { /* Cai pro fallback final */ }
        }

        try 
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var dto = JsonSerializer.Deserialize<ExtractedDocumentDto>(jsonResult, options) ?? new ExtractedDocumentDto();
            dto.ExtractedText = rawText; // Mantenha o texto bruto do OCR no DTO final
            return dto;
        }
        catch
        {
            // Fallback total se tudo der errado (ao menos preservamos o OCR bruto)
            return new ExtractedDocumentDto
            {
                Title = $"Documento Digitalizado ({documentType})",
                Doctor = "Não identificado",
                Clinic = "Não identificado",
                Date = DateTime.Now.ToString("dd/MM/yyyy"),
                Summary = "Texto transcrito via OCR direto, mas falhou ao estruturar.",
                ExtractedText = rawText,
                Medicines = new List<ExtractedMedicineDto>()
            };
        }
    }

    private async Task<string> CallGroqFallbackAsync(string imageUrl, string prompt, string apiKey)
    {
        var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
        
        var payload = new
        {
            model = "qwen/qwen3.8-27b",
            messages = new[]
            {
                new 
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text", text = prompt },
                        new { type = "image_url", image_url = new { url = imageUrl } }
                    }
                }
            },
            temperature = 0.0
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new Exception($"Groq Fallback também falhou: {err}");
        }

        var jsonResult = await response.Content.ReadFromJsonAsync<JsonElement>();
        var content = jsonResult.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        
        return content ?? "";
    }
}
