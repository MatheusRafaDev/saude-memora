import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  customFetch,
  getGetApiPacientesMeQueryKey,
} from '@workspace/api-client-react';

export interface ConsentimentoIa {
  aceito: boolean;
  ocrAceito: boolean;
  chatAceito: boolean;
  versaoTermo: string;
  aceitoEm?: string;
  adiadoAte?: string;
  mostrarModal: boolean;
  ipTruncado?: string;
}

export type ConsentimentoUpdate = {
  aceito?: boolean;
  finalidade?: 'ocr' | 'chat';
  dispensar?: boolean;
};

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
    mutationFn: async (update: ConsentimentoUpdate) => {
      const response = await customFetch<ConsentimentoIa>('/api/pacientes/me/consentimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['consentimento'], data);
      void queryClient.invalidateQueries({ queryKey: getGetApiPacientesMeQueryKey() });
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
