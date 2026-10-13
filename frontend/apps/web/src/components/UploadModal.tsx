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
  { id: 'outro', label: 'Automático' },
  { id: 'receita', label: 'Receita' },
  { id: 'exame', label: 'Exame' },
  { id: 'laudo', label: 'Laudo' },
  { id: 'atestado', label: 'Atestado' },
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
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultId, setResultId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAppendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const handler = () => {
      setInternalOpen(true);
      setStatus('idle');
      setFiles([]);
      setProgress(0);
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

    setStatus('uploading');
    setProgress(20);
    setErrorMessage('');

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
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0f1e3c]/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[640px] max-h-[92vh] overflow-y-auto bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] border border-[#dde3ec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 w-10 h-10 rounded-[13px] bg-[#f1f4f8] hover:bg-slate-200 transition-colors flex items-center justify-center text-[#5a6a80] cursor-pointer"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <h2 className="m-0 mb-1 text-2xl font-extrabold tracking-[-0.03em] text-[#1b3a60]">
          Adicionar documento
        </h2>
        <p className="m-0 mb-4.5 text-sm text-[#5a6a80]">
          Envie uma foto ou PDF.
        </p>

        {status === 'idle' && (
          <>
            {/* Hidden Input for picking files */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleFilePicked}
            />

            {/* Upload Area / Preview */}
            {files.length === 0 ? (
              /* Empty Dropzone */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => {
                  isAppendingRef.current = false;
                  fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-[20px] bg-[#f4f8fd] p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-[#1b3a60] bg-blue-50' : 'border-[#9fb4d0] hover:border-[#1b3a60]'
                }`}
              >
                <div className="w-14 h-14 rounded-[18px] bg-[#1b3a60] mx-auto mb-3 flex items-center justify-center shadow-xs">
                  <UploadCloud size={26} className="text-white" strokeWidth={2} />
                </div>

                <b className="text-[17px] text-[#1d2a3d] block">
                  Arraste ou escolha um arquivo
                </b>
                <div className="text-[13px] text-[#5a6a80] mt-1.5">
                  PDF, JPG ou PNG (até 10 MB)
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
                className={`border-2 border-dashed rounded-[22px] bg-[#f8fafc] p-3.5 transition-colors ${
                  isDragging ? 'border-[#1b3a60] bg-blue-50' : 'border-[#b6c7dc]'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e5eefb] text-[#1b3a60] shrink-0">
                      <ImageIcon size={13} />
                      Foto pronta
                    </span>
                    <span className="text-xs text-[#1d2a3d] font-semibold truncate" title={filePreviews[0].file.name}>
                      {filePreviews[0].file.name}
                    </span>
                    <span className="text-[11px] text-[#5a6a80] shrink-0">
                      ({formatFileSize(filePreviews[0].file.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setZoomedImage({ url: filePreviews[0].url!, name: filePreviews[0].file.name })}
                      className="w-8 h-8 rounded-lg text-[#5a6a80] hover:text-[#1b3a60] hover:bg-white transition-colors flex items-center justify-center cursor-pointer shadow-xs bg-white/80 border border-[#dde3ec]"
                      title="Ampliar foto"
                      aria-label="Ampliar foto"
                    >
                      <Maximize2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFiles}
                      className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer shadow-xs bg-white/80 border border-[#dde3ec]"
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
                  className="group relative mx-auto flex items-center justify-center max-h-[250px] min-h-[170px] overflow-hidden rounded-xl bg-white border border-[#dde3ec] p-2 shadow-inner cursor-zoom-in"
                >
                  <img
                    src={filePreviews[0].url}
                    alt={filePreviews[0].file.name}
                    className="max-h-[234px] w-auto max-w-full rounded-lg object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-[#0f1e3c]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-[#1b3a60] text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Maximize2 size={13} />
                      Clique para ampliar
                    </span>
                  </div>
                </div>

                {/* Change or append actions */}
                <div className="mt-2.5 flex items-center justify-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = false;
                      fileInputRef.current?.click();
                    }}
                    className="font-bold text-[#1b3a60] hover:text-[#24507f] cursor-pointer inline-flex items-center gap-1.5 hover:underline"
                  >
                    <RefreshCw size={12} />
                    Trocar imagem
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = true;
                      fileInputRef.current?.click();
                    }}
                    className="font-bold text-[#5a6a80] hover:text-[#1b3a60] cursor-pointer inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Plus size={13} />
                    Adicionar outra foto/página
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
                className={`border-2 border-dashed rounded-[22px] bg-[#f8fafc] p-6 text-center transition-colors ${
                  isDragging ? 'border-[#1b3a60] bg-blue-50' : 'border-[#b6c7dc]'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto mb-3 flex items-center justify-center shadow-xs border border-rose-100">
                  <FileText size={32} />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 mb-1.5">
                  PDF
                </span>
                <b className="text-[16px] text-[#1d2a3d] block truncate max-w-[380px] mx-auto">
                  {filePreviews[0].file.name}
                </b>
                <p className="text-xs text-[#5a6a80] mt-1 mb-4">
                  {formatFileSize(filePreviews[0].file.size)} · Documento pronto para envio
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      isAppendingRef.current = false;
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#dde3ec] text-[#1b3a60] hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Trocar arquivo
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
                className={`border-2 border-dashed rounded-[22px] bg-[#f8fafc] p-4 transition-colors ${
                  isDragging ? 'border-[#1b3a60] bg-blue-50' : 'border-[#b6c7dc]'
                }`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <b className="text-sm font-bold text-[#1d2a3d]">
                    {files.length} arquivos selecionados
                  </b>
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
                      className="relative group rounded-xl border border-[#dde3ec] bg-white p-2 shadow-xs flex flex-col items-center"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-rose-500 shadow-sm border border-slate-200 flex items-center justify-center opacity-80 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all cursor-pointer z-10"
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
                        <p className="text-xs font-semibold text-[#1d2a3d] truncate" title={item.file.name}>
                          {item.file.name}
                        </p>
                        <p className="text-[11px] text-[#5a6a80]">
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
                    className="min-h-[140px] rounded-xl border-2 border-dashed border-[#b6c7dc] hover:border-[#1b3a60] bg-white/60 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 text-[#1b3a60] transition-colors cursor-pointer"
                  >
                    <Plus size={22} />
                    <span className="text-xs font-bold">Adicionar mais</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message if any */}
            {errorMessage && (
              <p className="text-center text-xs font-bold text-red-600 mt-3 mb-0">
                {errorMessage}
              </p>
            )}

            {/* Document Type Pills */}
            <div className="flex gap-2 my-4.5 mb-5.5 flex-wrap">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-[#1b3a60] text-white border border-[#1b3a60]'
                      : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1b3a60] text-white hover:bg-[#24507f] transition-colors cursor-pointer shadow-xs"
              >
                {files.length > 0 ? 'Enviar documento' : 'Escolher arquivo'}
              </button>
            </div>
          </>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="py-8 text-center space-y-4">
            <LoaderCircle size={36} className="mx-auto text-[#1b3a60] animate-spin" />
            <div>
              <b className="text-lg text-[#1d2a3d] block">
                {status === 'uploading' ? 'Enviando documento...' : 'Extraindo informações com IA...'}
              </b>
              <p className="text-sm text-[#5a6a80] mt-1">
                Aguarde um instante enquanto organizamos os dados.
              </p>
            </div>
            <div className="h-2 rounded-full bg-[#f1f4f8] max-w-sm mx-auto overflow-hidden">
              <div
                className="h-full bg-[#1b3a60] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 size={42} className="mx-auto text-[#1b3a60]" />
            <div>
              <b className="text-lg text-[#1d2a3d] block">Documento processado com sucesso!</b>
              <p className="text-sm text-[#5a6a80] mt-1">
                As informações foram catalogadas e já estão prontas para visualização.
              </p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (resultId) setLocation(`/documentos/${resultId}`);
                  else setLocation('/documentos');
                }}
                className="min-h-[44px] px-6 rounded-xl bg-[#1b3a60] text-white font-bold text-sm hover:bg-[#24507f] transition-colors cursor-pointer"
              >
                Ver documento
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 text-center space-y-4">
            <AlertTriangle size={42} className="mx-auto text-[#a13a30]" />
            <div>
              <b className="text-lg text-[#1d2a3d] block">Falha no processamento</b>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            </div>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="min-h-[44px] px-6 rounded-xl bg-[#1b3a60] text-white font-bold text-sm hover:bg-[#24507f] transition-colors cursor-pointer"
              >
                Tentar novamente
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

export function triggerUploadModal() {
  window.dispatchEvent(new CustomEvent('open-upload-modal'));
}
