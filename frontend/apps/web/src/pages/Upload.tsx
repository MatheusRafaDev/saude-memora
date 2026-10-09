import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CheckCircle2, FileText, ImagePlus, LoaderCircle, Lock, UploadCloud } from 'lucide-react';
import { customFetch, getGetApiDocumentsQueryKey } from '@workspace/api-client-react';
import { waitForDocumentProcessing, getInvalidDocumentMessage } from '@/lib/document-processing';

function UploadProcessingStatus({
  stage,
  progress,
  fileCount,
}: {
  stage: 'uploading' | 'processing';
  progress: number;
  fileCount: number;
}) {
  const isProcessing = stage === 'processing';
  const progressValue = Math.max(0, Math.min(progress, 100));
  const isExtractionComplete = isProcessing && progressValue >= 90;

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8 md:p-10" aria-live="polite">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <LoaderCircle size={25} className="animate-spin" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-extrabold text-foreground">
          {isProcessing ? 'Estamos lendo seu documento' : 'Enviando seu documento'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isProcessing
            ? 'Estamos extraindo e organizando as informações. Você pode acompanhar o andamento abaixo.'
            : `${fileCount} arquivo${fileCount === 1 ? '' : 's'} sendo enviado${fileCount === 1 ? '' : 's'} com segurança.`}
        </p>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
          <span className="text-foreground">{isProcessing ? 'Progresso do processamento' : 'Enviando arquivos'}</span>
          <span className="tabular-nums text-primary">
            {isProcessing && progressValue > 0 ? `${progressValue}%` : 'Em andamento'}
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={isProcessing ? 'Progresso do processamento' : 'Envio do documento'}
          aria-valuemin={isProcessing ? 0 : undefined}
          aria-valuemax={isProcessing ? 100 : undefined}
          aria-valuenow={isProcessing ? progressValue : undefined}
          aria-valuetext={isProcessing ? `${progressValue}% concluído` : 'Envio em andamento'}
        >
          {isProcessing ? (
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          ) : (
            <div className="h-full w-1/3 rounded-full bg-primary/80 animate-continuous" />
          )}
        </div>
      </div>

      <ol className="mt-7 grid gap-2 sm:grid-cols-3">
        {[
          { label: 'Arquivo recebido', complete: isProcessing, active: !isProcessing },
          { label: 'Leitura do documento', complete: isExtractionComplete, active: isProcessing && !isExtractionComplete },
          { label: 'Organização dos dados', complete: false, active: isExtractionComplete },
        ].map(({ label, complete, active }) => (
          <li
            key={label}
            className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
              complete
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : active
                  ? 'border-primary/20 bg-primary/5 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground'
            }`}
          >
            {complete ? (
              <Check size={14} aria-hidden="true" />
            ) : active ? (
              <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border border-current opacity-50" aria-hidden="true" />
            )}
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Upload() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState('exame');
  const [stage, setStage] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const start = async () => { 
    if (files.length === 0) return; 
    setStage('uploading');
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('file', f));
      formData.append('documentType', docType);

      // We use customFetch directly because the Orval hook doesn't support dynamic multipart bodies well without schema
      const res = await customFetch('/api/documents/upload', {
        method: 'POST',
        body: formData as any
      }) as any;

      setResultId(res.id);
      void queryClient.invalidateQueries({ queryKey: getGetApiDocumentsQueryKey() });
      if (res.status === 'pronto') { setProgress(100); setStage('done'); return; }

      // Aguarda o worker validar/extrair o documento
      setProgress(typeof res.progress === 'number' ? res.progress : 25);
      setStage('processing');
      const outcome = await waitForDocumentProcessing(res.id, {
        onProgress: setProgress,
      });
      if (outcome.status === 'pronto') { setProgress(100); setStage('done'); }
      else if (outcome.status === 'rejeitado') { setFiles([]); setError(outcome.message); setStage('idle'); setProgress(0); }
      else if (outcome.status === 'failed') { setError(outcome.message); setStage('idle'); setProgress(0); }
      else setLocation('/documentos');
    } catch (err) {
      const invalidMsg = getInvalidDocumentMessage(err);
      if (invalidMsg) { setFiles([]); setError(invalidMsg); setStage('idle'); setProgress(0); return; }
      console.error(err);
      setError('Erro ao processar o documento. Tente novamente.');
      setStage('idle');
      setProgress(0);
    }
  };

  // Limpa o input para o iOS disparar onChange mesmo ao tirar outra foto com o mesmo nome
  const handlePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    
    if (picked.length) { 
      if (picked.some(f => f.size > 10 * 1024 * 1024)) {
        setError('O tamanho máximo permitido por arquivo é 10 MB.');
        setFiles([]);
        return;
      }
      setError(''); 
      setFiles(picked); 
    }
  };

  const finish = () => { 
    if (resultId) {
      setLocation(`/documentos/${resultId}`);
    } else {
      setLocation('/documentos');
    }
  };

  return <div className="page-enter mx-auto max-w-[850px] space-y-8"><Link href="/documentos" className="flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={15} /> Voltar para documentos</Link><section className="text-center"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">novo documento</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[42px]">{stage === 'done' ? 'Tudo pronto para revisar.' : 'Vamos guardar isso com cuidado.'}</h1><p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-muted-foreground">{stage === 'idle' ? 'Envie um exame, receita ou relatório. A SaúdeMemora lê o documento e organiza as informações principais para você.' : stage === 'uploading' ? 'Enviando seus arquivos com segurança...' : stage === 'processing' ? 'Estamos extraindo e organizando as informações...' : 'Encontramos as informações principais. Dê uma olhada antes de salvar.'}</p></section>
    {stage === 'idle' && <><input ref={fileRef} type="file" multiple accept=".pdf,image/jpeg,image/png" className="hidden" onChange={handlePicked} /><input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePicked} /><div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} className="group relative flex min-h-[285px] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-accent/50 bg-[hsl(var(--secondary)/.4)] px-6 transition-all hover:border-accent hover:bg-secondary"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-accent soft-shadow transition-transform group-hover:-translate-y-1"><UploadCloud size={28} /></span><h2 className="mt-5 text-base font-extrabold">{files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : 'Clique para escolher arquivos'}</h2><p className="mt-2 text-xs text-muted-foreground">PDF, JPG ou PNG · até 10 MB</p><div className="mt-6 flex gap-3"><span className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-bold text-primary">Procurar arquivos</span><button type="button" onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }} className="rounded-lg border border-border bg-accent text-accent-foreground px-3 py-2 text-[11px] font-bold flex items-center gap-1.5 hover:bg-accent/90"><ImagePlus size={14} /> Usar Câmera</button></div></div><div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><Lock size={12} className="text-accent" /> Privado por padrão</span><span className="flex items-center gap-1.5"><ImagePlus size={12} className="text-accent" /> Imagem ou PDF</span></div>
    
    {error && <p className="text-center text-xs font-bold text-red-500">{error}</p>}
    <button onClick={start} className="mx-auto flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40" disabled={files.length === 0}>Processar documento</button></>}
    
    {(stage === 'uploading' || stage === 'processing') && <UploadProcessingStatus stage={stage} progress={progress} fileCount={files.length} />}
    
    {stage === 'done' && <div className="rounded-3xl border border-border bg-card p-6 soft-shadow md:p-9"><div className="flex items-center gap-3 border-b border-border pb-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-accent"><CheckCircle2 size={22} /></span><div><p className="text-sm font-extrabold">Documento processado</p><p className="mt-1 text-xs text-muted-foreground">{files.length} arquivo(s)</p></div><span className="ml-auto rounded-full bg-secondary px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-secondary-foreground">Concluído</span></div><div className="rounded-xl border border-accent/25 bg-secondary/50 p-4 mt-6"><p className="flex items-center gap-2 text-xs font-bold text-secondary-foreground"><Check size={15} /> Extração concluída com sucesso</p><p className="mt-2 text-xs leading-5 text-muted-foreground">O documento foi salvo no banco de dados com as informações extraídas.</p></div><button onClick={finish} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:-translate-y-0.5"><FileText size={16} /> Ver documento</button></div>}
  </div>;
}
