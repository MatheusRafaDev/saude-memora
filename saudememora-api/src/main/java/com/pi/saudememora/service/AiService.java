package com.pi.saudememora.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final GroqService groq;
    private final ObjectMapper mapper = new ObjectMapper();

    // Limites específicos do banco de dados
    private static final class DbLimits {
        // DocumentoClinico
        static final int OBSERVACOES_DOC_CLINICO = 2000;
        static final int CONCLUSAO_DOC_CLINICO = 2000;
        static final int CONTEUDO_DOC_CLINICO = 5000;
        static final int RESUMO_DOC_CLINICO = 2000;

        // Receita
        static final int OBSERVACOES_RECEITA = 5000;
        static final int RESUMO_RECEITA = 2000;
        static final int MEDICO_NOME = 100;
        static final int CRM_MEDICO = 20;

        // Medicamento
        static final int MED_NOME = 100;
        static final int MED_QUANTIDADE = 50;
        static final int MED_FORMA_USO = 100;

        // Exame
        static final int EXAME_TIPO = 100;
        static final int EXAME_LAB = 200;
        static final int EXAME_RESULTADO = 2000;
        static final int EXAME_NOME = 150;
    }

    public AiService(GroqService groq) {
        this.groq = groq;
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private String limparMarkdown(String texto) {
        return texto.replaceAll("(?i)```json\\s*", "")
                .replaceAll("```", "")
                .trim();
    }

    private String truncarTexto(String texto, int maxLength) {
        if (texto == null) return "";
        if (texto.length() <= maxLength) return texto;
        log.warn("Texto truncado de {} para {} caracteres", texto.length(), maxLength);
        return texto.substring(0, maxLength - 3) + "...";
    }

    private String normalizarTexto(String texto) {
        if (texto == null || texto.isBlank()) return "";
        return texto.replaceAll("\\s+", " ")
                .replaceAll("([.!?])\\s*", "$1\n")
                .trim();
    }

    // ─── OCR - formatação / unificação ──────────────────────────────────────────

    public String formatarTextoOCR(String texto1, String texto2) throws Exception {
        String unificado = texto1 + "\n\n" + texto2;

        String prompt = """
            Corrija os erros ortográficos e unifique as informações dos dois textos.
            Mantenha a estrutura, sem tirar o telefone e etc. e fazendo dosagem correta dos medicamentos.
            
            IMPORTANTE: A resposta deve ter no MÁXIMO 2000 caracteres.

            Texto a processar:
            %s
            """.formatted(unificado);

        String result = groq.chat(
                "Você é um filtro de texto OCR médico. Seja conciso. Limite sua resposta a 2000 caracteres.",
                prompt, 0.0, 800
        );

        return truncarTexto(result, DbLimits.CONTEUDO_DOC_CLINICO);
    }

    // ─── Ficha Médica ────────────────────────────────────────────────────────────

    public String ajustarDadosMedicos(String texto) throws Exception {
        String prompt = """
            Extraia do texto abaixo apenas as perguntas médicas com as respostas sem corrigir ortografia
            e nem corrigir as respostas. Deixe os parênteses da forma que estavam e os erros também.
            Apenas corte as perguntas e respostas.

            Texto do formulário:
            %s
            """.formatted(texto);

        return groq.chat(
                "Você é um assistente que extrai apenas os dados médicos de formulários, sem realizar correções.",
                prompt
        );
    }

    public ObjectNode ajustarJSON(String texto) throws Exception {
        String prompt = """
            Você receberá um texto contendo respostas de um formulário médico.

            Sua tarefa é extrair os dados e devolver em JSON **resumido**, sem acentos,
            tudo em letras minúsculas, com as chaves no estilo snake_case.

            Siga exatamente este modelo:
            {
              "tratamento_medico": "",
              "gravida": "",
              "regime": "",
              "diabetes": "",
              "alergias": "",
              "reumatica": "",
              "coagulacao": "",
              "cardiaco": "",
              "hemorragico": "",
              "anestesia": "",
              "alergia_medicamentos": "",
              "hepatite": "",
              "hiv": "",
              "drogas": "",
              "fumante": "",
              "fumou": "",
              "pressao": "",
              "respiratorio": ""
            }

            Preencha apenas com os dados que existirem no texto.
            Se algum campo não estiver presente no texto, omita do JSON.
            Não corrija erros de digitação, apenas interprete conforme o texto.
            
            Texto do formulário:
            \"\"\"%s\"\"\"
            """.formatted(texto);

        String raw = groq.chat(
                "Você é um assistente que extrai apenas os dados médicos de formulários, sem realizar correções.",
                prompt
        );

        return (ObjectNode) mapper.readTree(limparMarkdown(raw));
    }

    public String ajustarTextoFormulario(String texto) throws Exception {
        String textoCorrigido = texto
                .replaceAll("(?i)NORMAL\\s*A\\s*(ALTA|BAIXA)", "NORMAL")
                .replaceAll("SIM\\s*\\(\\s*\\)", "NÃO");

        String prompt = """
            Leia o questionário abaixo e, ao final, retorne apenas as respostas exatamente como estão,
            sem correção de ortografia ou formatação. Não modifique nada nos parênteses ou erros de digitação.
            Apenas forneça as perguntas seguidas das respostas no formato de JSON, com as respostas como
            "SIM" ou "NÃO" e para na pressão escolher entre normal, alto e baixo o que se encaixa mais
            no texto. Não adicione explicações ou observações.

            Texto do formulário:
            %s
            """.formatted(textoCorrigido);

        return groq.chat(
                "Você é um assistente que ajusta respostas de formulários médicos com base em regras " +
                        "definidas para marcações incorretas ou omissas.",
                prompt
        );
    }

    public ObjectNode processarFichaMedicaOCR(String textoOCR) throws Exception {
        String dadosMedicos = ajustarDadosMedicos(textoOCR);
        String resultadoFormatado = ajustarTextoFormulario(dadosMedicos);
        return ajustarJSON(resultadoFormatado);
    }

    // ─── Receita ─────────────────────────────────────────────────────────────────

    public ObjectNode tratarOCRParaReceitas(String textoOCR) throws Exception {
        String textoTratado = textoOCR
                .replaceAll("[\\u0300-\\u036f]", "")
                .replaceAll("[^a-zA-Z0-9À-ÿ.,\\s/\\-]", "")
                .trim();

        String prompt = """
            Interprete o texto OCR abaixo e extraia os dados em JSON estruturado para receitas médicas.

            IMPORTANTE - LIMITES DE TAMANHO:
            - "observacoes": máximo %d caracteres
            - "resumo": máximo %d caracteres  
            - "medico": máximo %d caracteres
            - "crm": máximo %d caracteres
            - Cada medicamento: nome máximo %d, quantidade máximo %d, formaDeUso máximo %d

            Campos:
            - "dataReceita" (YYYY-MM-DD), se não houver, deixe vazio
            - "medico": nome com capitalização correta
            - "crm": registro do médico
            - "medicamentos": lista com "nome", "quantidade", "formaDeUso"
            - "observacoes": observações adicionais (seja conciso)
            - "resumo": texto reescrito com ortografia corrigida (seja conciso)

            Se algum campo estiver ausente, preencha com texto padrão explicativo.
            Retorne apenas o JSON, sem comentários.

            Texto do OCR:
            %s
            """.formatted(
                DbLimits.OBSERVACOES_RECEITA,
                DbLimits.RESUMO_RECEITA,
                DbLimits.MEDICO_NOME,
                DbLimits.CRM_MEDICO,
                DbLimits.MED_NOME,
                DbLimits.MED_QUANTIDADE,
                DbLimits.MED_FORMA_USO,
                textoTratado
        );

        String raw = groq.chat(
                "Você é um assistente que interpreta dados OCR para receitas médicas. " +
                        "Seja EXTREMAMENTE CONCISO. Respeite rigorosamente os limites de tamanho.",
                prompt, 0.0, 1500
        );

        String cleaned = limparMarkdown(raw);
        ObjectNode result = (ObjectNode) mapper.readTree(cleaned);

        // Validar e truncar campos
        if (result.has("observacoes")) {
            result.put("observacoes", truncarTexto(result.get("observacoes").asText(), DbLimits.OBSERVACOES_RECEITA));
        }
        if (result.has("resumo")) {
            result.put("resumo", truncarTexto(result.get("resumo").asText(), DbLimits.RESUMO_RECEITA));
        }
        if (result.has("medico")) {
            result.put("medico", truncarTexto(result.get("medico").asText(), DbLimits.MEDICO_NOME));
        }
        if (result.has("crm")) {
            result.put("crm", truncarTexto(result.get("crm").asText(), DbLimits.CRM_MEDICO));
        }

        // Validar medicamentos
        if (result.has("medicamentos") && result.get("medicamentos").isArray()) {
            ArrayNode medicamentos = (ArrayNode) result.get("medicamentos");
            ArrayNode validatedMeds = mapper.createArrayNode();

            for (JsonNode med : medicamentos) {
                ObjectNode validatedMed = mapper.createObjectNode();

                String nome = med.has("nome") ? med.get("nome").asText() : "";
                validatedMed.put("nome", truncarTexto(nome, DbLimits.MED_NOME));

                String quantidade = med.has("quantidade") ? med.get("quantidade").asText() : "";
                validatedMed.put("quantidade", truncarTexto(quantidade, DbLimits.MED_QUANTIDADE));

                String formaUso = med.has("formaDeUso") ? med.get("formaDeUso").asText() : "";
                validatedMed.put("formaDeUso", truncarTexto(formaUso, DbLimits.MED_FORMA_USO));

                validatedMeds.add(validatedMed);
            }
            result.set("medicamentos", validatedMeds);
        }

        return result;
    }

    // ─── Exame ───────────────────────────────────────────────────────────────────

    public ObjectNode tratarOCRParaExames(String textoOCR) throws Exception {
        String textoTratado = textoOCR.replaceAll("[^a-zA-Z0-9.,\\s]", "").trim();

        String prompt = """
            Interprete o texto OCR abaixo e extraia os dados em JSON estruturado para exames médicos.

            IMPORTANTE - LIMITES:
            - "observacoes": máximo %d caracteres
            - "resultado": máximo %d caracteres
            - "tipo": máximo %d caracteres
            - "laboratorio": máximo %d caracteres
            - "nomeExame": máximo %d caracteres

            Campos:
            - "dataExame" (YYYY-MM-DD)
            - "tipo": tipo do exame
            - "laboratorio": nome do laboratório
            - "resultado": resultado do exame
            - "observacoes": observações adicionais
            - "resumo": texto reescrito
            - "nomeExame": nome do exame

            Retorne apenas o JSON.

            Texto do OCR:
            %s
            """.formatted(
                DbLimits.OBSERVACOES_RECEITA,
                DbLimits.EXAME_RESULTADO,
                DbLimits.EXAME_TIPO,
                DbLimits.EXAME_LAB,
                DbLimits.EXAME_NOME,
                textoTratado
        );

        String raw = groq.chat(
                "Você é um assistente para exames médicos. Seja conciso.",
                prompt, 0.2, 1500
        );

        ObjectNode result = (ObjectNode) mapper.readTree(limparMarkdown(raw));

        // Validar e truncar
        if (result.has("observacoes")) {
            result.put("observacoes", truncarTexto(result.get("observacoes").asText(), DbLimits.OBSERVACOES_RECEITA));
        }
        if (result.has("resultado")) {
            result.put("resultado", truncarTexto(result.get("resultado").asText(), DbLimits.EXAME_RESULTADO));
        }
        if (result.has("tipo")) {
            result.put("tipo", truncarTexto(result.get("tipo").asText(), DbLimits.EXAME_TIPO));
        }
        if (result.has("laboratorio")) {
            result.put("laboratorio", truncarTexto(result.get("laboratorio").asText(), DbLimits.EXAME_LAB));
        }
        if (result.has("nomeExame")) {
            result.put("nomeExame", truncarTexto(result.get("nomeExame").asText(), DbLimits.EXAME_NOME));
        }

        return result;
    }

    // ─── Documento Clínico ───────────────────────────────────────────────────────

    public ObjectNode tratarOCRParaDocumentoClinico(String textoOCR) throws Exception {
        String prompt = """
            Interprete o texto OCR abaixo e extraia os dados em JSON estruturado para documentos clínicos.

            IMPORTANTE - LIMITES DE TAMANHO:
            - "observacoes": máximo %d caracteres
            - "conclusoes": máximo %d caracteres
            - "conteudo": máximo %d caracteres
            - "resumo": máximo %d caracteres

            Campos:
            - "dataDocumentoCli" (YYYY-MM-DD)
            - "medico": nome do médico
            - "especialidade": especialidade médica
            - "observacoes": observações gerais (seja conciso)
            - "conclusoes": conclusões do médico (seja conciso)
            - "conteudo": conteúdo completo (seja conciso)
            - "resumo": texto reescrito (seja conciso)
            - "tipo": tipo do documento (laudo, atestado, relatório, etc.)

            Retorne apenas o JSON.

            Texto do OCR:
            %s
            """.formatted(
                DbLimits.OBSERVACOES_DOC_CLINICO,
                DbLimits.CONCLUSAO_DOC_CLINICO,
                DbLimits.CONTEUDO_DOC_CLINICO,
                DbLimits.RESUMO_DOC_CLINICO,
                textoOCR
        );

        String raw = groq.chat(
                "Você é um assistente para documentos clínicos. Seja EXTREMAMENTE CONCISO.",
                prompt, 0.0, 1500
        );

        ObjectNode result = (ObjectNode) mapper.readTree(limparMarkdown(raw));

        // Validar e truncar todos os campos
        if (result.has("observacoes")) {
            result.put("observacoes", truncarTexto(result.get("observacoes").asText(), DbLimits.OBSERVACOES_DOC_CLINICO));
        }
        if (result.has("conclusoes")) {
            result.put("conclusoes", truncarTexto(result.get("conclusoes").asText(), DbLimits.CONCLUSAO_DOC_CLINICO));
        }
        if (result.has("conteudo")) {
            result.put("conteudo", truncarTexto(result.get("conteudo").asText(), DbLimits.CONTEUDO_DOC_CLINICO));
        }
        if (result.has("resumo")) {
            result.put("resumo", truncarTexto(result.get("resumo").asText(), DbLimits.RESUMO_DOC_CLINICO));
        }

        return result;
    }

    // ─── Medicamentos ────────────────────────────────────────────────────────────

    public ArrayNode extrairMedicamentosDoOCR(String textoOCR) throws Exception {
        String textoTratado = textoOCR
                .replaceAll("[\\u0300-\\u036f]", "")
                .replaceAll("[^a-zA-Z0-9À-ÿ.,\\s/\\-]", "")
                .trim();

        String prompt = """
            Extraia apenas os medicamentos do texto OCR abaixo.
            
            LIMITES:
            - Nome do medicamento: máximo %d caracteres
            - Quantidade: máximo %d caracteres
            - Forma de uso: máximo %d caracteres
            - Máximo de 10 medicamentos

            Formato do JSON:
            {
              "medicamentos": [
                {
                  "nome": "nome",
                  "quantidade": "dose",
                  "formaDeUso": "via"
                }
              ]
            }

            Texto OCR:
            %s
            """.formatted(
                DbLimits.MED_NOME,
                DbLimits.MED_QUANTIDADE,
                DbLimits.MED_FORMA_USO,
                textoTratado
        );

        String raw = groq.chat(
                "Você é um assistente que extrai medicamentos. Seja conciso.",
                prompt, 0.1, 800
        );

        JsonNode root = mapper.readTree(limparMarkdown(raw));
        ArrayNode medicamentos = (ArrayNode) root.get("medicamentos");

        // Validar cada medicamento
        ArrayNode validatedMeds = mapper.createArrayNode();
        if (medicamentos != null) {
            for (JsonNode med : medicamentos) {
                ObjectNode validated = mapper.createObjectNode();

                String nome = med.has("nome") ? med.get("nome").asText() : "";
                validated.put("nome", truncarTexto(nome, DbLimits.MED_NOME));

                String quantidade = med.has("quantidade") ? med.get("quantidade").asText() : "";
                validated.put("quantidade", truncarTexto(quantidade, DbLimits.MED_QUANTIDADE));

                String formaUso = med.has("formaDeUso") ? med.get("formaDeUso").asText() : "";
                validated.put("formaDeUso", truncarTexto(formaUso, DbLimits.MED_FORMA_USO));

                validatedMeds.add(validated);
            }
        }

        return validatedMeds;
    }

    // --- corrigirOrtografia ---
    public String corrigirOrtografia(String texto) throws Exception {
        if (texto == null || texto.isBlank()) return "";
        String prompt = "Corrija apenas os erros ortograficos do texto a seguir, sem alterar o conteudo. Limite sua resposta a 2000 caracteres.\nTexto:\n" + texto;
        String result = groq.chat(
                "Voce e um revisor ortografico em portugues brasileiro.",
                prompt, 0.0, 800
        );
        return truncarTexto(result, DbLimits.CONTEUDO_DOC_CLINICO);
    }
}