export const AUTH_TOKEN_COOKIE = 'auth_token';

export function getStoredAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setStoredAuthToken(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toUTCString();
  const secureValue = isSecureContext ? '; Secure' : '';

  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; expires=${expires}${secureValue}`;
}

export function clearStoredAuthToken(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
}
