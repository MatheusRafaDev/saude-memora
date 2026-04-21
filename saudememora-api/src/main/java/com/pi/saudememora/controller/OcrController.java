package com.pi.saudememora.controller;

import com.pi.saudememora.service.OcrSpaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Controller de OCR — recebe imagens do frontend, processa no backend
 * usando OCR.space (engine 1 e engine 2) e devolve os textos extraídos.
 *
 * O frontend nunca precisa ter a chave da API OCR.space.
 *
 * POST /api/ocr/processar
 *   multipart/form-data:
 *     - imagem: arquivo de imagem já pré-processado pelo frontend (PNG recomendado)
 *
 *   Resposta JSON:
 *     {
 *       "texto1": "...",   // resultado engine 1 (Tesseract via OCR.space)
 *       "texto2": "..."    // resultado engine 2 (OCR.space v2)
 *     }
 */
@RestController
@RequestMapping("/api/ocr")
@CrossOrigin(origins = "*")
public class OcrController {

    private static final Logger log = LoggerFactory.getLogger(OcrController.class);

    private final OcrSpaceService ocrSpaceService;

    public OcrController(OcrSpaceService ocrSpaceService) {
        this.ocrSpaceService = ocrSpaceService;
    }

    /**
     * Processa uma imagem com dois motores OCR em paralelo.
     *
     * @param imagem arquivo enviado pelo frontend (imagem pré-processada)
     * @return JSON com texto1 (engine 1) e texto2 (engine 2)
     */
    @PostMapping("/processar")
    public ResponseEntity<?> processarOCR(@RequestParam("imagem") MultipartFile imagem) {
        if (imagem == null || imagem.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Nenhuma imagem recebida. Envie o campo 'imagem'."));
        }

        try {
            log.info("Iniciando OCR para arquivo: {} ({} bytes)",
                    imagem.getOriginalFilename(), imagem.getSize());

            // Engine 1: Tesseract via OCR.space (melhor para texto corrido)
            String texto1 = "";
            try {
                texto1 = ocrSpaceService.processar(imagem, 1, false);
            } catch (Exception e) {
                log.warn("Engine 1 falhou: {}", e.getMessage());
            }

            // Engine 2: OCR.space v2 (melhor para tabelas e formulários médicos)
            String texto2 = "";
            try {
                texto2 = ocrSpaceService.processar(imagem, 2, true);
            } catch (Exception e) {
                log.warn("Engine 2 falhou: {}", e.getMessage());
            }

            if (texto1.isBlank() && texto2.isBlank()) {
                return ResponseEntity.unprocessableEntity()
                        .body(Map.of("error", "Não foi possível extrair texto da imagem."));
            }

            log.info("OCR concluído. Engine1: {} chars, Engine2: {} chars",
                    texto1.length(), texto2.length());

            return ResponseEntity.ok(Map.of(
                    "texto1", texto1,
                    "texto2", texto2
            ));

        } catch (Exception e) {
            log.error("Erro inesperado no OCR", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erro interno ao processar OCR: " + e.getMessage()));
        }
    }
}