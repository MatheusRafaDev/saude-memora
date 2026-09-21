import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Check, CheckCircle2, FileText, ImagePlus, LoaderCircle, Lock, Sparkles, UploadCloud } from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';

export default function Upload() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('exame');
  const [stage, setStage] = useState<'idle' | 'processing' | 'done'>('idle');

  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  
  // No manual progress update; we will use CSS indeterminate animation

  const start = async () => { 
    if (!file) return; 
    setStage('processing'); 
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      // 'type' is now inferred by the AI in the backend

      // We use customFetch directly because the Orval hook doesn't support dynamic multipart bodies well without schema
      const res = await customFetch('/api/documents/upload', {
        method: 'POST',
        body: formData as any
      }) as any;

      setResultId(res.id);
      setTimeout(() => setStage('done'), 500);
    } catch (err) {
      console.error(err);
      setError('Erro ao processar o documento. Tente novamente.');
      setStage('idle');
    }
  };

  const finish = () => { 
    if (resultId) {
      setLocation(`/documents/${resultId}`); 
    } else {
      setLocation('/documents');
    }
  };

  return <div className="page-enter mx-auto max-w-[850px] space-y-8"><Link href="/documents" className="flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={15} /> Voltar para documentos</Link><section className="text-center"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">novo documento</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[42px]">{stage === 'done' ? 'Tudo pronto para revisar.' : 'Vamos guardar isso com cuidado.'}</h1><p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-muted-foreground">{stage === 'idle' ? 'Envie um exame, receita ou relatório. A SaúdeMemora lê o documento e organiza as informações principais para você.' : stage === 'processing' ? 'A IA está extraindo as informações do documento no backend...' : 'Encontramos as informações principais. Dê uma olhada antes de salvar.'}</p></section>
    {stage === 'idle' && <><button onClick={() => fileRef.current?.click()} className="group relative flex min-h-[285px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-accent/50 bg-[hsl(var(--secondary)/.4)] px-6 transition-all hover:border-accent hover:bg-secondary"><input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-accent soft-shadow transition-transform group-hover:-translate-y-1"><UploadCloud size={28} /></span><h2 className="mt-5 text-base font-extrabold">{file ? file.name : 'Clique para escolher um arquivo'}</h2><p className="mt-2 text-xs text-muted-foreground">PDF, JPG ou PNG · até 20 MB</p><span className="mt-6 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-bold text-primary">Procurar arquivo</span></button><div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><Lock size={12} className="text-accent" /> Privado por padrão</span><span className="flex items-center gap-1.5"><ImagePlus size={12} className="text-accent" /> Imagem ou PDF</span></div>
    
    {error && <p className="text-center text-xs font-bold text-red-500">{error}</p>}
    <button onClick={start} className="mx-auto flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40" disabled={!file}>Processar documento <Sparkles size={15} /></button></>}
    
    {stage === 'processing' && <div className="rounded-3xl border border-border bg-card p-8 soft-shadow md:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-accent"><LoaderCircle size={28} className="animate-spin" /></div><h2 className="mt-6 text-center text-lg font-extrabold">A IA está lendo seu documento</h2><p className="mt-2 text-center text-xs text-muted-foreground">Isso pode levar de 5 a 15 segundos dependendo do tamanho...</p><div className="mx-auto mt-9 max-w-[480px]"><div className="mb-2 flex justify-between text-[10px] font-bold"><span className="text-muted-foreground">Extração inteligente em andamento</span><span className="font-mono text-accent">Processando</span></div><div className="relative h-2 overflow-hidden rounded-full bg-muted"><div className="absolute top-0 bottom-0 left-0 w-1/2 rounded-full bg-accent animate-continuous" /></div></div><div className="mx-auto mt-9 grid max-w-[480px] gap-3 sm:grid-cols-3"><span className="rounded-xl bg-secondary p-3 text-center text-[10px] font-bold text-secondary-foreground">Enviando concluído</span><span className="rounded-xl bg-secondary p-3 text-center text-[10px] font-bold text-secondary-foreground">Processando OCR...</span><span className="rounded-xl bg-muted p-3 text-center text-[10px] font-bold text-muted-foreground">Finalizando...</span></div></div>}
    
    {stage === 'done' && <div className="rounded-3xl border border-border bg-card p-6 soft-shadow md:p-9"><div className="flex items-center gap-3 border-b border-border pb-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-accent"><CheckCircle2 size={22} /></span><div><p className="text-sm font-extrabold">Documento processado</p><p className="mt-1 text-xs text-muted-foreground">{file?.name}</p></div><span className="ml-auto rounded-full bg-secondary px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-secondary-foreground">Concluído</span></div><div className="rounded-xl border border-accent/25 bg-secondary/50 p-4 mt-6"><p className="flex items-center gap-2 text-xs font-bold text-secondary-foreground"><Check size={15} /> Extração concluída com sucesso</p><p className="mt-2 text-xs leading-5 text-muted-foreground">O documento foi salvo no banco de dados com as informações extraídas pela inteligência artificial.</p></div><button onClick={finish} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:-translate-y-0.5"><FileText size={16} /> Ver documento</button></div>}
  </div>;
}