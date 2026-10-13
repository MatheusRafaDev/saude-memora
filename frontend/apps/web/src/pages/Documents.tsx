import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  FileText,
  Pill,
  Activity,
  ShieldCheck,
  AlertTriangle,
  LoaderCircle,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import {
  useGetApiDocuments,
  useDeleteApiDocumentsId,
  customFetch,
} from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error-message';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DOCUMENT_TYPES = [
  { id: 'receita', label: 'Receitas' },
  { id: 'exame', label: 'Exames' },
  { id: 'laudo', label: 'Laudos' },
  { id: 'atestado', label: 'Atestados' },
  { id: 'vacina', label: 'Vacinas' },
  { id: 'encaminhamento', label: 'Encaminhamentos' },
  { id: 'relatorio', label: 'Relatórios' },
  { id: 'outro', label: 'Outros' },
];

const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  DOCUMENT_TYPES.map(({ id, label }) => [id, label.replace(/s$/, '')]),
) as Record<string, string>;

function DocumentThumbnail({
  src,
  title,
}: {
  src?: string;
  title: string;
}) {
  const [hasLoadError, setHasLoadError] = useState(false);

  return (
    <div className="bg-[#f1f4f8] rounded-[14px] h-[150px] flex items-center justify-center relative overflow-hidden group-hover:bg-[#eaf0f7] transition-colors">
      {src && !hasLoadError ? (
        <img
          src={src}
          alt={`Prévia de ${title}`}
          loading="lazy"
          onError={() => setHasLoadError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-[86px] h-[112px] rounded-lg bg-white border border-[#dde3ec] p-2.5 shadow-xs flex flex-col justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[90%]" />
            <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[65%]" />
            <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[85%]" />
            <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[55%]" />
          </div>
          <div className="h-[5px] rounded-[3px] bg-[#1f7fe0]/40 w-[75%]" />
        </div>
      )}
    </div>
  );
}

export default function Documents() {
  const { toast } = useToast();
  const { data: documentsRaw, refetch, isLoading, isError } = useGetApiDocuments();
  const deleteMutation = useDeleteApiDocumentsId();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Listen to document-uploaded event
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('document-uploaded', handler);
    return () => window.removeEventListener('document-uploaded', handler);
  }, [refetch]);

  const activeDocs = (documentsRaw as unknown as any[]) || [];

  const allItems = useMemo(() => {
    return activeDocs.map((doc: any) => {
      const createdAt = doc.criadoEm || doc.createdAt;
      const date = createdAt ? new Date(createdAt) : null;
      const hasValidDate = date !== null && !Number.isNaN(date.getTime());
      const monthGroup = hasValidDate
        ? date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : 'Data não informada';
      const dateStr = hasValidDate
        ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
        : 'Data não informada';

      const rawType = String(doc.tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const typeKey = DOCUMENT_TYPE_LABELS[rawType] ? rawType : 'outro';
      const normalizedType = DOCUMENT_TYPE_LABELS[typeKey];

      const imageUrls = Array.isArray(doc.urlImagens) ? doc.urlImagens : [];
      const previewUrl = imageUrls.find(
        (url: unknown): url is string => typeof url === 'string' && url.trim().length > 0,
      ) || (typeof doc.fileUrl === 'string' ? doc.fileUrl : undefined);

      return {
        id: doc.id,
        titulo: doc.titulo || `${normalizedType} ${dateStr}`,
        previewUrl,
        tipo: normalizedType,
        tipoKey: typeKey,
        status: doc.status || 'pronto',
        revisaoPendente: Boolean(doc.revisaoPendente),
        dateStr,
        monthGroup: monthGroup.charAt(0).toUpperCase() + monthGroup.slice(1),
        createdAt: hasValidDate ? date.toISOString() : undefined,
        searchText: [
          doc.titulo,
          doc.tipo,
          doc.nomeExame,
          doc.tipoExame,
          doc.resumo,
          doc.diagnostico,
        ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR'),
      };
    });
  }, [activeDocs]);

  // Filtering
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLocaleLowerCase('pt-BR');
        if (!item.searchText.includes(q)) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all') {
        if (item.tipoKey !== selectedCategory) return false;
      }

      // Status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'revisar' && !item.revisaoPendente && item.status !== 'revisar') return false;
        if (selectedStatus === 'pronto' && item.status !== 'pronto') return false;
        if (selectedStatus === 'processing' && item.status !== 'processing' && item.status !== 'pending') return false;
      }

      if (selectedPeriod !== 'all' && item.createdAt) {
        const createdAt = new Date(item.createdAt);
        const now = new Date();
        if (selectedPeriod === '30days') {
          const cutoff = new Date();
          cutoff.setDate(now.getDate() - 30);
          if (createdAt < cutoff || createdAt > now) return false;
        } else if (selectedPeriod === 'thisyear' && createdAt.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (selectedPeriod !== 'all') {
        return false;
      }

      return true;
    });
  }, [allItems, search, selectedCategory, selectedStatus, selectedPeriod]);

  // Counts by category
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allItems.length };
    DOCUMENT_TYPES.forEach(({ id }) => { c[id] = 0; });
    allItems.forEach((i) => {
      c[i.tipoKey]++;
    });
    return c;
  }, [allItems]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: { [month: string]: typeof filteredItems } = {};
    filteredItems.forEach((doc) => {
      if (!groups[doc.monthGroup]) {
        groups[doc.monthGroup] = [];
      }
      groups[doc.monthGroup].push(doc);
    });
    return groups;
  }, [filteredItems]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este documento?')) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: 'Documento excluído com sucesso' });
      refetch();
    } catch {
      toast({ title: 'Erro ao excluir documento', variant: 'destructive' });
    }
  };

  const handleRetry = async (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setRetryingId(id);
    try {
      await customFetch(`/api/documents/${id}/retry`, { method: 'POST' });
      toast({ title: 'Documento recolocado na fila de processamento.' });
      await refetch();
    } catch (error) {
      toast({ title: getApiErrorMessage(error, 'Não foi possível tentar novamente.'), variant: 'destructive' });
    } finally {
      setRetryingId(null);
    }
  };

  const renderBadge = (doc: { status: string; revisaoPendente: boolean }) => {
    if (doc.status === 'processing' || doc.status === 'pending') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full bg-[#e5eefb] text-[#1b3a60] text-xs font-bold whitespace-nowrap">
          Processando
        </span>
      );
    }
    if (doc.status === 'failed') {
      return <span className="inline-block whitespace-nowrap rounded-full bg-[#fde8e6] px-2.5 py-1 text-xs font-bold text-[#a13a30]">Falhou</span>;
    }
    if (doc.revisaoPendente || doc.status === 'revisar') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full bg-[#fdf3d8] text-[#6b4208] text-xs font-bold whitespace-nowrap">
          Revisar
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-1 rounded-full bg-[#e5eefb] text-[#1b3a60] text-xs font-bold whitespace-nowrap">
        Pronto
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1f7fe0]">
              Seu acervo
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Documentos
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              Receitas, exames e laudos reunidos e pesquisáveis.
            </p>
          </div>

          <button
            onClick={() => triggerUploadModal()}
            className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1b3a60] text-white hover:bg-[#24507f] transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            Adicionar documento
          </button>
        </div>

        {/* Filter bar: Search + Selects + Layout toggle */}
        <div className="flex gap-3 flex-wrap items-center mb-4.5">
          {/* Search Input */}
          <div className="h-[46px] flex-1 min-w-[280px] sm:w-[420px] border border-[#c6cfdb] rounded-xl bg-white flex items-center gap-2 px-3.5 text-sm text-[#5a6a80] focus-within:border-[#1b3a60] focus-within:ring-1 focus-within:ring-[#1b3a60] transition-all">
            <Search size={18} className="text-[#5a6a80] shrink-0" />
            <input
              type="text"
              placeholder="Buscar por título, tipo ou conteúdo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[#1d2a3d] placeholder:text-[#5a6a80] text-sm"
            />
          </div>

          {/* Status Select */}
          <div className="h-[46px] w-[160px] border border-[#c6cfdb] rounded-xl bg-white flex items-center px-3.5 text-sm text-[#5a6a80]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-[#5a6a80] cursor-pointer"
            >
              <option value="all">Status: todos</option>
              <option value="pronto">Status: pronto</option>
              <option value="revisar">Status: revisar</option>
              <option value="processing">Status: processando</option>
            </select>
          </div>

          {/* Period Select */}
          <div className="h-[46px] w-[180px] border border-[#c6cfdb] rounded-xl bg-white flex items-center px-3.5 text-sm text-[#5a6a80]">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-[#5a6a80] cursor-pointer"
            >
              <option value="all">Período: todos</option>
              <option value="30days">Período: 30 dias</option>
              <option value="thisyear">Período: este ano</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#1b3a60] text-white shadow-xs'
                  : 'bg-white text-[#5a6a80] border border-[#c6cfdb] hover:bg-slate-50'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#1b3a60] text-white shadow-xs'
                  : 'bg-white text-[#5a6a80] border border-[#c6cfdb] hover:bg-slate-50'
              }`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2.5 flex-wrap mb-7">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1b3a60] text-white border border-[#1b3a60]'
                : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
            }`}
          >
            Todos {counts.all}
          </button>
          {DOCUMENT_TYPES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedCategory(id)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${selectedCategory === id ? 'bg-[#1b3a60] text-white border border-[#1b3a60]' : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'}`}
            >
              {label} {counts[id]}
            </button>
          ))}
        </div>

        {/* Grouped Month Sections */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#dde3ec] text-[#5a6a80]">
            <LoaderCircle size={24} className="mx-auto animate-spin mb-3" />
            Carregando documentos…
          </div>
        ) : isError ? (
          <div role="alert" className="bg-white rounded-2xl p-12 text-center border border-[#f0b8b2] text-[#a13a30]">
            Não foi possível carregar seus documentos. Tente novamente mais tarde.
          </div>
        ) : Object.keys(groupedByMonth).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#dde3ec]">
            <FileText size={40} className="mx-auto text-[#5a6a80] opacity-40 mb-3" />
            <h3 className="text-lg font-bold text-[#1b3a60]">
              {activeDocs.length === 0 ? 'Você ainda não tem documentos' : 'Nenhum documento encontrado'}
            </h3>
            <p className="text-sm text-[#5a6a80] mt-1">
              {activeDocs.length === 0
                ? 'Adicione um documento para começar seu acervo.'
                : 'Tente ajustar a busca ou os filtros acima.'}
            </p>
          </div>
        ) : (
          Object.entries(groupedByMonth).map(([month, docs]) => (
            <div key={month} className="mb-8">
              <div className="text-sm font-bold text-[#5a6a80] tracking-[0.06em] uppercase mb-3.5">
                {month}
              </div>

              {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-[#dde3ec] rounded-[20px] p-3.5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] hover:shadow-md transition-shadow group flex flex-col justify-between"
                    >
                      <Link href={`/documentos/${doc.id}`} className="block">
                        <DocumentThumbnail src={doc.previewUrl} title={doc.titulo} />

                        {/* Title & Date */}
                        <div className="mt-3.5 text-[15px] font-bold text-[#1d2a3d] truncate">
                          {doc.titulo}
                        </div>
                        <div className="text-[13px] text-[#5a6a80] mt-0.5 mb-3">
                          {doc.dateStr}
                        </div>
                      </Link>

                      {/* Footer tags & delete */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-50">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#e5eefb] text-[#1f7fe0] text-xs font-bold whitespace-nowrap">
                            {doc.tipo}
                          </span>
                          {renderBadge(doc)}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md text-[#5a6a80] hover:bg-slate-100 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/documentos/${doc.id}`} className="flex items-center gap-2 cursor-pointer">
                                <ExternalLink size={14} /> Abrir detalhes
                              </Link>
                            </DropdownMenuItem>
                            {doc.status === 'failed' && (
                              <DropdownMenuItem
                                disabled={retryingId === doc.id}
                                onClick={(event) => handleRetry(doc.id, event)}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <RotateCw size={14} /> Tentar novamente
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(doc.id, e)}
                              className="text-red-600 focus:text-red-600 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={14} /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="bg-white border border-[#dde3ec] rounded-[20px] divide-y divide-[#dde3ec] overflow-hidden shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                        {doc.tipo === 'Receita' ? (
                          <Pill size={20} className="text-[#1b3a60]" />
                        ) : (
                          <FileText size={20} className="text-[#1b3a60]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/documentos/${doc.id}`} className="block">
                          <div className="text-[15px] font-bold text-[#1d2a3d] hover:text-[#1b3a60] truncate">
                            {doc.titulo}
                          </div>
                          <div className="text-xs text-[#5a6a80] mt-0.5">
                            {doc.dateStr}
                          </div>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status === 'failed' && (
                          <button
                            type="button"
                            onClick={(event) => handleRetry(doc.id, event)}
                            disabled={retryingId === doc.id}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#f0b8b2] px-3 text-xs font-bold text-[#a13a30] hover:bg-[#fff5f4] disabled:opacity-50"
                          >
                            <RotateCw size={14} /> Tentar novamente
                          </button>
                        )}
                        <span className="inline-block px-2.5 py-1 rounded-full bg-[#e5eefb] text-[#1f7fe0] text-xs font-bold whitespace-nowrap">
                          {doc.tipo}
                        </span>
                        {renderBadge(doc)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/documentos/${doc.id}`}
                          className="p-2 text-[#5a6a80] hover:text-[#1b3a60] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Seus documentos são carregados com segurança da sua conta.
        </p>
      </main>
    </div>
  );
}
