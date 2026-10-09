import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadableUploadError } from '../frontend/apps/web/src/lib/upload-errors.ts';

test('orienta sobre o limite de tamanho do arquivo', () => {
  assert.match(
    getReadableUploadError({ status: 413 }, 'Falha no envio.'),
    /até 10 MB/,
  );
});

test('explica como liberar o processamento quando falta consentimento', () => {
  assert.match(
    getReadableUploadError({ status: 403, data: { message: 'consentimento_necessario' } }, 'Falha no envio.'),
    /aceite o consentimento/,
  );
});

test('preserva uma mensagem compreensível do servidor', () => {
  assert.equal(
    getReadableUploadError({ data: { message: 'Formato de arquivo não suportado.' } }, 'Falha no envio.'),
    'Formato de arquivo não suportado.',
  );
});

test('traduz falhas de rede genéricas para a orientação alternativa', () => {
  assert.equal(
    getReadableUploadError(new Error('Failed to fetch'), 'Confira sua conexão.'),
    'Confira sua conexão.',
  );
  assert.equal(
    getReadableUploadError(null, 'Confira sua conexão.'),
    'Confira sua conexão.',
  );
});
