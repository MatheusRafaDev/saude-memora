import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileText,
  Shield,
  AlertTriangle,
  RotateCw,
  LoaderCircle,
  Check,
  CheckCircle2,
  ShieldCheck,
  FileBarChart,
  FileHeart,
  FileSearch,
  Send,
  Syringe,
  Pill,
  Activity,
  Sparkles,
  Camera,
  Clipboard,
  Info,
  Layers,
} from 'lucide-react';
import { customFetch, getGetApiDocumentsQueryKey } from '@workspace/api-client-react';
import { waitForDocumentProcessing, getInvalidDocumentMessage } from '@/lib/document-processing';
import { useToast } from '@/hooks/use-toast';

type UploadQueueItem = {
  id: string;
  name: string;
  sizeStr: string;
  progress: number;
  status: 'pronto' | 'processando' | 'fila' | 'falha';
  statusText: string;
  documentId?: string;
  error?: string;
  previewUrl?: string;
  detectedType?: string;
};

const DOC_TYPES = [
  { id: 'auto', label: 'Identificação Automática', icon: Layers },
  { id: 'receita', label: 'Receita', icon: Pill },
  { id: 'exame', label: 'Exame', icon: Activity },
  { id: 'laudo', label: 'Laudo', icon: FileSearch },
  { id: 'atestado', label: 'Atestado', icon: FileHeart },
  { id: 'vacina', label: 'Vacina', icon: Syringe },
  { id: 'encaminhamento', label: 'Encaminhamento', icon: Send },
  { id: 'relatorio', label: 'Relatório', icon: FileBarChart },
];
const SUPPORTED_FILE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);

function getDocumentTypeOption(type?: string) {
  return DOC_TYPES.find((option) => option.id === type) ?? DOC_TYPES[0];
}

export default function Upload() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const ext = file.type.split('/')[1] || 'png';
            pastedFiles.push(new File([file], `colado-${Date.now()}.${ext}`, { type: file.type }));
          }
        }
      }
      if (pastedFiles.length > 0) {
        void handleFiles(pastedFiles);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedType]);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !SUPPORTED_FILE_EXTENSIONS.has(extension)) {
        toast({
          title: 'Formato não suportado',
          description: `${file.name}: envie um arquivo PDF, JPG ou PNG.`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} ultrapassa o limite de 10 MB.`,
          variant: 'destructive',
        });
        continue;
      }

      const tempId = `upload-${Date.now()}-${Math.random()}`;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB · enviando`;

      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

      const newItem: UploadQueueItem = {
        id: tempId,
        name: file.name,
        sizeStr,
        progress: 20,
        status: 'processando',
        statusText: 'Processando 20%',
        previewUrl,
        detectedType: selectedType,
      };

      setQueue((prev) => [newItem, ...prev]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (selectedType !== 'auto') {
          formData.append('documentType', selectedType);
        }

        const res = (await customFetch('/api/documents/upload', {
          method: 'POST',
          body: formData as any,
        })) as any;

        setQueue((prev) => prev.map((item) => item.id === tempId ? { ...item, documentId: res.id } : item));

        void queryClient.invalidateQueries({ queryKey: getGetApiDocumentsQueryKey() });
        window.dispatchEvent(new CustomEvent('document-uploaded'));

        if (res.status === 'pronto') {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    progress: 100,
                    status: 'pronto',
                    statusText: 'Pronto',
                    detectedType: selectedType,
                    sizeStr: `${(file.size / (1024 * 1024)).toFixed(1)} MB · enviado`,
                  }
                : item
            )
          );
          toast({ title: 'Documento processado com sucesso!' });
          continue;
        }

        // Wait for worker processing
        const outcome = await waitForDocumentProcessing(res.id, {
          onProgress: (p) => {
            setQueue((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? {
                      ...item,
                      progress: p,
                      statusText: `Processando ${p}%`,
                    }
                  : item
              )
            );
          },
        });

        if (outcome.status === 'pronto') {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    progress: 100,
                    status: 'pronto',
                    statusText: 'Pronto',
                    detectedType: outcome.tipo || selectedType,
                    sizeStr: `${(file.size / (1024 * 1024)).toFixed(1)} MB · concluído`,
                  }
                : item
            )
          );
          toast({ title: 'Documento concluído e catalogado!' });
        } else if (outcome.status === 'timeout') {
          setQueue((prev) =>
            prev.map((item) => item.id === tempId
              ? { ...item, status: 'fila', statusText: 'Continua no acervo', error: undefined }
              : item)
          );
          toast({ title: 'O processamento continua', description: 'Acompanhe o documento no seu acervo; não é necessário reenviá-lo.' });
        } else {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    status: 'falha',
                    statusText: 'Falhou',
                    error: 'message' in outcome ? (outcome as any).message : 'Erro ao processar arquivo.',
                  }
                : item
            )
          );
        }
      } catch (err) {
        const invalidMsg = getInvalidDocumentMessage(err);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  status: 'falha',
                  statusText: 'Falhou',
                  error: invalidMsg || 'Erro no envio do documento.',
                }
              : item
          )
        );
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    void handleFiles(files);
  };

  return (
    <div className="min-h-screen bg-white text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-8 pb-16">
        {/* Breadcrumb */}
        <div className="text-sm text-[#5B6878] mb-3.5 flex items-center gap-2">
          <Link href="/documentos" className="hover:text-[#1D4ED8] transition-colors">
            Documentos
          </Link>
          <span>/</span>
          <span className="text-[#14211F] font-medium">Adicionar documento</span>
        </div>

        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase text-[#1D4ED8] mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
              Envio de arquivos
            </div>
            <h1 className="mt-1 mb-0 text-3xl sm:text-4xl font-bold tracking-tight text-[#14211F]">
              Adicionar documento
            </h1>
            <p className="mt-1.5 mb-0 text-[#5B6878] text-sm sm:text-base">
              Selecione vários arquivos: cada um será salvo como um documento, e o tipo será identificado automaticamente.
            </p>
          </div>
        </div>

        {/* 2-col Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-1.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setIsBatchMode(false)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  !isBatchMode
                    ? 'bg-white text-[#1D4ED8] shadow-xs'
                    : 'text-[#5B6878] hover:text-[#14211F]'
                }`}
              >
                <FileText size={16} />
                <span>Documento único</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBatchMode(true)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isBatchMode
                    ? 'bg-white text-[#1D4ED8] shadow-xs ring-1 ring-[#1D4ED8]/20'
                    : 'text-[#5B6878] hover:text-[#14211F]'
                }`}
              >
                <Layers size={16} />
                <span>Enviar em lote (vários arquivos)</span>
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-[24px] bg-[#F4F7FC] py-12 px-6 text-center transition-all duration-200 ${
                isDragging ? 'border-[#1D4ED8] bg-[#CFE0FF]/30 scale-[1.01]' : 'border-[#E3E8F0] hover:border-[#1D4ED8] hover:bg-[#F8FAFC]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = '';
                  void handleFiles(files);
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = '';
                  void handleFiles(files);
                }}
              />

              <div className="w-[72px] h-[72px] rounded-[24px] bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] mx-auto mb-4 flex items-center justify-center shadow-md">
                <UploadCloud size={32} className="text-white" strokeWidth={2} />
              </div>

              <div className="text-[22px] font-bold tracking-tight text-[#14211F]">
                Arraste seus documentos aqui
              </div>
              <p className="mt-1.5 mb-5 text-[#5B6878] text-sm sm:text-base">
                ou utilize uma das opções rápidas abaixo para enviar suas fotos e laudos
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-white border border-[#E3E8F0] text-[#14211F] hover:border-[#1D4ED8] hover:bg-[#F4F7FC] transition-colors cursor-pointer shadow-xs active:scale-98"
                >
                  <Camera size={16} className="text-[#1D4ED8]" />
                  <span>Tirar foto agora</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors cursor-pointer shadow-xs active:scale-98"
                >
                  <UploadCloud size={16} />
                  <span>Escolher arquivos / PDF</span>
                </button>
              </div>

              <div className="mt-4 text-[12px] text-[#5B6878] flex items-center justify-center gap-1.5">
                <Clipboard size={13} className="text-[#1D4ED8]" />
                <span>Dica: Você também pode colar capturas de tela com <strong>Ctrl+V</strong></span>
              </div>
              <div className="mt-1 text-[11px] text-[#5B6878]">
                PDF, JPG ou PNG · até 10 MB por arquivo
              </div>
            </div>

            {/* Document Type Selector Card */}
            <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-5.5 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-bold text-[#14211F]">
                  Tipo dos documentos
                </div>
                <span className="text-xs text-[#1D4ED8] font-semibold">
                  Organização automática
                </span>
              </div>
              <p className="mb-3.5 text-xs text-[#5B6878]">
                O sistema identifica e categoriza o tipo de cada exame, receita ou laudo para você revisar.
              </p>
              <div className="flex gap-2 flex-wrap">
                {DOC_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(t.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8] shadow-xs scale-[1.02]'
                          : 'bg-white text-[#14211F] border border-[#E3E8F0] hover:border-[#CFE0FF] hover:bg-[#F4F7FC]'
                      }`}
                    >
                      <Icon size={15} className={isSelected ? 'text-white' : 'text-[#1D4ED8]'} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enviados agora Card */}
            <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#F4F7FC] flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[#1D4ED8]" />
                </div>
                <b className="text-base font-bold text-[#14211F] flex-1">Enviados agora</b>
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] text-[#14211F] text-xs font-medium whitespace-nowrap">
                  {queue.length} arquivos
                </span>
              </div>

              <div className="divide-y divide-[#E3E8F0]">
                {queue.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5 py-4">
                    {/* File icon preview */}
                    {item.previewUrl ? (
                      <div className="w-11 h-14 rounded-lg overflow-hidden border border-[#E3E8F0] shrink-0 bg-white shadow-xs">
                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-11 h-14 rounded-lg bg-white border border-[#E3E8F0] p-2.5 shrink-0 flex flex-col justify-between shadow-xs">
                        <div className="space-y-1">
                          <div className="h-[4px] rounded-[2px] bg-[#E3E8F0] w-[90%]" />
                          <div className="h-[4px] rounded-[2px] bg-[#E3E8F0] w-[65%]" />
                          <div className="h-[4px] rounded-[2px] bg-[#E3E8F0] w-[85%]" />
                        </div>
                        <div className="h-[4px] rounded-[2px] bg-[#CFE0FF] w-[70%]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <b className="text-[15px] text-[#14211F] truncate">{item.name}</b>
                        {item.status === 'pronto' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#CFE0FF] text-[#1D4ED8] text-xs font-semibold whitespace-nowrap">
                            Revisado
                          </span>
                        )}
                        {item.status === 'processando' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] text-[#14211F] text-xs font-medium whitespace-nowrap">
                            {item.statusText}
                          </span>
                        )}
                        {item.status === 'fila' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#FDE1DA] border border-[#E8664A]/30 text-[#9B2C16] text-xs font-semibold whitespace-nowrap">
                            Na fila
                          </span>
                        )}
                        {item.status === 'falha' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#FDE1DA] border border-[#E8664A]/30 text-[#9B2C16] text-xs font-semibold whitespace-nowrap">
                            Falhou
                          </span>
                        )}
                      </div>

                      <div className="text-[13px] text-[#5B6878] mb-2">
                        {item.sizeStr}
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-[#F4F7FC] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'pronto'
                              ? 'bg-[#1D4ED8]'
                              : item.status === 'processando'
                              ? 'bg-[#1D4ED8]'
                              : item.status === 'fila'
                              ? 'bg-[#E8664A]'
                              : 'bg-[#9B2C16]'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      {item.error && (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex gap-2 items-center mt-2 text-[13px] text-[#9B2C16] font-semibold cursor-pointer hover:underline"
                        >
                          <RotateCw size={14} />
                          {item.error}
                        </div>
                      )}
                      {item.documentId && item.status === 'fila' && (
                        <Link href={`/documentos/${item.documentId}`} className="mt-2 inline-flex text-[13px] font-bold text-[#1D4ED8] hover:underline">
                          Acompanhar no acervo
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Como funciona Card */}
            <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-6 shadow-xs">
              <div className="text-base font-bold text-[#14211F] mb-4">
                Como funciona
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <b className="text-[15px] font-bold text-[#14211F] block">Envie</b>
                    <div className="text-[13px] text-[#5B6878] leading-relaxed mt-0.5">
                      Foto ou PDF do documento.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <b className="text-[15px] font-bold text-[#14211F] block">Processamento e Triagem</b>
                    <div className="text-[13px] text-[#5B6878] leading-relaxed mt-0.5">
                      Digitalização estruturada e catalogação dos parâmetros laboratoriais.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <b className="text-[15px] font-bold text-[#14211F] block">Confira</b>
                    <div className="text-[13px] text-[#5B6878] leading-relaxed mt-0.5">
                      Revise e valide com o original sempre visível.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boas práticas Card */}
            <div className="bg-[#CFE0FF]/30 border border-[#CFE0FF] rounded-[20px] p-5.5">
              <div className="flex gap-2.5 items-center font-extrabold text-[#1D4ED8] mb-2.5 text-base">
                <Shield size={20} strokeWidth={2} />
                Boas práticas
              </div>
              <ul className="m-0 pl-4.5 text-sm leading-relaxed text-[#1d2a3d] space-y-1">
                <li>Fotografe em local bem iluminado</li>
                <li>Enquadre a página inteira</li>
                <li>Evite sombras e reflexos</li>
              </ul>
            </div>

            {/* Accuracy & Privacy Disclaimer Card */}
            <div className="bg-white border border-[#CFE0FF] rounded-[20px] p-4.5 shadow-2xs">
              <div className="flex gap-2.5 items-start text-[13px] leading-relaxed text-[#14211F]">
                <ShieldCheck size={18} className="text-[#1D4ED8] shrink-0 mt-0.5" />
                <span>
                  <strong>Conferência Documental:</strong> Compare as informações digitalizadas com o laudo original para validar resultados e dosagens. Você mantém autonomia total para auditar, retificar ou excluir arquivos a qualquer momento.
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          A fila mostra somente os arquivos enviados nesta sessão.
        </p>
      </main>
    </div>
  );
}
