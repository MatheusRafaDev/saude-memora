package com.pi.saudememora.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

/**
 * Serviço responsável por realizar chamadas à API OCR.space.
 * A chave de API fica exclusivamente no backend — o frontend não precisa dela.
 */
@Service
public class OcrSpaceService {

    private static final Logger log = LoggerFactory.getLogger(OcrSpaceService.class);

    private static final String OCR_SPACE_URL = "https://api.ocr.space/parse/image";

    @Value("${ocr.space.api.key}")
    private String apiKey;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    /**
     * Envia uma imagem para o OCR.space e retorna o texto extraído.
     *
     * @param file      arquivo de imagem enviado pelo frontend (já pré-processado)
     * @param ocrEngine motor OCR: 1 = legado, 2 = OCR.space v2 (padrão para documentos médicos)
     * @param isTable   true para preservar tabulação de tabelas
     * @return texto extraído pela API
     */
    public String processar(MultipartFile file, int ocrEngine, boolean isTable) throws IOException, InterruptedException {
        String boundary = "----Boundary" + UUID.randomUUID().toString().replace("-", "");

        byte[] fileBytes = file.getBytes();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "imagem.png";

        // Monta o corpo multipart manualmente (HttpClient padrão do Java não tem helper nativo)
        StringBuilder sb = new StringBuilder();

        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Disposition: form-data; name=\"apikey\"\r\n\r\n");
        sb.append(apiKey).append("\r\n");

        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Disposition: form-data; name=\"language\"\r\n\r\n");
        sb.append("por\r\n");

        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Disposition: form-data; name=\"OCREngine\"\r\n\r\n");
        sb.append(ocrEngine).append("\r\n");

        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Disposition: form-data; name=\"isTable\"\r\n\r\n");
        sb.append(isTable ? "true" : "false").append("\r\n");

        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Disposition: form-data; name=\"detectOrientation\"\r\n\r\n");
        sb.append("true\r\n");

        // Cabeçalho da parte do arquivo
        String fileHeader = "--" + boundary + "\r\n" +
                "Content-Disposition: form-data; name=\"file\"; filename=\"" + originalFilename + "\"\r\n" +
                "Content-Type: image/png\r\n\r\n";

        String closing = "\r\n--" + boundary + "--\r\n";

        // Combina tudo em bytes
        byte[] headerBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] fileHeaderBytes = fileHeader.getBytes(StandardCharsets.UTF_8);
        byte[] closingBytes = closing.getBytes(StandardCharsets.UTF_8);

        byte[] body = new byte[headerBytes.length + fileHeaderBytes.length + fileBytes.length + closingBytes.length];
        int offset = 0;
        System.arraycopy(headerBytes, 0, body, offset, headerBytes.length); offset += headerBytes.length;
        System.arraycopy(fileHeaderBytes, 0, body, offset, fileHeaderBytes.length); offset += fileHeaderBytes.length;
        System.arraycopy(fileBytes, 0, body, offset, fileBytes.length); offset += fileBytes.length;
        System.arraycopy(closingBytes, 0, body, offset, closingBytes.length);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OCR_SPACE_URL))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("OCR Space retornou status {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Erro na API OCR.space: HTTP " + response.statusCode());
        }

        return extrairTexto(response.body());
    }

    /**
     * Extrai o texto do JSON retornado pela API OCR.space.
     */
    private String extrairTexto(String json) {
        // Parsing manual simples para evitar dependência de ObjectMapper aqui
        // O campo é: "ParsedText":"<texto>"
        int idx = json.indexOf("\"ParsedText\"");
        if (idx < 0) return "";

        int start = json.indexOf("\"", idx + 13) + 1;
        int end = json.indexOf("\"", start);
        if (start <= 0 || end <= 0) return "";

        return json.substring(start, end)
                .replace("\\r\\n", "\n")
                .replace("\\n", "\n")
                .replace("\\r", "\n")
                .replace("\\\"", "\"")
                .trim();
    }
}