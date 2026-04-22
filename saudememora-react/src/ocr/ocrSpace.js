
import axiosInstance from '../axiosConfig';
import ProcessarImagem from './utils/ProcessarImagem';


const _cache = new WeakMap();

async function chamarOcrBackend(file) {
  if (_cache.has(file)) return _cache.get(file);

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
  promise.finally(() => _cache.delete(file));
  return promise;
}

/** Engine 1 — Tesseract via OCR.space */
export async function ocrSpace(file) {
  try {
    const { texto1 } = await chamarOcrBackend(file);
    return texto1;
  } catch (err) {
    console.error('[OCR] Erro engine 1:', err);
    return '';
  }
}

/** Engine 2 — OCR.space v2 (melhor para formulários/tabelas médicas) */
export async function ocrSpace2(file) {
  try {
    const { texto2 } = await chamarOcrBackend(file);
    return texto2;
  } catch (err) {
    console.error('[OCR] Erro engine 2:', err);
    return '';
  }
}

/** Prefere engine 2; cai no engine 1 se vier vazio */
export async function smartOCR(file) {
  try {
    const { texto1, texto2 } = await chamarOcrBackend(file);
    return texto2.trim() || texto1.trim();
  } catch (err) {
    console.error('[OCR] Erro smartOCR:', err);
    throw err;
  }
}

/** Retorna os dois textos em uma única chamada HTTP */
export async function ocrSpaceDuplo(file) {
  return chamarOcrBackend(file);
}