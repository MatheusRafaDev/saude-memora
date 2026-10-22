function isHtml(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<') || /<\s*[a-z][\s\S]*>/i.test(trimmed);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;

  const apiError = error as { data?: unknown; message?: string };
  if (Array.isArray(apiError.data)) {
    const message = apiError.data.find((item): item is string => typeof item === 'string' && !isHtml(item));
    if (message) return message;
  }

  if (typeof apiError.data === 'string' && apiError.data && !isHtml(apiError.data)) {
    return apiError.data;
  }

  if (typeof apiError.data === 'object' && apiError.data !== null) {
    const obj = apiError.data as Record<string, unknown>;
    if (typeof obj.detail === 'string' && obj.detail && !isHtml(obj.detail)) {
      return obj.detail;
    }
    if (typeof obj.message === 'string' && obj.message && !isHtml(obj.message)) {
      return obj.message;
    }
    if (typeof obj.title === 'string' && obj.title && !isHtml(obj.title)) {
      return obj.title;
    }
    if (typeof obj.error === 'string' && obj.error && !isHtml(obj.error)) {
      return obj.error;
    }
  }

  if (apiError.message && !isHtml(apiError.message)) {
    return apiError.message;
  }

  return fallback;
}
