import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { customFetch } from '@workspace/api-client-react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { BrandWordmark } from '@/components/BrandWordmark';
import { getApiErrorMessage } from '@/lib/api-error-message';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await customFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha: password }),
      });
      setMessage('Senha alterada com sucesso! Redirecionando...');
      setTimeout(() => setLocation('/entrar'), 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Token inválido ou expirado. Solicite nova recuperação.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-sans text-[#1d2a3d] flex flex-col justify-center items-center p-6 bg-[radial-gradient(800px_500px_at_20%_0,#e6eef9,transparent_60%),radial-gradient(700px_500px_at_90%_90%,#e5eefb,transparent_60%),#fff]">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 font-extrabold text-[20px] text-[#1b3a60] tracking-[-0.03em] mb-8">
        <img src="/logo.svg" alt="SaúdeMemora" className="h-10 w-10 object-contain" />
        <BrandWordmark />
      </Link>

      {/* Card */}
      <div className="w-full max-w-[460px] rounded-[28px] border border-[#dde3ec] bg-white p-9 shadow-[0_30px_70px_-40px_rgba(27,58,96,0.4)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e5eefb]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f7fe0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3" />
          </svg>
        </div>

        <h1 className="mt-5 mb-1.5 text-[28px] font-extrabold tracking-[-0.035em]">
          Criar nova senha
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-[#5a6a80]">
          Escolha uma senha com no mínimo 8 caracteres para voltar a acessar seu espaço.
        </p>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-[#f0b8b2] bg-[#fff5f4] p-3.5 text-[14px] text-[#a13a30]">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-5 rounded-xl border border-[#bfd8f7] bg-[#e5eefb] p-3.5 text-[14px] text-[#1f7fe0]">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <label className="block">
              <span className="block mb-1.5 text-[13px] font-semibold">Código / Token</span>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="Insira o código recebido"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 text-[14px] outline-none focus:border-[#1b3a60]"
              />
            </label>
          )}

          <label className="block">
            <span className="block mb-1.5 text-[13px] font-semibold">Nova senha</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 pr-11 text-[15px] outline-none focus:border-[#1b3a60]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6a80] hover:text-[#1d2a3d]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {/* Strength Bars */}
          <div className="flex gap-1.5 pt-1">
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 1 ? 'bg-[#1f7fe0]' : 'bg-[#dde3ec]'}`} />
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 2 ? 'bg-[#1f7fe0]' : 'bg-[#dde3ec]'}`} />
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 3 ? 'bg-[#1f7fe0]' : 'bg-[#dde3ec]'}`} />
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 4 ? 'bg-[#1f7fe0]' : 'bg-[#dde3ec]'}`} />
          </div>

          <label className="block pt-2">
            <span className="block mb-1.5 text-[13px] font-semibold">Confirmar senha</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 text-[15px] outline-none focus:border-[#1b3a60]"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex h-[50px] w-full items-center justify-center rounded-xl bg-[#1b3a60] text-[15px] font-bold text-white transition-all hover:bg-[#244d7e] disabled:opacity-50"
          >
            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Salvar nova senha'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/entrar" className="text-[14px] text-[#5a6a80] hover:text-[#1b3a60] hover:underline">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
