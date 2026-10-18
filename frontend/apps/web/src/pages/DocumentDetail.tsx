import { useEffect, useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import {
  ArrowLeft,
  Download,
  Trash2,
  ZoomIn,
  AlertTriangle,
  Check,
  Edit2,
  X,
  FileText,
  Pill,
  LoaderCircle,
  ChevronDown,
  Copy,
  RotateCw,
  ShieldCheck,
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
        return status === 'pending' || status === 'processing' ? 4000 : false;
      },
    },
  });

  const [activeTab, setActiveTab] = useState<'dados' | 'medicamentos' | 'alertas'>('dados');
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

  const doc = (docRaw as any) || null;
  const hasMedicationTab = String(doc?.tipo ?? '').trim().toLowerCase() === 'receita' || (Array.isArray(doc?.medicamentos) && doc.medicamentos.length > 0);

  useEffect(() => {
    if (!doc) return;
    if (!hasMedicationTab) setActiveTab('dados');
    setFormData(createDocumentEditForm(doc));
  }, [doc, hasMedicationTab]);

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
  const fileUrl = imageUrls[0] || doc?.fileUrl || null;
  const examResults = Array.isArray(doc?.resultadosExame) ? doc.resultadosExame : [];
  const medications = Array.isArray(doc?.medicamentos) ? doc.medicamentos : [];
  const alerts = Array.isArray(doc?.alertas) ? doc.alertas : [];
  const activeAlerts = alerts.filter((alert: any) => alert.dispensado !== true);
  useEffect(() => {
    if (activeTab === 'alertas' && activeAlerts.length === 0) setActiveTab('dados');
  }, [activeTab, activeAlerts.length]);
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
    if (nome.trim().length < 3) return;
    setLoadingBulaIndex(index);
    setBulaErrors((previous) => ({ ...previous, [index]: '' }));
    setBulaResults((previous) => ({ ...previous, [index]: undefined }));
    try {
      const result = await customFetch<any>(`/api/medicamentos/${encodeURIComponent(nome.trim())}/descricao`);
      setBulaResults((previous) => ({ ...previous, [index]: result }));
    } catch (error) {
      setBulaErrors((previous) => ({ ...previous, [index]: getApiErrorMessage(error, 'Não foi possível localizar a bula deste medicamento.') }));
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
      <div className="min-h-[50vh] flex items-center justify-center text-[#5a6a80]">
        <LoaderCircle size={22} className="mr-2 animate-spin" /> Carregando documento…
      </div>
    );
  }

  if (!isMongoId || isError || !doc) {
    return (
      <main className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#dde3ec] bg-white p-8 text-center">
        <FileText size={36} className="mx-auto mb-3 text-[#5a6a80]" />
        <h1 className="text-xl font-bold text-[#14211F]">Documento não encontrado</h1>
        <p className="mt-2 text-sm text-[#5a6a80]">
          Não foi possível carregar este documento da sua conta.
        </p>
        <Link href="/documentos" className="mt-5 inline-flex font-bold text-[#1D4ED8] hover:underline">
          Voltar aos documentos
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16 font-sans text-[#14211F]">
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
              <span className="whitespace-nowrap rounded-full border border-[#E3E8F0] bg-[#F4F7FC] px-2.5 py-1 text-xs font-medium text-[#14211F]">
                {doc.tipo || 'Tipo não informado'}
              </span>
              {['processing', 'pending'].includes(doc.status) && (
                <span className="whitespace-nowrap rounded-full border border-[#E3E8F0] bg-[#F4F7FC] px-2.5 py-1 text-xs font-medium text-[#14211F]">
                  Processando
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

        {/* Auditoria & Conferência Documental */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#CFE0FF] bg-[#F8FAFD] px-4.5 py-3 text-[13px] text-[#14211F] shadow-2xs">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8]/10 text-[#1D4ED8]">
              <ShieldCheck size={16} />
            </div>
            <span className="text-[#475569] leading-relaxed">
              <strong className="font-semibold text-[#14211F]">Conferência Documental:</strong> Dados digitalizados a partir do documento anexado. Compare as informações transcritas com o laudo original ao lado para auditar ou retificar resultados antes de finalizar.
            </span>
          </div>
          <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8] border border-[#CFE0FF] shadow-2xs">
            SBPC/ML · Auditoria Ativa
          </span>
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

        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-4 sm:p-6 shadow-xs lg:col-span-6">
            <div className="mb-4 flex items-center gap-2.5">
              <b className="flex-1 font-serif text-base font-semibold text-[#14211F]">Documento original</b>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                disabled={!fileUrl}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC] transition-colors hover:bg-[#E3E8F0] disabled:cursor-not-allowed disabled:opacity-50"
                title={fileUrl ? 'Ampliar documento' : 'Arquivo original indisponível'}
              >
                <ZoomIn size={19} className="text-[#1D4ED8]" />
              </button>
              <span className="text-[13px] font-semibold text-[#5B6878]">
                {imageUrls.length > 0 ? `${imageUrls.length} página(s)` : 'Original indisponível'}
              </span>
            </div>
            {fileUrl ? (
              <div className="flex min-h-[500px] items-center justify-center overflow-hidden rounded-xl border border-[#E3E8F0] bg-slate-50">
                <img src={fileUrl} alt={`Documento original: ${docTitle}`} className="max-h-[640px] w-auto object-contain" />
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

          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-4 sm:p-6 shadow-xs lg:col-span-6">
            <div className="mb-5 flex border-b border-[#E3E8F0]">
              {([
                ['dados', 'Dados lidos'],
                ['medicamentos', 'Medicamentos'],
                ['alertas', 'Alertas'],
              ] as const)
                .filter(([tab]) => (tab !== 'medicamentos' || hasMedicationTab) && (tab !== 'alertas' || activeAlerts.length > 0))
                .map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`-mb-px cursor-pointer border-b-[3px] px-4 py-2.5 text-sm font-bold transition-colors ${
                      activeTab === tab
                        ? 'border-[#1D4ED8] text-[#1D4ED8]'
                        : 'border-transparent text-[#5B6878] hover:text-[#14211F]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </div>

            {/* Metadados dinâmicos e completos extraídos do documento */}
            <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                <div className="text-[11px] font-semibold text-[#5a6a80]">Tipo</div>
                <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] capitalize truncate">
                  {doc.tipoExame || doc.tipo || 'Não informado'}
                </div>
              </div>

              <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                <div className="text-[11px] font-semibold text-[#5a6a80]">Data</div>
                <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] truncate">
                  {doc.data || docDate}
                </div>
              </div>

              {(doc.medico || doc.crm) && (
                <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-semibold text-[#5a6a80]">Médico / Solicitante</div>
                  <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] truncate" title={doc.medico}>
                    {doc.medico || 'Não informado'}
                  </div>
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
                  <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] truncate" title={doc.clinica}>
                    {doc.clinica}
                  </div>
                </div>
              )}

              {doc.especialidade && (
                <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                  <div className="text-[11px] font-semibold text-[#5a6a80]">Especialidade</div>
                  <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] truncate">
                    {doc.especialidade}
                  </div>
                </div>
              )}

              {doc.cid && (
                <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                  <div className="text-[11px] font-semibold text-[#5a6a80]">Código CID-10</div>
                  <div className="mt-0.5 text-sm font-bold text-[#1D4ED8] inline-block bg-[#CFE0FF]/40 border border-[#CFE0FF] px-2 py-0.5 rounded font-mono">
                    {doc.cid}
                  </div>
                </div>
              )}

              {doc.cnes && (
                <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                  <div className="text-[11px] font-semibold text-[#5a6a80]">CNES</div>
                  <div className="mt-0.5 text-sm font-bold text-[#1d2a3d]">
                    {doc.cnes}
                  </div>
                </div>
              )}

              {doc.nomeExame && (
                <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                  <div className="text-[11px] font-semibold text-[#5a6a80]">Exame</div>
                  <div className="mt-0.5 text-sm font-bold text-[#1d2a3d] truncate" title={doc.nomeExame}>
                    {doc.nomeExame}
                  </div>
                </div>
              )}

              {doc.tipoClinico && (
                <div className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3">
                  <div className="text-[11px] font-semibold text-[#5a6a80]">Classificação</div>
                  <div className="mt-0.5 text-sm font-bold text-[#1d2a3d]">
                    {doc.tipoClinico}
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'dados' && (
              <div className="space-y-4">
                {/* Resultados de Exames Laboratoriais */}
                {examResults.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-bold text-[#1d2a3d]">Resultados registrados</h2>
                    <div className="divide-y divide-[#dde3ec] rounded-xl border border-[#dde3ec] px-4">
                      {examResults.map((result: any, index: number) => (
                        <div key={`${result.nome || 'resultado'}-${index}`} className="flex flex-wrap justify-between gap-2 py-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-[#1d2a3d]">{result.nome || 'Resultado'}</div>
                            {result.referenciaTexto && (
                              <div className="mt-0.5 text-xs text-[#5a6a80]">Referência: {result.referenciaTexto}</div>
                            )}
                          </div>
                          <div className="text-right font-bold text-[#1d2a3d]">
                            {result.valorTexto || result.valor || 'Não informado'} {result.unidade || ''}
                            {result.status && <div className="text-xs font-medium text-[#5a6a80]">{result.status}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estrutura e dados detalhados identificados pela IA */}
                {indentedContent.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-[#dde3ec] bg-white p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#14211F] border-b border-[#dde3ec] pb-3">
                      <FileText size={17} className="text-[#1D4ED8]" />
                      <span>Dados e estrutura identificados pela IA</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Chaves e Valores (Paciente, Endereço, etc.) */}
                      {indentedContent.some((item: any) => item.chave && item.valor) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {indentedContent
                            .filter((item: any) => item.chave && item.valor)
                            .map((item: any, idx: number) => (
                              <div
                                key={`kv-${idx}`}
                                className="flex flex-col justify-center rounded-xl border border-[#dde3ec] bg-[#f8fafc] px-3.5 py-2.5"
                              >
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6a80]">
                                  {item.chave}
                                </span>
                                <span className="mt-0.5 text-sm font-bold text-[#1d2a3d] break-words">
                                  {item.valor}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Cabeçalhos, Tópicos e Textos formatados */}
                      {indentedContent
                        .filter((item: any) => !item.chave || !item.valor)
                        .map((item: any, idx: number) => {
                          if (item.tipo === 'header' || (!item.tipo && item.texto?.length < 60 && !item.texto?.startsWith('-'))) {
                            return (
                              <div
                                key={`h-${idx}`}
                                className="mt-2 text-sm font-bold text-[#14211F] border-l-2 border-[#1D4ED8] pl-2.5 py-0.5"
                              >
                                {item.texto}
                              </div>
                            );
                          }
                          if (item.tipo === 'bullet' || item.texto?.startsWith('-') || item.texto?.startsWith('•')) {
                            const cleanText = item.texto?.replace(/^[-•]\s*/, '') || '';
                            return (
                              <div
                                key={`b-${idx}`}
                                className="flex items-start gap-2.5 rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-3 text-xs sm:text-sm text-[#1d2a3d]"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1D4ED8] shrink-0" />
                                <span className="leading-relaxed">{cleanText}</span>
                              </div>
                            );
                          }
                          return (
                            <div
                              key={`t-${idx}`}
                              className="rounded-xl bg-[#f1f4f8] p-3 text-xs sm:text-sm leading-relaxed text-[#4a5568]"
                            >
                              {item.texto}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Seções de Texto Complementares (Resumo, Diagnóstico, Conclusões, etc.) */}
                {textSections.map(([label, value]) => (
                  <div key={label as string} className="rounded-xl border border-[#dde3ec] bg-[#f8fafc] p-4">
                    <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#14211F]">{label}</h2>
                    <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[#2d3a4d]">{value as string}</p>
                  </div>
                ))}

                {extractedText && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white overflow-hidden shadow-xs transition-all">
                    <button
                      type="button"
                      onClick={() => setShowExtractedText((open) => !open)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#F4F7FC]"
                      aria-expanded={showExtractedText}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#CFE0FF]/40 text-[#1D4ED8] flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1d2a3d] flex items-center gap-2">
                            Texto extraído
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
                            Transcrição OCR original:
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
                        <div className="max-h-96 overflow-y-auto rounded-xl border border-[#dde3ec] bg-white p-3.5 shadow-inner">
                          <p className="m-0 whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#2d3a4d] select-text">
                            {extractedText}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {examResults.length === 0 && textSections.length === 0 && !extractedText && (
                  <p className="m-0 rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                    Ainda não há dados extraídos para este documento.
                  </p>
                )}
              </div>
            )}

            {hasMedicationTab && activeTab === 'medicamentos' && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#1d2a3d]">Medicamentos registrados</h2>
                {medications.length === 0 ? (
                  <p className="m-0 rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                    Não há medicamentos registrados neste documento.
                  </p>
                ) : medications.map((medication: any, index: number) => (
                  <div key={`${medication.nome || 'medicamento'}-${index}`} className="flex gap-3 rounded-2xl border border-[#dde3ec] bg-[#f8fafc] p-4">
                    <Pill size={20} className="mt-0.5 shrink-0 text-[#1D4ED8]" />
                    <div>
                      <b className="block text-[15px] text-[#14211F]">{medication.nome || 'Medicamento'}</b>
                      {(medication.dosagem || medication.horario) && (
                        <p className="mb-0 mt-1 text-xs text-[#5a6a80]">
                          {[medication.dosagem, medication.horario].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'alertas' && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#1d2a3d]">Alertas registrados</h2>
                {activeAlerts.length === 0 ? (
                  <p className="m-0 rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                    Não há alertas ativos neste documento.
                  </p>
                ) : activeAlerts.map((alert: any, index: number) => (
                  <div key={`${alert.tipo || 'alerta'}-${index}`} className="rounded-2xl border border-[#E8664A]/30 bg-[#E8664A]/10 p-4 text-[#14211F]">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <b className="block text-sm text-[#E8664A]">{alert.tipo || 'Alerta'}{alert.severidade ? ` · ${alert.severidade}` : ''}</b>
                        {alert.mensagem && <p className="mb-0 mt-1 text-xs leading-relaxed text-[#14211F]">{alert.mensagem}</p>}
                      </div>
                      {alert.id && (
                        <button
                          type="button"
                          onClick={() => void handleDismissAlert(alert.id)}
                          disabled={dismissingAlertId !== null}
                          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#E8664A]/40 bg-white px-2.5 text-xs font-bold text-[#E8664A] hover:bg-[#E8664A]/10 disabled:opacity-50 transition-colors"
                        >
                          {dismissingAlertId === alert.id ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
                          Dispensar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5 border-t border-[#E3E8F0] pt-4">
              <button
                type="button"
                onClick={() => { setConfirmedFields(new Set()); setIsEditingModalOpen(true); }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-5 text-sm font-semibold text-[#14211F] transition-all hover:bg-[#F4F7FC] hover:border-[#CFE0FF] shadow-xs"
              >
                <Edit2 size={16} /> Editar dados
              </button>
              {isReviewPending && lowConfidenceFields.length === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmRevisao}
                  disabled={isConfirmingRevisao}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-sm font-semibold text-white transition-all hover:bg-[#1E40AF] active:bg-[#1E3A8A] shadow-xs disabled:opacity-60"
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

      <DialogPrimitive.Root open={isZoomModalOpen} onOpenChange={setIsZoomModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#dde3ec] bg-white p-6 shadow-2xl outline-none">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsZoomModalOpen(false);
                  setLocation('/documentos');
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-4 text-sm font-semibold text-[#14211F] transition-colors hover:bg-[#F4F7FC]"
              >
                <ArrowLeft size={17} />
                Voltar aos documentos
              </button>
              <DialogPrimitive.Close
                aria-label="Fechar visualização ampliada"
                className="rounded-xl p-1 text-[#5B6878] hover:bg-[#F4F7FC] transition-colors"
              >
                <X size={18} />
              </DialogPrimitive.Close>
            </div>
            <div className="flex justify-center rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-4">
              {fileUrl && <img src={fileUrl} alt={`Documento original ampliado: ${docTitle}`} className="max-h-[75vh] object-contain" />}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
