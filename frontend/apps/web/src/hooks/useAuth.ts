import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';
import { clearStoredAuthToken } from '@/lib/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      // Best-effort: notify server to revoke session. Ignore server errors (5xx)
      // so that logout always succeeds client-side.
      await customFetch('/api/auth/logout', {
        method: 'POST',
      }).catch(() => {
        // Server error (e.g. 500) — still proceed with client-side logout
      });
    } finally {
      clearStoredAuthToken();
      queryClient.clear();
      window.location.replace('/');
    }
  };

  return { signOut, isSigningOut };
}
