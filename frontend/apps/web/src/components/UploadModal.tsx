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
} from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';
import { waitForDocumentProcessing, getInvalidDocumentMessage } from '@/lib/document-processing';

interface UploadModalProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (docId: string) => void;
}

const TYPE_OPTIONS = [
  { id: 'outro', label: 'Automático' },
  { id: 'receita', label: 'Receita' },
  { id: 'exame', label: 'Exame' },
  { id: 'laudo', label: 'Laudo' },
  { id: 'atestado', label: 'Atestado' },
];

export function UploadModal({ open: externalOpen, onClose: externalOnClose, onSuccess }: UploadModalProps) {
  const [, setLocation] = useLocation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [selectedType, setSelectedType] = useState('outro');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultId, setResultId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const handler = () => {
      setInternalOpen(true);
      setStatus('idle');
      setFiles([]);
      setProgress(0);
      setErrorMessage('');
    };
    window.addEventListener('open-upload-modal', handler);
    return () => window.removeEventListener('open-upload-modal', handler);
  }, []);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const handleClose = () => {
    setInternalOpen(false);
    if (externalOnClose) externalOnClose();
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length) {
      if (picked.some((f) => f.size > 10 * 1024 * 1024)) {
        setErrorMessage('O tamanho máximo permitido por arquivo é 10 MB.');
        return;
      }
      setErrorMessage('');
      setFiles(picked);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const picked = Array.from(e.dataTransfer.files || []);
    if (picked.length) {
      if (picked.some((f) => f.size > 10 * 1024 * 1024)) {
        setErrorMessage('O tamanho máximo permitido por arquivo é 10 MB.');
        return;
      }
      setErrorMessage('');
      setFiles(picked);
    }
  };

  const handleUpload = async () => {
    if (!files.length) {
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
        className="relative w-full max-w-[640px] bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] border border-[#dde3ec]"
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
            {/* Dashed Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[20px] bg-[#f4f8fd] p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-[#1b3a60] bg-blue-50' : 'border-[#9fb4d0] hover:border-[#1b3a60]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFilePicked}
              />

              <div className="w-14 h-14 rounded-[18px] bg-[#1b3a60] mx-auto mb-3 flex items-center justify-center shadow-xs">
                <UploadCloud size={26} className="text-white" strokeWidth={2} />
              </div>

              <b className="text-[17px] text-[#1d2a3d] block">
                {files.length > 0
                  ? `${files.length} arquivo(s) selecionado(s)`
                  : 'Arraste ou escolha um arquivo'}
              </b>
              <div className="text-[13px] text-[#5a6a80] mt-1.5">
                {files.length > 0 ? files.map((f) => f.name).join(', ') : 'PDF, JPG ou PNG'}
              </div>
            </div>

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
            <CheckCircle2 size={42} className="mx-auto text-[#1f7a4d]" />
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
    </div>,
    document.body
  );
}

export function triggerUploadModal() {
  window.dispatchEvent(new CustomEvent('open-upload-modal'));
}
