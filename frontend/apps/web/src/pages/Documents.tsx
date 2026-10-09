import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronRight, FileText, MoreVertical, Pencil, Search, Trash2, X, BrainCircuit, Table, Plus, Filter, RefreshCcw, LoaderCircle, ShieldAlert, Check, FlaskConical, Pill, Stethoscope, ArrowRight, FileStack, AlertTriangle, Syringe } from 'lucide-react';
import { customFetch, useGetApiDocuments, useDeleteApiDocumentsId } from '@workspace/api-client-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { triggerUploadModal } from '@/components/UploadModal';
import { filterDocuments } from '@/lib/document-search';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todos os tipos', icon: FileStack },
  { value: 'exame', label: 'Exames', icon: FlaskConical },
  { value: 'receita', label: 'Receitas', icon: Pill },
  { value: 'laudo', label: 'Laudos', icon: Stethoscope },
  { value: 'relatorio', label: 'Relatórios', icon: FileText },
  { value: 'atestado', label: 'Atestados', icon: ShieldAlert },
  { value: 'vacina', label: 'Vacinas', icon: Syringe },
  { value: 'encaminhamento', label: 'Encaminhamentos', icon: ArrowRight },
  { value: 'outro', label: 'Outros', icon: FileText },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos os períodos' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: '6months', label: 'Últimos 6 meses' },
  { value: 'thisyear', label: 'Este ano' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'processing', label: 'Em processamento' },
  { value: 'review', label: 'Precisa de revisão' },
  { value: 'ready', label: 'Pronto' },
  { value: 'failed', label: 'Com erro' },
  { value: 'rejected', label: 'Não reconhecido' },
];

export default function Documents() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: documentsRaw, isLoading, refetch } = useGetApiDocuments();
  const deleteMutation = useDeleteApiDocumentsId();
  const rawDocuments = (documentsRaw as unknown as any[]) || [];
  
  // Local state for optimistic deletes
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [reprocessingIds, setReprocessingIds] = useState<Set<string>>(new Set());
  const documents = rawDocuments.filter((doc: any) => !deletedIds.has(doc.id));

  const hasProcessing = documents.some((d: any) => d.status === 'pending' || d.status === 'processing');
  const isFailed = (doc: any) => doc.status === 'failed';
  const canReprocess = (doc: any) => isFailed(doc);
  const getSummary = (doc: any) => {
    if (doc.status === 'pending' || doc.status === 'processing') return 'Documento em processamento.';
    if (isFailed(doc)) return 'Não foi possível processar este documento.';
    if (doc.status === 'rejeitado') return 'O documento não foi reconhecido.';
    return doc.resumo || 'Resumo extraído automaticamente.';
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasProcessing) {
      timer = setInterval(() => refetch(), 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [hasProcessing, refetch]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('document-uploaded', handler);
    return () => window.removeEventListener('document-uploaded', handler);
  }, [refetch]);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleReprocess = async (documentId: string) => {
    setReprocessingIds(current => new Set(current).add(documentId));
    try {
      await customFetch(`/api/documents/${documentId}/reprocessar`, { method: 'POST' });
      toast({ title: 'Reprocessamento iniciado', description: 'Acompanhe o status deste documento na tabela.' });
      await refetch();
    } catch (error: any) {
      toast({
        title: 'Não foi possível reprocessar',
        description: error?.data?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setReprocessingIds(current => {
        const next = new Set(current);
        next.delete(documentId);
        return next;
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (!documentToDelete) return;
    const idToDelete = documentToDelete;
    
    // Optimistic delete
    setDeletedIds(prev => new Set(prev).add(idToDelete));
    setDocumentToDelete(null);

    deleteMutation.mutate({ id: idToDelete }, {
      onSuccess: () => {
        toast({ description: 'Documento apagado com sucesso.' });
        refetch();
      },
      onError: () => {
        toast({ description: 'Erro ao apagar. Recarregando...' });
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.delete(idToDelete);
          return next;
        });
        refetch();
      }
    });
  };
  
  const filtered = useMemo(() => {
    return filterDocuments(documents, {
      query,
      category: selectedCategory,
      period: selectedPeriod,
      status: selectedStatus,
      dateFrom,
      dateTo,
    });
  }, [documents, query, selectedCategory, selectedPeriod, selectedStatus, dateFrom, dateTo]);

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedPeriod('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = query || selectedCategory !== 'all' || selectedPeriod !== 'all'
    || selectedStatus !== 'all' || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="page-enter space-y-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-10 w-64 rounded-xl bg-muted animate-pulse" />
            <div className="h-4 w-96 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-11 w-48 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="h-[140px] w-full rounded-2xl bg-muted animate-pulse" />
        <div className="h-[400px] w-full rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-7">
      {/* Header section with SINGLE primary add document button */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">arquivo pessoal de saúde</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">Meus Documentos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tabela unificada com todos os seus exames, receitas e relatórios classificados por IA.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            aria-label="Recarregar documentos"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer border border-border"
            title="Recarregar documentos"
          >
            <RefreshCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => triggerUploadModal()}
            data-testid="button-documents-upload"
            className="flex min-h-11 w-fit items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Plus size={16} /> Adicionar Documento
          </button>
        </div>
      </section>

      {/* Advanced Filter Section */}
      <section aria-label="Filtros de documentos" className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Pesquisar nos documentos por título ou conteúdo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="input-document-search"
              placeholder="Pesquisar por título ou conteúdo do documento..."
              className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-10 text-sm outline-none focus:ring-4 focus:ring-accent/10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
                data-testid="button-clear-document-search"
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-primary"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                aria-label="Filtrar por período"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-4 text-xs font-bold outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer text-foreground"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <select
              aria-label="Filtrar por status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-4 text-xs font-bold text-foreground outline-none focus:ring-4 focus:ring-accent/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Limpar todos os filtros"
              >
                <X size={14} /> Limpar
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-foreground">
            Data a partir de
            <input
              type="date"
              aria-label="Data inicial"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-4 focus:ring-accent/10"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-foreground">
            Até
            <input
              type="date"
              aria-label="Data final"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-4 focus:ring-accent/10"
            />
          </label>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <span id="document-category-filter-label" className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground shrink-0 pr-1">
            <Filter size={14} className="text-accent" /> Categoria:
          </span>
          {CATEGORY_OPTIONS.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                type="button"
                key={cat.value}
                aria-pressed={selectedCategory === cat.value}
                aria-labelledby={`document-category-filter-label document-category-${cat.value}`}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {Icon && <Icon size={14} aria-hidden="true" />} <span id={`document-category-${cat.value}`}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Table Header Info */}
      <div className="flex items-center justify-between px-1">
        <p aria-live="polite" className="text-sm font-semibold text-muted-foreground">
          Exibindo <span className="font-mono text-foreground font-bold">{filtered.length}</span> de <span className="font-mono text-foreground font-bold">{documents.length}</span> documentos
        </p>
      </div>

      {/* Structured Document Table with Portuguese Titles */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border/70 pb-4 mb-4">
          <Table size={18} className="text-accent" />
          <h2 className="text-base font-extrabold text-foreground">Tabela Geral de Documentos Médicos</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-sm font-extrabold">Nenhum documento encontrado com os filtros atuais</h3>
            <p className="mt-1 text-xs text-muted-foreground">Tente alterar os filtros ou limpar a pesquisa.</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th scope="col" className="py-3 px-3">Título do Documento</th>
                  <th scope="col" className="py-3 px-3">Tipo</th>
                  <th scope="col" className="py-3 px-3">Status</th>
                  <th scope="col" className="py-3 px-3">Médico / Clínica</th>
                  <th scope="col" className="py-3 px-3">Data do Registro</th>
                  <th scope="col" className="py-3 px-3">Resumo / Diagnóstico</th>
                  <th scope="col" className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filtered.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="py-3.5 px-3 font-bold text-foreground">
                      {doc.status === 'pending' || doc.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-muted-foreground cursor-not-allowed opacity-80" title="Aguarde o processamento concluir">
                          <FileText size={16} className="shrink-0" />
                          <span className="truncate max-w-[200px]">Analisando documento...</span>
                        </div>
                      ) : (
                        <Link href={`/documentos/${doc.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                          <FileText size={16} className="text-accent shrink-0" />
                          <span className="truncate max-w-[200px]">{doc.titulo || 'Documento sem título'}</span>
                        </Link>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-accent">
                        {doc.tipo || 'Documento'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {doc.status === 'pending' || doc.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-800">
                          <LoaderCircle size={10} className="animate-spin" /> {doc.status === 'processing' ? `Processando ${doc.progress || 0}%` : 'Na fila'}
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-destructive">
                           <ShieldAlert size={10} /> Erro
                        </span>
                      ) : doc.status === 'rejeitado' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                           <ShieldAlert size={10} /> Não reconhecido
                        </span>
                      ) : doc.revisaoPendente ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                           <AlertTriangle size={10} /> Revisar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                           <Check size={10} /> Pronto
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-medium">
                      {doc.medico || doc.clinica || 'Não informado'}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-mono">
                      {doc.data || new Date(doc.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground max-w-[280px]">
                      <p className={`truncate font-normal ${isFailed(doc) ? 'text-destructive' : ''}`} title={isFailed(doc) ? 'Documento não processado.' : undefined}>
                        {getSummary(doc)}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {doc.status === 'pending' || doc.status === 'processing' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-muted-foreground opacity-50 cursor-not-allowed text-xs mr-1" title="Aguarde concluir">
                            Ver <ChevronRight size={14} />
                          </span>
                        ) : (
                          <Link href={`/documentos/${doc.id}`} className="inline-flex items-center gap-1 font-bold text-primary hover:text-accent text-xs mr-1">
                            Ver <ChevronRight size={14} />
                          </Link>
                        )}
                        {canReprocess(doc) && (
                          <button
                            type="button"
                            onClick={() => handleReprocess(doc.id)}
                            disabled={reprocessingIds.has(doc.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-2 py-1 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
                            title="Reprocessar documento"
                          >
                            <RefreshCcw size={12} className={reprocessingIds.has(doc.id) ? 'animate-spin' : ''} />
                            Reprocessar
                          </button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" aria-label={`Mais ações para ${doc.titulo || 'documento'}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground">
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="min-h-11 text-sm font-bold" onClick={() => setLocation(`/documentos/${doc.id}?edit=true`)}>
                              <Pencil size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="min-h-11 text-sm font-bold text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => setDocumentToDelete(doc.id)}>
                              <Trash2 size={14} className="mr-2" /> Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((doc: any) => (
              <div key={`mobile-${doc.id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {doc.status === 'pending' || doc.status === 'processing' ? (
                        <div className="flex items-center gap-2 text-muted-foreground opacity-80 mb-1">
                          <FileText size={16} className="shrink-0" />
                          <span className="truncate text-sm font-bold">Analisando documento...</span>
                        </div>
                      ) : (
                        <Link href={`/documentos/${doc.id}`} className="hover:text-primary transition-colors flex items-center gap-2 mb-1">
                          <FileText size={16} className="text-accent shrink-0" />
                          <span className="truncate text-sm font-bold">{doc.titulo || 'Documento sem título'}</span>
                        </Link>
                      )}
                      
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-accent">
                        {doc.tipo || 'Documento'}
                      </span>
                      {doc.status === 'pending' || doc.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-blue-800">
                          <LoaderCircle size={10} className="animate-spin" /> {doc.status === 'processing' ? `Processando ${doc.progress || 0}%` : 'Na fila'}
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-destructive">
                           <ShieldAlert size={10} /> Erro
                        </span>
                      ) : doc.status === 'rejeitado' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                           <ShieldAlert size={10} /> Não reconhecido
                        </span>
                      ) : doc.revisaoPendente ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                           <AlertTriangle size={10} /> Revisar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                           <Check size={10} /> Pronto
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={`Mais ações para ${doc.titulo || 'documento'}`} className="-mr-1 -mt-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="min-h-11 text-sm font-bold" onClick={() => setLocation(`/documentos/${doc.id}?edit=true`)}>
                        <Pencil size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="min-h-11 text-sm font-bold text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => setDocumentToDelete(doc.id)}>
                        <Trash2 size={14} className="mr-2" /> Apagar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/70 mb-0.5">Médico/Clínica</span>
                    <span className="font-medium truncate block">{doc.medico || doc.clinica || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/70 mb-0.5">Data</span>
                    <span className="font-mono truncate block">{doc.data || new Date(doc.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                {isFailed(doc) && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-xs font-semibold text-destructive">Falha no processamento</p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">Não foi possível analisar este documento. Você pode tentar processá-lo novamente.</p>
                    {canReprocess(doc) && (
                      <button
                        type="button"
                        onClick={() => handleReprocess(doc.id)}
                        disabled={reprocessingIds.has(doc.id)}
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                      >
                        <RefreshCcw size={13} className={reprocessingIds.has(doc.id) ? 'animate-spin' : ''} />
                        Tentar novamente agora
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </section>
      
      {/* Delete confirmation dialog */}
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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
