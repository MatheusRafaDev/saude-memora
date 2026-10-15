import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Search,
  Plus,
  UploadCloud,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileSearch,
  FileHeart,
  Syringe,
  Send,
  FileBarChart,
  Layers,
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { id: 'receita', label: 'Receitas', icon: Pill },
  { id: 'exame', label: 'Exames', icon: Activity },
  { id: 'laudo', label: 'Laudos', icon: FileSearch },
  { id: 'atestado', label: 'Atestados', icon: FileHeart },
  { id: 'vacina', label: 'Vacinas', icon: Syringe },
  { id: 'encaminhamento', label: 'Encaminhamentos', icon: Send },
  { id: 'relatorio', label: 'Relatórios', icon: FileBarChart },
  { id: 'outro', label: 'Outros', icon: FileText },
];

const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  DOCUMENT_TYPES.map(({ id, label }) => [id, label.replace(/s$/, '')]),
) as Record<string, string>;

function getDocumentTypeIcon(type: string) {
  const normalized = type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('receit')) return Pill;
  if (normalized.includes('exam')) return Activity;
  if (normalized.includes('atest')) return FileHeart;
  if (normalized.includes('vacin')) return Syringe;
  if (normalized.includes('encaminh')) return Send;
  if (normalized.includes('relat')) return FileBarChart;
  return FileText;
}

function DocumentTypeBadge({ type }: { type: string }) {
  const Icon = getDocumentTypeIcon(type);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5eefb] px-2.5 py-1 text-xs font-bold text-[#1f7fe0] whitespace-nowrap">
      <Icon size={13} aria-hidden="true" />
      {type}
    </span>
  );
}

function DocumentThumbnail({
  src,
  title,
  type,
  compact = false,
}: {
  src?: string;
  title: string;
  type: string;
  compact?: boolean;
}) {
  const [hasLoadError, setHasLoadError] = useState(false);
  useEffect(() => setHasLoadError(false), [src]);
  const TypeIcon = getDocumentTypeIcon(type);

  return (
    <div className={`group relative flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[#e5eaf1] bg-gradient-to-br from-[#f7f9fc] to-[#eaf0f7] transition-colors hover:from-[#f1f6fc] hover:to-[#e1ebf8] ${compact ? 'h-16 w-16 sm:h-[72px] sm:w-[72px]' : 'h-[150px] w-full'}`}>
      {src && !hasLoadError ? (
        <img src={src} alt={`Prévia de ${title}`} loading="lazy" onError={() => setHasLoadError(true)} className="h-full w-full object-cover" />
      ) : (
        <div className={`flex flex-col items-center justify-center gap-1.5 text-[#1b3a60] ${compact ? '' : 'px-4'}`}>
          <span className={`flex items-center justify-center rounded-xl bg-white/90 shadow-sm ${compact ? 'h-8 w-8' : 'h-14 w-14 rounded-2xl'}`}>
            <TypeIcon size={compact ? 17 : 25} strokeWidth={1.8} />
          </span>
          <span className={`font-semibold text-[#718096] ${compact ? 'text-[9px]' : 'text-[11px]'}`}>Sem imagem</span>
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
        dataDocumento: typeof doc.data === 'string' ? doc.data : '',
        medico: typeof doc.medico === 'string' ? doc.medico : '',
        clinica: typeof doc.clinica === 'string' ? doc.clinica : '',
        resumo: typeof doc.resumo === 'string' ? doc.resumo : '',
        diagnostico: typeof doc.diagnostico === 'string' ? doc.diagnostico : '',
        nomeExame: typeof doc.nomeExame === 'string' ? doc.nomeExame : '',
        tipoExame: typeof doc.tipoExame === 'string' ? doc.tipoExame : '',
        medicamentos: Array.isArray(doc.medicamentos) ? doc.medicamentos : [],
        exames: Array.isArray(doc.resultadosExame) ? doc.resultadosExame : [],
        quantidadeAlertas: Array.isArray(doc.alertas) ? doc.alertas.filter((alerta: any) => alerta.dispensado !== true).length : 0,
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
          doc.medico,
          doc.clinica,
          doc.cid,
          doc.cnes,
          ...(Array.isArray(doc.medicamentos) ? doc.medicamentos.flatMap((medicamento: any) => [medicamento.nome, medicamento.dosagem]) : []),
          ...(Array.isArray(doc.resultadosExame) ? doc.resultadosExame.map((exame: any) => exame.nome) : []),
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
        if (selectedStatus === 'failed' && item.status !== 'failed') return false;
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

        </div>

        <section aria-label="Filtros de documentos" className="mb-7 rounded-2xl border border-[#dde3ec] bg-white p-3 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#c6cfdb] bg-[#fbfcfe] px-3.5 text-sm text-[#5a6a80] transition-colors focus-within:border-[#1b3a60] focus-within:ring-1 focus-within:ring-[#1b3a60]">
              <Search size={18} className="shrink-0" />
              <input
                type="search"
                aria-label="Buscar documentos"
                placeholder="Buscar por título, tipo ou conteúdo"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full min-w-0 bg-transparent text-sm text-[#1d2a3d] outline-none placeholder:text-[#7b8798]"
              />
            </label>

            <div className="flex h-11 shrink-0 items-center justify-between rounded-xl border border-[#dde3ec] bg-[#f7f9fc] p-1 sm:justify-start">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Visualizar em grade"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors sm:flex-none ${viewMode === 'grid' ? 'bg-white text-[#1b3a60] shadow-sm' : 'text-[#5a6a80] hover:text-[#1b3a60]'}`}
              >
                <LayoutGrid size={16} /> <span>Grade</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Visualizar em lista"
                aria-pressed={viewMode === 'list'}
                className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition-colors sm:flex-none ${viewMode === 'list' ? 'bg-white text-[#1b3a60] shadow-sm' : 'text-[#5a6a80] hover:text-[#1b3a60]'}`}
              >
                <List size={16} /> <span>Lista</span>
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold text-[#52627a]">Tipo</span>
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="h-11 w-full rounded-xl border border-[#c6cfdb] bg-white px-3 text-sm text-[#1d2a3d] outline-none focus:border-[#1b3a60] focus:ring-1 focus:ring-[#1b3a60]">
                <option value="all">Todos os tipos ({counts.all})</option>
                {DOCUMENT_TYPES.map(({ id, label }) => <option key={id} value={id}>{label} ({counts[id]})</option>)}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold text-[#52627a]">Status</span>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="h-11 w-full rounded-xl border border-[#c6cfdb] bg-white px-3 text-sm text-[#1d2a3d] outline-none focus:border-[#1b3a60] focus:ring-1 focus:ring-[#1b3a60]">
                <option value="all">Todos os status</option>
                <option value="pronto">Pronto</option>
                <option value="revisar">Revisar</option>
                <option value="processing">Processando</option>
                <option value="failed">Falhou</option>
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold text-[#52627a]">Período</span>
              <select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)} className="h-11 w-full rounded-xl border border-[#c6cfdb] bg-white px-3 text-sm text-[#1d2a3d] outline-none focus:border-[#1b3a60] focus:ring-1 focus:ring-[#1b3a60]">
                <option value="all">Qualquer período</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="thisyear">Este ano</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f5] pt-3 text-xs text-[#718096]">
            <span>{filteredItems.length} {filteredItems.length === 1 ? 'documento encontrado' : 'documentos encontrados'}</span>
            {(search || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedPeriod !== 'all') && (
              <button type="button" onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedStatus('all'); setSelectedPeriod('all'); }} className="min-h-9 rounded-lg px-3 font-bold text-[#1f7fe0] hover:bg-[#f1f6fc]">
                Limpar filtros
              </button>
            )}
          </div>
        </section>

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
                        <DocumentThumbnail src={doc.previewUrl} title={doc.titulo} type={doc.tipo} />

                        {/* Title & Date */}
                        <div className="mt-3.5 text-[15px] font-bold text-[#1d2a3d] truncate">
                          {doc.titulo}
                        </div>
                        <div className="text-[13px] text-[#5a6a80] mt-0.5">Adicionado {doc.dateStr}</div>
                      </Link>

                      <div className="my-3 space-y-2 text-xs text-[#52627a]">
                        {(doc.dataDocumento || doc.medico || doc.clinica) && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {doc.dataDocumento && <span><b className="text-[#34445b]">Data:</b> {doc.dataDocumento}</span>}
                            {doc.medico && <span><b className="text-[#34445b]">Profissional:</b> {doc.medico}</span>}
                          </div>
                        )}
                        {doc.clinica && <div className="truncate"><b className="text-[#34445b]">Local:</b> {doc.clinica}</div>}
                        {(doc.resumo || doc.diagnostico) && (
                          <p className="m-0 line-clamp-2 leading-relaxed">{doc.resumo || doc.diagnostico}</p>
                        )}
                        {(doc.nomeExame || doc.tipoExame || doc.exames.length > 0) && (
                          <div className="flex items-start gap-1.5"><Activity size={14} className="mt-0.5 shrink-0 text-[#1f7fe0]" /><span className="line-clamp-1">{doc.nomeExame || doc.exames.map((exame: any) => exame.nome).filter(Boolean).join(', ') || doc.tipoExame}</span></div>
                        )}
                        {doc.medicamentos.length > 0 && (
                          <div className="flex items-start gap-1.5"><Pill size={14} className="mt-0.5 shrink-0 text-[#1b3a60]" /><span className="line-clamp-1">{doc.medicamentos.map((medicamento: any) => medicamento.nome).filter(Boolean).join(', ')}</span></div>
                        )}
                        {doc.quantidadeAlertas > 0 && <div className="flex items-center gap-1.5 text-amber-800"><AlertTriangle size={14} />{doc.quantidadeAlertas} {doc.quantidadeAlertas === 1 ? 'alerta ativo' : 'alertas ativos'}</div>}
                      </div>

                      {/* Footer tags & delete */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-50">
                        <div className="flex gap-1.5 flex-wrap">
                          <DocumentTypeBadge type={doc.tipo} />
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
                      className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3 p-3 transition-colors hover:bg-slate-50/70 sm:grid-cols-[72px_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4 sm:p-4"
                    >
                      <Link href={`/documentos/${doc.id}`} aria-label={`Abrir ${doc.titulo}`} className="group block">
                        <DocumentThumbnail src={doc.previewUrl} title={doc.titulo} type={doc.tipo} compact />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/documentos/${doc.id}`} className="block">
                          <div className="text-[15px] font-bold text-[#1d2a3d] hover:text-[#1b3a60] truncate">
                            {doc.titulo}
                          </div>
                          <div className="text-xs text-[#5a6a80] mt-0.5">
                            Adicionado {doc.dateStr}{doc.dataDocumento ? ` · Documento: ${doc.dataDocumento}` : ''}
                          </div>
                          {(doc.resumo || doc.diagnostico || doc.medico || doc.clinica || doc.medicamentos.length > 0 || doc.exames.length > 0) && (
                            <div className="mt-1.5 space-y-0.5 text-xs text-[#52627a]">
                              {(doc.medico || doc.clinica) && <div className="truncate">{[doc.medico, doc.clinica].filter(Boolean).join(' · ')}</div>}
                              {(doc.resumo || doc.diagnostico) && <div className="line-clamp-1">{doc.resumo || doc.diagnostico}</div>}
                              {doc.medicamentos.length > 0 && <div className="line-clamp-1">Medicamentos: {doc.medicamentos.map((medicamento: any) => medicamento.nome).filter(Boolean).join(', ')}</div>}
                              {doc.exames.length > 0 && <div className="line-clamp-1">Exames: {doc.exames.map((exame: any) => exame.nome).filter(Boolean).join(', ')}</div>}
                            </div>
                          )}
                        </Link>
                      </div>

                      <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[#edf0f5] pt-2 sm:col-span-1 sm:justify-end sm:border-0 sm:pt-0">
                        {doc.quantidadeAlertas > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800"><AlertTriangle size={14} />{doc.quantidadeAlertas}</span>}
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
                        <DocumentTypeBadge type={doc.tipo} />
                        {renderBadge(doc)}
                      </div>

                      <div className="hidden items-center gap-2 sm:flex">
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
