import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, LoaderCircle, X } from 'lucide-react';
import {
  usePostApiAuthLogin,
  usePostApiAuthRegister,
  customFetch,
  getGetApiPacientesMeQueryOptions,
  getGetApiDocumentsQueryOptions,
  getGetApiFichaMedicaMeQueryOptions,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { BrandWordmark } from '@/components/BrandWordmark';
import { getApiErrorMessage } from '@/lib/api-error-message';

export interface AuthProps {
  defaultMode?: 'login' | 'register';
  [key: string]: any;
}

export default function Auth({ defaultMode }: AuthProps = {}) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

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
  const [isAnimating, setIsAnimating] = useState(false);
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
      ? 'Conta criada com sucesso. Entre com seu e-mail e senha para continuar.'
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
      setMode('login');
    }
  }, [defaultMode, location]);

  const switchMode = (newMode: 'login' | 'register', successMessage = '') => {
    if (newMode === mode && !successMessage) return;
    setIsAnimating(true);
    setTimeout(() => {
      setMode(newMode);
      setError('');
      setMessage(successMessage);
      window.history.replaceState(null, '', newMode === 'register' ? '/cadastro' : '/entrar');
      setIsAnimating(false);
    }, 160);
  };

  const handleModeChange = (newMode: 'login' | 'register') => switchMode(newMode);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await loginMutation.mutateAsync({ data: { email: form.email.trim(), senha: form.password } });
        setMessage('Carregando seu histórico...');
        await Promise.allSettled([
          queryClient.prefetchQuery(getGetApiPacientesMeQueryOptions()),
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

        await registerMutation.mutateAsync({
          data: {
            nome: form.name.trim(),
            dataNascimento: form.birthDate,
            sexo: form.sex,
            email: form.email.trim(),
            senha: form.password,
          },
        });

        setForm((prev) => ({ ...prev, password: '', name: '', birthDate: '', sex: '', email: '', termsAccepted: false }));
        switchMode('login', 'Conta criada com sucesso. Entre com seu e-mail e senha para continuar.');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Ocorreu um erro. Verifique seus dados.'));
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!email) return;
    setIsForgotLoading(true);
    setForgotMessage('');
    setForgotError('');
    try {
      await customFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setForgotMessage('Se o e-mail estiver cadastrado, enviamos as instruções de recuperação.');
    } catch (err) {
      setForgotError(getApiErrorMessage(err, 'Não foi possível solicitar a recuperação agora. Tente novamente.'));
    } finally {
      setIsForgotLoading(false);
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className={`bg-white font-sans text-[#1d2a3d] flex flex-col ${mode === 'login' ? 'h-[100dvh] overflow-hidden lg:h-auto lg:min-h-screen' : 'min-h-screen'}`}>
      <div className={`flex flex-1 flex-col lg:flex-row ${mode === 'login' ? 'min-h-0' : 'min-h-[820px]'}`}>
        {/* ── Left Illustration & Highlights Panel (Desktop 44%) ── */}
        <section className="hidden lg:flex flex-[0_0_44%] flex-col justify-between bg-[#1b3a60] p-12 text-white relative overflow-hidden">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-[17px] text-white">
            <img src="/logo.svg" alt="SaúdeMemora" className="h-9 w-9 object-contain flex-none" />
            <BrandWordmark inverse />
          </Link>

          {/* SVG Illustration from Design Board */}
          <div className="my-auto py-8">
            <img
              src="/login-illustration.svg"
              alt="Ilustração de segurança e saúde"
              className="mx-auto block h-auto w-full max-w-[340px]"
            />

            <h1 className="mt-6 max-w-[400px] text-[38px] font-extrabold leading-[1.05] tracking-[-0.04em]">
              Tudo o que importa, <span className="text-[#7cc4e6]">em um só lugar.</span>
            </h1>

            <p className="mt-3 max-w-[400px] text-[15px] leading-relaxed text-[#c9d6e8]">
              Organize seus documentos de saúde com clareza, contexto e o cuidado que a sua história merece.
            </p>

            <div className="mt-6 space-y-2.5 text-[14px] font-medium">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7cc4e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />
                  </svg>
                </div>
                <span>Exames, receitas e laudos reunidos</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7cc4e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                </div>
                <span>Você confere e corrige o que foi lido</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7cc4e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                  </svg>
                </div>
                <span>Espaço pessoal, com você no controle</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Form Panel ───────────────────────────────────── */}
        <section className={`flex flex-1 flex-col justify-between ${mode === 'login' ? 'p-4 sm:p-8 lg:p-12' : 'p-6 sm:p-12'}`}>
          {/* Mobile brand and return link */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-extrabold text-[17px] text-[#1b3a60] lg:hidden"
            >
              <img src="/logo.svg" alt="" className="h-9 w-9 object-contain flex-none" />
              <BrandWordmark />
            </Link>
            <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#5a6a80] hover:text-[#1b3a60]">
              ← Voltar ao início
            </Link>
          </div>

          {/* Form Container (max-w 420px centered) */}
          <div
            className={`mx-auto my-auto w-full max-w-[420px] ${mode === 'login' ? 'py-3 sm:py-5 lg:py-8' : 'py-8'} transition-[opacity,transform] duration-150 ease-out ${
              isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            }`}
          >
            <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.035em]">
              {mode === 'login' ? 'Que bom ter você aqui.' : 'Crie sua conta.'}
            </h2>
            <p className="mt-2 mb-4 sm:mb-6 text-[15px] text-[#5a6a80]">
              {mode === 'login' ? 'Acesse seu espaço pessoal de saúde.' : 'Comece a organizar seu histórico em poucos minutos.'}
            </p>

            {/* Segmented Pill Tabs */}
            <div className="mb-4 sm:mb-6 flex rounded-xl border border-[#dde3ec] bg-[#f1f4f8] p-1">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`flex-1 rounded-lg py-2.5 text-center text-[14px] font-semibold transition-all ${
                  mode === 'login' ? 'bg-white text-[#1b3a60] shadow-sm' : 'text-[#5a6a80] hover:text-[#1d2a3d]'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`flex-1 rounded-lg py-2.5 text-center text-[14px] font-semibold transition-all ${
                  mode === 'register' ? 'bg-white text-[#1b3a60] shadow-sm' : 'text-[#5a6a80] hover:text-[#1d2a3d]'
                }`}
              >
                Criar conta
              </button>
            </div>

            {/* Messages */}
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

            {/* Form */}
            <form onSubmit={submit} className={`${mode === 'login' ? 'space-y-3 sm:space-y-4' : 'space-y-4'}`}>
              {mode === 'register' && (
                <>
                  <label className="block">
                    <span className="block mb-1.5 text-[13px] font-semibold">Nome completo</span>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      pattern=".*\S.*"
                      placeholder="Seu nome completo"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10"
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="block mb-1.5 text-[13px] font-semibold">Data de nascimento</span>
                      <input
                        type="date"
                        required
                        autoComplete="bday"
                        max={new Date().toISOString().slice(0, 10)}
                        value={form.birthDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                        className="h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10"
                      />
                    </label>
                    <label className="block">
                      <span className="block mb-1.5 text-[13px] font-semibold">Sexo biológico</span>
                      <select
                        required
                        value={form.sex}
                        onChange={(e) => setForm((prev) => ({ ...prev, sex: e.target.value }))}
                        className="h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10"
                      >
                        <option value="">Selecione</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </label>
                  </div>
                </>
                )}

              <label className="block">
                <span className="block mb-1.5 text-[13px] font-semibold">E-mail</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  onBlur={() => setForm((prev) => ({ ...prev, email: prev.email.trim() }))}
                  className="h-11 sm:h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10"
                />
              </label>

              <label className="block">
                <span className="block mb-1.5 text-[13px] font-semibold">Senha</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder={mode === 'register' ? 'No mínimo 8 caracteres' : 'Sua senha'}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-11 sm:h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 pr-11 text-[15px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10"
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

              {mode === 'login' ? (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[14px] font-semibold text-[#1b3a60] hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              ) : (
                <label className="flex items-start gap-2.5 pt-1 text-[13px] text-[#5a6a80] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={(e) => setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-[#c6cfdb] text-[#1b3a60] focus:ring-[#1b3a60]"
                  />
                  <span>
                    Li e concordo com os{' '}
                    <Link href="/termos" className="font-semibold text-[#1b3a60] hover:underline">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacidade" className="font-semibold text-[#1b3a60] hover:underline">
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-3 sm:mt-4 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a60] font-bold text-white transition-all hover:bg-[#244d7e] disabled:opacity-50"
              >
                {isPending ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Entrar na minha conta' : 'Criar minha conta'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 sm:mt-6 text-[12px] leading-relaxed text-[#5a6a80]">
              Seu espaço é pessoal: você decide quais documentos e informações adicionar.
            </p>
          </div>

          <div />
        </section>
      </div>

      {/* ── Modal Recuperar Senha (matches ModalRecuperarSenha.html) ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1e3c]/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-[500px] rounded-[28px] bg-white p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.4)] animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotMessage('');
              }}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4f8] text-[#5a6a80] hover:text-[#1d2a3d]"
            >
              <X size={20} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5eefb]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f7fe0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3" />
              </svg>
            </div>

            <h2 className="mt-4 mb-1.5 text-[22px] font-bold">Recuperar senha</h2>
            <p className="mb-5 text-[14px] leading-relaxed text-[#5a6a80]">
              Digite o e-mail da sua conta para recebermos as instruções de recuperação.
            </p>

            {forgotMessage ? (
              <div className="rounded-xl border border-[#bfd8f7] bg-[#e5eefb] p-4 text-[14px] text-[#1f7fe0]">
                {forgotMessage}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <div role="alert" className="rounded-xl border border-[#f0b8b2] bg-[#fff5f4] p-3.5 text-[14px] text-[#a13a30]">
                    {forgotError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setForgotError('');
                  }}
                  className="h-12 w-full rounded-xl border border-[#c6cfdb] bg-white px-4 text-[14px] outline-none focus:border-[#1b3a60]"
                />
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1b3a60] text-[15px] font-bold text-white transition-all hover:bg-[#244d7e]"
                >
                  {isForgotLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Enviar link de recuperação'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
