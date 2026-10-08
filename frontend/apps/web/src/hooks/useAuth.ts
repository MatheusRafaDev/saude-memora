import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearStoredAuthToken } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('O servidor não conseguiu encerrar sua sessão.');
      }

      clearStoredAuthToken();
      queryClient.clear();
      window.location.replace('/');
    } catch (error) {
      setIsSigningOut(false);
      toast({
        title: 'Não foi possível sair da conta',
        description: error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return { signOut, isSigningOut };
}
