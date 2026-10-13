export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;

  const apiError = error as { data?: unknown; message?: string };
  if (Array.isArray(apiError.data)) {
    const message = apiError.data.find((item): item is string => typeof item === 'string');
    if (message) return message;
  }

  if (typeof apiError.data === 'string' && apiError.data) return apiError.data;
  if (
    typeof apiError.data === 'object' &&
    apiError.data !== null &&
    'message' in apiError.data &&
    typeof apiError.data.message === 'string'
  ) {
    return apiError.data.message;
  }

  return apiError.message || fallback;
}
