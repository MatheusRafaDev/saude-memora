import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  ShieldAlert,
  Phone,
  Droplets,
  AlertTriangle,
  Pill,
  Share2,
  Activity,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  useGetApiPacientesMe,
  getGetApiPacientesMeQueryKey,
  useGetApiFichaMedicaMe,
  getGetApiFichaMedicaMeQueryKey,
  customFetch,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function Emergencia({ token }: { token?: string } = {}) {
  const { toast } = useToast();
  const [activeToken, setActiveToken] = useState<string | undefined>(token);
  const [publicData, setPublicData] = useState<any>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [publicLoadError, setPublicLoadError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [hasRequestedToken, setHasRequestedToken] = useState(false);

  // Authenticated user queries (enabled if no public token provided)
  const isPublicMode = Boolean(activeToken);
  const { data: profileRaw, isLoading: isProfileLoading, isError: profileError } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      enabled: !isPublicMode,
      meta: { skipUnauthorizedRedirect: true },
    },
  });
  const { data: fichaRaw, isLoading: isFichaLoading, isError: fichaError } = useGetApiFichaMedicaMe({
    query: {
      queryKey: getGetApiFichaMedicaMeQueryKey(),
      enabled: !isPublicMode,
      meta: { skipUnauthorizedRedirect: true },
    },
  });

  const [generatedToken, setGeneratedToken] = useState<string>('');

  // Detect token from URL query string if not provided via route prop
  useEffect(() => {
    if (!activeToken && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get('token');
      if (queryToken) {
        setActiveToken(queryToken);
      }
    }
  }, [activeToken]);

  // If in public mode, fetch emergency info by token
  useEffect(() => {
    if (activeToken) {
      setIsLoadingPublic(true);
      setPublicLoadError(false);
      customFetch(`/api/emergencia/${activeToken}`)
        .then((data: any) => {
          setPublicData(data);
        })
        .catch((err) => {
          console.error('Erro ao buscar dados públicos de emergência:', err);
          setPublicLoadError(true);
          toast({
            title: 'Ficha não encontrada',
            description: 'O link de emergência pode ter expirado ou é inválido.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoadingPublic(false);
        });
    }
  }, [activeToken, toast]);

  // If authenticated, get or create the user's emergency token for sharing
  useEffect(() => {
    if (!isPublicMode && profileRaw && !hasRequestedToken) {
      setHasRequestedToken(true);
      customFetch('/api/pacientes/me/emergencia', { method: 'POST' })
        .then((res: any) => {
          if (res?.token) {
            setGeneratedToken(res.token);
          } else {
            setTokenError(true);
          }
        })
        .catch(() => {
          setTokenError(true);
        });
    }
  }, [isPublicMode, profileRaw, hasRequestedToken]);

  // Data resolution: either publicData or authenticated user data
  const user = (profileRaw as any) || {};
  const ficha = (fichaRaw as any) || {};

  const name = publicData?.nome || user.nome || 'Não informado';
  const dateOfBirth = publicData?.dataNascimento || user.dataNascimento;
  const birthDate = dateOfBirth
    ? /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
      ? new Date(`${dateOfBirth}T12:00:00`)
      : new Date(dateOfBirth)
    : null;
  const hasValidBirthDate = birthDate !== null && !Number.isNaN(birthDate.getTime());
  const age = hasValidBirthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400000))
    : null;
  const birthDateFormatted = hasValidBirthDate
    ? birthDate.toLocaleDateString('pt-BR')
    : 'Não informado';

  const sex = publicData?.sexo || user.sexo || user.sexoBiologico || '';
  const healthPlan = publicData ? publicData.planoSaude : user.planoSaude;
  const insuranceCardNumber = publicData ? publicData.numeroCarteirinha : user.numeroCarteirinha;
  const bloodType = publicData ? publicData.tipoSanguineo : ficha.tipoSanguineo;
  const allergies = publicData
    ? Array.isArray(publicData.alergias) ? publicData.alergias : []
    : Array.isArray(ficha.alergias) ? ficha.alergias : [];
  const conditions = publicData
    ? Array.isArray(publicData.doencasCronicas) ? publicData.doencasCronicas : []
    : Array.isArray(ficha.doencasCronicas) ? ficha.doencasCronicas : [];
  const medications = publicData
    ? Array.isArray(publicData.medicamentosContinuos) ? publicData.medicamentosContinuos : []
    : Array.isArray(ficha.medicamentosContinuos) ? ficha.medicamentosContinuos : [];
  const isDonor = publicData ? publicData.doadorOrgaos : ficha.doadorOrgaos;
  const surgeries = publicData ? publicData.cirurgias : ficha.cirurgias;
  const generalHabits = publicData ? publicData.habitosGerais : ficha.habitosGerais;
  const familyHistory = publicData ? publicData.historicoFamiliar : ficha.historicoFamiliar;
  const smokes = publicData ? publicData.fuma : ficha.fuma;
  const drinksAlcohol = publicData ? publicData.bebe : ficha.bebe;
  const emergencyContact = publicData?.contatosEmergencia || user.contatoEmergencia || '';
  const hasEmergencyContact = Boolean(
    emergencyContact && emergencyContact !== 'Não informado'
  );
  const emergencyPhone = hasEmergencyContact
    ? String(emergencyContact).replace(/[^\d+]/g, '')
    : '';

  const currentShareToken = activeToken || generatedToken;
  const shareUrl = currentShareToken && typeof window !== 'undefined'
    ? `${window.location.origin}/emergencia/${currentShareToken}`
    : '';

  const handleCopyLink = async () => {
    if (shareUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        toast({
          title: 'Link copiado!',
          description: 'Compartilhe com seus familiares ou equipe de socorro.',
        });
        setTimeout(() => setIsCopied(false), 2500);
      } catch {
        toast({ title: 'Não foi possível copiar o link', variant: 'destructive' });
      }
    }
  };

  const handleShareLink = async () => {
    if (!shareUrl) return;
    if (!navigator.share) {
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: 'Minha ficha de emergência — SaúdeMemora',
        text: 'Acesse minhas informações médicas de emergência.',
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      toast({ title: 'Não foi possível compartilhar o link', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1f7fe0]">
              {isPublicMode ? 'Atendimento Médico' : 'Ficha rápida'}
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Emergência
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              {isPublicMode
                ? 'Ficha médica rápida para socorristas e equipe hospitalar.'
                : 'Informações essenciais, em letras grandes e fáceis de ler.'}
            </p>
          </div>

          {isPublicMode && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f7fe0] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#1f7fe0] animate-pulse" />
              Acesso autorizado via QR Code
            </div>
          )}
        </div>

        {/* 2-col Layout */}
        <div className="flex gap-6 flex-wrap items-start">
          {(isLoadingPublic || (!isPublicMode && (isProfileLoading || isFichaLoading))) ? (
            <div className="w-full rounded-2xl border border-[#dde3ec] bg-white p-8 text-center text-[#5a6a80]">
              Carregando ficha de emergência…
            </div>
          ) : (publicLoadError || (!isPublicMode && (profileError || fichaError))) ? (
            <div role="alert" className="w-full rounded-2xl border border-[#f0b8b2] bg-white p-8 text-center text-[#a13a30]">
              Não foi possível carregar os dados da ficha de emergência.
            </div>
          ) : (
          <>
          {/* Main Card (flex: 2) */}
          <div className="flex-[2] min-w-[320px] sm:min-w-[600px]">
            <div className="bg-white border-2 border-[#c0463a] rounded-[28px] p-7 sm:p-9 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              {/* Header inside card with Blood Badge */}
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div>
                  <div className="text-[13px] font-extrabold tracking-[0.16em] text-[#c0463a] uppercase">
                    Ficha de emergência
                  </div>
                  <div className="text-3xl sm:text-[42px] font-extrabold tracking-[-0.03em] mt-1.5 text-[#1d2a3d]">
                    {name}
                  </div>
                  <div className="text-base sm:text-lg text-[#5a6a80] mt-0.5">
                    {age !== null ? `${age} anos` : 'Idade não informada'}
                    {hasValidBirthDate ? ` · Nascimento ${birthDateFormatted}` : ''}
                    {sex ? ` · ${sex}` : ''}
                  </div>
                </div>

                <div className="w-[120px] h-[120px] rounded-[28px] bg-[#c0463a] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                  <div className="text-xs font-bold tracking-[0.1em]">SANGUE</div>
                  <div className="text-4xl sm:text-[48px] font-extrabold leading-tight">
                    {bloodType || 'Não informado'}
                  </div>
                </div>
              </div>

              {/* Alergias */}
              <div className="mt-7">
                <div className="text-sm font-bold text-[#5a6a80] mb-2.5 uppercase tracking-[0.08em]">
                  Alergias
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {allergies.length > 0 ? allergies.map((item: string) => (
                    <span
                      key={item}
                      className="inline-block px-4 py-2 rounded-full bg-[#fde8e6] text-[#a13a30] text-[15px] font-bold whitespace-nowrap"
                    >
                      {item}
                    </span>
                  )) : <span className="text-sm text-[#5a6a80]">Não informado</span>}
                </div>
              </div>

              {/* Condições de saúde */}
              <div className="mt-7">
                <div className="text-sm font-bold text-[#5a6a80] mb-2.5 uppercase tracking-[0.08em]">
                  Condições de saúde
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {conditions.length > 0 ? conditions.map((item: string) => (
                    <span
                      key={item}
                      className="inline-block px-4 py-2 rounded-full bg-[#fff4df] text-[#8a5b10] text-[15px] font-bold whitespace-nowrap"
                    >
                      {item}
                    </span>
                  )) : <span className="text-sm text-[#5a6a80]">Não informado</span>}
                </div>
              </div>

              {/* Medicamentos contínuos */}
              <div className="mt-7">
                <div className="text-sm font-bold text-[#5a6a80] mb-2.5 uppercase tracking-[0.08em]">
                  Medicamentos contínuos
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {medications.length > 0 ? medications.map((item: string) => (
                    <span
                      key={item}
                      className="inline-block px-4 py-2 rounded-full bg-[#e5eefb] text-[#1b3a60] text-[15px] font-bold whitespace-nowrap"
                    >
                      {item}
                    </span>
                  )) : <span className="text-sm text-[#5a6a80]">Não informado</span>}
                </div>
              </div>

              {/* Doador de órgãos */}
              <div className="mt-7 text-base text-[#1d2a3d]">
                Doador de órgãos:{' '}
                <b className={isDonor === undefined || isDonor === null ? 'text-[#5a6a80]' : isDonor ? 'text-[#1f7fe0]' : 'text-[#a13a30]'}>
                  {isDonor === undefined || isDonor === null ? 'não informado' : isDonor ? 'sim' : 'não'}
                </b>
              </div>

              <div className="mt-7 grid gap-4 border-t border-[#dde3ec] pt-6 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#5a6a80]">
                    Cirurgias anteriores
                  </div>
                  <p className="mb-0 mt-1.5 whitespace-pre-line text-sm text-[#1d2a3d]">
                    {surgeries?.trim() || 'Não informado'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#5a6a80]">
                    Plano de saúde
                  </div>
                  <p className="mb-0 mt-1.5 text-sm text-[#1d2a3d]">
                    {healthPlan?.trim() || 'Não informado'}
                  </p>
                  <p className="mb-0 mt-1.5 text-sm text-[#1d2a3d]">
                    Carteirinha: {insuranceCardNumber?.trim() || 'Não informada'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#5a6a80]">
                    Hábitos e rotina
                  </div>
                  <p className="mb-0 mt-1.5 whitespace-pre-line text-sm text-[#1d2a3d]">
                    {generalHabits?.trim() || 'Não informado'}
                  </p>
                  <p className="mb-0 mt-1.5 text-sm text-[#1d2a3d]">
                    Tabagismo: {smokes === true ? 'Sim' : 'Não informado'} · Álcool:{' '}
                    {drinksAlcohol === true ? 'Sim' : 'Não informado'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#5a6a80]">
                    Histórico familiar
                  </div>
                  <p className="mb-0 mt-1.5 whitespace-pre-line text-sm text-[#1d2a3d]">
                    {familyHistory?.trim() || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (flex: 1) */}
          <div className="flex-1 min-w-[300px] flex flex-col gap-6">
            {/* SAMU 192 Card */}
            <div className="bg-[#1b3a60] text-white rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="text-xs font-bold tracking-[0.14em] uppercase text-[#7cc4e6] mb-1">
                EMERGÊNCIA NO BRASIL
              </div>
              <div className="text-5xl font-extrabold leading-none my-1 tracking-tight text-white">
                192
              </div>
              <p className="text-sm text-[#c9d6e8] mt-1 mb-4 leading-relaxed">
                SAMU · ligue ou procure um serviço de urgência
              </p>
              <a
                href="tel:192"
                className="w-full min-h-[48px] rounded-xl bg-[#c0463a] hover:bg-[#a13a30] text-white font-bold text-base inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Phone size={18} />
                Ligar para 192
              </a>
            </div>

            {/* Contatos de emergência Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="text-xs font-bold tracking-[0.14em] uppercase text-[#1f7fe0] mb-1">
                Contatos de emergência
              </div>

              <div className="divide-y divide-[#dde3ec]">
                {/* Contact on file */}
                <div className="flex gap-3.5 items-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#f1f4f8] flex items-center justify-center shrink-0 text-[#1b3a60]">
                    <Phone size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="text-[17px] text-[#1d2a3d] block truncate">
                      {hasEmergencyContact ? emergencyContact : 'Não informado'}
                    </b>
                    <div className="text-sm text-[#5a6a80]">
                      {hasEmergencyContact ? 'Contato de emergência cadastrado' : 'Cadastre um contato no seu perfil'}
                    </div>
                  </div>
                  {hasEmergencyContact && emergencyPhone.length >= 8 && (
                    <a
                      href={`tel:${emergencyPhone}`}
                      className="min-h-[44px] px-4.5 rounded-xl bg-[#1f7fe0] text-white font-bold text-sm inline-flex items-center hover:bg-[#1765b8] transition-colors shrink-0"
                    >
                      Ligar
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Compartilhar com socorrista Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] text-center">
              <div className="flex items-center gap-2.5 mb-4 text-left">
                <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                  <Share2 size={18} className="text-[#1b3a60]" />
                </div>
                <b className="text-base text-[#1d2a3d] flex-1">Compartilhar com socorrista</b>
              </div>

              <div className="w-[170px] h-[170px] border border-[#dde3ec] rounded-2xl mx-auto mb-3.5 flex flex-col items-center justify-center bg-[#f7f9fc] p-2 overflow-hidden shadow-xs">
                {shareUrl ? (
                  <QRCodeSVG
                    value={shareUrl}
                    size={148}
                    bgColor="#f7f9fc"
                    fgColor="#1b3a60"
                    level="M"
                    title="QR Code de emergência"
                  />
                ) : (
                  <span className="px-4 text-sm text-[#5a6a80]">
                    {tokenError ? 'Não foi possível gerar o link de emergência.' : 'Gerando link de emergência…'}
                  </span>
                )}
              </div>

              <p className="m-0 text-[13px] leading-relaxed text-[#5a6a80] mb-4">
                Mostre este QR Code para quem for prestar socorro acessar esta ficha.
              </p>

              <div className="mb-3.5 text-left">
                <label
                  htmlFor="emergency-share-link"
                  className="mb-1.5 block text-xs font-bold text-[#5a6a80]"
                >
                  Link da ficha de emergência
                </label>
                <input
                  id="emergency-share-link"
                  type="url"
                  readOnly
                  value={shareUrl}
                  placeholder={tokenError ? 'Não foi possível gerar o link' : 'Gerando link…'}
                  className="min-h-[44px] w-full rounded-xl border border-[#dde3ec] bg-[#f7f9fc] px-3 text-xs text-[#1d2a3d] outline-none focus:border-[#1f7fe0]"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full min-h-[44px] rounded-xl border border-[#dde3ec] bg-white hover:bg-[#f7f9fc] text-[#1b3a60] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                disabled={!shareUrl}
              >
                {isCopied ? <Check size={16} className="text-[#1f7fe0]" /> : <Copy size={16} />}
                {isCopied ? 'Link copiado!' : 'Copiar link de socorro'}
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareLink}
                  disabled={!shareUrl}
                  className="min-h-[44px] rounded-xl border border-[#dde3ec] bg-white px-2 text-[#1b3a60] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#f7f9fc] disabled:opacity-50"
                >
                  <Share2 size={15} />
                  Compartilhar
                </button>
                <a
                  href={shareUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!shareUrl}
                  className={`min-h-[44px] rounded-xl border border-[#dde3ec] bg-white px-2 text-[#1b3a60] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#f7f9fc] ${
                    shareUrl ? '' : 'pointer-events-none opacity-50'
                  }`}
                >
                  <ExternalLink size={15} />
                  Abrir link
                </a>
              </div>
              <p className="mb-0 mt-3 text-left text-[11px] leading-relaxed text-[#5a6a80]">
                Quem tiver o QR Code ou link poderá ver os dados exibidos nesta ficha. Compartilhe apenas com quem precisa.
              </p>
            </div>
          </div>
          </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          {isPublicMode
            ? 'Dados médicos em caráter de urgência. Em risco de vida, contate o SAMU 192 imediatamente.'
            : 'Mantenha seus dados médicos e contatos de emergência sempre atualizados.'}
        </p>
      </main>
    </div>
  );
}
