import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ChevronRight, FileCheck2, FileText, Filter, MoreVertical, Pencil, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useGetApiDocuments, useDeleteApiDocumentsId } from '@workspace/api-client-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const labels: Record<string, string> = { all: 'Todos', exame: 'Exames', receita: 'Receitas', laudo: 'Laudos' };

export default function Documents() {
  const { toast } = useToast();
  const { data: documentsRaw, isLoading, refetch } = useGetApiDocuments();
  const deleteMutation = useDeleteApiDocumentsId();
  const documents = (documentsRaw as unknown as any[]) || [];

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  
  const handleConfirmDelete = () => {
    if (!documentToDelete) return;
    deleteMutation.mutate({ id: documentToDelete }, {
      onSuccess: () => {
        toast({ description: 'Documento apagado com sucesso.' });
        setDocumentToDelete(null);
        refetch();
      },
      onError: () => setDocumentToDelete(null)
    });
  };
  
  const filtered = useMemo(() => documents.filter((doc) => (filter === 'all' || doc.type === filter) && `${doc.title} ${doc.doctor} ${doc.clinic}`.toLowerCase().includes(query.toLowerCase())), [documents, filter, query]);
  
  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando documentos...</div>;
  }

  return <div className="page-enter space-y-7"><section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">arquivo pessoal</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">Meus documentos</h1><p className="mt-2 text-sm text-muted-foreground">Tudo que você guardou, fácil de encontrar.</p></div><Link href="/upload" data-testid="link-documents-upload" className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg"><FileText size={16} /> Novo documento</Link></section>
    <section className="rounded-2xl border border-border bg-card p-4 md:p-5"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} data-testid="input-document-search" placeholder="Buscar por nome, médico ou clínica..." className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-10 text-sm outline-none focus:ring-4 focus:ring-accent/10" />{query && <button onClick={() => setQuery('')} aria-label="Limpar busca" data-testid="button-clear-document-search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-primary"><X size={15} /></button>}</div><div className="flex items-center gap-2 overflow-x-auto"><SlidersHorizontal size={15} className="shrink-0 text-muted-foreground" />{(Object.keys(labels)).map((key) => <button key={key} onClick={() => setFilter(key)} data-testid={`button-filter-${key}`} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${filter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{labels[key]}</button>)}</div></div></section>
    <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground"><span className="font-mono text-foreground">{filtered.length}</span> documentos encontrados</p><button data-testid="button-filter-placeholder" className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary"><Filter size={14} /> Mais filtros</button></div>
    <section className="grid gap-4">{filtered.map((doc) => <Link href={`/documents/${doc.id}`} key={doc.id} data-testid={`card-document-${doc.id}`} className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-[var(--shadow-lift)] sm:flex-row sm:items-center md:p-5"><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${doc.type === 'receita' ? 'bg-[hsl(39_85%_92%)] text-[hsl(34_73%_42%)]' : doc.type === 'laudo' ? 'bg-[hsl(205_72%_93%)] text-primary' : 'bg-secondary text-accent'}`}><FileCheck2 size={24} /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-base font-extrabold tracking-[-.02em] group-hover:text-primary">{doc.title || 'Documento sem título'}</span><span className={`rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[.08em] ${doc.status === 'revisar' ? 'bg-[hsl(39_85%_92%)] text-[hsl(34_73%_42%)]' : 'bg-secondary text-secondary-foreground'}`}>{doc.status || 'processado'}</span></span><span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><span className="font-semibold text-foreground/70">{doc.doctor || doc.clinic || 'Profissional não identificado'}</span>{doc.date && <><span className="text-border">·</span><span>{doc.date}</span></>}</span>{doc.summary && <p className="mt-2 line-clamp-1 text-[13px] leading-5 text-muted-foreground">{doc.summary}</p>}</span><span className="flex items-center justify-between sm:block sm:text-right"><span className="flex items-center gap-2 sm:hidden"><span className="block font-mono text-[11px] text-foreground">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span><span className="block text-[10px] uppercase tracking-[.12em] text-muted-foreground">{labels[doc.type] || doc.type}</span></span><span className="hidden sm:block"><span className="block font-mono text-[11px] text-foreground">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span><span className="mt-1 block text-[10px] uppercase tracking-[.12em] text-muted-foreground">{labels[doc.type] || doc.type}</span></span><div className="flex items-center gap-2 sm:ml-4 sm:mt-0 mt-2" onClick={(e) => e.preventDefault()}><DropdownMenu><DropdownMenuTrigger asChild><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground"><MoreVertical size={16} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40"><DropdownMenuItem className="text-xs font-bold" onClick={() => toast({ description: 'Edição estará disponível em breve.' })}><Pencil size={14} className="mr-2" /> Editar</DropdownMenuItem><DropdownMenuItem className="text-xs font-bold text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={(e) => { e.preventDefault(); setDocumentToDelete(doc.id); }}><Trash2 size={14} className="mr-2" /> Apagar</DropdownMenuItem></DropdownMenuContent></DropdownMenu><ChevronRight size={18} className="shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" /></div></span></Link>)}</section>
    {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"><FileText size={26} className="mx-auto text-muted-foreground/50" /><h2 className="mt-4 font-extrabold">Nada encontrado</h2><p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou limpe os filtros.</p></div>}
    
    <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
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