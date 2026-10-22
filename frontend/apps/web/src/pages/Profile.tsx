import { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Mail,
  Shield,
  FileText,
  CreditCard,
  Upload,
  Trash2,
  Check,
  LoaderCircle,
  AlertTriangle,
  X,  LogOut,
  ArrowLeft,
  ChevronRight,
  ZoomIn,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  useGetApiPacientesMe,
  useGetApiFichaMedicaMe,
  usePatchApiPacientesMePerfil,
  deleteApiPacientesMe,
  customFetch,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useConsentimento, useSaveConsentimento } from '@/hooks/useConsentimento';
import { CarteirinhaModal } from '@/components/CarteirinhaModal';


export default function Profile() {
  const { toast } = useToast();
  const { signOut, isSigningOut } = useAuth();
  const {
    data: profileRaw,
    refetch,
    isLoading: isProfileLoading,
    isError: profileError,
  } = useGetApiPacientesMe();
  const { data: fichaRaw } = useGetApiFichaMedicaMe();
  const { data: consentimento } = useConsentimento();
  const patchPerfil = usePatchApiPacientesMePerfil();
  const saveConsentimento = useSaveConsentimento();

  const [activeTab, setActiveTab] = useState<'dados' | 'carteirinha' | 'seguranca' | 'privacidade'>('dados');
  const [mobileSectionOpen, setMobileSectionOpen] = useState(false);
  const [isCarteirinhaModalOpen, setIsCarteirinhaModalOpen] = useState(false);
  const sectionTitles = { dados: 'Dados pessoais', carteirinha: 'Carteirinha', seguranca: 'Segurança', privacidade: 'Privacidade' } as const;

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [contatoEmergencia, setContatoEmergencia] = useState('');
  const [senhaAtualPerfil, setSenhaAtualPerfil] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [planoSaude, setPlanoSaude] = useState('');
  const [numeroCarteirinha, setNumeroCarteirinha] = useState('');
  const [urlCarteirinha, setUrlCarteirinha] = useState('');
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState(false);

  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);
  const [passwordResetRequested, setPasswordResetRequested] = useState(false);

  // Consent Toggles
  const [consentOcr, setConsentOcr] = useState(false);
  const [consentChat, setConsentChat] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (!profileRaw) return;

    const p = profileRaw as any;
    setNome(p.nome || '');
    setEmail(p.email || '');
    setOriginalEmail(p.email || '');
    setNascimento(p.dataNascimento ? p.dataNascimento.split('T')[0] : '');
    setSexo(p.sexo || p.sexoBiologico || '');
    setContatoEmergencia(p.contatoEmergencia || '');
    setPlanoSaude(p.planoSaude || '');
    setNumeroCarteirinha(p.numeroCarteirinha || '');
    setUrlCarteirinha(p.urlCarteirinha || '');
  }, [profileRaw, toast]);

  useEffect(() => {
    if (!consentimento) return;
    setConsentOcr(consentimento.ocrAceito);
    setConsentChat(consentimento.chatAceito);
  }, [consentimento]);

  // Initials
  const initials = nome
    ? nome
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '—';

  const emailChanged =
    Boolean(originalEmail) && email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailChanged && !senhaAtualPerfil) {
      toast({
        title: 'Informe sua senha atual para alterar o e-mail',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      await patchPerfil.mutateAsync({
        data: {
          nome: nome.trim(),
          email: email.trim(),
          dataNascimento: nascimento,
          sexo,
          contatoEmergencia,
          senhaAtual: emailChanged ? senhaAtualPerfil : undefined,
        } as any,
      });
      toast({ title: 'Perfil atualizado com sucesso!' });
      setEmail(email.trim());
      setOriginalEmail(email.trim());
      setSenhaAtualPerfil('');
      refetch();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, 'Erro ao salvar alterações. Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveHealthCard = async () => {
    setIsSavingCard(true);
    try {
      await patchPerfil.mutateAsync({
        data: {
          planoSaude: planoSaude.trim(),
          numeroCarteirinha: numeroCarteirinha.trim(),
        } as any,
      });
      toast({ title: 'Carteirinha atualizada com sucesso!' });
      await refetch();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, 'Não foi possível salvar os dados da carteirinha.'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleUploadHealthCard = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    const allowedExtensions = /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!allowedTypes.has(file.type) || !allowedExtensions) {
      toast({ title: 'Selecione um arquivo PDF, JPG ou PNG.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'O arquivo deve ter no máximo 10 MB.', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingCard(true);
    try {
      const result = await customFetch('/api/pacientes/me/carteirinha', {
        method: 'POST',
        body: formData,
      }) as { url?: string; planoSaude?: string; numeroCarteirinha?: string };
      setUrlCarteirinha(result.url || '');
      if (result.planoSaude) setPlanoSaude(result.planoSaude);
      if (result.numeroCarteirinha) setNumeroCarteirinha(result.numeroCarteirinha);
      toast({ title: 'Carteirinha enviada', description: 'Confira os dados extraídos antes de salvar.' });
      await refetch();
    } catch (error) {
      const message = getApiErrorMessage(error, 'Não foi possível enviar a carteirinha.');
      toast({
        title: message === 'consentimento_necessario'
          ? 'Ative o consentimento de IA na seção Privacidade para enviar a carteirinha.'
          : message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCard(false);
    }
  };

  const handleDeleteHealthCard = async () => {
    setIsDeletingCard(true);
    try {
      await customFetch('/api/pacientes/me/carteirinha', { method: 'DELETE' });
      setUrlCarteirinha('');
      toast({ title: 'Imagem da carteirinha removida.' });
      await refetch();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, 'Não foi possível remover a imagem da carteirinha.'),
        variant: 'destructive',
      });
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleToggleConsent = async (finalidade: 'ocr' | 'chat', val: boolean) => {
    try {
      await saveConsentimento.mutateAsync({ aceito: val, finalidade });
      if (finalidade === 'ocr') setConsentOcr(val);
      else setConsentChat(val);
      toast({ title: val ? 'Consentimento atualizado' : 'Consentimento revogado' });
    } catch (error) {
      toast({ title: getApiErrorMessage(error, 'Erro ao atualizar consentimento.'), variant: 'destructive' });
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!email.trim()) {
      toast({ title: 'Não encontramos o e-mail da sua conta.', variant: 'destructive' });
      return;
    }

    setIsRequestingPasswordReset(true);
    setPasswordResetRequested(false);
    try {
      await customFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setPasswordResetRequested(true);
      toast({
        title: 'Solicitação enviada',
        description: 'Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
      });
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, 'Não foi possível solicitar a redefinição. Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setIsRequestingPasswordReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setIsDeleting(true);
    try {
      await deleteApiPacientesMe({ senha: deletePassword });
      toast({ title: 'Conta excluída com sucesso.' });
      signOut();
    } catch {
      toast({ title: 'Erro ao excluir conta', variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[#5a6a80]" role="status">
        <LoaderCircle size={22} className="mr-2 animate-spin" />
        Carregando seus dados…
      </div>
    );
  }

  if (profileError || !profileRaw) {
    return (
      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#E8664A]/30 bg-[#E8664A]/10 p-8 text-center">
        <p className="text-[#E8664A] font-medium" role="alert">
          Não foi possível carregar seu perfil. Suas informações não foram alteradas.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 min-h-[44px] rounded-xl bg-[#1D4ED8] px-5 font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all shadow-xs"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-3.5 sm:px-8 lg:px-10 pt-5 sm:pt-9 pb-16">
        {/* Header Title */}
        <div className={`flex justify-between items-end gap-4 sm:gap-5 mb-5 sm:mb-7 flex-wrap ${mobileSectionOpen ? 'hidden sm:flex' : ''}`}>
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1D4ED8]">
              Perfil
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#14211F]">
              Meu perfil
            </h1>
            <p className="mt-1.5 mb-0 text-[#5B6878] text-sm sm:text-base">
              Gerencie seus dados, segurança e privacidade.
            </p>
          </div>
        </div>

        {/* 2-col Layout */}
        <div className="flex gap-7 flex-wrap items-start">
          {/* Left Sidebar Tabs (240px) */}
          <div className={`w-full sm:w-[240px] flex flex-col gap-1 shrink-0 ${mobileSectionOpen ? 'hidden sm:flex' : ''}`}>
            <button
              onClick={() => { setActiveTab('dados'); setMobileSectionOpen(true); }}
              className={`flex items-center gap-2.5 border border-[#E3E8F0] bg-white px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left sm:border-transparent sm:bg-transparent ${
                activeTab === 'dados'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <User size={18} className={activeTab === 'dados' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              <span className="flex-1">Dados pessoais</span><ChevronRight size={17} className="ml-auto text-[#9aa8b8] sm:hidden" />
            </button>

            <button
              onClick={() => { setActiveTab('carteirinha'); setMobileSectionOpen(true); }}
              className={`flex items-center gap-2.5 border border-[#E3E8F0] bg-white px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left sm:border-transparent sm:bg-transparent ${
                activeTab === 'carteirinha'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <CreditCard size={18} className={activeTab === 'carteirinha' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              <span className="flex-1">Carteirinha</span><ChevronRight size={17} className="ml-auto text-[#9aa8b8] sm:hidden" />
            </button>

            <button
              onClick={() => { setActiveTab('seguranca'); setMobileSectionOpen(true); }}
              className={`flex items-center gap-2.5 border border-[#E3E8F0] bg-white px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left sm:border-transparent sm:bg-transparent ${
                activeTab === 'seguranca'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <Lock size={18} className={activeTab === 'seguranca' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              Segurança
            </button>

            <button
              onClick={() => { setActiveTab('privacidade'); setMobileSectionOpen(true); }}
              className={`flex items-center gap-2.5 border border-[#E3E8F0] bg-white px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all cursor-pointer text-left sm:border-transparent sm:bg-transparent ${
                activeTab === 'privacidade'
                  ? 'bg-[#CFE0FF]/40 text-[#1D4ED8] font-bold shadow-xs'
                  : 'text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#14211F]'
              }`}
            >
              <Shield size={18} className={activeTab === 'privacidade' ? 'text-[#1D4ED8]' : 'text-[#5B6878]'} />
              <span className="flex-1">Privacidade</span><ChevronRight size={17} className="ml-auto text-[#9aa8b8] sm:hidden" />
            </button>
          </div>

          {/* Right Column: Cards (flex: 1) */}
          <div className={`w-full min-w-0 flex-1 flex-col gap-5 ${mobileSectionOpen ? 'flex' : 'hidden'} sm:flex`}>
            {/* Top header bar stays static without animation */}
            <div className="mb-1 flex items-center gap-3 sm:hidden">
              <button type="button" onClick={() => setMobileSectionOpen(false)} aria-label="Voltar às opções do perfil" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E3E8F0] bg-white text-[#14211F] shadow-xs transition-colors hover:bg-[#F4F7FC]">
                <ArrowLeft size={19} />
              </button>
              <h2 className="m-0 text-xl font-bold text-[#14211F]">{sectionTitles[activeTab]}</h2>
            </div>

            {/* Content items with smooth entrance animation */}
            <div key={activeTab} className="w-full flex flex-col gap-5 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Card 1: Dados pessoais */}
            {activeTab === 'dados' && (
              <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                {/* Avatar & User summary */}
                <div className="flex gap-5 items-center mb-6">
                  <div className="w-[88px] h-[88px] rounded-[28px] bg-[#1D4ED8] text-white text-3xl font-extrabold flex items-center justify-center shrink-0 shadow-md">
                    {initials}
                  </div>
                  <div>
                    <b className="text-xl text-[#14211F] block">{nome || 'Nome não informado'}</b>
                    <div className="text-[#5B6878] text-sm mt-0.5">{email}</div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        required
                        pattern=".*\S.*"
                        autoComplete="name"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#E3E8F0] rounded-xl outline-none text-sm text-[#14211F] focus:border-[#1D4ED8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#14211F] mb-1.5">
                        Nascimento
                      </label>
                      <input
                        type="date"
                        value={nascimento}
                        onChange={(e) => setNascimento(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#E3E8F0] rounded-xl outline-none text-sm text-[#14211F] focus:border-[#1D4ED8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#14211F] mb-1.5">
                        Sexo biológico
                      </label>
                      <select
                        value={sexo}
                        onChange={(e) => setSexo(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#E3E8F0] rounded-xl outline-none text-sm text-[#14211F] focus:border-[#1D4ED8] bg-white cursor-pointer"
                      >
                        <option value="">Não informado</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#14211F] mb-1.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEmail((value) => value.trim())}
                        className="w-full h-[46px] px-3.5 border border-[#E3E8F0] rounded-xl outline-none text-sm text-[#14211F] focus:border-[#1D4ED8]"
                      />
                    </div>
                  </div>

                  {emailChanged && (
                    <div>
                      <label className="block text-[13px] font-semibold text-[#14211F] mb-1.5">
                        Senha atual para confirmar o novo e-mail
                      </label>
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={senhaAtualPerfil}
                        onChange={(e) => setSenhaAtualPerfil(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#E3E8F0] rounded-xl outline-none text-sm text-[#14211F] focus:border-[#1D4ED8]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[13px] font-semibold text-[#14211F] mb-1.5">
                      Contato de emergência
                    </label>
                    <input
                      type="text"
                      value={contatoEmergencia}
                      onChange={(e) => setContatoEmergencia(e.target.value)}
                      placeholder="Nome e telefone do contato"
                      className="w-full h-[46px] px-3.5 border border-[#E3E8F0] rounded-xl outline-none text-sm text-[#14211F] focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {isSavingProfile && <LoaderCircle size={16} className="animate-spin" />}
                      Salvar alterações
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'carteirinha' && (
              <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] flex items-center justify-center shrink-0">
                    <CreditCard size={18} className="text-[#1D4ED8]" />
                  </div>
                  <b className="text-base text-[#14211F] flex-1">Carteirinha do plano de saúde</b>
                </div>
                <p className="mb-5 ml-11 text-sm leading-relaxed text-[#5B6878]">
                  Cadastre os dados manualmente ou envie uma imagem para preencher os campos com ajuda da leitura automática. Confira as informações extraídas.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="plano-saude" className="mb-1.5 block text-[13px] font-semibold text-[#14211F]">
                        Nome do plano ou operadora
                      </label>
                      <input
                        id="plano-saude"
                        type="text"
                        autoComplete="organization"
                        value={planoSaude}
                        onChange={(event) => setPlanoSaude(event.target.value)}
                        placeholder="Ex.: nome da operadora"
                        className="h-[46px] w-full rounded-xl border border-[#E3E8F0] px-3.5 text-sm text-[#14211F] outline-none focus:border-[#1D4ED8]"
                      />
                    </div>
                    <div>
                      <label htmlFor="numero-carteirinha" className="mb-1.5 block text-[13px] font-semibold text-[#14211F]">
                        Número da carteirinha
                      </label>
                      <input
                        id="numero-carteirinha"
                        type="text"
                        autoComplete="off"
                        value={numeroCarteirinha}
                        onChange={(event) => setNumeroCarteirinha(event.target.value)}
                        placeholder="Número impresso no cartão"
                        className="h-[46px] w-full rounded-xl border border-[#E3E8F0] px-3.5 text-sm text-[#14211F] outline-none focus:border-[#1D4ED8]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveHealthCard()}
                    disabled={isSavingCard}
                    className="min-h-[44px] rounded-xl bg-[#1D4ED8] px-5 text-sm font-semibold text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all disabled:opacity-50 shadow-xs"
                  >
                    {isSavingCard && <LoaderCircle size={16} className="mr-2 inline animate-spin" />}
                    Salvar dados do plano
                  </button>
                </div>

                <div className="mt-6 border-t border-[#E3E8F0] pt-5">
                  <h3 className="mb-1 text-sm font-bold text-[#14211F]">Imagem da carteirinha</h3>
                  <p className="mb-4 text-xs leading-relaxed text-[#5B6878]">
                    Aceita PDF, JPG ou PNG de até 10 MB. O envio realiza a digitalização assistida e requer autorização de processamento ativada em Privacidade.
                  </p>
                  {urlCarteirinha && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-[#E3E8F0] bg-[#F4F7FC]">
                      {/\.pdf(?:[?#]|$)/i.test(urlCarteirinha) ? (
                        <button
                          type="button"
                          onClick={() => setIsCarteirinhaModalOpen(true)}
                          className="flex min-h-16 w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-[#1D4ED8] hover:bg-[#CFE0FF]/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="shrink-0" />
                            <span>Abrir arquivo da carteirinha</span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#CFE0FF] px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">
                            <ZoomIn size={13} />
                            Ver no modal
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsCarteirinhaModalOpen(true)}
                          aria-label="Abrir carteirinha de saúde no modal"
                          className="group relative block w-full cursor-zoom-in text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
                        >
                          <div className="relative flex items-center justify-center overflow-hidden bg-white p-2">
                            <img
                              src={urlCarteirinha}
                              alt="Carteirinha de plano de saúde cadastrada"
                              className="max-h-64 w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 rounded-lg">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-md">
                                <ZoomIn size={14} />
                                Clique para abrir a carteirinha
                              </span>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className={`min-h-[44px] cursor-pointer rounded-xl border border-[#E3E8F0] bg-white px-4 text-sm font-semibold text-[#14211F] inline-flex items-center gap-2 hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all shadow-xs ${isUploadingCard ? 'pointer-events-none opacity-50' : ''}`}>
                      {isUploadingCard
                        ? <LoaderCircle size={16} className="animate-spin" />
                        : <Upload size={16} />}
                      {isUploadingCard ? 'Enviando…' : urlCarteirinha ? 'Substituir imagem' : 'Enviar carteirinha'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleUploadHealthCard}
                        disabled={isUploadingCard}
                        className="sr-only"
                      />
                    </label>
                    {urlCarteirinha && (
                      <button
                        type="button"
                        onClick={() => setIsCarteirinhaModalOpen(true)}
                        className="min-h-[44px] rounded-xl border border-[#1D4ED8]/30 bg-[#CFE0FF]/40 px-4 text-sm font-semibold text-[#1D4ED8] inline-flex items-center gap-2 hover:bg-[#CFE0FF] transition-all shadow-xs cursor-pointer"
                      >
                        <ZoomIn size={16} />
                        Ver carteirinha
                      </button>
                    )}
                    {urlCarteirinha && (
                      <button
                        type="button"
                        onClick={handleDeleteHealthCard}
                        disabled={isDeletingCard}
                        className="min-h-[44px] rounded-xl border border-[#E8664A]/30 bg-white px-4 text-sm font-semibold text-[#E8664A] inline-flex items-center gap-2 hover:bg-[#FDE1DA] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isDeletingCard
                          ? <LoaderCircle size={16} className="animate-spin" />
                          : <Trash2 size={16} />}
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Card 2: Segurança */}
            {activeTab === 'seguranca' && (
              <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-[#1D4ED8]" />
                  </div>
                  <b className="text-base text-[#14211F] flex-1">Segurança</b>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-[#5B6878]">
                  Enviaremos para <strong className="text-[#14211F]">{email}</strong> um link seguro para redefinir sua senha.
                </p>
                {passwordResetRequested && (
                  <p role="status" className="mb-4 rounded-xl bg-[#CFE0FF]/40 border border-[#CFE0FF] p-3 text-sm text-[#1D4ED8] font-medium">
                    Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleRequestPasswordReset()}
                  disabled={isRequestingPasswordReset || passwordResetRequested}
                  className="min-h-[44px] rounded-xl border border-[#E3E8F0] bg-white px-5 text-sm font-semibold text-[#14211F] transition-all hover:bg-[#F4F7FC] hover:border-[#CFE0FF] shadow-xs disabled:opacity-50"
                >
                  {isRequestingPasswordReset && <LoaderCircle size={16} className="mr-2 inline animate-spin" />}
                  {passwordResetRequested ? 'E-mail solicitado' : 'Enviar link para redefinir senha'}
                </button>
              </div>
            )}

            {/* Card 3: Privacidade e consentimento */}
            {activeTab === 'privacidade' && (
              <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-4 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-[#1D4ED8]" />
                  </div>
                  <b className="text-base text-[#14211F] flex-1">
                    Privacidade e consentimento
                  </b>
                </div>

                <div className="divide-y divide-[#dde3ec]">
                  {/* Toggle 1 */}
                  <div className="flex gap-4 items-center py-4">
                    <div className="flex-1">
                      <b className="text-[15px] text-[#1d2a3d] block">
                        Leitura de documentos com IA
                      </b>
                      <div className="text-[13px] text-[#5a6a80] mt-0.5 leading-relaxed">
                        Permite organizar as informações dos documentos que você enviar.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={consentOcr}
                      disabled={saveConsentimento.isPending}
                      onClick={() => void handleToggleConsent('ocr', !consentOcr)}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        consentOcr ? 'bg-[#1D4ED8]' : 'bg-[#E3E8F0]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all shadow-xs ${
                          consentOcr ? 'right-[3px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2 */}
                  <div className="flex gap-4 items-center py-4">
                    <div className="flex-1">
                      <b className="text-[15px] text-[#14211F] block">
                        Assistente Clínico Pessoal (Memora)
                      </b>
                      <div className="text-[13px] text-[#5B6878] mt-0.5 leading-relaxed">
                        Permite consultar seu histórico de laudos, prescrições e exames em linguagem natural com segurança e privacidade estrita.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={consentChat}
                      disabled={saveConsentimento.isPending}
                      onClick={() => void handleToggleConsent('chat', !consentChat)}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        consentChat ? 'bg-[#1D4ED8]' : 'bg-[#E3E8F0]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all shadow-xs ${
                          consentChat ? 'right-[3px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Encerramento de sessão e exclusão de conta ficam apenas em Privacidade */}
            {activeTab === 'privacidade' && (
              <>
                <section className="mt-6 rounded-[20px] border border-[#E3E8F0] bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5 shadow-xs">
                  <div>
                    <h2 className="text-sm font-bold text-[#14211F]">Sair da conta</h2>
                    <p className="mt-1 text-sm text-[#5B6878]">Encerre sua sessão neste dispositivo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    disabled={isSigningOut}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E8664A]/40 bg-white px-4 text-sm font-semibold text-[#E8664A] transition-all hover:bg-[#FDE1DA] hover:border-[#E8664A] shadow-xs disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
                  >
                    {isSigningOut ? <LoaderCircle size={17} className="animate-spin" /> : <LogOut size={17} />}
                    {isSigningOut ? 'Saindo...' : 'Sair da conta'}
                  </button>
                </section>

                <div className="mt-4 flex flex-wrap items-center gap-4.5 rounded-[20px] border border-[#E8664A]/30 bg-[#FDE1DA] p-4 sm:p-7">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8664A]/20 flex items-center justify-center shrink-0">
                    <Trash2 size={24} className="text-[#9B2C16]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="text-[17px] text-[#9B2C16] block leading-tight">
                      Excluir conta
                    </b>
                    <div className="text-sm text-[#9B2C16] mt-1 leading-relaxed">
                      Apaga sua conta e seus documentos. Essa ação não pode ser desfeita.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="min-h-[44px] px-5 rounded-xl bg-[#E8664A] hover:bg-[#D45338] text-white font-semibold text-sm inline-flex items-center transition-all shadow-xs cursor-pointer active:bg-[#B9381E]"
                  >
                    Excluir conta
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>

      </main>

      {/* Delete Account Modal Dialog */}
      <DialogPrimitive.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E3E8F0] outline-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#9B2C16]">Confirmar exclusão de conta</h3>
              <DialogPrimitive.Close className="p-1 rounded-lg text-[#5B6878] hover:bg-[#F4F7FC]">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>

            <p className="text-sm text-[#5B6878] leading-relaxed mb-6">
              Todos os seus exames, receitas, prontuários e acessos serão permanentemente apagados dos nossos servidores. Tem certeza?
            </p>

            <label htmlFor="delete-account-password" className="mb-1.5 block text-sm font-semibold text-[#14211F]">
              Confirme sua senha
            </label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              className="mb-5 min-h-11 w-full rounded-xl border border-[#E3E8F0] px-3 text-sm outline-none focus:border-[#1D4ED8]"
              required
            />

            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="min-h-11 px-5 rounded-xl border border-[#E3E8F0] bg-white text-[#14211F] font-semibold text-sm hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all shadow-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="min-h-11 px-5 rounded-xl bg-[#E8664A] text-white font-semibold text-sm hover:bg-[#D45338] active:bg-[#B9381E] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 shadow-xs"
              >
                {isDeleting && <LoaderCircle size={16} className="animate-spin" />}
                Sim, apagar tudo
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Modal da Carteirinha de Saúde */}
      <CarteirinhaModal
        open={isCarteirinhaModalOpen}
        onOpenChange={setIsCarteirinhaModalOpen}
        initialTab="documento"
        user={{
          id: (profileRaw as any)?.id,
          nome,
          dataNascimento: nascimento,
          sexo,
          planoSaude,
          numeroCarteirinha,
          urlCarteirinha,
          cpf: (profileRaw as any)?.cpf,
          contatoEmergencia,
        }}
        ficha={fichaRaw as any}
      />
    </div>
  );
}
