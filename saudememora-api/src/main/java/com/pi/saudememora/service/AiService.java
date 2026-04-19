package com.pi.saudememora.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final GroqService groq;
    private final ObjectMapper mapper = new ObjectMapper();

    public AiService(GroqService groq) {
        this.groq = groq;
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private String limparMarkdown(String texto) {
        return texto.replaceAll("(?i)```json\\s*", "")
                    .replaceAll("```", "")
                    .trim();
    }

    private String normalizarTexto(String texto) {
        if (texto == null || texto.isBlank()) return "";
        return texto.replaceAll("\\s+", " ")
                    .replaceAll("([.!?])\\s*", "$1\n")
                    .trim();
    }

    // ─── OCR - formatação / unificação ──────────────────────────────────────────

    /**
     * Unifica dois textos OCR, corrige ortografia e preserva estrutura clínica.
     */
    public String formatarTextoOCR(String texto1, String texto2) throws Exception {
        String unificado = texto1 + "\n\n" + texto2;

        String prompt = """
            Corrija os erros ortográficos e unifique as informações dos dois textos.
            Mantenha a estrutura, sem tirar o telefone e etc. e fazendo dosagem correta dos medicamentos.

            Texto a processar:
            %s
            """.formatted(unificado);

        return groq.chat(
            "Você é um filtro de texto OCR médico. Corrija erros ortográficos, " +
            "una informações duplicadas e preserve a estrutura clínica.",
            prompt, 0.0, 2000
        );
    }

    // ─── Ficha Médica ────────────────────────────────────────────────────────────

    /**
     * Extrai apenas as perguntas e respostas médicas, sem corrigir nada.
     */
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

    /**
     * Converte o texto do formulário em JSON estruturado (campos da FichaMedica).
     */
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

    /**
     * Ajusta as respostas do formulário (SIM/NÃO, pressão) e retorna o texto corrigido.
     */
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

    /**
     * Pipeline completo OCR → FichaMedica: retorna JSON pronto para mapear no frontend.
     */
    public ObjectNode processarFichaMedicaOCR(String textoOCR) throws Exception {
        String dadosMedicos      = ajustarDadosMedicos(textoOCR);
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

            Campos:
            - "dataReceita" (YYYY-MM-DD), se não houver, deixe vazio
            - "medico": nome com capitalização correta
            - "crm": registro do médico
            - "medicamentos": lista com "nome", "quantidade", "formaDeUso"
            - "observacoes": observações adicionais
            - "resumo": texto reescrito com ortografia corrigida

            Se algum campo estiver ausente, preencha com texto padrão explicativo.
            Retorne apenas o JSON, sem comentários.

            Texto do OCR:
            %s
            """.formatted(textoTratado);

        String raw = groq.chat(
            "Você é um assistente que interpreta e organiza dados extraídos via OCR " +
            "para inclusão em um sistema de receitas médicas.",
            prompt, 0.0, 1500
        );

        return (ObjectNode) mapper.readTree(limparMarkdown(raw));
    }

    // ─── Exame ───────────────────────────────────────────────────────────────────

    public ObjectNode tratarOCRParaExames(String textoOCR) throws Exception {
        String textoTratado = textoOCR.replaceAll("[^a-zA-Z0-9.,\\s]", "").trim();

        String prompt = """
            Interprete o texto OCR abaixo e extraia os dados em JSON estruturado para exames médicos.

            Campos:
            - "dataExame" (YYYY-MM-DD), se não houver, deixe vazio
            - "tipo": tipo do exame
            - "laboratorio": nome do laboratório
            - "resultado": resultado do exame
            - "observacoes": observações adicionais
            - "resumo": texto reescrito com ortografia corrigida
            - "nomeExame": nome do exame

            Se algum campo estiver ausente, preencha com texto padrão explicativo.
            Retorne apenas o JSON.

            Texto do OCR:
            %s
            """.formatted(textoTratado);

        String raw = groq.chat(
            "Você é um assistente que interpreta e organiza dados extraídos via OCR " +
            "para inclusão em um sistema de exames médicos.",
            prompt, 0.2, 1500
        );

        return (ObjectNode) mapper.readTree(limparMarkdown(raw));
    }

    // ─── Documento Clínico ───────────────────────────────────────────────────────

    public ObjectNode tratarOCRParaDocumentoClinico(String textoOCR) throws Exception {
        String prompt = """
            Interprete o texto OCR abaixo e extraia os dados em JSON estruturado para documentos clínicos.

            Campos:
            - "dataDocumentoCli" (YYYY-MM-DD), se não houver, deixe vazio
            - "medico": nome do médico
            - "especialidade": especialidade médica
            - "observacoes": observações gerais
            - "conclusoes": conclusões do médico
            - "resumo": texto reescrito com ortografia e pontuação corrigidas
            - "tipo": tipo do documento (laudo, atestado, receita, relatório, exame, etc.) inferido do conteúdo

            Se algum campo estiver ausente, preencha com texto padrão explicativo.
            Retorne apenas o JSON.

            Texto do OCR:
            %s
            """.formatted(textoOCR);

        String raw = groq.chat(
            "Você é um assistente que interpreta e organiza dados extraídos via OCR " +
            "para inclusão em um sistema de documentos clínicos.",
            prompt, 0.0, 1500
        );

        return (ObjectNode) mapper.readTree(limparMarkdown(raw));
    }

    // ─── Medicamentos ────────────────────────────────────────────────────────────

    public ArrayNode extrairMedicamentosDoOCR(String textoOCR) throws Exception {
        String textoTratado = textoOCR
            .replaceAll("[\\u0300-\\u036f]", "")
            .replaceAll("[^a-zA-Z0-9À-ÿ.,\\s/\\-]", "")
            .trim();

        String prompt = """
            Extraia apenas os medicamentos do texto OCR abaixo, retornando um JSON no formato:
            {
              "medicamentos": [
                {
                  "nome": "Nome do medicamento (em formato normal, não em maiúsculas)",
                  "quantidade": "Dose por aplicação/uso (ex: '1 comprimido', '2 gotas', '5ml')",
                  "formaDeUso": "Via de administração + duração (ex: 'via oral por 5 dias')"
                }
              ]
            }

            Sem nomes duplicados. Sem markdown, explicações ou formatação. Apenas o JSON.
            Texto OCR:
            %s
            """.formatted(textoTratado);

        String raw = groq.chat(
            "Você é um assistente que extrai medicamentos de textos OCR médicos.",
            prompt, 0.1, 1000
        );

        JsonNode root = mapper.readTree(limparMarkdown(raw));
        return (ArrayNode) root.get("medicamentos");
    }
}
