import { useState, useEffect, type FormEvent } from 'react';
import { Check, ClipboardList, FileText, Save } from 'lucide-react';
import { useGetApiFichaMedicaMe, usePatchApiFichaMedicaMe } from '@workspace/api-client-react';

const PREDEFINED_CONDITIONS = [
  'Hipertensão (Pressão alta)',
  'Diabetes',
  'Doenças Cardíacas (Infarto, arritmias, etc.)',
  'Câncer (Oncológicas)',
  'Doenças Respiratórias (Asma, DPOC, etc.)',
  'Doenças Renais'
];

type ConditionState = { nome: string; tem: boolean; detalhes: string };

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
    allergies: '',
    chronicDiseases: '',
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
        allergies: r.alergias ? r.alergias.join(', ') : '',
        chronicDiseases: r.doencasCronicas ? r.doencasCronicas.join(', ') : '',
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

  const set = (key: keyof typeof form, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));
  
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
          alergias: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(s => s) : [],
          doencasCronicas: form.chronicDiseases ? form.chronicDiseases.split(',').map(s => s.trim()).filter(s => s) : []
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
            <Field label="Outras doenças ou condições crônicas" value={form.outrasDoencas} onChange={(v) => set('outrasDoencas', v)} id="outras-doencas" textarea />
          </div>
          
          <div className="pt-4 border-t border-border/70">
            <h3 className="text-sm font-bold mb-3">Informações Importantes</h3>
            <div className="grid gap-5 pt-2 md:grid-cols-2">
              <Field label="Tipo sanguíneo" value={form.bloodType} onChange={(v) => set('bloodType', v)} id="blood-type" />
              <Field label="Alergias (separadas por vírgula)" value={form.allergies} onChange={(v) => set('allergies', v)} id="allergies" />
              <Field label="Doenças crônicas (separadas por vírgula)" value={form.chronicDiseases} onChange={(v) => set('chronicDiseases', v)} id="chronic-diseases" />
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/60 p-4">
                <input type="checkbox" checked={form.organDonor} onChange={(e) => set('organDonor', e.target.checked)} data-testid="checkbox-organ-donor" className="h-4 w-4 accent-[hsl(var(--accent))]" />
                <span><span className="block text-xs font-bold">Sou doadora de órgãos</span></span>
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