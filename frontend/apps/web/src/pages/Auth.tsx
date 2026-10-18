import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  X,
  Lock,
  Mail,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  usePostApiAuthLogin,
  usePostApiAuthRegister,
  useGetApiPacientesMe,
  getGetApiPacientesMeQueryKey,
  customFetch,
  getGetApiPacientesMeQueryOptions,
  getGetApiDocumentsQueryOptions,
  getGetApiFichaMedicaMeQueryOptions,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { BrandLogo } from '@/components/BrandLogo';
import { getApiErrorMessage } from '@/lib/api-error-message';

export interface AuthProps {
  defaultMode?: 'login' | 'register';
  [key: string]: any;
}

export default function Auth({ defaultMode }: AuthProps = {}) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: currentUser } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
      meta: { skipUnauthorizedRedirect: true },
    },
  });

  useEffect(() => {
    if (currentUser) {
      setLocation('/visao-geral');
    }
  }, [currentUser, setLocation]);

  const loginMutation = usePostApiAuthLogin();
  const registerMutation = usePostApiAuthRegister();

  const getInitialMode = (): 'login' | 'register' => {
    if (defaultMode) return defaultMode;
    if (location === '/cadastro' || location === '/criar-conta') return 'register';
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('mode=register') || search.includes('cadastro')) {
        return 'register';
      }
    }
    return 'login';
  };

  const [mode, setMode] = useState<'login' | 'register'>(getInitialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    sex: '',
    email: '',
    password: '',
    termsAccepted: false,
  });
  const [message, setMessage] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('registered') === '1'
      ? 'Conta criada com sucesso! Faça login para acessar seu painel.'
      : '',
  );
  const [error, setError] = useState('');

  // Recover password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  useEffect(() => {
    if (defaultMode) {
      setMode(defaultMode);
    } else if (location === '/cadastro' || location === '/criar-conta') {
      setMode('register');
    } else if (location === '/entrar') {
      if (typeof window !== 'undefined' && (window.location.search.includes('mode=register') || window.location.search.includes('cadastro'))) {
        setMode('register');
      }
    }
    if (typeof window !== 'undefined' && (window.location.pathname === '/cadastro' || window.location.pathname === '/criar-conta')) {
      window.history.replaceState(null, '', '/entrar');
    }
  }, [defaultMode, location]);

  const switchMode = (newMode: 'login' | 'register', successMessage = '') => {
    if (newMode === mode && !successMessage) return;
    setMode(newMode);
    setError('');
    setMessage(successMessage);
    if (typeof window !== 'undefined' && window.location.pathname !== '/entrar') {
      window.history.replaceState(null, '', '/entrar');
    }
  };

  const handleModeChange = (newMode: 'login' | 'register') => switchMode(newMode);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await loginMutation.mutateAsync({ data: { email: form.email.trim(), senha: form.password } });

        queryClient.removeQueries({ queryKey: getGetApiPacientesMeQueryKey() });
        await queryClient.fetchQuery(getGetApiPacientesMeQueryOptions());

        void Promise.allSettled([
          queryClient.prefetchQuery(getGetApiDocumentsQueryOptions()),
          queryClient.prefetchQuery(getGetApiFichaMedicaMeQueryOptions()),
        ]);

        const justRegistered = new URLSearchParams(window.location.search).get('registered') === '1';
        setLocation(justRegistered ? '/anamnese/inicio' : '/visao-geral');
      } else {
        if (!form.termsAccepted) {
          setError('Você precisa aceitar os Termos e a Política de Privacidade para continuar.');
          return;
        }

        const trimmedName = form.name.trim();
        if (!trimmedName) {
          setError('O nome completo é obrigatório.');
          return;
        }

        if (!form.birthDate) {
          setError('A data de nascimento é obrigatória.');
          return;
        }

        const hoje = new Date().toISOString().slice(0, 10);
        if (form.birthDate > hoje) {
          setError('A data de nascimento não pode estar no futuro.');
          return;
        }

        if (form.password.length < 8) {
          setError('A senha deve ter no mínimo 8 caracteres.');
          return;
        }

        await registerMutation.mutateAsync({
          data: {
            nome: trimmedName,
            dataNascimento: form.birthDate,
            sexo: form.sex || undefined,
            email: form.email.trim(),
            senha: form.password,
          },
        });

        // Login automático após cadastro
        await loginMutation.mutateAsync({ data: { email: form.email.trim(), senha: form.password } });

        queryClient.removeQueries({ queryKey: getGetApiPacientesMeQueryKey() });
        await queryClient.fetchQuery(getGetApiPacientesMeQueryOptions());

        void Promise.allSettled([
          queryClient.prefetchQuery(getGetApiDocumentsQueryOptions()),
          queryClient.prefetchQuery(getGetApiFichaMedicaMeQueryOptions()),
        ]);

        setLocation('/anamnese/inicio');
      }
    } catch (err: unknown) {
      const fallback = mode === 'login' ? 'E-mail ou senha incorretos.' : 'Não foi possível criar sua conta.';
      setError(getApiErrorMessage(err, fallback));
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setIsForgotLoading(true);

    try {
      await customFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotMessage('Se o e-mail estiver cadastrado, você receberá um link com instruções para redefinir sua senha.');
    } catch (err) {
      setForgotError(getApiErrorMessage(err, 'Não foi possível solicitar a recuperação. Tente novamente mais tarde.'));
    } finally {
      setIsForgotLoading(false);
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#14211F] flex flex-col justify-between selection:bg-[#CFE0FF] selection:text-[#1D4ED8]">
      
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="w-full px-6 py-5 flex items-center justify-between max-w-[1200px] mx-auto">
        <BrandLogo
          iconClassName="h-9 w-9"
          wordmarkClassName="text-xl font-bold text-[#14211F]"
        />

        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-[#5B6878] hover:text-[#1D4ED8] transition-colors inline-flex items-center gap-1"
        >
          <span>Voltar ao início</span>
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* ── Center Login/Register Card ─────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[460px]">
          
          {/* Card Container */}
          <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-7 sm:p-9 shadow-[0_20px_50px_-20px_rgba(20,33,31,0.07)]">
            
            {/* Header Titles */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#14211F]">
                {mode === 'login' ? 'Acesse seu espaço' : 'Crie sua conta'}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#5B6878]">
                {mode === 'login'
                  ? 'Entre com suas credenciais para ver seu histórico'
                  : 'Organize seus exames e receitas em menos de 1 minuto'}
              </p>
            </div>

            {/* Segmented Mode Switcher (Sleek Apple-style) */}
            <div className="mb-6 flex rounded-2xl bg-[#F1F5F9] p-1 border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#1D4ED8] shadow-xs'
                    : 'text-[#64748B] hover:text-[#14211F]'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-all duration-200 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-[#1D4ED8] shadow-xs'
                    : 'text-[#64748B] hover:text-[#14211F]'
                }`}
              >
                Criar conta
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-[#E8664A]/30 bg-[#FFF5F3] p-3 text-xs sm:text-sm text-[#E8664A] flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="mb-4 rounded-xl border border-[#CFE0FF] bg-[#CFE0FF]/40 p-3 text-xs sm:text-sm text-[#1D4ED8] flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#10B981]" />
                <span>{message}</span>
              </div>
            )}

            {/* The Form */}
            <form onSubmit={submit} className="space-y-4">
              
              {/* Register-only fields */}
              {mode === 'register' && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div>
                    <label className="block mb-1 text-xs font-bold text-[#14211F]">
                      Nome completo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Ex.: Maria Clara Santos"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="h-12 w-full rounded-xl border border-[#D5DCE6] bg-[#FAFBFC] px-4 pl-10 text-sm text-[#14211F] outline-none transition-all focus:bg-white focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10 placeholder:text-[#94A3B8]"
                      />
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7F8EA3]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-bold text-[#14211F]">
                        Nascimento
                      </label>
                      <input
                        type="date"
                        required
                        autoComplete="bday"
                        max={new Date().toISOString().slice(0, 10)}
                        value={form.birthDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                        className="h-12 w-full rounded-xl border border-[#D5DCE6] bg-[#FAFBFC] px-3.5 text-sm text-[#14211F] outline-none transition-all focus:bg-white focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-bold text-[#14211F]">
                        Sexo biológico
                      </label>
                      <select
                        required
                        value={form.sex}
                        onChange={(e) => setForm((prev) => ({ ...prev, sex: e.target.value }))}
                        className="h-12 w-full rounded-xl border border-[#D5DCE6] bg-[#FAFBFC] px-3 text-sm text-[#14211F] outline-none transition-all focus:bg-white focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10"
                      >
                        <option value="">Selecione</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* E-mail (Both modes) */}
              <div>
                <label className="block mb-1 text-xs font-bold text-[#14211F]">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="seu.email@exemplo.com"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    onBlur={() => setForm((prev) => ({ ...prev, email: prev.email.trim() }))}
                    className="h-12 w-full rounded-xl border border-[#D5DCE6] bg-[#FAFBFC] px-4 pl-10 text-sm text-[#14211F] outline-none transition-all focus:bg-white focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10 placeholder:text-[#94A3B8]"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7F8EA3]" />
                </div>
              </div>

              {/* Password (Both modes) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#14211F]">
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder={mode === 'register' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-12 w-full rounded-xl border border-[#D5DCE6] bg-[#FAFBFC] px-4 pl-10 pr-10 text-sm text-[#14211F] outline-none transition-all focus:bg-white focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10 placeholder:text-[#94A3B8]"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7F8EA3]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F8EA3] hover:text-[#14211F] transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Terms checkbox in register mode */}
              {mode === 'register' && (
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-xs text-[#5B6878] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.termsAccepted}
                      onChange={(e) => setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-[#D5DCE6] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                    />
                    <span>
                      Li e concordo com os{' '}
                      <Link href="/termos" className="font-semibold text-[#1D4ED8] underline hover:text-[#1E40AF]">
                        Termos de Uso
                      </Link>{' '}
                      e a{' '}
                      <Link href="/privacidade" className="font-semibold text-[#1D4ED8] underline hover:text-[#1E40AF]">
                        Política de Privacidade
                      </Link>
                      .
                    </span>
                  </label>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1E40AF] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <span>{mode === 'login' ? 'Entrar no sistema' : 'Criar minha conta gratuita'}</span>
                )}
              </button>
            </form>

            {/* Quick Switch Link at bottom */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center text-xs text-[#5B6878]">
              {mode === 'login' ? (
                <span>
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('register')}
                    className="font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    Cadastre-se gratuitamente
                  </button>
                </span>
              ) : (
                <span>
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    Fazer login
                  </button>
                </span>
              )}
            </div>

          </div>

          {/* Reassurance Badge below card */}
          <div className="mt-6 text-center text-xs text-[#7F8EA3] flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-[#10B981]" />
            <span>Seus dados são confidenciais e protegidos pela LGPD</span>
          </div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="w-full px-6 py-4 text-center text-xs text-[#7F8EA3]">
        Saúde Memora © {new Date().getFullYear()} · Tecnologia médica a serviço da sua tranquilidade
      </footer>

      {/* ── Modal Recuperar Senha ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-[440px] rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotMessage('');
                setForgotError('');
              }}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F7FC] text-[#5B6878] hover:text-[#14211F] transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
              <Lock size={20} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-[#14211F]">Recuperar senha</h2>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#5B6878]">
              Digite o e-mail da sua conta para enviarmos as instruções de redefinição de senha.
            </p>

            {forgotMessage ? (
              <div className="mt-5 rounded-xl border border-[#CFE0FF] bg-[#CFE0FF]/40 p-4 text-xs sm:text-sm text-[#1D4ED8]">
                {forgotMessage}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-5 space-y-3.5">
                {forgotError && (
                  <div role="alert" className="rounded-xl border border-[#E8664A]/30 bg-[#FFF5F3] p-3 text-xs sm:text-sm text-[#E8664A]">
                    {forgotError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu.email@exemplo.com"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setForgotError('');
                  }}
                  className="h-11 w-full rounded-xl border border-[#D5DCE6] bg-[#FAFBFC] px-3.5 text-sm text-[#14211F] outline-none focus:bg-white focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10 placeholder:text-[#94A3B8]"
                />
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1D4ED8] text-sm font-bold text-white shadow-xs transition-all hover:bg-[#1E40AF] disabled:opacity-50 cursor-pointer"
                >
                  {isForgotLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Enviar instruções de recuperação'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
