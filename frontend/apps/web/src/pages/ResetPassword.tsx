import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { customFetch } from '@workspace/api-client-react';
import { Eye, EyeOff, LoaderCircle, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-white text-[#173754] font-sans flex flex-col justify-center items-center px-6 pt-[calc(2rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] bg-[radial-gradient(ellipse_at_top,_#eef3fa_0%,_#ffffff_70%)]">
      {/* Brand Wordmark */}
      <div className="mb-8">
        <Link href="/" aria-label="Saúde Memora — início">
          <BrandWordmark height={32} />
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-[440px] rounded-[24px] border border-[#DFE7EF] bg-white p-7 sm:p-9 shadow-[0_12px_32px_rgba(18,42,83,0.06)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFEBFF] text-[#2357D9]">
          <Lock size={22} />
        </div>

        <h1 className="mt-5 mb-1.5 text-[26px] sm:text-[28px] font-extrabold tracking-[-0.02em] text-[#173754]">
          Criar nova senha
        </h1>
        <p className="mb-6 text-[14px] leading-relaxed text-[#536C80]">
          Escolha uma senha com no mínimo 8 caracteres para voltar a acessar seu espaço.
        </p>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[13px] text-red-700 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-5 rounded-xl border border-blue-200 bg-[#EEF3FA] p-3.5 text-[13px] text-[#2357D9] flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-[#2357D9] shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div>
              <label className="block mb-1.5 text-[13px] font-bold text-[#24364B]">
                Código / Token
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="Insira o código recebido"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#D8E1EC] bg-white px-3.5 text-[14px] outline-none focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
              />
            </div>
          )}

          <div>
            <label className="block mb-1.5 text-[13px] font-bold text-[#24364B]">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#D8E1EC] bg-white px-3.5 pr-11 text-[15px] outline-none focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536C80] hover:text-[#173754] transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Strength Bars */}
          <div className="flex gap-1.5 pt-1">
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 1 ? 'bg-[#2357D9]' : 'bg-[#EEF3FA]'}`} />
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 2 ? 'bg-[#2357D9]' : 'bg-[#EEF3FA]'}`} />
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 3 ? 'bg-[#2357D9]' : 'bg-[#EEF3FA]'}`} />
            <i className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= 4 ? 'bg-[#2357D9]' : 'bg-[#EEF3FA]'}`} />
          </div>

          <div className="pt-2">
            <label className="block mb-1.5 text-[13px] font-bold text-[#24364B]">
              Confirmar senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-[#D8E1EC] bg-white px-3.5 text-[15px] outline-none focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-[#3169DF] to-[#2357D9] hover:from-[#2a5fc9] hover:to-[#1F4FC5] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(35,87,217,0.2)] transition-all disabled:opacity-50 cursor-pointer active:translate-y-0.5"
          >
            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Salvar nova senha'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/entrar"
            className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#2357D9] hover:underline cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Voltar para o login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
