import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle2, FileText, FlaskConical, ImagePlus, LoaderCircle, Pill, Sparkles, Stethoscope, UploadCloud, X, ShieldAlert, Syringe, ArrowRight, ChevronLeft, ChevronRight, BrainCircuit } from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';

interface UploadModalProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (docId: string) => void;
}

const DOC_TYPES = [
  { value: 'exame',          label: 'Exame',              icon: FlaskConical, color: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/30'    },
  { value: 'receita',        label: 'Receita Médica',     icon: Pill,         color: 'text-emerald-500',bg: 'bg-emerald-500/10 border-emerald-500/30'},
  { value: 'laudo',          label: 'Laudo / Relatório',  icon: Stethoscope,  color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
  { value: 'atestado',       label: 'Atestado / Vacina',  icon: ShieldAlert,  color: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/30'   },
  { value: 'encaminhamento', label: 'Encaminhamento',     icon: ArrowRight,   color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'outro',          label: 'Auto-Detectar',      icon: BrainCircuit, color: 'text-primary',    bg: 'bg-primary/10 border-primary/30'       },
];

const PROCESSING_STEPS = [
  'Enviando para o seu espaço...',
  'Preparando arquivo...',
  'Lendo informações...',
  'Analisando com Inteligência Artificial...',
  'Organizando dados médicos...',
  'Salvando na sua ficha...',
];

export function UploadModal({ open: externalOpen, onClose: externalOnClose, onSuccess }: UploadModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<'type' | 'file' | 'processing' | 'done'>('type');
  const [docType, setDocType] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const [backendProgress, setBackendProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
  };

  useEffect(() => {
    if (!files.length) { setPreviewUrls([]); return; }
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    setMounted(true);
    const handler = () => setInternalOpen(true);
    window.addEventListener('open-upload-modal', handler);
    return () => window.removeEventListener('open-upload-modal', handler);
  }, []);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); setInternalOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!isOpen || step !== 'file') return;
    const handler = (e: ClipboardEvent) => {
      const newFiles: File[] = [];
      for (const item of (e.clipboardData?.items ?? [])) {
        if (item.type.startsWith('image/') || item.type === 'application/pdf') {
          const f = item.getAsFile(); if (f) newFiles.push(f);
        }
      }
      if (newFiles.length) { setFiles(prev => [...prev, ...newFiles]); e.preventDefault(); }
    };
    window.addEventListener('paste', handler as any);
    return () => window.removeEventListener('paste', handler as any);
  }, [isOpen, step]);

  if (!isOpen || !mounted) return null;

  const resetModal = () => {
    setFiles([]); setStep('type'); setDocType(''); setResultId(null); setError(''); setProcessingStep(0); setBackendProgress(0); setCurrentFileIndex(0);
  };
  const handleClose = () => { resetModal(); setInternalOpen(false); if (externalOnClose) externalOnClose(); };

  const startUpload = async () => {
    if (!files.length) return;
    setStep('processing'); setError(''); setBackendProgress(0); setProcessingStep(0);

    try {
      let currentId = resultId;

      if (currentId) {
        // Se já temos um resultId, significa que o usuário está tentando novamente após uma falha
        await customFetch(`/api/documents/${currentId}/retry`, { method: 'POST' });
      } else {
        const formData = new FormData();
        files.forEach(f => formData.append('file', f));
        if (docType && docType !== 'outro') formData.append('documentType', docType);

        // 1. Inicia o upload
        const res = (await customFetch('/api/documents/upload', { method: 'POST', body: formData as any })) as any;
        if (!res || !res.id) throw new Error('ID não retornado.');
        
        currentId = res.id;
        setResultId(currentId);
      }

      // 2. Polling para acompanhar o processamento no backend
      const poll = setInterval(async () => {
        try {
          const doc = (await customFetch(`/api/documents/${currentId}`)) as any;
          
          if (doc.status === 'failed') {
            clearInterval(poll);
            setError(doc.errorMessage || 'Falha ao processar o documento pela IA.');
            setStep('file');
          } else if (doc.status === 'pronto') {
            clearInterval(poll);
            setBackendProgress(100);
            setProcessingStep(PROCESSING_STEPS.length - 1);
            setTimeout(() => setStep('done'), 600);
            if (onSuccess) onSuccess(currentId);
          } else {
            // pendente ou processando
            const currentProgress = doc.progress || 0;
            setBackendProgress(currentProgress);
            
            // Mapeia o progresso (0-100) para o índice dos steps visuais
            const pStep = Math.min(
              Math.floor((currentProgress / 100) * (PROCESSING_STEPS.length - 1)),
              PROCESSING_STEPS.length - 1
            );
            setProcessingStep(pStep);
          }
        } catch (err) {
          console.error('Erro no polling do documento:', err);
        }
      }, 2000);

    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Falha ao iniciar o upload. Verifique sua conexão e tente novamente.');
      setStep('file');
    }
  };

  const finishAndNavigate = () => {
    handleClose();
    window.location.href = resultId ? `/documentos/${resultId}` : '/documentos';
  };

  const selectedType = DOC_TYPES.find(t => t.value === docType);
  const progress = step === 'processing' ? backendProgress : 0;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center glass-modal p-4 page-enter" onClick={handleClose}>
      <div className="relative w-full max-w-[560px] rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8" onClick={e => e.stopPropagation()}>
        
        <button onClick={handleClose} className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Fechar">
          <X size={18} />
        </button>

        {/* ── STEP TYPE ────────────────── */}
        {step === 'type' && (
          <div className="space-y-5">
            <div className="text-center">
              <span className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">passo 1 de 2</span>
              <h2 className="mt-1.5 text-xl font-extrabold tracking-tight text-foreground">Qual é o tipo de documento?</h2>
              <p className="mt-1 text-xs text-muted-foreground">Isso ajuda a IA a extrair as informações com muito mais precisão.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DOC_TYPES.map(t => {
                const Icon = t.icon;
                const sel = docType === t.value;
                return (
                  <button key={t.value} onClick={() => setDocType(t.value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all cursor-pointer ${sel ? `${t.bg} ring-2 ring-offset-1 ${t.color}` : 'border-border bg-background hover:bg-muted'}`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${t.bg}`}>
                      <Icon size={16} className={t.color} />
                    </span>
                    <span className={`text-[11px] font-bold leading-tight ${sel ? t.color : 'text-foreground'}`}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => { if (docType) setStep('file'); }} disabled={!docType}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all cursor-pointer">
              Continuar <Check size={14} />
            </button>
          </div>
        )}

        {/* ── STEP FILE ────────────────── */}
        {step === 'file' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('type')} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1">
                <span className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">passo 2 de 2</span>
                <h2 className="text-xl font-extrabold tracking-tight text-foreground leading-none mt-0.5">Envie o arquivo</h2>
              </div>
              {selectedType && (
                <span className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold ${selectedType.bg} ${selectedType.color}`}>
                  <selectedType.icon size={12} /> {selectedType.label}
                </span>
              )}
            </div>

            <button type="button" onClick={() => fileRef.current?.click()}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              className={`group relative flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-accent/40 bg-secondary/30 hover:border-accent hover:bg-secondary/60'}`}
            >
              <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />

              {files.length > 0 ? (
                <div className="flex flex-col items-center justify-center w-full p-4">
                  <div className="relative flex items-center justify-center w-full max-w-[200px] min-h-[120px]">
                    {files.length > 1 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentFileIndex(prev => Math.max(0, prev - 1)); }} disabled={currentFileIndex === 0}
                        className="absolute -left-10 sm:-left-12 z-10 p-2 rounded-full bg-background border border-border shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-foreground cursor-pointer">
                        <ChevronLeft size={18} />
                      </button>
                    )}

                    <div className="relative flex flex-col items-center">
                      {files[currentFileIndex].type.startsWith('image/') ? (
                        <img src={previewUrls[currentFileIndex]} alt="Preview" className="h-32 w-auto max-w-[180px] rounded-xl object-contain shadow-md border border-border bg-white" />
                      ) : (
                        <div className="flex h-32 w-28 items-center justify-center rounded-xl bg-primary text-white shadow-md border border-primary/20"><FileText size={36} /></div>
                      )}
                      
                      <button type="button" onClick={e => {
                        e.stopPropagation();
                        setFiles(prev => {
                          const next = prev.filter((_, idx) => idx !== currentFileIndex);
                          if (currentFileIndex >= next.length && next.length > 0) setCurrentFileIndex(next.length - 1);
                          return next;
                        });
                      }}
                        className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90 transition-colors cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>

                    {files.length > 1 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentFileIndex(prev => Math.min(files.length - 1, prev + 1)); }} disabled={currentFileIndex === files.length - 1}
                        className="absolute -right-10 sm:-right-12 z-10 p-2 rounded-full bg-background border border-border shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-foreground cursor-pointer">
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                  
                  {files.length > 1 && (
                    <div className="mt-5 flex gap-1.5 flex-wrap justify-center max-w-[80%]">
                      {files.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentFileIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`} />
                      ))}
                    </div>
                  )}

                  <span className="mt-4 text-xs font-bold text-primary">{files.length} arquivo(s) selecionado(s)</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{(files.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(2)} MB total</span>
                </div>
              ) : (
                <>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs transition-transform ${isDragging ? 'bg-primary text-white scale-110' : 'bg-card text-accent group-hover:-translate-y-1'}`}>
                    <UploadCloud size={24} />
                  </span>
                  <h3 className="mt-2 text-sm font-extrabold text-foreground">{isDragging ? 'Solte aqui!' : 'Arraste ou clique para selecionar'}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">PDF, JPG ou PNG · até 20 MB</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">Ou cole com Ctrl+V</p>
                  <div className="mt-4 flex gap-3">
                    <span className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-bold text-primary shadow-sm hover:bg-muted">Procurar arquivos</span>
                    <span onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
                      className="rounded-lg border border-border bg-accent text-accent-foreground px-3 py-2 text-[11px] font-bold flex items-center gap-1.5 hover:bg-accent/90 shadow-sm cursor-pointer">
                      <ImagePlus size={13} /> Usar Câmera
                    </span>
                  </div>
                </>
              )}
            </button>

            {error && <p className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-center text-xs font-bold text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <button type="button" onClick={handleClose} className="flex-1 h-11 rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-colors cursor-pointer">Cancelar</button>
              <button type="button" onClick={startUpload} disabled={files.length === 0}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-sm cursor-pointer">
                Processar com IA <Sparkles size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP PROCESSING ──────────── */}
        {step === 'processing' && (
          <div className="py-6 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LoaderCircle size={32} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Processando com IA...</h3>
              <p className="mt-1 text-xs text-muted-foreground">{PROCESSING_STEPS[processingStep]}</p>
            </div>
            <div className="mx-auto max-w-[380px] space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-mono text-primary">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex flex-col gap-1.5 mt-3 text-left">
                {PROCESSING_STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 text-[11px] transition-all ${i < processingStep ? 'text-emerald-600 dark:text-emerald-400' : i === processingStep ? 'text-foreground font-bold' : 'text-muted-foreground/40'}`}>
                    {i < processingStep ? <Check size={11} className="text-emerald-500 shrink-0" /> : i === processingStep ? <LoaderCircle size={11} className="animate-spin text-primary shrink-0" /> : <span className="w-[11px] shrink-0" />}
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP DONE ────────────────── */}
        {step === 'done' && (
          <div className="space-y-5 py-2">
            <div className="text-center">
              <span className="flex mx-auto h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow mb-3">
                <CheckCircle2 size={28} />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Documento Processado!</h2>
              <p className="mt-1 text-xs text-muted-foreground">{files.length} arquivo(s) extraído(s) e classificado(s) pela IA.</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 space-y-1.5">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><Check size={12} /> Leitura concluída com sucesso</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><Check size={12} /> Tudo organizado no seu histórico</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><Check size={12} /> Pronto para ser visualizado</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={resetModal} className="flex-1 h-11 rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-colors cursor-pointer">Enviar Outro</button>
              <button type="button" onClick={finishAndNavigate} className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer">
                <FileText size={15} /> Ver Documento
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
