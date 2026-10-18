import { useEffect, useState, type KeyboardEvent } from 'react';
import { useLocation } from 'wouter';
import {
  Check,
  ChevronDown,
  Droplet,
  HeartPulse,
  Info,
  LoaderCircle,
  Moon,
  Pill,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useGetApiFichaMedicaMe,
  usePatchApiFichaMedicaMe,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import {
  ALLERGY_SUGGESTIONS,
  appendAnamneseEntry,
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
        (item) =>
          normalizeAnamneseTerm(item) === normalizeAnamneseTerm(trimmed),
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
      <label className="mb-1.5 block text-sm font-bold text-[#14211F]">
        {label}
      </label>

      {value.trim().length < 2 && sugestoesRapidas.length > 0 && (
        <div className="mb-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[#5a6a80]">
            <Sparkles size={13} className="shrink-0 text-[#1D4ED8]" />
            <span>Toque para adicionar:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sugestoesRapidas.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => addItem(suggestion.label)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#E3E8F0] bg-white px-3 text-xs font-semibold text-[#14211F] transition-colors hover:border-[#CFE0FF] hover:bg-[#F4F7FC]"
              >
                <Plus size={12} strokeWidth={2.5} className="shrink-0 text-[#1D4ED8]" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#c6cfdb] bg-white px-3 focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-40 transition-colors shadow-xs"
        >
          <Plus size={17} />
        </button>
      </div>
      {matchingSuggestions.length > 0 && (
        <div className="relative z-10">
          <div className="mb-1.5 text-xs text-[#5a6a80]">
            Sugestões:
          </div>
          <div
            className="absolute inset-x-0 top-1 max-h-52 overflow-y-auto rounded-xl border border-[#E3E8F0] bg-white p-1.5 shadow-lg"
            aria-label={`Sugestões para ${label.toLowerCase()}`}
          >
            {matchingSuggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => addItem(suggestion.label)}
                className="flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[#14211F] hover:bg-[#F4F7FC] hover:text-[#1D4ED8]"
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
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#CFE0FF] bg-[#CFE0FF]/40 px-3 py-1.5 text-sm font-semibold text-[#1D4ED8]"
          >
            <span className="break-words">{item}</span>
            <button
              type="button"
              onClick={() =>
                onChange(items.filter((current) => current !== item))
              }
              aria-label={`Remover ${item}`}
              className="shrink-0 rounded-full p-0.5 hover:bg-white/70"
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
        <label className="block text-sm font-bold text-[#14211F]">{label}</label>
        {suggestions.length > 0 && !isSearching && (
          <button
            type="button"
            onClick={() => setIsSearching(true)}
            className="inline-flex items-center gap-1 text-xs text-[#5a6a80] hover:text-[#1D4ED8]"
          >
            <Search size={12} />
            <span>Buscar sugestões</span>
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mb-2">
          {isSearching && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#c6cfdb] bg-white px-2.5 py-1 focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15">
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
                className="text-[#78879a] hover:text-[#14211F]"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {displaySuggestions.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs text-[#5a6a80]">
                {isSearching ? 'Resultados:' : 'Sugestões rápidas:'}
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
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-xs'
                          : 'border border-[#E3E8F0] bg-white text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC]'
                      }`}
                    >
                      {isSelected ? (
                        <Check size={13} strokeWidth={2.5} className="shrink-0" />
                      ) : (
                        <Plus size={13} strokeWidth={2.5} className="shrink-0 text-[#1D4ED8]" />
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

      {/* Caixa de texto */}
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#c6cfdb] bg-white p-3.5 text-sm text-[#14211F] outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
      />
      <p className="mt-1 text-xs text-[#78879a]">
        Digite para ver sugestões ou escreva livremente no campo.
      </p>
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
      <legend className="mb-2 text-sm font-bold text-[#14211F]">{label}</legend>
      <div className="flex gap-2">
        {[
          { label: 'Sim', value: true },
          { label: 'Não', value: false },
        ].map((choice) => (
          <button
            key={choice.label}
            type="button"
            aria-pressed={value === choice.value}
            onClick={() => onChange(choice.value)}
            className={`min-h-11 rounded-xl border px-5 text-sm font-semibold transition-colors ${
              value === choice.value
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-xs'
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

export default function AnamneseEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    data: fichaRaw,
    isLoading,
    isError,
    refetch,
  } = useGetApiFichaMedicaMe();
  const updateFicha = usePatchApiFichaMedicaMe();

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
  const [secaoAberta, setSecaoAberta] = useState<SecaoId | null>('gerais');

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

  if (isLoading) {
    return (
      <div className="p-12 text-center text-[#5a6a80]">
        Carregando sua anamnese…
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#E8664A]/30 bg-[#FFF5F3] p-5 sm:p-8 text-center text-[#E8664A]"
      >
        Não foi possível carregar sua anamnese. Tente novamente mais tarde.
      </div>
    );
  }

  const conditionInput = <ConditionInput onAdd={addCondition} />;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-16 pt-9 text-[#14211F] sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase text-[#1D4ED8] mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
            Ficha de saúde
          </div>
          <h1 className="mb-0 mt-1 text-3xl font-bold tracking-[-0.035em] text-[#14211F] sm:text-4xl">
            Anamnese
          </h1>
          <p className="mb-0 mt-1.5 text-sm text-[#5B6878] sm:text-base">
            Seu histórico de saúde, reunido em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLocation('/visao-geral')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            <span>{isSaving ? 'Salvando…' : 'Salvar anamnese'}</span>
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#CFE0FF] bg-gradient-to-r from-[#CFE0FF]/35 to-[#F4F7FC] p-4 text-sm leading-relaxed text-[#1D4ED8] shadow-xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1D4ED8]/10 text-[#1D4ED8]">
          <ShieldCheck size={17} />
        </div>
        <p className="mb-0 text-[#14211F]">
          Preencha apenas o que quiser — os campos são opcionais. Estas informações aparecem na
          <strong className="font-bold"> Visão geral</strong> e na
          <strong className="font-bold"> ficha de emergência</strong>.
        </p>
      </div>

      <div className="space-y-6">
        {/* Seção 1: Dados gerais */}
        <section id="secao-gerais" className="scroll-mt-24 rounded-2xl border border-[#E3E8F0] bg-white p-5 shadow-xs sm:p-6">
          <button
            type="button"
            onClick={() => setSecaoAberta(secaoAberta === 'gerais' ? null : 'gerais')}
            aria-expanded={secaoAberta === 'gerais'}
            className="flex w-full items-center gap-3 text-left lg:cursor-default"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
              <Droplet size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-lg font-bold text-[#14211F]">Dados gerais</h2>
              </span>
              <span className="mt-0.5 block text-[13px] text-[#5B6878]">
                Tipo sanguíneo, cirurgias e observações
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-[#5B6878] transition-transform lg:hidden ${
                secaoAberta === 'gerais' ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-5 ${secaoAberta === 'gerais' ? '' : 'hidden'} lg:block`}>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="blood-type"
                  className="mb-1.5 block text-sm font-bold text-[#14211F]"
                >
                  Tipo sanguíneo
                </label>
                <select
                  id="blood-type"
                  value={bloodType}
                  onChange={(event) => setBloodType(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-[#c6cfdb] bg-white px-3 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 sm:max-w-xs text-[#14211F]"
                >
                  <option value="">Não informado</option>
                  {BLOOD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <TextAreaField
                label="Cirurgias anteriores"
                value={surgeries}
                onChange={setSurgeries}
                placeholder="Informe cirurgias e, se souber, o ano."
                suggestions={SURGERY_SUGGESTIONS}
              />
              <TextAreaField
                label="Observações"
                value={observations}
                onChange={setObservations}
                placeholder="Outras informações de saúde que deseja registrar."
              />
            </div>
          </div>
        </section>

        {/* Seção 2: Condições de saúde */}
        <section id="secao-condicoes" className="scroll-mt-24 rounded-2xl border border-[#E3E8F0] bg-white p-5 shadow-xs sm:p-6">
          <button
            type="button"
            onClick={() => setSecaoAberta(secaoAberta === 'condicoes' ? null : 'condicoes')}
            aria-expanded={secaoAberta === 'condicoes'}
            className="flex w-full items-center gap-3 text-left lg:cursor-default"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
              <HeartPulse size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-lg font-bold text-[#14211F]">Condições de saúde</h2>
              </span>
              <span className="mt-0.5 block text-[13px] text-[#5B6878]">
                Doenças e condições que você acompanha
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-[#5B6878] transition-transform lg:hidden ${
                secaoAberta === 'condicoes' ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-5 ${secaoAberta === 'condicoes' ? '' : 'hidden'} lg:block`}>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={normalizeAnamneseTerm(condition.nome)}
                  className="rounded-xl border border-[#E3E8F0] p-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      id={`condition-${index}`}
                      type="checkbox"
                      checked={condition.tem}
                      onChange={(event) =>
                        updateCondition(index, { tem: event.target.checked })
                      }
                      className="h-4 w-4 rounded text-[#1D4ED8] focus:ring-[#1D4ED8] accent-[#1D4ED8]"
                    />
                    <label
                      htmlFor={`condition-${index}`}
                      className="min-w-0 flex-1 text-sm font-semibold text-[#14211F]"
                    >
                      {condition.nome}
                    </label>
                    <button
                      type="button"
                      aria-label={`Remover condição ${condition.nome}`}
                      onClick={() =>
                        setConditions((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#E8664A] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {condition.tem && (
                    <input
                      value={condition.detalhes || ''}
                      onChange={(event) =>
                        updateCondition(index, { detalhes: event.target.value })
                      }
                      placeholder="Detalhes (opcional)"
                      className="ml-7 mt-2 min-h-10 w-[calc(100%-1.75rem)] rounded-lg border border-[#c6cfdb] px-3 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 text-[#14211F]"
                    />
                  )}
                </div>
              ))}
              {conditions.length === 0 && (
                <p className="mb-0 flex items-center gap-2 rounded-xl bg-[#F4F7FC] p-3 text-sm text-[#78879a]">
                  <Info size={14} className="shrink-0 text-[#1D4ED8]" />
                  Nenhuma condição registrada ainda. Use o campo abaixo ou as sugestões.
                </p>
              )}
            </div>
            {conditionInput}
          </div>
        </section>

        {/* Seção 3: Alergias e medicamentos */}
        <section id="secao-alergias" className="scroll-mt-24 rounded-2xl border border-[#E3E8F0] bg-white p-5 shadow-xs sm:p-6">
          <button
            type="button"
            onClick={() => setSecaoAberta(secaoAberta === 'alergias' ? null : 'alergias')}
            aria-expanded={secaoAberta === 'alergias'}
            className="flex w-full items-center gap-3 text-left lg:cursor-default"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
              <Pill size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-lg font-bold text-[#14211F]">Alergias e medicamentos</h2>
              </span>
              <span className="mt-0.5 block text-[13px] text-[#5B6878]">
                O que você não pode tomar e o que usa todos os dias
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-[#5B6878] transition-transform lg:hidden ${
                secaoAberta === 'alergias' ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-5 ${secaoAberta === 'alergias' ? '' : 'hidden'} lg:block`}>
            <div className="space-y-6">
              <EditableList
                label="Alergias"
                items={allergies}
                suggestions={ALLERGY_SUGGESTIONS}
                onChange={setAllergies}
                placeholder="Digite uma alergia e pressione Enter"
              />
              <EditableList
                label="Medicamentos contínuos"
                items={medications}
                suggestions={[]}
                onChange={setMedications}
                placeholder="Digite o medicamento e pressione Enter"
              />
            </div>
          </div>
        </section>

        {/* Seção 4: Hábitos e histórico */}
        <section id="secao-habitos" className="scroll-mt-24 rounded-2xl border border-[#E3E8F0] bg-white p-5 shadow-xs sm:p-6">
          <button
            type="button"
            onClick={() => setSecaoAberta(secaoAberta === 'habitos' ? null : 'habitos')}
            aria-expanded={secaoAberta === 'habitos'}
            className="flex w-full items-center gap-3 text-left lg:cursor-default"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
              <Moon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-lg font-bold text-[#14211F]">Hábitos e histórico</h2>
              </span>
              <span className="mt-0.5 block text-[13px] text-[#5B6878]">
                Rotina, histórico familiar e doação de órgãos
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-[#5B6878] transition-transform lg:hidden ${
                secaoAberta === 'habitos' ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-5 ${secaoAberta === 'habitos' ? '' : 'hidden'} lg:block`}>
            <div className="space-y-5">
              <TextAreaField
                label="Hábitos gerais (sono, alimentação, atividade física)"
                value={habits}
                onChange={setHabits}
                placeholder="Descreva os hábitos e a rotina que deseja registrar."
                suggestions={HABIT_SUGGESTIONS}
              />
              <div className="grid gap-5 sm:grid-cols-3">
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
                label="Histórico familiar"
                value={familyHistory}
                onChange={setFamilyHistory}
                placeholder="Informe condições de saúde relevantes na família."
                suggestions={FAMILY_HISTORY_SUGGESTIONS}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap justify-end gap-3 rounded-2xl border border-[#E3E8F0] bg-white p-4 shadow-xs">
        <button
          type="button"
          onClick={() => setLocation('/visao-geral')}
          className="min-h-11 rounded-xl border border-[#E3E8F0] bg-white px-5 text-sm font-semibold text-[#14211F] hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all shadow-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-60 transition-all shadow-xs"
        >
          {isSaving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {isSaving ? 'Salvando…' : 'Salvar anamnese'}
        </button>
      </div>
    </main>
  );
}

function ConditionInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');
  const suggestions = value.trim().length >= 2
    ? findAnamneseSuggestions(value, CONDITION_SUGGESTIONS).slice(0, 6)
    : [];
  const add = (name: string) => {
    onAdd(name);
    setValue('');
  };

  return (
    <div className="mt-4">
      <label htmlFor="add-condition" className="mb-1.5 block text-sm font-bold text-[#14211F]">
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
          placeholder="Ex.: enxaqueca, tireoide, pressão alta"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#c6cfdb] bg-white px-3 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15 text-[#14211F]"
        />
        <button
          type="button"
          onClick={() => add(value)}
          disabled={!value.trim()}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-50 transition-all shadow-xs"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2.5">
          <div className="mb-1.5 text-xs text-[#5a6a80]">
            Sugestões:
          </div>
          <div
            className="flex flex-wrap gap-2"
            aria-label="Sugestões de condições"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => add(suggestion.label)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E3E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC] transition-colors"
              >
                <Plus size={13} className="text-[#1D4ED8]" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
