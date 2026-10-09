export function getReadableUploadError(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback;

  const problem = error as { status?: number; data?: { message?: unknown }; message?: unknown };
  if (problem.status === 413) return 'O arquivo é maior que o limite permitido. Escolha um arquivo de até 10 MB.';
  if (problem.status === 403 && problem.data?.message === 'consentimento_necessario') {
    return 'Para processar documentos, aceite o consentimento de uso de IA nas configurações do seu perfil.';
  }
  if (typeof problem.data?.message === 'string' && problem.data.message.trim()) return problem.data.message;
  if (typeof problem.message === 'string' && problem.message.trim()) {
    const message = problem.message.trim();
    if (!/^(failed to fetch|fetch failed|networkerror|load failed)$/i.test(message)) return message;
  }
  return fallback;
}
