import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';
import { customFetch } from '@workspace/api-client-react';

export default function ResetPassword() {
  const [location, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Token de recuperação inválido ou ausente.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      await customFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha: password })
      });
      setMessage('Senha redefinida com sucesso. Redirecionando...');
      setTimeout(() => { setLocation('/entrar'); }, 2000);
    } catch (err: any) {
      if (err.data && Array.isArray(err.data)) setError(err.data.join(', '));
      else if (err.data?.message) setError(err.data.message);
      else setError('Ocorreu um erro ao redefinir a senha. O link pode ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "h-11 w-full rounded-xl border border-input bg-card/80 px-4 text-[13px] outline-none transition-all placeholder:text-muted-foreground/45 focus:border-accent/40 focus:ring-4 focus:ring-accent/8 focus:bg-card";

  return (
    <div className="app-noise flex min-h-[100dvh] bg-background">
      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px] page-enter">
          <Link href="/" className="mb-8 flex items-center gap-2 hover:opacity-80 transition-opacity">
            <LourdesHeartMark className="h-7 w-7 text-accent" />
            <span className="text-[15px] font-bold tracking-[-0.04em]">
              saúde<span className="text-accent">memora</span>
            </span>
          </Link>

          <div className="mb-7">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent">
              <LockKeyhole size={17} />
            </div>
            <h2 className="text-2xl font-black tracking-[-0.05em] text-foreground">
              Redefinir Senha
            </h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Crie uma nova senha segura para acessar seu espaço.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">Nova Senha</span>
              <div className="relative">
                <LockKeyhole size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  required minLength={6} type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-foreground/80">Confirmar Nova Senha</span>
              <div className="relative">
                <LockKeyhole size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  required minLength={6} type={showPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className={`${inputCls} pl-10 pr-10`}
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_hsl(var(--primary)/.3)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Redefinir senha
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

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
          
          <div className="mt-6 flex justify-center">
            <Link href="/entrar" className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Lembrei minha senha. Voltar para login.
            </Link>
          </div>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <ShieldCheck size={12} className="text-accent/60" />
            Seus dados são tratados com cuidado e privacidade.
          </p>
        </div>
      </section>
    </div>
  );
}
