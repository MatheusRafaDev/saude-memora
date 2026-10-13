import { customFetch } from '@workspace/api-client-react';

type EmergencyStatus = {
  possuiToken: boolean;
  expiraEm?: string | null;
};

type EmergencyTokenResponse = {
  token: string;
  expiraEm?: string | null;
};

function tokenStorageKey(patientId: string) {
  return `saudememora:emergency-token:${patientId}`;
}

function storeToken(patientId: string, token: string) {
  window.sessionStorage.setItem(tokenStorageKey(patientId), token);
}

export async function getEmergencyToken(patientId: string) {
  const status = await customFetch<EmergencyStatus>('/api/pacientes/me/emergencia/status');
  const key = tokenStorageKey(patientId);
  let cachedToken = window.sessionStorage.getItem(key);

  // Migrate the token created by older app versions, then remove its persistent copy.
  if (!cachedToken) {
    cachedToken = window.localStorage.getItem(key);
    if (cachedToken) {
      window.sessionStorage.setItem(key, cachedToken);
      window.localStorage.removeItem(key);
    }
  }

  if (status.possuiToken) {
    return { token: cachedToken, needsRotation: !cachedToken };
  }

  window.sessionStorage.removeItem(tokenStorageKey(patientId));
  const result = await customFetch<EmergencyTokenResponse>('/api/pacientes/me/emergencia', {
    method: 'POST',
  });
  if (!result.token) throw new Error('A API não retornou o token da ficha de emergência.');
  storeToken(patientId, result.token);
  return { token: result.token, needsRotation: false };
}

export async function rotateEmergencyToken(patientId: string) {
  const result = await customFetch<EmergencyTokenResponse>('/api/pacientes/me/emergencia/rotate', {
    method: 'POST',
  });
  if (!result.token) throw new Error('A API não retornou o token da ficha de emergência.');
  storeToken(patientId, result.token);
  return result.token;
}
