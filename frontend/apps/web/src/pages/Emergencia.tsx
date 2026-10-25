import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  ShieldAlert,
  Phone,
  Droplets,
  AlertTriangle,
  Pill,
  QrCode,
  Activity,
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
import { getEmergencyToken, rotateEmergencyToken, revokeEmergencyToken } from '@/lib/emergency-token';

export default function Emergencia({ token }: { token?: string } = {}) {
  const { toast } = useToast();
  const [activeToken, setActiveToken] = useState<string | undefined>(token);
  const [publicData, setPublicData] = useState<any>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [publicLoadError, setPublicLoadError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [hasRequestedToken, setHasRequestedToken] = useState(false);
  const [needsTokenRotation, setNeedsTokenRotation] = useState(false);
  const [isRotatingToken, setIsRotatingToken] = useState(false);
  const [isRevokingToken, setIsRevokingToken] = useState(false);

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

  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

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
      const patientId = (profileRaw as any).id;
      getEmergencyToken(patientId)
        .then(({ token, needsRotation }) => {
          if (token) setGeneratedToken(token);
          setNeedsTokenRotation(needsRotation);
        })
        .catch(() => {
          setTokenError(true);
        });
    }
  }, [isPublicMode, profileRaw, hasRequestedToken]);

  const handleRotateToken = async () => {
    const patientId = (profileRaw as any)?.id;
    if (!patientId || isRotatingToken) return;
    setIsRotatingToken(true);
    setTokenError(false);
    try {
      setGeneratedToken(await rotateEmergencyToken(patientId));
      setNeedsTokenRotation(false);
    } catch {
      setTokenError(true);
      toast({ title: 'Não foi possível gerar um novo link', variant: 'destructive' });
    } finally {
      setIsRotatingToken(false);
    }
  };

  const handleRevokeToken = async () => {
    if (isRevokingToken) return;
    setIsRevokingToken(true);
    try {
      await revokeEmergencyToken();
      setGeneratedToken(null);
      setNeedsTokenRotation(false);
      toast({
        title: 'Link de emergência revogado',
        description: 'Quem tinha o link ou o QR Code antigo não consegue mais acessar a ficha.',
      });
    } catch {
      toast({ title: 'Não foi possível revogar o link', variant: 'destructive' });
    } finally {
      setIsRevokingToken(false);
    }
  };

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
  const displayedAge = isPublicMode && Number.isInteger(publicData?.idade) ? publicData.idade : age;
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
    : Array.from(
        new Set([
          ...(Array.isArray(ficha.doencasCronicas) ? ficha.doencasCronicas : []),
          ...(Array.isArray(ficha.condicoes)
            ? ficha.condicoes
                .filter((c: any) => (typeof c === 'string' ? Boolean(c.trim()) : Boolean(c?.tem)))
                .map((c: any) => (typeof c === 'string' ? c.trim() : c.nome?.trim()))
            : []),
          ...(ficha.outrasDoencas ? [ficha.outrasDoencas.trim()] : []),
        ]),
      ).filter(Boolean);
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

  return (
    <div className="min-h-screen min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] flex-1 bg-[#F8FAFC] text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-3 sm:gap-5 mb-5 sm:mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1D4ED8]">
              {isPublicMode ? 'Atendimento Médico de Urgência' : 'Ficha rápida'}
            </div>
            <h1 className="mt-1.5 mb-0 text-2xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#14211F]">
              Ficha de Emergência
            </h1>
            <p className="mt-1 mb-0 text-[#5B6878] text-xs sm:text-base">
              {isPublicMode
                ? 'Ficha médica prioritária para socorristas, médicos e equipe hospitalar.'
                : 'Informações vitais em destaque para consulta rápida e socorro.'}
            </p>
          </div>

          {isPublicMode && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#CFE0FF] bg-blue-50 px-3.5 py-2 text-xs font-semibold text-[#1D4ED8] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#1D4ED8] animate-pulse" />
              Acesso seguro via QR Code
            </div>
          )}
        </div>

        {/* Quick mobile emergency action bar */}
        <div className="grid grid-cols-2 gap-2.5 sm:hidden mb-4">
          <a
            href="tel:192"
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#E8664A] px-3 text-sm font-bold text-white shadow-sm active:bg-[#D45338]"
          >
            <Phone size={16} />
            Ligar 192 (SAMU)
          </a>
          {hasEmergencyContact && emergencyPhone.length >= 8 ? (
            <a
              href={`tel:${emergencyPhone}`}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-3 text-sm font-bold text-white shadow-sm active:bg-[#1E40AF]"
            >
              <Phone size={16} />
              Ligar Contato
            </a>
          ) : (
            <div className="flex min-h-[46px] items-center justify-center rounded-xl border border-[#E3E8F0] bg-white px-2 text-center text-xs font-medium text-[#5B6878]">
              Sem contato cadastrado
            </div>
          )}
        </div>

        {/* 2-col Layout */}
        <div className="flex gap-5 sm:gap-6 flex-wrap items-start">
          {(isLoadingPublic || (!isPublicMode && (isProfileLoading || isFichaLoading))) ? (
            <div className="w-full rounded-2xl border border-[#dde3ec] bg-white p-5 sm:p-8 text-center text-[#5a6a80]">
              Carregando ficha de emergência…
            </div>
          ) : (publicLoadError || (!isPublicMode && (profileError || fichaError))) ? (
            <div role="alert" className="w-full rounded-2xl border border-[#E8664A]/30 bg-[#E8664A]/10 p-5 sm:p-8 text-center text-[#E8664A]">
              Não foi possível carregar os dados da ficha de emergência.
            </div>
          ) : (
          <>
          {/* Main Card (flex: 2) */}
          <div className="min-w-0 w-full lg:flex-[2]">
            <div className="bg-gradient-to-br from-[#0F1E36] via-[#162B4D] to-[#0D1829] text-white border-2 border-[#E8664A] rounded-[22px] sm:rounded-[28px] p-4 sm:p-7 md:p-8 shadow-xl relative overflow-hidden">
              {/* Header inside card with Blood Badge */}
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-[13px] font-extrabold tracking-[0.16em] text-[#E8664A] uppercase">
                    Ficha de emergência
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-white truncate">
                    {name}
                  </div>
                  <div className="text-xs sm:text-base text-slate-300 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
                    {displayedAge !== null ? <span>{displayedAge} anos</span> : <span>Idade não informada</span>}
                    {hasValidBirthDate && <span>· Nasc. {birthDateFormatted}</span>}
                    {sex && <span>· Sexo {sex}</span>}
                  </div>
                </div>

                {/* Blood Group Badge */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-[24px] bg-[#E8664A] text-white flex flex-col items-center justify-center shrink-0 shadow-lg border border-white/20">
                  <span className="text-[9px] sm:text-[11px] font-extrabold tracking-[0.14em]">SANGUE</span>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black leading-none mt-0.5">
                    {bloodType || 'N/I'}
                  </span>
                </div>
              </div>

              {/* Alergias - Highest emergency priority */}
              <div className="mt-5 sm:mt-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-400 mb-2 uppercase tracking-[0.08em]">
                  <AlertTriangle size={15} className="text-[#E8664A] shrink-0" />
                  <span>Alergias e Restrições</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {allergies.length > 0 ? allergies.map((item: string) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs sm:text-sm font-bold shadow-xs"
                    >
                      {item}
                    </span>
                  )) : <span className="text-xs sm:text-sm text-slate-400">Nenhuma alergia informada</span>}
                </div>
              </div>

              {/* Condições de saúde */}
              <div className="mt-4 sm:mt-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300 mb-2 uppercase tracking-[0.08em]">
                  <Activity size={15} className="text-amber-400 shrink-0" />
                  <span>Condições e Doenças Crônicas</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {conditions.length > 0 ? conditions.map((item: string) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-bold shadow-xs"
                    >
                      {item}
                    </span>
                  )) : <span className="text-xs sm:text-sm text-slate-400">Nenhuma condição informada</span>}
                </div>
              </div>

              {/* Medicamentos contínuos */}
              <div className="mt-4 sm:mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-300 mb-2 uppercase tracking-[0.08em]">
                  <Pill size={15} className="text-blue-400 shrink-0" />
                  <span>Medicamentos em Uso Contínuo</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {medications.length > 0 ? medications.map((item: string) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-200 text-xs sm:text-sm font-bold shadow-xs"
                    >
                      {item}
                    </span>
                  )) : <span className="text-xs sm:text-sm text-slate-400">Nenhum medicamento informado</span>}
                </div>
              </div>

              {/* Doador de órgãos */}
              <div className="mt-4 sm:mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm text-white">
                <span className="font-semibold text-slate-300">Doador de órgãos:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-lg text-xs ${
                  isDonor === true ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  isDonor === false ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-slate-700/50 text-slate-400'
                }`}>
                  {isDonor === true ? 'Sim' : isDonor === false ? 'Não' : 'Não informado'}
                </span>
              </div>

              <div className="mt-7 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#93C5FD]">
                    Cirurgias anteriores
                  </div>
                  <p className="mb-0 mt-1.5 whitespace-pre-line text-sm text-slate-200">
                    {surgeries?.trim() || 'Não informado'}
                  </p>
                </div>
                {!isPublicMode && <>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#93C5FD]">
                    Plano de saúde
                  </div>
                  <p className="mb-0 mt-1.5 text-sm text-slate-200">
                    {healthPlan?.trim() || 'Não informado'}
                  </p>
                  <p className="mb-0 mt-1.5 text-sm text-slate-300 font-mono">
                    Carteirinha: {insuranceCardNumber?.trim() || 'Não informada'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#93C5FD]">
                    Hábitos e rotina
                  </div>
                  <p className="mb-0 mt-1.5 whitespace-pre-line text-sm text-slate-200">
                    {generalHabits?.trim() || 'Não informado'}
                  </p>
                  <p className="mb-0 mt-1.5 text-sm text-slate-300">
                    Tabagismo: {smokes === true ? 'Sim' : 'Não informado'} · Álcool:{' '}
                    {drinksAlcohol === true ? 'Sim' : 'Não informado'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm font-bold uppercase tracking-[0.08em] text-[#93C5FD]">
                    Histórico familiar
                  </div>
                  <p className="mb-0 mt-1.5 whitespace-pre-line text-sm text-slate-200">
                    {familyHistory?.trim() || 'Não informado'}
                  </p>
                </div>
                </>}
              </div>

              <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-[#A9B6CE]">
                Informado por você na ficha médica. Confira com um profissional de saúde.
              </p>
            </div>
          </div>

          {/* Right Column (flex: 1) */}
          <div className="w-full min-w-0 flex-1 flex flex-col gap-6">
            {/* SAMU 192 Card */}
            <div className="rounded-[20px] border border-[#E3E8F0] bg-[#CFE0FF] p-6 text-[#14211F]">
              <div className="text-xs font-bold tracking-[0.14em] uppercase text-[#1D4ED8] mb-1">
                EMERGÊNCIA NO BRASIL
              </div>
              <div className="my-1 font-serif text-5xl font-semibold leading-none tracking-tight text-[#14211F]">
                192
              </div>
              <p className="text-sm text-[#5B6878] mt-1 mb-4 leading-relaxed">
                SAMU · ligue ou procure um serviço de urgência
              </p>
              <a
                href="tel:192"
                className="w-full min-h-11 rounded-xl bg-[#E8664A] hover:bg-[#D45338] active:bg-[#B9381E] text-white font-bold text-base inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Phone size={18} />
                Ligar para 192
              </a>
            </div>

            {/* Contatos de emergência Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="text-xs font-bold tracking-[0.14em] uppercase text-[#1D4ED8] mb-1">
                Contatos de emergência
              </div>

              <div className="divide-y divide-[#dde3ec]">
                {/* Contact on file */}
                <div className="flex gap-3.5 items-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#CFE0FF]/40 flex items-center justify-center shrink-0 text-[#1D4ED8]">
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
                      className="min-h-[44px] px-4.5 rounded-xl bg-[#1D4ED8] text-white font-semibold text-sm inline-flex items-center hover:bg-[#1E40AF] transition-all shrink-0 shadow-xs"
                    >
                      Ligar
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Compartilhar com socorrista Card */}
            <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-6 shadow-xs text-center">
              <div className="flex items-center gap-2.5 mb-4 text-left">
                <div className="w-9 h-9 rounded-xl bg-[#CFE0FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
                  <QrCode size={18} />
                </div>
                <b className="text-base text-[#14211F] flex-1">Acesso à ficha de emergência</b>
              </div>

              <div className="w-[170px] h-[170px] border border-[#E3E8F0] rounded-2xl mx-auto mb-3.5 flex flex-col items-center justify-center bg-[#F4F7FC] p-2 overflow-hidden shadow-xs">
                {shareUrl ? (
                  <QRCodeSVG
                    value={shareUrl}
                    size={148}
                    bgColor="#F4F7FC"
                    fgColor="#1C2438"
                    level="M"
                    title="QR Code de emergência"
                  />
                ) : (
                  <span className="px-4 text-sm text-[#5B6878]">
                    {needsTokenRotation
                      ? 'Já existe um link ativo, mas ele não está salvo neste navegador.'
                      : tokenError ? 'Não foi possível carregar o link de emergência.' : 'Verificando link de emergência…'}
                  </span>
                )}
              </div>

              <p className="m-0 text-[13px] leading-relaxed text-[#5B6878] mb-4">
                Mostre este QR Code para quem for prestar socorro acessar esta ficha.
              </p>

              {needsTokenRotation && (
                <button
                  type="button"
                  onClick={handleRotateToken}
                  disabled={isRotatingToken}
                  className="mb-4 min-h-[44px] w-full rounded-xl bg-[#E8664A] px-3 text-sm font-semibold text-white hover:bg-[#D45338] transition-all shadow-xs disabled:opacity-60"
                >
                  {isRotatingToken ? 'Gerando novo link…' : 'Gerar novo link (invalidará o anterior)'}
                </button>
              )}

              {generatedToken && (
                <button
                  type="button"
                  onClick={handleRevokeToken}
                  disabled={isRevokingToken}
                  className="mb-4 min-h-[44px] w-full rounded-xl border border-[#E8664A]/40 bg-white px-3 text-sm font-semibold text-[#E8664A] hover:bg-[#FDE1DA] transition-all shadow-xs disabled:opacity-60"
                >
                  {isRevokingToken ? 'Revogando…' : 'Revogar link de emergência'}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full min-h-[44px] rounded-xl border border-[#E3E8F0] bg-white hover:bg-[#F4F7FC] hover:border-[#CFE0FF] text-[#14211F] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                disabled={!shareUrl}
              >
                {isCopied ? <Check size={16} className="text-[#1D4ED8]" /> : <Copy size={16} />}
                {isCopied ? 'Link copiado!' : 'Copiar link de socorro'}
              </button>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <a
                  href={shareUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!shareUrl}
                  className={`min-h-[44px] rounded-xl border border-[#E3E8F0] bg-white px-2 text-[#14211F] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all shadow-xs ${
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
