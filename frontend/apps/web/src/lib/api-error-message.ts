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

  if (
    typeof apiError.data === 'object' &&
    apiError.data !== null &&
    'message' in apiError.data &&
    typeof apiError.data.message === 'string' &&
    !isHtml(apiError.data.message)
  ) {
    return apiError.data.message;
  }

  if (apiError.message && !isHtml(apiError.message)) {
    return apiError.message;
  }

  return fallback;
}
