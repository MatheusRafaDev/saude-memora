import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  X,
  Lock,
  AlertCircle,
  CheckCircle2,
  Check,
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
      } else {
        setMode('login');
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

        // Switch to login tab with success alert
        switchMode('login', 'Conta criada com sucesso! Faça login para continuar.');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Ocorreu um erro ao processar sua solicitação. Verifique seus dados.'));
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
    <div
      className="min-h-screen bg-white text-[#173754] font-sans selection:bg-[#CFE0FF] selection:text-[#1D4ED8]"
      style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
    >
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] gap-8 box-border">
        {/* ── PAINEL DO FORMULÁRIO (ESQUERDA) ────────────────────────── */}
        <section className="flex flex-col justify-between px-2 sm:px-6 lg:px-12 py-4">
          {/* Topo: Logo & Voltar */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" aria-label="Saúde Memora — início" className="transition-opacity hover:opacity-90">
              <BrandWordmark height={28} />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#536C80] hover:text-[#2357D9] transition-colors py-1 px-2.5 rounded-lg hover:bg-[#F7F9FC]"
            >
              <ChevronLeft size={16} />
              <span>Voltar ao início</span>
            </Link>
          </div>

          {/* Área Central do Formulário */}
          <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
            <div className="w-full max-w-[400px]">
              {/* Abas Alternadoras (Tabs) */}
              <div className="flex gap-1 bg-[#EEF3FA] rounded-[14px] p-1 mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 text-center py-2.5 px-2 rounded-[10px] text-[14px] font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-[#2357D9] shadow-[0_1px_4px_rgba(18,42,83,0.12)]'
                      : 'text-[#607187] hover:text-[#173754]'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 text-center py-2.5 px-2 rounded-[10px] text-[14px] font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-[#2357D9] shadow-[0_1px_4px_rgba(18,42,83,0.12)]'
                      : 'text-[#607187] hover:text-[#173754]'
                  }`}
                >
                  Criar conta
                </button>
              </div>

              {/* Mensagens de Sucesso e Erro */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
                      <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600" />
                      <span className="leading-relaxed font-medium">{error}</span>
                    </div>
                  </motion.div>
                )}

                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="rounded-xl border border-blue-200 bg-[#EEF3FA] p-3.5 text-xs sm:text-sm text-[#2357D9] flex items-start gap-2.5">
                      <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-[#2357D9]" />
                      <span className="leading-relaxed font-medium">{message}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulário: LOGIN */}
              {mode === 'login' ? (
                <div>
                  <h1 className="text-[32px] sm:text-[36px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#173754] mb-2.5">
                    Bem-vindo de volta
                  </h1>
                  <p className="text-[#536C80] text-[15px] mb-8 leading-relaxed">
                    Entre para acessar seus exames, receitas e todo o seu histórico de saúde.
                  </p>

                  <form onSubmit={submit} className="space-y-5">
                    <div>
                      <label className="block mb-2 text-[#24364B] text-[13px] font-bold" htmlFor="email">
                        E-mail
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="voce@email.com"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full h-12 px-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[15px] font-medium outline-none transition-all focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-[#24364B] text-[13px] font-bold" htmlFor="pw">
                        Senha
                      </label>
                      <div className="relative">
                        <input
                          id="pw"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          placeholder="Digite sua senha"
                          value={form.password}
                          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                          className="w-full h-12 px-3.5 pr-11 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[15px] font-medium outline-none transition-all focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
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

                    <div className="flex justify-between items-center text-[14px] pt-1 pb-2">
                      <label className="flex items-center gap-2.5 text-[#536C80] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-[#D8E1EC] text-[#2357D9] focus:ring-[#2357D9]"
                        />
                        <span>Manter conectado</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[#2357D9] font-semibold hover:underline cursor-pointer"
                      >
                        Esqueci a senha
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-[54px] rounded-[14px] bg-gradient-to-br from-[#3169DF] to-[#2357D9] hover:from-[#2a5fc9] hover:to-[#1F4FC5] text-white font-bold text-[16px] shadow-[0_10px_24px_rgba(35,87,217,0.2)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:translate-y-0.5"
                    >
                      {isPending ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <span>Entrar</span>
                      )}
                    </button>
                  </form>

                  <p className="mt-7 text-center text-[#536C80] text-[15px]">
                    Ainda não tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-[#2357D9] font-bold hover:underline cursor-pointer"
                    >
                      Criar conta
                    </button>
                  </p>
                </div>
              ) : (
                /* Formulário: CADASTRO / CRIAR CONTA */
                <div>
                  <h1 className="text-[30px] sm:text-[34px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#173754] mb-2.5">
                    Crie sua conta
                  </h1>
                  <p className="text-[#536C80] text-[15px] mb-6 leading-relaxed">
                    Organize seus exames e receitas em um só lugar.
                  </p>

                  <form onSubmit={submit} className="space-y-3.5">
                    <div>
                      <label className="block mb-2 text-[#24364B] text-[13px] font-bold" htmlFor="signup-name">
                        Nome completo
                      </label>
                      <input
                        id="signup-name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Seu nome completo"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full h-12 px-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[15px] font-medium outline-none transition-all focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-2 text-[#24364B] text-[13px] font-bold" htmlFor="signup-birth">
                          Data de nascimento
                        </label>
                        <input
                          id="signup-birth"
                          type="date"
                          required
                          autoComplete="bday"
                          max={new Date().toISOString().slice(0, 10)}
                          value={form.birthDate}
                          onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                          className="w-full h-12 px-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[15px] font-medium outline-none transition-all focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-[#24364B] text-[13px] font-bold" htmlFor="signup-sex">
                          Sexo biológico
                        </label>
                        <select
                          id="signup-sex"
                          value={form.sex}
                          onChange={(e) => setForm((prev) => ({ ...prev, sex: e.target.value }))}
                          className="w-full h-12 px-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[15px] font-medium outline-none transition-all focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
                        >
                          <option value="">Selecione</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-[#24364B] text-[13px] font-bold" htmlFor="signup-email">
                        E-mail
                      </label>
                      <input
                        id="signup-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="voce@email.com"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full h-12 px-3.5 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[15px] font-medium outline-none transition-all focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-[#24364B] text-[13px] font-bold" htmlFor="signup-password">
                        Senha
                      </label>
                      <div className="relative">
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          placeholder="Mínimo de 8 caracteres"
                          value={form.password}
                          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                          className="w-full h-12 px-3.5 pr-11 rounded-xl border border-[#D8E1EC] bg-white text-[#18324B] text-[15px] font-medium outline-none transition-all focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
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

                    <label className="flex items-start gap-2.5 text-[#536C80] text-[12px] leading-relaxed pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(e) => setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 rounded border-[#D8E1EC] text-[#2357D9] focus:ring-[#2357D9]"
                      />
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

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-[54px] rounded-[14px] bg-gradient-to-br from-[#3169DF] to-[#2357D9] hover:from-[#2a5fc9] hover:to-[#1F4FC5] text-white font-bold text-[16px] shadow-[0_10px_24px_rgba(35,87,217,0.2)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:translate-y-0.5"
                    >
                      {isPending ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <span>Criar minha conta</span>
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-[#536C80] text-[14px]">
                    Já possui conta?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-[#2357D9] font-bold hover:underline cursor-pointer"
                    >
                      Fazer login
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé informativo */}
          <p className="text-[13px] text-[#536C80] text-center mt-6">
            Seus dados de saúde ficam protegidos e só você acessa.
          </p>
        </section>

        {/* ── PAINEL DA DIREITA (ASIDE AZUL COM IMAGEM E PONTOS) ───────── */}
        <aside className="hidden lg:flex bg-[#1C51BB] rounded-[32px] p-8 xl:p-10 flex-col gap-7 text-white justify-between shadow-xl">
          <div>
            <img
              src="/images/hero-home.jpg"
              alt="Mulher à mesa com o celular e documentos organizados"
              className="w-full aspect-[4/3] object-cover rounded-[20px] shadow-md block mb-8"
              loading="lazy"
            />

            <h2 className="text-[28px] xl:text-[32px] leading-[1.2] tracking-[-0.015em] font-extrabold max-w-[20ch] text-white mb-6">
              Todo o seu histórico médico num só lugar.
            </h2>

            <div className="grid gap-4 font-medium text-[15px] xl:text-[16px]">
              <div className="flex items-center gap-3.5">
                <span className="w-[38px] h-[38px] rounded-full bg-white text-[#1C51BB] flex items-center justify-center shrink-0 shadow-sm">
                  <Check size={18} strokeWidth={2.5} />
                </span>
                <span>Guarde exames, receitas e prontuários</span>
              </div>

              <div className="flex items-center gap-3.5">
                <span className="w-[38px] h-[38px] rounded-full bg-white text-[#1C51BB] flex items-center justify-center shrink-0 shadow-sm">
                  <Check size={18} strokeWidth={2.5} />
                </span>
                <span>Leitura automática dos documentos</span>
              </div>

              <div className="flex items-center gap-3.5">
                <span className="w-[38px] h-[38px] rounded-full bg-white text-[#1C51BB] flex items-center justify-center shrink-0 shadow-sm">
                  <Check size={18} strokeWidth={2.5} />
                </span>
                <span>Acesse rápido em consultas e emergências</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 text-xs text-white/80">
            Saúde Memora • Seu histórico de saúde, sempre à mão.
          </div>
        </aside>
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
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
                <div className="mt-5 rounded-xl border border-blue-200 bg-[#EEF3FA] p-3.5 text-xs sm:text-sm text-[#2357D9] flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#2357D9] shrink-0 mt-0.5" />
                  <span>{forgotMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                  {forgotError && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-red-600" />
                      <span>{forgotError}</span>
                    </div>
                  )}
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
                      className="h-11 w-full rounded-xl border border-[#D8E1EC] bg-white px-3.5 text-sm text-[#18324B] outline-none focus:border-[#4C7BE7] focus:ring-4 focus:ring-[#2357D9]/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#3169DF] to-[#2357D9] text-sm font-bold text-white shadow-md transition-all hover:from-[#2a5fc9] hover:to-[#1F4FC5] disabled:opacity-50 cursor-pointer"
                  >
                    {isForgotLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Enviar instruções'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
