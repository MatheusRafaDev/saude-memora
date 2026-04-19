package com.pi.saudememora.controller;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pi.saudememora.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints de IA — todo o processamento Groq é feito aqui no backend.
 * O frontend nunca precisa ter a chave da API.
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    // ─── OCR + Formatação ────────────────────────────────────────────────────────

    /**
     * POST /api/ai/formatar-ocr
     * Body: { "texto1": "...", "texto2": "..." }
     * Unifica e corrige dois textos OCR.
     */
    @PostMapping("/formatar-ocr")
    public ResponseEntity<?> formatarTextoOCR(@RequestBody Map<String, String> body) {
        try {
            String t1 = body.getOrDefault("texto1", "");
            String t2 = body.getOrDefault("texto2", "");
            String resultado = aiService.formatarTextoOCR(t1, t2);
            return ResponseEntity.ok(Map.of("resultado", resultado));
        } catch (Exception e) {
            log.error("Erro em formatarTextoOCR", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Ficha Médica ────────────────────────────────────────────────────────────

    /**
     * POST /api/ai/ficha-medica/ocr
     * Body: { "texto": "..." }
     * Pipeline completo: texto OCR → JSON com campos da FichaMedica.
     */
    @PostMapping("/ficha-medica/ocr")
    public ResponseEntity<?> processarFichaMedicaOCR(@RequestBody Map<String, String> body) {
        try {
            String texto = body.get("texto");
            if (texto == null || texto.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Campo 'texto' obrigatório"));

            ObjectNode resultado = aiService.processarFichaMedicaOCR(texto);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro em processarFichaMedicaOCR", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Receita ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/ai/receita/ocr
     * Body: { "texto": "..." }
     * Extrai dados de receita a partir do OCR.
     */
    @PostMapping("/receita/ocr")
    public ResponseEntity<?> processarReceitaOCR(@RequestBody Map<String, String> body) {
        try {
            String texto = body.get("texto");
            if (texto == null || texto.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Campo 'texto' obrigatório"));

            ObjectNode resultado = aiService.tratarOCRParaReceitas(texto);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro em processarReceitaOCR", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Exame ───────────────────────────────────────────────────────────────────

    /**
     * POST /api/ai/exame/ocr
     * Body: { "texto": "..." }
     * Extrai dados de exame a partir do OCR.
     */
    @PostMapping("/exame/ocr")
    public ResponseEntity<?> processarExameOCR(@RequestBody Map<String, String> body) {
        try {
            String texto = body.get("texto");
            if (texto == null || texto.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Campo 'texto' obrigatório"));

            ObjectNode resultado = aiService.tratarOCRParaExames(texto);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro em processarExameOCR", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Documento Clínico ───────────────────────────────────────────────────────

    /**
     * POST /api/ai/documento-clinico/ocr
     * Body: { "texto": "..." }
     * Extrai dados de documento clínico a partir do OCR.
     */
    @PostMapping("/documento-clinico/ocr")
    public ResponseEntity<?> processarDocumentoClinicoOCR(@RequestBody Map<String, String> body) {
        try {
            String texto = body.get("texto");
            if (texto == null || texto.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Campo 'texto' obrigatório"));

            ObjectNode resultado = aiService.tratarOCRParaDocumentoClinico(texto);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro em processarDocumentoClinicoOCR", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Medicamentos ────────────────────────────────────────────────────────────

    /**
     * POST /api/ai/medicamentos/ocr
     * Body: { "texto": "..." }
     * Extrai lista de medicamentos a partir do OCR.
     */
    @PostMapping("/medicamentos/ocr")
    public ResponseEntity<?> extrairMedicamentosOCR(@RequestBody Map<String, String> body) {
        try {
            String texto = body.get("texto");
            if (texto == null || texto.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Campo 'texto' obrigatório"));

            ArrayNode medicamentos = aiService.extrairMedicamentosDoOCR(texto);
            return ResponseEntity.ok(medicamentos);
        } catch (Exception e) {
            log.error("Erro em extrairMedicamentosOCR", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
