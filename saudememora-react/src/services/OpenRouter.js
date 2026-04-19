/**
 * OpenRouter.js  —  todas as chamadas de IA agora passam pelo backend.
 * O frontend não precisa mais de nenhuma chave de API.
 */

import axios from "../axiosConfig";

// ─── helper ──────────────────────────────────────────────────────────────────

function normalizarTexto(texto) {
  if (!texto || typeof texto !== "string") return "";
  return texto
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s*/g, "$1\n")
    .trim();
}

async function post(endpoint, body) {
  const res = await axios.post(`/api/ai${endpoint}`, body);
  return res.data;
}

// ─── Ficha médica OCR ─────────────────────────────────────────────────────────

/**
 * Pipeline: OCR → campos da FichaMedica (JSON).
 * Substitui: ajustarDadosMedicos + ajustarTextoFormulario + ajustarJSON
 */
export async function processarFichaMedicaOCR(textoOCR) {
  try {
    return await post("/ficha-medica/ocr", { texto: textoOCR });
  } catch (error) {
    console.error("Erro ao processar ficha médica OCR:", error);
    return { error: error.message };
  }
}

/**
 * Mantido para retrocompatibilidade com aplicarCamposComOCR.js
 * Chama o pipeline completo e retorna o JSON final.
 */
export async function ajustarJSON(texto) {
  return processarFichaMedicaOCR(texto);
}

export async function ajustarDadosMedicos(texto) {
  // Delegado ao pipeline completo no backend
  return texto;
}

export async function ajustarTextoFormulario(texto) {
  // Delegado ao pipeline completo no backend
  return texto;
}

// ─── Receita ──────────────────────────────────────────────────────────────────

export async function tratarOCRParaReceitas(textoOCR) {
  try {
    const data = await post("/receita/ocr", { texto: textoOCR });

    let dataFormatada = "";
    if (data.dataReceita) {
      const d = data.dataReceita.trim();
      if (d.includes("/")) {
        const [dd, mm, yyyy] = d.split("/");
        dataFormatada = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      } else {
        dataFormatada = d;
      }
    }

    return {
      dataReceita: dataFormatada || new Date().toISOString().split("T")[0],
      medico: data.medico || "",
      crm: data.crm || "",
      medicamentos: Array.isArray(data.medicamentos)
        ? data.medicamentos.map((m) => ({
            nome: m.nome || "",
            quantidade: m.quantidade || "",
            formaDeUso: m.formaDeUso || "",
          }))
        : [],
      observacoes: normalizarTexto(data.observacoes),
      resumo: normalizarTexto(data.resumo),
    };
  } catch (error) {
    console.error("Erro ao tratar OCR para receitas:", error);
    return { error: error.message };
  }
}

// ─── Exame ────────────────────────────────────────────────────────────────────

export async function tratarOCRParaExames(textoOCR) {
  try {
    const data = await post("/exame/ocr", { texto: textoOCR });

    let dataFormatada = "";
    if (data.dataExame) {
      const d = data.dataExame.trim();
      if (d.includes("/")) {
        const [dd, mm, yyyy] = d.split("/");
        dataFormatada = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      } else {
        dataFormatada = d;
      }
    }

    return {
      dataExame: dataFormatada || new Date().toISOString().split("T")[0],
      tipo: data.tipo || "",
      laboratorio: data.laboratorio || "",
      resultado: data.resultado || "",
      observacoes: data.observacoes,
      resumo: data.resumo,
      nomeExame: data.nomeExame || "",
    };
  } catch (error) {
    console.error("Erro ao tratar OCR para exames:", error);
    return { error: error.message };
  }
}

// ─── Documento Clínico ────────────────────────────────────────────────────────

export async function tratarOCRParaDocumentoClinico(textoOCR) {
  try {
    const data = await post("/documento-clinico/ocr", { texto: textoOCR });

    return {
      dataDocumentoCli:
        data.dataDocumentoCli || new Date().toISOString().split("T")[0],
      medico: data.medico || "",
      especialidade: data.especialidade || "",
      tipo: data.tipo || "",
      observacoes: normalizarTexto(data.observacoes),
      conclusoes: normalizarTexto(data.conclusoes),
      resumo: normalizarTexto(data.resumo),
    };
  } catch (error) {
    console.error("Erro ao tratar OCR para documento clínico:", error);
    return { error: error.message };
  }
}

// ─── Medicamentos ─────────────────────────────────────────────────────────────

export async function extrairMedicamentosDoOCR(textoOCR) {
  try {
    const medicamentos = await post("/medicamentos/ocr", { texto: textoOCR });

    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
      throw new Error("Nenhum medicamento encontrado.");
    }

    return medicamentos;
  } catch (error) {
    console.error("Erro ao extrair medicamentos:", error);
    return { error: error.message };
  }
}

// ─── Formatação de texto OCR ──────────────────────────────────────────────────

export async function formatarTextoOCR(texto1, texto2) {
  try {
    const data = await post("/formatar-ocr", {
      texto1: texto1 || "",
      texto2: texto2 || "",
    });
    return data.resultado || texto1;
  } catch (error) {
    console.error("Erro ao formatar texto OCR:", error);
    return texto1; // fallback para o original
  }
}

// alias mantido por retrocompatibilidade
export const formatarTextoOCR2 = formatarTextoOCR;
