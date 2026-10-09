import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, Plus, Search, X } from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';

type CatalogSource = 'medicamentos' | 'cid10' | 'cnes';

type CatalogItem = {
  codigo?: string;
  processoAnvisa?: string;
  principioAtivo?: string;
  descricao?: string;
  registroAnvisa?: string;
  situacaoRegistro?: string;
  fabricante?: string;
  classeTerapeutica?: string;
  categoria?: string;
  nivel?: string;
  nome?: string;
};

type CatalogResponse = {
  count: number;
  registros?: CatalogItem[];
  medicamentos?: CatalogItem[];
};

const SOURCES: { value: CatalogSource; label: string }[] = [
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'cid10', label: 'CID-10' },
  { value: 'cnes', label: 'CNES' },
];

function getItemName(item: CatalogItem): string {
  return item.nome ?? item.codigo ?? '';
}

function getItemValue(item: CatalogItem, source: CatalogSource): string {
  const name = getItemName(item);
  if (source === 'medicamentos') return name;

  const description = item.descricao ?? item.nome ?? '';
  return description && description !== name ? `${name} — ${description}` : name;
}

function getItemDetails(item: CatalogItem): string {
  return [
    item.principioAtivo && `Princípio ativo: ${item.principioAtivo}`,
    item.classeTerapeutica && `Classe: ${item.classeTerapeutica}`,
    item.registroAnvisa && `Registro Anvisa: ${item.registroAnvisa}`,
    item.situacaoRegistro && `Situação: ${item.situacaoRegistro}`,
    !item.principioAtivo && item.descricao,
  ].filter(Boolean).join(' · ');
}

export function CatalogAutocomplete({
  label,
  selected,
  onChange,
  sourceOptions = SOURCES,
  allowCustomEntry = false,
  selectCodeOnly = false,
}: {
  label: string;
  selected: string[];
  onChange: (items: string[]) => void;
  sourceOptions?: { value: CatalogSource; label: string }[];
  allowCustomEntry?: boolean;
  selectCodeOnly?: boolean;
}) {
  const [source, setSource] = useState<CatalogSource>(sourceOptions[0]?.value ?? 'medicamentos');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    if (query.trim().length < 3) {
      setItems([]);
      setLoading(false);
      setError('');
      return;
    }

    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const endpoint = source === 'medicamentos'
          ? `/api/catalogo-medicamentos?query=${encodeURIComponent(query)}&limit=20`
          : `/api/catalogo-${source}?query=${encodeURIComponent(query)}&limit=20`;
        const response = await customFetch<CatalogResponse>(endpoint, {
          signal: controller.signal,
        });
        if (currentRequest !== requestId.current) return;
        const records = source === 'medicamentos' ? response.medicamentos ?? [] : response.registros ?? [];
        setItems(records);
      } catch (caughtError) {
        if (currentRequest === requestId.current && caughtError instanceof Error && caughtError.name !== 'AbortError') {
          setError('Não foi possível consultar o catálogo. Tente novamente.');
          setItems([]);
        }
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, source]);

  const addItem = (item: CatalogItem) => {
    const value = selectCodeOnly && source !== 'medicamentos'
      ? item.codigo ?? getItemValue(item, source)
      : getItemValue(item, source);
    if (value && !selected.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      onChange([...selected, value]);
    }
    setQuery('');
    setItems([]);
  };

  const addCustomItem = () => {
    const value = query.trim();
    if (value && !selected.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      onChange([...selected, value]);
    }
    setQuery('');
    setItems([]);
  };

  const removeItem = (item: string) => onChange(selected.filter((value) => value !== item));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-foreground">{label}</label>
        {selected.length > 0 && <span className="text-[10px] font-medium text-muted-foreground">{selected.length} selecionada(s)</span>}
      </div>

      <div className="flex flex-wrap gap-1.5 pb-1">
        {selected.map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            {item}
            <button type="button" onClick={() => removeItem(item)} className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/20" title="Remover">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (allowCustomEntry && event.key === 'Enter' && query.trim()) {
                event.preventDefault();
                addCustomItem();
              }
            }}
            placeholder={`Buscar ${source === 'medicamentos' ? 'medicamentos' : source === 'cid10' ? 'CID-10' : 'CNES'}...`}
            className="h-11 w-full rounded-xl border border-input bg-background px-4 pr-10 text-xs font-medium outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          {loading && <LoaderCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}

          {((query.trim().length >= 3 && !loading) || (allowCustomEntry && query.trim().length > 0)) && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl">
              {allowCustomEntry && (
                <button type="button" onClick={addCustomItem} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-accent hover:bg-accent/10">
                  <span className="truncate">Adicionar “{query.trim()}”</span>
                  <Plus size={14} className="shrink-0" />
                </button>
              )}
              {items.length > 0 ? items.map((item, index) => {
                const name = getItemName(item);
                const details = getItemDetails(item);
                return (
                  <button key={`${name}-${index}`} type="button" onClick={() => addItem(item)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-accent/10 hover:text-accent">
                    <span className="min-w-0">
                      <span className="block truncate">{name}</span>
                      {details && <span className="mt-0.5 block truncate text-[10px] font-normal text-muted-foreground">{details}</span>}
                    </span>
                    <Check size={14} className="shrink-0 text-muted-foreground" />
                  </button>
                );
              }) : error ? (
                <div className="px-3 py-3 text-xs text-destructive text-center">{error}</div>
              ) : !allowCustomEntry ? (
                <div className="px-3 py-3 text-xs text-muted-foreground text-center">Nenhum registro encontrado.</div>
              ) : query.trim().length >= 3 && !loading && !error ? (
                <div className="px-3 py-2 text-[11px] text-muted-foreground">Ou selecione um registro encontrado no catálogo.</div>
              ) : null}
            </div>
          )}
        </div>

        {sourceOptions.length > 1 && (
          <div className="flex rounded-xl border border-input bg-background p-1">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { setSource(option.value); setQuery(''); setItems([]); }}
                className={`rounded-lg px-3 py-2 text-[10px] font-bold transition-colors ${source === option.value ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
