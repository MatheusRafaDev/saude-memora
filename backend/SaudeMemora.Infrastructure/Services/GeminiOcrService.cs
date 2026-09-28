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

    public async Task<DocumentoExtraidoDto> ExtractDocumentDataAsync(string imageUrl, string documentType)
    {
        // Fallback gracioso: Se o usuário não providenciou a API Key ainda,
        // geramos um mock para não travar a aplicação dele na demonstração
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey == "YOUR_GEMINI_API_KEY")
        {
            await Task.Delay(2000); // simula delay de rede
            return new DocumentoExtraidoDto
            {
                Titulo = $"Análise simulada de {documentType}",
                Medico = "Dr. IA Mock (Chave Gemini não configurada)",
                Clinica = "Clínica SaúdeMemora",
                Data = DateTime.Now.ToString("dd/MM/yyyy"),
                Resumo = "Isso é um dado de simulação. Para extrair os dados reais da imagem enviada, configure sua chave do Google Gemini no appsettings.json.",
                Diagnostico = "Processamento pendente de IA",
                TextoExtraido = "[TEXTO MOCKADO DA IMAGEM]",
                Medicamentos = new List<MedicamentoExtraidoDto>
                {
                    new MedicamentoExtraidoDto { Nome = "Configurar_Chave_Gemini", Dosagem = "1 vez ao dia" }
                }
            };
        }

        // Caso a chave exista, faz a chamada real pro Google Gemini
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={_apiKey}";

        // O prompt pede para atuar apenas como OCR (Reconhecimento Óptico de Caracteres)
        var prompt = $@"
        Você é uma ferramenta de OCR (Reconhecimento Óptico de Caracteres).
        Transcreva todo o texto contido na imagem organizando e indentando por seções claras (como PACIENTE, MÉDICO, EXAMES, RESULTADOS, DIAGNÓSTICO, DOSAGEM, MEDICAMENTOS).
        Use títulos em MAIÚSCULAS para seções, quebras de linha e recuos para manter a leitura limpa, organizada e estruturada.
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

    public async Task<DocumentoExtraidoDto> ExtractMultipleDocumentsDataAsync(List<string> imageUrls, string documentType)
    {
        if (imageUrls == null || imageUrls.Count == 0) 
            throw new ArgumentException("A lista de imagens está vazia.");
            
        // Fallback básico para a primeira imagem (se este serviço antigo for chamado)
        return await ExtractDocumentDataAsync(imageUrls.First(), documentType);
    }

    public Task<CarteirinhaExtraidaDto> ExtractCarteirinhaDataAsync(string imageUrl)
    {
        // Fallback mock
        return Task.FromResult(new CarteirinhaExtraidaDto());
    }

    private async Task<DocumentoExtraidoDto> ParseTextToStructuredDataAsync(string rawText, string documentType, string? apiKey, string? groqKey)
    {
        var prompt = $@"
        ATENÇÃO: VOCÊ É UM EXTRATOR DE DADOS DE TEXTO.
        Aqui está a transcrição bruta via OCR de um documento médico:
        
        {rawText}
        
        Sua tarefa é ler este texto e extrair os dados. Se não achar algo de forma óbvia, retorne string vazia.
        Retorne estritamente um JSON no seguinte formato:
        {{
            ""tipo"": ""Identifique a categoria exata do documento médico (ex: 'Exame de Sangue', 'Exame de Imagem', 'Receita Médica', 'Laudo Médico', 'Atestado Médico', 'Vacinação', 'Encaminhamento', 'Prontuário', ou 'Outro Documento')"",
            ""titulo"": ""O título descritivo do documento (ex: Hemograma Completo, Tomografia de Tórax, Receita de Amoxicilina)"",
            ""medico"": ""Nome do médico ou profissional de saúde (com Dr./Dra. se houver)"",
            ""clinica"": ""Nome da clínica, hospital ou laboratório"",
            ""data"": ""Data legível no formato dd/MM/yyyy"",
            ""resumo"": ""Resumo clínico claro em uma ou duas frases sobre os principais achados ou itens prescritos."",
            ""diagnostico"": ""O CID, diagnóstico ou conclusão principal expressa no documento"",
            ""medicamentos"": [
                {{ ""nome"": ""nome do medicamento/substância"", ""dosagem"": ""dosagem e posologia"" }}
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
            var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options) ?? new DocumentoExtraidoDto();
            dto.TextoExtraido = rawText; // Mantenha o texto bruto do OCR no DTO final
            return dto;
        }
        catch
        {
            // Fallback total se tudo der errado (ao menos preservamos o OCR bruto)
            return new DocumentoExtraidoDto
            {
                Titulo = $"Documento Digitalizado ({documentType})",
                Medico = "Não identificado",
                Clinica = "Não identificado",
                Data = DateTime.Now.ToString("dd/MM/yyyy"),
                Resumo = "Texto transcrito via OCR direto, mas falhou ao estruturar.",
                TextoExtraido = rawText,
                Medicamentos = new List<MedicamentoExtraidoDto>()
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

