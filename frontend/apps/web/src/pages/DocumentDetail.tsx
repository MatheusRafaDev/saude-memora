import { useEffect, useState, useMemo } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import {
  ArrowLeft,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  AlertTriangle,
  Check,
  Edit2,
  X,
  FileText,
  Pill,
  LoaderCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Stethoscope,
  Activity,
  FileSearch,
  Info,
  Sparkles,
  ClipboardList,
  BookOpen,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  useGetApiDocumentsId,
  useDeleteApiDocumentsId,
  getGetApiDocumentsIdQueryKey,
  customFetch,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

import { getApiErrorMessage } from '@/lib/api-error-message';
import * as DialogPrimitive from '@radix-ui/react-dialog';

type MedicationEdit = { nome: string; dosagem: string; horario: string };
type ExamResultEdit = {
  nome: string;
  nomeNormalizado: string;
  valor: number | null;
  valorTexto: string;
  unidade: string;
  refMin: number | null;
  refMax: number | null;
  referenciaTexto: string;
  status: string;
  confianca: number;
  confirmacaoNecessaria: boolean;
  motivoConfirmacao: string;
};
type IndentedContentEdit = { tipo: string; texto: string; chave: string; valor: string };
type DocumentEditForm = {
  titulo: string;
  tipo: string;
  medico: string;
  clinica: string;
  data: string;
  resumo: string;
  diagnostico: string;
  crm: string;
  cid: string;
  cnes: string;
  nomeExame: string;
  tipoExame: string;
  resultado: string;
  especialidade: string;
  tipoClinico: string;
  conteudo: string;
  conclusoes: string;
  observacoes: string;
  textoExtraido: string;
  medicamentos: MedicationEdit[];
  conteudoIndentado: IndentedContentEdit[];
  resultadosExame: ExamResultEdit[];
};
type DocumentTextField = Exclude<
  keyof DocumentEditForm,
  'medicamentos' | 'conteudoIndentado' | 'resultadosExame'
>;

const documentTextFields: { key: DocumentTextField; label: string; multiline?: boolean }[] = [
  { key: 'titulo', label: 'Título' },
  { key: 'medico', label: 'Médico / solicitante' },
  { key: 'crm', label: 'CRM' },
  { key: 'clinica', label: 'Clínica' },
  { key: 'data', label: 'Data' },
  { key: 'cid', label: 'CID' },
  { key: 'cnes', label: 'CNES' },
  { key: 'nomeExame', label: 'Nome do exame' },
  { key: 'tipoExame', label: 'Tipo de exame' },
  { key: 'resultado', label: 'Resultado' },
  { key: 'resumo', label: 'Resumo', multiline: true },
  { key: 'diagnostico', label: 'Diagnóstico', multiline: true },
  { key: 'conclusoes', label: 'Conclusões', multiline: true },
  { key: 'observacoes', label: 'Observações', multiline: true },
];

const maskDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length <= 2 ? digits : digits.length <= 4 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

function createDocumentEditForm(doc: any): DocumentEditForm {
  const textValue = (value: unknown) => (typeof value === 'string' ? value : '');
  return {
    titulo: textValue(doc?.titulo),
    tipo: textValue(doc?.tipo),
    medico: textValue(doc?.medico),
    clinica: textValue(doc?.clinica),
    data: typeof doc?.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(doc.data) ? `${doc.data.slice(8, 10)}/${doc.data.slice(5, 7)}/${doc.data.slice(0, 4)}` : textValue(doc?.data),
    resumo: textValue(doc?.resumo),
    diagnostico: textValue(doc?.diagnostico),
    crm: textValue(doc?.crm).replace(/\D/g, ''),
    cid: textValue(doc?.cid),
    cnes: textValue(doc?.cnes),
    nomeExame: textValue(doc?.nomeExame),
    tipoExame: textValue(doc?.tipoExame),
    resultado: textValue(doc?.resultado),
    especialidade: textValue(doc?.especialidade),
    tipoClinico: textValue(doc?.tipoClinico),
    conteudo: textValue(doc?.conteudo),
    conclusoes: textValue(doc?.conclusoes),
    observacoes: textValue(doc?.observacoes),
    textoExtraido: textValue(doc?.textoExtraido),
    medicamentos: Array.isArray(doc?.medicamentos)
      ? doc.medicamentos.map((medication: any) => ({
          nome: textValue(medication?.nome),
          dosagem: textValue(medication?.dosagem),
          horario: textValue(medication?.horario),
        }))
      : [],
    conteudoIndentado: Array.isArray(doc?.conteudoIndentado)
      ? doc.conteudoIndentado.map((item: any) => ({
          tipo: textValue(item?.tipo),
          texto: textValue(item?.texto),
          chave: textValue(item?.chave),
          valor: textValue(item?.valor),
        }))
      : [],
    resultadosExame: Array.isArray(doc?.resultadosExame)
      ? doc.resultadosExame.map((result: any) => ({
          nome: textValue(result?.nome),
          nomeNormalizado: textValue(result?.nomeNormalizado),
          valor: typeof result?.valor === 'number' ? result.valor : null,
          valorTexto: textValue(result?.valorTexto),
          unidade: textValue(result?.unidade),
          refMin: typeof result?.refMin === 'number' ? result.refMin : null,
          refMax: typeof result?.refMax === 'number' ? result.refMax : null,
          referenciaTexto: textValue(result?.referenciaTexto),
          status: textValue(result?.status) || 'indefinido',
          confianca: typeof result?.confianca === 'number' ? result.confianca : 1,
          confirmacaoNecessaria: Boolean(result?.confirmacaoNecessaria),
          motivoConfirmacao: textValue(result?.motivoConfirmacao),
        }))
      : [],
  };
}

export type DetailTabKey = 'dados' | 'exames' | 'opiniao' | 'recomendacoes' | 'outros';

const TAB_PREF_KEY = 'saude_memora_doc_tab';
const getStoredTab = (): DetailTabKey | null => {
  try { return (localStorage.getItem(TAB_PREF_KEY) as DetailTabKey | null); } catch { return null; }
};
const storeTab = (key: DetailTabKey) => {
  try { localStorage.setItem(TAB_PREF_KEY, key); } catch { /* noop */ }
};

export default function DocumentDetail({ id: propId }: { id?: string }) {
  const [, params] = useRoute('/documentos/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deleteMutation = useDeleteApiDocumentsId();

  const id = propId || (params as any)?.id;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id || '');

  const {
    data: docRaw,
    refetch,
    isLoading,
    isError,
  } = useGetApiDocumentsId(id || '', {
    query: {
      queryKey: getGetApiDocumentsIdQueryKey(id || ''),
      enabled: isMongoId,
      refetchInterval: (query) => {
        const status = (query.state.data as any)?.status;
        return status === 'pending' || status === 'processing' ? 2000 : false;
      },
    },
  });

  const [activeTab, setActiveTab] = useState<DetailTabKey>(() => getStoredTab() ?? 'dados');
  const handleSetTab = (tab: DetailTabKey) => { setActiveTab(tab); storeTab(tab); };
  const [mobileView, setMobileView] = useState<'dados' | 'original'>('dados');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isConfirmingRevisao, setIsConfirmingRevisao] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [dismissingAlertId, setDismissingAlertId] = useState<string | null>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [hasCopiedExtractedText, setHasCopiedExtractedText] = useState(false);
  const [formData, setFormData] = useState<DocumentEditForm>(() => createDocumentEditForm(null));
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set());
  const [cidSuggestions, setCidSuggestions] = useState<any[]>([]);
  const [cnesSuggestions, setCnesSuggestions] = useState<any[]>([]);
  const [cnesSearchQuery, setCnesSearchQuery] = useState('');
  const [bulaResults, setBulaResults] = useState<Record<number, any>>({});
  const [bulaErrors, setBulaErrors] = useState<Record<number, string>>({});
  const [loadingBulaIndex, setLoadingBulaIndex] = useState<number | null>(null);
  const [lastKnownStatus, setLastKnownStatus] = useState<string | null>(null);

  const doc = (docRaw as any) || null;
  const isProcessing = doc?.status === 'processing' || doc?.status === 'pending';
  const progressPercent = typeof doc?.progress === 'number' && doc.progress >= 0 ? doc.progress : (doc?.status === 'processing' ? 45 : 15);

  // Notifica o usuário e destrava a interface quando o processamento for concluído
  useEffect(() => {
    if (!doc?.status) return;
    if (
      lastKnownStatus &&
      (lastKnownStatus === 'processing' || lastKnownStatus === 'pending') &&
      (doc.status === 'pronto' || doc.status === 'revisar')
    ) {
      toast({
        title: 'Processamento concluído!',
        description: 'Os dados do documento foram extraídos e o zoom no original já está disponível.',
      });
    }
    setLastKnownStatus(doc.status);
  }, [doc?.status, lastKnownStatus, toast]);

  // Se o documento estiver em processamento, garante que o modal de zoom fica fechado
  useEffect(() => {
    if (isProcessing && isZoomModalOpen) {
      setIsZoomModalOpen(false);
    }
  }, [isProcessing, isZoomModalOpen]);

  useEffect(() => {
    if (!doc) return;
    setFormData(createDocumentEditForm(doc));
  }, [doc]);

  useEffect(() => {
    if (!isEditingModalOpen || formData.cid.trim().length < 3) {
      setCidSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query: formData.cid.trim(), limit: '8' });
        const result = await customFetch<{ registros?: any[] }>(`/api/catalogo-cid10?${params}`, { signal: controller.signal });
        setCidSuggestions(Array.isArray(result.registros) ? result.registros : []);
      } catch {
        if (!controller.signal.aborted) setCidSuggestions([]);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [formData.cid, isEditingModalOpen]);

  useEffect(() => {
    const query = cnesSearchQuery.trim();
    if (!isEditingModalOpen || query.length < 3) {
      setCnesSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query, limit: '8' });
        const result = await customFetch<{ registros?: any[] }>(`/api/catalogo-cnes?${params}`, { signal: controller.signal });
        setCnesSuggestions(Array.isArray(result.registros) ? result.registros : []);
      } catch {
        if (!controller.signal.aborted) setCnesSuggestions([]);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [cnesSearchQuery, isEditingModalOpen]);

  const docTitle = doc?.titulo || 'Documento';
  const documentDate = doc?.data || doc?.criadoEm || doc?.createdAt;
  const parsedDocumentDate = documentDate ? new Date(documentDate) : null;
  const docDate =
    parsedDocumentDate && !Number.isNaN(parsedDocumentDate.getTime())
      ? parsedDocumentDate.toLocaleDateString('pt-BR')
      : (typeof doc?.data === 'string' && doc.data ? doc.data : 'Data não informada');
  const isReviewPending = Boolean(doc?.revisaoPendente);
  const imageUrls: string[] = Array.isArray(doc?.urlImagens) ? doc.urlImagens : [];
  const totalPages = imageUrls.length > 0 ? imageUrls.length : (doc?.fileUrl ? 1 : 0);
  const currentImageUrl = imageUrls[currentPageIndex] || imageUrls[0] || doc?.fileUrl || null;
  const fileUrl = currentImageUrl;
  const examResults = Array.isArray(doc?.resultadosExame) ? doc.resultadosExame : [];
  const medications = Array.isArray(doc?.medicamentos) ? doc.medicamentos : [];
  const alerts = Array.isArray(doc?.alertas) ? doc.alertas : [];
  const activeAlerts = alerts.filter((alert: any) => alert.dispensado !== true);

  const hasExames = Boolean(
    examResults.length > 0 ||
    doc?.nomeExame ||
    doc?.tipoExame ||
    (doc?.resultado && String(doc.resultado).trim().length > 0) ||
    ['exame', 'laudo'].includes(String(doc?.tipo || '').toLowerCase())
  );

  const hasOpiniao = Boolean(
    (doc?.diagnostico && String(doc.diagnostico).trim().length > 0) ||
    (doc?.conclusoes && String(doc.conclusoes).trim().length > 0) ||
    (doc?.tipoClinico && String(doc.tipoClinico).trim().length > 0) ||
    (doc?.conteudo && String(doc.conteudo).trim().length > 0)
  );

  const hasRecomendacoes = Boolean(
    medications.length > 0 ||
    activeAlerts.length > 0 ||
    String(doc?.tipo || '').toLowerCase() === 'receita'
  );

  const hasOutros = Boolean(
    (doc?.resumo && String(doc.resumo).trim().length > 0) ||
    (doc?.observacoes && String(doc.observacoes).trim().length > 0)
  );

  const availableTabs = useMemo(() => {
    const list: { key: DetailTabKey; label: string; icon: any; count?: number | string }[] = [
      { key: 'dados', label: 'Dados lidos', icon: FileText },
    ];

    if (hasExames) {
      list.push({
        key: 'exames',
        label: 'Exames',
        icon: Activity,
        count: examResults.length > 0 ? examResults.length : (doc?.nomeExame ? '1' : undefined),
      });
    }

    if (hasOpiniao) {
      list.push({
        key: 'opiniao',
        label: 'Opinião',
        icon: Stethoscope,
      });
    }

    if (hasRecomendacoes) {
      list.push({
        key: 'recomendacoes',
        label: 'Recomendações',
        icon: Pill,
        count: medications.length > 0 ? medications.length : (activeAlerts.length > 0 ? '!' : undefined),
      });
    }

    if (hasOutros) {
      list.push({
        key: 'outros',
        label: 'Outras informações',
        icon: Info,
      });
    }

    return list;
  }, [hasExames, hasOpiniao, hasRecomendacoes, hasOutros, examResults.length, doc?.nomeExame, medications.length, activeAlerts.length]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((t: { key: DetailTabKey }) => t.key === activeTab)) {
      handleSetTab(availableTabs[0].key);
    }
  }, [availableTabs, activeTab]);
  const indentedContent: any[] = Array.isArray(doc?.conteudoIndentado) ? doc.conteudoIndentado : [];
  const lowConfidenceFields = Array.isArray(doc?.camposBaixaConfianca)
    ? doc.camposBaixaConfianca
    : [];
  const extractedText = typeof doc?.textoExtraido === 'string' && doc.textoExtraido.trim()
    ? doc.textoExtraido.trim()
    : null;
  const textSections = [
    ['Resumo', doc?.resumo],
    ['Diagnóstico registrado', doc?.diagnostico],
    ['Resultado do exame', doc?.resultado],
    ['Conteúdo clínico', doc?.conteudo],
    ['Conclusões', doc?.conclusoes],
    ['Observações', doc?.observacoes],
  ].filter(([, value]) => typeof value === 'string' && value.trim());

  const handleCopyExtractedText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setHasCopiedExtractedText(true);
    toast({ title: 'Texto extraído copiado!' });
    setTimeout(() => setHasCopiedExtractedText(false), 2000);
  };

  const handleDelete = async () => {
    if (!doc || !id || !isMongoId) return;
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: 'Documento excluído com sucesso' });
      window.dispatchEvent(new CustomEvent('document-deleted', { detail: { id } }));
      setLocation('/documentos');
    } catch {
      toast({ title: 'Erro ao excluir documento', variant: 'destructive' });
    }
  };

  const handleConfirmRevisao = async () => {
    if (!doc || !id || !isMongoId) return;
    setIsConfirmingRevisao(true);
    try {
      await customFetch(`/api/documents/${id}/revisao/confirmar`, { method: 'POST' });
      await refetch();
      toast({ title: 'Revisão confirmada com sucesso!' });
    } catch {
      toast({ title: 'Erro ao confirmar revisão', variant: 'destructive' });
    } finally {
      setIsConfirmingRevisao(false);
    }
  };

  const handleReprocess = async () => {
    if (!doc || doc.status !== 'failed' || !id || !isMongoId || isReprocessing) return;
    setIsReprocessing(true);
    try {
      await customFetch(`/api/documents/${id}/retry`, { method: 'POST' });
      await refetch();
      toast({ title: 'Documento recolocado na fila.' });
    } catch (error) {
      toast({ title: getApiErrorMessage(error, 'Não foi possível reprocessar o documento.'), variant: 'destructive' });
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    if (!id || !isMongoId || dismissingAlertId) return;
    setDismissingAlertId(alertId);
    try {
      await customFetch(`/api/documents/${id}/alertas/${alertId}/dispensar`, { method: 'POST' });
      await refetch();
      toast({ title: 'Alerta dispensado.' });
    } catch (error) {
      toast({ title: getApiErrorMessage(error, 'Não foi possível dispensar o alerta.'), variant: 'destructive' });
    } finally {
      setDismissingAlertId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!doc || !id || !isMongoId) return;
    try {
      await customFetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, camposConfirmados: [...confirmedFields] }),
      });
      await refetch();
      toast({ title: 'Documento atualizado com sucesso!' });
      setIsEditingModalOpen(false);
    } catch {
      toast({ title: 'Erro ao salvar alterações', variant: 'destructive' });
    }
  };

  const updateTextField = (key: DocumentTextField, value: string) => {
    if (key === 'data') value = maskDate(value);
    if (key === 'crm') value = value.replace(/\D/g, '');
    if (key === 'cnes') value = value.replace(/\D/g, '').slice(0, 7);
    setFormData((previous) => ({ ...previous, [key]: value }));
    setConfirmedFields((previous) => { const next = new Set(previous); next.delete(key); return next; });
    if (key === 'clinica' || key === 'cnes') setCnesSearchQuery(value);
  };

  const confidencePath = (path: string) => lowConfidenceFields.some((item: string) => item.toLowerCase() === path.toLowerCase());
  const fieldChanged = (path: string) => {
    const match = path.match(/^(medicamentos|resultadosExame)\[(\d+)\]\.(.+)$/i);
    if (match) {
      const [, collection, indexText, field] = match;
      const index = Number(indexText);
      const current = collection.toLowerCase() === 'medicamentos' ? formData.medicamentos[index]?.[field as keyof MedicationEdit] : formData.resultadosExame[index]?.[field as keyof ExamResultEdit];
      const original = collection.toLowerCase() === 'medicamentos' ? doc?.medicamentos?.[index]?.[field] : doc?.resultadosExame?.[index]?.[field];
      return current !== original;
    }
    const key = path.toLowerCase() as DocumentTextField;
    return formData[key] !== (doc?.[key] ?? '');
  };
  const confirmField = (path: string) => setConfirmedFields((previous) => new Set(previous).add(path));

  const handleSearchBula = async (index: number, nome: string) => {
    if (bulaResults[index]) {
      setBulaResults((previous) => ({ ...previous, [index]: undefined }));
      return;
    }
    if (!nome || nome.trim().length < 2) return;
    setLoadingBulaIndex(index);
    setBulaErrors((previous) => ({ ...previous, [index]: '' }));
    setBulaResults((previous) => ({ ...previous, [index]: undefined }));
    try {
      const result = await customFetch<any>(`/api/medicamentos/${encodeURIComponent(nome.trim())}/descricao`);
      setBulaResults((previous) => ({ ...previous, [index]: result }));
    } catch (error) {
      setBulaErrors((previous) => ({ ...previous, [index]: getApiErrorMessage(error, 'Não foi possível localizar a bula deste medicamento na base oficial.') }));
    } finally {
      setLoadingBulaIndex(null);
    }
  };

  const updateExamResultNumber = (
    index: number,
    field: 'valor' | 'refMin' | 'refMax' | 'confianca',
    rawValue: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      resultadosExame: previous.resultadosExame.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === 'confianca') return { ...item, confianca: Number(rawValue || 0) };
        const value = rawValue === '' ? null : Number(rawValue);
        if (field === 'valor') return { ...item, valor: value };
        if (field === 'refMin') return { ...item, refMin: value };
        return { ...item, refMax: value };
      }),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] items-center justify-center text-[#5a6a80]">
        <LoaderCircle size={22} className="mr-2 animate-spin text-[#1D4ED8]" />
        <span className="font-medium text-sm">Carregando documento…</span>
      </div>
    );
  }

  if (!isMongoId || isError || !doc) {
    return (
      <div className="flex-1 flex min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] items-center justify-center p-6">
        <main className="w-full max-w-2xl rounded-2xl border border-[#dde3ec] bg-white p-8 text-center">
          <FileText size={36} className="mx-auto mb-3 text-[#5a6a80]" />
          <h1 className="text-xl font-bold text-[#14211F]">Documento não encontrado</h1>
          <p className="mt-2 text-sm text-[#5a6a80]">
            Não foi possível carregar este documento da sua conta.
          </p>
          <Link href="/documentos" className="mt-5 inline-flex font-bold text-[#1D4ED8] hover:underline">
            Voltar aos documentos
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] flex-1 bg-white pb-16 font-sans text-[#14211F]">
      <main className="mx-auto max-w-[1240px] px-3.5 sm:px-8 lg:px-10 pb-16 pt-5 sm:pt-8">
        <Link
          href="/documentos"
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] px-4 text-sm font-semibold text-[#14211F] shadow-xs transition-colors hover:bg-[#E3E8F0]"
        >
          <ArrowLeft size={17} />
          Voltar aos documentos
        </Link>

        <div className="mb-3.5 flex items-center gap-2 text-sm text-[#5B6878]">
          <Link href="/documentos" className="transition-colors hover:text-[#1D4ED8]">
            Documentos
          </Link>
          <span>/</span>
          <span className="font-medium text-[#14211F]">{docTitle}</span>
        </div>

        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-5">
          <div>
            <h1 className="m-0 text-2xl sm:text-4xl font-bold tracking-tight text-[#14211F]">
              {docTitle}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {doc.tipo && (
                <span className="whitespace-nowrap rounded-full border border-[#E3E8F0] bg-[#F4F7FC] px-2.5 py-1 text-xs font-medium text-[#14211F]">
                  {doc.tipo}
                </span>
              )}
              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs">
                  <LoaderCircle size={12} className="animate-spin text-blue-600" />
                  <span>{doc.status === 'pending' ? 'Na fila' : 'Processando com IA'}</span>
                  {typeof doc.progress === 'number' && doc.progress > 0 && (
                    <span className="font-bold text-blue-800">({doc.progress}%)</span>
                  )}
                </span>
              )}
              {doc.status === 'failed' && (
                <span className="whitespace-nowrap rounded-full border border-[#E8664A]/30 bg-[#FDE1DA] px-2.5 py-1 text-xs font-semibold text-[#9B2C16]">
                  Falhou
                </span>
              )}
              {isReviewPending && (
                <span className="whitespace-nowrap rounded-full border border-[#E8664A]/30 bg-[#FDE1DA] px-2.5 py-1 text-xs font-semibold text-[#9B2C16]">
                  Conferir dados
                </span>
              )}
              {!isReviewPending && doc.status === 'pronto' && (
                <span className="whitespace-nowrap rounded-full bg-[#CFE0FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
                  Revisado
                </span>
              )}
              <span className="px-1 py-1 text-[13px] text-[#5B6878]">Adicionado em {docDate}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {doc.status === 'failed' && (
              <button
                type="button"
                onClick={handleReprocess}
                disabled={isReprocessing}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] px-4 text-sm font-bold text-[#14211F] shadow-xs transition-colors hover:bg-[#E3E8F0] disabled:opacity-50"
              >
                {isReprocessing ? <LoaderCircle size={16} className="animate-spin" /> : <RotateCw size={16} />}
                Tentar novamente
              </button>
            )}
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-5 text-sm font-bold text-[#14211F] shadow-xs transition-colors hover:bg-[#F4F7FC]"
              >
                <Download size={16} strokeWidth={2} /> Baixar
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Arquivo original indisponível"
                className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-5 text-sm font-bold text-[#5B6878] opacity-60"
              >
                <Download size={16} strokeWidth={2} /> Original indisponível
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E8664A]/30 bg-white px-5 text-sm font-bold text-[#E8664A] shadow-xs transition-colors hover:bg-[#FDE1DA]/40"
            >
              <Trash2 size={16} strokeWidth={2} /> Excluir
            </button>
          </div>
        </div>


        {doc.errorMessage && (
          <div role="status" className="mb-5 rounded-xl border border-[#E8664A]/30 bg-[#FDE1DA] px-4 py-3 text-sm text-[#9B2C16]">
            {doc.errorMessage}
          </div>
        )}

        {isReviewPending && (
          <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-[#E8664A]/30 bg-[#FDE1DA] p-4 text-[#9B2C16] sm:p-5">
            <AlertTriangle size={22} className="shrink-0 text-[#E8664A]" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <b className="block text-[15px] font-bold leading-tight">
                {lowConfidenceFields.length > 0
                  ? `${lowConfidenceFields.length} campo(s) precisam de conferência`
                  : 'Este documento precisa de conferência'}
              </b>
              <div className="mt-0.5 text-sm leading-relaxed text-[#9B2C16]/90">
                Os campos em destaque precisam ser conferidos. Compare com o original ao lado e confirme cada informação.
              </div>
            </div>
          </div>
        )}

        {/* Card Informativo de Status e Progresso de Processamento */}
        {isProcessing && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/50 p-4 sm:p-5 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <LoaderCircle size={20} className="animate-spin" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#14211F] m-0">
                      Documento em processamento
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                      Atualizando em tempo real
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6878] mt-0.5 mb-0">
                    A inteligência artificial está lendo e estruturando este documento clínico. O zoom na imagem original e a edição estarão liberados assim que a análise for finalizada.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-xs font-semibold text-[#5B6878]">Progresso:</span>
                <span className="text-sm font-bold text-blue-700">{progressPercent}%</span>
              </div>
            </div>

            {/* Barra de Progresso com Transição Suave */}
            <div className="mt-3.5">
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-blue-100/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(8, Math.min(100, progressPercent))}%` }}
                />
              </div>
            </div>

            {/* Etapas do Processamento */}
            <div className="mt-3.5 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Etapa 1: Upload */}
              <div className="flex items-center gap-2 rounded-xl bg-white border border-blue-100 p-2.5 shadow-2xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={13} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#14211F] truncate">1. Upload</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Arquivo salvo</div>
                </div>
              </div>

              {/* Etapa 2: OCR */}
              <div className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all ${
                progressPercent >= 40 
                  ? 'bg-white border-blue-100 shadow-2xs' 
                  : 'bg-blue-50/80 border-blue-200'
              }`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  progressPercent >= 40 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {progressPercent >= 40 ? <Check size={13} strokeWidth={2.5} /> : <LoaderCircle size={13} className="animate-spin" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#14211F] truncate">2. Leitura OCR</div>
                  <div className="text-[10px] text-[#5B6878]">
                    {progressPercent >= 40 ? 'Texto extraído' : 'Extraindo texto...'}
                  </div>
                </div>
              </div>

              {/* Etapa 3: IA */}
              <div className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all ${
                progressPercent >= 90
                  ? 'bg-white border-blue-100 shadow-2xs'
                  : progressPercent >= 40
                  ? 'bg-blue-50/80 border-blue-200'
                  : 'bg-white/50 border-[#E3E8F0] opacity-60'
              }`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  progressPercent >= 90
                    ? 'bg-emerald-100 text-emerald-700'
                    : progressPercent >= 40
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#E3E8F0] text-[#5B6878]'
                }`}>
                  {progressPercent >= 90 ? (
                    <Check size={13} strokeWidth={2.5} />
                  ) : progressPercent >= 40 ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#14211F] truncate">3. Análise IA</div>
                  <div className="text-[10px] text-[#5B6878]">
                    {progressPercent >= 90 ? 'Estruturado' : progressPercent >= 40 ? 'Identificando dados...' : 'Aguardando OCR'}
                  </div>
                </div>
              </div>

              {/* Etapa 4: Zoom & Conferência */}
              <div className="flex items-center gap-2 rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 shadow-2xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                  <Lock size={12} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-amber-900 truncate">4. Zoom no documento</div>
                  <div className="text-[10px] text-amber-800 font-medium truncate">Bloqueado até finalizar</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Switcher de visualização no Mobile (Evita página longa no celular) */}
        <div className="lg:hidden mb-4 grid grid-cols-2 gap-1 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileView('dados')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              mobileView === 'dados' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-[#5B6878] hover:text-[#14211F]'
            }`}
          >
            <FileText size={15} />
            <span>Dados em Abas</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('original')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              mobileView === 'original' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-[#5B6878] hover:text-[#14211F]'
            }`}
          >
            <ZoomIn size={15} />
            <span>Ver Original {totalPages > 0 ? `(${totalPages})` : ''}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
          {/* Seção do Documento Original */}
          <section className={`rounded-[20px] border border-[#E3E8F0] bg-white p-4 sm:p-6 shadow-xs lg:col-span-5 ${mobileView === 'dados' ? 'hidden lg:block' : 'block'}`}>
            <div className="mb-4 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <b className="font-serif text-base font-semibold text-[#14211F]">Documento original</b>
                {totalPages > 0 && (
                  <span className="rounded-full bg-[#F4F7FC] border border-[#E3E8F0] px-2 py-0.5 text-xs font-semibold text-[#5B6878]">
                    {totalPages} {totalPages === 1 ? 'pág' : 'págs'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 bg-[#F4F7FC] rounded-lg p-0.5 border border-[#E3E8F0]">
                    <button
                      type="button"
                      onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentPageIndex === 0}
                      className="p-1 rounded text-[#5B6878] hover:text-[#14211F] disabled:opacity-30 cursor-pointer"
                      title="Página anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-bold text-[#14211F] px-1">
                      {currentPageIndex + 1}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPageIndex === totalPages - 1}
                      className="p-1 rounded text-[#5B6878] hover:text-[#14211F] disabled:opacity-30 cursor-pointer"
                      title="Próxima página"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (isProcessing) {
                      toast({
                        title: 'Documento em processamento',
                        description: 'Aguarde a finalização do processamento para ampliar o documento.',
                      });
                      return;
                    }
                    setIsZoomModalOpen(true);
                  }}
                  disabled={!fileUrl || isProcessing}
                  className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isProcessing
                      ? 'bg-amber-50 border border-amber-200 text-amber-700 cursor-not-allowed opacity-80'
                      : 'bg-[#F4F7FC] hover:bg-[#E3E8F0] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer'
                  }`}
                  title={
                    isProcessing
                      ? 'Zoom indisponível: aguarde o término do processamento'
                      : fileUrl
                      ? 'Visualização detalhada e Zoom'
                      : 'Arquivo original indisponível'
                  }
                >
                  {isProcessing ? (
                    <Lock size={16} className="text-amber-700" />
                  ) : (
                    <ZoomIn size={18} className="text-[#1D4ED8]" />
                  )}
                </button>
              </div>
            </div>

            {fileUrl ? (
              <div
                onClick={() => {
                  if (isProcessing) {
                    toast({
                      title: 'Processamento em andamento',
                      description: 'O zoom no documento estará liberado assim que o processamento for finalizado.',
                    });
                    return;
                  }
                  setIsZoomModalOpen(true);
                }}
                className={`group relative flex min-h-[460px] sm:min-h-[520px] items-center justify-center overflow-hidden rounded-xl border transition-all ${
                  isProcessing
                    ? 'border-blue-200 bg-[#f4f7fc] cursor-not-allowed select-none'
                    : 'border-[#E3E8F0] bg-[#f8fafc] cursor-zoom-in hover:border-[#CFE0FF]'
                }`}
                title={
                  isProcessing
                    ? 'Processamento em andamento. O zoom estará liberado ao concluir.'
                    : 'Clique para abrir a visualização com zoom'
                }
              >
                <img
                  src={fileUrl}
                  alt={`Documento original: ${docTitle} (Pág ${currentPageIndex + 1})`}
                  className={`max-h-[580px] w-auto object-contain transition-all duration-300 ${
                    isProcessing
                      ? 'opacity-60 filter blur-[0.6px]'
                      : 'group-hover:scale-[1.02]'
                  }`}
                />

                {isProcessing ? (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md mb-3 text-white shadow-lg animate-pulse">
                      <LoaderCircle size={24} className="animate-spin text-white" />
                    </div>
                    <div className="text-sm font-bold tracking-tight text-white drop-shadow-xs">
                      Documento em processamento
                    </div>
                    <div className="mt-1 max-w-xs text-xs text-white/90 drop-shadow-xs leading-relaxed">
                      O zoom está temporariamente bloqueado para aguardar a finalização da análise.
                    </div>
                    <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white shadow-xs border border-white/25">
                      <Lock size={12} className="text-amber-300" />
                      <span>Zoom bloqueado até finalizar</span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none">
                    <ZoomIn size={12} />
                    <span>Clique para ampliar</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#E3E8F0] bg-[#F4F7FC] p-8 text-center">
                <FileText size={40} className="mb-3 text-[#5B6878]" />
                <p className="m-0 text-sm text-[#5B6878]">
                  O arquivo original não está disponível para este documento.
                </p>
              </div>
            )}
          </section>

          {/* Seção de Dados Estruturados em Abas */}
          <section className={`rounded-[20px] border border-[#E3E8F0] bg-white p-4 sm:p-6 shadow-xs lg:col-span-7 ${mobileView === 'original' ? 'hidden lg:block' : 'block'}`}>
            {/* Abas Superiores de Categorias */}
            <div className="mb-5 flex items-center gap-0.5 overflow-x-auto pb-1 border-b border-[#E3E8F0] no-scrollbar">
              {availableTabs.map((tab: { key: DetailTabKey; label: string; icon: any; count?: number | string }) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleSetTab(tab.key)}
                    className={`-mb-px cursor-pointer inline-flex items-center gap-1.5 border-b-[3px] px-2.5 sm:px-3.5 py-2.5 text-[11px] sm:text-sm font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-[#1D4ED8] text-[#1D4ED8]'
                        : 'border-transparent text-[#5B6878] hover:text-[#14211F] hover:border-[#E3E8F0]'
                    }`}
                    title={tab.label}
                  >
                    <Icon size={14} className={isActive ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
                    <span className="hidden xs:inline sm:inline">{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          isActive
                            ? 'bg-[#1D4ED8] text-white'
                            : 'bg-[#F4F7FC] text-[#5B6878] border border-[#E3E8F0]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CONTEÚDO DAS ABAS */}

            {/* 1. ABA: DADOS LIDOS */}
            {activeTab === 'dados' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Aviso quando o documento ainda está em processamento */}
                {isProcessing && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-900">
                        Extraindo dados clínicos com inteligência artificial...
                      </div>
                      <p className="mt-1 text-xs text-blue-800 leading-relaxed mb-0">
                        Os dados do médico, clínica, diagnósticos, receitas e exames aparecerão aqui automaticamente assim que a análise for finalizada.
                      </p>
                    </div>
                  </div>
                )}
                {/* Atestado: resumo do CID em destaque */}
                {String(doc?.tipo || '').toLowerCase() === 'atestado' && doc.cid && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <ClipboardList size={18} className="text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-0.5">CID-10 — Atestado Médico</div>
                      <div className="text-base font-bold text-blue-900 font-mono">{doc.cid}</div>
                      {doc.diagnostico && String(doc.diagnostico).trim() && (
                        <p className="mt-1 text-sm leading-relaxed text-blue-800 whitespace-pre-wrap">{doc.diagnostico}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadados clínicos principais — só mostra campo com valor */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(doc.tipoExame || doc.tipo) && (
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                      <div className="text-[11px] font-semibold text-[#5a6a80]">Tipo de documento</div>
                      <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] capitalize break-words">
                        {doc.tipoExame || doc.tipo}
                      </div>
                    </div>
                  )}

                  {(doc.data || docDate) && (
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                      <div className="text-[11px] font-semibold text-[#5a6a80]">Data do registro</div>
                      <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] break-words">
                        {docDate}
                      </div>
                    </div>
                  )}

                  {(doc.medico || doc.crm) && (
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3 col-span-2 sm:col-span-1">
                      <div className="text-[11px] font-semibold text-[#5a6a80]">Médico / Solicitante</div>
                      {doc.medico && (
                        <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] break-words">
                          {doc.medico}
                        </div>
                      )}
                      {doc.crm && (
                        <div className="text-xs text-[#1D4ED8] font-semibold mt-0.5">
                          CRM: {doc.crm}
                        </div>
                      )}
                    </div>
                  )}

                  {doc.clinica && (
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                      <div className="text-[11px] font-semibold text-[#5a6a80]">Clínica / Local</div>
                      <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] break-words">
                        {doc.clinica}
                      </div>
                      {doc.cnes && (
                        <div className="text-[11px] text-[#5a6a80] mt-0.5">
                          CNES: {doc.cnes}
                        </div>
                      )}
                    </div>
                  )}

                  {doc.especialidade && (
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                      <div className="text-[11px] font-semibold text-[#5a6a80]">Especialidade</div>
                      <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] break-words">
                        {doc.especialidade}
                      </div>
                    </div>
                  )}

                  {doc.cid && (
                    <div className="rounded-xl border border-[#CFE0FF] bg-[#CFE0FF]/20 p-3">
                      <div className="text-[11px] font-semibold text-[#1D4ED8]">CID-10</div>
                      <div className="mt-0.5 text-sm font-bold text-[#1D4ED8] font-mono">
                        {doc.cid}
                      </div>
                    </div>
                  )}

                  {doc.tipoClinico && (
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                      <div className="text-[11px] font-semibold text-[#5a6a80]">Classificação</div>
                      <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] break-words">
                        {doc.tipoClinico}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dados e estrutura identificados pela IA */}
                {(() => {
                  const kvItems = indentedContent.filter(
                    (item: any) => item.chave?.trim() && item.valor?.trim()
                  );
                  const isItemHeader = (item: any) =>
                    item.tipo === 'header' ||
                    (!item.tipo && item.texto?.trim().length > 0 && item.texto.trim().length < 60 && !item.texto.trim().startsWith('-') && !item.texto.trim().startsWith('•'));
                  const nonKvRaw = indentedContent.filter(
                    (item: any) => (!item.chave || !item.valor) && item.texto?.trim()
                  );
                  // Suprime headers órfãos (sem conteúdo real após eles antes do próximo header)
                  const nonKvItems: any[] = [];
                  for (let i = 0; i < nonKvRaw.length; i++) {
                    const cur = nonKvRaw[i];
                    if (isItemHeader(cur)) {
                      const hasContent = nonKvRaw.slice(i + 1).some(
                        (next: any) => !isItemHeader(next) && next.texto?.trim()
                      );
                      if (hasContent) nonKvItems.push(cur);
                    } else {
                      nonKvItems.push(cur);
                    }
                  }
                  if (kvItems.length === 0 && nonKvItems.length === 0) return null;
                  return (
                    <div className="space-y-3 rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#14211F] border-b border-[#dde3ec] pb-3">
                        <FileText size={17} className="text-[#1D4ED8]" />
                        <span>Campos identificados no documento</span>
                      </div>
                      <div className="space-y-3 pt-1">
                        {kvItems.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {kvItems.map((item: any, idx: number) => (
                              <div key={`kv-${idx}`} className="flex flex-col justify-center rounded-xl border border-[#dde3ec] bg-[#f8fafc] px-3.5 py-2.5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6a80]">{item.chave}</span>
                                <span className="mt-0.5 text-sm font-bold text-[#1d2a3d] break-words">{item.valor}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {nonKvItems.map((item: any, idx: number) => {
                          if (isItemHeader(item)) {
                            return (
                              <div key={`h-${idx}`} className="mt-2 text-sm font-bold text-[#14211F] border-l-2 border-[#1D4ED8] pl-2.5 py-0.5">
                                {item.texto}
                              </div>
                            );
                          }
                          if (item.tipo === 'bullet' || item.texto?.startsWith('-') || item.texto?.startsWith('•')) {
                            const cleanText = item.texto?.replace(/^[-•]\s*/, '') || '';
                            if (!cleanText.trim()) return null;
                            return (
                              <div key={`b-${idx}`} className="flex items-start gap-2.5 rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3 text-xs sm:text-sm text-[#1d2a3d]">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1D4ED8] shrink-0" />
                                <span className="leading-relaxed break-words">{cleanText}</span>
                              </div>
                            );
                          }
                          if (!item.texto?.trim()) return null;
                          return (
                            <div key={`t-${idx}`} className="rounded-xl bg-[#f1f4f8] p-3 text-xs sm:text-sm leading-relaxed text-[#4a5568] break-words whitespace-pre-wrap">
                              {item.texto}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Texto bruto original extraído com OCR */}
                {extractedText && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white overflow-hidden shadow-xs transition-all">
                    <button
                      type="button"
                      onClick={() => setShowExtractedText((open) => !open)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#F4F7FC] cursor-pointer"
                      aria-expanded={showExtractedText}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#CFE0FF]/40 text-[#1D4ED8] flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1d2a3d]">
                            Texto original transcrito (OCR)
                          </div>
                          <div className="text-xs text-[#5B6878]">
                            Visualizar todo o texto lido da imagem
                          </div>
                        </div>
                      </div>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#5a6a80] transition-transform duration-200 ${
                          showExtractedText ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showExtractedText && (
                      <div className="border-t border-[#dde3ec] bg-[#f8fafc] p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#5a6a80]">
                            Transcrição textual completa:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyExtractedText}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer"
                          >
                            {hasCopiedExtractedText ? (
                              <>
                                <Check size={13} className="text-emerald-600" />
                                <span className="text-emerald-600">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copiar texto</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto rounded-xl border border-[#dde3ec] bg-white p-3.5 shadow-inner">
                          <p className="m-0 whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#2d3a4d] select-text">
                            {extractedText}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. ABA: EXAMES (Mamografia, Raio-X, Exames laboratoriais, etc.) */}
            {activeTab === 'exames' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Identificação do exame */}
                <div className="rounded-2xl border border-[#CFE0FF] bg-[#CFE0FF]/20 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#1D4ED8] shrink-0">
                      <Activity size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wide">
                        {doc.tipoExame || 'Exame de Saúde'}
                      </span>
                      <h2 className="m-0 text-lg font-bold text-[#14211F]">
                        {doc.nomeExame || doc.titulo || 'Exame'}
                      </h2>
                      {doc.clinica && (
                        <p className="m-0 mt-0.5 text-xs text-[#5B6878]">
                          Realizado em: <span className="font-semibold text-[#14211F]">{doc.clinica}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Laudo e Resultado Descritivo (ex: Mamografia, Raio-X, Ultrassom, Biópsias) */}
                {doc.resultado && String(doc.resultado).trim().length > 0 && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#14211F] border-b border-[#dde3ec] pb-3 mb-3">
                      <FileSearch size={18} className="text-[#1D4ED8]" />
                      <span>Laudo & Resultado Descritivo</span>
                    </div>
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-4 text-[#1d2a3d]">
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed font-sans">
                        {doc.resultado}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resultados de Exames Laboratoriais Estruturados */}
                {examResults.length > 0 && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#dde3ec] pb-3 mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#14211F]">
                        <Activity size={18} className="text-[#1D4ED8]" />
                        <span>Valores & Biomarcadores Medidos</span>
                      </div>
                      <span className="rounded-full bg-[#F4F7FC] border border-[#E3E8F0] px-2.5 py-0.5 text-xs font-semibold text-[#5B6878]">
                        {examResults.length} {examResults.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    <div className="divide-y divide-[#dde3ec] rounded-xl border border-[#dde3ec] px-4 bg-[#f8fafc]">
                      {examResults.map((result: any, index: number) => {
                        const statusNorm = String(result.status || '').toLowerCase();
                        const isNormal = statusNorm === 'normal';
                        const isAltered = statusNorm === 'alto' || statusNorm === 'baixo' || statusNorm === 'alterado';

                        const hasValue = result.valorTexto || result.valor != null;
                        const displayValue = hasValue
                          ? `${result.valorTexto || result.valor}${result.unidade ? ' ' + result.unidade : ''}`
                          : '—';
                        return (
                          <div key={`${result.nome || 'resultado'}-${index}`} className="flex flex-wrap items-start justify-between gap-2 py-3.5">
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-semibold text-sm text-[#1d2a3d] break-words">{result.nome || 'Resultado'}</div>
                              {result.referenciaTexto && (
                                <div className="mt-0.5 text-xs text-[#5a6a80] break-words">
                                  Ref: <span className="font-medium text-[#14211F]">{result.referenciaTexto}</span>
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold text-[#1d2a3d] break-all">
                                {displayValue}
                              </div>
                              {result.status && result.status !== 'indefinido' && (
                                <span
                                  className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border ${
                                    isNormal
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isAltered
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-[#5a6a80] border-slate-200'
                                  }`}
                                >
                                  {result.status}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


              </div>
            )}

            {/* 3. ABA: OPINIÃO (Diagnóstico, conclusões médicas, parecer) */}
            {activeTab === 'opiniao' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Diagnóstico Clínico Registrado */}
                {doc.diagnostico && String(doc.diagnostico).trim().length > 0 && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                      <Stethoscope size={18} className="text-blue-700" />
                      <span>Diagnóstico Clínico Registrado</span>
                      {doc.cid && (
                        <span className="ml-auto inline-block rounded bg-blue-100 border border-blue-200 px-2 py-0.5 font-mono text-xs font-bold text-blue-800">
                          CID: {doc.cid}
                        </span>
                      )}
                    </div>
                    <p className="m-0 text-sm leading-relaxed text-blue-950 font-medium whitespace-pre-wrap">
                      {doc.diagnostico}
                    </p>
                  </div>
                )}

                {/* Conclusões do Laudo / Consulta */}
                {doc.conclusoes && String(doc.conclusoes).trim().length > 0 && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#14211F] border-b border-[#dde3ec] pb-3 mb-3">
                      <Check size={18} className="text-emerald-600" />
                      <span>Conclusões do Especialista</span>
                    </div>
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-4 text-[#1d2a3d]">
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
                        {doc.conclusoes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Conteúdo Clínico & Avaliação */}
                {doc.conteudo && String(doc.conteudo).trim().length > 0 && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#14211F] border-b border-[#dde3ec] pb-3 mb-3">
                      <FileText size={18} className="text-[#1D4ED8]" />
                      <span>Avaliação Clínica & Parecer</span>
                    </div>
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-4 text-[#1d2a3d]">
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
                        {doc.conteudo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. ABA: RECOMENDAÇÕES (Medicamentos, alertas, condutas) */}
            {activeTab === 'recomendacoes' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Medicamentos Prescritos */}
                {medications.length > 0 && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#dde3ec] pb-3 mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#14211F]">
                        <Pill size={18} className="text-[#1D4ED8]" />
                        <span>Medicamentos Prescritos</span>
                      </div>
                      <span className="rounded-full bg-[#F4F7FC] border border-[#E3E8F0] px-2.5 py-0.5 text-xs font-semibold text-[#5B6878]">
                        {medications.length} {medications.length === 1 ? 'medicamento' : 'medicamentos'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {medications.map((medication: any, index: number) => (
                        <div
                          key={`${medication.nome || 'medicamento'}-${index}`}
                          className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3.5 transition-all hover:border-[#CFE0FF]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#CFE0FF]/50 text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                                <Pill size={16} />
                              </div>
                              <div className="min-w-0">
                                <b className="block text-sm sm:text-[15px] text-[#14211F]">{medication.nome || 'Medicamento'}</b>
                                {(medication.dosagem || medication.horario) && (
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5B6878]">
                                    {medication.dosagem && (
                                      <span className="rounded-md bg-white border border-[#dde3ec] px-2 py-0.5 font-medium text-[#14211F]">
                                        Dosagem: {medication.dosagem}
                                      </span>
                                    )}
                                    {medication.horario && (
                                      <span className="rounded-md bg-white border border-[#dde3ec] px-2 py-0.5 font-medium text-[#14211F]">
                                        Horário: {medication.horario}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSearchBula(index, medication.nome)}
                              disabled={loadingBulaIndex === index}
                              className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                                bulaResults[index]
                                  ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'border-[#E3E8F0] bg-white text-[#1D4ED8] hover:bg-[#F4F7FC] disabled:opacity-50'
                              }`}
                              title={bulaResults[index] ? 'Recolher informações da bula' : 'Consultar bula na base oficial da Anvisa'}
                            >
                              {loadingBulaIndex === index ? (
                                <LoaderCircle size={13} className="animate-spin" />
                              ) : (
                                <BookOpen size={13} />
                              )}
                              <span>{bulaResults[index] ? 'Ocultar Bula' : 'Bula'}</span>
                            </button>
                          </div>

                          {/* Resultado da busca da Bula se carregado */}
                          {bulaResults[index] && (
                            <div className="mt-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 p-3.5 sm:p-4 text-xs animate-in fade-in duration-200 shadow-2xs">
                              <div className="flex items-start justify-between gap-2 border-b border-blue-100 pb-2.5 mb-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs shrink-0">
                                    <BookOpen size={14} />
                                  </div>
                                  <div>
                                    <div className="font-bold text-blue-950 text-[13px] leading-tight">
                                      {bulaResults[index].nome || medication.nome}
                                    </div>
                                    <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                                      Fonte: {bulaResults[index].fonte || 'ANVISA'}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setBulaResults((prev) => ({ ...prev, [index]: undefined }))}
                                  className="text-[#5B6878] hover:text-[#14211F] p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                                  title="Recolher bula"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              {/* Badges de Princípio Ativo e Classe Terapêutica */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                {bulaResults[index].principioAtivo && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                                    <Pill size={10} />
                                    <span>Princípio Ativo: {bulaResults[index].principioAtivo}</span>
                                  </span>
                                )}
                                {bulaResults[index].classeTerapeutica && (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                    {bulaResults[index].classeTerapeutica}
                                  </span>
                                )}
                                {bulaResults[index].fabricante && (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                    {bulaResults[index].fabricante}
                                  </span>
                                )}
                              </div>

                              {/* Descrição e Indicação ao Paciente */}
                              <div className="rounded-xl bg-white border border-blue-100/90 p-3 leading-relaxed text-[#1d2a3d] text-xs">
                                <b className="block text-[11px] uppercase tracking-wider text-blue-900 mb-1 font-semibold">
                                  Indicação & Ação no Organismo
                                </b>
                                <p className="m-0 whitespace-pre-wrap">
                                  {typeof bulaResults[index] === 'string'
                                    ? bulaResults[index]
                                    : bulaResults[index]?.descricao || 'Informações clínicas registradas para este medicamento.'}
                                </p>
                              </div>

                              {/* Link para consulta oficial da ANVISA */}
                              <div className="mt-2.5 pt-2 border-t border-blue-100/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5B6878]">
                                <a
                                  href={`https://consultas.anvisa.gov.br/#/bulario`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-bold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline"
                                >
                                  <ExternalLink size={12} />
                                  <span>Consultar Bulário Eletrônico da ANVISA</span>
                                </a>
                                {bulaResults[index].registroAnvisa && (
                                  <span className="text-[10px] text-[#5B6878]">
                                    Registro: {bulaResults[index].registroAnvisa}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {bulaErrors[index] && (
                            <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 animate-in fade-in">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                                  <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                                  <span>{bulaErrors[index]}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setBulaErrors((prev) => ({ ...prev, [index]: '' }))}
                                  className="text-rose-600 hover:text-rose-900 cursor-pointer"
                                  title="Fechar aviso"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <div className="mt-2">
                                <a
                                  href="https://consultas.anvisa.gov.br/#/bulario"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 transition-colors"
                                >
                                  <ExternalLink size={11} />
                                  <span>Buscar diretamente no Bulário da ANVISA</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alertas Ativos */}
                {activeAlerts.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                      <AlertTriangle size={18} className="text-amber-700" />
                      <span>Alertas Clínicos & Cuidados</span>
                    </div>

                    <div className="space-y-2.5">
                      {activeAlerts.map((alert: any, index: number) => (
                        <div
                          key={`${alert.tipo || 'alerta'}-${index}`}
                          className="rounded-xl border border-amber-200 bg-white p-3.5 text-[#14211F]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                {alert.tipo || 'Alerta'} {alert.severidade ? `· Severidade ${alert.severidade}` : ''}
                              </span>
                              {alert.mensagem && (
                                <p className="m-0 mt-1 text-xs leading-relaxed text-[#14211F]">
                                  {alert.mensagem}
                                </p>
                              )}
                            </div>
                            {alert.id && (
                              <button
                                type="button"
                                onClick={() => void handleDismissAlert(alert.id)}
                                disabled={dismissingAlertId !== null}
                                className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                {dismissingAlertId === alert.id ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
                                Dispensar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            )}

            {/* 5. ABA: OUTRAS INFORMAÇÕES (Resumo executivo e observações) */}
            {activeTab === 'outros' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Resumo IA */}
                {doc.resumo && String(doc.resumo).trim().length > 0 && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#14211F] border-b border-[#dde3ec] pb-3 mb-3">
                      <Sparkles size={18} className="text-[#1D4ED8]" />
                      <span>Resumo Executivo do Documento</span>
                    </div>
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-4 text-[#1d2a3d]">
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
                        {doc.resumo}
                      </p>
                    </div>
                  </div>
                )}

                {/* Observações Gerais */}
                {doc.observacoes && String(doc.observacoes).trim().length > 0 && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#14211F] border-b border-[#dde3ec] pb-3 mb-3">
                      <Info size={18} className="text-[#1D4ED8]" />
                      <span>Observações Gerais</span>
                    </div>
                    <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-4 text-[#1d2a3d]">
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
                        {doc.observacoes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ações inferiores da seção de detalhes */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#E3E8F0] pt-4">
              <button
                type="button"
                onClick={() => {
                  if (isProcessing) return;
                  setConfirmedFields(new Set());
                  setIsEditingModalOpen(true);
                }}
                disabled={isProcessing}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-5 text-sm font-semibold text-[#14211F] transition-all hover:bg-[#F4F7FC] hover:border-[#CFE0FF] shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={isProcessing ? 'Edição indisponível durante o processamento' : 'Editar dados'}
              >
                <Edit2 size={16} /> Editar dados
              </button>
              {isReviewPending && lowConfidenceFields.length === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmRevisao}
                  disabled={isConfirmingRevisao}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-sm font-semibold text-white transition-all hover:bg-[#1E40AF] active:bg-[#1E3A8A] shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {isConfirmingRevisao ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                  Confirmar revisão
                </button>
              )}
            </div>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Os dados exibidos foram carregados do documento salvo na sua conta.
        </p>
      </main>

      <DialogPrimitive.Root open={isEditingModalOpen} onOpenChange={setIsEditingModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-[#dde3ec] bg-white shadow-2xl outline-none sm:w-[calc(100%-2rem)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e7ebf1] bg-white px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-bold text-[#14211F]">Editar documento</h3>
                <p className="mt-0.5 text-xs text-[#5a6a80]">Altere os dados necessários e salve ao terminar.</p>
              </div>
              <DialogPrimitive.Close aria-label="Fechar edição" className="rounded-xl p-2 text-[#5B6878] hover:bg-[#F4F7FC] transition-colors">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 text-sm sm:px-6">
              <div className="space-y-6">
              <section className="rounded-2xl border border-[#e7ebf1] bg-[#fbfcfe] p-4 sm:p-5">
                <h4 className="mb-1 font-bold text-[#14211F]">Identificação</h4>
                <p className="mb-4 text-xs text-[#5B6878]">Título, tipo e data do documento.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold" htmlFor="document-tipo">Tipo de documento</label>
                    <select
                      id="document-tipo"
                      value={formData.tipo}
                      onChange={(event) => updateTextField('tipo', event.target.value)}
                      className={`h-11 w-full rounded-xl border bg-white px-3 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 ${confidencePath('tipo') ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`}
                    >
                      {['exame', 'receita', 'laudo', 'atestado', 'vacina', 'encaminhamento', 'relatorio', 'outro'].map((type) => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                    {confidencePath('tipo') && <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">Confira este campo. {confirmedFields.has('tipo') ? 'Valor confirmado.' : <button type="button" disabled={!fieldChanged('tipo')} onClick={() => confirmField('tipo')} className="font-bold underline disabled:opacity-50">Confirmar valor</button>}</div>}
                  </div>
                  {documentTextFields.filter(({ key }) => key === 'titulo' || key === 'data').map(({ key, label, multiline }) => (
                    <div key={key} className={multiline ? 'sm:col-span-2' : undefined}>
                      <label className="mb-1 block font-semibold" htmlFor={`document-${key}`}>{label}</label>
                      {multiline ? (
                        <textarea
                          id={`document-${key}`}
                          rows={3}
                          value={formData[key]}
                          onChange={(event) => updateTextField(key, event.target.value)}
                          className={`w-full rounded-xl border p-3 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 ${confidencePath(key) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`}
                        />
                      ) : (
                        <input
                          id={`document-${key}`}
                          type="text"
                          value={formData[key]}
                          inputMode={key === 'crm' || key === 'cnes' ? 'numeric' : undefined}
                          onChange={(event) => updateTextField(key, event.target.value)}
                          maxLength={key === 'data' ? 10 : key === 'cnes' ? 7 : key === 'crm' ? 20 : undefined}
                          placeholder={key === 'data' ? 'DD/MM/AAAA' : undefined}
                          className={`h-11 w-full rounded-xl border px-3 text-base sm:text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 ${confidencePath(key) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`}
                        />
                      )}
                      {confidencePath(key) && (
                        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                          <p>Confira este valor. Ele só será aceito após você alterar e confirmar.</p>
                          {confirmedFields.has(key) ? <p className="mt-1 font-bold">Valor confirmado</p> : (
                            <button type="button" disabled={!fieldChanged(key)} onClick={() => confirmField(key)} className="mt-1 font-bold underline disabled:cursor-not-allowed disabled:opacity-50">Confirmar valor</button>
                          )}
                        </div>
                      )}
                      {key === 'cid' && cidSuggestions.length > 0 && (
                        <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#dde3ec] bg-white shadow-lg">
                          {cidSuggestions.map((record) => (
                            <button key={record.codigo} type="button" onClick={() => {
                              updateTextField('cid', `${record.codigo} - ${record.descricao}`);
                              setCidSuggestions([]);
                            }} className="block w-full px-3 py-2 text-left text-xs hover:bg-[#F4F7FC]">
                              <span className="font-bold text-[#1D4ED8]">{record.codigo}</span>
                              <span className="ml-2 text-[#5B6878]">{record.descricao}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {(key === 'clinica' || key === 'cnes') && cnesSuggestions.length > 0 && (
                        <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#dde3ec] bg-white shadow-lg">
                          {cnesSuggestions.map((record) => (
                            <button key={record.codigo} type="button" onClick={() => {
                              setFormData((previous) => ({ ...previous, cnes: record.codigo, clinica: record.descricao }));
                              setCnesSuggestions([]);
                              setCnesSearchQuery('');
                            }} className="block w-full px-3 py-2 text-left text-xs hover:bg-[#F4F7FC]">
                              <span className="font-bold text-[#1D4ED8]">CNES {record.codigo}</span>
                              <span className="ml-2 text-[#5B6878]">{record.descricao}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#e7ebf1] bg-[#fbfcfe] p-4 sm:p-5">
                <h4 className="mb-1 font-bold text-[#14211F]">Profissional e local</h4>
                <p className="mb-4 text-xs text-[#5a6a80]">Quem emitiu o documento e onde foi realizado.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {documentTextFields.filter(({ key }) => ['medico', 'crm', 'clinica', 'cnes'].includes(key)).map(({ key, label }) => (
                    <div key={key}>
                      <label className="mb-1 block font-semibold" htmlFor={`document-${key}`}>{label}</label>
                      <input id={`document-${key}`} type="text" value={formData[key]} inputMode={key === 'crm' || key === 'cnes' ? 'numeric' : undefined} onChange={(event) => updateTextField(key, event.target.value)} maxLength={key === 'cnes' ? 7 : key === 'crm' ? 20 : undefined} className={`h-11 w-full rounded-xl border bg-white px-3 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 ${confidencePath(key) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`} />
                      {confidencePath(key) && <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">Confira este campo. {confirmedFields.has(key) ? 'Valor confirmado.' : <button type="button" disabled={!fieldChanged(key)} onClick={() => confirmField(key)} className="font-bold underline disabled:opacity-50">Confirmar valor</button>}</div>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#e7ebf1] bg-[#fbfcfe] p-4 sm:p-5">
                <h4 className="mb-1 font-bold text-[#14211F]">Informações clínicas</h4>
                <p className="mb-4 text-xs text-[#5a6a80]">Revise os campos extraídos e corrija somente o que for necessário.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {documentTextFields.filter(({ key }) => !['titulo', 'data', 'medico', 'crm', 'clinica', 'cnes'].includes(key)).map(({ key, label, multiline }) => (
                    <div key={key} className={multiline ? 'sm:col-span-2' : undefined}>
                      <label className="mb-1 block font-semibold" htmlFor={`document-${key}`}>{label}</label>
                      {multiline ? <textarea id={`document-${key}`} rows={3} value={formData[key]} onChange={(event) => updateTextField(key, event.target.value)} className={`w-full rounded-xl border bg-white p-3 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 ${confidencePath(key) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`} /> : <input id={`document-${key}`} type="text" value={formData[key]} onChange={(event) => updateTextField(key, event.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3 outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 ${confidencePath(key) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`} />}
                      {confidencePath(key) && <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">Confira este campo. {confirmedFields.has(key) ? 'Valor confirmado.' : <button type="button" disabled={!fieldChanged(key)} onClick={() => confirmField(key)} className="font-bold underline disabled:opacity-50">Confirmar valor</button>}</div>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#e7ebf1] bg-[#fbfcfe] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-[#14211F]">Medicamentos</h4>
                  <button
                    type="button"
                    onClick={() => setFormData((previous) => ({
                      ...previous,
                      medicamentos: [...previous.medicamentos, { nome: '', dosagem: '', horario: '' }],
                    }))}
                    className="min-h-9 rounded-xl border border-[#E3E8F0] bg-white px-3 text-xs font-bold text-[#14211F] hover:bg-[#F4F7FC] transition-colors"
                  >
                    Adicionar medicamento
                  </button>
                </div>
                {formData.medicamentos.length === 0 && (
                  <p className="text-sm text-[#5a6a80]">Nenhum medicamento registrado.</p>
                )}
                <div className="space-y-3">
                  {formData.medicamentos.map((medication, index) => (
                    <div key={index} className="grid gap-3 rounded-xl border border-[#dde3ec] p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      {([
                        ['nome', 'Nome'],
                        ['dosagem', 'Dosagem'],
                        ['horario', 'Horário'],
                      ] as const).map(([field, label]) => (
                        <label key={field} className="block font-semibold">
                          {label}
                          <input
                            value={medication[field]}
                            onChange={(event) => {
                              setFormData((previous) => ({ ...previous, medicamentos: previous.medicamentos.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item) }));
                              setConfirmedFields((previous) => { const next = new Set(previous); next.delete(`medicamentos[${index}].${field}`); return next; });
                            }}
                            className={`mt-1 h-10 w-full rounded-lg border px-3 font-normal outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 ${confidencePath(`medicamentos[${index}].${field}`) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`}
                          />
                          {confidencePath(`medicamentos[${index}].${field}`) && (
                            <span className="mt-1 block rounded bg-amber-50 p-2 text-xs font-normal text-amber-900">
                              Confira este campo. {confirmedFields.has(`medicamentos[${index}].${field}`) ? 'Valor confirmado.' : <button type="button" disabled={!fieldChanged(`medicamentos[${index}].${field}`)} onClick={() => confirmField(`medicamentos[${index}].${field}`)} className="font-bold underline disabled:opacity-50">Confirmar valor</button>}
                            </span>
                          )}
                        </label>
                      ))}
                      <div className="sm:col-span-4">
                        <button
                          type="button"
                          disabled={loadingBulaIndex === index || medication.nome.trim().length < 3}
                          onClick={() => handleSearchBula(index, medication.nome)}
                          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-3 text-xs font-bold text-[#14211F] hover:bg-[#F4F7FC] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        >
                          {loadingBulaIndex === index ? <LoaderCircle size={14} className="animate-spin" /> : <FileText size={14} />}
                          Consultar bula na ANVISA
                        </button>
                        {bulaErrors[index] && <p className="mb-0 mt-2 text-xs text-red-700">{bulaErrors[index]}</p>}
                        {bulaResults[index] && (
                          <div className="mt-2 rounded-lg bg-[#f7f9fc] p-3 text-xs text-[#40516a]">
                            <p className="mb-1 font-bold text-[#14211F]">{bulaResults[index].nome} · Fonte: {bulaResults[index].fonte}</p>
                            <p className="mb-2 whitespace-pre-wrap">{bulaResults[index].descricao}</p>
                            <a href="https://consultas.anvisa.gov.br/#/bulario" target="_blank" rel="noreferrer" className="inline-block font-bold text-[#1D4ED8] underline">Abrir Bulario Eletronico oficial</a>
                            <p className="mb-0 text-[11px]">{[
                              bulaResults[index].principioAtivo && `Principio ativo: ${bulaResults[index].principioAtivo}`,
                              bulaResults[index].fabricante && `Fabricante: ${bulaResults[index].fabricante}`,
                              bulaResults[index].registroAnvisa && `Registro ANVISA: ${bulaResults[index].registroAnvisa}`,
                              bulaResults[index].situacaoRegistro && `Situacao: ${bulaResults[index].situacaoRegistro}`,
                            ].filter(Boolean).join(' · ')}</p>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((previous) => ({
                          ...previous,
                          medicamentos: previous.medicamentos.filter((_, itemIndex) => itemIndex !== index),
                        }))}
                        aria-label={`Remover medicamento ${index + 1}`}
                        className="self-end rounded-lg px-3 py-2 font-bold text-[#E8664A] hover:bg-[#E8664A]/10 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {formData.resultadosExame.length > 0 && (
                <section className="rounded-2xl border border-[#e7ebf1] bg-[#fbfcfe] p-4 sm:p-5">
                  <h4 className="mb-3 font-bold text-[#14211F]">Resultados do exame</h4>
                  <div className="space-y-3">
                    {formData.resultadosExame.map((result, index) => (
                      <div key={index} className="grid gap-3 rounded-xl border border-[#dde3ec] p-3 sm:grid-cols-2">
                        {(() => { const path = `resultadosExame[${index}].valor`; return <label className="block font-semibold">Valor numérico
                          <input type="number" step="any" value={result.valor ?? ''} onChange={(event) => {
                            setFormData((previous) => ({ ...previous, resultadosExame: previous.resultadosExame.map((item, itemIndex) => itemIndex === index ? { ...item, valor: event.target.value === '' ? null : Number(event.target.value) } : item) }));
                            setConfirmedFields((previous) => { const next = new Set(previous); next.delete(path); return next; });
                          }} className={`mt-1 h-10 w-full rounded-lg border px-3 font-normal ${confidencePath(path) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`} />
                          {confidencePath(path) && <span className="mt-1 block rounded bg-amber-50 p-2 text-xs font-normal text-amber-900">Confira este campo. {confirmedFields.has(path) ? 'Valor confirmado.' : <button type="button" disabled={!fieldChanged(path)} onClick={() => confirmField(path)} className="font-bold underline disabled:opacity-50">Confirmar valor</button>}</span>}
                        </label>; })()}
                        {([['nome', 'Exame'], ['valorTexto', 'Resultado'], ['unidade', 'Unidade'], ['referenciaTexto', 'Referência']] as const).map(([field, label]) => {
                          const path = `resultadosExame[${index}].${field}`;
                          return <label key={field} className="block font-semibold">{label}
                            <input value={result[field]} onChange={(event) => {
                              setFormData((previous) => ({ ...previous, resultadosExame: previous.resultadosExame.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item) }));
                              setConfirmedFields((previous) => { const next = new Set(previous); next.delete(path); return next; });
                            }} className={`mt-1 h-10 w-full rounded-lg border px-3 font-normal ${confidencePath(path) ? 'border-amber-400 bg-amber-50' : 'border-[#c6cfdb]'}`} />
                            {confidencePath(path) && <span className="mt-1 block rounded bg-amber-50 p-2 text-xs font-normal text-amber-900">Confira este campo. {confirmedFields.has(path) ? 'Valor confirmado.' : <button type="button" disabled={!fieldChanged(path)} onClick={() => confirmField(path)} className="font-bold underline disabled:opacity-50">Confirmar valor</button>}</span>}
                          </label>;
                        })}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              </div>
            </div>
            <div className="sticky bottom-0 z-10 flex justify-end gap-2.5 border-t border-[#E3E8F0] bg-white px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="min-h-11 cursor-pointer rounded-xl border border-[#E3E8F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#14211F] hover:bg-[#F4F7FC] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="min-h-11 flex-1 cursor-pointer rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-colors shadow-xs sm:flex-none"
              >
                Salvar alterações
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root
        open={isZoomModalOpen && !isProcessing}
        onOpenChange={(open) => {
          if (!isProcessing) setIsZoomModalOpen(open);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
          <DialogPrimitive.Content className="fixed inset-2 sm:inset-5 z-50 flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[#334155] bg-[#0b1329] shadow-2xl outline-none">
            {/* Header com Controles de Zoom e Navegação */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1e293b] bg-[#0f172a] px-3.5 sm:px-6 py-2.5 sm:py-3 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsZoomModalOpen(false)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span className="hidden sm:inline">Fechar</span>
                </button>
                <h3 className="m-0 text-xs sm:text-base font-bold text-white truncate max-w-[160px] sm:max-w-[320px]">
                  {docTitle}
                </h3>
              </div>

              {/* Controles de Zoom & Páginas */}
              <div className="flex items-center gap-1 sm:gap-2">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 bg-white/10 rounded-xl px-2 py-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentPageIndex === 0}
                      className="p-1 rounded text-white/80 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Página anterior"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="font-bold text-white px-1 text-[11px] sm:text-xs">
                      {currentPageIndex + 1}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPageIndex === totalPages - 1}
                      className="p-1 rounded text-white/80 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Próxima página"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}

                {/* Botões de Zoom */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-white/10 rounded-xl p-0.5 sm:p-1">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                    disabled={zoomLevel <= 0.5}
                    className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Diminuir zoom"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span className="text-[11px] sm:text-xs font-bold text-white min-w-[38px] sm:min-w-[42px] text-center select-none">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
                    disabled={zoomLevel >= 3}
                    className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Aumentar zoom"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setZoomLevel(1); setRotation(0); }}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  title="Redefinir visualização (100%)"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  title="Girar 90°"
                >
                  <RotateCw size={14} />
                </button>

                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
                    title="Baixar imagem original"
                  >
                    <Download size={14} />
                    <span>Baixar</span>
                  </a>
                )}

                <DialogPrimitive.Close
                  aria-label="Fechar visualização ampliada"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer ml-1"
                >
                  <X size={16} />
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Canvas de Visualização com Zoom e Pan */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center select-none bg-[#070c18] relative">
              {fileUrl ? (
                <div
                  className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={fileUrl}
                    alt={`Documento original ampliado: ${docTitle} (Pág ${currentPageIndex + 1})`}
                    className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg shadow-2xl cursor-pointer"
                    onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.75 : 1))}
                    title="Clique para alternar zoom 100% / 175%"
                  />
                </div>
              ) : (
                <div className="text-white/60 text-sm">Original indisponível para visualização.</div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
