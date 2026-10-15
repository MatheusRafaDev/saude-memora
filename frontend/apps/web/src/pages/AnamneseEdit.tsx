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

/**
 * Contagem de itens preenchidos por seção, para o resumo lateral e para os
 * indicadores do cabeçalho de cada bloco.
 */
function contarSecoes(dados: {
  bloodType: string;
  surgeries: string;
  observations: string;
  conditions: Condition[];
  allergies: string[];
  medications: string[];
  habits: string;
  familyHistory: string;
  donor: boolean;
  smoker: boolean;
  alcohol: boolean;
}) {
  const condicoesMarcadas = dados.conditions.filter((condition) => condition.tem).length;

  return {
    gerais: {
      preenchidos:
        (dados.bloodType ? 1 : 0) +
        (dados.surgeries.trim() ? 1 : 0) +
        (dados.observations.trim() ? 1 : 0),
      total: 3,
    },
    condicoes: {
      preenchidos: condicoesMarcadas,
      total: Math.max(dados.conditions.length, 1),
      quantidade: condicoesMarcadas,
    },
    alergias: {
      preenchidos:
        (dados.allergies.length > 0 ? 1 : 0) + (dados.medications.length > 0 ? 1 : 0),
      total: 2,
      quantidade: dados.allergies.length,
      medicamentos: dados.medications.length,
    },
    habitos: {
      preenchidos:
        (dados.habits.trim() ? 1 : 0) +
        (dados.familyHistory.trim() ? 1 : 0) +
        1 + // doador de órgãos sempre tem resposta (Sim/Não)
        (dados.smoker ? 1 : 0) +
        (dados.alcohol ? 1 : 0),
      total: 5,
    },
  };
}

const SECOES: {
  id: SecaoId;
  titulo: string;
  descricao: string;
  icon: typeof Droplet;
}[] = [
  {
    id: 'gerais',
    titulo: 'Dados gerais',
    descricao: 'Tipo sanguíneo, cirurgias e observações',
    icon: Droplet,
  },
  {
    id: 'condicoes',
    titulo: 'Condições de saúde',
    descricao: 'Doenças e condições que você acompanha',
    icon: HeartPulse,
  },
  {
    id: 'alergias',
    titulo: 'Alergias e medicamentos',
    descricao: 'O que você não pode tomar e o que usa todo dia',
    icon: Pill,
  },
  {
    id: 'habitos',
    titulo: 'Hábitos e histórico',
    descricao: 'Rotina, histórico familiar e doação de órgãos',
    icon: Moon,
  },
];


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

  // Sugestões rápidas sempre visíveis: sem isso a seção parece vazia e o usuário não
  // descobre que pode apenas tocar numa opção em vez de digitar.
  const sugestoesRapidas = suggestions
    .filter((suggestion) => !items.some((item) => normalizeAnamneseTerm(item) === normalizeAnamneseTerm(suggestion.label)))
    .slice(0, 8);

  return (
    <section>
      <label className="mb-1.5 block text-sm font-bold text-[#1d2a3d]">
        {label}
      </label>

      {value.trim().length < 2 && sugestoesRapidas.length > 0 && (
        <div className="mb-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[#5a6a80]">
            <Sparkles size={13} className="shrink-0 text-[#1f7fe0]" />
            <span>Toque para adicionar:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sugestoesRapidas.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => addItem(suggestion.label)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#c6cfdb] bg-white px-3 text-xs font-semibold text-[#1b3a60] transition-colors hover:border-[#1f7fe0] hover:bg-[#f1f7ff]"
              >
                <Plus size={12} strokeWidth={2.5} className="shrink-0 text-[#1f7fe0]" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#c6cfdb] bg-white px-3 focus-within:border-[#1b3a60]">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-[#1d2a3d] outline-none"
        />
        <button
          type="button"
          onClick={() => addItem(value)}
          disabled={!value.trim()}
          aria-label={`Adicionar ${label.toLowerCase()}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1b3a60] text-white hover:bg-[#244d7e] disabled:opacity-40 transition-colors"
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
            className="absolute inset-x-0 top-1 max-h-52 overflow-y-auto rounded-xl border border-[#dde3ec] bg-white p-1.5 shadow-lg"
            aria-label={`Sugestões para ${label.toLowerCase()}`}
          >
            {matchingSuggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => addItem(suggestion.label)}
                className="flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[#1b3a60] hover:bg-[#f1f7ff]"
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
            className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#e5eefb] px-3 py-1.5 text-sm font-semibold text-[#1b3a60]"
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
        {items.length === 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#78879a]">
            <Info size={13} className="shrink-0" />
            Nada informado ainda — use as opções acima ou escreva no campo.
          </span>
        )}
      </div>
    </section>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions?: AnamneseSuggestion[];
  rows?: number;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const displaySuggestions = suggestions
    ? (searchQuery.trim().length >= 2
        ? findAnamneseSuggestions(searchQuery, suggestions, 10)
        : [])
    : [];

  const handleAddCustom = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange(appendAnamneseEntry(value, trimmed));
    setSearchQuery('');
  };

  return (
    <section>
      <label className="mb-1.5 block text-sm font-bold text-[#1d2a3d]">
        {label}
      </label>

      {suggestions && suggestions.length > 0 && (
        <div className="mb-3 space-y-2.5">
          {/* Campo para buscar ou adicionar opção */}
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[#c6cfdb] bg-white px-3 focus-within:border-[#1b3a60]">
            <Search size={16} className="shrink-0 text-[#5a6a80]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom(searchQuery);
                }
              }}
              placeholder={`Buscar ou adicionar opção para ${label.toLowerCase()}...`}
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-[#1d2a3d] outline-none placeholder:text-[#78879a]"
            />
            <button
              type="button"
              onClick={() => handleAddCustom(searchQuery)}
              disabled={!searchQuery.trim()}
              aria-label={`Adicionar a ${label.toLowerCase()}`}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#1b3a60] px-3 text-xs font-bold text-white transition-colors hover:bg-[#244d7e] disabled:opacity-40"
            >
              <Plus size={14} />
              <span>Adicionar</span>
            </button>
          </div>

          {/* Sugestões rápidas para preencher */}
          {displaySuggestions.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-[#5a6a80]">
                <span>
                  {searchQuery.trim().length >= 2
                    ? 'Opções encontradas — clique para selecionar:'
                    : 'Opções rápidas para preencher (clique para marcar):'}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2"
                aria-label={`Sugestões para ${label.toLowerCase()}`}
              >
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
                          ? 'border border-[#1b3a60] bg-[#1b3a60] text-white shadow-xs'
                          : 'border border-[#c6cfdb] bg-white text-[#1b3a60] hover:border-[#1f7fe0] hover:bg-[#f1f7ff]'
                      }`}
                    >
                      {isSelected ? (
                        <Check size={13} strokeWidth={2.5} className="shrink-0" />
                      ) : (
                        <Plus size={13} strokeWidth={2.5} className="shrink-0 text-[#1f7fe0]" />
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
        className="w-full rounded-xl border border-[#c6cfdb] bg-white p-3.5 text-sm text-[#1d2a3d] outline-none focus:border-[#1b3a60]"
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
      <legend className="mb-2 text-sm font-bold text-[#1d2a3d]">{label}</legend>
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
            className={`min-h-10 rounded-xl border px-5 text-sm font-semibold transition-colors ${
              value === choice.value
                ? 'border-[#1b3a60] bg-[#1b3a60] text-white'
                : 'border-[#c6cfdb] bg-white text-[#5a6a80] hover:border-[#1b3a60]'
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
  // No celular as seções funcionam como acordeão; no desktop todas ficam abertas.
  // `null` = todas recolhidas.
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
        className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#f0b8b2] bg-white p-5 sm:p-8 text-center text-[#a13a30]"
      >
        Não foi possível carregar sua anamnese. Tente novamente mais tarde.
      </div>
    );
  }

  const conditionInput = <ConditionInput onAdd={addCondition} />;

  const resumoSecoes = contarSecoes({
    bloodType,
    surgeries,
    observations,
    conditions,
    allergies,
    medications,
    habits,
    familyHistory,
    donor,
    smoker,
    alcohol,
  });

  const condicoesMarcadas = conditions.filter((condition) => condition.tem);

  const resumoItens: { key: SecaoId; preenchidos: number; total: number; extra?: string }[] = [
    { key: 'gerais', preenchidos: resumoSecoes.gerais.preenchidos, total: resumoSecoes.gerais.total },
    {
      key: 'condicoes',
      preenchidos: resumoSecoes.condicoes.preenchidos,
      total: resumoSecoes.condicoes.total,
      extra: condicoesMarcadas.length > 0 ? `${condicoesMarcadas.length} em acompanhamento` : undefined,
    },
    {
      key: 'alergias',
      preenchidos: resumoSecoes.alergias.preenchidos,
      total: resumoSecoes.alergias.total,
      extra:
        allergies.length + medications.length > 0
          ? `${allergies.length} alergia(s) · ${medications.length} medicamento(s)`
          : undefined,
    },
    { key: 'habitos', preenchidos: resumoSecoes.habitos.preenchidos, total: resumoSecoes.habitos.total },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1240px] px-5 pb-16 pt-9 text-[#1d2a3d] sm:px-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1f7fe0]">
            Ficha de saúde
          </div>
          <h1 className="mb-0 mt-2 text-3xl font-extrabold tracking-[-0.035em] text-[#1b3a60] sm:text-4xl">
            Anamnese
          </h1>
          <p className="mb-0 mt-1.5 text-sm text-[#5a6a80] sm:text-base">
            Seu histórico de saúde, reunido em um só lugar.
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#c9d9ee] bg-[#edf5ff] p-4 text-sm leading-relaxed text-[#315477]">
        <ShieldCheck size={19} className="mt-0.5 shrink-0" />
        <p className="mb-0">
          Preencha apenas o que quiser — os campos são opcionais. Estas informações aparecem na
          <strong className="font-bold"> Visão geral</strong> e na
          <strong className="font-bold"> ficha de emergência</strong>.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-12">
        {/* Resumo: mostra de imediato o que já está preenchido, em vez de uma tela vazia. */}
        <aside className="lg:col-span-4 lg:order-2 xl:col-span-4">
          <div className="lg:sticky lg:top-24">
            <section
              aria-label="Resumo da ficha"
              className="rounded-2xl border border-[#dde3ec] bg-white p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]"
            >
              <div className="px-2 pb-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5a6a80]">
                  Sua ficha
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#5a6a80]">
                  Escolha uma seção para adicionar ou revisar suas informações.
                </p>
              </div>

              <ul className="space-y-1 border-t border-[#dde3ec] pt-3">
                {resumoItens.map(({ key, preenchidos, total, extra }) => {
                  const secao = SECOES.find((item) => item.id === key)!;
                  const Icone = secao.icon;
                  const completo = preenchidos >= total;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => {
                          setSecaoAberta(key);
                          document
                            .getElementById(`secao-${key}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[#f7f9fc]"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            completo ? 'bg-[#e6f4ea] text-[#1f7a45]' : 'bg-[#f1f4f8] text-[#5a6a80]'
                          }`}
                        >
                          {completo ? <Check size={15} strokeWidth={2.5} /> : <Icone size={15} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-[#1d2a3d]">
                            {secao.titulo}
                          </span>
                          {extra && (
                            <span className="block truncate text-[11px] text-[#5a6a80]">{extra}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <p className="mt-3 px-1 text-xs leading-relaxed text-[#78879a]">
              Alterações só são gravadas quando você toca em <strong className="font-bold">Salvar anamnese</strong>.
            </p>
          </div>
        </aside>

        {/* Formulário */}
        <div className="space-y-5 lg:col-span-8 lg:order-1">
          <section id="secao-gerais" className="scroll-mt-24 rounded-2xl border border-[#dde3ec] bg-white p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:p-6">
            <button
              type="button"
              onClick={() => setSecaoAberta(secaoAberta === 'gerais' ? null : 'gerais')}
              aria-expanded={secaoAberta === 'gerais'}
              className="flex w-full items-center gap-3 text-left lg:cursor-default"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5eefb] text-[#1b3a60]">
                <Droplet size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-lg font-bold text-[#1b3a60]">Dados gerais</h2>
                  <span className="rounded-full bg-[#f1f4f8] px-2 py-0.5 text-[11px] font-bold text-[#5a6a80]">
                    {resumoSecoes.gerais.preenchidos}/{resumoSecoes.gerais.total}
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] text-[#5a6a80]">
                  Tipo sanguíneo, cirurgias e observações
                </span>
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-[#5a6a80] transition-transform lg:hidden ${
                  secaoAberta === 'gerais' ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className={`mt-5 ${secaoAberta === 'gerais' ? '' : 'hidden'} lg:block`}>
              <div className="space-y-5">
            <div>
              <label
                htmlFor="blood-type"
                className="mb-1.5 block text-sm font-bold"
              >
                Tipo sanguíneo
              </label>
              <select
                id="blood-type"
                value={bloodType}
                onChange={(event) => setBloodType(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#c6cfdb] bg-white px-3 text-sm outline-none focus:border-[#1b3a60] sm:max-w-xs"
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

          <section id="secao-condicoes" className="scroll-mt-24 rounded-2xl border border-[#dde3ec] bg-white p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:p-6">
            <button
              type="button"
              onClick={() => setSecaoAberta(secaoAberta === 'condicoes' ? null : 'condicoes')}
              aria-expanded={secaoAberta === 'condicoes'}
              className="flex w-full items-center gap-3 text-left lg:cursor-default"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5eefb] text-[#1b3a60]">
                <HeartPulse size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-lg font-bold text-[#1b3a60]">Condições de saúde</h2>
                  <span className="rounded-full bg-[#f1f4f8] px-2 py-0.5 text-[11px] font-bold text-[#5a6a80]">
                    {condicoesMarcadas.length > 0
                      ? `${condicoesMarcadas.length} registrada(s)`
                      : 'nada marcado'}
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] text-[#5a6a80]">
                  Doenças e condições que você acompanha
                </span>
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-[#5a6a80] transition-transform lg:hidden ${
                  secaoAberta === 'condicoes' ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className={`mt-5 ${secaoAberta === 'condicoes' ? '' : 'hidden'} lg:block`}>
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div
                key={normalizeAnamneseTerm(condition.nome)}
                className="rounded-xl border border-[#dde3ec] p-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    id={`condition-${index}`}
                    type="checkbox"
                    checked={condition.tem}
                    onChange={(event) =>
                      updateCondition(index, { tem: event.target.checked })
                    }
                    className="h-4 w-4 accent-[#1b3a60]"
                  />
                  <label
                    htmlFor={`condition-${index}`}
                    className="min-w-0 flex-1 text-sm font-semibold"
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5a6a80] hover:bg-[#f1f4f8] hover:text-[#a13a30]"
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
                    className="ml-7 mt-2 min-h-10 w-[calc(100%-1.75rem)] rounded-lg border border-[#dde3ec] px-3 text-sm outline-none focus:border-[#1b3a60]"
                  />
                )}
              </div>
            ))}
            {conditions.length === 0 && (
              <p className="mb-0 flex items-center gap-2 rounded-xl bg-[#f7f9fc] p-3 text-sm text-[#78879a]">
                <Info size={14} className="shrink-0" />
                Nenhuma condição registrada ainda. Use o campo abaixo ou as sugestões.
              </p>
            )}
          </div>
          {conditionInput}
            </div>
          </section>

          <section id="secao-alergias" className="scroll-mt-24 rounded-2xl border border-[#dde3ec] bg-white p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:p-6">
            <button
              type="button"
              onClick={() => setSecaoAberta(secaoAberta === 'alergias' ? null : 'alergias')}
              aria-expanded={secaoAberta === 'alergias'}
              className="flex w-full items-center gap-3 text-left lg:cursor-default"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5eefb] text-[#1b3a60]">
                <Pill size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-lg font-bold text-[#1b3a60]">Alergias e medicamentos</h2>
                  <span className="rounded-full bg-[#f1f4f8] px-2 py-0.5 text-[11px] font-bold text-[#5a6a80]">
                    {allergies.length} alergia(s) · {medications.length} medicamento(s)
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] text-[#5a6a80]">
                  O que você não pode tomar e o que usa todos os dias
                </span>
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-[#5a6a80] transition-transform lg:hidden ${
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

          <section id="secao-habitos" className="scroll-mt-24 rounded-2xl border border-[#dde3ec] bg-white p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:p-6">
            <button
              type="button"
              onClick={() => setSecaoAberta(secaoAberta === 'habitos' ? null : 'habitos')}
              aria-expanded={secaoAberta === 'habitos'}
              className="flex w-full items-center gap-3 text-left lg:cursor-default"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5eefb] text-[#1b3a60]">
                <Moon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-lg font-bold text-[#1b3a60]">Hábitos e histórico</h2>
                  <span className="rounded-full bg-[#f1f4f8] px-2 py-0.5 text-[11px] font-bold text-[#5a6a80]">
                    {resumoSecoes.habitos.preenchidos}/{resumoSecoes.habitos.total}
                  </span>
                </span>
                <span className="mt-0.5 block text-[13px] text-[#5a6a80]">
                  Rotina, histórico familiar e doação de órgãos
                </span>
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-[#5a6a80] transition-transform lg:hidden ${
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
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3 rounded-2xl border border-[#dde3ec] bg-white p-4 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
        <span className="mr-auto hidden self-center text-sm text-[#5a6a80] sm:block">
          Você pode salvar agora e editar sua ficha quando quiser.
        </span>
        <button
          type="button"
          onClick={() => setLocation('/visao-geral')}
          className="min-h-11 rounded-xl border border-[#c6cfdb] bg-white px-5 text-sm font-bold text-[#1b3a60] hover:bg-[#f1f4f8]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1b3a60] px-5 text-sm font-bold text-white hover:bg-[#244d7e] disabled:opacity-60"
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
      <label htmlFor="add-condition" className="mb-1.5 block text-sm font-bold">
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
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#c6cfdb] px-3 text-sm outline-none focus:border-[#1b3a60]"
        />
        <button
          type="button"
          onClick={() => add(value)}
          disabled={!value.trim()}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#1b3a60] px-4 text-sm font-bold text-white hover:bg-[#244d7e] disabled:opacity-50 transition-colors"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-[#c6cfdb] bg-white px-3 py-1.5 text-xs font-semibold text-[#1b3a60] hover:border-[#1f7fe0] hover:bg-[#f1f7ff] transition-colors"
              >
                <Plus size={13} className="text-[#1f7fe0]" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
