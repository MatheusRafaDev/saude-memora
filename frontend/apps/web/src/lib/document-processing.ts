import { customFetch } from '@workspace/api-client-react';

/** Mensagem padrão quando o arquivo não é um documento médico legível. */
export const INVALID_DOC_MESSAGE =
  'Não conseguimos reconhecer um documento médico nesta imagem. Tire outra foto com boa iluminação, enquadrando o documento inteiro e sem cortes.';

export type ProcessingOutcome =
  | { status: 'pronto'; id: string }
  | { status: 'rejeitado'; message: string }
  | { status: 'failed'; id: string; message: string }
  | { status: 'timeout'; id: string }
  | { status: 'aborted'; id: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Acompanha o processamento (OCR + IA) feito pelo worker no backend até o documento
 * ficar pronto, ser recusado (inválido) ou falhar. `isAborted` permite parar o polling
 * quando o usuário fecha a tela (o processamento continua em segundo plano).
 */
export async function waitForDocumentProcessing(
  id: string,
  opts: { onProgress?: (progress: number) => void; isAborted?: () => boolean; timeoutMs?: number; intervalMs?: number } = {},
): Promise<ProcessingOutcome> {
  const { onProgress, isAborted, timeoutMs = 120_000, intervalMs = 2500 } = opts;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(intervalMs);
    if (isAborted?.()) return { status: 'aborted', id };

    try {
      const doc = (await customFetch(`/api/documents/${id}`)) as any;
      if (typeof doc?.progress === 'number') onProgress?.(doc.progress);

      if (doc?.status === 'pronto') return { status: 'pronto', id };
      if (doc?.status === 'rejeitado') return { status: 'rejeitado', message: doc.errorMessage || INVALID_DOC_MESSAGE };
      if (doc?.status === 'failed') return { status: 'failed', id, message: doc.errorMessage || 'Falha ao processar o documento.' };
    } catch {
      // Falha de rede pontual: tenta de novo no próximo ciclo
    }
  }

  return { status: 'timeout', id };
}

/** Upload recusado na hora pelo backend (mesmo arquivo já identificado como inválido). */
export function getInvalidDocumentMessage(err: unknown): string | null {
  const e = err as { status?: number; data?: { invalidDocument?: boolean; message?: string } };
  if (e?.status === 422 && e.data?.invalidDocument) return e.data.message || INVALID_DOC_MESSAGE;
  return null;
}
