import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Check, ClipboardList, Droplets, FileText, Plus, Save, Search, X } from 'lucide-react';
import { useGetApiFichaMedicaMe, usePatchApiFichaMedicaMe } from '@workspace/api-client-react';
import { CatalogAutocomplete } from '@/components/CatalogAutocomplete';

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

const HABIT_OPTIONS = [
  'Pratico exercícios regulares', 'Sedentário(a)', 'Musculação / Crossfit', 'Corrida / Caminhada', 'Natação / Ciclismo', 
  'Durmo 8h/dia', 'Durmo menos de 6h', 'Insônia', 'Ronco / Apneia',
  'Alimentação balanceada', 'Dieta restritiva / Jejum', 'Consumo muito doce/açúcar', 'Bebo 2L+ de água por dia',
  'Uso de telas antes de dormir', 'Meditação / Yoga', 'Terapia Psicológica'
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

import { useLocation } from 'wouter';

export default function Record() {
  const [, setLocation] = useLocation();
  const { data: recordRaw, isLoading, refetch } = useGetApiFichaMedicaMe();
  const patchFicha = usePatchApiFichaMedicaMe();

  const [conditions, setConditions] = useState<ConditionState[]>([]);
  const [form, setForm] = useState({
    familyHistory: '',
    surgeries: '',
    smoker: false,
    alcohol: false,
    habitsList: [] as string[],
    notes: '',
    outrasDoencas: '',
    bloodType: '',
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    medicamentosContinuos: [] as string[],
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
        habitsList: r.habitosGerais ? r.habitosGerais.split(',').map((h: string) => h.trim()).filter(Boolean) : [],
        notes: r.observacoes || '',
        outrasDoencas: r.outrasDoencas || '',
        bloodType: r.tipoSanguineo || '',
        allergies: r.alergias || [],
        chronicDiseases: r.doencasCronicas || [],
        medicamentosContinuos: r.medicamentosContinuos || [],
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

  const save = async (event?: FormEvent) => { 
    if (event) event.preventDefault();
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
          habitosGerais: form.habitsList.join(', '),
          observacoes: form.notes,
          condicoes: conditions,
          outrasDoencas: form.outrasDoencas,
          tipoSanguineo: form.bloodType,
          doadorOrgaos: form.organDonor,
          alergias: form.allergies,
          doencasCronicas: form.chronicDiseases,
          medicamentosContinuos: form.medicamentosContinuos
        } as any
      });
      setSaved(true); 
      // Do not await refetch() on auto-save to prevent focus loss issues
      window.setTimeout(() => setSaved(false), 2400); 

      // Se for um clique manual no botão Salvar (tem event), redireciona
      if (event) {
        setLocation('/visao-geral');
      }
    } catch (err) {
      setError('Erro ao salvar ficha.');
    }
  };

  // Auto-save debounce
  useEffect(() => {
    if (!recordRaw) return; // Only auto-save if we have loaded the data
    const timer = setTimeout(() => {
      save();
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, conditions]);

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando ficha médica...</div>;
  }

  return <div className="page-enter mx-auto max-w-4xl space-y-3">
    <section>
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">contexto de saúde</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-[-.06em] md:text-3xl">Minha anamnese</h1>
      <p className="mt-1 max-w-[570px] text-xs leading-5 text-muted-foreground">Atualize suas informações de saúde. Suas respostas são salvas automaticamente.</p>
    </section>
    
    <form onSubmit={save} className="space-y-3">
      <section id="sec-disease" className="rounded-xl border border-border bg-card p-3.5 md:p-4">
        <div className="flex items-start gap-3 border-b border-border/70 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-accent"><ClipboardList size={17} /></span>
          <div>
            <h2 className="text-sm font-extrabold">Histórico de Doenças</h2>
            <p className="text-[11px] text-muted-foreground">Condições crônicas e histórico de saúde pessoal.</p>
          </div>
        </div>
        
        <div className="mt-3 space-y-2.5">
          {conditions.map((cond, index) => (
            <div key={cond.nome} className={`rounded-xl border transition-colors ${cond.tem ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'} p-2.5 md:p-3`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm font-bold">{cond.nome}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateCondition(index, 'tem', true)} className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${cond.tem ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-background text-muted-foreground hover:bg-muted border border-border'}`}>Sim</button>
                  <button type="button" onClick={() => { updateCondition(index, 'tem', false); updateCondition(index, 'detalhes', ''); }} className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${!cond.tem ? 'bg-secondary text-secondary-foreground shadow-sm border border-transparent' : 'bg-background text-muted-foreground hover:bg-muted border border-border'}`}>Não</button>
                </div>
              </div>
              
              {cond.tem && (
                <div className="mt-3 pt-3 border-t border-accent/20 page-enter">
                  <Field label="Detalhes (quando diagnosticado, medicações em uso, etc)" value={cond.detalhes} onChange={(v) => updateCondition(index, 'detalhes', v)} id={`cond-${index}`} textarea />
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-2">
            <Field label="Outras doenças ou observações de saúde" value={form.outrasDoencas} onChange={(v) => set('outrasDoencas', v)} id="outras-doencas" textarea />
          </div>
          
          <div className="pt-3 border-t border-border/70">
            <h3 className="text-sm font-bold mb-3">Informações Importantes</h3>
            <div className="space-y-4">

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
              <div id="sec-allergy">
                <AutocompleteMultiSelect
                  label="Alergias conhecidas"
                  placeholder="Digite para pesquisar alergias (ex: Dipirona, Penicilina, Amendoim)..."
                  options={ALLERGY_OPTIONS}
                  selected={form.allergies}
                  onChange={(items) => set('allergies', items)}
                  chipColorClass="bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20"
                />
              </div>

              {/* Chronic Diseases Autocomplete Multi-Select */}
              <AutocompleteMultiSelect
                label="Doenças crônicas"
                placeholder="Digite para pesquisar doenças (ex: Hipertensão, Diabetes, Asma)..."
                options={CHRONIC_DISEASE_OPTIONS}
                selected={form.chronicDiseases}
                onChange={(items) => set('chronicDiseases', items)}
                chipColorClass="bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-200 hover:bg-orange-500/20"
              />

              {/* Medicamentos Continuos */}
              <div className="space-y-1">
              <CatalogAutocomplete
                  label="Medicamentos de uso contínuo"
                  selected={form.medicamentosContinuos}
                  onChange={(items) => set('medicamentosContinuos', items)}
                  sourceOptions={[{ value: 'medicamentos', label: 'Medicamentos' }]}
                  allowCustomEntry
              />
                <p className="text-[11px] text-muted-foreground">
                  Busque no catálogo ou digite o nome e pressione Enter para adicionar.
                </p>
              </div>

              {/* Organ donor */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/60 p-4">
                <input type="checkbox" checked={form.organDonor} onChange={(e) => set('organDonor', e.target.checked)} data-testid="checkbox-organ-donor" className="h-4 w-4 accent-[hsl(var(--accent))]" />
                <span><span className="block text-xs font-bold">Sou doador(a) de órgãos</span><span className="mt-0.5 block text-[10px] text-muted-foreground">Esta informação fica visível no seu resumo médico.</span></span>
              </label>
            </div>
          </div>
          
          <div id="sec-blood" className="pt-3 border-t border-border/70">
            <div id="sec-family" className="grid gap-4 pt-3 md:grid-cols-2">
              <Field label="Histórico familiar (Ex: Mãe teve câncer, Pai infartou)" value={form.familyHistory} onChange={(v) => set('familyHistory', v)} id="family-history" />
              <Field label="Cirurgias e internações prévias" value={form.surgeries} onChange={(v) => set('surgeries', v)} id="surgeries" />
            </div>
          </div>
        </div>
      </section>
      
      <section id="sec-habits" className="rounded-xl border border-border bg-card p-3.5 md:p-4">
        <div className="flex items-start gap-3 border-b border-border/70 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-accent"><FileText size={17} /></span>
          <div>
            <h2 className="text-sm font-extrabold">Hábitos e rotina</h2>
          </div>
        </div>
        
        <div className="grid gap-2 pt-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/60 p-3">
            <input type="checkbox" checked={form.smoker} onChange={(e) => set('smoker', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--accent))]" />
            <span><span className="block text-xs font-bold">Fuma</span></span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/60 p-3">
            <input type="checkbox" checked={form.alcohol} onChange={(e) => set('alcohol', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--accent))]" />
            <span><span className="block text-xs font-bold">Consome álcool</span></span>
          </label>
        </div>
        
        <div className="mt-6">
          <AutocompleteMultiSelect
            label="Outros hábitos e estilo de vida"
            placeholder="Digite para adicionar (ex: Durmo 8h, Sedentário)..."
            options={HABIT_OPTIONS}
            selected={form.habitsList}
            onChange={(items) => set('habitsList', items)}
            chipColorClass="bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
          />
        </div>
        <div className="mt-5">
          <Field label="Algo mais que seu médico deveria saber?" value={form.notes} onChange={(v) => set('notes', v)} id="notes" textarea />
        </div>
      </section>
      
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row border-t border-border/60 pt-4 pb-12">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Check size={13} className={saved ? "text-emerald-500" : "text-muted-foreground/50"} /> 
          {patchFicha.isPending ? 'Salvando alterações...' : saved ? 'Todas as alterações foram salvas' : 'Preencha com cuidado'}
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500 font-bold">{error}</span>}
          <button type="submit" disabled={patchFicha.isPending} data-testid="button-save-record" className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 disabled:opacity-50">
            {saved ? <><Check size={15} /> Salvo</> : <><Save size={15} /> Salvar</>}
          </button>
        </div>
      </div>
    </form>
  </div>;
}

function Field({ label, value, onChange, id, textarea = false, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; id: string; textarea?: boolean; placeholder?: string }) {
  return <label className="block">
    <span className="mb-2 block text-[11px] font-bold">{label}</span>
    {textarea ? 
      <textarea value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-record-${id}`} placeholder={placeholder} rows={2} className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground/45 focus:ring-4 focus:ring-accent/10" /> : 
      <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-record-${id}`} placeholder={placeholder} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none placeholder:text-muted-foreground/45 focus:ring-4 focus:ring-accent/10" />
    }
  </label>;
}
