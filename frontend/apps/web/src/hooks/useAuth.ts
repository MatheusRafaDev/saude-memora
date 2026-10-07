import { clearStoredAuthToken } from '@/lib/auth';

export function useAuth() {
  const signOut = () => {
    clearStoredAuthToken();
    window.location.href = '/entrar';
  };

  return { signOut };
}
