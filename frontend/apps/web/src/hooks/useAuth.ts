import { clearStoredAuthToken } from '@/lib/auth';

export function useAuth() {
  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore logout API failures and proceed to redirect.
    }

    clearStoredAuthToken();
    window.location.href = '/entrar';
  };

  return { signOut };
}
