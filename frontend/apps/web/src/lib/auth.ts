/**
 * Sessão no cliente.
 *
 * A autenticação é baseada em cookie emitido pelo servidor e validada rapidamente
 * pelo cliente através da presença de cookies de sessão (`auth_session`, `auth_token`, etc.).
 */
export const AUTH_TOKEN_COOKIE = 'auth_token';
export const AUTH_SESSION_COOKIE = 'auth_session';

/**
 * Verifica de forma síncrona e instantânea (0ms) se existe algum cookie de autenticação ativo.
 * Isso evita requisições de rede pesadas quando o usuário não está logado.
 */
export function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const cookies = document.cookie;
  if (!cookies) return false;
  return /(?:^|;\s*)(?:auth_token|auth_session|has_session)\s*=\s*[^;]+/.test(cookies);
}

/**
 * Marca a sessão ativa no cliente logo após login/cadastro bem-sucedido.
 */
export function setClientAuthSession(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${AUTH_SESSION_COOKIE}=1; Path=/; Max-Age=2592000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

export function clearStoredAuthToken(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecureContext =
    window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const secureValue = isSecureContext ? '; Secure' : '';

  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureValue}`;
  document.cookie = `${AUTH_SESSION_COOKIE}=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureValue}`;
  document.cookie = `has_session=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureValue}`;
}
