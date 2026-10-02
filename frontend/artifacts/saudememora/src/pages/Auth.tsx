import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, X } from 'lucide-react';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';
import { usePostApiAuthLogin, usePostApiAuthRegister } from '@workspace/api-client-react';

export default function Auth() {
  const [, setLocation] = useLocation();

  const loginMutation    = usePostApiAuthLogin();
  const registerMutation = usePostApiAuthRegister();

  const [mode, setMode]                 = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm]                 = useState({ name: '', cpf: '', birthDate: '', sex: 'Outro', email: '', password: '' });
  const [message, setMessage]           = useState('');
  const [error, setError]               = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail]         = useState('');
  const [forgotMessage, setForgotMessage]     = useState('');

  const formatCpf = (cpf: string) => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cpf.slice(0, 14);
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
        if (result?.token) {
          localStorage.setItem('auth_token', result.token);
          setMessage('Acesso confirmado. Bem-vinda de volta.');
          setTimeout(() => { window.location.href = '/painel'; }, 450);
        } else {
          setError('Erro inesperado ao realizar login.');
        }
      } else {
        await registerMutation.mutateAsync({
          data: { nome: form.name, cpf: form.cpf, dataNascimento: form.birthDate, sexo: form.sex, email: form.email, senha: form.password }
        });
        const result = await loginMutation.mutateAsync({ data: { email: form.email, senha: form.password } }) as unknown as any;
        if (result?.token) {
          localStorage.setItem('auth_token', result.token);
          setMessage('Sua conta foi criada. Entrando no painel...');
          setTimeout(() => { window.location.href = '/painel'; }, 800);
        } else {
          setMessage('Sua conta foi criada. Faça login para acessar.');
          setMode('login');
          setForm({ ...form, password: '' });
        }
      }
    } catch (err: any) {
      if (err.data && Array.isArray(err.data))      setError(err.data.join(', '));
      else if (err.data?.message)                    setError(err.data.message);
      else                                           setError('Ocorreu um erro na requisição.');
    }
  };

  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotMessage('Se o e-mail estiver cadastrado, você receberá um link de recuperação em instantes.');
    setTimeout(() => { setShowForgotModal(false); setForgotMessage(''); setForgotEmail(''); }, 4000);
  };

  const inputCls = "h-11 w-full rounded-xl border border-input bg-card/80 px-4 text-[13px] outline-none transition-all placeholder:text-muted-foreground/45 focus:border-accent/40 focus:ring-4 focus:ring-accent/8 focus:bg-card";

  return (
    <div className="app-noise flex min-h-[100dvh] bg-background">

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <section className="relative hidden w-[42%] overflow-hidden bg-[hsl(var(--sidebar))] p-10 text-white lg:flex lg:flex-col">
        {/* Decoration */}
        <div className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full border border-white/6" />
        <div className="pointer-events-none absolute -right-8  top-32 h-56 w-56 rounded-full border border-white/4" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[hsl(var(--sidebar-primary)/.07)] blur-3xl" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LourdesHeartMark className="h-8 w-8" />
          <span className="text-[15px] font-bold tracking-[-0.04em]">
            saúde<span className="text-[hsl(var(--sidebar-primary))]">memora</span>
          </span>
        </Link>

        {/* Tagline */}
        <div className="relative mt-auto max-w-[380px] pb-8">
          <p className="font-mono text-[9px] uppercase tracking-[.22em] text-[hsl(var(--sidebar-primary))] mb-4">
            uma nova relação com sua saúde
          </p>
          <h1 className="text-[clamp(34px,3.8vw,56px)] font-black leading-[.97] tracking-[-0.065em]">
            Tudo o que importa,{' '}
            <span className="text-[hsl(var(--sidebar-primary))]">em um só lugar.</span>
          </h1>
          <p className="mt-5 text-[13px] leading-7 text-white/50">
            Organize seus documentos de saúde com clareza, contexto e o cuidado que a sua história merece.
          </p>

          {/* Trust badge */}
          <div className="mt-10 flex items-center gap-2.5 text-[11px] text-white/45">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/7">
              <ShieldCheck size={13} className="text-[hsl(var(--sidebar-primary))]" />
            </span>
            Privacidade pensada para pessoas, não para processos.
          </div>
        </div>
      </section>

      {/* ── Right panel: Form ──────────────────────────────────────────── */}
      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px] page-enter">

          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden hover:opacity-80 transition-opacity">
            <LourdesHeartMark className="h-7 w-7 text-accent" />
            <span className="text-[15px] font-bold tracking-[-0.04em]">
              saúde<span className="text-accent">memora</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-7">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent">
              <Sparkles size={17} />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[.2em] text-accent mb-2">bem-vinda</p>
            <h2 className="text-2xl font-black tracking-[-0.05em] text-foreground">
              {mode === 'login' ? 'Que bom ter você aqui.' : 'Comece a cuidar da sua história.'}
            </h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {mode === 'login' ? 'Acesse seu espaço pessoal de saúde.' : 'Crie um espaço seguro para seus documentos.'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl border border-border bg-muted/50 p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                type="button"
                className={`flex-1 rounded-lg py-2 text-[12px] font-semibold transition-all ${
                  mode === m
                    ? 'bg-card text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">Nome Completo</span>
                  <input
                    required autoComplete="name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome completo"
                    className={inputCls}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">CPF</span>
                    <input
                      required value={form.cpf} onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      className={inputCls}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">Nascimento</span>
                    <input
                      type="date" required value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                      className={inputCls}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">Sexo</span>
                  <select
                    value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}
                    className={inputCls}
                  >
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>
              </>
            )}

            {/* Email */}
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">E-mail</span>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  required autoComplete="email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="voce@email.com"
                  className={`${inputCls} pl-10`}
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">Senha</span>
              <div className="relative">
                <LockKeyhole size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6} type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="No mínimo 6 caracteres"
                  className={`${inputCls} pl-10 pr-10`}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar senha"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>

            {/* Forgot password */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(true); setForgotMessage(''); }}
                  className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="group mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_hsl(var(--primary)/.3)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loginMutation.isPending || registerMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar na minha conta' : 'Criar meu espaço'}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Messages */}
            {message && (
              <div className="flex items-center gap-2 rounded-xl bg-secondary/80 px-3.5 py-3 text-[12px] font-medium text-secondary-foreground">
                <Check size={14} className="shrink-0 text-accent" /> {message}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/8 border border-destructive/15 px-3.5 py-3 text-[12px] font-medium text-destructive">
                {error}
              </div>
            )}
          </form>

          {/* Footer trust */}
          <p className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <ShieldCheck size={12} className="text-accent/60" />
            Seus dados são tratados com cuidado e privacidade.
          </p>
        </div>
      </section>

      {/* ── Forgot password modal ─────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-modal px-4 page-enter">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-float relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-accent">
              <LockKeyhole size={16} />
            </div>
            <h3 className="text-[17px] font-bold mt-4">Recuperar senha</h3>
            <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
              Digite o e-mail da sua conta para recebermos as instruções de recuperação.
            </p>

            <form onSubmit={handleForgotSubmit} className="mt-5 space-y-3">
              <input
                required type="email" value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="voce@email.com"
                className="h-11 w-full rounded-xl border border-input bg-background/60 px-4 text-[13px] outline-none transition-all placeholder:text-muted-foreground/45 focus:border-accent/40 focus:ring-4 focus:ring-accent/8"
              />
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5"
              >
                Enviar link de recuperação
              </button>
            </form>

            {forgotMessage && (
              <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 p-3 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <Check size={14} className="shrink-0 mt-0.5" />
                {forgotMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
