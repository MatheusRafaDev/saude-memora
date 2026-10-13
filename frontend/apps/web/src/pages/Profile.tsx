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
  X,
  Phone,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  useGetApiPacientesMe,
  usePatchApiPacientesMePerfil,
  deleteApiPacientesMe,
  customFetch,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useConsentimento, useSaveConsentimento } from '@/hooks/useConsentimento';

export default function Profile() {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const {
    data: profileRaw,
    refetch,
    isLoading: isProfileLoading,
    isError: profileError,
  } = useGetApiPacientesMe();
  const { data: consentimento } = useConsentimento();
  const patchPerfil = usePatchApiPacientesMePerfil();
  const saveConsentimento = useSaveConsentimento();

  const [activeTab, setActiveTab] = useState<'dados' | 'carteirinha' | 'seguranca' | 'privacidade'>('dados');

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [contatoEmergencia, setContatoEmergencia] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
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
    setTelefone(p.telefone || '');
    setEndereco(p.endereco || '');
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

  const handleSaveContact = async () => {
    setIsSavingContact(true);
    try {
      await customFetch('/api/pacientes/me/contato', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefone.trim(), endereco: endereco.trim() }),
      });
      await refetch();
      toast({ title: 'Telefone e endereço atualizados.' });
    } catch (error) {
      toast({ title: getApiErrorMessage(error, 'Não foi possível salvar o contato.'), variant: 'destructive' });
    } finally {
      setIsSavingContact(false);
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
      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#f0b8b2] bg-white p-8 text-center">
        <p className="text-[#a13a30]" role="alert">
          Não foi possível carregar seu perfil. Suas informações não foram alteradas.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 min-h-[44px] rounded-xl bg-[#1b3a60] px-5 font-bold text-white hover:bg-[#24507f]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1f7fe0]">
              Perfil
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Meu perfil
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              Gerencie seus dados, segurança e privacidade.
            </p>
          </div>
        </div>

        {/* 2-col Layout */}
        <div className="flex gap-7 flex-wrap items-start">
          {/* Left Sidebar Tabs (240px) */}
          <div className="w-full sm:w-[240px] flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('dados')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'dados'
                  ? 'bg-[#f1f4f8] text-[#1b3a60] font-bold shadow-xs'
                  : 'text-[#5a6a80] hover:bg-slate-50'
              }`}
            >
              <User size={18} className={activeTab === 'dados' ? 'text-[#1b3a60]' : 'text-[#5a6a80]'} />
              Dados pessoais
            </button>

            <button
              onClick={() => setActiveTab('carteirinha')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'carteirinha'
                  ? 'bg-[#f1f4f8] text-[#1b3a60] font-bold shadow-xs'
                  : 'text-[#5a6a80] hover:bg-slate-50'
              }`}
            >
              <CreditCard size={18} className={activeTab === 'carteirinha' ? 'text-[#1b3a60]' : 'text-[#5a6a80]'} />
              Carteirinha
            </button>

            <button
              onClick={() => setActiveTab('seguranca')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'seguranca'
                  ? 'bg-[#f1f4f8] text-[#1b3a60] font-bold shadow-xs'
                  : 'text-[#5a6a80] hover:bg-slate-50'
              }`}
            >
              <Lock size={18} className={activeTab === 'seguranca' ? 'text-[#1b3a60]' : 'text-[#5a6a80]'} />
              Segurança
            </button>

            <button
              onClick={() => setActiveTab('privacidade')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'privacidade'
                  ? 'bg-[#f1f4f8] text-[#1b3a60] font-bold shadow-xs'
                  : 'text-[#5a6a80] hover:bg-slate-50'
              }`}
            >
              <Shield size={18} className={activeTab === 'privacidade' ? 'text-[#1b3a60]' : 'text-[#5a6a80]'} />
              Privacidade
            </button>
          </div>

          {/* Right Column: Cards (flex: 1) */}
          <div className="w-full min-w-0 flex-1 flex flex-col gap-5">
            {/* Card 1: Dados pessoais */}
            {activeTab === 'dados' && (
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-4 sm:p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                {/* Avatar & User summary */}
                <div className="flex gap-5 items-center mb-6">
                  <div className="w-[88px] h-[88px] rounded-[28px] bg-gradient-to-br from-[#1f7fe0] to-[#1b3a60] text-white text-3xl font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div>
                    <b className="text-xl text-[#1d2a3d] block">{nome || 'Nome não informado'}</b>
                    <div className="text-[#5a6a80] text-sm mt-0.5">{email}</div>
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
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                        Nascimento
                      </label>
                      <input
                        type="date"
                        value={nascimento}
                        onChange={(e) => setNascimento(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                        Sexo biológico
                      </label>
                      <select
                        value={sexo}
                        onChange={(e) => setSexo(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60] bg-white cursor-pointer"
                      >
                        <option value="">Não informado</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEmail((value) => value.trim())}
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                      />
                    </div>
                  </div>

                  {emailChanged && (
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                        Senha atual para confirmar o novo e-mail
                      </label>
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={senhaAtualPerfil}
                        onChange={(e) => setSenhaAtualPerfil(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                      Contato de emergência
                    </label>
                    <input
                      type="text"
                      value={contatoEmergencia}
                      onChange={(e) => setContatoEmergencia(e.target.value)}
                      placeholder="Nome e telefone do contato"
                      className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="profile-phone" className="mb-1.5 block text-[13px] font-semibold text-[#1d2a3d]">Telefone</label>
                      <input
                        id="profile-phone"
                        type="tel"
                        autoComplete="tel"
                        value={telefone}
                        onChange={(event) => setTelefone(event.target.value)}
                        className="h-[46px] w-full rounded-xl border border-[#c6cfdb] px-3.5 text-sm outline-none focus:border-[#1b3a60]"
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-address" className="mb-1.5 block text-[13px] font-semibold text-[#1d2a3d]">Endereço</label>
                      <input
                        id="profile-address"
                        type="text"
                        autoComplete="street-address"
                        value={endereco}
                        onChange={(event) => setEndereco(event.target.value)}
                        className="h-[46px] w-full rounded-xl border border-[#c6cfdb] px-3.5 text-sm outline-none focus:border-[#1b3a60]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveContact}
                      disabled={isSavingContact}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-4 text-sm font-bold text-[#1b3a60] hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isSavingContact ? <LoaderCircle size={15} className="animate-spin" /> : <Phone size={15} />}
                      Salvar telefone e endereço
                    </button>
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1b3a60] text-white hover:bg-[#24507f] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile && <LoaderCircle size={16} className="animate-spin" />}
                      Salvar alterações
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'carteirinha' && (
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-4 sm:p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <CreditCard size={18} className="text-[#1b3a60]" />
                  </div>
                  <b className="text-base text-[#1d2a3d] flex-1">Carteirinha do plano de saúde</b>
                </div>
                <p className="mb-5 ml-11 text-sm leading-relaxed text-[#5a6a80]">
                  Cadastre os dados manualmente ou envie uma imagem para preencher os campos com ajuda da leitura automática. Confira as informações extraídas.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="plano-saude" className="mb-1.5 block text-[13px] font-semibold text-[#1d2a3d]">
                        Nome do plano ou operadora
                      </label>
                      <input
                        id="plano-saude"
                        type="text"
                        autoComplete="organization"
                        value={planoSaude}
                        onChange={(event) => setPlanoSaude(event.target.value)}
                        placeholder="Ex.: nome da operadora"
                        className="h-[46px] w-full rounded-xl border border-[#c6cfdb] px-3.5 text-sm text-[#1d2a3d] outline-none focus:border-[#1b3a60]"
                      />
                    </div>
                    <div>
                      <label htmlFor="numero-carteirinha" className="mb-1.5 block text-[13px] font-semibold text-[#1d2a3d]">
                        Número da carteirinha
                      </label>
                      <input
                        id="numero-carteirinha"
                        type="text"
                        autoComplete="off"
                        value={numeroCarteirinha}
                        onChange={(event) => setNumeroCarteirinha(event.target.value)}
                        placeholder="Número impresso no cartão"
                        className="h-[46px] w-full rounded-xl border border-[#c6cfdb] px-3.5 text-sm text-[#1d2a3d] outline-none focus:border-[#1b3a60]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveHealthCard()}
                    disabled={isSavingCard}
                    className="min-h-[44px] rounded-xl bg-[#1b3a60] px-5 text-sm font-bold text-white hover:bg-[#24507f] disabled:opacity-50"
                  >
                    {isSavingCard && <LoaderCircle size={16} className="mr-2 inline animate-spin" />}
                    Salvar dados do plano
                  </button>
                </div>

                <div className="mt-6 border-t border-[#dde3ec] pt-5">
                  <h3 className="mb-1 text-sm font-bold text-[#1d2a3d]">Imagem da carteirinha</h3>
                  <p className="mb-4 text-xs leading-relaxed text-[#5a6a80]">
                    Aceita PDF, JPG ou PNG de até 10 MB. O envio usa leitura automática e requer consentimento de IA ativado em Privacidade.
                  </p>
                  {urlCarteirinha && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-[#dde3ec] bg-[#f7f9fc]">
                      {/\.pdf(?:[?#]|$)/i.test(urlCarteirinha) ? (
                        <a
                          href={urlCarteirinha}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-16 items-center gap-2 px-4 text-sm font-semibold text-[#1b3a60] hover:bg-[#f1f4f8]"
                        >
                          <FileText size={18} />
                          Abrir arquivo da carteirinha
                        </a>
                      ) : (
                        <a
                          href={urlCarteirinha}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Abrir imagem da carteirinha"
                        >
                          <img
                            src={urlCarteirinha}
                            alt="Carteirinha de plano de saúde cadastrada"
                            className="max-h-64 w-full object-contain"
                          />
                        </a>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className={`min-h-[44px] cursor-pointer rounded-xl border border-[#c6cfdb] bg-white px-4 text-sm font-bold text-[#1b3a60] inline-flex items-center gap-2 hover:bg-[#f7f9fc] ${isUploadingCard ? 'pointer-events-none opacity-50' : ''}`}>
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
                        onClick={handleDeleteHealthCard}
                        disabled={isDeletingCard}
                        className="min-h-[44px] rounded-xl border border-[#f0b8b2] bg-white px-4 text-sm font-bold text-[#a13a30] inline-flex items-center gap-2 hover:bg-[#fff5f4] disabled:opacity-50"
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
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-4 sm:p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-[#1b3a60]" />
                  </div>
                  <b className="text-base text-[#1d2a3d] flex-1">Segurança</b>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-[#5a6a80]">
                  Enviaremos para <strong className="text-[#1d2a3d]">{email}</strong> um link seguro para redefinir sua senha.
                </p>
                {passwordResetRequested && (
                  <p role="status" className="mb-4 rounded-xl bg-[#f1f7ff] p-3 text-sm text-[#1b3a60]">
                    Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleRequestPasswordReset()}
                  disabled={isRequestingPasswordReset || passwordResetRequested}
                  className="min-h-[44px] rounded-xl border border-[#dde3ec] bg-white px-5 text-sm font-bold text-[#1b3a60] transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  {isRequestingPasswordReset && <LoaderCircle size={16} className="mr-2 inline animate-spin" />}
                  {passwordResetRequested ? 'E-mail solicitado' : 'Enviar link para redefinir senha'}
                </button>
              </div>
            )}

            {/* Card 3: Privacidade e consentimento */}
            {activeTab === 'privacidade' && (
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-4 sm:p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-[#1b3a60]" />
                  </div>
                  <b className="text-base text-[#1d2a3d] flex-1">
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
                        consentOcr ? 'bg-[#1f7fe0]' : 'bg-[#c6cfdb]'
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
                      <b className="text-[15px] text-[#1d2a3d] block">
                        Assistente de chat (Mémora)
                      </b>
                      <div className="text-[13px] text-[#5a6a80] mt-0.5 leading-relaxed">
                        Permite consultar seu histórico em linguagem natural.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={consentChat}
                      disabled={saveConsentimento.isPending}
                      onClick={() => void handleToggleConsent('chat', !consentChat)}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        consentChat ? 'bg-[#1f7fe0]' : 'bg-[#c6cfdb]'
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

            {/* Card 4: Excluir conta Danger Card */}
            {activeTab === 'dados' && (
              <div className="bg-[#fff5f4] border border-[#f0b8b2] rounded-[20px] p-4 sm:p-7 flex gap-4.5 items-center flex-wrap">
                <div className="w-12 h-12 rounded-2xl bg-[#fde8e6] flex items-center justify-center shrink-0">
                  <Trash2 size={24} className="text-[#a13a30]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <b className="text-[17px] text-[#7a2a22] block leading-tight">
                    Excluir conta
                  </b>
                  <div className="text-sm text-[#7a2a22] mt-1 leading-relaxed">
                    Apaga sua conta e seus documentos. Essa ação não pode ser desfeita.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="min-h-[44px] px-5 rounded-xl bg-[#c0463a] hover:bg-[#a13a30] text-white font-bold text-sm inline-flex items-center transition-colors shadow-xs cursor-pointer"
                >
                  Solicitar exclusão
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Os dados e preferências exibidos pertencem à sua conta.
        </p>
      </main>

      {/* Delete Account Modal Dialog */}
      <DialogPrimitive.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#dde3ec] outline-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#a13a30]">Confirmar exclusão de conta</h3>
              <DialogPrimitive.Close className="p-1 rounded-lg text-[#5a6a80] hover:bg-slate-100">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>

            <p className="text-sm text-[#5a6a80] leading-relaxed mb-6">
              Todos os seus exames, receitas, prontuários e acessos serão permanentemente apagados dos nossos servidores. Tem certeza?
            </p>

            <label htmlFor="delete-account-password" className="mb-1.5 block text-sm font-bold text-[#1d2a3d]">
              Confirme sua senha
            </label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              className="mb-5 min-h-11 w-full rounded-xl border border-[#dde3ec] px-3 text-sm outline-none focus:border-[#1f7fe0]"
              required
            />

            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2.5 rounded-xl border border-[#dde3ec] text-[#5a6a80] font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="px-5 py-2.5 rounded-xl bg-[#c0463a] text-white font-bold text-sm hover:bg-[#a13a30] cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {isDeleting && <LoaderCircle size={16} className="animate-spin" />}
                Sim, apagar tudo
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
