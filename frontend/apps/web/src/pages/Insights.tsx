import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import {
  Activity,
  BarChart3,
  FileBarChart,
  LoaderCircle,
  Search,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { customFetch } from '@workspace/api-client-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getApiErrorMessage } from '@/lib/api-error-message';


type InsightTab = 'relatorio' | 'exames' | 'catalogos';
type CatalogKind = 'cid10' | 'cnes' | 'medicamentos';
type Analito = { nomeNormalizado: string; nome: string; unidade: string; count: number };
type ExamPoint = {
  data: string;
  valor: number;
  unidade: string;
  refMin?: number | null;
  refMax?: number | null;
  status: string;
  documentoId: string;
  isOutlier: boolean;
  outlierMotivo?: string | null;
};
type CatalogEntry = { title: string; description: string; metadata: string };
type ApiRecord = Record<string, unknown>;

function field(record: ApiRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export default function Insights({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<InsightTab>('relatorio');
  const [months, setMonths] = useState(6);
  const [report, setReport] = useState('');
  const [reportError, setReportError] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [analytes, setAnalytes] = useState<Analito[]>([]);
  const [selectedAnalyte, setSelectedAnalyte] = useState('');
  const [seriesMonths, setSeriesMonths] = useState(12);
  const [series, setSeries] = useState<ExamPoint[]>([]);
  const [isLoadingAnalytes, setIsLoadingAnalytes] = useState(true);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [seriesError, setSeriesError] = useState('');
  const [catalogKind, setCatalogKind] = useState<CatalogKind>('cid10');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([]);
  const [hasSearchedCatalog, setHasSearchedCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    customFetch<Analito[]>('/api/exames/analitos', { signal: controller.signal })
      .then((result) => {
        const available = Array.isArray(result) ? result : [];
        setAnalytes(available);
        if (available.length) setSelectedAnalyte((current) => current || available[0].nomeNormalizado);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSeriesError(getApiErrorMessage(error, 'Não foi possível carregar os exames.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingAnalytes(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedAnalyte) {
      setSeries([]);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ analito: selectedAnalyte, meses: String(seriesMonths) });
    setIsLoadingSeries(true);
    setSeriesError('');
    customFetch<ExamPoint[]>(`/api/exames/serie?${params}`, { signal: controller.signal })
      .then((result) => setSeries(Array.isArray(result) ? result : []))
      .catch((error) => {
        if (!controller.signal.aborted) setSeriesError(getApiErrorMessage(error, 'Não foi possível carregar a série histórica.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingSeries(false);
      });
    return () => controller.abort();
  }, [selectedAnalyte, seriesMonths]);

  const generateReport = async (event: FormEvent) => {
    event.preventDefault();
    setIsGeneratingReport(true);
    setReportError('');
    setReport('');
    try {
      const result = await customFetch<{ report?: string }>(`/api/reports/generate?months=${months}`);
      if (!result.report?.trim()) throw new Error('O relatório veio vazio.');
      setReport(result.report);
    } catch (error) {
      setReportError(getApiErrorMessage(error, 'Não foi possível gerar o relatório.'));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const searchCatalog = async (event: FormEvent) => {
    event.preventDefault();
    const query = catalogQuery.trim();
    if (query.length < 3) return;

    const endpoint = catalogKind === 'cid10'
      ? '/api/catalogo-cid10'
      : catalogKind === 'cnes'
        ? '/api/catalogo-cnes'
        : '/api/catalogo-medicamentos';
    const params = new URLSearchParams({ query, limit: '20' });
    setIsSearchingCatalog(true);
    setCatalogError('');
    setHasSearchedCatalog(true);
    setCatalogEntries([]);
    try {
      const result = await customFetch<ApiRecord>(`${endpoint}?${params}`);
      const property = catalogKind === 'medicamentos' ? 'medicamentos' : 'registros';
      const records = Array.isArray(result[property]) ? result[property] as ApiRecord[] : [];
      setCatalogEntries(records.map((record) => {
        if (catalogKind === 'medicamentos') {
          return {
            title: field(record, 'nome') || 'Medicamento',
            description: field(record, 'principioAtivo') || field(record, 'descricao'),
            metadata: [field(record, 'fabricante'), field(record, 'classeTerapeutica'), field(record, 'registroAnvisa')].filter(Boolean).join(' · '),
          };
        }
        return {
          title: [field(record, 'codigo'), field(record, 'descricao')].filter(Boolean).join(' · ') || 'Registro',
          description: field(record, 'descricaoNormalizada'),
          metadata: [field(record, 'categoria'), field(record, 'nivel'), field(record, 'origem')].filter(Boolean).join(' · '),
        };
      }));
    } catch (error) {
      setCatalogError(getApiErrorMessage(error, 'Não foi possível pesquisar o catálogo.'));
    } finally {
      setIsSearchingCatalog(false);
    }
  };

  return (
    <div className={embedded ? 'w-full' : 'mx-auto w-full max-w-[1240px] px-5 pb-16 pt-9 sm:px-10'}>
      {!embedded && <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">Seu histórico de saúde</div>
          <h1 className="mb-0 mt-2 text-3xl font-extrabold text-[#14211F] sm:text-4xl">Análises</h1>
          <p className="mb-0 mt-1.5 text-sm text-[#5B6878]">Relatórios, tendências de exames e referências clínicas.</p>
        </div>
        <Link href="/documentos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-4 text-sm font-semibold text-[#14211F] hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all shadow-xs">
          <FileBarChart size={16} /> Ver documentos
        </Link>
      </header>}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as InsightTab)}>
        <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-[#E3E8F0] bg-white p-1">
          <TabsTrigger value="relatorio" className="min-h-10 flex-1 gap-2 text-[#14211F] data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white font-semibold"><FileBarChart size={16} /> Relatório</TabsTrigger>
          <TabsTrigger value="exames" className="min-h-10 flex-1 gap-2 text-[#14211F] data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white font-semibold"><Activity size={16} /> Exames</TabsTrigger>
          <TabsTrigger value="catalogos" className="min-h-10 flex-1 gap-2 text-[#14211F] data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white font-semibold"><Search size={16} /> Catálogos</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio" className="mt-0">
          <section className="rounded-2xl border border-[#E3E8F0] bg-white p-5 sm:p-7 shadow-xs">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]"><FileBarChart size={19} /></div>
              <div><h2 className="m-0 text-lg font-bold text-[#14211F]">Relatório de saúde</h2><p className="mb-0 mt-1 text-sm text-[#5B6878]">Gera um resumo com os registros disponíveis no período.</p></div>
            </div>
            <form onSubmit={generateReport} className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-xs font-semibold text-[#5B6878]">
                Período
                <select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="h-11 min-w-40 rounded-xl border border-[#E3E8F0] bg-white px-3 text-sm text-[#14211F] focus:border-[#1D4ED8] outline-none">
                  {[3, 6, 12, 24].map((value) => <option key={value} value={value}>{value} meses</option>)}
                </select>
              </label>
              <button type="submit" disabled={isGeneratingReport} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all shadow-xs disabled:opacity-50">
                {isGeneratingReport ? <LoaderCircle size={16} className="animate-spin" /> : <FileBarChart size={16} />}
                Gerar relatório
              </button>
            </form>
            {reportError && <p role="alert" className="mt-4 rounded-xl border border-[#E8664A]/30 bg-[#FDE1DA] p-3 text-sm text-[#9B2C16]">{reportError}</p>}
            {report && <article className="prose prose-sm mt-6 max-w-none rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] p-5 text-[#14211F]"><ReactMarkdown>{report}</ReactMarkdown></article>}
          </section>
        </TabsContent>

        <TabsContent value="exames" className="mt-0">
          <section className="rounded-2xl border border-[#E3E8F0] bg-white p-5 sm:p-7 shadow-xs">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]"><Activity size={19} /></div>
              <div><h2 className="m-0 text-lg font-bold text-[#14211F]">Tendências dos exames</h2><p className="mb-0 mt-1 text-sm text-[#5B6878]">Compare resultados registrados para o mesmo analito.</p></div>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <label className="grid gap-1.5 text-xs font-semibold text-[#5B6878]">
                Analito
                <select value={selectedAnalyte} onChange={(event) => setSelectedAnalyte(event.target.value)} disabled={isLoadingAnalytes || !analytes.length} className="h-11 w-full rounded-xl border border-[#E3E8F0] bg-white px-3 text-sm text-[#14211F] focus:border-[#1D4ED8] outline-none">
                  {isLoadingAnalytes && <option value="">Carregando…</option>}
                  {!isLoadingAnalytes && !analytes.length && <option value="">Nenhum analito encontrado</option>}
                  {analytes.map((item) => <option key={item.nomeNormalizado} value={item.nomeNormalizado}>{item.nome} ({item.count})</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#5B6878]">
                Período
                <select value={seriesMonths} onChange={(event) => setSeriesMonths(Number(event.target.value))} className="h-11 rounded-xl border border-[#E3E8F0] bg-white px-3 text-sm text-[#14211F] focus:border-[#1D4ED8] outline-none">
                  {[6, 12, 24, 60].map((value) => <option key={value} value={value}>{value} meses</option>)}
                </select>
              </label>
            </div>
            {seriesError && <p role="alert" className="rounded-xl border border-[#E8664A]/30 bg-[#FDE1DA] p-3 text-sm text-[#9B2C16]">{seriesError}</p>}
            {isLoadingSeries ? (
              <div role="status" className="flex min-h-72 items-center justify-center gap-2 text-sm text-[#5B6878]"><LoaderCircle size={18} className="animate-spin" /> Carregando série…</div>
            ) : series.length ? (
              <>
                <div className="h-[320px] w-full" role="img" aria-label={`Gráfico de ${analytes.find((item) => item.nomeNormalizado === selectedAnalyte)?.nome || selectedAnalyte}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 12, right: 18, left: 0, bottom: 14 }}>
                      <CartesianGrid stroke="#E3E8F0" strokeDasharray="4 4" />
                      <XAxis dataKey="data" stroke="#5B6878" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#5B6878" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="valor" name={series[0].unidade || 'Resultado'} stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 4, fill: '#E8664A', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-2 border-t border-[#E3E8F0] pt-4">
                  {series.map((point, index) => (
                    <div key={`${point.documentoId}-${index}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-[#5B6878]">{point.data}{point.isOutlier ? ` · ${point.outlierMotivo || 'Valor atípico'}` : ''}</span>
                      <span className="font-semibold text-[#14211F]">{point.valor} {point.unidade} <span className="font-normal text-[#5B6878]">({point.status})</span> · <Link href={`/documentos/${point.documentoId}`} className="text-[#1D4ED8] hover:underline font-semibold">Documento</Link></span>
                    </div>
                  ))}
                </div>
              </>
            ) : !seriesError && !isLoadingAnalytes ? (
              <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">Não há resultados suficientes para este analito no período.</p>
            ) : null}
          </section>
        </TabsContent>

        <TabsContent value="catalogos" className="mt-0">
          <section className="rounded-2xl border border-[#E3E8F0] bg-white p-5 sm:p-7 shadow-xs">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]"><Search size={19} /></div>
              <div><h2 className="m-0 text-lg font-bold text-[#14211F]">Catálogos clínicos</h2><p className="mb-0 mt-1 text-sm text-[#5B6878]">Pesquise medicamentos, códigos CID-10 e estabelecimentos CNES.</p></div>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] p-1">
              {([
                ['cid10', 'CID-10'],
                ['cnes', 'CNES'],
                ['medicamentos', 'Medicamentos'],
              ] as const).map(([kind, label]) => (
                <button key={kind} type="button" onClick={() => { setCatalogKind(kind); setCatalogEntries([]); setCatalogError(''); setHasSearchedCatalog(false); }} aria-pressed={catalogKind === kind} className={`min-h-10 rounded-lg px-2 text-xs font-semibold sm:text-sm transition-all ${catalogKind === kind ? 'bg-[#1D4ED8] text-white shadow-xs' : 'text-[#5B6878] hover:text-[#14211F] hover:bg-white'}`}>
                  {label}
                </button>
              ))}
            </div>
            <form onSubmit={searchCatalog} className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="catalog-query">Pesquisar no catálogo</label>
              <input id="catalog-query" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} minLength={3} placeholder={catalogKind === 'cid10' ? 'Código ou descrição CID-10' : catalogKind === 'cnes' ? 'Código ou nome do estabelecimento' : 'Medicamento ou princípio ativo'} className="h-11 min-w-0 flex-1 rounded-xl border border-[#E3E8F0] px-3 text-sm text-[#14211F] outline-none focus:border-[#1D4ED8]" />
              <button type="submit" disabled={catalogQuery.trim().length < 3 || isSearchingCatalog} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all shadow-xs disabled:opacity-50">
                {isSearchingCatalog ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />} Pesquisar
              </button>
            </form>
            {catalogError && <p role="alert" className="mt-4 rounded-xl border border-[#E8664A]/30 bg-[#FDE1DA] p-3 text-sm text-[#9B2C16]">{catalogError}</p>}
            {catalogEntries.length > 0 && (
              <div className="mt-5 divide-y divide-[#E3E8F0] border-y border-[#E3E8F0]">
                {catalogEntries.map((entry, index) => (
                  <article key={`${entry.title}-${index}`} className="py-4">
                    <h3 className="m-0 text-sm font-bold text-[#1d2a3d]">{entry.title}</h3>
                    {entry.description && <p className="mb-0 mt-1 text-sm text-[#5a6a80]">{entry.description}</p>}
                    {entry.metadata && <p className="mb-0 mt-1 text-xs text-[#718096]">{entry.metadata}</p>}
                  </article>
                ))}
              </div>
            )}
            {hasSearchedCatalog && !catalogError && !isSearchingCatalog && catalogEntries.length === 0 && <p className="mt-4 text-sm text-[#5a6a80]">Nenhum resultado para essa busca.</p>}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
