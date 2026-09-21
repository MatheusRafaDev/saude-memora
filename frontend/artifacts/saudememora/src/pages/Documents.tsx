import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ChevronRight, FileText, MoreVertical, Pencil, Search, Trash2, X, BrainCircuit, Table, Plus, Filter, CalendarDays, SlidersHorizontal } from 'lucide-react';
import { useGetApiDocuments, useDeleteApiDocumentsId } from '@workspace/api-client-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { triggerUploadModal } from '@/components/UploadModal';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'exame', label: 'Exames' },
  { value: 'sangue', label: 'Exame de Sangue' },
  { value: 'imagem', label: 'Exame de Imagem' },
  { value: 'receita', label: 'Receita Médica' },
  { value: 'laudo', label: 'Laudo Médico' },
  { value: 'atestado', label: 'Atestado' },
  { value: 'vacina', label: 'Vacinação' },
  { value: 'encaminhamento', label: 'Encaminhamento' },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos os períodos' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: '6months', label: 'Últimos 6 meses' },
  { value: 'thisyear', label: 'Este ano' },
];

export default function Documents() {
  const { toast } = useToast();
  const { data: documentsRaw, isLoading, refetch } = useGetApiDocuments();
  const deleteMutation = useDeleteApiDocumentsId();
  const documents = (documentsRaw as unknown as any[]) || [];

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
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
  
  const filtered = useMemo(() => {
    const now = new Date().getTime();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();

    return documents.filter((doc) => {
      // 1. Text Search Filter
      const fullText = `${doc.title} ${doc.doctor} ${doc.clinic} ${doc.type} ${doc.summary}`.toLowerCase();
      const matchesSearch = fullText.includes(query.toLowerCase());

      // 2. Category / Type Filter
      const docTypeLower = (doc.type || '').toLowerCase();
      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        matchesCategory = docTypeLower.includes(selectedCategory.toLowerCase());
      }

      // 3. Period Filter
      let matchesPeriod = true;
      const docDate = new Date(doc.createdAt || doc.date).getTime();
      if (selectedPeriod === '30days') {
        matchesPeriod = docDate >= thirtyDaysAgo;
      } else if (selectedPeriod === '6months') {
        matchesPeriod = docDate >= sixMonthsAgo;
      } else if (selectedPeriod === 'thisyear') {
        matchesPeriod = docDate >= startOfYear;
      }

      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [documents, query, selectedCategory, selectedPeriod]);

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedPeriod('all');
  };

  const hasActiveFilters = query || selectedCategory !== 'all' || selectedPeriod !== 'all';

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando tabela de documentos...</div>;
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
        <button
          onClick={() => triggerUploadModal()}
          data-testid="button-documents-upload"
          className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={16} /> Adicionar Documento
        </button>
      </section>

      {/* Advanced Filter Section */}
      <section className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="input-document-search"
              placeholder="Pesquisar por nome do documento, tipo, médico ou clínica..."
              className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-10 text-sm outline-none focus:ring-4 focus:ring-accent/10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
                data-testid="button-clear-document-search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-primary"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Date Period Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-4 text-xs font-bold outline-none focus:ring-4 focus:ring-accent/10 cursor-pointer text-foreground"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 h-11 px-3.5 rounded-xl border border-border bg-muted/60 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Limpar todos os filtros"
              >
                <X size={14} /> Limpar
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground shrink-0 pr-1">
            <Filter size={14} className="text-accent" /> Categoria:
          </span>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Table Header Info */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-muted-foreground">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-3">Título do Documento</th>
                  <th className="py-3 px-3">Tipo (IA)</th>
                  <th className="py-3 px-3">Médico / Clínica</th>
                  <th className="py-3 px-3">Data do Registro</th>
                  <th className="py-3 px-3">Resumo / Diagnóstico</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filtered.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="py-3.5 px-3 font-bold text-foreground">
                      <Link href={`/documentos/${doc.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                        <FileText size={16} className="text-accent shrink-0" />
                        <span className="truncate max-w-[200px]">{doc.title || 'Documento sem título'}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-accent">
                        <BrainCircuit size={10} />
                        {doc.type || 'Documento'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-medium">
                      {doc.doctor || doc.clinic || 'Não informado'}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-mono">
                      {doc.date || new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground max-w-[280px]">
                      <p className="truncate font-normal">{doc.summary || 'Resumo extraído pela inteligência artificial.'}</p>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/documentos/${doc.id}`} className="inline-flex items-center gap-1 font-bold text-primary hover:text-accent text-xs mr-1">
                          Ver <ChevronRight size={14} />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground">
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => toast({ description: 'Edição estará disponível em breve.' })}>
                              <Pencil size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={() => setDocumentToDelete(doc.id)}>
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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
