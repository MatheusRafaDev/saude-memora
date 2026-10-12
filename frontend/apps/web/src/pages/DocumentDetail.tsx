import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import {
  Download,
  Trash2,
  ZoomIn,
  AlertTriangle,
  Check,
  Edit2,
  X,
  FileText,
  Pill,
  ExternalLink,
} from 'lucide-react';
import {
  useGetApiDocumentsId,
  useDeleteApiDocumentsId,
  getGetApiDocumentsIdQueryKey,
  customFetch,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export default function DocumentDetail({ id: propId }: { id?: string }) {
  const [, params] = useRoute('/documentos/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deleteMutation = useDeleteApiDocumentsId();

  const id = propId || (params as any)?.id;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id || '');

  const { data: docRaw, refetch } = useGetApiDocumentsId(id || '', {
    query: {
      queryKey: getGetApiDocumentsIdQueryKey(id || ''),
      enabled: isMongoId,
    },
  });

  const [activeTab, setActiveTab] = useState<'dados' | 'medicamentos' | 'alertas'>('dados');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isConfirmingRevisao, setIsConfirmingRevisao] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Form edit state
  const [formData, setFormData] = useState({
    titulo: 'Hemograma completo',
    tipo: 'Exame',
    medico: 'Dr. Silva',
    data: '10/09/2026',
    hemoglobina: '11,2 g/dL',
    hematocrito: '36 %',
    leucocitos: '6.800 /mm³',
    plaquetas: '245 mil/mm³',
  });

  const doc = (docRaw as any) || null;

  useEffect(() => {
    if (doc) {
      setFormData((prev) => ({
        ...prev,
        titulo: doc.titulo || prev.titulo,
        tipo: doc.tipo || prev.tipo,
        medico: doc.medico || prev.medico,
        data: doc.data || prev.data,
      }));
    }
  }, [doc]);

  const docTitle = doc?.titulo || 'Hemograma completo';
  const docType = doc?.tipo || 'Exame';
  const docDate = doc?.data || (doc?.createdAt ? new Date(doc.createdAt).toLocaleDateString('pt-BR') : '10 set 2026');
  const isReviewPending = doc ? Boolean(doc.revisaoPendente) : true;
  const doctorName = doc?.medico || 'Dr. Silva';
  const fileUrl = doc?.fileUrl || null;

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    if (isMongoId && id) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast({ title: 'Documento excluído com sucesso' });
        setLocation('/documentos');
      } catch {
        toast({ title: 'Erro ao excluir documento', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Documento removido' });
      setLocation('/documentos');
    }
  };

  const handleConfirmRevisao = async () => {
    setIsConfirmingRevisao(true);
    try {
      if (isMongoId && id) {
        await customFetch(`/api/documents/${id}/revisao/confirmar`, { method: 'POST' });
        refetch();
      }
      toast({ title: 'Revisão confirmada com sucesso!' });
    } catch {
      toast({ title: 'Erro ao confirmar revisão', variant: 'destructive' });
    } finally {
      setIsConfirmingRevisao(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (isMongoId && id) {
        await customFetch(`/api/documents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: formData.titulo,
            tipo: formData.tipo,
            medico: formData.medico,
            data: formData.data,
          }),
        });
        refetch();
      }
      toast({ title: 'Valores atualizados com sucesso!' });
      setIsEditingModalOpen(false);
    } catch {
      toast({ title: 'Erro ao salvar alterações', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-8 pb-16">
        {/* Breadcrumb */}
        <div className="text-sm text-[#5a6a80] mb-3.5 flex items-center gap-2">
          <Link href="/documentos" className="hover:text-[#1b3a60] transition-colors">
            Documentos
          </Link>
          <span>/</span>
          <span className="text-[#1d2a3d] font-medium">{docTitle}</span>
        </div>

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-5.5">
          <div>
            <h1 className="m-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              {docTitle}
            </h1>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold whitespace-nowrap">
                {docType}
              </span>
              {isReviewPending && (
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#fdf3d8] text-[#6b4208] text-xs font-bold whitespace-nowrap">
                  Revisar
                </span>
              )}
              <span className="text-[13px] text-[#5a6a80] py-1 px-1">
                Adicionado em {docDate}
              </span>
            </div>
          </div>

          <div className="flex gap-2.5">
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Download size={16} strokeWidth={2} /> Baixar
              </a>
            ) : (
              <button
                onClick={() => toast({ title: 'Download iniciado' })}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <Download size={16} strokeWidth={2} /> Baixar
              </button>
            )}

            <button
              onClick={handleDelete}
              className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#a13a30] border border-[#dde3ec] hover:bg-red-50/50 hover:border-[#f0b8b2] transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 size={16} strokeWidth={2} /> Excluir
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        {isReviewPending && (
          <div className="flex gap-3.5 items-center bg-[#fdf3d8] border border-[#e3b95a] rounded-2xl p-4 sm:p-5 mb-5 text-[#4a2c0a]">
            <AlertTriangle size={22} className="text-[#6b4208] shrink-0" strokeWidth={2} />
            <div className="flex-1 min-w-0">
              <b className="text-[15px] block leading-tight">2 campos precisam de conferência</b>
              <div className="text-sm mt-0.5 leading-relaxed">
                Os dados extraídos automaticamente podem conter erros. Compare com o documento original antes de confirmar.
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Documento original */}
          <div className="lg:col-span-6 bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="flex items-center gap-2.5 mb-4">
              <b className="flex-1 text-base text-[#1d2a3d]">Documento original</b>
              <button
                onClick={() => setIsZoomModalOpen(true)}
                className="w-[38px] h-[38px] rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Ampliar documento"
              >
                <ZoomIn size={19} className="text-[#1b3a60]" />
              </button>
              <span className="text-[13px] text-[#5a6a80] font-semibold">Pág. 1 de 2</span>
            </div>

            {/* Document sheet representation or uploaded image */}
            {fileUrl ? (
              <div className="relative bg-slate-100 border border-[#dde3ec] rounded-xl overflow-hidden min-h-[500px] flex items-center justify-center">
                <img
                  src={fileUrl}
                  alt="Original"
                  className="max-h-[640px] w-auto object-contain"
                />
              </div>
            ) : (
              <div className="relative bg-white border border-[#dde3ec] rounded-xl p-8 sm:p-9 min-h-[640px] shadow-[0_20px_40px_-28px_rgba(27,58,96,0.25)] select-none">
                <div className="flex justify-between items-center pb-2">
                  <div className="font-extrabold text-base text-[#1b3a60]">
                    LABORATÓRIO EXEMPLO
                  </div>
                  <div className="text-xs text-[#5a6a80]">Coleta: 10/09/2026</div>
                </div>

                <div className="h-2.5 rounded-full bg-[#d5dce8] w-[60%] mt-3.5" />
                <div className="h-2.5 rounded-full bg-[#d5dce8] w-[40%] mt-2" />
                <div className="h-[1px] bg-[#dde3ec] my-5" />

                <div className="text-xs font-bold text-[#5a6a80] tracking-widest uppercase mb-2">
                  HEMOGRAMA
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-dashed border-[#dde3ec]">
                    <span className="font-semibold">Hemoglobina</span>
                    <span>11,2 g/dL</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-[#dde3ec]">
                    <span className="font-semibold">Hematócrito</span>
                    <span>36 %</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-[#dde3ec]">
                    <span className="font-semibold">Leucócitos</span>
                    <span>6.800 /mm³</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-[#dde3ec]">
                    <span className="font-semibold">Plaquetas</span>
                    <span>245 mil/mm³</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-[#dde3ec]">
                    <span className="font-semibold">Eritrócitos</span>
                    <span>4,1 milhões/mm³</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-[#dde3ec]">
                    <span className="font-semibold">VCM</span>
                    <span>88 fL</span>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-[#d5dce8] w-[70%] mt-6" />
                <div className="h-2.5 rounded-full bg-[#d5dce8] w-[52%] mt-2" />
                <div className="h-2.5 rounded-full bg-[#d5dce8] w-[64%] mt-2" />

                {/* Bounding box 1 */}
                <div className="absolute left-8 right-8 top-[132px] h-[36px] border-2 border-[#e3b95a] bg-[#fdf3d8]/40 rounded-lg pointer-events-none">
                  <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#e3b95a] text-[#4a2c0a] text-xs font-extrabold flex items-center justify-center shadow-xs">
                    1
                  </span>
                </div>

                {/* Bounding box 2 */}
                <div className="absolute left-8 right-8 top-[214px] h-[36px] border-2 border-[#e3b95a] bg-[#fdf3d8]/40 rounded-lg pointer-events-none">
                  <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#e3b95a] text-[#4a2c0a] text-xs font-extrabold flex items-center justify-center shadow-xs">
                    2
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Dados lidos */}
          <div className="lg:col-span-6 bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            {/* Tabs */}
            <div className="flex border-b border-[#dde3ec] mb-5">
              <button
                onClick={() => setActiveTab('dados')}
                className={`px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer border-b-[3px] -mb-[1px] ${
                  activeTab === 'dados'
                    ? 'text-[#1b3a60] border-[#2f7a70]'
                    : 'text-[#5a6a80] border-transparent hover:text-[#1b3a60]'
                }`}
              >
                Dados lidos
              </button>
              <button
                onClick={() => setActiveTab('medicamentos')}
                className={`px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer border-b-[3px] -mb-[1px] ${
                  activeTab === 'medicamentos'
                    ? 'text-[#1b3a60] border-[#2f7a70]'
                    : 'text-[#5a6a80] border-transparent hover:text-[#1b3a60]'
                }`}
              >
                Medicamentos
              </button>
              <button
                onClick={() => setActiveTab('alertas')}
                className={`px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer border-b-[3px] -mb-[1px] ${
                  activeTab === 'alertas'
                    ? 'text-[#1b3a60] border-[#2f7a70]'
                    : 'text-[#5a6a80] border-transparent hover:text-[#1b3a60]'
                }`}
              >
                Alertas
              </button>
            </div>

            {/* Metadados row */}
            <div className="grid grid-cols-3 gap-4 mb-5.5">
              <div className="min-w-[120px]">
                <div className="text-xs text-[#5a6a80] font-semibold">Tipo</div>
                <div className="text-[15px] font-bold text-[#1d2a3d] mt-1">Exame de sangue</div>
              </div>
              <div className="min-w-[120px]">
                <div className="text-xs text-[#5a6a80] font-semibold">Data da coleta</div>
                <div className="text-[15px] font-bold text-[#1d2a3d] mt-1">{docDate}</div>
              </div>
              <div className="min-w-[120px]">
                <div className="text-xs text-[#5a6a80] font-semibold">Solicitante</div>
                <div className="text-[15px] font-bold text-[#1d2a3d] mt-1">{doctorName}</div>
              </div>
            </div>

            {activeTab === 'dados' && (
              <div>
                <div className="text-sm font-bold text-[#1d2a3d] mb-3">
                  Resultados registrados
                </div>

                {/* Hemoglobina (Com Alerta de confiança) */}
                <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-[#e3b95a] bg-[#fffaf0] mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#1d2a3d]">Hemoglobina</div>
                      <div className="text-xs text-[#5a6a80]">Referência: 12,0 – 16,0</div>
                    </div>
                    <div className="text-base font-extrabold text-[#1d2a3d]">
                      {formData.hemoglobina}
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#fdf3d8] text-[#6b4208] text-xs font-bold whitespace-nowrap">
                      Fora da referência
                    </span>
                  </div>
                  <div className="text-xs text-[#6b4208] mt-1.5 font-semibold">
                    Confiança baixa · confira com o original (1)
                  </div>
                </div>

                {/* Hematócrito */}
                <div className="p-3.5 sm:p-4 rounded-2xl border border-[#dde3ec] bg-white mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#1d2a3d]">Hematócrito</div>
                      <div className="text-xs text-[#5a6a80]">Referência: 36 – 46</div>
                    </div>
                    <div className="text-base font-extrabold text-[#1d2a3d]">
                      {formData.hematocrito}
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#e6f4ec] text-[#1f7a4d] text-xs font-bold whitespace-nowrap">
                      Dentro
                    </span>
                  </div>
                </div>

                {/* Leucócitos */}
                <div className="p-3.5 sm:p-4 rounded-2xl border border-[#dde3ec] bg-white mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#1d2a3d]">Leucócitos</div>
                      <div className="text-xs text-[#5a6a80]">Referência: 4.000 – 11.000</div>
                    </div>
                    <div className="text-base font-extrabold text-[#1d2a3d]">
                      {formData.leucocitos}
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#e6f4ec] text-[#1f7a4d] text-xs font-bold whitespace-nowrap">
                      Dentro
                    </span>
                  </div>
                </div>

                {/* Plaquetas */}
                <div className="p-3.5 sm:p-4 rounded-2xl border border-[#dde3ec] bg-white mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#1d2a3d]">Plaquetas</div>
                      <div className="text-xs text-[#5a6a80]">Referência: 150 – 450</div>
                    </div>
                    <div className="text-base font-extrabold text-[#1d2a3d]">
                      {formData.plaquetas}
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#e6f4ec] text-[#1f7a4d] text-xs font-bold whitespace-nowrap">
                      Dentro
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'medicamentos' && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-[#1d2a3d]">Medicamentos prescritos</div>
                <div className="p-4 rounded-2xl border border-[#dde3ec] bg-[#f8fafc]">
                  <b className="text-[15px] text-[#1b3a60] block">Dipirona Monoidratada 500mg</b>
                  <p className="text-xs text-[#5a6a80] mt-1 mb-0">
                    Posologia: 1 comprimido de 6 em 6 horas se houver febre ou dor.
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-[#dde3ec] bg-[#f8fafc]">
                  <b className="text-[15px] text-[#1b3a60] block">Amoxicilina 500mg</b>
                  <p className="text-xs text-[#5a6a80] mt-1 mb-0">
                    Posologia: 1 cápsula de 8 em 8 horas por 7 dias contínuos.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'alertas' && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-[#1d2a3d]">Alertas de segurança e interações</div>
                <div className="p-4 rounded-2xl bg-[#fff5f4] border border-[#f0b8b2] text-[#a13a30]">
                  <b className="text-sm block">Alergia conhecida: Dipirona</b>
                  <p className="text-xs mt-1 mb-0 text-[#1d2a3d]">
                    Consta no seu prontuário alergia cadastrada a Dipirona. Verifique com seu médico antes de administrar este item.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-2.5 mt-6 justify-end">
              <button
                onClick={() => setIsEditingModalOpen(true)}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Editar valor
              </button>
              <button
                onClick={handleConfirmRevisao}
                disabled={isConfirmingRevisao}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1b3a60] text-white hover:bg-[#24507f] transition-colors cursor-pointer disabled:opacity-60"
              >
                <Check size={16} /> Confirmar revisão
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Tela de design com dados de exemplo.
        </p>
      </main>

      {/* Edit Values Modal */}
      <DialogPrimitive.Root open={isEditingModalOpen} onOpenChange={setIsEditingModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#dde3ec] outline-none max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1b3a60]">Editar dados extraídos</h3>
              <DialogPrimitive.Close className="p-1 rounded-lg text-[#5a6a80] hover:bg-slate-100">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">Título</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full h-11 px-3 border border-[#c6cfdb] rounded-xl outline-none focus:border-[#1b3a60]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Médico / Solicitante</label>
                <input
                  type="text"
                  value={formData.medico}
                  onChange={(e) => setFormData({ ...formData, medico: e.target.value })}
                  className="w-full h-11 px-3 border border-[#c6cfdb] rounded-xl outline-none focus:border-[#1b3a60]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Hemoglobina</label>
                  <input
                    type="text"
                    value={formData.hemoglobina}
                    onChange={(e) => setFormData({ ...formData, hemoglobina: e.target.value })}
                    className="w-full h-11 px-3 border border-[#c6cfdb] rounded-xl outline-none focus:border-[#1b3a60]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Hematócrito</label>
                  <input
                    type="text"
                    value={formData.hematocrito}
                    onChange={(e) => setFormData({ ...formData, hematocrito: e.target.value })}
                    className="w-full h-11 px-3 border border-[#c6cfdb] rounded-xl outline-none focus:border-[#1b3a60]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Leucócitos</label>
                  <input
                    type="text"
                    value={formData.leucocitos}
                    onChange={(e) => setFormData({ ...formData, leucocitos: e.target.value })}
                    className="w-full h-11 px-3 border border-[#c6cfdb] rounded-xl outline-none focus:border-[#1b3a60]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Plaquetas</label>
                  <input
                    type="text"
                    value={formData.plaquetas}
                    onChange={(e) => setFormData({ ...formData, plaquetas: e.target.value })}
                    className="w-full h-11 px-3 border border-[#c6cfdb] rounded-xl outline-none focus:border-[#1b3a60]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end mt-6">
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#dde3ec] text-[#5a6a80] font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-[#1b3a60] text-white font-bold text-sm hover:bg-[#24507f] cursor-pointer"
              >
                Salvar alterações
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Zoom Modal */}
      <DialogPrimitive.Root open={isZoomModalOpen} onOpenChange={setIsZoomModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl border border-[#dde3ec] outline-none max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1b3a60]">Visualização ampliada</h3>
              <DialogPrimitive.Close className="p-1 rounded-lg text-[#5a6a80] hover:bg-slate-100">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>
            <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-[#dde3ec]">
              {fileUrl ? (
                <img src={fileUrl} alt="Original ampliado" className="max-h-[75vh] object-contain" />
              ) : (
                <div className="w-full max-w-xl bg-white p-8 rounded-xl border border-[#dde3ec] text-sm">
                  <div className="font-extrabold text-xl text-[#1b3a60] text-center mb-4">
                    LABORATÓRIO EXEMPLO · HEMOGRAMA COMPLETO
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-1 font-medium"><span>Hemoglobina</span><span>11,2 g/dL (Ref: 12,0 - 16,0)</span></div>
                    <div className="flex justify-between border-b pb-1 font-medium"><span>Hematócrito</span><span>36 % (Ref: 36 - 46)</span></div>
                    <div className="flex justify-between border-b pb-1 font-medium"><span>Leucócitos</span><span>6.800 /mm³ (Ref: 4.000 - 11.000)</span></div>
                    <div className="flex justify-between border-b pb-1 font-medium"><span>Plaquetas</span><span>245 mil/mm³ (Ref: 150 - 450)</span></div>
                  </div>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
