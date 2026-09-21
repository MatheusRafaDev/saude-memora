import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Check, ClipboardList, Droplets, FileText, Plus, Save, Search, X } from 'lucide-react';
import { useGetApiFichaMedicaMe, usePatchApiFichaMedicaMe } from '@workspace/api-client-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ALLERGY_OPTIONS = [
  'Dipirona', 'Penicilina', 'Amoxicilina', 'AAS / Aspirina',
  'Anti-inflamatórios (AINE)', 'Sulfas', 'Contraste iodado',
  'Látex', 'Pólen', 'Pelo de animais', 'Ácaros', 'Mofo',
  'Amendoim', 'Frutos do mar', 'Leite / Lactose', 'Glúten', 'Ovo', 'Soja', 'Nozes / Castanhas'
];

const CHRONIC_DISEASE_OPTIONS = [
  'Hipertensão (Pressão alta)', 'Diabetes Tipo 1', 'Diabetes Tipo 2',
  'Doença Cardíaca', 'Insuficiência Cardíaca', 'Arritmia Cardíaca',
  'Câncer / Oncológica', 'Asma', 'DPOC (Bronquite / Enfisema)', 'Fibromialgia',
  'Artrite / Artrose', 'Osteoporose', 'Depressão', 'Ansiedade',
  'Epilepsia', 'Doença Renal Crônica', 'Hipotireoidismo', 'Hipertireoidismo',
  'Doença Celíaca', 'Lúpus', 'Doença de Parkinson', 'Alzheimer', 'Refluxo Gastroesofágico'
];

const PREDEFINED_CONDITIONS = [
  'Hipertensão (Pressão alta)',
  'Diabetes',
  'Doenças Cardíacas (Infarto, arritmias, etc.)',
  'Câncer (Oncológicas)',
  'Doenças Respiratórias (Asma, DPOC, etc.)',
  'Doenças Renais'
];

type ConditionState = { nome: string; tem: boolean; detalhes: string };

function AutocompleteMultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
  chipColorClass = 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20'
}: {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (items: string[]) => void;
  chipColorClass?: string;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredOptions = options.filter(
    opt => normalize(opt).includes(normalize(query)) && !selected.includes(opt)
  );

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const removeItem = (item: string) => {
    onChange(selected.filter(i => i !== item));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-foreground">{label}</label>
        {selected.length > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground">{selected.length} selecionada(s)</span>
        )}
      </div>

      {/* Selected Items / Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {selected.map(item => (
            <span
              key={item}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${chipColorClass}`}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                title="Remover"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field + Dropdown */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredOptions.length > 0 && query.trim()) {
                  addItem(filteredOptions[0]);
                } else if (query.trim()) {
                  addItem(query.trim());
                }
              }
            }}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-input bg-background px-4 pr-10 text-xs font-medium outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          <div className="absolute right-3 text-muted-foreground pointer-events-none">
            <Search size={16} />
          </div>
        </div>

        {/* Floating Suggestion List */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-border bg-card dropdown-opaque p-1.5 shadow-2xl">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => addItem(opt)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-accent/10 hover:text-accent transition-colors text-left"
                >
                  <span>{opt}</span>
                  <Plus size={14} className="text-muted-foreground opacity-60" />
                </button>
              ))
            ) : query.trim() ? (
              <button
                type="button"
                onClick={() => addItem(query.trim())}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-accent hover:bg-accent/10 transition-colors"
              >
                <Plus size={14} />
                <span>Adicionar "{query.trim()}"</span>
              </button>
            ) : (
              <div className="px-3 py-3 text-xs text-muted-foreground text-center font-medium">
                Digite para buscar opções disponíveis...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Record() {
  const { data: recordRaw, isLoading, refetch } = useGetApiFichaMedicaMe();
  const patchFicha = usePatchApiFichaMedicaMe();

  const [conditions, setConditions] = useState<ConditionState[]>([]);
  const [form, setForm] = useState({
    familyHistory: '',
    surgeries: '',
    smoker: false,
    alcohol: false,
    habits: '',
    notes: '',
    outrasDoencas: '',
    bloodType: '',
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    organDonor: false
  });
  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (recordRaw) {
      const r = recordRaw as unknown as any;
      setForm({
        familyHistory: r.historicoFamiliar || '',
        surgeries: r.cirurgias || '',
        smoker: !!r.fuma,
        alcohol: !!r.bebe,
        habits: r.habitosGerais || '',
        notes: r.observacoes || '',
        outrasDoencas: r.outrasDoencas || '',
        bloodType: r.tipoSanguineo || '',
        allergies: r.alergias || [],
        chronicDiseases: r.doencasCronicas || [],
        organDonor: !!r.doadorOrgaos
      });

      // Merge backend conditions with predefined list
      const savedConditions = (r.condicoes || []) as ConditionState[];
      const merged = PREDEFINED_CONDITIONS.map(name => {
        const existing = savedConditions.find(c => c.nome === name);
        return existing || { nome: name, tem: false, detalhes: '' };
      });
      setConditions(merged);
    }
  }, [recordRaw]);

  const set = (key: keyof typeof form, value: any) => setForm((old) => ({ ...old, [key]: value }));
  
  const updateCondition = (index: number, key: keyof ConditionState, value: string | boolean) => {
    setConditions(old => {
      const copy = [...old];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const save = async (event: FormEvent) => { 
    event.preventDefault();
    setError('');
    setSaved(false);

    try {
      await patchFicha.mutateAsync({
        data: {
          patientId: (recordRaw as unknown as any)?.patientId || 'unknown',
          historicoFamiliar: form.familyHistory,
          cirurgias: form.surgeries,
          fuma: form.smoker,
          bebe: form.alcohol,
          habitosGerais: form.habits,
          observacoes: form.notes,
          condicoes: conditions,
          outrasDoencas: form.outrasDoencas,
          tipoSanguineo: form.bloodType,
          doadorOrgaos: form.organDonor,
          alergias: form.allergies,
          doencasCronicas: form.chronicDiseases
        } as any
      });
      setSaved(true); 
      await refetch();
      window.setTimeout(() => setSaved(false), 2400); 
    } catch (err) {
      setError('Erro ao salvar ficha.');
    }
  };

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando ficha médica...</div>;
  }

  return <div className="page-enter mx-auto max-w-[980px] space-y-8">
    <section>
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">contexto de saúde</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">Minha anamnese</h1>
      <p className="mt-2 max-w-[570px] text-sm leading-6 text-muted-foreground">Um pouco mais sobre você ajuda a tornar cada conversa médica mais completa. Atualize quando quiser.</p>
    </section>
    
    <form onSubmit={save} className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
        <div className="flex items-start gap-3 border-b border-border/70 pb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent"><ClipboardList size={19} /></span>
          <div>
            <h2 className="text-base font-extrabold">Histórico de Doenças</h2>
            <p className="mt-1 text-xs text-muted-foreground">Condições crônicas e histórico de saúde pessoal.</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-5">
          {conditions.map((cond, index) => (
            <div key={cond.nome} className={`rounded-xl border transition-colors ${cond.tem ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'} p-4 md:p-5`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-sm font-bold">{cond.nome}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateCondition(index, 'tem', true)} className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${cond.tem ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-background text-muted-foreground hover:bg-muted border border-border'}`}>Sim</button>
                  <button type="button" onClick={() => { updateCondition(index, 'tem', false); updateCondition(index, 'detalhes', ''); }} className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${!cond.tem ? 'bg-secondary text-secondary-foreground shadow-sm border border-transparent' : 'bg-background text-muted-foreground hover:bg-muted border border-border'}`}>Não</button>
                </div>
              </div>
              
              {cond.tem && (
                <div className="mt-4 pt-4 border-t border-accent/20 page-enter">
                  <Field label="Detalhes (quando diagnosticado, medicações em uso, etc)" value={cond.detalhes} onChange={(v) => updateCondition(index, 'detalhes', v)} id={`cond-${index}`} textarea />
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-2">
            <Field label="Outras doenças ou observações de saúde" value={form.outrasDoencas} onChange={(v) => set('outrasDoencas', v)} id="outras-doencas" textarea />
          </div>
          
          <div className="pt-4 border-t border-border/70">
            <h3 className="text-sm font-bold mb-4">Informações Importantes</h3>
            <div className="space-y-6">

              {/* Blood Type Select */}
              <div>
                <span className="mb-2 flex items-center gap-1.5 text-xs font-bold"><Droplets size={14} className="text-red-500" /> Tipo sanguíneo</span>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_TYPES.map(bt => (
                    <button
                      key={bt} type="button"
                      onClick={() => set('bloodType', form.bloodType === bt ? '' : bt)}
                      className={`rounded-xl border px-4 py-2 text-xs font-extrabold transition-all ${
                        form.bloodType === bt
                          ? 'border-red-400 bg-red-50 text-red-700 shadow-sm dark:bg-red-950/40 dark:text-red-300 dark:border-red-600'
                          : 'border-border bg-background text-muted-foreground hover:border-red-300 hover:bg-red-50/50'
                      }`}
                    >{bt}</button>
                  ))}
                </div>
              </div>

              {/* Allergies Autocomplete Multi-Select */}
              <AutocompleteMultiSelect
                label="Alergias conhecidas"
                placeholder="Digite para pesquisar alergias (ex: Dipirona, Penicilina, Amendoim)..."
                options={ALLERGY_OPTIONS}
                selected={form.allergies}
                onChange={(items) => set('allergies', items)}
                chipColorClass="bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20"
              />

              {/* Chronic Diseases Autocomplete Multi-Select */}
              <AutocompleteMultiSelect
                label="Doenças crônicas"
                placeholder="Digite para pesquisar doenças (ex: Hipertensão, Diabetes, Asma)..."
                options={CHRONIC_DISEASE_OPTIONS}
                selected={form.chronicDiseases}
                onChange={(items) => set('chronicDiseases', items)}
                chipColorClass="bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-200 hover:bg-orange-500/20"
              />

              {/* Organ donor */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/60 p-4">
                <input type="checkbox" checked={form.organDonor} onChange={(e) => set('organDonor', e.target.checked)} data-testid="checkbox-organ-donor" className="h-4 w-4 accent-[hsl(var(--accent))]" />
                <span><span className="block text-xs font-bold">Sou doador(a) de órgãos</span><span className="mt-0.5 block text-[10px] text-muted-foreground">Esta informação fica visível no seu resumo médico.</span></span>
              </label>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/70">
            <div className="grid gap-5 pt-4 md:grid-cols-2">
              <Field label="Histórico familiar (Ex: Mãe teve câncer, Pai infartou)" value={form.familyHistory} onChange={(v) => set('familyHistory', v)} id="family-history" />
              <Field label="Cirurgias e internações prévias" value={form.surgeries} onChange={(v) => set('surgeries', v)} id="surgeries" />
            </div>
          </div>
        </div>
      </section>
      
      <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
        <div className="flex items-start gap-3 border-b border-border/70 pb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent"><FileText size={19} /></span>
          <div>
            <h2 className="text-base font-extrabold">Hábitos e rotina</h2>
            <p className="mt-1 text-xs text-muted-foreground">Não existe resposta certa. Só a que representa você hoje.</p>
          </div>
        </div>
        
        <div className="grid gap-5 pt-6 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/60 p-4">
            <input type="checkbox" checked={form.smoker} onChange={(e) => set('smoker', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--accent))]" />
            <span><span className="block text-xs font-bold">Fuma</span></span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/60 p-4">
            <input type="checkbox" checked={form.alcohol} onChange={(e) => set('alcohol', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--accent))]" />
            <span><span className="block text-xs font-bold">Consome álcool</span></span>
          </label>
        </div>
        
        <div className="mt-5">
          <Field label="Outros hábitos (Exercício, sono, etc.)" value={form.habits} onChange={(v) => set('habits', v)} id="habits" />
        </div>
        <div className="mt-5">
          <Field label="Algo mais que seu médico deveria saber?" value={form.notes} onChange={(v) => set('notes', v)} id="notes" textarea />
        </div>
      </section>
      
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-[11px] text-muted-foreground">Preencha com cuidado.</p>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500 font-bold">{error}</span>}
          <button type="submit" disabled={patchFicha.isPending} data-testid="button-save-record" className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 disabled:opacity-50">
            {saved ? <><Check size={16} /> Salvo com cuidado</> : <><Save size={16} /> Salvar anamnese</>}
          </button>
        </div>
      </div>
    </form>
  </div>;
}

function Field({ label, value, onChange, id, textarea = false }: { label: string; value: string; onChange: (value: string) => void; id: string; textarea?: boolean }) {
  return <label className="block">
    <span className="mb-2 block text-[11px] font-bold">{label}</span>
    {textarea ? 
      <textarea value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-record-${id}`} rows={3} className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-accent/10" /> : 
      <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-record-${id}`} className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-4 focus:ring-accent/10" />
    }
  </label>;
}
