import { useState, useEffect, type FormEvent } from 'react';
import { Check, CircleUserRound, HeartHandshake, Save, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useGetApiPacientesMe, usePatchApiPacientesMePerfil, useDeleteApiPacientesMe } from '@workspace/api-client-react';
import { useStore } from '@/lib/store';

export default function Profile() {
  const { data: profileRaw, isLoading, refetch } = useGetApiPacientesMe();
  const patchPerfil = usePatchApiPacientesMePerfil();
  const deleteAccount = useDeleteApiPacientesMe();
  const { signOut } = useStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    birthDate: '',
    bloodType: '',
    organDonor: false,
    allergies: '',
    chronicDiseases: ''
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatCpf = (cpf: string) => {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  useEffect(() => {
    if (profileRaw) {
      const p = profileRaw as unknown as any;
      setForm({
        name: p.nome || '',
        email: p.email || '',
        cpf: formatCpf(p.cpf || ''),
        birthDate: p.dataNascimento || '',
        bloodType: p.tipoSanguineo || '',
        organDonor: p.doadorOrgaos || false,
        allergies: (p.alergias || []).join(', '),
        chronicDiseases: (p.doencasCronicas || []).join(', ')
      });
    }
  }, [profileRaw]);

  const set = (key: keyof typeof form, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));
  
  const save = async (event: FormEvent) => { 
    event.preventDefault();
    setError('');
    setSaved(false);

    try {
      await patchPerfil.mutateAsync({
        data: {
          tipoSanguineo: form.bloodType,
          doadorOrgaos: form.organDonor,
          alergias: form.allergies ? form.allergies.split(',').map(s => s.trim()) : [],
          doencasCronicas: form.chronicDiseases ? form.chronicDiseases.split(',').map(s => s.trim()) : [],
          medicamentosContinuos: []
        }
      });

      setSaved(true); 
      await refetch();
      window.setTimeout(() => setSaved(false), 2400);
    } catch (err: any) {
      setError('Erro ao salvar as alterações.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      signOut();
      window.location.href = '/auth';
    } catch (err) {
      setError('Erro ao deletar a conta.');
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando perfil...</div>;
  }

  return <div className="page-enter mx-auto max-w-[980px] space-y-8">
    <section>
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">seu espaço</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">Meu perfil</h1>
      <p className="mt-2 text-sm text-muted-foreground">Seus dados essenciais, sempre à mão e sob seu controle.</p>
    </section>

    <form onSubmit={save} className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
        <div className="flex items-center gap-4 border-b border-border/70 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">{form.name ? form.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : '?'}</div>
          <div><h2 className="text-base font-extrabold">Dados pessoais</h2><p className="mt-1 text-xs text-muted-foreground">Como podemos encontrar você.</p></div>
          <CircleUserRound size={20} className="ml-auto text-muted-foreground/60" />
        </div>
        <div className="grid gap-5 pt-6 md:grid-cols-2">
          <Field label="Nome completo (somente leitura)" value={form.name} onChange={() => {}} id="name" disabled={true} />
          <Field label="E-mail (somente leitura)" value={form.email} onChange={() => {}} id="email" type="email" disabled={true} />
          <Field label="CPF (somente leitura)" value={form.cpf} onChange={() => {}} id="cpf" disabled={true} />
          <Field label="Data de nascimento (somente leitura)" value={form.birthDate} onChange={() => {}} id="birth-date" type="date" disabled={true} />
        </div>
      </section>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row pb-8 border-b border-border">
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck size={14} className="text-accent" /> Seus dados estão protegidos</p>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500 font-bold">{error}</span>}
          <button type="submit" disabled={patchPerfil.isPending} data-testid="button-save-profile" className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 disabled:opacity-50">
            {saved ? <><Check size={16} /> Alterações salvas</> : <><Save size={16} /> Salvar alterações</>}
          </button>
        </div>
      </div>
    </form>

    <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">Segurança</h2>
          <p className="mt-1 text-xs text-muted-foreground">Precisa de ajuda com o acesso? Enviaremos um link de recuperação.</p>
        </div>
        <button type="button" onClick={() => { alert('Enviamos um link de redefinição de senha para o seu e-mail.'); }} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Esqueci minha senha</button>
      </div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">Sessão</h2>
          <p className="mt-1 text-xs text-muted-foreground">Sair com segurança do seu espaço no Saúde Memora.</p>
        </div>
        <button type="button" onClick={() => { signOut(); window.location.href = '/auth'; }} className="rounded-xl px-4 py-2.5 text-xs font-bold border border-border bg-background hover:bg-muted transition-colors">Sair da conta</button>
      </div>
    </section>

    <section className="rounded-2xl border border-red-200 bg-red-50/30 p-5 md:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-red-700 flex items-center gap-2"><AlertTriangle size={18} /> Zona de Perigo</h2>
          <p className="mt-1 text-xs text-red-600/80">Ao deletar sua conta, todos os seus dados e documentos serão apagados permanentemente.</p>
        </div>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDeleteConfirm(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-white text-muted-foreground border border-border hover:bg-muted transition-colors">Cancelar</button>
            <button onClick={handleDeleteAccount} disabled={deleteAccount.isPending} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm">{deleteAccount.isPending ? 'Deletando...' : 'Sim, deletar tudo'}</button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Deletar minha conta</button>
        )}
      </div>
    </section>
  </div>;
}

function Field({ label, value, onChange, id, type = 'text', disabled = false }: { label: string; value: string; onChange: (value: string) => void; id: string; type?: string; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-bold">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} data-testid={`input-profile-${id}`} className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-4 focus:ring-accent/10 disabled:opacity-60" /></label>;
}