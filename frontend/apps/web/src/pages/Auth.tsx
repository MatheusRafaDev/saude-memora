import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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
  Check,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  LogIn,
  UserPlus,
  ArrowRight,
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

// Variantes de animação direcional para transição fluida entre Login e Cadastro
const formContainerVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 28 : -28,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 28 : -28,
    opacity: 0,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const formItemVariants: Variants = {
  enter: { opacity: 0, y: 10 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15 },
  },
};

export default function Auth({ defaultMode }: AuthProps = {}) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Só verifica sessão ativa se não está já no modo cadastro (evita request desnecessário)
  const { data: currentUser } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
      // Não dispara a query se chegou diretamente na página de cadastro
      enabled: defaultMode !== 'register' && location !== '/cadastro' && location !== '/criar-conta',
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
  // Direção: +1 para Login -> Registro, -1 para Registro -> Login
  const [direction, setDirection] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

  // Recuperação de senha
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  useEffect(() => {
    let targetMode: 'login' | 'register' | null = null;
    if (defaultMode) {
      targetMode = defaultMode;
    } else if (location === '/cadastro' || location === '/criar-conta') {
      targetMode = 'register';
    } else if (location === '/entrar') {
      if (typeof window !== 'undefined' && (window.location.search.includes('mode=register') || window.location.search.includes('cadastro'))) {
        targetMode = 'register';
      } else {
        targetMode = 'login';
      }
    }

    if (targetMode && targetMode !== mode) {
      setDirection(targetMode === 'register' ? 1 : -1);
      setMode(targetMode);
    }
  }, [defaultMode, location, mode]);

  const switchMode = (newMode: 'login' | 'register', successMessage = '') => {
    if (newMode === mode && !successMessage) return;
    setDirection(newMode === 'register' ? 1 : -1);
    setMode(newMode);
    setError('');
    setMessage(successMessage);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newMode === 'register' ? '/criar-conta' : '/entrar');
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 10) score += 1;
    if (pwd.length >= 12 && score >= 2) score += 1;

    if (score <= 1) return { score: 1, label: 'Básica', color: 'bg-amber-400' };
    if (score === 2) return { score: 2, label: 'Boa', color: 'bg-blue-500' };
    return { score: 3, label: 'Excelente', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(form.password);

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

        if (form.password.length < 8) {
          setError('A senha deve ter no mínimo 8 caracteres.');
          return;
        }

        await registerMutation.mutateAsync({
          data: {
            nome: trimmedName,
            email: form.email.trim(),
            senha: form.password,
            dataNascimento: form.birthDate,
            sexo: form.sex || undefined,
          },
        });

        // Reseta o formulário e alterna para aba de login com mensagem animada
        setForm({ name: '', birthDate: '', sex: '', email: form.email.trim(), password: '', termsAccepted: false });
        switchMode('login', 'Conta criada com sucesso! Faça login para continuar.');
      }
    } catch (err: any) {
      // Mensagens de erro mais amigáveis baseadas no status HTTP
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        setError('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
      } else if (status === 400) {
        setError(getApiErrorMessage(err, 'Dados inválidos. Verifique as informações e tente novamente.'));
      } else {
        setError(getApiErrorMessage(err, 'Ocorreu um erro ao processar sua solicitação. Verifique seus dados.'));
      }
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen min-h-[100dvh] bg-[#F8FAFC] lg:bg-white text-[#173754] font-sans selection:bg-[#CFE0FF] selection:text-[#1D4ED8]">
      <div className="min-h-screen min-h-[100dvh] grid grid-cols-1 lg:grid-cols-12 box-border">
        {/* ── PAINEL DO FORMULÁRIO (ESQUERDA) ────────────────────────── */}
        <section className="lg:col-span-7 xl:col-span-6 flex flex-col justify-between px-4 sm:px-8 md:px-12 lg:px-12 xl:px-16 py-6 sm:py-8 lg:py-10 bg-white min-h-[100dvh] lg:min-h-0 overflow-y-auto">
          {/* Topo: Logo & Voltar */}
          <div className="flex items-center justify-between w-full max-w-[440px] mx-auto mb-6 sm:mb-8">
            <BrandLogo
              href="/"
              layout="stacked"
              iconClassName="h-9 w-9 sm:h-10 sm:w-10 drop-shadow-xs"
              wordmarkClassName="text-[17px] sm:text-[18px]"
            />

            <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#536C80] hover:text-[#2357D9] transition-colors py-1.5 px-3 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0]"
              >
                <ChevronLeft size={16} />
                <span>Voltar ao início</span>
              </Link>
            </motion.div>
          </div>

          {/* Área Central do Formulário */}
          <div className="w-full max-w-[440px] mx-auto my-auto py-2 sm:py-4">
            {/* Abas Alternadoras com Sliding Pill e Ícones */}
            <div className="relative flex gap-1 bg-[#EEF3FA] rounded-2xl p-1 mb-6 sm:mb-7 shadow-xs">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => switchMode('login')}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[14px] font-bold transition-colors duration-200 cursor-pointer z-10 ${
                  mode === 'login' ? 'text-[#2357D9]' : 'text-[#607187] hover:text-[#173754]'
                }`}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_12px_rgba(35,87,217,0.14)] -z-10"
                    transition={{ type: 'spring', bounce: 0.16, duration: 0.38 }}
                  />
                )}
                <LogIn size={15} className={mode === 'login' ? 'text-[#2357D9]' : 'text-[#8495A7]'} />
                <span>Entrar</span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => switchMode('register')}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[14px] font-bold transition-colors duration-200 cursor-pointer z-10 ${
                  mode === 'register' ? 'text-[#2357D9]' : 'text-[#607187] hover:text-[#173754]'
                }`}
              >
                {mode === 'register' && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_12px_rgba(35,87,217,0.14)] -z-10"
                    transition={{ type: 'spring', bounce: 0.16, duration: 0.38 }}
                  />
                )}
                <UserPlus size={15} className={mode === 'register' ? 'text-[#2357D9]' : 'text-[#8495A7]'} />
                <span>Criar conta</span>
              </motion.button>
            </div>

            {/* Mensagens de Erro com Efeito Shake e Alerta */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error-box"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{
                    opacity: 1,
                    height: 'auto',
                    y: 0,
                    x: [0, -7, 7, -5, 5, -2, 2, 0],
                  }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{
                    x: { duration: 0.42, ease: 'easeOut' },
                    opacity: { duration: 0.2 },
                    height: { duration: 0.2 },
                  }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700 flex items-start gap-2.5 shadow-xs">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 animate-pulse" />
                    <span className="leading-relaxed font-medium">{error}</span>
                  </div>
                </motion.div>
              )}

              {message && (
                <motion.div
                  key="success-box"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="rounded-xl border border-blue-200 bg-[#EEF3FA] p-3.5 text-xs sm:text-sm text-[#2357D9] flex items-start gap-2.5 shadow-xs">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#2357D9]" />
                    <span className="leading-relaxed font-medium">{message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transição Direcional Suave entre Formulários com Efeito Cascata */}
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {mode === 'login' ? (
                /* ── FORMULÁRIO: LOGIN ── */
                <motion.div
                  key="login-form"
                  custom={direction}
                  variants={formContainerVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <motion.div variants={formItemVariants} className="mb-6 sm:mb-8">
                    <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#173754] mb-2">
                      Bem-vindo de volta
                    </h1>
                    <p className="text-[#536C80] text-[14px] sm:text-[15px] leading-relaxed">
                      Entre para acessar seus exames, receitas e todo o seu histórico de saúde.
                    </p>
                  </motion.div>

                  <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                    <motion.div variants={formItemVariants}>
                      <label className="block mb-1.5 text-[#24364B] text-[13px] font-bold" htmlFor="email">
                        E-mail
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] transition-all duration-200 group-focus-within:text-[#2357D9] group-focus-within:scale-105">
                          <Mail size={18} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="voce@email.com"
                          value={form.email}
                          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full h-12 pl-11 pr-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[16px] sm:text-[15px] font-medium outline-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants}>
                      <label className="block mb-1.5 text-[#24364B] text-[13px] font-bold" htmlFor="pw">
                        Senha
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] transition-all duration-200 group-focus-within:text-[#2357D9] group-focus-within:scale-105">
                          <Lock size={18} />
                        </div>
                        <input
                          id="pw"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          placeholder="Digite sua senha"
                          value={form.password}
                          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                          className="w-full h-12 pl-11 pr-11 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[16px] sm:text-[15px] font-medium outline-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536C80] hover:text-[#173754] transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-[#F1F5F9]"
                          aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={showPassword ? 'hide' : 'show'}
                              initial={{ opacity: 0, scale: 0.65, rotate: -20 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 0.65, rotate: 20 }}
                              transition={{ duration: 0.16 }}
                              className="inline-block"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </motion.span>
                          </AnimatePresence>
                        </button>
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="flex justify-between items-center text-[13px] sm:text-[14px] pt-1 pb-1">
                      <label className="flex items-center gap-2.5 text-[#536C80] hover:text-[#173754] transition-colors cursor-pointer select-none">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                          />
                          <motion.div
                            whileTap={{ scale: 0.85 }}
                            className={`h-4.5 w-4.5 rounded-[5px] border transition-colors flex items-center justify-center ${
                              rememberMe
                                ? 'bg-[#2357D9] border-[#2357D9] text-white shadow-xs'
                                : 'bg-white border-[#CBD5E1] hover:border-[#2357D9]'
                            }`}
                          >
                            {rememberMe && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              >
                                <Check size={12} strokeWidth={3.5} />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                        <span>Manter conectado</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[#2357D9] font-semibold hover:underline cursor-pointer"
                      >
                        Esqueci a senha
                      </button>
                    </motion.div>

                    <motion.div variants={formItemVariants}>
                      <motion.button
                        type="submit"
                        disabled={isPending}
                        whileHover={isPending ? {} : { scale: 1.012, y: -1 }}
                        whileTap={isPending ? {} : { scale: 0.985 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className="group relative w-full h-12 sm:h-[52px] rounded-xl bg-[#2357D9] hover:bg-[#1E4DC4] text-white font-bold text-[15px] sm:text-[16px] shadow-[0_4px_14px_rgba(35,87,217,0.25)] hover:shadow-[0_6px_20px_rgba(35,87,217,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 overflow-hidden"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {isPending ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-2"
                            >
                              <LoaderCircle className="h-5 w-5 animate-spin" />
                              <span>Entrando...</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="idle"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="flex items-center gap-2"
                            >
                              <span>Entrar</span>
                              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  </form>

                  <motion.p variants={formItemVariants} className="mt-6 sm:mt-7 text-center text-[#536C80] text-[14px] sm:text-[15px]">
                    Ainda não tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-[#2357D9] font-bold hover:underline cursor-pointer"
                    >
                      Criar conta
                    </button>
                  </motion.p>
                </motion.div>
              ) : (
                /* ── FORMULÁRIO: CADASTRO / CRIAR CONTA ── */
                <motion.div
                  key="register-form"
                  custom={direction}
                  variants={formContainerVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <motion.div variants={formItemVariants} className="mb-5 sm:mb-6">
                    <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#173754] mb-2">
                      Crie sua conta
                    </h1>
                    <p className="text-[#536C80] text-[14px] sm:text-[15px] leading-relaxed">
                      Organize seus exames e receitas em um só lugar com privacidade total.
                    </p>
                  </motion.div>

                  <form onSubmit={submit} className="space-y-3.5">
                    <motion.div variants={formItemVariants}>
                      <label className="block mb-1.5 text-[#24364B] text-[13px] font-bold" htmlFor="signup-name">
                        Nome completo
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] transition-all duration-200 group-focus-within:text-[#2357D9] group-focus-within:scale-105">
                          <User size={18} />
                        </div>
                        <input
                          id="signup-name"
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="Seu nome completo"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full h-12 pl-11 pr-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[16px] sm:text-[15px] font-medium outline-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="min-w-0">
                        <label className="block mb-1.5 text-[#24364B] text-[13px] font-bold" htmlFor="signup-birth">
                          Data de nascimento
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] transition-all duration-200 group-focus-within:text-[#2357D9] group-focus-within:scale-105">
                            <Calendar size={18} />
                          </div>
                          <input
                            id="signup-birth"
                            type="date"
                            required
                            autoComplete="bday"
                            max={new Date().toISOString().slice(0, 10)}
                            value={form.birthDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                            className="w-full h-12 pl-11 pr-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[16px] sm:text-[15px] font-medium outline-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15"
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <label className="block mb-1.5 text-[#24364B] text-[13px] font-bold" htmlFor="signup-sex">
                          Sexo biológico
                        </label>
                        <div className="relative group">
                          <select
                            id="signup-sex"
                            value={form.sex}
                            onChange={(e) => setForm((prev) => ({ ...prev, sex: e.target.value }))}
                            className="w-full h-12 pl-3.5 pr-9 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[16px] sm:text-[15px] font-medium outline-none appearance-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15 cursor-pointer"
                          >
                            <option value="">Selecione</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Outro">Outro</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] transition-colors group-focus-within:text-[#2357D9]" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants}>
                      <label className="block mb-1.5 text-[#24364B] text-[13px] font-bold" htmlFor="signup-email">
                        E-mail
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] transition-all duration-200 group-focus-within:text-[#2357D9] group-focus-within:scale-105">
                          <Mail size={18} />
                        </div>
                        <input
                          id="signup-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="voce@email.com"
                          value={form.email}
                          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full h-12 pl-11 pr-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[16px] sm:text-[15px] font-medium outline-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants}>
                      <label className="block mb-1.5 text-[#24364B] text-[13px] font-bold" htmlFor="signup-password">
                        Senha
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8] transition-all duration-200 group-focus-within:text-[#2357D9] group-focus-within:scale-105">
                          <Lock size={18} />
                        </div>
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          placeholder="Mínimo de 8 caracteres"
                          value={form.password}
                          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                          className="w-full h-12 pl-11 pr-11 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[16px] sm:text-[15px] font-medium outline-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536C80] hover:text-[#173754] transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-[#F1F5F9]"
                          aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={showPassword ? 'hide' : 'show'}
                              initial={{ opacity: 0, scale: 0.65, rotate: -20 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 0.65, rotate: 20 }}
                              transition={{ duration: 0.16 }}
                              className="inline-block"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </motion.span>
                          </AnimatePresence>
                        </button>
                      </div>

                      {/* Indicador animado de força da senha */}
                      {form.password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1.5 overflow-hidden"
                        >
                          <div className="flex gap-1.5 h-1.5">
                            {[1, 2, 3].map((lvl) => (
                              <div
                                key={lvl}
                                className="flex-1 h-full rounded-full bg-[#E2E8F0] overflow-hidden"
                              >
                                <motion.div
                                  className={`h-full ${passwordStrength.color}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: passwordStrength.score >= lvl ? '100%' : '0%' }}
                                  transition={{ duration: 0.28, ease: 'easeOut' }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-[#64748B]">
                            <span>Mínimo de 8 caracteres</span>
                            <motion.span
                              key={passwordStrength.label}
                              initial={{ opacity: 0, y: -2 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="font-semibold text-[#1E293B]"
                            >
                              Segurança: {passwordStrength.label}
                            </motion.span>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div variants={formItemVariants}>
                      <label className="flex items-start gap-2.5 text-[#536C80] hover:text-[#173754] text-[13px] leading-relaxed pt-1 cursor-pointer select-none">
                        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={form.termsAccepted}
                            onChange={(e) => setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                            className="sr-only"
                          />
                          <motion.div
                            whileTap={{ scale: 0.85 }}
                            className={`h-4.5 w-4.5 rounded-[5px] border transition-colors flex items-center justify-center ${
                              form.termsAccepted
                                ? 'bg-[#2357D9] border-[#2357D9] text-white shadow-xs'
                                : 'bg-white border-[#CBD5E1] hover:border-[#2357D9]'
                            }`}
                          >
                            {form.termsAccepted && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              >
                                <Check size={12} strokeWidth={3.5} />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                        <span>
                          Concordo com os{' '}
                          <Link href="/termos" className="text-[#2357D9] font-semibold hover:underline">
                            Termos de Uso
                          </Link>{' '}
                          e a{' '}
                          <Link href="/privacidade" className="text-[#2357D9] font-semibold hover:underline">
                            Política de Privacidade
                          </Link>
                          .
                        </span>
                      </label>
                    </motion.div>

                    <motion.div variants={formItemVariants}>
                      <motion.button
                        type="submit"
                        disabled={isPending}
                        whileHover={isPending ? {} : { scale: 1.012, y: -1 }}
                        whileTap={isPending ? {} : { scale: 0.985 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className="group relative w-full h-12 sm:h-[52px] rounded-xl bg-[#2357D9] hover:bg-[#1E4DC4] text-white font-bold text-[15px] sm:text-[16px] shadow-[0_4px_14px_rgba(35,87,217,0.25)] hover:shadow-[0_6px_20px_rgba(35,87,217,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 overflow-hidden"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {isPending ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-2"
                            >
                              <LoaderCircle className="h-5 w-5 animate-spin" />
                              <span>Criando sua conta...</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="idle"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="flex items-center gap-2"
                            >
                              <span>Criar minha conta</span>
                              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  </form>

                  <motion.p variants={formItemVariants} className="mt-5 sm:mt-6 text-center text-[#536C80] text-[14px]">
                    Já possui conta?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-[#2357D9] font-bold hover:underline cursor-pointer"
                    >
                      Fazer login
                    </button>
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rodapé informativo */}
          <div className="w-full max-w-[440px] mx-auto pt-6 pb-2 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-[#2357D9] shrink-0" />
            <span>Seus dados de saúde protegidos e com criptografia de ponta a ponta.</span>
          </div>
        </section>

        {/* ── PAINEL DA DIREITA (FOTO DA CLÍNICA AJUSTADA COM QUALIDADE E SEM ZOOM) ── */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex lg:col-span-5 xl:col-span-6 relative h-full min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-[#F2F7FC] via-[#E8F1FA] to-[#DDEAF6] p-6 sm:p-8 xl:p-12 overflow-hidden select-none border-l border-[#E2E8F0]"
        >
          {/* Luzes ambientes suaves de fundo */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/60 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#2357D9]/10 blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-[640px] flex flex-col items-center gap-6">
            {/* Imagem da clínica médica em alta nitidez e proporção original 100% visível */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-[24px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(20,55,123,0.18)] border border-white bg-white"
            >
              <img
                src="/images/login-clinica.jpg"
                alt="Clínica médica - Saúde Memora"
                className="w-full h-auto object-contain block"
                loading="eager"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-[500px]"
            >
              <h2 className="text-[22px] xl:text-[26px] font-bold text-[#173754] leading-snug tracking-[-0.015em]">
                Todo o seu histórico médico num só lugar.
              </h2>
              <p className="mt-2 text-sm xl:text-[15px] text-[#536C80] leading-relaxed">
                Menos papéis espalhados e mais tranquilidade para você e sua família na hora da consulta.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-[#173754]"
            >
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2357D9]" />
                <span>100% Gratuito</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2357D9]" />
                <span>Acesso pelo celular</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2357D9]" />
                <span>Seguro e Confidencial</span>
              </div>
            </motion.div>
          </div>
        </motion.aside>
      </div>

      {/* ── MODAL: RECUPERAR SENHA ─────────────────────────────────── */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[420px] rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl border border-[#DFE7EF]"
            >
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage('');
                  setForgotError('');
                }}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F9FC] text-[#536C80] hover:text-[#173754] transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFEBFF] text-[#2357D9]">
                <Lock size={22} />
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#173754]">Recuperar senha</h2>
              <p className="mt-1 text-sm text-[#536C80] leading-relaxed">
                Digite o e-mail da sua conta para receber as instruções de recuperação.
              </p>

              {forgotMessage ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl border border-blue-200 bg-[#EEF3FA] p-3.5 text-xs sm:text-sm text-[#2357D9] flex items-start gap-2.5"
                >
                  <CheckCircle2 size={16} className="text-[#2357D9] shrink-0 mt-0.5" />
                  <span>{forgotMessage}</span>
                </motion.div>
              ) : (
                <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                  <AnimatePresence>
                    {forgotError && (
                      <motion.div
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          x: [0, -6, 6, -4, 4, 0],
                        }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35 }}
                        className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2"
                      >
                        <AlertCircle size={15} className="shrink-0 text-red-600" />
                        <span>{forgotError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-[#24364B]">
                      Seu e-mail cadastrado
                    </label>
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
                      className="h-11 w-full rounded-xl border border-[#D8E1EC] bg-white px-3.5 text-[16px] sm:text-sm text-[#18324B] outline-none transition-all duration-200 focus:border-[#2357D9] focus:ring-4 focus:ring-[#2357D9]/15"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isForgotLoading}
                    whileHover={isForgotLoading ? {} : { scale: 1.01 }}
                    whileTap={isForgotLoading ? {} : { scale: 0.98 }}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-[#2357D9] text-sm font-bold text-white shadow-md transition-all hover:bg-[#1E4DC4] disabled:opacity-50 cursor-pointer"
                  >
                    {isForgotLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Enviar instruções'}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
