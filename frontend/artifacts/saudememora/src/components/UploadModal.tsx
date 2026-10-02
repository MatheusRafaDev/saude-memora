import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle2, FileText, FlaskConical, ImagePlus, LoaderCircle, Pill, Sparkles, Stethoscope, UploadCloud, X, ShieldAlert, Syringe, ArrowRight, ChevronLeft } from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';

interface UploadModalProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (docId: string) => void;
}

const DOC_TYPES = [
  { value: 'exame',          label: 'Exame de Sangue',    icon: FlaskConical, color: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/30'    },
  { value: 'imagem',         label: 'Exame de Imagem',    icon: FileText,     color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  { value: 'receita',        label: 'Receita Médica',     icon: Pill,         color: 'text-emerald-500',bg: 'bg-emerald-500/10 border-emerald-500/30'},
  { value: 'laudo',          label: 'Laudo / Relatório',  icon: Stethoscope,  color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
  { value: 'atestado',       label: 'Atestado Médico',    icon: ShieldAlert,  color: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/30'   },
  { value: 'vacina',         label: 'Vacinação',          icon: Syringe,      color: 'text-teal-500',   bg: 'bg-teal-500/10 border-teal-500/30'     },
  { value: 'encaminhamento', label: 'Encaminhamento',     icon: ArrowRight,   color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'outro',          label: 'Outro Documento',    icon: FileText,     color: 'text-muted-foreground', bg: 'bg-muted/60 border-border'       },
];

const PROCESSING_STEPS = [
  'Enviando arquivo para o servidor...',
  'Extraindo texto via OCR (Motor 1)...',
  'Extraindo texto via OCR (Motor 2)...',
  'Unificando resultados dos motores...',
  'Analisando com inteligência artificial...',
  'Estruturando informações clínicas...',
  'Salvando no banco de dados...',
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
    setFiles([]); setStep('type'); setDocType(''); setResultId(null); setError(''); setProcessingStep(0);
  };
  const handleClose = () => { resetModal(); setInternalOpen(false); if (externalOnClose) externalOnClose(); };

  const startUpload = async () => {
    if (!files.length) return;
    setStep('processing'); setError('');

    let s = 0;
    const interval = setInterval(() => {
      s++;
      if (s < PROCESSING_STEPS.length - 1) setProcessingStep(s);
      else clearInterval(interval);
    }, 1500);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('file', f));
      if (docType && docType !== 'outro') formData.append('documentType', docType);

      const res = (await customFetch('/api/documents/upload', { method: 'POST', body: formData as any })) as any;
      clearInterval(interval);
      setProcessingStep(PROCESSING_STEPS.length - 1);
      setResultId(res.id);
      setTimeout(() => setStep('done'), 600);
      if (onSuccess && res.id) onSuccess(res.id);
    } catch (err) {
      clearInterval(interval);
      setError('Falha ao processar o documento. Verifique sua conexão e tente novamente.');
      setStep('file');
    }
  };

  const finishAndNavigate = () => {
    handleClose();
    window.location.href = resultId ? `/documentos/${resultId}` : '/documentos';
  };

  const selectedType = DOC_TYPES.find(t => t.value === docType);
  const progress = step === 'processing' ? Math.round((processingStep / (PROCESSING_STEPS.length - 1)) * 100) : 0;

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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {files.map((file, i) => (
                      <div key={i} className="relative flex flex-col items-center">
                        {file.type.startsWith('image/') ? (
                          <img src={previewUrls[i]} alt="Preview" className="h-16 w-auto rounded-lg object-contain shadow border border-border" />
                        ) : (
                          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-white"><FileText size={22} /></span>
                        )}
                        <button type="button" onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white shadow">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-primary">{files.length} arquivo(s) · {(files.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(2)} MB</span>
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
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><Check size={12} /> Texto extraído via OCR de alta precisão</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><Check size={12} /> Informações clínicas estruturadas pela IA</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><Check size={12} /> Salvo no seu histórico de saúde</p>
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
