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
    private static final String MODEL    = "llama3-8b-8192";

    @Value("${groq.api.key}")
    private String apiKey;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient   http   = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    /** Envia uma conversa e retorna o texto da resposta. */
    public String chat(String systemPrompt, String userPrompt) throws Exception {
        return chat(systemPrompt, userPrompt, 0.0, 1500);
    }

    public String chat(String systemPrompt, String userPrompt,
                       double temperature, int maxTokens) throws Exception {

        ObjectNode body = mapper.createObjectNode();
        body.put("model", MODEL);
        body.put("temperature", temperature);
        body.put("max_tokens", maxTokens);

        ArrayNode messages = body.putArray("messages");

        ObjectNode sys = messages.addObject();
        sys.put("role", "system");
        sys.put("content", systemPrompt);

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
        return root.at("/choices/0/message/content").asText();
    }
}
