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
} from 'lucide-react';
import {
  useGetApiDocuments,
  useDeleteApiDocumentsId,
  customFetch,
} from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Sample fallback documents matching the design board
const SAMPLE_DOCS = [
  {
    id: 'sample-1',
    titulo: 'Receita · Dr. Silva',
    tipo: 'Receita',
    status: 'pronto',
    revisaoPendente: false,
    dateStr: '12 set',
    monthGroup: 'Setembro 2026',
    createdAt: new Date('2026-09-12').toISOString(),
  },
  {
    id: 'sample-2',
    titulo: 'Hemograma completo',
    tipo: 'Exame',
    status: 'revisar',
    revisaoPendente: true,
    dateStr: '10 set',
    monthGroup: 'Setembro 2026',
    createdAt: new Date('2026-09-10').toISOString(),
  },
  {
    id: 'sample-3',
    titulo: 'Laudo de imagem',
    tipo: 'Laudo',
    status: 'processing',
    revisaoPendente: false,
    dateStr: '09 set',
    monthGroup: 'Setembro 2026',
    createdAt: new Date('2026-09-09').toISOString(),
  },
  {
    id: 'sample-4',
    titulo: 'Glicemia de jejum',
    tipo: 'Exame',
    status: 'pronto',
    revisaoPendente: false,
    dateStr: '02 set',
    monthGroup: 'Setembro 2026',
    createdAt: new Date('2026-09-02').toISOString(),
  },
  {
    id: 'sample-5',
    titulo: 'Atestado médico',
    tipo: 'Atestado',
    status: 'pronto',
    revisaoPendente: false,
    dateStr: '28 ago',
    monthGroup: 'Agosto 2026',
    createdAt: new Date('2026-08-28').toISOString(),
  },
  {
    id: 'sample-6',
    titulo: 'Receita · Dra. Lima',
    tipo: 'Receita',
    status: 'pronto',
    revisaoPendente: false,
    dateStr: '21 ago',
    monthGroup: 'Agosto 2026',
    createdAt: new Date('2026-08-21').toISOString(),
  },
  {
    id: 'sample-7',
    titulo: 'Colesterol total',
    tipo: 'Exame',
    status: 'pronto',
    revisaoPendente: false,
    dateStr: '15 ago',
    monthGroup: 'Agosto 2026',
    createdAt: new Date('2026-08-15').toISOString(),
  },
  {
    id: 'sample-8',
    titulo: 'Ultrassom',
    tipo: 'Laudo',
    status: 'pronto',
    revisaoPendente: false,
    dateStr: '04 ago',
    monthGroup: 'Agosto 2026',
    createdAt: new Date('2026-08-04').toISOString(),
  },
];

export default function Documents() {
  const { toast } = useToast();
  const { data: documentsRaw, refetch } = useGetApiDocuments();
  const deleteMutation = useDeleteApiDocumentsId();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Listen to document-uploaded event
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('document-uploaded', handler);
    return () => window.removeEventListener('document-uploaded', handler);
  }, [refetch]);

  const rawDocs = (documentsRaw as unknown as any[]) || [];
  const activeDocs = rawDocs.filter((d: any) => !deletedIds.has(d.id));

  // Determine whether to use real docs or fallback docs
  const hasRealDocs = activeDocs.length > 0;

  const allItems = useMemo(() => {
    if (hasRealDocs) {
      return activeDocs.map((doc: any) => {
        const d = doc.createdAt ? new Date(doc.createdAt) : new Date();
        const monthGroup = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
        
        let normalizedType = 'Outro';
        const t = (doc.tipo || '').toLowerCase();
        if (t.includes('receita')) normalizedType = 'Receita';
        else if (t.includes('exame')) normalizedType = 'Exame';
        else if (t.includes('laudo')) normalizedType = 'Laudo';
        else if (t.includes('atestado')) normalizedType = 'Atestado';

        return {
          id: doc.id,
          titulo: doc.titulo || `${normalizedType} ${dateStr}`,
          tipo: normalizedType,
          status: doc.status || 'pronto',
          revisaoPendente: Boolean(doc.revisaoPendente),
          dateStr,
          monthGroup: monthGroup.charAt(0).toUpperCase() + monthGroup.slice(1),
          createdAt: doc.createdAt,
        };
      });
    }
    return SAMPLE_DOCS;
  }, [hasRealDocs, activeDocs]);

  // Filtering
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!item.titulo.toLowerCase().includes(q) && !item.tipo.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all') {
        if (item.tipo.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'revisar' && !item.revisaoPendente) return false;
        if (selectedStatus === 'pronto' && item.status !== 'pronto') return false;
        if (selectedStatus === 'processing' && item.status !== 'processing' && item.status !== 'pending') return false;
      }

      return true;
    });
  }, [allItems, search, selectedCategory, selectedStatus]);

  // Counts by category
  const counts = useMemo(() => {
    const c = { all: allItems.length, receita: 0, exame: 0, laudo: 0, atestado: 0 };
    allItems.forEach((i) => {
      const t = i.tipo.toLowerCase();
      if (t === 'receita') c.receita++;
      else if (t === 'exame') c.exame++;
      else if (t === 'laudo') c.laudo++;
      else if (t === 'atestado') c.atestado++;
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

    if (id.startsWith('sample-')) {
      setDeletedIds((prev) => new Set([...prev, id]));
      toast({ title: 'Documento excluído' });
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      setDeletedIds((prev) => new Set([...prev, id]));
      toast({ title: 'Documento excluído com sucesso' });
      refetch();
    } catch {
      toast({ title: 'Erro ao excluir documento', variant: 'destructive' });
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
    if (doc.revisaoPendente || doc.status === 'revisar') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-full bg-[#fdf3d8] text-[#6b4208] text-xs font-bold whitespace-nowrap">
          Revisar
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-1 rounded-full bg-[#e6f4ec] text-[#1f7a4d] text-xs font-bold whitespace-nowrap">
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
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#2f7a70]">
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
              placeholder="Buscar por título ou conteúdo"
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
              <option value="all">Período: 6 meses</option>
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
          <button
            onClick={() => setSelectedCategory('receita')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'receita'
                ? 'bg-[#1b3a60] text-white border border-[#1b3a60]'
                : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
            }`}
          >
            Receitas {counts.receita}
          </button>
          <button
            onClick={() => setSelectedCategory('exame')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'exame'
                ? 'bg-[#1b3a60] text-white border border-[#1b3a60]'
                : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
            }`}
          >
            Exames {counts.exame}
          </button>
          <button
            onClick={() => setSelectedCategory('laudo')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'laudo'
                ? 'bg-[#1b3a60] text-white border border-[#1b3a60]'
                : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
            }`}
          >
            Laudos {counts.laudo}
          </button>
          <button
            onClick={() => setSelectedCategory('atestado')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'atestado'
                ? 'bg-[#1b3a60] text-white border border-[#1b3a60]'
                : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
            }`}
          >
            Atestados {counts.atestado}
          </button>
        </div>

        {/* Grouped Month Sections */}
        {Object.keys(groupedByMonth).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#dde3ec]">
            <FileText size={40} className="mx-auto text-[#5a6a80] opacity-40 mb-3" />
            <h3 className="text-lg font-bold text-[#1b3a60]">Nenhum documento encontrado</h3>
            <p className="text-sm text-[#5a6a80] mt-1">Tente ajustar a busca ou os filtros acima.</p>
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
                        {/* Mini document sheet illustration */}
                        <div className="bg-[#f1f4f8] rounded-[14px] h-[150px] flex items-center justify-center relative overflow-hidden group-hover:bg-[#eaf0f7] transition-colors">
                          <div className="w-[86px] h-[112px] rounded-lg bg-white border border-[#dde3ec] p-2.5 shadow-xs flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[90%]" />
                              <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[65%]" />
                              <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[85%]" />
                              <div className="h-[5px] rounded-[3px] bg-[#d5dce8] w-[55%]" />
                            </div>
                            <div className="h-[5px] rounded-[3px] bg-[#2f7a70]/40 w-[75%]" />
                          </div>
                        </div>

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
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold whitespace-nowrap">
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
                        <span className="inline-block px-2.5 py-1 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold whitespace-nowrap">
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
          Tela de acervo de documentos com dados de exemplo e suporte a filtros.
        </p>
      </main>
    </div>
  );
}
