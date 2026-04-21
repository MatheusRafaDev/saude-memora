package com.pi.saudememora.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL    = "llama-3.3-70b-versatile";

    // Limites de caracteres por tipo de campo (valores conservadores)
    public static final class Limits {
        // DocumentoClinico
        public static final int OBSERVACOES_DOC_CLINICO = 1900; // VARCHAR(2000) com margem
        public static final int CONCLUSAO_DOC_CLINICO = 1900;   // VARCHAR(2000) com margem
        public static final int CONTEUDO_DOC_CLINICO = 4800;    // VARCHAR(5000) com margem
        public static final int RESUMO_DOC_CLINICO = 500;       // TEXT, mas manter razoável

        // Receita
        public static final int OBSERVACOES_RECEITA = 4500;     // VARCHAR(5000) com margem
        public static final int RESUMO_RECEITA = 1900;          // VARCHAR(2000) com margem
        public static final int MEDICO_NOME = 100;              // VARCHAR padrão
        public static final int CRM_MEDICO = 20;                // VARCHAR padrão

        // Medicamento
        public static final int MEDICAMENTO_NOME = 150;         // VARCHAR padrão
        public static final int MEDICAMENTO_QUANTIDADE = 50;    // VARCHAR padrão
        public static final int MEDICAMENTO_FORMA_USO = 100;    // VARCHAR padrão

        // Exame
        public static final int EXAME_TIPO = 100;
        public static final int EXAME_LABORATORIO = 200;
        public static final int EXAME_RESULTADO = 1000;
        public static final int EXAME_NOME = 150;

        // Geral
        public static final int MAX_TOKENS_PADRAO = 1500;
        public static final int MAX_TOKENS_CURTO = 800;
        public static final int MAX_TOKENS_LONGO = 2500;
    }

    @Value("${groq.api.key}")
    private String apiKey;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient   http   = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    /**
     * Envia uma conversa com validação de tamanho do conteúdo gerado
     */
    public String chat(String systemPrompt, String userPrompt,
                       ContentType contentType) throws Exception {
        return chatWithSizeLimit(systemPrompt, userPrompt, 0.0,
                contentType.maxTokens, contentType);
    }

    public String chat(String systemPrompt, String userPrompt) throws Exception {
        return chat(systemPrompt, userPrompt, 0.0, Limits.MAX_TOKENS_PADRAO);
    }

    public String chat(String systemPrompt, String userPrompt,
                       double temperature, int maxTokens) throws Exception {
        return chatWithSizeLimit(systemPrompt, userPrompt, temperature,
                maxTokens, ContentType.GERAL);
    }

    /**
     * Método principal com validação de tamanho
     */
    public String chatWithSizeLimit(String systemPrompt, String userPrompt,
                                    double temperature, int maxTokens,
                                    ContentType contentType) throws Exception {

        // Adiciona instruções de limite no system prompt
        String enhancedSystemPrompt = addSizeLimitsToPrompt(systemPrompt, contentType);

        ObjectNode body = mapper.createObjectNode();
        body.put("model", MODEL);
        body.put("temperature", temperature);
        body.put("max_tokens", maxTokens);

        ArrayNode messages = body.putArray("messages");

        ObjectNode sys = messages.addObject();
        sys.put("role", "system");
        sys.put("content", enhancedSystemPrompt);

        ObjectNode usr = messages.addObject();
        usr.put("role", "user");
        usr.put("content", userPrompt);

        String requestBody = mapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Groq API error {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Erro na API Groq: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        String result = root.at("/choices/0/message/content").asText();

        // Valida e trunca o resultado se necessário
        return validateAndTruncate(result, contentType);
    }

    /**
     * Adiciona limites de tamanho ao prompt do sistema
     */
    private String addSizeLimitsToPrompt(String originalPrompt, ContentType contentType) {
        StringBuilder limits = new StringBuilder();
        limits.append("\n\nIMPORTANTE - LIMITES DE TAMANHO:\n");

        switch (contentType) {
            case RECEITA:
                limits.append("- O campo 'observacoes' deve ter no MÁXIMO ").append(Limits.OBSERVACOES_RECEITA).append(" caracteres\n");
                limits.append("- O campo 'resumo' deve ter no MÁXIMO ").append(Limits.RESUMO_RECEITA).append(" caracteres\n");
                limits.append("- O campo 'medico' deve ter no MÁXIMO ").append(Limits.MEDICO_NOME).append(" caracteres\n");
                limits.append("- O campo 'crm' deve ter no MÁXIMO ").append(Limits.CRM_MEDICO).append(" caracteres\n");
                limits.append("- Cada medicamento: nome max ").append(Limits.MEDICAMENTO_NOME).append(", quantidade max ").append(Limits.MEDICAMENTO_QUANTIDADE).append(", formaDeUso max ").append(Limits.MEDICAMENTO_FORMA_USO).append("\n");
                break;

            case DOCUMENTO_CLINICO:
                limits.append("- O campo 'observacoes' deve ter no MÁXIMO ").append(Limits.OBSERVACOES_DOC_CLINICO).append(" caracteres\n");
                limits.append("- O campo 'conclusoes' deve ter no MÁXIMO ").append(Limits.CONCLUSAO_DOC_CLINICO).append(" caracteres\n");
                limits.append("- O campo 'conteudo' deve ter no MÁXIMO ").append(Limits.CONTEUDO_DOC_CLINICO).append(" caracteres\n");
                limits.append("- O campo 'resumo' deve ter no MÁXIMO ").append(Limits.RESUMO_DOC_CLINICO).append(" caracteres\n");
                break;

            case EXAME:
                limits.append("- O campo 'observacoes' deve ter no MÁXIMO ").append(Limits.OBSERVACOES_RECEITA).append(" caracteres\n");
                limits.append("- O campo 'resultado' deve ter no MÁXIMO ").append(Limits.EXAME_RESULTADO).append(" caracteres\n");
                limits.append("- O campo 'tipo' deve ter no MÁXIMO ").append(Limits.EXAME_TIPO).append(" caracteres\n");
                limits.append("- O campo 'laboratorio' deve ter no MÁXIMO ").append(Limits.EXAME_LABORATORIO).append(" caracteres\n");
                limits.append("- O campo 'nomeExame' deve ter no MÁXIMO ").append(Limits.EXAME_NOME).append(" caracteres\n");
                break;

            case MEDICAMENTOS:
                limits.append("- Retorne apenas a lista de medicamentos\n");
                limits.append("- Cada nome de medicamento: max ").append(Limits.MEDICAMENTO_NOME).append(" caracteres\n");
                limits.append("- Cada quantidade: max ").append(Limits.MEDICAMENTO_QUANTIDADE).append(" caracteres\n");
                limits.append("- Cada formaDeUso: max ").append(Limits.MEDICAMENTO_FORMA_USO).append(" caracteres\n");
                limits.append("- Máximo de 10 medicamentos por receita\n");
                break;

            case GERAL:
            default:
                limits.append("- Resposta deve ter no MÁXIMO ").append(Limits.MAX_TOKENS_PADRAO).append(" caracteres\n");
                break;
        }

        limits.append("\nSe algum conteúdo exceder o limite, corte no limite e adicione '...' no final.\n");

        return originalPrompt + limits.toString();
    }

    /**
     * Valida e trunca o resultado conforme o tipo de conteúdo
     */
    private String validateAndTruncate(String result, ContentType contentType) {
        if (result == null) return "";

        int maxLength = getMaxLengthForContentType(contentType);
        if (result.length() > maxLength) {
            log.warn("Conteúdo truncado de {} para {} caracteres (tipo: {})",
                    result.length(), maxLength, contentType);
            return result.substring(0, maxLength - 3) + "...";
        }

        return result;
    }

    /**
     * Retorna o tamanho máximo para o tipo de conteúdo
     */
    private int getMaxLengthForContentType(ContentType contentType) {
        switch (contentType) {
            case RECEITA:
                return Limits.OBSERVACOES_RECEITA;
            case DOCUMENTO_CLINICO:
                return Limits.CONTEUDO_DOC_CLINICO;
            case EXAME:
                return Limits.OBSERVACOES_RECEITA;
            case MEDICAMENTOS:
                return Limits.MAX_TOKENS_CURTO;
            default:
                return Limits.MAX_TOKENS_PADRAO;
        }
    }

    /**
     * Método específico para receitas (com validação JSON)
     */
    public JsonNode chatForReceita(String systemPrompt, String userPrompt) throws Exception {
        String enhancedPrompt = addSizeLimitsToPrompt(systemPrompt, ContentType.RECEITA);
        String result = chat(enhancedPrompt, userPrompt, 0.0, Limits.MAX_TOKENS_LONGO);

        // Limpa markdown
        result = result.replaceAll("(?i)```json\\s*", "")
                .replaceAll("```", "")
                .trim();

        // Valida tamanho dos campos no JSON
        try {
            JsonNode json = mapper.readTree(result);
            if (json.has("observacoes")) {
                String obs = json.get("observacoes").asText();
                if (obs.length() > Limits.OBSERVACOES_RECEITA) {
                    ((ObjectNode) json).put("observacoes",
                            obs.substring(0, Limits.OBSERVACOES_RECEITA - 3) + "...");
                }
            }
            if (json.has("resumo")) {
                String res = json.get("resumo").asText();
                if (res.length() > Limits.RESUMO_RECEITA) {
                    ((ObjectNode) json).put("resumo",
                            res.substring(0, Limits.RESUMO_RECEITA - 3) + "...");
                }
            }
            return json;
        } catch (Exception e) {
            log.error("Erro ao parsear JSON da receita", e);
            throw new RuntimeException("Resposta da IA não é um JSON válido");
        }
    }

    // Enum para tipos de conteúdo
    public enum ContentType {
        GERAL(Limits.MAX_TOKENS_PADRAO),
        RECEITA(Limits.MAX_TOKENS_LONGO),
        DOCUMENTO_CLINICO(Limits.MAX_TOKENS_LONGO),
        EXAME(Limits.MAX_TOKENS_LONGO),
        MEDICAMENTOS(Limits.MAX_TOKENS_CURTO),
        FORMULARIO_MEDICO(Limits.MAX_TOKENS_PADRAO);

        public final int maxTokens;

        ContentType(int maxTokens) {
            this.maxTokens = maxTokens;
        }
    }
}