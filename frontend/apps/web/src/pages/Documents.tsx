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
  AlertTriangle,
  LoaderCircle,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronRight,
  RotateCw,
  FileSearch,
  FileHeart,
  Syringe,
  Send,
  FileBarChart,
  Layers,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  CalendarDays,
  UserCheck,
  Building2,
  Eye,
  Sparkles,
  Stethoscope,
  Tag,
  X,
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

const PERIOD_OPTIONS = [
  { id: 'all', label: 'Qualquer período', icon: Calendar },
  { id: '30days', label: 'Últimos 30 dias', icon: Clock },
  { id: 'thisyear', label: 'Este ano', icon: CalendarDays },
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

function getCidCode(cid: string): string {
  return cid.match(/[A-TV-Z][0-9]{2}(?:\.[0-9]{1,2})?/i)?.[0]?.toUpperCase() ?? '';
}

function getCategoryTheme(type: string) {
  const normalized = type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('receit')) {
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', iconColor: 'text-blue-600' };
  }
  if (normalized.includes('exam')) {
    return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', iconColor: 'text-indigo-600' };
  }
  if (normalized.includes('atest')) {
    return { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', iconColor: 'text-amber-600' };
  }
  if (normalized.includes('vacin')) {
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', iconColor: 'text-emerald-600' };
  }
  if (normalized.includes('laud')) {
    return { bg: 'bg-purple-50 text-purple-700 border-purple-200/60', iconColor: 'text-purple-600' };
  }
  if (normalized.includes('encaminh')) {
    return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200/60', iconColor: 'text-cyan-600' };
  }
  return { bg: 'bg-[#F4F7FC] text-[#14211F] border-[#E3E8F0]', iconColor: 'text-[#1D4ED8]' };
}

function DocumentTypeBadge({ type }: { type: string }) {
  const Icon = getDocumentTypeIcon(type);
  const theme = getCategoryTheme(type);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${theme.bg}`}>
      <Icon size={12} className={theme.iconColor} aria-hidden="true" />
      <span>{type}</span>
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
    <div className={`group relative flex shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-[#E3E8F0] bg-[#F4F7FC] transition-colors hover:border-[#CFE0FF] ${compact ? 'h-16 w-16 sm:h-[72px] sm:w-[72px]' : 'h-[160px] w-full'}`}>
      {src && !hasLoadError ? (
        <img
          src={src}
          alt={`Prévia de ${title}`}
          loading="lazy"
          decoding="async"
          onError={() => setHasLoadError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className={`flex flex-col items-center justify-center gap-1.5 text-[#14211F] ${compact ? '' : 'px-4'}`}>
          <span className={`flex items-center justify-center rounded-xl bg-white shadow-xs ${compact ? 'h-8 w-8' : 'h-14 w-14 rounded-2xl'}`}>
            <TypeIcon size={compact ? 17 : 25} strokeWidth={1.8} className="text-[#1D4ED8]" />
          </span>
          <span className={`font-medium text-[#5B6878] ${compact ? 'text-[9px]' : 'text-[11px]'}`}>Documento digital</span>
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
  const [originalPreview, setOriginalPreview] = useState<{ url: string; title: string } | null>(null);
  const [documentPendingDeletion, setDocumentPendingDeletion] = useState<{ id: string; title: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tipo = params.get('tipo')?.toLowerCase();
      if (tipo && (DOCUMENT_TYPE_LABELS[tipo] || tipo === 'all')) {
        return tipo;
      }
      try {
        const saved = sessionStorage.getItem('docs-selected-category');
        if (saved && (DOCUMENT_TYPE_LABELS[saved] || saved === 'all')) {
          return saved;
        }
      } catch {
        // sessionStorage indisponível
      }
    }
    return 'all';
  });

  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    try {
      const saved = sessionStorage.getItem('docs-selected-period');
      if (saved && PERIOD_OPTIONS.some((p) => p.id === saved)) {
        return saved;
      }
    } catch {
      // sessionStorage indisponível
    }
    return 'all';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Recupera preferência salva na sessão para manter entre navegações
    try {
      const saved = sessionStorage.getItem('docs-view-mode');
      if (saved === 'list' || saved === 'grid') return saved;
    } catch {
      // sessionStorage indisponível (ex: modo privado restrito)
    }
    return 'grid';
  });
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cidSummaries, setCidSummaries] = useState<Record<string, string>>({});

  // Persiste preferência de visualização na sessionStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      sessionStorage.setItem('docs-view-mode', mode);
    } catch {
      // Ignora erros de storage
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    try {
      sessionStorage.setItem('docs-selected-category', cat);
    } catch {
      // Ignora erros de storage
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    try {
      sessionStorage.setItem('docs-selected-period', period);
    } catch {
      // Ignora erros de storage
    }
  };

  // Listen to document-uploaded event
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('document-uploaded', handler);
    return () => window.removeEventListener('document-uploaded', handler);
  }, [refetch]);

  const activeDocs = (documentsRaw as unknown as any[]) || [];

  // Se houver algum documento ainda em processamento ou pendente na lista, faz polling a cada 2s
  const hasProcessingDocs = useMemo(() => {
    return activeDocs.some((d: any) => d.status === 'processing' || d.status === 'pending');
  }, [activeDocs]);

  useEffect(() => {
    if (!hasProcessingDocs) return;
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    return () => clearInterval(interval);
  }, [hasProcessingDocs, refetch]);

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

      const parsedMedicamentos = Array.isArray(doc.medicamentos)
        ? doc.medicamentos.map((m: any) => {
            if (typeof m === 'string') {
              return { nome: m.trim(), dosagem: '', horario: '', instrucoes: '' };
            }
            return {
              nome: typeof m?.nome === 'string' ? m.nome.trim() : '',
              dosagem: typeof m?.dosagem === 'string' ? m.dosagem.trim() : '',
              horario: typeof m?.horario === 'string' ? m.horario.trim() : (typeof m?.posologia === 'string' ? m.posologia.trim() : ''),
              instrucoes: typeof m?.instrucoes === 'string' ? m.instrucoes.trim() : '',
            };
          }).filter((m: any) => m.nome.length > 0)
        : [];

      const cnes = typeof doc.cnes === 'string' ? doc.cnes.trim() : '';
      const cid = typeof doc.cid === 'string' ? doc.cid.trim() : '';
      const crm = typeof doc.crm === 'string' ? doc.crm.trim() : '';
      const medico = typeof doc.medico === 'string' ? doc.medico.trim() : '';
      const clinica = typeof doc.clinica === 'string' ? doc.clinica.trim() : '';
      const resumo = typeof doc.resumo === 'string' ? doc.resumo.trim() : '';
      const diagnostico = typeof doc.diagnostico === 'string' ? doc.diagnostico.trim() : '';
      const nomeExame = typeof doc.nomeExame === 'string' ? doc.nomeExame.trim() : '';
      const tipoExame = typeof doc.tipoExame === 'string' ? doc.tipoExame.trim() : '';

      return {
        id: doc.id,
        titulo: doc.titulo || `${normalizedType} ${dateStr}`,
        previewUrl,
        tipo: normalizedType,
        tipoKey: typeKey,
        status: doc.status || 'pronto',
        revisaoPendente: Boolean(doc.revisaoPendente),
        dataDocumento: typeof doc.data === 'string' ? doc.data : '',
        medico,
        crm,
        clinica,
        cnes,
        cid,
        resumo,
        diagnostico,
        nomeExame,
        tipoExame,
        medicamentos: parsedMedicamentos,
        exames: Array.isArray(doc.resultadosExame) ? doc.resultadosExame : [],
        quantidadeAlertas: Array.isArray(doc.alertas) ? doc.alertas.filter((alerta: any) => alerta.dispensado !== true).length : 0,
        dateStr,
        monthGroup: monthGroup.charAt(0).toUpperCase() + monthGroup.slice(1),
        createdAt: hasValidDate ? date.toISOString() : undefined,
        searchText: [
          doc.titulo,
          doc.tipo,
          nomeExame,
          tipoExame,
          resumo,
          diagnostico,
          medico,
          crm,
          clinica,
          cnes,
          cid,
          ...parsedMedicamentos.flatMap((m: any) => [m.nome, m.dosagem, m.horario, m.instrucoes]),
          ...(Array.isArray(doc.resultadosExame) ? doc.resultadosExame.map((exame: any) => exame.nome) : []),
        ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR'),
      };
    });
  }, [activeDocs]);

  useEffect(() => {
    const codes = Array.from(new Set(allItems.map((item) => getCidCode(item.cid)).filter(Boolean)));
    const pendingCodes = codes.filter((code) => !(code in cidSummaries));
    if (pendingCodes.length === 0) return;

    let cancelled = false;
    void Promise.all(pendingCodes.map(async (code) => {
      try {
        const result = await customFetch<{ registros?: Array<{ codigo?: string; descricao?: string }> }>(
          `/api/catalogo-cid10?${new URLSearchParams({ query: code, limit: '10' })}`,
        );
        const record = result.registros?.find((item) => getCidCode(item.codigo ?? '') === code);
        return [code, record?.descricao?.trim() ?? ''] as const;
      } catch {
        return [code, ''] as const;
      }
    })).then((entries) => {
      if (cancelled) return;
      setCidSummaries((current) => ({ ...current, ...Object.fromEntries(entries) }));
    });

    return () => { cancelled = true; };
  }, [allItems, cidSummaries]);

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
  }, [allItems, search, selectedCategory, selectedPeriod]);

  // Counts by category
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allItems.length };
    DOCUMENT_TYPES.forEach(({ id }) => { c[id] = 0; });
    allItems.forEach((i) => {
      c[i.tipoKey]++;
    });
    return c;
  }, [allItems]);

  // Status highlights
  const pendingReviewCount = useMemo(() => {
    return allItems.filter((i) => i.revisaoPendente || i.status === 'revisar').length;
  }, [allItems]);

  const activeCategoryInfo = useMemo(() => {
    if (selectedCategory === 'all') {
      return {
        label: 'Todos os tipos',
        count: counts.all ?? 0,
        icon: Layers,
      };
    }
    const found = DOCUMENT_TYPES.find((t) => t.id === selectedCategory);
    if (found) {
      return {
        label: found.label,
        count: counts[found.id] ?? 0,
        icon: found.icon,
      };
    }
    return {
      label: 'Outros',
      count: counts.outro ?? 0,
      icon: FileText,
    };
  }, [selectedCategory, counts]);

  const activePeriodInfo = useMemo(() => {
    return PERIOD_OPTIONS.find((p) => p.id === selectedPeriod) || PERIOD_OPTIONS[0];
  }, [selectedPeriod]);

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

  const requestDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDocumentPendingDeletion({ id, title });
  };

  const handleDelete = async () => {
    if (!documentPendingDeletion) return;
    const deletedId = documentPendingDeletion.id;
    try {
      await deleteMutation.mutateAsync({ id: deletedId });
      toast({ title: 'Documento excluído com sucesso' });
      setDocumentPendingDeletion(null);
      window.dispatchEvent(new CustomEvent('document-deleted', { detail: { id: deletedId } }));
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

  const renderBadge = (doc: { status: string; revisaoPendente: boolean; progress?: number }) => {
    if (doc.status === 'processing' || doc.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] text-[#14211F] text-xs font-semibold whitespace-nowrap">
          <LoaderCircle size={11} className="animate-spin text-[#1D4ED8]" />
          {typeof doc.progress === 'number' && doc.progress > 0
            ? `Processando (${doc.progress}%)`
            : doc.status === 'pending'
            ? 'Na fila'
            : 'Processando'}
        </span>
      );
    }
    if (doc.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          <AlertCircle size={11} />
          Falhou
        </span>
      );
    }
    if (doc.revisaoPendente || doc.status === 'revisar') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold whitespace-nowrap">
          <AlertTriangle size={11} className="text-amber-600" />
          Conferir dados
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#CFE0FF]/60 border border-[#CFE0FF] text-[#1D4ED8] text-xs font-semibold whitespace-nowrap">
        <CheckCircle2 size={11} />
        Pronto
      </span>
    );
  };

  return (
    <div className="min-h-screen min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] flex-1 bg-white text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-3.5 sm:px-8 lg:px-10 pt-5 sm:pt-9 pb-16">
        {/* Header Title & CTA Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase text-[#1D4ED8] mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
              Seu acervo médico
            </div>
            <h1 className="mt-1 mb-0 text-3xl sm:text-4xl font-bold tracking-tight text-[#14211F]">
              Documentos
            </h1>
            <p className="mt-1.5 mb-0 text-[#5B6878] text-sm sm:text-base">
              Receitas, exames laboratoriais e laudos organizados e pesquisáveis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">


            <button
              type="button"
              onClick={() => triggerUploadModal({ mode: 'single' })}
              className="btn-primary min-h-[44px] flex-1 sm:flex-none shadow-xs inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Adicionar documento</span>
            </button>
          </div>
        </div>



        {/* Pending Review Alert Banner if needed */}
        {pendingReviewCount > 0 && (
          <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle size={15} />
              </div>
              <div>
                <strong className="font-semibold block sm:inline">
                  {pendingReviewCount} {pendingReviewCount === 1 ? 'documento precisa' : 'documentos precisam'} de conferência:
                </strong>{' '}
                <span className="text-amber-800">
                  Confira os dados extraídos com o documento original.
                </span>
              </div>
            </div>
          </div>
        )}


        {/* Filter Bar with Search, View Mode, and Dropdowns */}
        <section aria-label="Filtros de documentos" className="mb-7 rounded-2xl border border-[#E3E8F0] bg-white p-3.5 shadow-xs sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] px-3.5 text-sm text-[#5B6878] transition-colors focus-within:border-[#1D4ED8] focus-within:ring-1 focus-within:ring-[#1D4ED8]">
              <Search size={18} className="shrink-0 text-[#5B6878]" />
              <input
                type="search"
                aria-label="Buscar documentos"
                placeholder="Buscar por médico, medicamento, exame, clínica ou diagnóstico..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full min-w-0 bg-transparent text-base sm:text-sm text-[#14211F] outline-none placeholder:text-[#5B6878]"
              />
            </label>

            {/* Grid / List Switcher */}
            <div className="flex h-11 shrink-0 items-center justify-between rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] p-1 sm:justify-start">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                aria-label="Visualizar em grade"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-colors sm:flex-none cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-[#5B6878] hover:text-[#14211F]'}`}
              >
                <LayoutGrid size={16} /> <span>Grade</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                aria-label="Visualizar em lista"
                aria-pressed={viewMode === 'list'}
                className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-colors sm:flex-none cursor-pointer ${viewMode === 'list' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-[#5B6878] hover:text-[#14211F]'}`}
              >
                <List size={16} /> <span>Lista</span>
              </button>
            </div>
          </div>

          {/* Deep Dropdown Selectors */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <span className="mb-1 block text-xs font-semibold text-[#5B6878]">Tipo de documento</span>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger
                  aria-label="Filtrar por tipo de documento"
                  className="h-11 w-full rounded-xl border border-[#E3E8F0] bg-white px-3 text-sm text-[#14211F] shadow-none hover:border-[#1D4ED8]/50 focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 truncate text-left">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#CFE0FF]/40 text-[#1D4ED8]">
                      <activeCategoryInfo.icon size={14} />
                    </div>
                    <span className="font-medium text-[#14211F] truncate">{activeCategoryInfo.label}</span>
                    <span className="text-xs text-[#5B6878] shrink-0 font-normal">({activeCategoryInfo.count})</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-80 rounded-2xl border border-[#E3E8F0] bg-white p-1.5 shadow-xl">
                  <SelectItem
                    value="all"
                    className="cursor-pointer rounded-xl py-2 px-2.5 text-sm transition-colors focus:bg-[#F4F7FC] focus:text-[#14211F]"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#CFE0FF]/40 text-[#1D4ED8]">
                          <Layers size={15} />
                        </div>
                        <span className="font-medium text-[#14211F] truncate">Todos os tipos</span>
                      </div>
                      <span className="text-xs text-[#5B6878] font-medium shrink-0 ml-auto mr-1">
                        ({counts.all})
                      </span>
                    </div>
                  </SelectItem>
                  {DOCUMENT_TYPES.map(({ id, label, icon: Icon }) => (
                    <SelectItem
                      key={id}
                      value={id}
                      className="cursor-pointer rounded-xl py-2 px-2.5 text-sm transition-colors focus:bg-[#F4F7FC] focus:text-[#14211F]"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#CFE0FF]/40 text-[#1D4ED8]">
                            <Icon size={15} />
                          </div>
                          <span className="font-medium text-[#14211F] truncate">{label}</span>
                        </div>
                        <span className="text-xs text-[#5B6878] font-medium shrink-0 ml-auto mr-1">
                          ({counts[id] || 0})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <span className="mb-1 block text-xs font-semibold text-[#5B6878]">Período de envio</span>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger
                  aria-label="Filtrar por período"
                  className="h-11 w-full rounded-xl border border-[#E3E8F0] bg-white px-3 text-sm text-[#14211F] shadow-none hover:border-[#1D4ED8]/50 focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 truncate text-left">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#CFE0FF]/40 text-[#1D4ED8]">
                      <activePeriodInfo.icon size={14} />
                    </div>
                    <span className="font-medium text-[#14211F] truncate">{activePeriodInfo.label}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-[#E3E8F0] bg-white p-1.5 shadow-xl">
                  {PERIOD_OPTIONS.map(({ id, label, icon: Icon }) => (
                    <SelectItem
                      key={id}
                      value={id}
                      className="cursor-pointer rounded-xl py-2 px-2.5 text-sm transition-colors focus:bg-[#F4F7FC] focus:text-[#14211F]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#CFE0FF]/40 text-[#1D4ED8]">
                          <Icon size={15} />
                        </div>
                        <span className="font-medium text-[#14211F]">{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Footer Info */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E3E8F0] pt-3 text-xs text-[#5B6878]">
            <span className="font-medium">
              {filteredItems.length} {filteredItems.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
              {filteredItems.length !== allItems.length && ` (de ${allItems.length} no total)`}
            </span>
            {(search || selectedCategory !== 'all' || selectedPeriod !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedPeriod('all');
                }}
                className="min-h-8 rounded-lg px-3 font-semibold text-[#1D4ED8] hover:bg-[#CFE0FF]/30 transition-colors cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        </section>

        {/* Documents Content */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 min-h-[360px] flex flex-col items-center justify-center text-center border border-[#E3E8F0] text-[#5B6878]">
            <LoaderCircle size={28} className="mx-auto animate-spin mb-3 text-[#1D4ED8]" />
            <p className="text-sm font-semibold text-[#14211F]">Carregando seus documentos...</p>
            <p className="text-xs text-[#5B6878] mt-1">Recuperando histórico com criptografia segura.</p>
          </div>
        ) : isError ? (
          <div role="alert" className="bg-white rounded-2xl p-12 text-center border border-[#E8664A]/30 text-[#9B2C16] bg-[#FDE1DA]/60">
            <AlertCircle size={36} className="mx-auto mb-2 text-[#E8664A]" />
            <p className="text-base font-bold">Não foi possível carregar seus documentos.</p>
            <p className="text-xs text-[#5B6878] mt-1 mb-4">Verifique sua conexão ou tente novamente.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF]"
            >
              Tentar novamente
            </button>
          </div>
        ) : Object.keys(groupedByMonth).length === 0 ? (
          /* Empty State */
          activeDocs.length === 0 ? (
            /* First time onboarding empty state */
            <>
            <div className="hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] text-white mx-auto mb-4 flex items-center justify-center shadow-md">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#14211F]">
                Seu acervo médico começa aqui
              </h3>
              <p className="text-xs sm:text-sm text-[#5B6878] mt-2 mb-6 max-w-md mx-auto leading-relaxed">
                Envie receitas médicas, exames de sangue ou imagem, laudos e atestados. Nossa IA extrai biomarcadores e dosagens com total privacidade.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <button
                  type="button"
                  onClick={() => triggerUploadModal({ mode: 'single' })}
                  className="btn-primary min-h-[44px] px-5 text-sm inline-flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Adicionar primeiro documento</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerUploadModal({ mode: 'batch' })}
                  className="min-h-[44px] px-4 rounded-xl border border-[#CFE0FF] bg-[#F4F7FC] text-[#1D4ED8] hover:bg-[#CFE0FF]/40 font-semibold text-sm inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Layers size={16} />
                  <span>Enviar vários em lote</span>
                </button>
              </div>

              {/* Supported examples pill hints */}
              <div className="pt-6 border-t border-[#E3E8F0] flex flex-wrap items-center justify-center gap-2 text-xs text-[#5B6878]">
                <span className="font-semibold text-[#14211F]">Tipos suportados:</span>
                <span className="px-2.5 py-1 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] inline-flex items-center gap-1"><Pill size={11} className="text-blue-600" /> Receitas</span>
                <span className="px-2.5 py-1 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] inline-flex items-center gap-1"><Activity size={11} className="text-indigo-600" /> Exames de sangue</span>
                <span className="px-2.5 py-1 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] inline-flex items-center gap-1"><FileSearch size={11} className="text-purple-600" /> Laudos</span>
                <span className="px-2.5 py-1 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] inline-flex items-center gap-1"><FileHeart size={11} className="text-amber-600" /> Atestados</span>
                <span className="px-2.5 py-1 rounded-full bg-[#F4F7FC] border border-[#E3E8F0] inline-flex items-center gap-1"><Syringe size={11} className="text-emerald-600" /> Vacinas</span>
              </div>
            </div>
            <div className="my-6 rounded-2xl border border-[#E3E8F0] bg-white p-12 text-center shadow-xs">
              <FileText size={36} className="mx-auto mb-3 text-[#5B6878] opacity-40" />
              <h3 className="text-lg font-bold text-[#14211F]">Você ainda não possui documentos</h3>
              <p className="mt-1 text-sm text-[#5B6878]">Seus documentos enviados aparecerão aqui.</p>
            </div>
            </>
          ) : (
            /* No search results found */
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E3E8F0] shadow-xs my-6">
              <Search size={36} className="mx-auto text-[#5B6878] opacity-40 mb-3" />
              <h3 className="text-lg font-bold text-[#14211F]">
                Nenhum documento encontrado
              </h3>
              <p className="text-xs sm:text-sm text-[#5B6878] mt-1 mb-4">
                Não encontramos resultados para os filtros ou busca aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedPeriod('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors"
              >
                Limpar filtros de busca
              </button>
            </div>
          )
        ) : (
          /* Grouped by Month Sections */
          Object.entries(groupedByMonth).map(([month, docs]) => (
            <div key={month} className="mb-8">
              {/* Month Header Banner */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs sm:text-sm font-bold text-[#5B6878] tracking-[0.06em] uppercase flex items-center gap-2">
                  <Calendar size={14} className="text-[#1D4ED8]" />
                  <span>{month}</span>
                </div>
                <span className="text-xs text-[#5B6878] font-semibold bg-[#F4F7FC] border border-[#E3E8F0] px-2.5 py-0.5 rounded-full">
                  {docs.length} {docs.length === 1 ? 'documento' : 'documentos'}
                </span>
              </div>

              {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-[#E3E8F0] hover:border-[#CFE0FF] rounded-[22px] p-4 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Type Badge, CID/CNES & Status Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <DocumentTypeBadge type={doc.tipo} />
                            {doc.cid && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/80"
                                title={`Classificação Internacional de Doenças (CID): ${doc.cid}`}
                              >
                                <Tag size={9} /> CID {doc.cid}
                              </span>
                            )}
                          </div>
                          {renderBadge(doc)}
                        </div>

                        {/* Thumbnail */}
                        <Link href={`/documentos/${doc.id}`} className="block relative group/thumb">
                          <DocumentThumbnail src={doc.previewUrl} title={doc.titulo} type={doc.tipo} />
                        </Link>

                        {/* Title & Date */}
                        <Link href={`/documentos/${doc.id}`} className="block mt-3.5 group/title">
                          <div className="text-[15px] font-bold text-[#14211F] group-hover/title:text-[#1D4ED8] transition-colors break-words">
                            {doc.titulo}
                          </div>
                          <div className="text-xs text-[#5B6878] mt-1 flex flex-wrap items-center gap-1.5">
                            <Clock size={12} className="shrink-0 text-[#5B6878]" />
                            <span>Adicionado {doc.dateStr}</span>
                            {doc.dataDocumento && (
                              <>
                                <span>•</span>
                                <span>Doc: {doc.dataDocumento}</span>
                              </>
                            )}
                          </div>
                        </Link>

                        {/* Clinical Findings & Metadata */}
                        <div className="my-3 space-y-2 text-xs text-[#5B6878]">
                          {/* Doctor & CRM */}
                          {(doc.medico || doc.crm) && (
                            <div className="flex items-start gap-1.5 text-xs text-[#14211F] font-semibold min-w-0">
                              <UserCheck size={13} className="shrink-0 text-[#1D4ED8] mt-0.5" />
                              <div className="min-w-0">
                                {doc.medico && <span className="break-words">{doc.medico}</span>}
                                {doc.crm && (
                                  <span className="shrink-0 rounded bg-[#F4F7FC] border border-[#E3E8F0] px-1.5 py-0.2 text-[10px] font-semibold text-[#5B6878] ml-1">
                                    CRM {doc.crm}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Clinic & CNES */}
                          {(doc.clinica || doc.cnes) && (
                            <div className="flex items-start gap-1.5 text-xs text-[#5B6878] min-w-0">
                              <Building2 size={13} className="shrink-0 text-[#5B6878] mt-0.5" />
                              <div className="min-w-0">
                                {doc.clinica && <span className="break-words">{doc.clinica}</span>}
                                {doc.cnes && (
                                  <span
                                    className="shrink-0 rounded bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 ml-1"
                                    title={`Código CNES do Estabelecimento: ${doc.cnes}`}
                                  >
                                    CNES {doc.cnes}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Diagnosis & CID block */}
                          {(doc.diagnostico || doc.resumo || doc.cid) && (
                            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-2.5 text-xs space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-purple-900 text-[10.5px] uppercase tracking-wider">
                                  <Stethoscope size={12} className="text-purple-600 shrink-0" />
                                  <span>Diagnóstico Clínico</span>
                                </div>
                                {doc.cid && (
                                  <span className="inline-flex items-center gap-1 rounded bg-purple-100/90 px-1.5 py-0.5 text-[10px] font-extrabold text-purple-800 border border-purple-200 shrink-0">
                                    CID {doc.cid}
                                  </span>
                                )}
                              </div>
                              <p className="m-0 text-[11px] leading-relaxed text-[#3B4252] font-medium whitespace-pre-wrap break-words">
                                {doc.diagnostico || doc.resumo || `CID-10 ${doc.cid}`}
                              </p>
                              {doc.cid && cidSummaries[getCidCode(doc.cid)] && (
                                <p className="m-0 border-t border-purple-100 pt-1.5 text-[10.5px] leading-relaxed text-purple-800">
                                  <span className="font-bold">Resumo CID-10: </span>{cidSummaries[getCidCode(doc.cid)]}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Medications with dosage and schedules */}
                          {doc.medicamentos.length > 0 && (
                            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-2.5 text-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[10.5px] uppercase tracking-wider">
                                  <Pill size={12} className="text-blue-600 shrink-0" />
                                  <span>Medicamentos ({doc.medicamentos.length})</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {doc.medicamentos.slice(0, 2).map((med: any, idx: number) => (
                                  <div key={idx} className="text-[11px] space-y-0.5">
                                    <div className="font-semibold text-[#14211F] break-words">
                                      {med.nome}
                                    </div>
                                    {(med.dosagem || med.horario) && (
                                      <div className="flex flex-wrap items-center gap-1">
                                        {med.dosagem && (
                                          <span className="px-1.5 py-0.5 rounded bg-white text-blue-700 font-bold text-[10px] border border-blue-200/80 shadow-2xs break-all">
                                            {med.dosagem}
                                          </span>
                                        )}
                                        {med.horario && (
                                          <span className="text-[10px] text-[#5B6878] break-words">
                                            {med.horario}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {doc.medicamentos.length > 2 && (
                                  <div className="text-[10px] font-medium text-blue-700 pt-0.5">
                                    +{doc.medicamentos.length - 2} outro{doc.medicamentos.length - 2 > 1 ? 's' : ''} medicamento{doc.medicamentos.length - 2 > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Exam biomarkers tags */}
                          {(doc.nomeExame || doc.tipoExame || doc.exames.length > 0) && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2.5 text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[10.5px] uppercase tracking-wider">
                                <Activity size={12} className="text-indigo-600 shrink-0" />
                                <span>Exames & Biomarcadores</span>
                              </div>
                              <div className="text-[11.5px] font-semibold text-[#14211F] break-words">
                                {doc.nomeExame || (doc.exames.length > 0 ? doc.exames.map((e: any) => e.nome).filter(Boolean).slice(0, 2).join(', ') : doc.tipoExame)}
                              </div>
                              {doc.exames.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {doc.exames.slice(0, 3).map((ex: any, idx: number) => (
                                    <span key={idx} className="px-1.5 py-0.5 rounded bg-white text-[#14211F] text-[10px] font-medium border border-indigo-200/60 shadow-2xs break-words">
                                      {ex.nome || ex.nomeNormalizado}
                                    </span>
                                  ))}
                                  {doc.exames.length > 3 && (
                                    <span className="text-[10px] text-indigo-600 self-center font-medium">+{doc.exames.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {doc.quantidadeAlertas > 0 && (
                            <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px] bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/80">
                              <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                              <span>{doc.quantidadeAlertas} {doc.quantidadeAlertas === 1 ? 'alerta ativo' : 'alertas ativos'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-[#E3E8F0] mt-1">
                        <Link
                          href={`/documentos/${doc.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:underline"
                        >
                          <span>Ver documento</span>
                          <ChevronRight size={14} />
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Opções do documento"
                              className="p-1.5 rounded-lg text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F] transition-colors cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-44 rounded-xl border border-[#E3E8F0] bg-white p-1.5 shadow-xl shadow-slate-900/10">
                            <DropdownMenuItem asChild>
                              <Link href={`/documentos/${doc.id}`} className="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#1D4ED8] transition-all hover:bg-[#1D4ED8] hover:text-white focus:bg-[#1D4ED8] focus:text-white">
                                <ExternalLink size={14} /> Abrir detalhes
                              </Link>
                            </DropdownMenuItem>
                            {doc.previewUrl && (
                              <DropdownMenuItem
                                onClick={() => setOriginalPreview({ url: doc.previewUrl!, title: doc.titulo })}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#14211F] transition-all hover:bg-[#F0F5FF] hover:text-[#1D4ED8] focus:bg-[#F0F5FF] focus:text-[#1D4ED8]"
                              >
                                <Eye size={14} /> Ver imagem original
                              </DropdownMenuItem>
                            )}
                            {doc.status === 'failed' && (
                              <DropdownMenuItem
                                disabled={retryingId === doc.id}
                                onClick={(event) => handleRetry(doc.id, event)}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#14211F] transition-all hover:bg-[#F0F5FF] hover:text-[#1D4ED8] focus:bg-[#F0F5FF] focus:text-[#1D4ED8]"
                              >
                                <RotateCw size={14} /> Tentar novamente
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => requestDelete(doc.id, doc.titulo, e)}
                              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#E8664A] transition-all hover:bg-[#FFF0ED] hover:text-[#C94E35] focus:bg-[#FFF0ED] focus:text-[#C94E35]"
                            >
                              <Trash2 size={14} /> Excluir documento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="bg-white border border-[#E3E8F0] rounded-[22px] divide-y divide-[#E3E8F0] overflow-hidden shadow-xs">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3 p-3.5 transition-colors hover:bg-[#F4F7FC]/70 sm:grid-cols-[72px_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4 sm:p-4"
                    >
                      <Link href={`/documentos/${doc.id}`} aria-label={`Abrir ${doc.titulo}`} className="group block">
                        <DocumentThumbnail src={doc.previewUrl} title={doc.titulo} type={doc.tipo} compact />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/documentos/${doc.id}`} className="block">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-bold text-[#14211F] hover:text-[#1D4ED8] transition-colors break-words">
                              {doc.titulo}
                            </span>
                            {doc.cid && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200 shrink-0"
                                title={`Código CID: ${doc.cid}`}
                              >
                                <Tag size={9} /> CID {doc.cid}
                              </span>
                            )}
                            {doc.cnes && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200 shrink-0"
                                title={`Código CNES do Estabelecimento: ${doc.cnes}`}
                              >
                                <Building2 size={9} /> CNES {doc.cnes}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#5B6878] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} className="text-[#5B6878]" />
                              <span>Adicionado {doc.dateStr}</span>
                            </span>
                            {doc.dataDocumento && (
                              <>
                                <span>•</span>
                                <span>Data do documento: {doc.dataDocumento}</span>
                              </>
                            )}
                            {(doc.medico || doc.crm) && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-[#14211F] inline-flex items-center gap-1">
                                  <UserCheck size={11} className="text-[#1D4ED8]" />
                                  {doc.medico || 'Médico'} {doc.crm && <span className="font-normal text-[#5B6878]">(CRM {doc.crm})</span>}
                                </span>
                              </>
                            )}
                            {(doc.clinica || doc.cnes) && (
                              <>
                                <span>•</span>
                                <span className="text-[#5B6878] inline-flex items-center gap-1">
                                  <Building2 size={11} />
                                  {doc.clinica && <span>{doc.clinica}</span>}
                                  {doc.cnes && <span className="text-blue-700 font-semibold">{doc.clinica ? ' ' : ''}(CNES {doc.cnes})</span>}
                                </span>
                              </>
                            )}
                          </div>
                          {(doc.resumo || doc.diagnostico || doc.medicamentos.length > 0 || doc.exames.length > 0) && (
                            <div className="mt-2 space-y-1 text-xs">
                              {(doc.diagnostico || doc.resumo) && (
                                <div className="flex items-start gap-1.5 text-[#3B4252]">
                                  <Stethoscope size={12} className="text-purple-600 mt-0.5 shrink-0" />
                                  <span className="break-words whitespace-pre-wrap">
                                    <strong className="text-purple-900 font-semibold mr-1">Diagnóstico:</strong>
                                    {doc.diagnostico || doc.resumo}
                                  </span>
                                </div>
                              )}
                              {doc.medicamentos.length > 0 && (
                                <div className="flex items-start gap-1.5 text-[#14211F]">
                                  <Pill size={12} className="text-blue-600 mt-0.5 shrink-0" />
                                  <div className="break-words">
                                    <strong className="text-blue-900 font-semibold mr-1">Medicamentos:</strong>
                                    {doc.medicamentos.map((m: any, idx: number) => (
                                      <span key={idx} className="mr-2 inline-flex items-center gap-1">
                                        <span className="font-medium">{m.nome}</span>
                                        {m.dosagem && (
                                          <span className="bg-blue-50 text-blue-700 px-1 py-0.2 rounded text-[10px] font-bold border border-blue-200">
                                            {m.dosagem}
                                          </span>
                                        )}
                                        {m.horario && <span className="text-[#5B6878] text-[11px]">({m.horario})</span>}
                                        {idx < doc.medicamentos.length - 1 ? ',' : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {doc.exames.length > 0 && (
                                <div className="flex items-start gap-1.5 text-[#14211F]">
                                  <Activity size={12} className="text-indigo-600 mt-0.5 shrink-0" />
                                  <div className="break-words">
                                    <strong className="text-indigo-900 font-semibold mr-1">Exames:</strong>
                                    {doc.exames.map((exame: any) => exame.nome || exame.nomeNormalizado).filter(Boolean).join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Link>
                      </div>

                      <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[#E3E8F0] pt-2 sm:col-span-1 sm:justify-end sm:border-0 sm:pt-0">
                        {doc.quantidadeAlertas > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertTriangle size={13} className="text-amber-600" />
                            {doc.quantidadeAlertas}
                          </span>
                        )}
                        {doc.status === 'failed' && (
                          <button
                            type="button"
                            onClick={(event) => handleRetry(doc.id, event)}
                            disabled={retryingId === doc.id}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                          >
                            <RotateCw size={13} /> Tentar novamente
                          </button>
                        )}
                        <DocumentTypeBadge type={doc.tipo} />
                        {renderBadge(doc)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/documentos/${doc.id}`}
                          aria-label={`Abrir detalhes de ${doc.titulo}`}
                          className="p-2 text-[#5B6878] hover:text-[#1D4ED8] hover:bg-[#F4F7FC] rounded-lg transition-colors"
                        >
                          <ChevronRight size={18} />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Mais ações para ${doc.titulo}`}
                              className="rounded-lg p-2 text-[#5B6878] transition-colors hover:bg-[#F4F7FC] hover:text-[#1D4ED8]"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-44 rounded-xl border border-[#E3E8F0] bg-white p-1.5 shadow-xl shadow-slate-900/10">
                            {doc.previewUrl && (
                              <DropdownMenuItem
                                onClick={() => setOriginalPreview({ url: doc.previewUrl!, title: doc.titulo })}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#14211F] transition-all hover:bg-[#F0F5FF] hover:text-[#1D4ED8]"
                              >
                                <Eye size={14} /> Ver imagem original
                              </DropdownMenuItem>
                            )}
                            {doc.status === 'failed' && (
                              <DropdownMenuItem
                                disabled={retryingId === doc.id}
                                onClick={(event) => handleRetry(doc.id, event)}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#14211F] transition-all hover:bg-[#F0F5FF] hover:text-[#1D4ED8]"
                              >
                                <RotateCw size={14} /> Tentar novamente
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(event) => requestDelete(doc.id, doc.titulo, event)}
                              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#E8664A] transition-all hover:bg-[#FFF0ED] hover:text-[#C94E35] focus:bg-[#FFF0ED] focus:text-[#C94E35]"
                            >
                              <Trash2 size={14} /> Excluir documento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <p className="mt-8 text-center text-xs text-[#5B6878]">
          Seus documentos médicos são protegidos com criptografia de ponta a ponta e total conformidade com a LGPD.
        </p>
      </main>

      {originalPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagem original: ${originalPreview.title}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#14211F]/75 p-4 backdrop-blur-sm"
          onMouseDown={() => setOriginalPreview(null)}
        >
          <div
            className="relative flex h-[min(86dvh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E3E8F0] px-5 py-3.5">
              <h2 className="truncate pr-4 text-sm font-bold text-[#14211F]">{originalPreview.title}</h2>
              <button
                type="button"
                onClick={() => setOriginalPreview(null)}
                className="rounded-lg p-2 text-[#5B6878] transition-colors hover:bg-[#F4F7FC] hover:text-[#14211F]"
                aria-label="Fechar imagem original"
              >
                <X size={18} />
              </button>
            </div>
            {originalPreview.url.toLowerCase().includes('.pdf') ? (
              <iframe title={originalPreview.title} src={originalPreview.url} className="min-h-0 flex-1 bg-[#F4F7FC]" />
            ) : (
              <div className="min-h-0 flex-1 overflow-auto bg-[#14211F] p-4">
                <img src={originalPreview.url} alt={`Imagem original de ${originalPreview.title}`} className="mx-auto min-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        </div>
      )}

      {documentPendingDeletion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-document-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#14211F]/55 p-4 backdrop-blur-sm"
          onMouseDown={() => !deleteMutation.isPending && setDocumentPendingDeletion(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#F3CBC0] bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDE1DA] text-[#C94E35]">
              <Trash2 size={21} />
            </div>
            <h2 id="delete-document-title" className="mt-4 text-xl font-bold text-[#14211F]">Excluir documento?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6878]">
              <strong className="text-[#14211F]">{documentPendingDeletion.title}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDocumentPendingDeletion(null)}
                className="h-10 rounded-xl border border-[#E3E8F0] px-4 text-sm font-bold text-[#5B6878] transition-colors hover:bg-[#F4F7FC] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleDelete();
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#E8664A] px-4 text-sm font-bold text-white transition-colors hover:bg-[#C94E35] disabled:opacity-60"
              >
                {deleteMutation.isPending && <LoaderCircle size={16} className="animate-spin" />}
                Excluir documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
