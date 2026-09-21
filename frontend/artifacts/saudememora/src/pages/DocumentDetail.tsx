import { useState } from 'react';
import { Link, useParams, useRoute, useLocation } from 'wouter';
import { ArrowLeft, CalendarDays, ChevronRight, FileCheck2, Info, MapPin, Pill, Stethoscope, MoreVertical, Trash2, Pencil, BrainCircuit, AlignLeft, Code } from 'lucide-react';
import { useGetApiDocumentsId, useDeleteApiDocumentsId } from '@workspace/api-client-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function indentOcrText(rawText: string) {
  if (!rawText) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const structured: { type: 'header' | 'keyvalue' | 'bullet' | 'text'; key?: string; value?: string; text: string; indentLevel: number }[] = [];

  for (const line of lines) {
    // Header detection
    const isHeader =
      (/^([A-ZÁÀÂÃÉÈÊÍÓÔÕÚÇ0-9\s\-\/\.]{3,}:?)$/.test(line) && line.length < 50) ||
      /^(PACIENTE|MÉDICO|LAUDO|DIAGNOSTICO|DIAGNÓSTICO|RECEITA|EXAME|EXAMES|RESULTADO|RESULTADOS|OBSERVAÇÕES|IMPRESSÃO|CONCLUSÃO|INDICAÇÃO|DOSAGEM|MEDICAMENTOS|DATA|CONVENIO|CONVÊNIO|CRM):?/i.test(line);

    if (isHeader) {
      structured.push({
        type: 'header',
        text: line.replace(/:$/, ''),
        indentLevel: 0
      });
    } else if (line.includes(':')) {
      const parts = line.split(':');
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      structured.push({
        type: 'keyvalue',
        key,
        value: val,
        text: line,
        indentLevel: 1
      });
    } else if (/^[\-\*\•\>]/.test(line)) {
      structured.push({
        type: 'bullet',
        text: line.replace(/^[\-\*\•\>]\s*/, ''),
        indentLevel: 1
      });
    } else {
      structured.push({
        type: 'text',
        text: line,
        indentLevel: 2
      });
    }
  }

  return structured;
}

export default function DocumentDetail({ id: propId }: { id?: string }) {
  const [match, params] = useRoute('/documentos/:id');
  const id = propId || (params as any)?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deleteMutation = useDeleteApiDocumentsId();

  const { data: docRaw, isLoading } = useGetApiDocumentsId(id || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ocrViewMode, setOcrViewMode] = useState<'indented' | 'raw'>('indented');

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ id: id || '' }, {
      onSuccess: () => {
        toast({ description: 'Documento apagado com sucesso.' });
        setLocation('/documentos');
      }
    });
  };

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando detalhes do documento...</div>;
  }

  if (!docRaw) {
    return <div className="page-enter p-12 text-center text-red-500 font-bold">Documento não encontrado.</div>;
  }

  const doc = docRaw as unknown as any;
  const date = new Date(doc.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const typeLabel = doc.type || 'Documento';

  return (
    <div className="page-enter space-y-7">
      <div className="flex items-center justify-between">
        <Link href="/documentos" data-testid="link-detail-back" className="flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft size={15} /> Todos os documentos
        </Link>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs font-bold" onClick={() => toast({ description: 'Edição estará disponível em breve.' })}>
                <Pencil size={14} className="mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-bold text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={14} className="mr-2" /> Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/10 border border-accent/20 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-accent">
              {typeLabel}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
              <CalendarDays size={12} /> {date}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">{doc.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Stethoscope size={15} /> {doc.doctor || 'Profissional não informado'} <span className="text-border">·</span> {doc.clinic || 'Clínica não informada'}
          </p>
        </div>
        <span className="flex w-fit items-center gap-2 rounded-xl border border-accent/30 bg-secondary px-3 py-2 text-[11px] font-bold text-secondary-foreground">
          <FileCheck2 size={15} /> Classificado por IA
        </span>
      </section>

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-2xl border border-border bg-[hsl(205_25%_89%)] p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">documento original</span>
            {doc.imageUrl && (
              <a href={doc.imageUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-card px-3 py-2 text-[10px] font-bold text-primary hover:bg-secondary">
                Ver imagem
              </a>
            )}
          </div>
          
          <div className="relative min-h-[440px] flex items-center justify-center overflow-hidden rounded-xl bg-[#fdfcf8] p-4 text-[#45504f] shadow-[0_5px_18px_rgba(32,60,67,.12)]">
            {doc.imageUrl ? (
              <img src={doc.imageUrl} alt="Documento Original" className="w-full h-auto rounded shadow-sm" />
            ) : (
              <p className="text-sm text-muted-foreground">Imagem não disponível.</p>
            )}
          </div>
        </section>

        <section className="space-y-5">
          {/* AI Summary */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-accent">
                <Info size={16} />
              </span>
              <h2 className="text-base font-extrabold">Resumo da Inteligência Artificial</h2>
            </div>
            <p className="mt-4 text-[14px] leading-7 text-foreground/80 font-medium">{doc.summary || 'Resumo não extraído.'}</p>
            {doc.diagnosis && (
              <div className="mt-4 rounded-xl bg-muted/60 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">diagnóstico / interpretação</p>
                <p className="mt-1.5 text-sm font-extrabold text-foreground">{doc.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Extracted Medicines */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Pill size={16} />
                </span>
                <h2 className="text-base font-extrabold">Medicamentos Identificados</h2>
              </div>
              <span className="font-mono text-[10px] font-bold text-muted-foreground">
                {(doc.medicines?.length || 0).toString().padStart(2, '0')}
              </span>
            </div>
            {doc.medicines?.length ? (
              <div className="mt-4 space-y-2.5">
                {doc.medicines.map((medicine: any) => (
                  <div key={medicine.name} className="flex items-center justify-between rounded-xl bg-muted/60 p-3.5">
                    <div>
                      <p className="text-xs font-extrabold text-foreground">{medicine.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{medicine.dosage}</p>
                    </div>
                    <ChevronRight size={15} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-muted/40 px-4 py-4 text-xs text-muted-foreground italic">
                Nenhum medicamento associado a este documento.
              </p>
            )}
          </div>

          {/* Indented OCR Text Section */}
          {doc.extractedText && (
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <BrainCircuit size={19} />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">Transcrição Indentada via IA</h2>
                    <p className="text-xs text-muted-foreground">Texto extraído do documento e indentado por seções pela inteligência artificial.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
                  <button
                    onClick={() => setOcrViewMode('indented')}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      ocrViewMode === 'indented' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <AlignLeft size={13} /> Indentado por IA
                  </button>
                  <button
                    onClick={() => setOcrViewMode('raw')}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      ocrViewMode === 'raw' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Code size={13} /> Texto Bruto
                  </button>
                </div>
              </div>

              {ocrViewMode === 'indented' ? (
                <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-2.5 font-mono text-xs overflow-auto max-h-[360px] scrollbar-thin">
                  {indentOcrText(doc.extractedText).map((item, idx) => {
                    if (item.type === 'header') {
                      return (
                        <div key={idx} className="pt-3 pb-1 border-b border-border/40 font-black text-accent flex items-center gap-2 text-xs uppercase tracking-wider">
                          <span className="h-2 w-2 rounded-full bg-accent" />
                          {item.text}
                        </div>
                      );
                    }
                    if (item.type === 'keyvalue') {
                      return (
                        <div key={idx} className="pl-4 flex flex-wrap items-baseline gap-2">
                          <span className="font-bold text-foreground bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-[11px]">
                            {item.key}:
                          </span>
                          <span className="text-muted-foreground font-medium">{item.value || '—'}</span>
                        </div>
                      );
                    }
                    if (item.type === 'bullet') {
                      return (
                        <div key={idx} className="pl-6 flex items-start gap-2 text-muted-foreground">
                          <span className="text-accent font-bold">•</span>
                          <span>{item.text}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="pl-8 text-muted-foreground/90 leading-relaxed font-normal">
                        {item.text}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 p-5">
                  <pre className="font-mono whitespace-pre-wrap text-[11px] leading-6 text-muted-foreground overflow-auto max-h-[300px] scrollbar-thin">
                    {doc.extractedText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* AI Disclaimer */}
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4">
            <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-[12px] font-bold text-foreground">Informação estruturada via IA</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                O SaúdeMemora utiliza inteligência artificial para transcrever e estruturar dados de saúde. Sempre consulte seu médico para orientações finais.
              </p>
            </div>
          </div>
        </section>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
