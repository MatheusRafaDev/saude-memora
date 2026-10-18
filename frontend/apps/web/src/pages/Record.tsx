import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Check,
  Plus,
  Search,
  X,
  Pill,
  Shield,
  LoaderCircle,
  ArrowRight,
  ArrowLeft,
  Heart,
  Save,
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
  getAnamneseQuery,
  HABIT_SUGGESTIONS,
  hasAnamneseEntry,
  normalizeAnamneseTerm,
  SURGERY_SUGGESTIONS,
  toggleAnamneseEntry,
  type AnamneseSuggestion,
} from '@/lib/anamnese-dictionary';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CONDITION_OPTIONS = CONDITION_SUGGESTIONS.slice(0, 5).map(({ label }) => label);

const STEPS = [
  { id: 1, name: 'Dados gerais' },
  { id: 2, name: 'Condições' },
  { id: 3, name: 'Alergias e remédios' },
  { id: 4, name: 'Hábitos' },
  { id: 5, name: 'Revisão' },
];

function SuggestionButtons({
  query,
  dictionary,
  onSelect,
  label,
  maxSuggestions = 6,
}: {
  query: string;
  dictionary: AnamneseSuggestion[];
  onSelect: (suggestion: AnamneseSuggestion) => void;
  label: string;
  maxSuggestions?: number;
}) {
  const suggestions = query.trim().length >= 2
    ? findAnamneseSuggestions(query, dictionary, maxSuggestions)
    : dictionary.slice(0, maxSuggestions);
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-2.5" role="group" aria-label={label}>
      <div className="mb-1.5 text-xs text-[#5a6a80]">
        Opções para preencher rápido:
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E3E8F0] bg-white px-3 py-1.5 text-left text-xs font-semibold text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC] hover:text-[#1D4ED8] transition-all cursor-pointer shadow-xs"
          >
            <Plus size={13} className="text-[#1D4ED8]" />
            <span>{suggestion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestedTextarea({
  value,
  onChange,
  dictionary,
  rows,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  dictionary: AnamneseSuggestion[];
  rows: number;
  placeholder: string;
  label: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const displaySuggestions = dictionary
    ? (searchQuery.trim().length >= 2
        ? findAnamneseSuggestions(searchQuery, dictionary, 10)
        : dictionary.slice(0, 8))
    : [];

  const handleAddCustom = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange(appendAnamneseEntry(value, trimmed));
    setSearchQuery('');
  };

  return (
    <div className="space-y-2.5">
      {dictionary && dictionary.length > 0 && (
        <div className="space-y-2">
          {/* Quick search / add input */}
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-3 focus-within:border-[#1D4ED8]">
            <Search size={16} className="shrink-0 text-[#5B6878]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom(searchQuery);
                }
              }}
              placeholder={`Buscar ou adicionar opção para ${label}...`}
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-[#14211F] outline-none placeholder:text-[#5B6878]"
            />
            <button
              type="button"
              onClick={() => handleAddCustom(searchQuery)}
              disabled={!searchQuery.trim()}
              aria-label={`Adicionar a ${label}`}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#1D4ED8] px-3 text-xs font-semibold text-white transition-all hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Adicionar</span>
            </button>
          </div>

          {/* Quick fill chips / pills */}
          {displaySuggestions.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-[#5B6878]">
                <span>
                  {searchQuery.trim().length >= 2
                    ? 'Opções encontradas — clique para selecionar:'
                    : 'Opções rápidas para preencher (clique para marcar):'}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2"
                aria-label={`Sugestões para ${label}`}
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
                          ? 'border border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-xs'
                          : 'border border-[#E3E8F0] bg-white text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC] hover:text-[#1D4ED8]'
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

      {/* Textarea */}
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E3E8F0] bg-white p-3.5 text-sm text-[#14211F] outline-none focus:border-[#1D4ED8]"
      />
      <p className="mt-1 text-xs text-[#78879a]">
        Você pode marcar as opções sugeridas acima ou escrever/editar livremente no campo de texto.
      </p>
    </div>
  );
}

export default function Record() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: fichaRaw, refetch, isLoading, isError } = useGetApiFichaMedicaMe();
  const patchFicha = usePatchApiFichaMedicaMe();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('Alterações pendentes');

  // Form State
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const [medications, setMedications] = useState<Array<{ nome: string }>>([]);
  const [newMedNome, setNewMedNome] = useState('');
  const [isAddingMed, setIsAddingMed] = useState(false);

  const [isDonor, setIsDonor] = useState(false);
  const [isSmoker, setIsSmoker] = useState(false);
  const [isAlcohol, setIsAlcohol] = useState(false);

  // Conditions
  const [conditionsList, setConditionsList] = useState<Array<{ nome: string; tem: boolean; detalhes?: string }>>(
    CONDITION_OPTIONS.map((nome) => ({ nome, tem: false }))
  );

  const [cirurgias, setCirurgias] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [habitosGerais, setHabitosGerais] = useState('');
  const [historicoFamiliar, setHistoricoFamiliar] = useState('');

  // Load from API
  useEffect(() => {
    if (fichaRaw) {
      const f = fichaRaw as any;
      setBloodType(f.tipoSanguineo || '');
      setAllergies(Array.isArray(f.alergias) ? f.alergias : []);
      setIsDonor(Boolean(f.doadorOrgaos));
      setIsSmoker(Boolean(f.fuma));
      setIsAlcohol(Boolean(f.bebe));
      setHabitosGerais(f.habitosGerais || '');
      setHistoricoFamiliar(f.historicoFamiliar || '');
      setCirurgias(f.cirurgias || '');
      setObservacoes(f.observacoes || '');
      setMedications(
        Array.isArray(f.medicamentosContinuos)
          ? f.medicamentosContinuos.map((m: any) =>
              typeof m === 'string' ? { nome: m } : { nome: m.nome }
            )
          : []
      );

      const storedConditions = Array.isArray(f.condicoes) ? f.condicoes : [];
      const chronicDiseases = Array.isArray(f.doencasCronicas) ? f.doencasCronicas : [];
      const storedByName = new Map(
        storedConditions.map((condition: any) => [condition.nome, condition])
      );
      const allConditionNames = new Set([
        ...CONDITION_OPTIONS,
        ...chronicDiseases,
        ...storedConditions.map((condition: any) => condition.nome),
      ]);
      setConditionsList(
        Array.from(allConditionNames, (nome) => {
          const stored = storedByName.get(nome) as any;
          return {
            nome,
            tem: stored ? Boolean(stored.tem) : chronicDiseases.includes(nome),
            detalhes: stored?.detalhes || '',
          };
        })
      );
    }
  }, [fichaRaw]);

  // Handle add allergy
  const handleAddAllergy = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allergyInput.trim()) {
      e.preventDefault();
      addAllergy(allergyInput);
    }
  };

  const addAllergy = (value: string) => {
    const allergy = value.trim();
    if (!allergy) return;
    if (!allergies.some((item) => normalizeAnamneseTerm(item) === normalizeAnamneseTerm(allergy))) {
      setAllergies((current) => [...current, allergy]);
      setLastSavedText('Alterações pendentes');
    }
    setAllergyInput('');
  };

  const addCondition = (name: string) => {
    const conditionName = name.trim();
    if (!conditionName) return;
    setConditionsList((current) => {
      const existingIndex = current.findIndex(
        (condition) => normalizeAnamneseTerm(condition.nome) === normalizeAnamneseTerm(conditionName),
      );
      if (existingIndex >= 0) {
        return current.map((condition, index) =>
          index === existingIndex ? { ...condition, tem: true } : condition,
        );
      }
      return [...current, { nome: conditionName, tem: true }];
    });
    setConditionInput('');
    setLastSavedText('Alterações pendentes');
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
    setLastSavedText('Alterações pendentes');
  };

  const handleAddMed = () => {
    if (newMedNome.trim()) {
      setMedications([
        ...medications,
        { nome: newMedNome.trim() },
      ]);
      setLastSavedText('Alterações pendentes');
      setNewMedNome('');
      setIsAddingMed(false);
    }
  };

  const handleSaveToApi = async () => {
    try {
      setIsSaving(true);
      await patchFicha.mutateAsync({
        data: {
          tipoSanguineo: bloodType as any,
          alergias: allergies,
          medicamentosContinuos: medications.map((m) => m.nome),
          doencasCronicas: conditionsList.filter((condition) => condition.tem).map((condition) => condition.nome),
          doadorOrgaos: isDonor,
          fuma: isSmoker,
          bebe: isAlcohol,
          habitosGerais,
          historicoFamiliar,
          cirurgias,
          observacoes,
          condicoes: conditionsList,
        } as any,
      });
      setLastSavedText('Salvo agora');
      toast({ title: 'Anamnese atualizada com sucesso!' });
      await refetch();
      return true;
    } catch {
      setLastSavedText('Não foi possível salvar');
      toast({ title: 'Erro ao salvar alterações', variant: 'destructive' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!(await handleSaveToApi())) return;
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({ title: 'Anamnese concluída com sucesso!' });
      setLocation('/visao-geral');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  if (isLoading) {
    return <div className="p-12 text-center text-[#5a6a80]">Carregando sua anamnese…</div>;
  }

  if (isError) {
    return (
      <div role="alert" className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#E8664A]/30 bg-[#E8664A]/10 p-5 sm:p-8 text-center text-[#E8664A]">
        Não foi possível carregar sua anamnese. Tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1D4ED8]">
              Ficha de saúde
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#14211F]">
              Anamnese
            </h1>
            <p className="mt-1.5 mb-0 text-[#5B6878] text-sm sm:text-base">
              Responda no seu ritmo: o progresso é salvo a cada passo.
            </p>
          </div>
        </div>

        {/* Stepper Header Bar */}
        <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-5.5 shadow-xs mb-5 overflow-x-auto">
          <div className="flex gap-4 items-center min-w-[600px]">
            {STEPS.map((s, idx) => {
              const isPassed = s.id < currentStep;
              const isCurrent = s.id === currentStep;

              return (
                <div key={s.id} className="flex-1 flex items-center gap-2.5">
                  <div
                    onClick={() => setCurrentStep(s.id)}
                    className={`w-[34px] h-[34px] rounded-full font-bold flex items-center justify-center text-sm shrink-0 cursor-pointer transition-colors ${
                      isPassed
                        ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8]'
                        : isCurrent
                        ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8] ring-2 ring-[#CFE0FF]'
                        : 'bg-white text-[#5B6878] border border-[#E3E8F0]'
                    }`}
                  >
                    {isPassed ? <Check size={16} strokeWidth={2.5} /> : s.id}
                  </div>
                  <span
                    className={`text-sm whitespace-nowrap ${
                      isCurrent
                        ? 'font-bold text-[#14211F]'
                        : isPassed
                        ? 'font-semibold text-[#14211F]'
                        : 'font-medium text-[#5B6878]'
                    }`}
                  >
                    {s.name}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] transition-colors ${
                        isPassed ? 'bg-[#1D4ED8]' : 'bg-[#E3E8F0]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main 2-col Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Content Card (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#dde3ec] rounded-[20px] p-4 sm:p-8 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            {/* Step 1: Dados gerais */}
            {currentStep === 1 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#1D4ED8] uppercase">
                  Passo 1 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#14211F]">
                  Dados gerais de saúde
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Registre cirurgias anteriores e observações relevantes para sua ficha.
                </p>

                <div className="space-y-5 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-[#14211F] mb-1.5">
                      Tipo sanguíneo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BLOOD_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setBloodType(type === bloodType ? '' : type);
                            setLastSavedText('Alterações pendentes');
                          }}
                          className={`min-h-10 px-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                            bloodType === type
                              ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs'
                              : 'bg-white text-[#14211F] border-[#E3E8F0] hover:bg-[#F4F7FC] hover:border-[#CFE0FF]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#14211F] mb-1.5">
                      Cirurgias anteriores
                    </label>
                    <SuggestedTextarea
                      value={cirurgias}
                      onChange={(value) => {
                        setCirurgias(value);
                        setLastSavedText('Alterações pendentes');
                      }}
                      dictionary={SURGERY_SUGGESTIONS}
                      rows={3}
                      placeholder="Informe cirurgias e, se souber, o ano."
                      label="cirurgias"
                    />
                    <p className="mt-1.5 text-xs text-[#5a6a80]">
                      Sugestões aparecem conforme você digita; inclua o ano ou detalhes que lembrar.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1d2a3d] mb-1.5">
                      Observações
                    </label>
                    <textarea
                      rows={3}
                      value={observacoes}
                      onChange={(e) => {
                        setObservacoes(e.target.value);
                        setLastSavedText('Alterações pendentes');
                      }}
                      placeholder="Outras informações de saúde que deseja registrar."
                      className="w-full p-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Condições */}
            {currentStep === 2 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#1D4ED8] uppercase">
                  Passo 2 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#14211F]">
                  Condições de saúde
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Selecione as condições preexistentes diagnosticadas por um médico.
                </p>

                <div className="space-y-3 mb-6">
                  {conditionsList.map((cond, idx) => (
                    <label
                      key={cond.nome}
                      className="flex items-center gap-3 p-3.5 border border-[#dde3ec] rounded-xl hover:bg-[#F4F7FC] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={cond.tem}
                        onChange={(e) => {
                          const updated = conditionsList.map((condition, conditionIndex) =>
                            conditionIndex === idx
                              ? { ...condition, tem: e.target.checked }
                              : condition
                          );
                          setConditionsList(updated);
                          setLastSavedText('Alterações pendentes');
                        }}
                        className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-[#1D4ED8]"
                      />
                      <span className="text-sm font-semibold text-[#1d2a3d]">
                        {cond.nome}
                      </span>
                    </label>
                  ))}
                </div>
                <div>
                  <label
                    htmlFor="condition-search"
                    className="mb-1.5 block text-sm font-bold text-[#1d2a3d]"
                  >
                    Buscar ou adicionar outra condição
                  </label>
                  <input
                    id="condition-search"
                    type="text"
                    value={conditionInput}
                    onChange={(event) => setConditionInput(event.target.value)}
                    placeholder="Ex.: enxaqueca, tireoide, pressão alta"
                    autoComplete="off"
                    className="w-full rounded-xl border border-[#c6cfdb] p-3.5 text-sm text-[#1d2a3d] outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
                  />
                  <SuggestionButtons
                    query={conditionInput}
                    dictionary={CONDITION_SUGGESTIONS}
                    label="Sugestões de condições de saúde"
                    onSelect={({ label }) => addCondition(label)}
                  />
                  {conditionInput.trim().length >= 2 &&
                    findAnamneseSuggestions(conditionInput, CONDITION_SUGGESTIONS).length === 0 &&
                    !conditionsList.some(
                      (condition) =>
                        normalizeAnamneseTerm(condition.nome) ===
                        normalizeAnamneseTerm(conditionInput),
                    ) && (
                      <button
                        type="button"
                        onClick={() => addCondition(conditionInput)}
                        className="mt-2 rounded-full border border-[#E3E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#14211F] hover:border-[#CFE0FF] hover:bg-[#F4F7FC] transition-colors"
                      >
                        Adicionar “{conditionInput.trim()}”
                      </button>
                    )}
                  <p className="mt-1.5 text-xs text-[#5a6a80]">
                    Marque apenas condições que tenham sido diagnosticadas por um profissional de saúde.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Alergias e remédios */}
            {currentStep === 3 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#1D4ED8] uppercase">
                  Passo 3 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#14211F]">
                  Alergias e medicamentos
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Essas informações ajudam a alertar interações nas suas receitas.
                </p>

                {/* Tipo Sanguíneo */}
                <div className="text-sm font-semibold text-[#14211F] mb-2.5">Tipo sanguíneo</div>
                <div className="flex gap-2 flex-wrap mb-6.5">
                  {BLOOD_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setBloodType(type);
                        setLastSavedText('Alterações pendentes');
                      }}
                      className={`px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all ${
                        bloodType === type
                          ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8] shadow-xs'
                          : 'bg-white text-[#14211F] border border-[#E3E8F0] hover:border-[#CFE0FF] hover:bg-[#F4F7FC]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Alergias */}
                <div className="text-sm font-semibold text-[#14211F] mb-2.5">Alergias</div>
                <div className="h-[46px] w-full border border-[#E3E8F0] rounded-xl bg-white flex items-center gap-2 px-3.5 text-sm text-[#5B6878] focus-within:border-[#1D4ED8]">
                  <Plus size={16} className="text-[#5B6878]" />
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={handleAddAllergy}
                    placeholder="Digite e pressione Enter"
                    className="w-full bg-transparent border-none outline-none text-[#14211F] placeholder:text-[#5B6878] text-sm"
                  />
                </div>
                <SuggestionButtons
                  query={allergyInput}
                  dictionary={ALLERGY_SUGGESTIONS}
                  label="Sugestões de alergias"
                  onSelect={({ label }) => addAllergy(label)}
                />
                <p className="mt-1.5 text-xs text-[#5B6878]">
                  Informe alergias conhecidas; as sugestões são apenas opções para preencher.
                </p>

                {/* Tag Pills */}
                <div className="flex gap-2 flex-wrap my-3 mb-6.5">
                  {allergies.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDE1DA] border border-[#E8664A]/30 text-[#9B2C16] text-xs font-semibold"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeAllergy(item)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Medicamentos contínuos */}
                <div className="flex justify-between items-center mb-2.5">
                  <div className="text-sm font-semibold text-[#14211F]">Medicamentos de uso contínuo</div>
                  <button
                    type="button"
                    onClick={() => setIsAddingMed(true)}
                    className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                {isAddingMed && (
                  <div className="p-4 bg-[#F4F7FC] border border-[#E3E8F0] rounded-xl mb-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Nome do remédio (Ex: Losartana 50mg)"
                      value={newMedNome}
                      onChange={(e) => setNewMedNome(e.target.value)}
                      className="w-full h-11 px-3.5 border border-[#E3E8F0] rounded-xl text-sm bg-white text-[#14211F] outline-none focus:border-[#1D4ED8]"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingMed(false)}
                        className="px-3.5 py-2 text-xs font-semibold text-[#5B6878] hover:bg-[#E3E8F0] rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMed}
                        className="px-4 py-2 text-xs font-semibold bg-[#1D4ED8] text-white rounded-xl hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all shadow-xs"
                      >
                        Salvar remédio
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-[#E3E8F0] mb-4">
                  {medications.length === 0 && (
                    <p className="py-3 text-sm text-[#5B6878]">Nenhum medicamento contínuo informado.</p>
                  )}
                  {medications.map((med, index) => (
                    <div key={index} className="flex items-center gap-3.5 py-3.5">
                      <div className="w-11 h-11 rounded-[14px] bg-[#CFE0FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
                        <Pill size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-[#14211F]">{med.nome}</div>
                      </div>
                      <span className="inline-block px-2.5 py-1 rounded-full bg-[#CFE0FF] text-[#1D4ED8] text-xs font-semibold whitespace-nowrap">
                        Contínuo
                      </span>
                    </div>
                  ))}
                </div>

                {/* Switches */}
                <div className="divide-y divide-[#dde3ec]">
                  <div className="flex justify-between items-center py-3.5 text-[15px] font-semibold">
                    <span>Doador de órgãos</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDonor(!isDonor);
                        setLastSavedText('Alterações pendentes');
                      }}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                        isDonor ? 'bg-[#1D4ED8]' : 'bg-[#c6cfdb]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all shadow-xs ${
                          isDonor ? 'right-[3px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-3.5 text-[15px] font-semibold">
                    <span>Fumante</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSmoker(!isSmoker);
                        setLastSavedText('Alterações pendentes');
                      }}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                        isSmoker ? 'bg-[#1D4ED8]' : 'bg-[#c6cfdb]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all shadow-xs ${
                          isSmoker ? 'right-[3px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex justify-between items-center py-3.5 text-[15px] font-semibold">
                    <span>Consome bebidas alcoólicas</span>
                    <button
                      type="button"
                      aria-pressed={isAlcohol}
                      onClick={() => {
                        setIsAlcohol(!isAlcohol);
                        setLastSavedText('Alterações pendentes');
                      }}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                        isAlcohol ? 'bg-[#1D4ED8]' : 'bg-[#c6cfdb]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all shadow-xs ${
                          isAlcohol ? 'right-[3px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Hábitos */}
            {currentStep === 4 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#1D4ED8] uppercase">
                  Passo 4 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#14211F]">
                  Hábitos e rotina
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Atividade física, sono e histórico relevante na família.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-[#1d2a3d] mb-1.5">
                      Hábitos gerais (Sono, alimentação, atividade física)
                    </label>
                    <SuggestedTextarea
                      value={habitosGerais}
                      onChange={(value) => {
                        setHabitosGerais(value);
                        setLastSavedText('Alterações pendentes');
                      }}
                      dictionary={HABIT_SUGGESTIONS}
                      rows={3}
                      placeholder="Descreva sua alimentação, atividade física, sono e outros hábitos."
                      label="hábitos e rotina"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1d2a3d] mb-1.5">
                      Histórico familiar de saúde
                    </label>
                    <SuggestedTextarea
                      value={historicoFamiliar}
                      onChange={(value) => {
                        setHistoricoFamiliar(value);
                        setLastSavedText('Alterações pendentes');
                      }}
                      dictionary={FAMILY_HISTORY_SUGGESTIONS}
                      rows={2}
                      placeholder="Ex: Diabetes paterno, Hipertensão materna"
                      label="histórico familiar"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Revisão */}
            {currentStep === 5 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#1D4ED8] uppercase">
                  Passo 5 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#14211F]">
                  Revisão da Anamnese
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Confira o resumo das suas informações de saúde antes de finalizar.
                </p>

                <div className="space-y-3 bg-[#f7f9fc] p-5 rounded-2xl border border-[#dde3ec] mb-6 text-sm">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Tipo Sanguíneo:</span>
                    <strong className="text-[#14211F]">{bloodType || 'Não informado'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Alergias:</span>
                    <strong>{allergies.join(', ') || 'Não informado'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Remédios contínuos:</span>
                    <strong>{medications.map((m) => m.nome).join(', ') || 'Não informado'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Doador de órgãos:</span>
                    <strong>{isDonor ? 'Sim' : 'Não'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a6a80]">Fumante:</span>
                    <strong>{isSmoker ? 'Sim' : 'Não'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions: Voltar / Continuar */}
            <div className="flex justify-between items-center mt-6.5 pt-4 border-t border-[#E3E8F0]">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-white text-[#14211F] border border-[#E3E8F0] hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Voltar
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : currentStep === 5 ? (
                  'Concluir Anamnese'
                ) : (
                  'Continuar →'
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Progress & Auto-save Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Progress Card */}
            <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-6 shadow-xs">
              <div className="font-bold text-sm text-[#14211F] mb-3">
                Etapas
              </div>

              <div className="space-y-1">
                {STEPS.map((s) => {
                  const isDone = s.id < currentStep;
                  const isCurrent = s.id === currentStep;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setCurrentStep(s.id)}
                      className={`flex gap-2.5 items-center py-2 text-sm cursor-pointer rounded-lg px-1 transition-colors ${
                        isCurrent
                          ? 'font-bold text-[#14211F]'
                          : isDone
                          ? 'font-semibold text-[#14211F]'
                          : 'font-medium text-[#5B6878]'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-[#CFE0FF] text-[#1D4ED8]'
                            : isCurrent
                            ? 'bg-[#1D4ED8] text-white'
                            : 'bg-[#F4F7FC] text-[#5B6878]'
                        }`}
                      >
                        {isDone ? (
                          <Check size={14} strokeWidth={2.5} />
                        ) : (
                          <span className="text-xs">{s.id}</span>
                        )}
                      </div>
                      {s.name}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-save Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-4.5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-[#CFE0FF]/40 flex items-center justify-center shrink-0">
                  <Shield size={22} className="text-[#1D4ED8]" strokeWidth={2} />
                </div>
                <div>
                  <b className="text-[15px] text-[#1d2a3d] block leading-tight">
                    {lastSavedText}
                  </b>
                  <div className="text-[13px] text-[#5a6a80] mt-0.5">
                    Seus dados são protegidos por criptografia.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          As alterações são enviadas ao servidor ao avançar ou concluir cada etapa.
        </p>
      </main>
    </div>
  );
}
