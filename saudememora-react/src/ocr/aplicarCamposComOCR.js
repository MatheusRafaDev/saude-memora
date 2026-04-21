import { processarFichaMedicaOCR } from "../services/OpenRouter";

export async function aplicarCamposComOCR(
  textoOCR,
  perguntas,
  setRespostas,
  setMensagem
) {
  if (!textoOCR || textoOCR.trim() === "") {
    setMensagem("Nenhum texto OCR disponível para processar");
    return;
  }

  try {
    setMensagem("Processando dados médicos...");

    // Pipeline completo no backend: OCR → JSON da ficha médica
    const jsonRespostas = await processarFichaMedicaOCR(textoOCR);

    if (!jsonRespostas || jsonRespostas.error) {
      throw new Error(jsonRespostas?.error || "Falha ao processar os dados médicos");
    }

    // Mapeia as respostas para o formato esperado pelo estado
    const novasRespostas = {};

    perguntas.forEach((pergunta) => {
      const chave = pergunta.chave;
      let valor = jsonRespostas[chave];

      if (valor === undefined || valor === null) {
        valor = pergunta.tipo === "pressao" ? "" : "NAO";
      } else {
        valor = valor.toString().trim().toUpperCase();
        valor = valor.replace("NÃO", "NAO");

        if (pergunta.tipo === "pressao") {
          if (!["NORMAL", "ALTA", "BAIXA"].includes(valor)) {
            valor = "";
          }
        }
      }

      novasRespostas[chave] = valor;

      if (pergunta.mostrarExtra && valor === "NAO") {
        novasRespostas[`${chave}_extra`] = "";
      }
    });

    setRespostas((prev) => ({ ...prev, ...novasRespostas }));
    setMensagem("Campos preenchidos com sucesso!");
  } catch (error) {
    console.error("Erro ao aplicar campos com OCR:", error);
    setMensagem(`Erro ao processar OCR: ${error.message}`);
  }
}