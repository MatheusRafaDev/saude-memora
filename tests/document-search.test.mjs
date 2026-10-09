import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDocuments } from '../frontend/apps/web/src/lib/document-search.ts';

const today = new Date(2026, 5, 15, 12);
const documents = [
  {
    id: 'exam',
    titulo: 'Hemograma completo',
    tipo: 'exame',
    status: 'pronto',
    data: '20/05/2026',
    criadoEm: '2026-06-10T10:00:00Z',
    textoExtraido: 'Hemoglobina e leucócitos',
    resumo: 'Exame de sangue',
  },
  {
    id: 'prescription',
    titulo: 'Receita médica',
    tipo: 'receita',
    status: 'failed',
    data: '09/05/2026',
    criadoEm: '2026-06-01T10:00:00Z',
    conteudo: 'Dipirona, tomar após as refeições',
  },
  {
    id: 'vaccine',
    titulo: 'Registro de vacina',
    tipo: 'vacina',
    status: 'processing',
    data: '02/01/2026',
  },
  {
    id: 'review',
    titulo: 'Laudo',
    tipo: 'laudo',
    status: 'pronto',
    revisaoPendente: true,
    data: '10/06/2026',
  },
];

const noFilters = {
  query: '',
  category: 'all',
  period: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
};

test('pesquisa por título e conteúdo extraído sem diferenciar acentos ou maiúsculas', () => {
  assert.deepEqual(
    filterDocuments(documents, { ...noFilters, query: 'HEMOGLOBINA' }, today).map((document) => document.id),
    ['exam'],
  );
  assert.deepEqual(
    filterDocuments(documents, { ...noFilters, query: 'apos as refeicoes' }, today).map((document) => document.id),
    ['prescription'],
  );
});

test('combina filtros de tipo e status', () => {
  assert.deepEqual(
    filterDocuments(documents, { ...noFilters, category: 'receita', status: 'failed' }, today).map((document) => document.id),
    ['prescription'],
  );
  assert.deepEqual(
    filterDocuments(documents, { ...noFilters, status: 'review' }, today).map((document) => document.id),
    ['review'],
  );
});

test('filtra por período informado usando a data do documento antes da data de cadastro', () => {
  assert.deepEqual(
    filterDocuments(documents, { ...noFilters, dateFrom: '2026-05-01', dateTo: '2026-05-31' }, today)
      .map((document) => document.id),
    ['exam', 'prescription'],
  );
  assert.deepEqual(
    filterDocuments(documents, { ...noFilters, period: '30days' }, today).map((document) => document.id),
    ['exam', 'review'],
  );
});
