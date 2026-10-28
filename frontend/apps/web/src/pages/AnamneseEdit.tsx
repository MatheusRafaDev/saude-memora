import { useEffect, useState, type KeyboardEvent } from 'react';
import {
  Check,
  Droplet,
  HeartPulse,
  Info,
  LoaderCircle,
  Moon,
  Pill,
  Plus,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useGetApiFichaMedicaMe,
  usePatchApiFichaMedicaMe,
  useGetApiPacientesMe,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import {
  ALLERGY_SUGGESTIONS,
  CONDITION_SUGGESTIONS,
  FAMILY_HISTORY_SUGGESTIONS,
  findAnamneseSuggestions,
  HABIT_SUGGESTIONS,
  hasAnamneseEntry,
  normalizeAnamneseTerm,
  SURGERY_SUGGESTIONS,
  toggleAnamneseEntry,
  type AnamneseSuggestion,
} from '@/lib/anamnese-dictionary';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

type Condition = { nome: string; tem: boolean; detalhes?: string };

type SecaoId = 'gerais' | 'condicoes' | 'alergias' | 'habitos';

function EditableList({
  label,
  items,
  suggestions,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  suggestions: AnamneseSuggestion[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState('');
  const addItem = (entry: string) => {
    const trimmed = entry.trim();
    if (
      !trimmed ||
      items.some(
        (item) => normalizeAnamneseTerm(item) === normalizeAnamneseTerm(trimmed),
      )
    ) {
      setValue('');
      return;
    }
    onChange([...items, trimmed]);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addItem(value);
    }
  };

  const matchingSuggestions = value.trim().length >= 2
    ? findAnamneseSuggestions(value, suggestions)
        .filter((suggestion) => !items.some((item) => normalizeAnamneseTerm(item) === normalizeAnamneseTerm(suggestion.label)))
        .slice(0, 6)
    : [];

  const sugestoesRapidas = suggestions
    .filter((suggestion) => !items.some((item) => normalizeAnamneseTerm(item) === normalizeAnamneseTerm(suggestion.label)))
    .slice(0, 8);

  return (
    <section>
      <label className="mb-1.5 block text-[13px] font-semibold text-[#14211F]">
        {label}
      </label>

      {value.trim().length < 2 && sugestoesRapidas.length > 0 && (
        <div className="mb-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[#5B6878]">
            <Sparkles size={13} className="shrink-0 text-[#1D4ED8]" />
            <span>Toque para adicionar rapidamente:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sugestoesRapidas.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => addItem(suggestion.label)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#E3E8F0] bg-white px-3 text-xs font-semibold text-[#14211F] transition-all hover:border-[#CFE0FF] hover:bg-[#F4F7FC] cursor-pointer shadow-2xs"
              >
                <Plus size={12} strokeWidth={2.5} className="shrink-0 text-[#1D4ED8]" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-[46px] items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-3 focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15 transition-all">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-[#14211F] outline-none"
        />
        <button
          type="button"
          onClick={() => addItem(value)}
          disabled={!value.trim()}
          aria-label={`Adicionar ${label.toLowerCase()}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus size={16} />
        </button>
      </div>

      {matchingSuggestions.length > 0 && (
        <div className="relative z-10">
          <div className="absolute inset-x-0 top-1 max-h-52 overflow-y-auto rounded-xl border border-[#E3E8F0] bg-white p-1.5 shadow-lg">
            {matchingSuggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => addItem(suggestion.label)}
                className="flex min-h-9 w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[#14211F] hover:bg-[#F4F7FC] hover:text-[#1D4ED8] cursor-pointer"
              >
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#CFE0FF] bg-[#CFE0FF]/40 px-3 py-1 text-xs sm:text-sm font-semibold text-[#1D4ED8]"
          >
            <span className="break-words">{item}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((current) => current !== item))}
              aria-label={`Remover ${item}`}
              className="shrink-0 rounded-full p-0.5 hover:bg-white/70 cursor-pointer"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  suggestions = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  suggestions?: AnamneseSuggestion[];
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const displaySuggestions = isSearching && query.trim().length >= 1
    ? findAnamneseSuggestions(query, suggestions).slice(0, 8)
    : suggestions.slice(0, 8);

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="block text-[13px] font-semibold text-[#14211F]">{label}</label>
        {suggestions.length > 0 && !isSearching && (
          <button
            type="button"
            onClick={() => setIsSearching(true)}
            className="inline-flex items-center gap-1 text-xs text-[#5B6878] hover:text-[#1D4ED8] cursor-pointer"
          >
            <Search size={12} />
            <span>Buscar sugestões</span>
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mb-2">
          {isSearching && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-3 py-1.5 focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15">
              <Search size={13} className="shrink-0 text-[#78879a]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtrar opções…"
                className="min-w-0 flex-1 border-0 bg-transparent text-xs text-[#14211F] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsSearching(false);
                }}
                aria-label="Fechar busca de sugestões"
                className="text-[#78879a] hover:text-[#14211F] cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {displaySuggestions.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs text-[#5B6878]">
                {isSearching ? 'Resultados:' : 'Opções rápidas:'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {displaySuggestions.map((suggestion) => {
                  const isSelected = hasAnamneseEntry(value, suggestion.label);
                  return (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() =>
                        onChange(toggleAnamneseEntry(value, suggestion.label))
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-2xs'
                          : 'border border-[#E3E8F0] bg-white text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC]'
                      }`}
                    >
                      {isSelected ? (
                        <Check size={12} strokeWidth={2.5} className="shrink-0" />
                      ) : (
                        <Plus size={12} strokeWidth={2.5} className="shrink-0 text-[#1D4ED8]" />
                      )}
                      <span>{suggestion.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E3E8F0] bg-white p-3.5 text-sm text-[#14211F] outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 transition-all resize-y"
      />
    </section>
  );
}

function ChoiceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-semibold text-[#14211F]">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Sim', value: true },
          { label: 'Não', value: false },
        ].map((choice) => (
          <button
            key={choice.label}
            type="button"
            aria-pressed={value === choice.value}
            onClick={() => onChange(choice.value)}
            className={`min-h-[44px] rounded-xl border px-4 text-sm font-semibold transition-all cursor-pointer ${
              value === choice.value
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-2xs'
                : 'border-[#E3E8F0] bg-white text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC]'
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ConditionInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');
  const suggestions = value.trim().length >= 2
    ? findAnamneseSuggestions(value, CONDITION_SUGGESTIONS).slice(0, 6)
    : [];
  const quickConditions = CONDITION_SUGGESTIONS.slice(0, 6);

  const add = (name: string) => {
    onAdd(name);
    setValue('');
  };

  return (
    <div className="mt-5 pt-5 border-t border-[#E3E8F0]">
      <label htmlFor="add-condition" className="mb-1.5 block text-[13px] font-semibold text-[#14211F]">
        Adicionar outra condição
      </label>
      <div className="flex gap-2">
        <input
          id="add-condition"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add(value);
            }
          }}
          placeholder="Ex.: Enxaqueca crônica, Hipotireoidismo, Hipertensão…"
          className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-[#E3E8F0] bg-white px-3.5 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 text-[#14211F]"
        />
        <button
          type="button"
          onClick={() => add(value)}
          disabled={!value.trim()}
          className="inline-flex min-h-[46px] shrink-0 items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>Adicionar</span>
        </button>
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-2.5">
          <div className="mb-1.5 text-xs text-[#5B6878]">
            Sugestões correspondentes:
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Sugestões de condições">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => add(suggestion.label)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E3E8F0] bg-white px-3 py-1 text-xs font-semibold text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={12} className="text-[#1D4ED8]" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[#5B6878]">
            <Sparkles size={13} className="shrink-0 text-[#1D4ED8]" />
            <span>Sugestões comuns para adicionar:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickConditions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => add(item.label)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E3E8F0] bg-white px-3 py-1 text-xs font-semibold text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={12} className="text-[#1D4ED8]" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnamneseEdit() {
  const { toast } = useToast();
  const {
    data: fichaRaw,
    isLoading,
    isError,
    refetch,
  } = useGetApiFichaMedicaMe();
  const { data: pacienteRaw } = useGetApiPacientesMe();
  const updateFicha = usePatchApiFichaMedicaMe();

  const [activeTab, setActiveTab] = useState<SecaoId>('gerais');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [surgeries, setSurgeries] = useState('');
  const [observations, setObservations] = useState('');
  const [habits, setHabits] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [donor, setDonor] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!fichaRaw || hasLoaded) return;

    const ficha = fichaRaw as any;
    setBloodType(ficha.tipoSanguineo || '');
    setAllergies(Array.isArray(ficha.alergias) ? ficha.alergias : []);
    setMedications(
      Array.isArray(ficha.medicamentosContinuos)
        ? ficha.medicamentosContinuos
            .map((item: unknown) =>
              typeof item === 'string'
                ? item
                : (item as { nome?: string })?.nome || '',
            )
            .filter(Boolean)
        : [],
    );

    const storedConditions: Condition[] = Array.isArray(ficha.condicoes)
      ? ficha.condicoes.filter(
          (condition: any): condition is Condition =>
            typeof condition?.nome === 'string' &&
            condition.nome.trim().length > 0,
        )
      : [];
    const chronicDiseases: string[] = Array.isArray(ficha.doencasCronicas)
      ? ficha.doencasCronicas.filter(
          (name: unknown): name is string => typeof name === 'string',
        )
      : [];
    const conditionsByName = new Map<string, Condition>(
      storedConditions.map((condition) => [
        normalizeAnamneseTerm(condition.nome),
        condition,
      ]),
    );
    const allConditionNames = new Map<string, string>();
    for (const condition of storedConditions) {
      if (typeof condition?.nome === 'string' && condition.nome.trim()) {
        allConditionNames.set(
          normalizeAnamneseTerm(condition.nome),
          condition.nome.trim(),
        );
      }
    }
    for (const name of chronicDiseases) {
      if (typeof name === 'string' && name.trim()) {
        allConditionNames.set(normalizeAnamneseTerm(name), name.trim());
      }
    }
    setConditions(
      Array.from(allConditionNames, ([normalizedName, name]) => {
        const stored = conditionsByName.get(normalizedName);
        return {
          nome: name,
          tem: stored ? Boolean(stored.tem) : chronicDiseases.includes(name),
          detalhes: stored?.detalhes || '',
        };
      }),
    );

    setSurgeries(ficha.cirurgias || '');
    setObservations(ficha.observacoes || '');
    setHabits(ficha.habitosGerais || '');
    setFamilyHistory(ficha.historicoFamiliar || '');
    setDonor(Boolean(ficha.doadorOrgaos));
    setSmoker(Boolean(ficha.fuma));
    setAlcohol(Boolean(ficha.bebe));
    setHasLoaded(true);
  }, [fichaRaw, hasLoaded]);

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    setConditions((current) =>
      current.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, ...updates } : condition,
      ),
    );
  };

  const addCondition = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setConditions((current) => {
      const existing = current.findIndex(
        (condition) =>
          normalizeAnamneseTerm(condition.nome) ===
          normalizeAnamneseTerm(trimmed),
      );
      if (existing >= 0) {
        return current.map((condition, index) =>
          index === existing ? { ...condition, tem: true } : condition,
        );
      }
      return [...current, { nome: trimmed, tem: true, detalhes: '' }];
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateFicha.mutateAsync({
        data: {
          tipoSanguineo: bloodType || null,
          alergias: allergies,
          medicamentosContinuos: medications,
          doencasCronicas: conditions
            .filter((condition) => condition.tem)
            .map((condition) => condition.nome),
          condicoes: conditions,
          cirurgias: surgeries,
          observacoes: observations,
          habitosGerais: habits,
          historicoFamiliar: familyHistory,
          doadorOrgaos: donor,
          fuma: smoker,
          bebe: alcohol,
        } as any,
      });
      await refetch();
      toast({ title: 'Anamnese salva com sucesso.' });
    } catch {
      toast({
        title: 'Não foi possível salvar a anamnese.',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pacienteNome = (pacienteRaw as any)?.nome || '';
  const initials = pacienteNome
    ? pacienteNome
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '—';

  if (isLoading) {
    return (
      <div className="flex-1 flex min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] items-center justify-center text-[#5a6a80]" role="status">
        <LoaderCircle size={22} className="mr-2 animate-spin text-[#1D4ED8]" />
        <span className="font-medium text-sm">Carregando sua anamnese…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border border-[#E8664A]/30 bg-[#E8664A]/10 p-8 text-center">
          <p className="text-[#E8664A] font-medium" role="alert">
            Não foi possível carregar sua anamnese. Tente novamente mais tarde.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 min-h-[44px] rounded-xl bg-[#1D4ED8] px-5 font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all shadow-xs"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] flex-1 bg-white text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-3.5 sm:px-8 lg:px-10 pt-5 sm:pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-4 sm:gap-5 mb-4 sm:mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1D4ED8]">
              Ficha médica
            </div>
            <h1 className="mt-1.5 sm:mt-2 mb-0 text-2xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#14211F]">
              Anamnese
            </h1>
            <p className="mt-1 sm:mt-1.5 mb-0 text-[#5B6878] text-xs sm:text-base">
              Gerencie seus dados de saúde, condições prévias e medicamentos.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSaving ? 'Salvando…' : 'Salvar anamnese'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Tabs */}
        <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 mb-4 no-scrollbar -mx-1 px-1">
          <button
            type="button"
            onClick={() => setActiveTab('gerais')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'gerais'
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-2xs'
                : 'border-[#E3E8F0] bg-[#F8FAFD] text-[#5B6878] hover:text-[#14211F]'
            }`}
          >
            <Droplet size={14} />
            <span>Dados gerais</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('condicoes')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'condicoes'
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-2xs'
                : 'border-[#E3E8F0] bg-[#F8FAFD] text-[#5B6878] hover:text-[#14211F]'
            }`}
          >
            <HeartPulse size={14} />
            <span>Condições</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alergias')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'alergias'
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-2xs'
                : 'border-[#E3E8F0] bg-[#F8FAFD] text-[#5B6878] hover:text-[#14211F]'
            }`}
          >
            <Pill size={14} />
            <span>Alergias e remédios</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('habitos')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === 'habitos'
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-2xs'
                : 'border-[#E3E8F0] bg-[#F8FAFD] text-[#5B6878] hover:text-[#14211F]'
            }`}
          >
            <Moon size={14} />
            <span>Hábitos e histórico</span>
          </button>
        </div>

        {/* 2-col Layout */}
        <div className="flex gap-7 flex-wrap items-start">
          {/* Left Sidebar Tabs (Desktop, 240px) */}
          <div className="hidden sm:flex w-[240px] flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('gerais')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'gerais'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <Droplet size={18} className={activeTab === 'gerais' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              <span>Dados gerais</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('condicoes')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'condicoes'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <HeartPulse size={18} className={activeTab === 'condicoes' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              <span>Condições de saúde</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alergias')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'alergias'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <Pill size={18} className={activeTab === 'alergias' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              <span>Alergias e remédios</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('habitos')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'habitos'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <Moon size={18} className={activeTab === 'habitos' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              <span>Hábitos e histórico</span>
            </button>
          </div>

          {/* Right Column: Cards (flex: 1) */}
          <div className="w-full min-w-0 flex-1 flex flex-col gap-5">
            <div key={activeTab} className="w-full flex flex-col gap-5 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Card 1: Dados gerais */}
              {activeTab === 'gerais' && (
                <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                  {/* Patient & Health Record Summary Header */}
                  <div className="flex gap-4 sm:gap-5 items-center mb-6 pb-6 border-b border-[#E3E8F0]">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[24px] bg-[#1D4ED8] text-white text-2xl sm:text-3xl font-extrabold flex items-center justify-center shrink-0 shadow-md">
                      {initials !== '—' ? initials : <HeartPulse size={32} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <b className="text-lg sm:text-xl text-[#14211F] truncate block">
                          {pacienteNome || 'Prontuário Médico'}
                        </b>
                        {bloodType && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#1D4ED8]/10 text-[#1D4ED8] px-2.5 py-0.5 text-xs font-bold border border-[#1D4ED8]/20">
                            <Droplet size={11} className="fill-[#1D4ED8]" />
                            Tipo {bloodType}
                          </span>
                        )}
                        {donor && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-200">
                            Doador de órgãos
                          </span>
                        )}
                      </div>
                      <div className="text-[#5B6878] text-xs sm:text-sm mt-1">
                        {conditions.filter((c) => c.tem).length} condições cadastradas • {allergies.length} alergias • {medications.length} medicamentos
                      </div>
                    </div>
                  </div>

                  {/* Section Title & Description */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] flex items-center justify-center shrink-0">
                      <Droplet size={18} className="text-[#1D4ED8]" />
                    </div>
                    <b className="text-base text-[#14211F] flex-1">Dados gerais de saúde</b>
                  </div>
                  <p className="mb-5 ml-11 text-sm leading-relaxed text-[#5B6878]">
                    Informações fundamentais para atendimentos clínicos, consultas e situações de emergência.
                  </p>

                  <div className="space-y-6">
                    {/* Blood Type Selection */}
                    <div>
                      <label className="block text-[13px] font-semibold text-[#14211F] mb-1.5">
                        Tipo sanguíneo
                      </label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {BLOOD_TYPES.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setBloodType(bloodType === type ? '' : type)}
                            className={`min-h-10 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                              bloodType === type
                                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-2xs'
                                : 'border-[#E3E8F0] bg-white text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC]'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                        {bloodType && (
                          <button
                            type="button"
                            onClick={() => setBloodType('')}
                            className="min-h-10 px-3 rounded-xl text-xs font-medium text-[#5B6878] hover:text-[#E8664A] transition-colors cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cirurgias */}
                    <TextAreaField
                      label="Cirurgias anteriores"
                      value={surgeries}
                      onChange={setSurgeries}
                      placeholder="Informe cirurgias realizadas e, se souber, o ano aproximado."
                      suggestions={SURGERY_SUGGESTIONS}
                    />

                    {/* Observações */}
                    <TextAreaField
                      label="Observações médicas adicionais"
                      value={observations}
                      onChange={setObservations}
                      placeholder="Outras informações clínicas relevantes que deseja registrar."
                    />

                    {/* Footer Save Button */}
                    <div className="pt-4 border-t border-[#E3E8F0] flex justify-end">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                        {!isSaving && <Save size={16} />}
                        <span>{isSaving ? 'Salvando…' : 'Salvar alterações'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Condições de saúde */}
              {activeTab === 'condicoes' && (
                <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] flex items-center justify-center shrink-0">
                      <HeartPulse size={18} className="text-[#1D4ED8]" />
                    </div>
                    <b className="text-base text-[#14211F] flex-1">Condições de saúde e diagnósticos</b>
                  </div>
                  <p className="mb-5 ml-11 text-sm leading-relaxed text-[#5B6878]">
                    Marque as condições que você possui para facilitar a leitura de prescrições e acompanhamento clínico.
                  </p>

                  <div className="space-y-3">
                    {conditions.map((condition, index) => (
                      <div
                        key={normalizeAnamneseTerm(condition.nome)}
                        className={`rounded-xl border p-3.5 transition-all ${
                          condition.tem ? 'border-[#CFE0FF] bg-[#F8FAFF]' : 'border-[#E3E8F0] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            id={`condition-${index}`}
                            type="checkbox"
                            checked={condition.tem}
                            onChange={(event) => updateCondition(index, { tem: event.target.checked })}
                            className="h-4 w-4 rounded border-[#E3E8F0] text-[#1D4ED8] focus:ring-[#1D4ED8] accent-[#1D4ED8] cursor-pointer"
                          />
                          <label
                            htmlFor={`condition-${index}`}
                            className="min-w-0 flex-1 text-sm font-semibold text-[#14211F] cursor-pointer"
                          >
                            {condition.nome}
                          </label>
                          <button
                            type="button"
                            aria-label={`Remover condição ${condition.nome}`}
                            onClick={() =>
                              setConditions((current) => current.filter((_, itemIndex) => itemIndex !== index))
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5B6878] hover:bg-[#FDE1DA] hover:text-[#E8664A] transition-colors cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        </div>
                        {condition.tem && (
                          <div className="ml-7 mt-2.5">
                            <input
                              value={condition.detalhes || ''}
                              onChange={(event) => updateCondition(index, { detalhes: event.target.value })}
                              placeholder="Detalhes ou tempo de diagnóstico (opcional)"
                              className="w-full h-[40px] px-3.5 rounded-lg border border-[#E3E8F0] bg-white text-sm outline-none focus:border-[#1D4ED8] text-[#14211F]"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {conditions.length === 0 && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-[#E3E8F0] bg-[#F8FAFD] p-4 text-sm text-[#5B6878]">
                        <Info size={16} className="shrink-0 text-[#1D4ED8]" />
                        <span>Nenhuma condição cadastrada ainda. Use o campo abaixo ou as sugestões rápidas.</span>
                      </div>
                    )}
                  </div>

                  <ConditionInput onAdd={addCondition} />

                  <div className="pt-5 border-t border-[#E3E8F0] mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                      {!isSaving && <Save size={16} />}
                      <span>{isSaving ? 'Salvando…' : 'Salvar alterações'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Card 3: Alergias e medicamentos */}
              {activeTab === 'alergias' && (
                <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] flex items-center justify-center shrink-0">
                      <Pill size={18} className="text-[#1D4ED8]" />
                    </div>
                    <b className="text-base text-[#14211F] flex-1">Alergias e medicamentos contínuos</b>
                  </div>
                  <p className="mb-5 ml-11 text-sm leading-relaxed text-[#5B6878]">
                    Registre alergias a remédios ou alimentos e liste seus medicamentos de uso diário.
                  </p>

                  <div className="space-y-6">
                    <EditableList
                      label="Alergias conhecidas"
                      items={allergies}
                      suggestions={ALLERGY_SUGGESTIONS}
                      onChange={setAllergies}
                      placeholder="Digite uma alergia (ex.: Penicilina, Dipirona) e pressione Enter"
                    />

                    <div className="border-t border-[#E3E8F0] my-6" />

                    <EditableList
                      label="Medicamentos de uso contínuo"
                      items={medications}
                      suggestions={[]}
                      onChange={setMedications}
                      placeholder="Digite o medicamento (ex.: Losartana 50mg, Levotiroxina) e pressione Enter"
                    />

                    <div className="pt-4 border-t border-[#E3E8F0] flex justify-end">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                        {!isSaving && <Save size={16} />}
                        <span>{isSaving ? 'Salvando…' : 'Salvar alterações'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 4: Hábitos e histórico */}
              {activeTab === 'habitos' && (
                <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] flex items-center justify-center shrink-0">
                      <Moon size={18} className="text-[#1D4ED8]" />
                    </div>
                    <b className="text-base text-[#14211F] flex-1">Hábitos de vida e histórico familiar</b>
                  </div>
                  <p className="mb-5 ml-11 text-sm leading-relaxed text-[#5B6878]">
                    Rotina geral de saúde, histórico familiar preventivo e preferências de doação.
                  </p>

                  <div className="space-y-6">
                    <TextAreaField
                      label="Hábitos gerais (sono, alimentação, atividade física)"
                      value={habits}
                      onChange={setHabits}
                      placeholder="Descreva sua rotina diária de sono, alimentação e atividade física."
                      suggestions={HABIT_SUGGESTIONS}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <ChoiceField
                        label="Doador de órgãos"
                        value={donor}
                        onChange={setDonor}
                      />
                      <ChoiceField
                        label="Tabagismo"
                        value={smoker}
                        onChange={setSmoker}
                      />
                      <ChoiceField
                        label="Consome bebidas alcoólicas"
                        value={alcohol}
                        onChange={setAlcohol}
                      />
                    </div>

                    <TextAreaField
                      label="Histórico familiar de saúde"
                      value={familyHistory}
                      onChange={setFamilyHistory}
                      placeholder="Informe doenças ou condições relevantes na família (pais, avós, irmãos)."
                      suggestions={FAMILY_HISTORY_SUGGESTIONS}
                    />

                    <div className="pt-4 border-t border-[#E3E8F0] flex justify-end">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                        {!isSaving && <Save size={16} />}
                        <span>{isSaving ? 'Salvando…' : 'Salvar alterações'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
