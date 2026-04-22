package com.pi.saudememora.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pi.saudememora.model.Exame;
import com.pi.saudememora.repository.ExameRepository;
import com.pi.saudememora.service.DocumentosService;
import com.pi.saudememora.service.ExameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/exames")
@CrossOrigin(origins = "*")
public class ExameController {

    @Autowired
    private ExameService exameService;

    @Autowired
    private DocumentosService documentosService;

    @Autowired
    private ExameRepository exameRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> salvarExameComImagem(
            @RequestParam("exameData") String exameData,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem) {
        try {
            Exame exame = objectMapper.readValue(exameData, Exame.class);

            if (imagem != null && !imagem.isEmpty()) {
                String nomeArquivo = System.currentTimeMillis() + "_" + imagem.getOriginalFilename();
                Path caminho = Paths.get("uploads/exames", nomeArquivo);
                Files.createDirectories(caminho.getParent());
                Files.write(caminho, imagem.getBytes());
                exame.setImagem(caminho.toString());
            }

            Exame salvo = exameService.save(exame);
            return ResponseEntity.status(HttpStatus.CREATED).body(salvo);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao salvar imagem: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao salvar exame: " + e.getMessage());
        }
    }

    // ✅ ATUALIZADO: aceita ?pacienteId=X para filtrar por usuário
    @GetMapping
    public ResponseEntity<List<Exame>> listarExames(
            @RequestParam(required = false) Long pacienteId) {
        try {
            List<Exame> exames;
            if (pacienteId != null) {
                exames = exameRepository.findByDocumentoPacienteId(pacienteId);
            } else {
                exames = exameService.findAll();
            }
            return exames.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(exames);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exame> obterExame(@PathVariable Long id) {
        return exameService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/imagem/{id}")
    public ResponseEntity<byte[]> getImagemPorId(@PathVariable Long id) {
        try {
            Optional<Exame> exameOpt = exameService.findById(id);
            if (exameOpt.isEmpty() || exameOpt.get().getImagem() == null) {
                return ResponseEntity.notFound().build();
            }

            Path caminho = Paths.get(exameOpt.get().getImagem());
            if (!Files.exists(caminho)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imagemBytes = Files.readAllBytes(caminho);
            String tipo = Files.probeContentType(caminho);
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(tipo)).body(imagemBytes);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exame> atualizarExame(@PathVariable Long id, @RequestBody Exame exame) {
        try {
            Exame exameExistente = exameService.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exame não encontrado"));

            exameExistente.setDataExame(exame.getDataExame());
            exameExistente.setTipo(exame.getTipo());
            exameExistente.setLaboratorio(exame.getLaboratorio());
            exameExistente.setResultado(exame.getResultado());
            exameExistente.setResumo(exame.getResumo());
            exameExistente.setObservacoes(exame.getObservacoes());
            exameExistente.setNomeExame(exame.getNomeExame());

            Exame exameAtualizado = exameService.save(exameExistente);
            return ResponseEntity.ok(exameAtualizado);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirExame(@PathVariable Long id) {
        try {
            exameService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/documento/{id}")
    public List<Exame> listarPorDocumento(@PathVariable Long id) {
        return exameRepository.findByDocumentoId(id);
    }
}