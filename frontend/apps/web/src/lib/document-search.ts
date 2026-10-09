export type DocumentSearchItem = Record<string, unknown>;

export interface DocumentSearchFilters {
  query: string;
  category: string;
  period: string;
  status: string;
  dateFrom?: string;
  dateTo?: string;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function searchableText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(searchableText).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(searchableText).join(' ');
  }
  return '';
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (brazilianDate || isoDate) {
    const parts = brazilianDate ?? isoDate;
    if (!parts) return null;
    const year = Number(brazilianDate ? parts[3] : parts[1]);
    const month = Number(parts[2]);
    const day = Number(brazilianDate ? parts[1] : parts[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesStatus(document: DocumentSearchItem, selectedStatus: string) {
  if (selectedStatus === 'all') return true;

  const status = String(document.status ?? '').toLocaleLowerCase('pt-BR');
  if (selectedStatus === 'processing') return status === 'pending' || status === 'processing';
  if (selectedStatus === 'failed') return status === 'failed';
  if (selectedStatus === 'rejected') return status === 'rejeitado' || status === 'rejected';
  if (selectedStatus === 'review') return Boolean(document.revisaoPendente);
  if (selectedStatus === 'ready') {
    return (status === 'pronto' || status === 'ready') && !document.revisaoPendente;
  }
  return true;
}

export function filterDocuments(
  documents: DocumentSearchItem[],
  filters: DocumentSearchFilters,
  today = new Date(),
) {
  const now = today.getTime();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
  const startOfYear = new Date(today.getFullYear(), 0, 1).getTime();
  const query = normalizeText(filters.query.trim());
  const dateFrom = parseDate(filters.dateFrom);
  const dateTo = parseDate(filters.dateTo);
  if (dateTo) dateTo.setHours(23, 59, 59, 999);

  return documents.filter((document) => {
    const fullText = normalizeText(searchableText([
      document.titulo,
      document.tipo,
      document.medico,
      document.clinica,
      document.resumo,
      document.diagnostico,
      document.conteudo,
      document.textoExtraido,
      document.resultado,
      document.conclusoes,
      document.observacoes,
      document.medicamentos,
      document.resultadosExame,
      document.conteudoIndentado,
    ]));
    if (query && !fullText.includes(query)) return false;

    if (filters.category !== 'all' && !normalizeText(String(document.tipo ?? '')).includes(normalizeText(filters.category))) {
      return false;
    }
    if (!matchesStatus(document, filters.status)) return false;

    const documentDate = parseDate(document.data) ?? parseDate(document.criadoEm);
    if ((dateFrom || dateTo || filters.period !== 'all') && !documentDate) return false;
    if (dateFrom && documentDate && documentDate < dateFrom) return false;
    if (dateTo && documentDate && documentDate > dateTo) return false;
    if (filters.period === '30days' && documentDate && documentDate.getTime() < thirtyDaysAgo) return false;
    if (filters.period === '6months' && documentDate && documentDate.getTime() < sixMonthsAgo) return false;
    if (filters.period === 'thisyear' && documentDate && documentDate.getTime() < startOfYear) return false;

    return true;
  });
}
