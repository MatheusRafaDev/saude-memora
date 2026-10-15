/**
 * Sessão no cliente.
 *
 * A autenticação é baseada em cookie `HttpOnly` emitido pelo servidor, portanto
 * o JavaScript da aplicação não lê, não guarda e não escreve o token de sessão.
 * Antes existia aqui um `setStoredAuthToken` que gravava o JWT em um cookie legível
 * por script, anulando o `HttpOnly` e reabrindo a superfície de XSS.
 *
 * Em `signOut` o cookie é removido apenas como limpeza defensiva de versões antigas;
 * a invalidação real acontece no servidor (SecurityStamp + expiração do cookie).
 */
export const AUTH_TOKEN_COOKIE = 'auth_token';

export function clearStoredAuthToken(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecureContext =
    window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const secureValue = isSecureContext ? '; Secure' : '';

  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT${secureValue}`;
}
