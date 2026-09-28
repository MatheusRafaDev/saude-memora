using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SaudeMemora.Application.DTOs;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

public class DocumentProcessingService : IOcrAiService
{
    private readonly HttpClient _httpClient;
    private readonly string? _ocrSpaceApiKey;
    private readonly string? _groqApiKey;

    public DocumentProcessingService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _ocrSpaceApiKey = Environment.GetEnvironmentVariable("OCR_SPACE_API_KEY") ?? config["OcrSpace:ApiKey"];
        _groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") ?? config["Groq:ApiKey"];
    }

    public async Task<DocumentoExtraidoDto> ExtractDocumentDataAsync(string imageUrl, string documentType)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_groqApiKey))
        {
            throw new Exception("Faltam chaves de API (OCR_SPACE_API_KEY ou GROQ_API_KEY). Configure no .env.");
        }

        // 1. Chamar os dois motores do OCR.space em paralelo
        var engine1Task = CallOcrSpaceAsync(imageUrl, 1);
        var engine2Task = CallOcrSpaceAsync(imageUrl, 2);

        await Task.WhenAll(engine1Task, engine2Task);

        string textEngine1 = engine1Task.Result;
        string textEngine2 = engine2Task.Result;

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
        {
            throw new Exception("Nenhum texto encontrado pela OCR.space em nenhum dos motores.");
        }

        // 2. Unificar textos com a Groq
        string unifiedText = await UnifyTextsWithGroqAsync(textEngine1, textEngine2);

        // 3. Extrair dados estruturados
        return await ExtractStructuredDataAsync(unifiedText, documentType);
    }

    public async Task<DocumentoExtraidoDto> ExtractMultipleDocumentsDataAsync(List<string> imageUrls, string documentType)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_groqApiKey))
            throw new Exception("Faltam chaves de API (OCR_SPACE_API_KEY ou GROQ_API_KEY). Configure no .env.");

        var allTexts = new List<string>();

        foreach (var url in imageUrls)
        {
            var engine1Task = CallOcrSpaceAsync(url, 1);
            var engine2Task = CallOcrSpaceAsync(url, 2);
            await Task.WhenAll(engine1Task, engine2Task);
            
            string textEngine1 = engine1Task.Result;
            string textEngine2 = engine2Task.Result;
            
            if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
                continue;
                
            string unifiedText = await UnifyTextsWithGroqAsync(textEngine1, textEngine2);
            allTexts.Add(unifiedText);
        }

        if (allTexts.Count == 0)
            throw new Exception("Nenhum texto encontrado em nenhuma das imagens enviadas.");

        string finalUnifiedText = string.Join("\n\n--- PRÓXIMA PÁGINA/IMAGEM ---\n\n", allTexts);

        return await ExtractStructuredDataAsync(finalUnifiedText, documentType);
    }

    public async Task<CarteirinhaExtraidaDto> ExtractCarteirinhaDataAsync(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(_ocrSpaceApiKey) || string.IsNullOrWhiteSpace(_groqApiKey))
            return new CarteirinhaExtraidaDto();

        var engine1Task = CallOcrSpaceAsync(imageUrl, 1);
        var engine2Task = CallOcrSpaceAsync(imageUrl, 2);
        await Task.WhenAll(engine1Task, engine2Task);
        
        string textEngine1 = engine1Task.Result;
        string textEngine2 = engine2Task.Result;

        if (string.IsNullOrWhiteSpace(textEngine1) && string.IsNullOrWhiteSpace(textEngine2))
            return new CarteirinhaExtraidaDto();

        string unifiedText = await UnifyTextsWithGroqAsync(textEngine1, textEngine2);

        var jsonFormat = @"
        {
            ""planoSaude"": ""Nome do plano de saúde ou seguradora (ex: Bradesco Saúde, Amil, Unimed, SulAmérica, NotreDame, Cassi, etc.)"",
            ""numeroCarteirinha"": ""Número de identificação do segurado/carteirinha. Apenas números e letras, sem formatação extra.""
        }";

        var prompt = $@"
Você é um EXTRATOR DE DADOS DE CARTEIRINHAS DE PLANO DE SAÚDE.
Extraia as informações do texto OCR da carteirinha abaixo.
Se não achar algo de forma óbvia, retorne string vazia """".

Texto unificado:
{unifiedText}

Retorne ESTRITAMENTE um JSON no seguinte formato:
{jsonFormat}
";

        var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
        var payload = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            response_format = new { type = "json_object" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        request.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>();
            var jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
            
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            try
            {
                return JsonSerializer.Deserialize<CarteirinhaExtraidaDto>(jsonResult, options) ?? new CarteirinhaExtraidaDto();
            }
            catch { }
        }

        return new CarteirinhaExtraidaDto();
    }

    private async Task<string> CallOcrSpaceAsync(string imageUrl, int engine)
    {
        var encodedUrl = Uri.EscapeDataString(imageUrl);
        var url = $"https://api.ocr.space/parse/imageurl?apikey={_ocrSpaceApiKey}&url={encodedUrl}&ocrengine={engine}&language=por";
        
        try
        {
            var response = await _httpClient.GetAsync(url);
            var rawJson = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Erro OCR API HTTP {response.StatusCode}: {rawJson}");
                return "";
            }
            
            using var doc = JsonDocument.Parse(rawJson);
            var result = doc.RootElement;
            
            if (result.TryGetProperty("IsErroredOnProcessing", out var isErrored) && isErrored.GetBoolean())
            {
                var errMessage = result.TryGetProperty("ErrorMessage", out var msg) ? msg.ToString() : "Erro desconhecido";
                Console.WriteLine($"Erro do Motor OCR {engine}: {errMessage}");
                return "";
            }

            if (result.TryGetProperty("ParsedResults", out var parsedResults) && parsedResults.GetArrayLength() > 0)
            {
                var parsedText = parsedResults[0].GetProperty("ParsedText").GetString();
                return parsedText ?? "";
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro OCR Engine {engine}: {ex.Message}");
        }
        return "";
    }

    private async Task<string> UnifyTextsWithGroqAsync(string text1, string text2)
    {
        var prompt = $@"
Você é um assistente médico de transcrição altamente preciso.
Abaixo estão duas leituras de OCR da MESMA imagem. O Motor 1 foca em texto corrido, e o Motor 2 em tabelas.
Sua tarefa: Unificar as duas extrações no texto final mais correto, corrigindo possíveis erros de digitação (ortografia) causados pelo OCR, mas SEMPRE mantendo as dosagens e números intocados.
NÃO INCLUA NENHUM RACIOCÍNIO. NÃO INCLUA INTRODUÇÕES, CONCLUSÕES OU EXPLICAÇÕES. RETORNE APENAS O TEXTO UNIFICADO E CORRIGIDO DIRETAMENTE.
[Motor 1]:
{text1}

[Motor 2]:
{text2}
";
        var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
        var payload = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        request.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>();
            return groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
        }
        
        // Em caso de falha, retorna o que tiver mais conteúdo
        return text1.Length > text2.Length ? text1 : text2;
    }

    private async Task<DocumentoExtraidoDto> ExtractStructuredDataAsync(string unifiedText, string documentType)
    {
        string jsonFormat = "";
        if (documentType.ToLower() == "receita")
        {
            jsonFormat = @"
            {
                ""titulo"": ""Título ou nome principal do documento (ex: Receita da Dra. Amanda)"",
                ""medico"": ""Nome literal do médico"",
                ""crm"": ""Número do CRM se houver"",
                ""data"": ""Data legível no formato dd/MM/yyyy"",
                ""observacoes"": ""Quaisquer observações do médico"",
                ""resumo"": ""Uma frase curta resumindo a receita"",
                ""medicamentos"": [
                    { ""nome"": ""nome do remédio"", ""dosagem"": ""dosagem"", ""horario"": ""forma de uso/horário"" }
                ]
            }";
        }
        else if (documentType.ToLower() == "exame")
        {
            jsonFormat = @"
            {
                ""titulo"": ""Título ou nome principal do documento (ex: Hemograma Completo)"",
                ""nomeExame"": ""Nome do exame principal"",
                ""tipoExame"": ""Categoria do exame (sangue, imagem, etc)"",
                ""clinica"": ""Laboratório ou clínica"",
                ""data"": ""Data legível no formato dd/MM/yyyy"",
                ""resultado"": ""Valores de resultado ou laudo principal"",
                ""observacoes"": ""Observações ou valores de referência"",
                ""resumo"": ""Resumo do resultado do exame""
            }";
        }
        else // clinico
        {
            jsonFormat = @"
            {
                ""titulo"": ""Título ou nome principal do documento (ex: Atestado Médico)"",
                ""medico"": ""Nome literal do médico"",
                ""especialidade"": ""Especialidade médica"",
                ""tipoClinico"": ""Tipo de documento (laudo, atestado, etc)"",
                ""data"": ""Data legível no formato dd/MM/yyyy"",
                ""conteudo"": ""Conteúdo principal do texto"",
                ""conclusoes"": ""Conclusões médicas"",
                ""resumo"": ""Resumo do documento clínico""
            }";
        }

        var prompt = $@"
ATENÇÃO: VOCÊ É UM EXTRATOR DE DADOS DE TEXTO ESTRUTURADOS.
Extraia as informações do texto unificado abaixo, categorizado como '{documentType}'.
Se não achar algo de forma óbvia, retorne string vazia """".

Texto unificado:
{unifiedText}

Retorne ESTRITAMENTE um JSON no seguinte formato:
{jsonFormat}
";

        var groqUrl = "https://api.groq.com/openai/v1/chat/completions";
        var payload = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.0,
            response_format = new { type = "json_object" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, groqUrl);
        request.Headers.Add("Authorization", $"Bearer {_groqApiKey}");
        request.Content = JsonContent.Create(payload);

        var response = await _httpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            var groqJson = await response.Content.ReadFromJsonAsync<JsonElement>();
            var jsonResult = groqJson.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
            
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            try
            {
                var dto = JsonSerializer.Deserialize<DocumentoExtraidoDto>(jsonResult, options) ?? new DocumentoExtraidoDto();
                dto.TextoExtraido = unifiedText;
                return dto;
            }
            catch
            {
                return new DocumentoExtraidoDto { TextoExtraido = unifiedText, Resumo = "Erro ao deserializar JSON da IA." };
            }
        }

        return new DocumentoExtraidoDto { TextoExtraido = unifiedText, Resumo = "Falha ao extrair dados estruturados." };
    }
}
