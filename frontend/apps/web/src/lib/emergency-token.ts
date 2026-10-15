import { customFetch } from '@workspace/api-client-react';

type EmergencyStatus = {
  possuiToken: boolean;
  expiraEm?: string | null;
};

type EmergencyTokenResponse = {
  token: string;
  expiraEm?: string | null;
};

/**
 * O token da ficha de emergência dá acesso anônimo a dados clínicos sensíveis.
 * Ele fica **somente em memória**: antes era gravado em `sessionStorage`/`localStorage`,
 * onde qualquer script (ou outra pessoa no mesmo dispositivo) poderia lê-lo.
 *
 * Consequência assumida: ao recarregar a página o token é perdido. Como o servidor
 * guarda apenas o hash, o token cru não pode ser recuperado — a aplicação então
 * orienta o usuário a gerar um novo (`needsRotation`), o que também rotaciona o link
 * anterior e reduz a janela de exposição.
 */
let tokenEmMemoria: { pacienteId: string; token: string } | null = null;

export async function getEmergencyToken(patientId: string) {
  const status = await customFetch<EmergencyStatus>('/api/pacientes/me/emergencia/status');

  if (status.possuiToken) {
    const token = tokenEmMemoria?.pacienteId === patientId ? tokenEmMemoria.token : null;

    if (!token) {
      // Token existe no servidor, mas não temos o valor em memória: precisa rotacionar.
      return { token: null, needsRotation: true, expiraEm: status.expiraEm ?? null };
    }

    return { token, needsRotation: false, expiraEm: status.expiraEm ?? null };
  }

  return gerarNovoToken(patientId);
}

export async function rotateEmergencyToken(patientId: string) {
  const { token } = await gerarNovoToken(patientId);
  return token;
}

/**
 * Revoga o token de emergência no servidor (invalida links e QR codes já compartilhados)
 * e limpa a cópia em memória.
 */
export async function revokeEmergencyToken() {
  await customFetch('/api/pacientes/me/emergencia', { method: 'DELETE' });
  tokenEmMemoria = null;
}

async function gerarNovoToken(patientId: string) {
  const result = await customFetch<EmergencyTokenResponse>('/api/pacientes/me/emergencia', {
    method: 'POST',
  });

  if (!result.token) {
    throw new Error('A API não retornou o token da ficha de emergência.');
  }

  tokenEmMemoria = { pacienteId: patientId, token: result.token };
  return { token: result.token, needsRotation: false, expiraEm: result.expiraEm ?? null };
}
