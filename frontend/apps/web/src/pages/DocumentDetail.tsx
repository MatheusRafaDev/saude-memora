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
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
  { key: 'especialidade', label: 'Especialidade' },
  { key: 'tipoClinico', label: 'Tipo clínico' },
  { key: 'resumo', label: 'Resumo', multiline: true },
  { key: 'diagnostico', label: 'Diagnóstico', multiline: true },
  { key: 'conteudo', label: 'Conteúdo', multiline: true },
  { key: 'conclusoes', label: 'Conclusões', multiline: true },
  { key: 'observacoes', label: 'Observações', multiline: true },
  { key: 'textoExtraido', label: 'Texto extraído', multiline: true },
];

function createDocumentEditForm(doc: any): DocumentEditForm {
  const textValue = (value: unknown) => (typeof value === 'string' ? value : '');
  return {
    titulo: textValue(doc?.titulo),
    tipo: textValue(doc?.tipo),
    medico: textValue(doc?.medico),
    clinica: textValue(doc?.clinica),
    data: textValue(doc?.data),
    resumo: textValue(doc?.resumo),
    diagnostico: textValue(doc?.diagnostico),
    crm: textValue(doc?.crm),
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

  const doc = (docRaw as any) || null;
  const hasMedicationTab = String(doc?.tipo ?? '').trim().toLowerCase() === 'receita' || (Array.isArray(doc?.medicamentos) && doc.medicamentos.length > 0);

  useEffect(() => {
    if (!doc) return;
    if (!hasMedicationTab) setActiveTab('dados');
    setFormData(createDocumentEditForm(doc));
  }, [doc, hasMedicationTab]);

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
    if (!doc || !id || !isMongoId || isReprocessing) return;
    setIsReprocessing(true);
    const path = doc.status === 'failed' ? 'retry' : 'reprocessar';
    try {
      await customFetch(`/api/documents/${id}/${path}`, { method: 'POST' });
      await refetch();
      toast({ title: path === 'retry' ? 'Documento recolocado na fila.' : 'Reprocessamento iniciado.' });
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
        body: JSON.stringify(formData),
      });
      await refetch();
      toast({ title: 'Documento atualizado com sucesso!' });
      setIsEditingModalOpen(false);
    } catch {
      toast({ title: 'Erro ao salvar alterações', variant: 'destructive' });
    }
  };

  const updateTextField = (key: DocumentTextField, value: string) => {
    setFormData((previous) => ({ ...previous, [key]: value }));
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
        <h1 className="text-xl font-bold text-[#1b3a60]">Documento não encontrado</h1>
        <p className="mt-2 text-sm text-[#5a6a80]">
          Não foi possível carregar este documento da sua conta.
        </p>
        <Link href="/documentos" className="mt-5 inline-flex font-bold text-[#1b3a60] hover:underline">
          Voltar aos documentos
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] pb-16 font-sans text-[#1d2a3d]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-8 sm:px-10">
        <Link
          href="/documentos"
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-4 text-sm font-bold text-[#1b3a60] shadow-xs transition-colors hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Voltar aos documentos
        </Link>

        <div className="mb-3.5 flex items-center gap-2 text-sm text-[#5a6a80]">
          <Link href="/documentos" className="transition-colors hover:text-[#1b3a60]">
            Documentos
          </Link>
          <span>/</span>
          <span className="font-medium text-[#1d2a3d]">{docTitle}</span>
        </div>

        <div className="mb-5.5 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="m-0 text-3xl font-extrabold tracking-[-0.035em] text-[#1b3a60] sm:text-4xl">
              {docTitle}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap rounded-full bg-[#e5eefb] px-2.5 py-1 text-xs font-bold text-[#1f7fe0]">
                {doc.tipo || 'Tipo não informado'}
              </span>
              {['processing', 'pending'].includes(doc.status) && <span className="whitespace-nowrap rounded-full bg-[#e5eefb] px-2.5 py-1 text-xs font-bold text-[#1b3a60]">Processando</span>}
              {doc.status === 'failed' && <span className="whitespace-nowrap rounded-full bg-[#fde8e6] px-2.5 py-1 text-xs font-bold text-[#a13a30]">Falhou</span>}
              {isReviewPending && (
                <span className="whitespace-nowrap rounded-full bg-[#fdf3d8] px-2.5 py-1 text-xs font-bold text-[#6b4208]">
                  Revisar
                </span>
              )}
              <span className="px-1 py-1 text-[13px] text-[#5a6a80]">Adicionado em {docDate}</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            {!['processing', 'pending'].includes(doc.status) && (
              <button
                type="button"
                onClick={handleReprocess}
                disabled={isReprocessing}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-4 text-sm font-bold text-[#1b3a60] shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {isReprocessing ? <LoaderCircle size={16} className="animate-spin" /> : <RotateCw size={16} />}
                {doc.status === 'failed' ? 'Tentar novamente' : 'Reprocessar'}
              </button>
            )}
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-5 text-sm font-bold text-[#1d2a3d] shadow-xs transition-colors hover:bg-slate-50"
              >
                <Download size={16} strokeWidth={2} /> Baixar
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Arquivo original indisponível"
                className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-5 text-sm font-bold text-[#5a6a80] opacity-60"
              >
                <Download size={16} strokeWidth={2} /> Original indisponível
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-5 text-sm font-bold text-[#a13a30] shadow-xs transition-colors hover:border-[#f0b8b2] hover:bg-red-50/50"
            >
              <Trash2 size={16} strokeWidth={2} /> Excluir
            </button>
          </div>
        </div>

        {doc.errorMessage && (
          <div role="status" className="mb-5 rounded-xl border border-[#f0b8b2] bg-[#fff5f4] px-4 py-3 text-sm text-[#8a3028]">
            {doc.errorMessage}
          </div>
        )}

        {isReviewPending && (
          <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-[#e3b95a] bg-[#fdf3d8] p-4 text-[#4a2c0a] sm:p-5">
            <AlertTriangle size={22} className="shrink-0 text-[#6b4208]" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <b className="block text-[15px] leading-tight">
                {lowConfidenceFields.length > 0
                  ? `${lowConfidenceFields.length} campo(s) precisam de conferência`
                  : 'Este documento precisa de conferência'}
              </b>
              <div className="mt-0.5 text-sm leading-relaxed">
                Confira as informações extraídas comparando-as com o documento original.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] lg:col-span-6">
            <div className="mb-4 flex items-center gap-2.5">
              <b className="flex-1 text-base text-[#1d2a3d]">Documento original</b>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                disabled={!fileUrl}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8] transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                title={fileUrl ? 'Ampliar documento' : 'Arquivo original indisponível'}
              >
                <ZoomIn size={19} className="text-[#1b3a60]" />
              </button>
              <span className="text-[13px] font-semibold text-[#5a6a80]">
                {imageUrls.length > 0 ? `${imageUrls.length} página(s)` : 'Original indisponível'}
              </span>
            </div>
            {fileUrl ? (
              <div className="flex min-h-[500px] items-center justify-center overflow-hidden rounded-xl border border-[#dde3ec] bg-slate-100">
                <img src={fileUrl} alt={`Documento original: ${docTitle}`} className="max-h-[640px] w-auto object-contain" />
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#c6cfdb] bg-[#f7f9fc] p-8 text-center">
                <FileText size={40} className="mb-3 text-[#5a6a80]" />
                <p className="m-0 text-sm text-[#5a6a80]">
                  O arquivo original não está disponível para este documento.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] lg:col-span-6">
            <div className="mb-5 flex border-b border-[#dde3ec]">
              {([
                ['dados', 'Dados lidos'],
                ['medicamentos', 'Medicamentos'],
                ['alertas', 'Alertas'],
              ] as const)
                .filter(([tab]) => tab !== 'medicamentos' || hasMedicationTab)
                .map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`-mb-px cursor-pointer border-b-[3px] px-4 py-2.5 text-sm font-bold transition-colors ${
                      activeTab === tab
                        ? 'border-[#1f7fe0] text-[#1b3a60]'
                        : 'border-transparent text-[#5a6a80] hover:text-[#1b3a60]'
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
                    <div className="text-xs text-[#1f7fe0] font-semibold mt-0.5">
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
                  <div className="mt-0.5 text-sm font-bold text-[#1b3a60] inline-block bg-[#e5eefb] px-2 py-0.5 rounded font-mono">
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
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1b3a60] border-b border-[#dde3ec] pb-3">
                      <FileText size={17} className="text-[#1f7fe0]" />
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
                                className="mt-2 text-sm font-bold text-[#1b3a60] border-l-2 border-[#1f7fe0] pl-2.5 py-0.5"
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
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1f7fe0] shrink-0" />
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
                    <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1b3a60]">{label}</h2>
                    <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[#2d3a4d]">{value as string}</p>
                  </div>
                ))}

                {extractedText && (
                  <div className="rounded-2xl border border-[#dde3ec] bg-white overflow-hidden shadow-xs transition-all">
                    <div
                      onClick={() => setShowExtractedText(!showExtractedText)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setShowExtractedText(!showExtractedText);
                        }
                      }}
                      aria-expanded={showExtractedText}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#f1f4f8] text-[#1b3a60] flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1d2a3d] flex items-center gap-2">
                            Texto extraído
                          </div>
                          <div className="text-xs text-[#5a6a80]">
                            {showExtractedText ? 'Clique na chavinha para fechar' : 'Clique na chavinha para abrir o texto completo'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-semibold text-[#5a6a80] hidden sm:inline">
                          {showExtractedText ? 'Aberto' : 'Fechado'}
                        </span>
                        <Switch
                          checked={showExtractedText}
                          onCheckedChange={setShowExtractedText}
                          className="data-[state=checked]:bg-[#1b3a60] data-[state=unchecked]:bg-slate-300 cursor-pointer"
                          aria-label="Alternar visualização do texto extraído"
                        />
                        <ChevronDown
                          size={18}
                          className={`text-[#5a6a80] transition-transform duration-200 cursor-pointer ${
                            showExtractedText ? 'rotate-180' : ''
                          }`}
                          onClick={() => setShowExtractedText(!showExtractedText)}
                        />
                      </div>
                    </div>

                    {showExtractedText && (
                      <div className="border-t border-[#dde3ec] bg-[#f8fafc] p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#5a6a80]">
                            Transcrição OCR original:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyExtractedText}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b3a60] hover:text-[#24507f] hover:underline cursor-pointer"
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
                    <Pill size={20} className="mt-0.5 shrink-0 text-[#1b3a60]" />
                    <div>
                      <b className="block text-[15px] text-[#1b3a60]">{medication.nome || 'Medicamento'}</b>
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
                  <div key={`${alert.tipo || 'alerta'}-${index}`} className="rounded-2xl border border-[#f0b8b2] bg-[#fff5f4] p-4 text-[#a13a30]">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <b className="block text-sm">{alert.tipo || 'Alerta'}{alert.severidade ? ` · ${alert.severidade}` : ''}</b>
                        {alert.mensagem && <p className="mb-0 mt-1 text-xs leading-relaxed text-[#1d2a3d]">{alert.mensagem}</p>}
                      </div>
                      {alert.id && (
                        <button
                          type="button"
                          onClick={() => void handleDismissAlert(alert.id)}
                          disabled={dismissingAlertId !== null}
                          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#f0b8b2] bg-white px-2.5 text-xs font-bold text-[#8a3028] hover:bg-[#fff5f4] disabled:opacity-50"
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

            <div className="mt-6 flex justify-end gap-2.5 border-t border-[#dde3ec] pt-4">
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-5 text-sm font-bold text-[#1d2a3d] transition-colors hover:bg-slate-50"
              >
                <Edit2 size={16} /> Editar dados
              </button>
              {isReviewPending && (
                <button
                  type="button"
                  onClick={handleConfirmRevisao}
                  disabled={isConfirmingRevisao}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1b3a60] px-5 text-sm font-bold text-white transition-colors hover:bg-[#24507f] disabled:opacity-60"
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
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#dde3ec] bg-white p-6 shadow-2xl outline-none">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1b3a60]">Editar dados do documento</h3>
              <DialogPrimitive.Close className="rounded-lg p-1 text-[#5a6a80] hover:bg-slate-100">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>
            <div className="space-y-6 text-sm">
              <section>
                <h4 className="mb-3 font-bold text-[#1b3a60]">Identificação</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold" htmlFor="document-tipo">Tipo</label>
                    <select
                      id="document-tipo"
                      value={formData.tipo}
                      onChange={(event) => updateTextField('tipo', event.target.value)}
                      className="h-11 w-full rounded-xl border border-[#c6cfdb] bg-white px-3 outline-none focus:border-[#1b3a60]"
                    >
                      {['exame', 'receita', 'laudo', 'atestado', 'vacina', 'encaminhamento', 'relatorio', 'outro'].map((type) => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  {documentTextFields.map(({ key, label, multiline }) => (
                    <div key={key} className={multiline ? 'sm:col-span-2' : undefined}>
                      <label className="mb-1 block font-semibold" htmlFor={`document-${key}`}>{label}</label>
                      {multiline ? (
                        <textarea
                          id={`document-${key}`}
                          rows={key === 'textoExtraido' || key === 'conteudo' ? 5 : 3}
                          value={formData[key]}
                          onChange={(event) => updateTextField(key, event.target.value)}
                          className="w-full rounded-xl border border-[#c6cfdb] p-3 outline-none focus:border-[#1b3a60]"
                        />
                      ) : (
                        <input
                          id={`document-${key}`}
                          type="text"
                          value={formData[key]}
                          onChange={(event) => updateTextField(key, event.target.value)}
                          className="h-11 w-full rounded-xl border border-[#c6cfdb] px-3 outline-none focus:border-[#1b3a60]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-[#1b3a60]">Medicamentos</h4>
                  <button
                    type="button"
                    onClick={() => setFormData((previous) => ({
                      ...previous,
                      medicamentos: [...previous.medicamentos, { nome: '', dosagem: '', horario: '' }],
                    }))}
                    className="rounded-lg border border-[#dde3ec] px-3 py-2 text-xs font-bold text-[#1b3a60] hover:bg-slate-50"
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
                            onChange={(event) => setFormData((previous) => ({
                              ...previous,
                              medicamentos: previous.medicamentos.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, [field]: event.target.value } : item),
                            }))}
                            className="mt-1 h-10 w-full rounded-lg border border-[#c6cfdb] px-3 font-normal outline-none focus:border-[#1b3a60]"
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData((previous) => ({
                          ...previous,
                          medicamentos: previous.medicamentos.filter((_, itemIndex) => itemIndex !== index),
                        }))}
                        aria-label={`Remover medicamento ${index + 1}`}
                        className="self-end rounded-lg px-3 py-2 font-bold text-[#a13a30] hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-[#1b3a60]">Resultados de exames</h4>
                  <button
                    type="button"
                    onClick={() => setFormData((previous) => ({
                      ...previous,
                      resultadosExame: [...previous.resultadosExame, {
                        nome: '', nomeNormalizado: '', valor: null, valorTexto: '', unidade: '',
                        refMin: null, refMax: null, referenciaTexto: '', status: 'indefinido',
                        confianca: 1, confirmacaoNecessaria: false, motivoConfirmacao: '',
                      }],
                    }))}
                    className="rounded-lg border border-[#dde3ec] px-3 py-2 text-xs font-bold text-[#1b3a60] hover:bg-slate-50"
                  >
                    Adicionar resultado
                  </button>
                </div>
                {formData.resultadosExame.length === 0 && (
                  <p className="text-sm text-[#5a6a80]">Nenhum resultado de exame registrado.</p>
                )}
                <div className="space-y-3">
                  {formData.resultadosExame.map((result, index) => (
                    <div key={index} className="space-y-3 rounded-xl border border-[#dde3ec] p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {([
                          ['nome', 'Exame'],
                          ['nomeNormalizado', 'Nome normalizado'],
                          ['valorTexto', 'Valor exibido'],
                          ['unidade', 'Unidade'],
                          ['referenciaTexto', 'Referência'],
                          ['status', 'Status'],
                          ['motivoConfirmacao', 'Motivo da confirmação'],
                        ] as const).map(([field, label]) => (
                          <label key={field} className="block font-semibold">
                            {label}
                            <input
                              value={result[field]}
                              onChange={(event) => setFormData((previous) => ({
                                ...previous,
                                resultadosExame: previous.resultadosExame.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, [field]: event.target.value } : item),
                              }))}
                              className="mt-1 h-10 w-full rounded-lg border border-[#c6cfdb] px-3 font-normal outline-none focus:border-[#1b3a60]"
                            />
                          </label>
                        ))}
                        {([
                          ['valor', 'Valor numérico'],
                          ['refMin', 'Referência mínima'],
                          ['refMax', 'Referência máxima'],
                          ['confianca', 'Confiança'],
                        ] as const).map(([field, label]) => (
                          <label key={field} className="block font-semibold">
                            {label}
                            <input
                              type="number"
                              step="any"
                              value={result[field] ?? ''}
                              onChange={(event) => updateExamResultNumber(index, field, event.target.value)}
                              className="mt-1 h-10 w-full rounded-lg border border-[#c6cfdb] px-3 font-normal outline-none focus:border-[#1b3a60]"
                            />
                          </label>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 font-semibold">
                        <input
                          type="checkbox"
                          checked={result.confirmacaoNecessaria}
                          onChange={(event) => setFormData((previous) => ({
                            ...previous,
                            resultadosExame: previous.resultadosExame.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, confirmacaoNecessaria: event.target.checked } : item),
                          }))}
                        />
                        Requer confirmação
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData((previous) => ({
                          ...previous,
                          resultadosExame: previous.resultadosExame.filter((_, itemIndex) => itemIndex !== index),
                        }))}
                        className="ml-4 rounded-lg px-3 py-2 font-bold text-[#a13a30] hover:bg-red-50"
                      >
                        Remover resultado
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-[#1b3a60]">Conteúdo estruturado</h4>
                  <button
                    type="button"
                    onClick={() => setFormData((previous) => ({
                      ...previous,
                      conteudoIndentado: [...previous.conteudoIndentado, { tipo: '', texto: '', chave: '', valor: '' }],
                    }))}
                    className="rounded-lg border border-[#dde3ec] px-3 py-2 text-xs font-bold text-[#1b3a60] hover:bg-slate-50"
                  >
                    Adicionar campo
                  </button>
                </div>
                {formData.conteudoIndentado.length === 0 && (
                  <p className="text-sm text-[#5a6a80]">Nenhum campo estruturado registrado.</p>
                )}
                <div className="space-y-3">
                  {formData.conteudoIndentado.map((item, index) => (
                    <div key={index} className="grid gap-3 rounded-xl border border-[#dde3ec] p-3 sm:grid-cols-4">
                      {([
                        ['tipo', 'Tipo'],
                        ['texto', 'Texto'],
                        ['chave', 'Chave'],
                        ['valor', 'Valor'],
                      ] as const).map(([field, label]) => (
                        <label key={field} className="block font-semibold">
                          {label}
                          <input
                            value={item[field]}
                            onChange={(event) => setFormData((previous) => ({
                              ...previous,
                              conteudoIndentado: previous.conteudoIndentado.map((row, itemIndex) =>
                                itemIndex === index ? { ...row, [field]: event.target.value } : row),
                            }))}
                            className="mt-1 h-10 w-full rounded-lg border border-[#c6cfdb] px-3 font-normal outline-none focus:border-[#1b3a60]"
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData((previous) => ({
                          ...previous,
                          conteudoIndentado: previous.conteudoIndentado.filter((_, itemIndex) => itemIndex !== index),
                        }))}
                        className="justify-self-start rounded-lg px-3 py-2 font-bold text-[#a13a30] hover:bg-red-50 sm:col-span-4"
                      >
                        Remover campo
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="cursor-pointer rounded-xl border border-[#dde3ec] px-4 py-2.5 text-sm font-bold text-[#5a6a80] hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="cursor-pointer rounded-xl bg-[#1b3a60] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#24507f]"
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
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dde3ec] px-3 text-sm font-bold text-[#1b3a60] transition-colors hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
                Voltar aos documentos
              </button>
              <DialogPrimitive.Close
                aria-label="Fechar visualização ampliada"
                className="rounded-lg p-1 text-[#5a6a80] hover:bg-slate-100"
              >
                <X size={18} />
              </DialogPrimitive.Close>
            </div>
            <div className="flex justify-center rounded-2xl border border-[#dde3ec] bg-slate-50 p-4">
              {fileUrl && <img src={fileUrl} alt={`Documento original ampliado: ${docTitle}`} className="max-h-[75vh] object-contain" />}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
