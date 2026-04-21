/**
 * ocrSpace.js — OCR via backend.
 *
 * Todo o processamento com OCR.space é feito no servidor (Spring Boot).
 * O frontend apenas pré-processa a imagem localmente (canvas) e envia
 * o arquivo resultante para POST /api/ocr/processar.
 *
 * Funções exportadas (interface mantida idêntica ao arquivo anterior):
 *   - ocrSpace(file)    → string  (texto do engine 1 — Tesseract via OCR.space)
 *   - ocrSpace2(file)   → string  (texto do engine 2 — OCR.space v2)
 *   - smartOCR(file)    → string  (tenta engine 2; fallback engine 1)
 *   - ocrSpaceDuplo(file) → { texto1, texto2 }  (ambos em uma chamada)
 */

import axiosInstance from '../axiosConfig';
import ProcessarImagem from './utils/ProcessarImagem';

// ─── Cache de requisição por arquivo ──────────────────────────────────────────
// Evita que Promise.all([ocrSpace(f), ocrSpace2(f)]) dispare duas chamadas HTTP.
const _cache = new WeakMap();

async function chamarOcrBackend(file) {
  if (_cache.has(file)) {
    return _cache.get(file);
  }

  const promise = (async () => {
    const processedBlob = await ProcessarImagem(file);

    const formData = new FormData();
    formData.append('imagem', processedBlob, file.name || 'imagem.png');

    const response = await axiosInstance.post('/api/ocr/processar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });

    return {
      texto1: response.data.texto1 || '',
      texto2: response.data.texto2 || '',
    };
  })();

  _cache.set(file, promise);

  // Remove do cache após a promise resolver (sucesso ou falha)
  promise.finally(() => _cache.delete(file));

  return promise;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Engine 1 (Tesseract via OCR.space). */
export async function ocrSpace(file) {
  try {
    const { texto1 } = await chamarOcrBackend(file);
    return texto1;
  } catch (err) {
    console.error('[OCR] Erro no engine 1:', err);
    return '';
  }
}

/** Engine 2 (OCR.space v2 — melhor para formulários e tabelas). */
export async function ocrSpace2(file) {
  try {
    const { texto2 } = await chamarOcrBackend(file);
    return texto2;
  } catch (err) {
    console.error('[OCR] Erro no engine 2:', err);
    return '';
  }
}

/** Retorna o melhor resultado: prefere engine 2, cai no engine 1. */
export async function smartOCR(file) {
  try {
    const { texto1, texto2 } = await chamarOcrBackend(file);
    return texto2.trim() || texto1.trim();
  } catch (err) {
    console.error('[OCR] Erro no smartOCR:', err);
    throw err;
  }
}

/** Retorna ambos os textos em uma única chamada HTTP. */
export async function ocrSpaceDuplo(file) {
  return chamarOcrBackend(file);
}