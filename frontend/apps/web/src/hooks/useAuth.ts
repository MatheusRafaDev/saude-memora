import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';
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
      await customFetch('/api/auth/logout', {
        method: 'POST',
      });

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
