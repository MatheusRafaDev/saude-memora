/**
 * Utilitário de compressão e conversão de imagens no cliente (navegador/mobile).
 *
 * Resolve problemas comuns em fotos tiradas no iPhone e smartphones modernos:
 * 1. Tamanho excessivo: fotos de câmeras de 12MP a 48MP costumam ter 4MB a 15MB.
 *    Reduzimos a resolução máxima para 1920px e aplicamos compressão JPEG 0.82,
 *    resultando em arquivos leves (~350KB a 700KB) com 100% de nitidez para OCR e leitura médica.
 * 2. Formato HEIC/HEIF do iOS: converte automaticamente para image/jpeg padrão.
 * 3. Orientação EXIF: o desenho no Canvas normaliza automaticamente a rotação em todos os navegadores modernos.
 * 4. Preserva arquivos PDF 100% intactos.
 */

export interface OptimizeFileOptions {
  maxDimension?: number;
  quality?: number;
}

export async function optimizeUploadFile(
  file: File,
  options: OptimizeFileOptions = {}
): Promise<File> {
  // Arquivos PDF não devem ser alterados
  if (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  ) {
    return file;
  }

  // Verifica se é imagem por MIME ou extensão
  const isImage =
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|heic|heif|webp|bmp|tiff)$/i.test(file.name);

  if (!isImage) {
    return file;
  }

  // Se já for uma imagem pequena (< 800 KB) e já for JPG/PNG padrão, não precisa recomprimir
  const isStandardFormat = /^(image\/jpeg|image\/png)$/i.test(file.type) && /\.(jpe?g|png)$/i.test(file.name);
  if (isStandardFormat && file.size < 800 * 1024) {
    return file;
  }

  try {
    return await compressImageToJpeg(file, options);
  } catch (err) {
    console.warn('[ImageOptimization] Não foi possível comprimir a imagem, mantendo original:', err);
    return file;
  }
}

/**
 * Otimiza uma lista de arquivos em paralelo (para uploads múltiplos ou em lote)
 */
export async function optimizeUploadFiles(
  files: File[],
  options?: OptimizeFileOptions
): Promise<File[]> {
  return Promise.all(files.map((file) => optimizeUploadFile(file, options)));
}

async function compressImageToJpeg(
  file: File,
  options: OptimizeFileOptions
): Promise<File> {
  const maxDimension = options.maxDimension || 1920;
  const quality = options.quality ?? 0.82;

  let bitmap: ImageBitmap | HTMLImageElement;

  if (typeof createImageBitmap !== 'undefined') {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      bitmap = await loadImageElement(file);
    }
  } else {
    bitmap = await loadImageElement(file);
  }

  const { width: originalWidth, height: originalHeight } = bitmap;

  // Calcula escala mantendo proporção original
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > maxDimension || originalHeight > maxDimension) {
    if (originalWidth >= originalHeight) {
      targetWidth = maxDimension;
      targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Preenchimento de fundo branco para evitar transparências pretas em conversões PNG/HEIC
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Renderiza a imagem no canvas com interpolação suave
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  // Libera a memória do bitmap imediatamente
  if ('close' in bitmap && typeof (bitmap as ImageBitmap).close === 'function') {
    (bitmap as ImageBitmap).close();
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });

  if (!blob) {
    throw new Error('Falha ao exportar blob do canvas');
  }

  // Normaliza o nome do arquivo com extensão .jpg (ex.: IMG_0123.HEIC -> IMG_0123.jpg)
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const newFileName = `${baseName}.jpg`;

  return new File([blob], newFileName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

