import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  X,
  FolderHeart,
  CheckCircle2,
  ShieldCheck,
  FlaskConical,
  Pill,
  FileBadge,
  ArrowLeft,
  Lock,
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
import { BrandWordmark } from '@/components/BrandWordmark';
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
    setMode(newMode);
    setError('');
    setMessage(successMessage);
    window.history.replaceState(null, '', newMode === 'register' ? '/cadastro' : '/entrar');
  };

  const handleModeChange = (newMode: 'login' | 'register') => switchMode(newMode);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await loginMutation.mutateAsync({ data: { email: form.email.trim(), senha: form.password } });
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

  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] lg:bg-white font-sans text-[#1d2a3d] flex flex-col">
      <div className="flex flex-1 flex-col lg:flex-row min-h-0 lg:min-h-screen">
        {/* ── Left Illustration & Highlights Panel (Desktop only 44%) ── */}
        <section className="hidden lg:flex flex-[0_0_44%] flex-col justify-center items-center bg-[#1b3a60] p-8 xl:p-12 text-white relative overflow-hidden">
          {/* Centered Editorial Block */}
          <div className="my-auto w-full max-w-[420px] flex flex-col items-center text-center">
            {/* Framed Editorial Card */}
            <div className="w-full max-w-[340px] overflow-hidden rounded-[26px] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-xs transition-transform duration-300 hover:scale-[1.01]">
              <img
                src="/login-illustration.jpg"
                alt="Ilustração de consulta e cuidado com a saúde"
                className="block h-auto w-full rounded-[20px] object-cover shadow-sm"
              />
            </div>

            <h1 className="mt-7 text-[32px] xl:text-[36px] font-extrabold leading-[1.1] tracking-[-0.035em]">
              Tudo o que importa, <span className="text-[#7cc4e6]">em um só lugar.</span>
            </h1>

            <p className="mt-3 max-w-[380px] text-[15px] leading-relaxed text-[#c9d6e8]">
              Organize seus documentos de saúde com clareza, contexto e o cuidado que a sua história merece.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-[12px] font-semibold text-white">
                <FlaskConical size={13} className="text-[#7cc4e6]" /> Exames
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-[12px] font-semibold text-white">
                <Pill size={13} className="text-[#7cc4e6]" /> Receitas
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-[12px] font-semibold text-white">
                <FileBadge size={13} className="text-[#7cc4e6]" /> Laudos
              </span>
            </div>

            <div className="mt-6 inline-flex flex-col items-start gap-2.5 text-[14px] font-medium text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <FolderHeart size={18} className="text-[#7cc4e6]" />
                </div>
                <span>Exames, receitas e laudos reunidos</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <CheckCircle2 size={18} className="text-[#7cc4e6]" />
                </div>
                <span>Você confere e corrige o que foi lido</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck size={18} className="text-[#7cc4e6]" />
                </div>
                <span>Espaço pessoal, com você no controle</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Form Panel (Clean, polished single canvas on mobile) ── */}
        <section className="flex flex-1 flex-col justify-between p-5 sm:p-8 lg:p-10">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between pb-4 pt-1 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dde3ec] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#5a6a80] shadow-xs transition-all hover:border-[#c6cfdb] hover:text-[#1b3a60]"
            >
              <ArrowLeft size={14} />
              <span>Início</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f4f8] px-3 py-1 text-[11px] font-medium text-[#5a6a80]">
              <ShieldCheck size={13} className="text-[#1f7fe0]" />
              <span>Ambiente seguro</span>
            </span>
          </div>

          {/* Desktop return link and logo */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#5a6a80] hover:text-[#1b3a60]">
              ← Voltar ao início
            </Link>
          </div>

          {/* Form Container (compact, max-w 380px centered) */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }}
            className="mx-auto my-auto w-full max-w-[370px] sm:max-w-[380px] py-4 sm:py-6"
          >
            {/* Centered Brand & Header */}
            <div className="mb-5 flex flex-col items-center justify-center text-center w-full">
              <div className="mb-2.5 flex w-full justify-center text-center">
                <BrandLogo
                  className="mx-auto"
                  iconClassName="h-11 w-11 drop-shadow-sm transition-transform hover:scale-105"
                  wordmarkClassName="text-[23px] sm:text-[24px] text-[#1d2a3d]"
                />
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex flex-col items-center"
                >
                  <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.03em] text-[#1d2a3d]">
                    {mode === 'login' ? 'Que bom ter você aqui.' : 'Crie sua conta.'}
                  </h2>
                  <p className="mt-1 text-[13px] sm:text-[14px] text-[#5a6a80]">
                    {mode === 'login' ? 'Acesse seu espaço pessoal de saúde.' : 'Comece a organizar seu histórico em poucos minutos.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Segmented Pill Tabs with Animated Indicator */}
            <div className="relative mb-5 flex rounded-xl border border-[#dde3ec] bg-[#f1f4f8] p-1">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`relative z-10 flex-1 rounded-lg py-2 text-center text-[13.5px] font-bold transition-colors duration-150 ${
                  mode === 'login' ? 'text-white' : 'text-[#5a6a80] hover:text-[#1d2a3d]'
                }`}
              >
                Entrar
                {mode === 'login' && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-[#1b3a60] shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`relative z-10 flex-1 rounded-lg py-2 text-center text-[13.5px] font-bold transition-colors duration-150 ${
                  mode === 'register' ? 'text-white' : 'text-[#5a6a80] hover:text-[#1d2a3d]'
                }`}
              >
                Criar conta
                {mode === 'register' && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-[#1b3a60] shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
              </button>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  role="alert"
                  className="overflow-hidden rounded-xl border border-[#f0b8b2] bg-[#fff5f4] p-3 text-[13.5px] text-[#a13a30]"
                >
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden rounded-xl border border-[#bfd8f7] bg-[#e5eefb] p-3 text-[13.5px] text-[#1f7fe0]"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={submit} className="space-y-3">
              {/* Register-only fields with smooth expanding collapse */}
              <AnimatePresence initial={false}>
                {mode === 'register' && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pb-3">
                      <label className="block">
                        <span className="block mb-1 text-[12.5px] font-semibold text-[#334155]">Nome completo</span>
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          pattern=".*\S.*"
                          placeholder="Seu nome completo"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="h-10 sm:h-[42px] w-full rounded-xl border border-[#c6cfdb] bg-white px-3.5 text-[14px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10 placeholder:text-[#94a3b8]"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="block">
                          <span className="block mb-1 text-[12.5px] font-semibold text-[#334155]">Nascimento</span>
                          <input
                            type="date"
                            required
                            autoComplete="bday"
                            max={new Date().toISOString().slice(0, 10)}
                            value={form.birthDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                            className="h-10 sm:h-[42px] w-full rounded-xl border border-[#c6cfdb] bg-white px-3 text-[13px] sm:text-[14px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10"
                          />
                        </label>
                        <label className="block">
                          <span className="block mb-1 text-[12.5px] font-semibold text-[#334155]">Sexo biológico</span>
                          <select
                            required
                            value={form.sex}
                            onChange={(e) => setForm((prev) => ({ ...prev, sex: e.target.value }))}
                            className="h-10 sm:h-[42px] w-full rounded-xl border border-[#c6cfdb] bg-white px-3 text-[13px] sm:text-[14px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10 text-[#1d2a3d]"
                          >
                            <option value="">Selecione</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* E-mail (Common field) */}
              <label className="block">
                <span className="block mb-1 text-[12.5px] font-semibold text-[#334155]">E-mail</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  onBlur={() => setForm((prev) => ({ ...prev, email: prev.email.trim() }))}
                  className="h-10 sm:h-[42px] w-full rounded-xl border border-[#c6cfdb] bg-white px-3.5 text-[14px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10 placeholder:text-[#94a3b8]"
                />
              </label>

              {/* Senha (Common field) */}
              <label className="block">
                <span className="block mb-1 text-[12.5px] font-semibold text-[#334155]">Senha</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder={mode === 'register' ? 'No mínimo 8 caracteres' : 'Sua senha'}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-10 sm:h-[42px] w-full rounded-xl border border-[#c6cfdb] bg-white px-3.5 pr-10 text-[14px] outline-none transition-colors focus:border-[#1b3a60] focus:ring-2 focus:ring-[#1b3a60]/10 placeholder:text-[#94a3b8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5a6a80] hover:text-[#1d2a3d] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {/* Sub-form actions (Forgot password or Terms) */}
              <div className="pt-0.5">
                <AnimatePresence mode="wait" initial={false}>
                  {mode === 'login' ? (
                    <motion.div
                      key="forgot-password"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.15 }}
                      className="text-right"
                    >
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[13px] font-semibold text-[#1b3a60] hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="terms"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.15 }}
                    >
                      <label className="flex items-start gap-2.5 text-[12.5px] leading-snug text-[#5a6a80] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.termsAccepted}
                          onChange={(e) => setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-[#c6cfdb] text-[#1b3a60] focus:ring-[#1b3a60]"
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-3 flex h-10 sm:h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a60] text-[14px] font-bold text-white shadow-xs transition-all hover:bg-[#244d7e] disabled:opacity-50"
              >
                {isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={mode}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex items-center gap-2"
                    >
                      <span>{mode === 'login' ? 'Entrar na minha conta' : 'Criar minha conta'}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </motion.span>
                  </AnimatePresence>
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11.5px] sm:text-[12px] text-[#7a8ba0]">
              <Lock size={12} className="text-[#1f7fe0] shrink-0" />
              <span>Espaço seguro e pessoal: controle total dos seus dados</span>
            </div>
          </motion.div>

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
                  className="h-10 sm:h-[42px] w-full rounded-xl border border-[#c6cfdb] bg-white px-3.5 text-[14px] outline-none focus:border-[#1b3a60] placeholder:text-[#94a3b8]"
                />
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="flex h-10 sm:h-[42px] w-full items-center justify-center rounded-xl bg-[#1b3a60] text-[14px] font-bold text-white transition-all hover:bg-[#244d7e]"
                >
                  {isForgotLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Enviar link de recuperação'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
