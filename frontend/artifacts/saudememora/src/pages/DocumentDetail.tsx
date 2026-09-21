import { useState } from 'react';
import { Link, useParams, useRoute, useLocation } from 'wouter';
import { ArrowLeft, CalendarDays, ChevronRight, FileCheck2, Info, MapPin, Pill, Stethoscope, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { useGetApiDocumentsId, useDeleteApiDocumentsId } from '@workspace/api-client-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DocumentDetail({ id: propId }: { id?: string }) {
  const [match, params] = useRoute('/documents/:id');
  const id = propId || params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deleteMutation = useDeleteApiDocumentsId();

  const { data: docRaw, isLoading } = useGetApiDocumentsId(id || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ id: id || '' }, {
      onSuccess: () => {
        toast({ description: 'Documento apagado com sucesso.' });
        setLocation('/documents');
      }
    });
  };

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando detalhes do documento...</div>;
  }

  if (!docRaw) {
    return <div className="page-enter p-12 text-center text-red-500">Documento não encontrado.</div>;
  }

  const doc = docRaw as unknown as any;
  const date = new Date(doc.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const typeLabel = doc.type === 'receita' ? 'Receita' : doc.type === 'laudo' ? 'Laudo' : 'Exame';

  return <div className="page-enter space-y-7"><div className="flex items-center justify-between"><Link href="/documents" data-testid="link-detail-back" className="flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowLeft size={15} /> Todos os documentos</Link><div className="flex items-center gap-2"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"><MoreVertical size={18} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40"><DropdownMenuItem className="text-xs font-bold" onClick={() => toast({ description: 'Edição estará disponível em breve.' })}><Pencil size={14} className="mr-2" /> Editar</DropdownMenuItem><DropdownMenuItem className="text-xs font-bold text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={14} className="mr-2" /> Apagar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div><section className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="flex items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-secondary-foreground">{typeLabel}</span><span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground"><CalendarDays size={12} /> {date}</span></div><h1 className="mt-3 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">{doc.title}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><Stethoscope size={15} /> {doc.doctor} <span className="text-border">·</span> {doc.clinic}</p></div><span className="flex w-fit items-center gap-2 rounded-xl border border-accent/30 bg-secondary px-3 py-2 text-[11px] font-bold text-secondary-foreground"><FileCheck2 size={15} /> Documento processado</span></section>
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className="rounded-2xl border border-border bg-[hsl(205_25%_89%)] p-4 md:p-5"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">documento original</span><a href={doc.imageUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-card px-3 py-2 text-[10px] font-bold text-primary hover:bg-secondary">Ver imagem</a></div>
    
    <div className="relative min-h-[440px] flex items-center justify-center overflow-hidden rounded-xl bg-[#fdfcf8] p-4 text-[#45504f] shadow-[0_5px_18px_rgba(32,60,67,.12)]">
      {doc.imageUrl ? (
        <img src={doc.imageUrl} alt="Documento Original" className="w-full h-auto rounded shadow-sm" />
      ) : (
        <p className="text-sm text-muted-foreground">Imagem não disponível.</p>
      )}
    </div>
    
    </section>
      <section className="space-y-5"><div className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-accent"><Info size={16} /></span><h2 className="text-base font-extrabold">Em poucas palavras</h2></div><p className="mt-5 text-[14px] leading-7 text-foreground/80">{doc.summary || 'Resumo não extraído.'}</p><div className="mt-5 rounded-xl bg-muted/60 p-4"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">interpretação registrada</p><p className="mt-2 text-sm font-bold">{doc.diagnosis || 'Diagnóstico não registrado.'}</p></div></div><div className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(39_85%_92%)] text-[hsl(34_73%_42%)]"><Pill size={16} /></span><h2 className="text-base font-extrabold">Medicamentos extraídos</h2></div><span className="font-mono text-[10px] text-muted-foreground">{(doc.medicines?.length || 0).toString().padStart(2, '0')}</span></div>{doc.medicines?.length ? <div className="mt-5 space-y-3">{doc.medicines.map((medicine: any) => <div key={medicine.name} className="flex items-center justify-between rounded-xl bg-muted/60 p-4"><div><p className="text-sm font-bold">{medicine.name}</p><p className="mt-1 text-xs text-muted-foreground">{medicine.dosage}</p></div><ChevronRight size={15} className="text-muted-foreground" /></div>)}</div> : <p className="mt-5 rounded-xl bg-muted/60 px-4 py-5 text-xs text-muted-foreground">Nenhum medicamento associado a este documento.</p>}</div>
      {doc.extractedText && (
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="flex items-center gap-2"><h2 className="text-base font-extrabold">Transcrição Bruta via OCR</h2></div><div className="mt-5 rounded-xl bg-muted/30 p-5"><pre className="font-mono whitespace-pre-wrap text-[11px] leading-6 text-muted-foreground overflow-auto max-h-[250px] scrollbar-thin">{doc.extractedText}</pre></div></div>
      )}
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4"><MapPin size={16} className="mt-0.5 shrink-0 text-accent" /><div><p className="text-[12px] font-bold text-foreground">Informação extraída via IA</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">O SaúdeMemora usa inteligência artificial (Gemini OCR) para estruturar os dados da imagem. Revise sempre com atenção e consulte um profissional de saúde em caso de dúvidas.</p></div></div></section></div>

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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  </div>;
}