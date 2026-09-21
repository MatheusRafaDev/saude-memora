import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, X } from 'lucide-react';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';
import { usePostApiAuthLogin, usePostApiAuthRegister } from '@workspace/api-client-react';

export default function Auth() {
  const [, setLocation] = useLocation();
  
  const loginMutation = usePostApiAuthLogin();
  const registerMutation = usePostApiAuthRegister();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', cpf: '', birthDate: '', sex: 'F', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const formatCpf = (cpf: string) => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cpf.slice(0, 14); // prevents typing more than 14 chars (with mask)
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, cpf: formatCpf(e.target.value) });
  };

  const submit = async (event: FormEvent) => { 
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const result = await loginMutation.mutateAsync({ data: { email: form.email, senha: form.password } }) as unknown as any;
        if (result && result.token) {
          localStorage.setItem('auth_token', result.token);
          setMessage('Acesso confirmado. Bem-vinda de volta.');
          setTimeout(() => {
            window.location.href = '/painel';
          }, 450);
        } else {
          setError('Erro inesperado ao realizar login.');
        }
      } else {
        await registerMutation.mutateAsync({ 
          data: { 
            nome: form.name, 
            cpf: form.cpf, 
            dataNascimento: form.birthDate, 
            sexo: form.sex, 
            email: form.email, 
            senha: form.password 
          } 
        });
        
        // Auto-login after registration
        const result = await loginMutation.mutateAsync({ data: { email: form.email, senha: form.password } }) as unknown as any;
        if (result && result.token) {
          localStorage.setItem('auth_token', result.token);
          setMessage('Sua conta foi criada. Vamos começar sua anamnese.');
          setTimeout(() => {
            window.location.href = '/anamnese';
          }, 800);
        } else {
          setMessage('Sua conta foi criada. Faça login para acessar.');
          setMode('login');
          setForm({ ...form, password: '' });
        }
      }
    } catch (err: any) {
      if (err.data && Array.isArray(err.data)) {
        setError(err.data.join(', '));
      } else if (err.data && err.data.message) {
        setError(err.data.message);
      } else {
        setError('Ocorreu um erro na requisição.');
      }
    }
  };

  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotMessage('Se o e-mail estiver cadastrado, você receberá um link de recuperação em instantes.');
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotMessage('');
      setForgotEmail('');
    }, 4000);
  };

  return <div className="app-noise flex min-h-[100dvh] bg-[hsl(var(--background))]">
    <section className="relative hidden w-[43%] overflow-hidden bg-[hsl(var(--sidebar))] p-12 text-white lg:flex lg:flex-col">
      <div className="absolute -right-28 top-20 h-80 w-80 rounded-full border border-[hsl(var(--sidebar-primary)/.2)]" /><div className="absolute -right-12 top-36 h-56 w-56 rounded-full border border-[hsl(var(--sidebar-primary)/.13)]" /><div className="absolute bottom-[-100px] left-[-100px] h-80 w-80 rounded-full bg-[hsl(var(--sidebar-primary)/.08)] blur-3xl" />
      <div className="relative flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center"><LourdesHeartMark className="h-10 w-10" /></span><span className="text-[17px] font-extrabold tracking-[-.05em]">saúde<span className="text-[hsl(var(--sidebar-primary))]">memora</span></span></div>
      <div className="relative mt-auto max-w-[420px] pb-10"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-primary))]">uma nova relação com sua saúde</p><h1 className="mt-5 text-[clamp(40px,4vw,64px)] font-extrabold leading-[.98] tracking-[-.065em]">Tudo o que importa, <span className="text-[hsl(var(--sidebar-primary))]">em um só lugar.</span></h1><p className="mt-7 max-w-[360px] text-[14px] leading-7 text-white/58">Organize seus documentos de saúde com clareza, contexto e o cuidado que a sua história merece.</p><div className="mt-12 flex items-center gap-3 text-[11px] text-white/55"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8"><ShieldCheck size={15} className="text-[hsl(var(--sidebar-primary))]" /></span> Privacidade pensada para pessoas, não para processos.</div></div>
    </section>
    <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-12"><div className="w-full max-w-[420px] page-enter">
      <div className="mb-10 flex items-center gap-2 lg:hidden"><span className="flex h-9 w-9 items-center justify-center"><LourdesHeartMark className="h-9 w-9" /></span><span className="text-[16px] font-extrabold tracking-[-.05em]">saúde<span className="text-accent">memora</span></span></div>
      <div className="mb-9"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-accent"><Sparkles size={19} /></div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">bem-vinda</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.055em] text-foreground">{mode === 'login' ? 'Que bom ter você aqui.' : 'Comece a cuidar da sua história.'}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === 'login' ? 'Acesse seu espaço pessoal de saúde.' : 'Crie um espaço seguro para seus documentos.'}</p></div>
      <div className="mb-7 flex rounded-xl border border-border bg-muted/60 p-1"><button onClick={() => setMode('login')} type="button" className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-colors ${mode === 'login' ? 'bg-card text-primary soft-shadow' : 'text-muted-foreground'}`}>Entrar</button><button onClick={() => setMode('register')} type="button" className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-colors ${mode === 'register' ? 'bg-card text-primary soft-shadow' : 'text-muted-foreground'}`}>Criar conta</button></div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <>
            <label className="block"><span className="mb-2 block text-[11px] font-bold text-foreground">Nome Completo</span><input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground/65 focus:ring-4 focus:ring-accent/10" /></label>
            <div className="grid grid-cols-2 gap-4">
                <label className="block"><span className="mb-2 block text-[11px] font-bold text-foreground">CPF</span><input required value={form.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground/65 focus:ring-4 focus:ring-accent/10" /></label>
                <label className="block"><span className="mb-2 block text-[11px] font-bold text-foreground">Nascimento</span><input type="date" required value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground/65 focus:ring-4 focus:ring-accent/10" /></label>
            </div>
            <label className="block"><span className="mb-2 block text-[11px] font-bold text-foreground">Sexo</span>
              <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow focus:ring-4 focus:ring-accent/10">
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
          </>
        )}
        <label className="block"><span className="mb-2 block text-[11px] font-bold text-foreground">E-mail</span><div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input required autoComplete="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground/65 focus:ring-4 focus:ring-accent/10" /></div></label>
        <label className="block"><span className="mb-2 block text-[11px] font-bold text-foreground">Senha</span><div className="relative"><LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="No mínimo 6 caracteres" className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-11 text-sm outline-none transition-shadow placeholder:text-muted-foreground/65 focus:ring-4 focus:ring-accent/10" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar senha" className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-primary">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        {mode === 'login' && <div className="flex justify-end"><button type="button" onClick={() => { setShowForgotModal(true); setForgotMessage(''); }} className="text-[11px] font-bold text-primary hover:text-accent">Esqueci minha senha</button></div>}
        <button type="submit" disabled={loginMutation.isPending || registerMutation.isPending} className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-[hsl(211_52%_24%)] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0">{mode === 'login' ? 'Entrar na minha conta' : 'Criar meu espaço'}<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></button>
        {message && <p className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-3 text-xs font-semibold text-secondary-foreground"><Check size={15} />{message}</p>}
        {error && <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-xs font-semibold text-red-600">{error}</p>}
      </form>
      <p className="mt-9 flex items-center justify-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck size={13} className="text-accent" /> Seus dados são tratados com cuidado e privacidade.</p>
    </div></section>

    {showForgotModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm page-enter">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl relative">
          <button onClick={() => setShowForgotModal(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent"><LockKeyhole size={18} /></div>
          <h3 className="text-lg font-extrabold mt-4">Recuperar senha</h3>
          <p className="text-sm text-muted-foreground mt-2">Digite o e-mail cadastrado na sua conta para enviarmos as instruções de recuperação.</p>
          
          <form onSubmit={handleForgotSubmit} className="mt-5 space-y-4">
            <label className="block">
              <input required type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="voce@email.com" className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-4 focus:ring-accent/10" />
            </label>
            <button type="submit" className="w-full h-11 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">Enviar link de recuperação</button>
          </form>

          {forgotMessage && (
            <div className="mt-4 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700 flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              {forgotMessage}
            </div>
          )}
        </div>
      </div>
    )}
  </div>;
}
