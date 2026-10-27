/**
 * Sessão no cliente.
 *
 * A autenticação é baseada em cookie HttpOnly de 30 dias emitido pelo servidor e validada
 * rapidamente pelo cliente através de cookies e storage local (`auth_session`, `auth_token`, etc.).
 */
export const AUTH_TOKEN_COOKIE = 'auth_token';
export const AUTH_SESSION_COOKIE = 'auth_session';
export const AUTH_STORAGE_KEY = 'saude_memora_logged_in';

// 30 dias de persistência (30 dias * 24h * 60m * 60s)
export const AUTH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 2.592.000 segundos

/**
 * Verifica de forma síncrona e instantânea (0ms) se existe algum registro de autenticação ativo.
 * Combina cookies e localStorage para evitar deslogamentos acidentais no mobile (iOS Safari ITP,
 * PWAs e suspensões de abas em segundo plano) e no PC.
 */
export function hasAuthCookie(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // 1. Checa presença de cookies no document.cookie
  try {
    const cookies = document.cookie;
    if (cookies && /(?:^|;\s*)(?:auth_token|auth_session|has_session)\s*=\s*[^;]+/.test(cookies)) {
      return true;
    }
  } catch {
    // Continua para o fallback de localStorage
  }

  // 2. Fallback de localStorage (extremamente confiável em Mobile/iOS WebKit e PWAs)
  try {
    const hasLocalSession =
      localStorage.getItem(AUTH_SESSION_COOKIE) === '1' ||
      localStorage.getItem(AUTH_STORAGE_KEY) === '1';

    if (hasLocalSession) {
      // Se tiver no storage, restaura o cookie no document para consistência
      if (typeof document !== 'undefined') {
        const isSecure = window.location.protocol === 'https:';
        const expires = new Date(Date.now() + AUTH_MAX_AGE_SECONDS * 1000).toUTCString();
        document.cookie = `${AUTH_SESSION_COOKIE}=1; Path=/; Max-Age=${AUTH_MAX_AGE_SECONDS}; Expires=${expires}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      }
      return true;
    }
  } catch {
    // Ignora erro em modo privado estrito
  }

  return false;
}

/**
 * Marca a sessão ativa no cliente por 30 dias logo após login/cadastro bem-sucedido
 * ou em checagens bem-sucedidas de sessão ativa.
 */
export function setClientAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const isSecure = window.location.protocol === 'https:';
  const expires = new Date(Date.now() + AUTH_MAX_AGE_SECONDS * 1000).toUTCString();

  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_SESSION_COOKIE}=1; Path=/; Max-Age=${AUTH_MAX_AGE_SECONDS}; Expires=${expires}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  }

  try {
    localStorage.setItem(AUTH_SESSION_COOKIE, '1');
    localStorage.setItem(AUTH_STORAGE_KEY, '1');
    localStorage.setItem('saude_memora_session_ts', Date.now().toString());
  } catch {
    // Ignora falha de armazenamento em ambientes restritos
  }
}

/**
 * Limpa todos os cookies e chaves locais ao sair explicitamente da conta.
 */
export function clearStoredAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const isSecureContext =
    window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const secureValue = isSecureContext ? '; Secure' : '';

  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureValue}`;
    document.cookie = `${AUTH_SESSION_COOKIE}=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureValue}`;
    document.cookie = `has_session=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureValue}`;
  }

  try {
    localStorage.removeItem(AUTH_SESSION_COOKIE);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('saude_memora_session_ts');
  } catch {
    // Ignora
  }
}

