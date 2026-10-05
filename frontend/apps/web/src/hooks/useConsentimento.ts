import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';

export interface ConsentimentoIa {
  aceito: boolean;
  versaoTermo: string;
  aceitoEm?: string;
  ipTruncado?: string;
}

export function useConsentimento() {
  return useQuery<ConsentimentoIa>({
    queryKey: ['consentimento'],
    queryFn: async () => {
      const response = await customFetch<ConsentimentoIa>('/api/pacientes/me/consentimento', {
        method: 'GET',
      });
      return response;
    },
    retry: false,
  });
}

export function useSaveConsentimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aceito: boolean) => {
      const response = await customFetch<ConsentimentoIa>('/api/pacientes/me/consentimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceito }),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['consentimento'], data);
    },
  });
}

export function useRevokeConsentimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await customFetch('/api/pacientes/me/consentimento', {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentimento'] });
    },
  });
}
