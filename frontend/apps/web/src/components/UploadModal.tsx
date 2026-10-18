import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import {
  UploadCloud,
  X,
  LoaderCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
  Pill,
  Activity,
  FileSearch,
  FileHeart,
  Syringe,
  Send,
  FileBarChart,
  Layers,
  Camera,
  Clipboard,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';
import { waitForDocumentProcessing, getInvalidDocumentMessage } from '@/lib/document-processing';

interface UploadModalProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (docId: string) => void;
}

interface FilePreviewItem {
  file: File;
  url: string | null;
  isImage: boolean;
  isPdf: boolean;
}

const TYPE_OPTIONS = [
  { id: 'outro', label: 'Triagem Automática', icon: Sparkles, badge: 'IA' },
  { id: 'receita', label: 'Receita', icon: Pill },
  { id: 'exame', label: 'Exame', icon: Activity },
  { id: 'laudo', label: 'Laudo', icon: FileSearch },
  { id: 'atestado', label: 'Atestado', icon: FileHeart },
  { id: 'vacina', label: 'Vacina', icon: Syringe },
  { id: 'encaminhamento', label: 'Encaminhamento', icon: Send },
  { id: 'relatorio', label: 'Relatório', icon: FileBarChart },
];

const PIPELINE_STEPS = [
  { id: 1, title: 'Upload & Criptografia segura', desc: 'Protegendo seus dados de saúde com TLS/AES-256', threshold: 0 },
  { id: 2, title: 'OCR & Leitura de alta resolução', desc: 'Digitalização avançada de texto manuscrito e impresso', threshold: 30 },
  { id: 3, title: 'Estruturação de dados clínicos', desc: 'Identificação de dosagens, biomarcadores e CRM', threshold: 65 },
  { id: 4, title: 'Catalogação no prontuário', desc: 'Organização automática na sua linha do tempo médica', threshold: 90 },
];

const SUPPORTED_FILE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadModal({ open: externalOpen, onClose: externalOnClose, onSuccess }: UploadModalProps) {
  const [, setLocation] = useLocation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [selectedType, setSelectedType] = useState('outro');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreviewItem[]>([]);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(true); // Enviar em lote (cada arquivo = 1 documento)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error' | 'timeout'>('idle');
  const [progress, setProgress] = useState(0);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);
  const [batchTotalCount, setBatchTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultId, setResultId] = useState<string | null>(null);
  const [processedDocsCount, setProcessedDocsCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isAppendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const handler = (e: any) => {
      const mode = e?.detail?.mode;
      setInternalOpen(true);
      setStatus('idle');
      setFiles([]);
      setIsBatchMode(mode === 'batch');
      setProgress(0);
      setBatchCurrentIndex(0);
      setBatchTotalCount(0);
      setProcessedDocsCount(0);
      setErrorMessage('');
      setZoomedImage(null);
    };
    window.addEventListener('open-upload-modal', handler);
    return () => window.removeEventListener('open-upload-modal', handler);
  }, []);

  // Generate previews and clean up object URLs
  useEffect(() => {
    const items: FilePreviewItem[] = files.map((file) => {
      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      return {
        file,
        url: isImage ? URL.createObjectURL(file) : null,
        isImage,
        isPdf,
      };
    });

    setFilePreviews(items);

    return () => {
      items.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [files]);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomedImage) {
          setZoomedImage(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomedImage]);

  // Handle clipboard paste (Ctrl+V)
  useEffect(() => {
    if (!isOpen || status !== 'idle') return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const extension = file.type.split('/')[1] || 'png';
            const renamedFile = new File([file], `colado-${Date.now()}.${extension}`, { type: file.type });
            pastedFiles.push(renamedFile);
          }
        }
      }
      if (pastedFiles.length > 0) {
        if (!validateFiles(pastedFiles)) return;
        setErrorMessage('');
        setFiles((prev) => [...prev, ...pastedFiles]);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, status]);

  const validateFiles = (picked: File[]) => {
    if (picked.some((file) => file.size > 10 * 1024 * 1024)) {
      setErrorMessage('O tamanho máximo permitido por arquivo é 10 MB.');
      return false;
    }
    if (picked.some((file) => !SUPPORTED_FILE_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || ''))) {
      setErrorMessage('Formato não suportado. Envie arquivos PDF, JPG ou PNG.');
      return false;
    }
    return true;
  };

  const handleClose = () => {
    setInternalOpen(false);
    setZoomedImage(null);
    if (externalOnClose) externalOnClose();
  };

  const handleResetToUploadAnother = () => {
    setStatus('idle');
    setFiles([]);
    setFilePreviews([]);
    setProgress(0);
    setBatchCurrentIndex(0);
    setBatchTotalCount(0);
    setProcessedDocsCount(0);
    setErrorMessage('');
    setResultId(null);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length) {
      if (!validateFiles(picked)) return;
      setErrorMessage('');
      if (isAppendingRef.current) {
        setFiles((prev) => {
          const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
          const uniqueNew = picked.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
          return [...prev, ...uniqueNew];
        });
      } else {
        setFiles(picked);
      }
    }
    isAppendingRef.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const picked = Array.from(e.dataTransfer.files || []);
    if (picked.length) {
      if (!validateFiles(picked)) return;
      setErrorMessage('');
      setFiles(picked);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearFiles = () => {
    setFiles([]);
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (!files.length) {
      isAppendingRef.current = false;
      fileInputRef.current?.click();
      return;
    }

    setErrorMessage('');

    // Se houver mais de um arquivo e a opção de envio em lote estiver ativa:
    if (files.length > 1 && isBatchMode) {
      setStatus('uploading');
      setBatchTotalCount(files.length);
      setBatchCurrentIndex(1);
      setProcessedDocsCount(0);

      let successCount = 0;
      let lastDocId: string | null = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setBatchCurrentIndex(i + 1);
        setProgress(Math.round(((i) / files.length) * 100));

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentType', selectedType);

          const res = (await customFetch('/api/documents/upload', {
            method: 'POST',
            body: formData as any,
          })) as any;

          lastDocId = res.id;
          successCount++;
          setProcessedDocsCount(successCount);
          window.dispatchEvent(new CustomEvent('document-uploaded'));
        } catch (err) {
          console.error('Erro ao enviar arquivo no lote:', file.name, err);
        }
      }

      setProgress(100);
      setResultId(lastDocId);

      if (successCount > 0) {
        setStatus('done');
        if (lastDocId && onSuccess) onSuccess(lastDocId);
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível enviar os arquivos do lote. Tente novamente.');
      }
      return;
    }

    // Envio tradicional de 1 documento (podendo conter 1 ou várias páginas)
    setStatus('uploading');
    setProgress(15);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('file', f));
      formData.append('documentType', selectedType);

      const res = (await customFetch('/api/documents/upload', {
        method: 'POST',
        body: formData as any,
      })) as any;

      window.dispatchEvent(new CustomEvent('document-uploaded'));
      setResultId(res.id);
      setProcessedDocsCount(1);

      if (res.status === 'pronto') {
        setProgress(100);
        setStatus('done');
        if (onSuccess) onSuccess(res.id);
        return;
      }

      setStatus('processing');
      setProgress(typeof res.progress === 'number' ? res.progress : 45);

      const outcome = await waitForDocumentProcessing(res.id, {
        onProgress: setProgress,
      });

      if (outcome.status === 'pronto') {
        setProgress(100);
        setStatus('done');
        if (onSuccess) onSuccess(res.id);
      } else if (outcome.status === 'timeout') {
        setStatus('timeout');
        setErrorMessage('O processamento continua no acervo. Não é necessário enviar o arquivo novamente.');
      } else {
        setStatus('error');
        setErrorMessage('message' in outcome ? (outcome as any).message : 'Não foi possível ler o documento.');
      }
    } catch (err) {
      const invalidMsg = getInvalidDocumentMessage(err);
      setStatus('error');
      setErrorMessage(invalidMsg || 'Erro no envio do documento.');
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0f1e3c]/60 backdrop-blur-xs p-2.5 sm:p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[660px] max-h-[94vh] sm:max-h-[92vh] overflow-y-auto bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-7 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] border border-[#dde3ec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F4F7FC] hover:bg-[#E3E8F0] transition-colors flex items-center justify-center text-[#5B6878] hover:text-[#14211F] cursor-pointer"
          aria-label="Fechar"
        >
          <X size={19} />
        </button>

        {/* Modal Header */}
        <div className="mb-3.5 pr-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1D4ED8] mb-1.5">
            {isBatchMode ? <Layers size={13} /> : <ShieldCheck size={13} />}
            <span>{isBatchMode ? 'Importação em Lote' : 'Prontuário Seguro'}</span>
          </div>
          <h2 className="m-0 text-xl sm:text-2xl font-bold tracking-tight text-[#14211F]">
            {isBatchMode ? 'Enviar em lote de documentos' : 'Adicionar documento'}
          </h2>
          <p className="m-0 mt-1 text-xs sm:text-sm text-[#5B6878]">
            {isBatchMode
              ? 'Envie vários arquivos ou fotos de uma vez. A triagem com IA processa e cataloga cada documento individualmente no seu acervo.'
              : 'Envie receitas, laudos, exames ou carteirinhas. O sistema extrai e cataloga os dados clínicos automaticamente.'}
          </p>
        </div>

        {/* Mode Selector Tabs (Documento Único vs Envio em Lote) */}
        {status === 'idle' && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] p-1">
            <button
              type="button"
              onClick={() => setIsBatchMode(false)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                !isBatchMode
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-[#5B6878] hover:text-[#14211F]'
              }`}
            >
              <FileText size={15} />
              <span>Documento único</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBatchMode(true)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                isBatchMode
                  ? 'bg-white text-[#1D4ED8] shadow-xs ring-1 ring-[#1D4ED8]/20'
                  : 'text-[#5B6878] hover:text-[#14211F]'
              }`}
            >
              <Layers size={15} />
              <span>Enviar em lote</span>
            </button>
          </div>
        )}

        {status === 'idle' && (
          <>
            {/* Hidden Inputs for picking files or camera capture */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleFilePicked}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFilePicked}
            />

            {/* Empty Dropzone */}
            {files.length === 0 ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[22px] bg-[#F4F7FC] p-6 sm:p-8 text-center transition-all ${
                  isDragging ? 'border-[#1D4ED8] bg-[#CFE0FF]/30 scale-[1.01]' : 'border-[#E3E8F0] hover:border-[#1D4ED8]'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] mx-auto mb-3 flex items-center justify-center shadow-sm">
                  {isBatchMode ? (
                    <Layers size={28} className="text-white" strokeWidth={2} />
                  ) : (
                    <UploadCloud size={28} className="text-white" strokeWidth={2} />
                  )}
                </div>

                {isBatchMode && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CFE0FF]/50 border border-[#CFE0FF] text-xs font-bold text-[#1D4ED8] mb-2.5">
                    <Layers size={13} />
                    Modo Envio em Lote
                  </span>
                )}

                <b className="text-base sm:text-lg font-bold text-[#14211F] block">
                  {isBatchMode
                    ? 'Arraste múltiplos arquivos ou fotos aqui'
                    : 'Arraste ou escolha seus documentos'}
                </b>
                <p className="text-xs sm:text-sm text-[#5B6878] mt-1 mb-4">
                  {isBatchMode
                    ? 'Selecione de 2 a 10 arquivos (PDFs, fotos). Cada arquivo será salvo separadamente no seu acervo.'
                    : 'Fotos (JPG, PNG) ou arquivos PDF de até 10 MB'}
                </p>

                {/* Primary Dual Actions: Tirar Foto + Selecionar Arquivos */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = false;
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#E3E8F0] text-[#14211F] hover:border-[#1D4ED8] hover:bg-[#F4F7FC] transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <Camera size={16} className="text-[#1D4ED8]" />
                    <span>Tirar foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = false;
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    {isBatchMode ? <Layers size={16} /> : <UploadCloud size={16} />}
                    <span>{isBatchMode ? 'Selecionar arquivos em lote' : 'Selecionar arquivos'}</span>
                  </button>
                </div>

                {/* Quick Paste hint */}
                <div className="mt-3.5 text-[11px] text-[#5B6878] flex items-center justify-center gap-1.5">
                  <Clipboard size={12} className="text-[#1D4ED8]" />
                  <span>Dica: Você também pode colar capturas diretamente com <strong>Ctrl+V</strong></span>
                </div>
              </div>
            ) : files.length === 1 && filePreviews[0]?.isImage && filePreviews[0]?.url ? (
              /* Single Image Preview */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[22px] bg-[#F8FAFC] p-3.5 sm:p-4 transition-colors ${
                  isDragging ? 'border-[#1D4ED8] bg-[#CFE0FF]/30' : 'border-[#CFE0FF]'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#CFE0FF]/50 border border-[#CFE0FF] text-[#1D4ED8] shrink-0">
                      <ImageIcon size={13} />
                      Imagem pronta
                    </span>
                    <span className="text-xs text-[#14211F] font-semibold truncate" title={filePreviews[0].file.name}>
                      {filePreviews[0].file.name}
                    </span>
                    <span className="text-[11px] text-[#5B6878] shrink-0">
                      ({formatFileSize(filePreviews[0].file.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setZoomedImage({ url: filePreviews[0].url!, name: filePreviews[0].file.name })}
                      className="w-8 h-8 rounded-lg text-[#5B6878] hover:text-[#1D4ED8] hover:bg-white transition-colors flex items-center justify-center cursor-pointer shadow-xs bg-white/80 border border-[#E3E8F0]"
                      title="Ampliar foto"
                      aria-label="Ampliar foto"
                    >
                      <Maximize2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFiles}
                      className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer shadow-xs bg-white/80 border border-[#E3E8F0]"
                      title="Remover foto"
                      aria-label="Remover foto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Image Frame */}
                <div
                  onClick={() => setZoomedImage({ url: filePreviews[0].url!, name: filePreviews[0].file.name })}
                  className="group relative mx-auto flex items-center justify-center max-h-[250px] min-h-[170px] overflow-hidden rounded-xl bg-white border border-[#E3E8F0] p-2 shadow-inner cursor-zoom-in"
                >
                  <img
                    src={filePreviews[0].url}
                    alt={filePreviews[0].file.name}
                    className="max-h-[234px] w-auto max-w-full rounded-lg object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-[#0f1e3c]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-[#1D4ED8] text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Maximize2 size={13} />
                      Clique para ampliar
                    </span>
                  </div>
                </div>

                {/* Change or append actions */}
                <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = false;
                      fileInputRef.current?.click();
                    }}
                    className="font-bold text-[#1D4ED8] hover:text-[#1E40AF] cursor-pointer inline-flex items-center gap-1.5 hover:underline"
                  >
                    <RefreshCw size={12} />
                    Trocar arquivo
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = true;
                      cameraInputRef.current?.click();
                    }}
                    className="font-bold text-[#5B6878] hover:text-[#1D4ED8] cursor-pointer inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Camera size={13} />
                    Tirar outra foto
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = true;
                      fileInputRef.current?.click();
                    }}
                    className="font-bold text-[#5B6878] hover:text-[#1D4ED8] cursor-pointer inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Plus size={13} />
                    Adicionar mais páginas
                  </button>
                </div>
              </div>
            ) : files.length === 1 && filePreviews[0]?.isPdf ? (
              /* Single PDF Preview */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[22px] bg-[#F8FAFC] p-6 text-center transition-colors ${
                  isDragging ? 'border-[#1D4ED8] bg-[#CFE0FF]/30' : 'border-[#CFE0FF]'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto mb-3 flex items-center justify-center shadow-xs border border-rose-100">
                  <FileText size={32} />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 mb-1.5">
                  PDF
                </span>
                <b className="text-[16px] text-[#14211F] block truncate max-w-[380px] mx-auto">
                  {filePreviews[0].file.name}
                </b>
                <p className="text-xs text-[#5B6878] mt-1 mb-4">
                  {formatFileSize(filePreviews[0].file.size)} · Documento pronto para envio
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = false;
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#E3E8F0] text-[#14211F] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
                  >
                    Trocar arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = true;
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#CFE0FF]/40 border border-[#CFE0FF] text-[#1D4ED8] hover:bg-[#CFE0FF]/70 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus size={13} />
                    Adicionar outro PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              /* Multiple Files Gallery */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[22px] bg-[#F8FAFC] p-4 transition-colors ${
                  isDragging ? 'border-[#1D4ED8] bg-[#CFE0FF]/30' : 'border-[#CFE0FF]'
                }`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CFE0FF] text-[#1D4ED8] text-xs font-bold">
                      {files.length}
                    </span>
                    <b className="text-sm font-bold text-[#14211F]">
                      arquivos selecionados
                    </b>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Remover todos
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[250px] overflow-y-auto p-1">
                  {filePreviews.map((item, idx) => (
                    <div
                      key={`${item.file.name}-${idx}`}
                      className="relative group rounded-xl border border-[#E3E8F0] bg-white p-2 shadow-xs flex flex-col items-center"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 text-rose-500 shadow-sm border border-slate-200 flex items-center justify-center opacity-80 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all cursor-pointer z-10"
                        title="Remover arquivo"
                        aria-label="Remover arquivo"
                      >
                        <X size={13} />
                      </button>

                      {item.isImage && item.url ? (
                        <div
                          onClick={() => setZoomedImage({ url: item.url!, name: item.file.name })}
                          className="w-full h-24 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center cursor-zoom-in relative"
                        >
                          <img
                            src={item.url}
                            alt={item.file.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-[#0f1e3c]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={16} className="text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-rose-50 text-rose-600 flex flex-col items-center justify-center">
                          <FileText size={28} />
                          <span className="text-[10px] font-bold mt-1 text-rose-700">PDF</span>
                        </div>
                      )}

                      <div className="w-full mt-2 text-left">
                        <p className="text-xs font-semibold text-[#14211F] truncate" title={item.file.name}>
                          {item.file.name}
                        </p>
                        <p className="text-[11px] text-[#5B6878]">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = true;
                      fileInputRef.current?.click();
                    }}
                    className="min-h-[140px] rounded-xl border-2 border-dashed border-[#CFE0FF] hover:border-[#1D4ED8] bg-white/70 hover:bg-[#CFE0FF]/30 flex flex-col items-center justify-center gap-1 text-[#1D4ED8] transition-colors cursor-pointer"
                  >
                    <Plus size={22} />
                    <span className="text-xs font-bold">Adicionar mais</span>
                  </button>
                </div>
              </div>
            )}

            {/* Segmented Control for Multi-file mode */}
            {files.length > 1 && (
              <div className="mt-3.5 rounded-2xl border border-[#CFE0FF] bg-[#F4F7FC] p-3.5 sm:p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#14211F] mb-2 flex items-center gap-2">
                  <Layers size={14} className="text-[#1D4ED8]" />
                  <span>Como salvar estes {files.length} arquivos?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isBatchMode
                        ? 'bg-white border-[#1D4ED8] shadow-xs ring-1 ring-[#1D4ED8]'
                        : 'bg-white/60 border-[#E3E8F0] hover:bg-white hover:border-[#CFE0FF]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#14211F]">
                      <Layers size={16} className={isBatchMode ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
                      <span>Documentos separados (Lote)</span>
                    </div>
                    <p className="text-[11px] text-[#5B6878] mt-1 m-0">
                      Cada arquivo é registrado e classificado como um documento individual no seu prontuário.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBatchMode(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !isBatchMode
                        ? 'bg-white border-[#1D4ED8] shadow-xs ring-1 ring-[#1D4ED8]'
                        : 'bg-white/60 border-[#E3E8F0] hover:bg-white hover:border-[#CFE0FF]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#14211F]">
                      <FileText size={16} className={!isBatchMode ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
                      <span>Páginas de 1 único documento</span>
                    </div>
                    <p className="text-[11px] text-[#5B6878] mt-1 m-0">
                      Todos os arquivos são agrupados sequencialmente (ex: laudo de várias páginas).
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Document Type Pills with Icons */}
            <div className="my-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B6878]">
                  Classificação do documento
                </span>
                <span className="text-[11px] text-[#1D4ED8] font-semibold">
                  A IA pode identificar automaticamente
                </span>
              </div>

              <div className="flex gap-2 flex-wrap">
                {TYPE_OPTIONS.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(t.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8] shadow-xs scale-[1.02]'
                          : 'bg-white text-[#14211F] border border-[#E3E8F0] hover:border-[#CFE0FF] hover:bg-[#F4F7FC]'
                      }`}
                    >
                      <Icon size={14} className={isSelected ? 'text-white' : 'text-[#1D4ED8]'} />
                      <span>{t.label}</span>
                      {t.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-[#CFE0FF] text-[#1D4ED8]'}`}>
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clinical Scanning Tip */}
            <div className="mb-4 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC]/70 p-3 text-xs text-[#5B6878] flex items-center gap-2.5">
              <Info size={15} className="text-[#1D4ED8] shrink-0" />
              <span>
                <strong>Dica médica:</strong> Para exames e receitas manuscritas, uma foto nítida e bem iluminada garante 100% de precisão na leitura das dosagens.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 justify-end pt-1 border-t border-[#E3E8F0]">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 w-full sm:w-auto px-5 rounded-xl inline-flex items-center justify-center gap-2 font-semibold text-sm bg-white text-[#14211F] border border-[#E3E8F0] hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all cursor-pointer shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="min-h-11 w-full sm:w-auto px-6 rounded-xl inline-flex items-center justify-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer shadow-xs"
              >
                {files.length > 1 && isBatchMode ? (
                  <>
                    <Layers size={16} />
                    <span>Enviar {files.length} documentos em lote</span>
                  </>
                ) : files.length > 0 ? (
                  <>
                    <UploadCloud size={16} />
                    <span>Enviar documento</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Escolher arquivo</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Processing State with Step Pipeline */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="py-6 sm:py-8 space-y-6">
            <div className="text-center">
              <div className="relative mx-auto w-14 h-14 mb-3 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-[#CFE0FF]/40 animate-ping opacity-50" />
                <div className="relative w-14 h-14 rounded-2xl bg-[#1D4ED8] flex items-center justify-center text-white shadow-md">
                  <LoaderCircle size={28} className="animate-spin" />
                </div>
              </div>
              <b className="text-lg sm:text-xl text-[#14211F] block">
                {batchTotalCount > 1
                  ? `Processando lote (${batchCurrentIndex} de ${batchTotalCount})`
                  : status === 'uploading'
                  ? 'Enviando documento...'
                  : 'Digitalizando e estruturando dados clínicos...'}
              </b>
              <p className="text-xs sm:text-sm text-[#5B6878] mt-1">
                {batchTotalCount > 1
                  ? 'Cada arquivo está sendo catalogado individualmente no seu acervo médico.'
                  : 'Nossa IA está identificando exames, medicamentos, diagnósticos e dosagens.'}
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5B6878] mb-1.5">
                <span>Progresso do processamento</span>
                <span className="text-[#1D4ED8]">{progress}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(progress, 8)}%` }}
                />
              </div>
            </div>

            {/* Medical Processing Pipeline Steps */}
            <div className="max-w-md mx-auto rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC]/70 p-4 space-y-3">
              {PIPELINE_STEPS.map((step) => {
                const isFinished = progress > step.threshold + 25 || progress === 100;
                const isCurrent = progress >= step.threshold && !isFinished;
                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      {isFinished ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : isCurrent ? (
                        <LoaderCircle size={16} className="text-[#1D4ED8] animate-spin" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[#CBD5E1]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${isFinished ? 'text-emerald-800' : isCurrent ? 'text-[#1D4ED8] font-bold' : 'text-[#5B6878]'}`}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-[#5B6878] leading-tight">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Done State */}
        {status === 'done' && (
          <div className="py-6 sm:py-8 text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-xs border border-emerald-100">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <b className="text-xl sm:text-2xl text-[#14211F] block tracking-tight">
                {processedDocsCount > 1
                  ? `${processedDocsCount} documentos salvos com sucesso!`
                  : 'Documento processado com sucesso!'}
              </b>
              <p className="text-xs sm:text-sm text-[#5B6878] mt-1.5 max-w-md mx-auto">
                {processedDocsCount > 1
                  ? 'Todos os arquivos foram catalogados e organizados no seu histórico médico.'
                  : 'Os biomarcadores, prescrições e detalhes clínicos foram extraídos e adicionados ao seu prontuário.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto pt-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (resultId && processedDocsCount <= 1) setLocation(`/documentos/${resultId}`);
                  else setLocation('/documentos');
                }}
                className="min-h-11 px-6 rounded-xl bg-[#1D4ED8] text-white font-semibold text-sm hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
              >
                <span>{processedDocsCount > 1 ? 'Ver no acervo' : 'Ver documento'}</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={handleResetToUploadAnother}
                className="min-h-11 px-5 rounded-xl bg-white text-[#14211F] font-semibold text-sm border border-[#E3E8F0] hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
              >
                <Plus size={15} className="text-[#1D4ED8]" />
                <span>Adicionar outro</span>
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="py-6 sm:py-8 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-xs border border-rose-100">
              <AlertTriangle size={36} />
            </div>
            <div>
              <b className="text-lg sm:text-xl text-[#14211F] block">Falha no processamento</b>
              <p className="text-xs sm:text-sm text-rose-600 mt-1 max-w-md mx-auto">{errorMessage}</p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="min-h-11 px-6 rounded-xl bg-[#1D4ED8] text-white font-semibold text-sm hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer shadow-xs"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Timeout State */}
        {status === 'timeout' && (
          <div className="py-6 sm:py-8 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#CFE0FF]/40 text-[#1D4ED8] mx-auto flex items-center justify-center shadow-xs">
              <LoaderCircle size={36} className="animate-spin" />
            </div>
            <div>
              <b className="block text-lg sm:text-xl text-[#14211F]">Processamento em andamento</b>
              <p className="mt-1 text-xs sm:text-sm text-[#5B6878] max-w-md mx-auto">{errorMessage}</p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (resultId) setLocation(`/documentos/${resultId}`);
                  else setLocation('/documentos');
                }}
                className="min-h-11 rounded-xl bg-[#1D4ED8] px-6 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] shadow-xs transition-all inline-flex items-center gap-2"
              >
                <span>Acompanhar no acervo</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal for inspection */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#0f1e3c]/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 sm:top-3 sm:right-3 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg"
              aria-label="Fechar ampliação"
            >
              <X size={22} />
            </button>
            <img
              src={zoomedImage.url}
              alt={zoomedImage.name}
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20 bg-black/40"
            />
            <div className="mt-3 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold truncate max-w-md shadow-md">
              {zoomedImage.name}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export function triggerUploadModal(options?: { mode?: 'single' | 'batch' }) {
  window.dispatchEvent(new CustomEvent('open-upload-modal', { detail: options }));
}
