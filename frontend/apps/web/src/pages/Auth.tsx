import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  CalendarDays,
  Heart,
  ChevronLeft,
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
  }, [defaultMode, location]);

  const switchMode = (newMode: 'login' | 'register', successMessage = '') => {
    if (newMode === mode && !successMessage) return;
    setMode(newMode);
    setError('');
    setMessage(successMessage);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newMode === 'register' ? '/criar-conta' : '/entrar');
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F8FAFC] text-[#1E293B] flex flex-col lg:grid lg:grid-cols-12 selection:bg-[#CFE0FF] selection:text-[#1D4ED8]"
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* PAINEL DO FORMULÁRIO                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="order-2 flex-1 lg:order-2 lg:col-start-7 lg:col-span-6 xl:col-start-7 xl:col-span-6 flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 bg-[radial-gradient(ellipse_at_top_right,_#e7efff_0%,_transparent_45%),linear-gradient(135deg,_#ffffff_0%,_#f4f7fc_100%)] overflow-y-auto no-scrollbar">
        
        {/* Topo: Logo & Voltar ao início */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between w-full max-w-[460px] mx-auto mb-6 lg:mb-8"
        >
          <BrandLogo
            iconClassName="h-9 w-9"
            wordmarkClassName="text-lg font-bold text-[#1E293B]"
          />

          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors py-1.5 px-2.5 rounded-md hover:bg-slate-200/50"
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar ao início</span>
          </Link>
        </motion.div>

        {/* Formulário Central */}
        <div className="w-full max-w-[460px] mx-auto my-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[28px] border border-white/80 bg-white/95 p-6 sm:p-9 shadow-[0_28px_80px_-38px_rgba(29,78,216,0.28)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm"
          >
            
            {/* Título com transição suave ao alternar modo */}
            <div className="text-left mb-6 overflow-hidden min-h-[72px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                    {mode === 'login' ? 'Bem-vindo de volta' : 'Comece por aqui'}
                  </p>
                  <h2 className="text-[27px] font-bold tracking-tight text-slate-900">
                    {mode === 'login' ? 'Entrar na sua conta' : 'Criar sua conta'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {mode === 'login'
                      ? 'Digite seus dados para acessar seu histórico médico.'
                      : 'Cadastre-se para começar a organizar seus exames e receitas.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navegação entre entrar e criar conta */}
            <div role="tablist" aria-label="Acesso à conta" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                aria-controls="auth-form-panel"
                onClick={() => handleModeChange('login')}
                className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-blue-800 shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                aria-controls="auth-form-panel"
                onClick={() => handleModeChange('register')}
                className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-blue-800 shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Criar conta
              </button>
            </div>

            {/* Avisos */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  role="alert"
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs sm:text-sm text-blue-700 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                    <span className="leading-relaxed">{message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form id="auth-form-panel" role="tabpanel" onSubmit={submit} className="space-y-4">
              
              {/* Campos dinâmicos do cadastro com animação de expansão/colapso suave */}
              <AnimatePresence initial={false}>
                {mode === 'register' && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden space-y-3.5"
                  >
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
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
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-10 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100/80 placeholder:text-slate-400"
                        />
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-xs font-semibold text-slate-700">
                          Nascimento
                        </label>
                        <input
                          type="date"
                          required
                          autoComplete="bday"
                          max={new Date().toISOString().slice(0, 10)}
                          value={form.birthDate}
                          onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100/80"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-semibold text-slate-700">
                          Sexo biológico
                        </label>
                        <select
                          required
                          value={form.sex}
                          onChange={(e) => setForm((prev) => ({ ...prev, sex: e.target.value }))}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100/80"
                        >
                          <option value="">Selecione</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-700">
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
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-10 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100/80 placeholder:text-slate-400"
                  />
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
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
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100/80 placeholder:text-slate-400"
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Termos no cadastro */}
              <AnimatePresence initial={false}>
                {mode === 'register' && (
                  <motion.div
                    key="terms-checkbox"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden pt-1"
                  >
                    <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(e) => setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="leading-relaxed">
                        Concordo com os{' '}
                        <Link href="/termos" className="font-medium text-blue-600 underline hover:text-blue-800">
                          Termos de Uso
                        </Link>{' '}
                        e a{' '}
                        <Link href="/privacidade" className="font-medium text-blue-600 underline hover:text-blue-800">
                          Política de Privacidade
                        </Link>
                        .
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão Principal */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 text-sm font-bold text-white shadow-[0_10px_22px_-12px_rgba(29,78,216,0.8)] transition-all hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 active:translate-y-0 disabled:opacity-50 cursor-pointer overflow-hidden"
              >
                {isPending ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={mode}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-2"
                    >
                      <span>{mode === 'login' ? 'Entrar' : 'Criar minha conta'}</span>
                      <ArrowRight size={15} />
                    </motion.span>
                  </AnimatePresence>
                )}
              </button>
            </form>

            {/* Alternar modo no rodapé do card */}
            <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-600 min-h-[24px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {mode === 'login' ? (
                    <span>
                      Ainda não tem conta?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('register')}
                        className="font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        Cadastre-se gratuitamente
                      </button>
                    </span>
                  ) : (
                    <span>
                      Já possui conta?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('login')}
                        className="font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        Fazer login
                      </button>
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>


        </div>

      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PAINEL DA MARCA E DOS RECURSOS                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside className="order-1 hidden lg:row-start-1 lg:col-start-1 lg:col-span-6 lg:flex xl:col-span-6 relative overflow-hidden bg-gradient-to-br from-[#1E5ECC] via-[#193B9E] to-[#122568] text-white flex-col justify-between p-10 xl:p-14 select-none h-full">
        <div aria-hidden="true" className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-[#CFE0FF]/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -left-28 bottom-10 h-72 w-72 rounded-full bg-[#7FAAFF]/15 blur-3xl" />
        {/* Topo do painel */}
        <div className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#CFE0FF]/90">
          <FileText size={18} />
          Sua saúde em um só lugar
        </div>

        {/* Centro: Destaques de Utilidade */}
        <div className="relative z-10 my-auto flex flex-col gap-8 py-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight">
              Cuide da sua história de saúde com mais clareza.
            </h2>
            <p className="text-sm xl:text-base text-white/85 leading-relaxed">
              Reúna exames, receitas e informações importantes para encontrar tudo com tranquilidade quando precisar.
            </p>
          </div>

          <div className="flex flex-col gap-5 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-[#CFE0FF]">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Exames e Laudos</h4>
                <p className="text-xs text-white/75 leading-relaxed">Guarde exames de sangue, imagem e consultas em uma linha do tempo clara.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-[#CFE0FF]">
                <Heart size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Receitas e Medicamentos</h4>
                <p className="text-xs text-white/75 leading-relaxed">Acompanhe remédios prescritos, dosagens e instruções médicas com facilidade.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-[#CFE0FF]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Pronto para suas Consultas</h4>
                <p className="text-xs text-white/75 leading-relaxed">Apresente seu histórico completo ao médico sem precisar carregar papéis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do painel */}
        <div className="relative z-10 pt-6 border-t border-white/15 text-xs text-white/70">
          Saúde Memora • Praticidade e clareza para o seu histórico de saúde
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Modal: Recuperar Senha                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
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
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 sm:p-7 shadow-xl border border-slate-200"
            >
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage('');
                  setForgotError('');
                }}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Lock size={20} />
              </div>

              <h2 className="mt-3.5 text-lg font-bold text-slate-900">Recuperar senha</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Digite o e-mail da sua conta para receber as instruções de recuperação.
              </p>

              {forgotMessage ? (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-xs sm:text-sm text-blue-800 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{forgotMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                  {forgotError && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-red-600" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-slate-700">
                      Seu e-mail cadastrado
                    </label>
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
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex h-10 w-full items-center justify-center rounded-lg bg-blue-700 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                  >
                    {isForgotLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Enviar instruções'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
