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

export default function Emergencia({ token }: { token?: string } = {}) {
  const { toast } = useToast();
  const [activeToken, setActiveToken] = useState<string | undefined>(token);
  const [publicData, setPublicData] = useState<any>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Authenticated user queries (enabled if no public token provided)
  const isPublicMode = Boolean(activeToken);
  const { data: profileRaw } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      enabled: !isPublicMode,
      meta: { skipUnauthorizedRedirect: true },
    },
  });
  const { data: fichaRaw } = useGetApiFichaMedicaMe({
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
      customFetch(`/api/emergencia/${activeToken}`)
        .then((data: any) => {
          setPublicData(data);
        })
        .catch((err) => {
          console.error('Erro ao buscar dados públicos de emergência:', err);
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
    if (!isPublicMode && profileRaw) {
      customFetch('/api/pacientes/me/emergencia', { method: 'POST' })
        .then((res: any) => {
          if (res?.token) {
            setGeneratedToken(res.token);
          }
        })
        .catch(() => {
          // Fallback if already exists or error
        });
    }
  }, [isPublicMode, profileRaw]);

  // Data resolution: either publicData or authenticated user data
  const user = (profileRaw as any) || {};
  const ficha = (fichaRaw as any) || {};

  const name = publicData?.nome || user.nome || 'Ana Souza';
  const age = user.dataNascimento
    ? Math.floor((Date.now() - new Date(user.dataNascimento).getTime()) / (365.25 * 86400000))
    : 34;
  const birthDateFormatted = user.dataNascimento
    ? new Date(user.dataNascimento).toLocaleDateString('pt-BR')
    : '14/03/1992';

  const bloodType = publicData?.tipoSanguineo || ficha.tipoSanguineo || 'O+';
  const allergies =
    publicData?.alergias && publicData.alergias.length > 0
      ? publicData.alergias
      : Array.isArray(ficha.alergias) && ficha.alergias.length > 0
      ? ficha.alergias
      : ['Dipirona', 'Penicilina'];

  const conditions =
    publicData?.doencasCronicas && publicData.doencasCronicas.length > 0
      ? publicData.doencasCronicas
      : Array.isArray(ficha.doencasCronicas) && ficha.doencasCronicas.length > 0
      ? ficha.doencasCronicas
      : ['Hipertensão'];

  const medications =
    publicData?.medicamentosContinuos && publicData.medicamentosContinuos.length > 0
      ? publicData.medicamentosContinuos
      : Array.isArray(ficha.medicamentosContinuos) && ficha.medicamentosContinuos.length > 0
      ? ficha.medicamentosContinuos
      : ['Losartana 50 mg', 'Vitamina D'];

  const isDonor = ficha.doadorOrgaos !== undefined ? Boolean(ficha.doadorOrgaos) : true;

  const currentShareToken = activeToken || generatedToken || 'emergencia-token';
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/emergencia/${currentShareToken}`
      : `https://saudememora.com.br/emergencia/${currentShareToken}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    shareUrl
  )}&bgcolor=f7f9fc&color=1b3a60`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe com seus familiares ou equipe de socorro.',
      });
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#2f7a70]">
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
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#dde3ec] bg-white px-4 py-2.5 text-xs font-semibold text-[#2f7a70] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#2f7a70] animate-pulse" />
              Acesso autorizado via QR Code
            </div>
          )}
        </div>

        {/* 2-col Layout */}
        <div className="flex gap-6 flex-wrap items-start">
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
                    {age} anos {user.dataNascimento ? `· Nascimento ${birthDateFormatted}` : ''}
                  </div>
                </div>

                <div className="w-[120px] h-[120px] rounded-[28px] bg-[#c0463a] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                  <div className="text-xs font-bold tracking-[0.1em]">SANGUE</div>
                  <div className="text-4xl sm:text-[48px] font-extrabold leading-tight">
                    {bloodType}
                  </div>
                </div>
              </div>

              {/* Alergias */}
              <div className="mt-7">
                <div className="text-sm font-bold text-[#5a6a80] mb-2.5 uppercase tracking-[0.08em]">
                  Alergias
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {allergies.map((item: string) => (
                    <span
                      key={item}
                      className="inline-block px-4 py-2 rounded-full bg-[#fde8e6] text-[#a13a30] text-[15px] font-bold whitespace-nowrap"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Condições de saúde */}
              <div className="mt-7">
                <div className="text-sm font-bold text-[#5a6a80] mb-2.5 uppercase tracking-[0.08em]">
                  Condições de saúde
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {conditions.map((item: string) => (
                    <span
                      key={item}
                      className="inline-block px-4 py-2 rounded-full bg-[#fff4df] text-[#8a5b10] text-[15px] font-bold whitespace-nowrap"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Medicamentos contínuos */}
              <div className="mt-7">
                <div className="text-sm font-bold text-[#5a6a80] mb-2.5 uppercase tracking-[0.08em]">
                  Medicamentos contínuos
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {medications.map((item: string) => (
                    <span
                      key={item}
                      className="inline-block px-4 py-2 rounded-full bg-[#e8f4f2] text-[#1f5c54] text-[15px] font-bold whitespace-nowrap"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Doador de órgãos */}
              <div className="mt-7 text-base text-[#1d2a3d]">
                Doador de órgãos:{' '}
                <b className={isDonor ? 'text-[#2f7a70]' : 'text-[#a13a30]'}>
                  {isDonor ? 'sim' : 'não'}
                </b>
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
              <div className="text-xs font-bold tracking-[0.14em] uppercase text-[#2f7a70] mb-1">
                Contatos de emergência
              </div>

              <div className="divide-y divide-[#dde3ec]">
                {/* Contact 1 */}
                <div className="flex gap-3.5 items-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#f1f4f8] flex items-center justify-center shrink-0 text-[#1b3a60]">
                    <Phone size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="text-[17px] text-[#1d2a3d] block truncate">
                      {user.contatoEmergencia || 'Carlos Souza'}
                    </b>
                    <div className="text-sm text-[#5a6a80]">
                      {user.contatoEmergencia ? 'Contato cadastrado' : 'Esposo · (11) 90000-0000'}
                    </div>
                  </div>
                  <a
                    href="tel:11900000000"
                    className="min-h-[44px] px-4.5 rounded-xl bg-[#2f7a70] text-white font-bold text-sm inline-flex items-center hover:bg-[#26635b] transition-colors shrink-0"
                  >
                    Ligar
                  </a>
                </div>

                {/* Contact 2 */}
                <div className="flex gap-3.5 items-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#f1f4f8] flex items-center justify-center shrink-0 text-[#1b3a60]">
                    <Phone size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="text-[17px] text-[#1d2a3d] block truncate">Marta Souza</b>
                    <div className="text-sm text-[#5a6a80]">Mãe · (11) 91111-1111</div>
                  </div>
                  <a
                    href="tel:11911111111"
                    className="min-h-[44px] px-4.5 rounded-xl bg-[#2f7a70] text-white font-bold text-sm inline-flex items-center hover:bg-[#26635b] transition-colors shrink-0"
                  >
                    Ligar
                  </a>
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
                <img
                  src={qrCodeUrl}
                  alt="QR Code de emergência"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <p className="m-0 text-[13px] leading-relaxed text-[#5a6a80] mb-4">
                Mostre este QR Code para quem for prestar socorro acessar esta ficha.
              </p>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full min-h-[44px] rounded-xl border border-[#dde3ec] bg-white hover:bg-[#f7f9fc] text-[#1b3a60] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                {isCopied ? <Check size={16} className="text-[#2f7a70]" /> : <Copy size={16} />}
                {isCopied ? 'Link copiado!' : 'Copiar link de socorro'}
              </button>
            </div>
          </div>
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
