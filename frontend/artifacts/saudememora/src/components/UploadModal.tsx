import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { Check, CheckCircle2, FileText, ImagePlus, LoaderCircle, Lock, Sparkles, UploadCloud, X } from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';

interface UploadModalProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (docId: string) => void;
}

export function UploadModal({ open: externalOpen, onClose: externalOnClose, onSuccess }: UploadModalProps) {
  const [, setLocation] = useLocation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [stage, setStage] = useState<'idle' | 'processing' | 'done'>('idle');
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
    }
  };

  useEffect(() => {
    if (files.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    setMounted(true);
    function handleGlobalOpen() {
      setInternalOpen(true);
    }
    window.addEventListener('open-upload-modal', handleGlobalOpen);
    return () => window.removeEventListener('open-upload-modal', handleGlobalOpen);
  }, []);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  useEffect(() => {
    if (!isOpen || stage !== 'idle') return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const newFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/') || item.type === 'application/pdf') {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            newFiles.push(pastedFile);
          }
        }
      }
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
        e.preventDefault();
      }
    };

    window.addEventListener('paste', handlePaste as any);
    return () => window.removeEventListener('paste', handlePaste as any);
  }, [isOpen, stage]);

  if (!isOpen || !mounted) return null;

  const resetModal = () => {
    setFiles([]);
    setStage('idle');
    setResultId(null);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    setInternalOpen(false);
    if (externalOnClose) externalOnClose();
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setStage('processing');
    setError('');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('file', f));

      const res = (await customFetch('/api/documents/upload', {
        method: 'POST',
        body: formData as any,
      })) as any;

      setResultId(res.id);
      setTimeout(() => setStage('done'), 500);
      if (onSuccess && res.id) {
        onSuccess(res.id);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao processar o documento. Tente novamente.');
      setStage('idle');
    }
  };

  const finishAndNavigate = () => {
    const id = resultId;
    handleClose();
    if (id) {
      setLocation(`/documentos/${id}`);
    } else {
      setLocation('/documentos');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center glass-modal p-4 page-enter">
      <div
        className="relative w-full max-w-[600px] rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">upload de documento</span>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-[-.04em] text-foreground">
            {stage === 'done' ? 'Documento Processado com Sucesso!' : 'Adicionar Documento de Saúde'}
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {stage === 'idle'
              ? 'Envie qualquer exame, receita, laudo ou relatório. A IA lê e classifica tudo automaticamente.'
              : stage === 'processing'
              ? 'A IA está realizando a extração de dados e OCR do documento...'
              : 'Informações extraídas pela inteligência artificial com sucesso.'}
          </p>
        </div>



        {/* Stage IDLE: Select File & Upload */}
        {stage === 'idle' && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/10 scale-[1.02]' 
                  : 'border-accent/40 bg-secondary/30 hover:border-accent hover:bg-secondary/60'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
              />
              {files.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center items-center p-4">
                  {files.map((file, i) => (
                    <div key={i} className="flex flex-col items-center">
                      {file.type.startsWith('image/') ? (
                        <img src={previewUrls[i]} alt="Preview" className="h-16 w-auto rounded object-contain shadow-sm border border-border" />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded shadow-xs bg-primary text-white">
                          <FileText size={20} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-xs transition-transform ${isDragging ? 'bg-primary text-white scale-110' : 'bg-card text-accent group-hover:-translate-y-1'}`}>
                  <UploadCloud size={26} />
                </span>
              )}
              <h3 className={`mt-2 text-sm font-extrabold ${isDragging || files.length > 0 ? 'text-primary' : 'text-foreground'}`}>
                {files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : (isDragging ? 'Solte o arquivo aqui' : 'Clique, arraste ou cole (Ctrl+V) os arquivos')}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">PDF, JPG ou PNG (até 20 MB)</p>
              {files.length > 0 && (
                <span className="mt-3 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1 text-[11px] font-bold text-accent">
                  Tamanho total: {(files.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <Lock size={13} className="text-accent" /> Criptografado & Privado
              </span>
              <span className="flex items-center gap-1.5">
                <ImagePlus size={13} className="text-accent" /> Leitura OCR via IA
              </span>
            </div>

            {error && <p className="text-center text-xs font-bold text-red-500">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-11 rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={files.length === 0}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                Processar Documento <Sparkles size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Stage PROCESSING: AI Loading Animation */}
        {stage === 'processing' && (
          <div className="py-8 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-accent">
              <LoaderCircle size={32} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Identificando conteúdo via IA...</h3>
              <p className="mt-1 text-xs text-muted-foreground">Extraindo informações clínicas de {files.length} arquivo(s)...</p>
            </div>

            <div className="mx-auto max-w-[380px]">
              <div className="mb-2 flex justify-between text-[10px] font-bold">
                <span className="text-muted-foreground">Extração inteligente</span>
                <span className="font-mono text-accent">Em andamento</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div className="absolute top-0 bottom-0 left-0 w-1/2 rounded-full bg-accent animate-continuous" />
              </div>
            </div>
          </div>
        )}

        {/* Stage DONE: Upload Finished */}
        {stage === 'done' && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                <CheckCircle2 size={22} />
              </span>
              <div>
                <p className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                  Documento Extraído e Classificado!
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 truncate max-w-[340px]">
                  {files.length} arquivo(s) processado(s)
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              O documento foi salvo no seu banco de dados unificado. As informações extraídas já estão prontas para consulta.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetModal}
                className="flex-1 h-11 rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                Enviar Outro
              </button>
              <button
                type="button"
                onClick={finishAndNavigate}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                <FileText size={16} /> Ver Documento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Global helper function to trigger the upload modal from anywhere!
export function triggerUploadModal() {
  window.dispatchEvent(new CustomEvent('open-upload-modal'));
}


