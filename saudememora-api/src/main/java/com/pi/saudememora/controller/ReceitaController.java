package com.pi.saudememora.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pi.saudememora.model.Medicamento;
import com.pi.saudememora.model.Receita;
import com.pi.saudememora.repository.MedicamentoRepository;
import com.pi.saudememora.repository.ReceitaRepository;
import com.pi.saudememora.service.ReceitaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/receitas")
@CrossOrigin(origins = "*")
public class ReceitaController {

    private static final Logger logger = LoggerFactory.getLogger(ReceitaController.class);

    private final ReceitaService receitaService;
    private final ObjectMapper objectMapper;

    @Autowired
    private ReceitaRepository receitaRepository;
    private MedicamentoRepository medicamentoRepository;

    public ReceitaController(ReceitaService receitaService,
                             ObjectMapper objectMapper,
                             MedicamentoRepository medicamentoRepository,
                             ReceitaRepository receitaRepository) {
        this.receitaService = receitaService;
        this.objectMapper = objectMapper;
        this.medicamentoRepository = medicamentoRepository;
        this.receitaRepository = receitaRepository;
    }

    // ✅ CORRIGIDO: endpoint GET /api/receitas estava faltando — causava 405
    // Aceita ?pacienteId=X para filtrar por usuário
    @GetMapping
    public ResponseEntity<List<Receita>> getAllReceitas(
            @RequestParam(required = false) Long pacienteId) {
        List<Receita> receitas;
        if (pacienteId != null) {
            receitas = receitaRepository.findByPacienteId(pacienteId);
        } else {
            receitas = receitaRepository.findAll();
        }
        if (receitas.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(receitas);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createReceitaComImagem(
            @RequestParam("receitaData") String receitaData,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem) {
        try {
            Receita receita = objectMapper.readValue(receitaData, Receita.class);
            logger.info("Recebido receita JSON: {}", receitaData);

            if (receita.getMedicamentos() != null) {
                for (Medicamento med : receita.getMedicamentos()) {
                    med.setReceita(receita);
                }
            }

            if (imagem != null && !imagem.isEmpty()) {
                String contentType = imagem.getContentType();
                if (contentType == null ||
                        !(contentType.equals(MediaType.IMAGE_JPEG_VALUE) || contentType.equals(MediaType.IMAGE_PNG_VALUE))) {
                    return ResponseEntity.badRequest().body("O arquivo de imagem deve ser JPEG ou PNG.");
                }

                String nomeArquivo = System.currentTimeMillis() + "_" + imagem.getOriginalFilename();
                Path caminhoArquivo = Paths.get("uploads/receitas", nomeArquivo);
                Files.createDirectories(caminhoArquivo.getParent());
                Files.write(caminhoArquivo, imagem.getBytes());
                receita.setImagem(caminhoArquivo.toString());
            }

            Receita novaReceita = receitaService.createReceita(receita);
            return ResponseEntity.status(HttpStatus.CREATED).body(novaReceita);

        } catch (JsonProcessingException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("JSON inválido em 'receitaData': " + e.getOriginalMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao salvar imagem: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao criar receita: " + e.getMessage());
        }
    }

    @GetMapping("/imagem/{id}")
    public ResponseEntity<byte[]> getImagemPorId(@PathVariable Long id) {
        try {
            Optional<Receita> receitaOpt = receitaRepository.findById(id);

            if (receitaOpt.isEmpty() || receitaOpt.get().getImagem() == null) {
                return ResponseEntity.notFound().build();
            }

            Receita receita = receitaOpt.get();
            Path caminho = Paths.get(receita.getImagem());

            if (!Files.exists(caminho)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imagemBytes = Files.readAllBytes(caminho);
            String contentType = Files.probeContentType(caminho);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(imagemBytes);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/documento/{id}")
    public List<Receita> listarPorDocumento(@PathVariable Long id) {
        return receitaRepository.findByDocumentoId(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Receita> atualizarReceita(@PathVariable Long id, @RequestBody Receita receita) {
        try {
            return ResponseEntity.ok(receitaService.atualizarReceitaComMedicamentos(receita));
        } catch (Exception e) {
            logger.error("Erro ao atualizar receita", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReceitaById(@PathVariable Long id) {
        try {
            Optional<Receita> receita = receitaService.getReceitaById(id);
            if (receita.isPresent()) {
                return ResponseEntity.ok(receita.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Erro ao buscar receita", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao buscar receita: " + e.getMessage());
        }
    }
}