import { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Shield,
  FileText,
  Trash2,
  Check,
  LoaderCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  useGetApiPacientesMe,
  usePatchApiPacientesMePerfil,
  useDeleteApiPacientesMe,
  customFetch,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { data: profileRaw, refetch } = useGetApiPacientesMe();
  const patchPerfil = usePatchApiPacientesMePerfil();
  const deleteAccount = useDeleteApiPacientesMe();

  const [activeTab, setActiveTab] = useState<'dados' | 'seguranca' | 'privacidade' | 'conta'>('dados');

  // Form State
  const [nome, setNome] = useState('Ana Souza');
  const [email, setEmail] = useState('ana@exemplo.com');
  const [nascimento, setNascimento] = useState('1992-03-14');
  const [sexo, setSexo] = useState('Feminino');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Consent Toggles
  const [consentOcr, setConsentOcr] = useState(true);
  const [consentChat, setConsentChat] = useState(true);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profileRaw) {
      const p = profileRaw as any;
      if (p.nome) setNome(p.nome);
      if (p.email) setEmail(p.email);
      if (p.dataNascimento) {
        setNascimento(p.dataNascimento.split('T')[0]);
      }
      if (p.sexo || p.sexoBiologico) setSexo(p.sexo || p.sexoBiologico);
      if (p.consentimentoIa) {
        setConsentOcr(Boolean(p.consentimentoIa.aceito));
        setConsentChat(Boolean(p.consentimentoIa.aceito));
      }
    }
    customFetch('/api/pacientes/me/consentimento')
      .then((c: any) => {
        if (c && c.aceito !== undefined) {
          setConsentOcr(Boolean(c.aceito));
          setConsentChat(Boolean(c.aceito));
        }
      })
      .catch(() => {});
  }, [profileRaw]);

  // Initials
  const initials = nome
    ? nome
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AS';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await patchPerfil.mutateAsync({
        data: {
          nome,
          email,
          dataNascimento: nascimento,
          sexo,
        } as any,
      });
      toast({ title: 'Perfil atualizado com sucesso!' });
      refetch();
    } catch {
      toast({ title: 'Erro ao salvar alterações', variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleConsent = async (val: boolean) => {
    try {
      await customFetch('/api/pacientes/me/consentimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceito: val }),
      });
      setConsentOcr(val);
      setConsentChat(val);
      toast({ title: val ? 'Consentimento de IA ativado' : 'Consentimento de IA revogado' });
      refetch();
    } catch {
      toast({ title: 'Erro ao atualizar consentimento', variant: 'destructive' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha) {
      toast({ title: 'Preencha as senhas', variant: 'destructive' });
      return;
    }
    if (novaSenha.length < 8) {
      toast({ title: 'A nova senha deve ter pelo menos 8 caracteres', variant: 'destructive' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await customFetch('/api/auth/alterar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      toast({ title: 'Senha atualizada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
    } catch {
      toast({ title: 'Erro ao atualizar senha', variant: 'destructive' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount.mutateAsync();
      toast({ title: 'Conta excluída com sucesso.' });
      signOut();
    } catch {
      toast({ title: 'Erro ao excluir conta', variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#2f7a70]">
              Conta
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

            <button
              onClick={() => setActiveTab('conta')}
              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'conta'
                  ? 'bg-[#f1f4f8] text-[#1b3a60] font-bold shadow-xs'
                  : 'text-[#5a6a80] hover:bg-slate-50'
              }`}
            >
              <FileText size={18} className={activeTab === 'conta' ? 'text-[#1b3a60]' : 'text-[#5a6a80]'} />
              Conta
            </button>
          </div>

          {/* Right Column: Cards (flex: 1) */}
          <div className="flex-1 min-w-[320px] sm:min-w-[640px] flex flex-col gap-5">
            {/* Card 1: Dados pessoais */}
            {(activeTab === 'dados' || activeTab === 'conta') && (
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                {/* Avatar & User summary */}
                <div className="flex gap-5 items-center mb-6">
                  <div className="w-[88px] h-[88px] rounded-[28px] bg-gradient-to-br from-[#2f7a70] to-[#1b3a60] text-white text-3xl font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div>
                    <b className="text-xl text-[#1d2a3d] block">{nome}</b>
                    <div className="text-[#5a6a80] text-sm mt-0.5">{email}</div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => toast({ title: 'Foto selecionada' })}
                        className="min-h-[38px] px-4 rounded-xl inline-flex items-center gap-2 font-bold text-xs bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Alterar foto
                      </button>
                    </div>
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                      />
                    </div>
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

            {/* Card 2: Segurança */}
            {(activeTab === 'seguranca' || activeTab === 'conta') && (
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <Lock size={18} className="text-[#1b3a60]" />
                  </div>
                  <b className="text-base text-[#1d2a3d] flex-1">Segurança</b>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                        Senha atual
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1d2a3d] mb-1.5">
                        Nova senha
                      </label>
                      <input
                        type="password"
                        placeholder="No mínimo 8 caracteres"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {isUpdatingPassword && <LoaderCircle size={16} className="animate-spin" />}
                      Atualizar senha
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Card 3: Privacidade e consentimento */}
            {(activeTab === 'privacidade' || activeTab === 'conta') && (
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
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
                      onClick={() => handleToggleConsent(!consentOcr)}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        consentOcr ? 'bg-[#2f7a70]' : 'bg-[#c6cfdb]'
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
                      onClick={() => handleToggleConsent(!consentChat)}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        consentChat ? 'bg-[#2f7a70]' : 'bg-[#c6cfdb]'
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
            {(activeTab === 'conta' || activeTab === 'dados') && (
              <div className="bg-[#fff5f4] border border-[#f0b8b2] rounded-[20px] p-7 flex gap-4.5 items-center flex-wrap">
                <div className="w-12 h-12 rounded-2xl bg-[#fde8e6] flex items-center justify-center shrink-0">
                  <Trash2 size={24} className="text-[#a13a30]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-[260px]">
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
          Tela de design com dados de exemplo.
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

            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#dde3ec] text-[#5a6a80] font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
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
