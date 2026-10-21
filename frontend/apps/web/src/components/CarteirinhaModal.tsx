import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  CreditCard,
  Copy,
  Check,
  Printer,
  ZoomIn,
  ZoomOut,
  X,
  ExternalLink,
  ShieldCheck,
  Heart,
  Droplets,
  AlertCircle,
  Phone,
  QrCode,
  FileText,
  Pill,
  Activity,
  Sparkles,
  Share2,
  CalendarDays,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BrandLogo } from '@/components/BrandLogo';
import { AiDataNotice } from '@/components/AiDataNotice';
import { useToast } from '@/hooks/use-toast';
import { rotateEmergencyToken } from '@/lib/emergency-token';

export interface CarteirinhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'digital' | 'documento';
  user?: {
    id?: string;
    nome?: string;
    dataNascimento?: string;
    sexo?: string;
    sexoBiologico?: string;
    planoSaude?: string;
    numeroCarteirinha?: string;
    urlCarteirinha?: string;
    cpf?: string;
    contatoEmergencia?: string;
  };
  ficha?: {
    tipoSanguineo?: string;
    alergias?: string[] | unknown;
    doadorOrgaos?: boolean;
    medicamentosContinuos?: string[] | unknown;
    doencasCronicas?: string[] | unknown;
    condicoes?: string[] | unknown;
    outrasDoencas?: string;
    cirurgias?: string;
    contatoEmergencia?: string;
    historicoFamiliar?: string;
    habitosGerais?: string;
    observacoes?: string;
  };
  resumoFicha?: {
    tipoSanguineo?: string;
    alergias?: string[];
    condicoes?: string[];
    outrasDoencas?: string;
    medicamentosContinuos?: string[];
    cirurgias?: string;
    contatoEmergencia?: string;
    planoSaude?: string;
    numeroCarteirinha?: string;
    doadorOrgaos?: boolean;
    historicoFamiliar?: string;
    observacoes?: string;
    habitosGerais?: string;
  };
}

function normalizeList(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        // Se for um objeto com a propriedade 'tem', SÓ incluir se tem for explicitamente true
        if ('tem' in item && !(item as any).tem) {
          return null;
        }
        const name = (item as any).nome || (item as any).name || (item as any).descricao;
        return typeof name === 'string' ? name.trim() : null;
      }
      return null;
    })
    .filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function formatCardNumber(num?: string): string {
  if (!num) return 'Não informado';
  const clean = num.trim();
  // Se for apenas dígitos e longo, agrupar de 4 em 4 para ficar visualmente parecido com cartão
  if (/^\d{8,24}$/.test(clean)) {
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  }
  return clean;
}

export function CarteirinhaModal({
  open,
  onOpenChange,
  initialTab = 'digital',
  user = {},
  ficha = {},
  resumoFicha,
}: CarteirinhaModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'digital' | 'documento'>(initialTab);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [cardZoom, setCardZoom] = useState(1);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [qrToken, setQrToken] = useState<string>('');
  const [isRotatingToken, setIsRotatingToken] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const fullName = user.nome || 'Nome não informado';
  const healthPlan = (user.planoSaude || resumoFicha?.planoSaude || '').trim();
  const rawCardNumber = (user.numeroCarteirinha || resumoFicha?.numeroCarteirinha || '').trim();
  const formattedCardNumber = formatCardNumber(rawCardNumber);
  const registeredCardUrl = typeof user.urlCarteirinha === 'string' ? user.urlCarteirinha : '';

  // Data de nascimento e idade
  const birthDateValue = user.dataNascimento;
  const birthDate = birthDateValue
    ? /^\d{4}-\d{2}-\d{2}$/.test(birthDateValue)
      ? new Date(`${birthDateValue}T12:00:00`)
      : new Date(birthDateValue)
    : null;
  const hasValidBirthDate = birthDate !== null && !Number.isNaN(birthDate.getTime());
  const birthDateFormatted = hasValidBirthDate ? birthDate.toLocaleDateString('pt-BR') : 'Não informada';
  const age = hasValidBirthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400000))
    : null;

  // Informações clínicas consolidadas de ficha médica e resumo do dashboard
  const bloodType = ficha.tipoSanguineo || resumoFicha?.tipoSanguineo || 'Não informado';
  const isDonor = ficha.doadorOrgaos ?? resumoFicha?.doadorOrgaos;
  const allergiesList = Array.from(
    new Set([
      ...normalizeList(ficha.alergias),
      ...normalizeList(resumoFicha?.alergias),
    ]),
  );
  const conditionsList = Array.from(
    new Set([
      ...normalizeList(ficha.condicoes),
      ...normalizeList(ficha.doencasCronicas),
      ...normalizeList(resumoFicha?.condicoes),
      ...(ficha.outrasDoencas ? [ficha.outrasDoencas.trim()] : []),
      ...(resumoFicha?.outrasDoencas ? [resumoFicha.outrasDoencas.trim()] : []),
    ]),
  ).filter(Boolean);
  const medicationsList = Array.from(
    new Set([
      ...normalizeList(ficha.medicamentosContinuos),
      ...normalizeList(resumoFicha?.medicamentosContinuos),
    ]),
  );
  const emergencyContact = (user.contatoEmergencia || ficha.contatoEmergencia || resumoFicha?.contatoEmergencia || '').trim();
  const emergencyPhone = emergencyContact.replace(/[^\d+]/g, '');
  const hasEmergencyPhone = emergencyPhone.replace(/\D/g, '').length >= 8;
  const surgeries = (ficha.cirurgias || resumoFicha?.cirurgias || '').trim();
  const familyHistory = (ficha.historicoFamiliar || resumoFicha?.historicoFamiliar || '').trim();
  const observations = (ficha.observacoes || resumoFicha?.observacoes || '').trim();
  const generalHabits = (ficha.habitosGerais || resumoFicha?.habitosGerais || '').trim();

  // Gera token de emergência para o QR Code da carteirinha
  useEffect(() => {
    if (!open || !user.id || qrToken) return;
    setIsRotatingToken(true);
    rotateEmergencyToken(user.id)
      .then((token) => setQrToken(token))
      .catch((err) => console.error('Erro ao gerar token para carteirinha:', err))
      .finally(() => setIsRotatingToken(false));
  }, [open, user.id, qrToken]);

  const qrValidationUrl = qrToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/emergencia/${qrToken}`
    : typeof window !== 'undefined'
      ? `${window.location.origin}/emergencia`
      : 'https://saude-memora.vercel.app/emergencia';

  // Copia o número da carteirinha
  const handleCopyNumber = async () => {
    if (!rawCardNumber) return;
    try {
      await navigator.clipboard.writeText(rawCardNumber);
      setCopiedNumber(true);
      toast({
        title: 'Número copiado!',
        description: 'Número da carteirinha copiado para a área de transferência.',
      });
      setTimeout(() => setCopiedNumber(false), 2200);
    } catch {
      toast({
        title: 'Não foi possível copiar',
        variant: 'destructive',
      });
    }
  };

  // Copia resumo completo formatado para WhatsApp / Clínicas
  const handleCopyFullData = async () => {
    const lines = [
      `*CARTEIRINHA DE SAÚDE — SAÚDE MEMORA*`,
      `*Titular:* ${fullName}`,
      hasValidBirthDate ? `*Nascimento:* ${birthDateFormatted} (${age} anos)` : null,
      healthPlan ? `*Convênio:* ${healthPlan}` : null,
      rawCardNumber ? `*Nº da Carteirinha:* ${rawCardNumber}` : null,
      bloodType && bloodType !== 'Não informado' ? `*Tipo Sanguíneo:* ${bloodType}` : null,
      isDonor != null ? `*Doador de Órgãos:* ${isDonor ? 'Sim' : 'Não'}` : null,
      allergiesList.length ? `*Alergias:* ${allergiesList.join(', ')}` : null,
      medicationsList.length ? `*Medicamentos em uso:* ${medicationsList.join(', ')}` : null,
      emergencyContact ? `*Contato de Emergência:* ${emergencyContact}` : null,
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedSummary(true);
      toast({
        title: 'Dados completos copiados!',
        description: 'Pronto para enviar por WhatsApp ou colar na ficha médica.',
      });
      setTimeout(() => setCopiedSummary(false), 2200);
    } catch {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive',
      });
    }
  };

  // Imprimir carteirinha
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" />
        <DialogPrimitive.Content
          aria-describedby="carteirinha-modal-description"
          className="fixed inset-x-2 sm:inset-x-4 top-[2%] sm:top-[4%] z-50 mx-auto flex max-h-[96dvh] sm:max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] sm:rounded-[32px] border border-[#E3E8F0] bg-[#F4F7FC] shadow-2xl outline-none animate-in fade-in zoom-in-95 duration-200"
        >
          {/* ── Top Header Bar ──────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#E3E8F0] bg-white px-3.5 py-2.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                <CreditCard size={20} className="sm:size-[22px]" />
              </div>
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-sm sm:text-lg font-bold tracking-tight text-[#14211F] truncate">
                  Carteirinha de Saúde
                </DialogPrimitive.Title>
                <div id="carteirinha-modal-description" className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#5B6878] truncate">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0" />
                  <span className="truncate">Identificação Ativa</span>
                  {healthPlan && <span className="truncate hidden xs:inline">· {healthPlan}</span>}
                </div>
              </div>
            </div>

            {/* Controles de Ação no topo */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Botão de Imprimir */}
              <button
                type="button"
                onClick={handlePrint}
                title="Imprimir carteirinha"
                aria-label="Imprimir carteirinha"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[#E3E8F0] text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#1D4ED8] transition-colors"
              >
                <Printer size={16} />
              </button>

              {/* Controles de Zoom */}
              <div className="hidden sm:flex items-center rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] p-0.5">
                <button
                  type="button"
                  aria-label="Diminuir zoom"
                  onClick={() => setCardZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
                  disabled={cardZoom <= 0.8}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1D4ED8] hover:bg-white disabled:opacity-30 transition-colors"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="min-w-10 text-center text-[11px] font-bold text-[#5B6878]">
                  {Math.round(cardZoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="Aumentar zoom"
                  onClick={() => setCardZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                  disabled={cardZoom >= 1.4}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1D4ED8] hover:bg-white disabled:opacity-30 transition-colors"
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              {/* Botão Fechar */}
              <DialogPrimitive.Close
                aria-label="Fechar carteirinha"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-[#5B6878] hover:bg-[#E3E8F0] transition-colors"
              >
                <X size={19} />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* ── Subheader com Abas ─────────────────────────────────── */}
          <div className="flex shrink-0 items-center gap-2 border-b border-[#E3E8F0] bg-white px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab('digital')}
              className={`flex items-center gap-2 border-b-2 py-3 text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'digital'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-[#5B6878] hover:text-[#14211F]'
              }`}
            >
              <CreditCard size={16} />
              <span>Carteirinha Digital</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documento')}
              className={`flex items-center gap-2 border-b-2 py-3 text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'documento'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-[#5B6878] hover:text-[#14211F]'
              }`}
            >
              <FileText size={16} />
              <span>Documento do Convênio</span>
              {registeredCardUrl ? (
                <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#059669]">
                  Anexado
                </span>
              ) : (
                <span className="rounded-full bg-[#F4F7FC] px-2 py-0.5 text-[10px] font-medium text-[#5B6878]">
                  Pendente
                </span>
              )}
            </button>
          </div>

          {/* ── Scrollable Body Content ────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-6">
            <div
              style={{
                transform: cardZoom !== 1 ? `scale(${cardZoom})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="mx-auto max-w-2xl space-y-4 sm:space-y-5"
            >
              {activeTab === 'digital' ? (
                <>
                  {/* ── CARTEIRINHA FÍSICA DIGITAL (CARD AZUL ESCURO CLÍNICO) ──────────── */}
                  <div
                    id="printable-carteirinha"
                    className="relative overflow-hidden rounded-[22px] sm:rounded-[30px] border border-[#25416B]/60 border-t-4 border-t-[#1D4ED8] bg-gradient-to-br from-[#0F1E36] via-[#162B4D] to-[#0D1829] p-4 sm:p-8 text-white shadow-[0_16px_40px_-10px_rgba(15,30,54,0.45)] select-none"
                  >
                    {/* Linhas de segurança de fundo (guilloche / curvas sutis) */}
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 400 240"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 40 Q 100 80, 200 40 T 400 40 M0 90 Q 100 130, 200 90 T 400 90 M0 140 Q 100 180, 200 140 T 400 140 M0 190 Q 100 230, 200 190 T 400 190"
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth="1.5"
                      />
                    </svg>

                    {/* Brilho radial superior */}
                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#1D4ED8]/25 blur-2xl" />

                    {/* 1. Header do Cartão */}
                    <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
                      <BrandLogo
                        withLink={false}
                        inverse={true}
                        iconClassName="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-xs"
                        wordmarkClassName="text-base sm:text-xl"
                      />

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] sm:text-[11px] font-bold text-[#93C5FD] shadow-xs backdrop-blur-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
                        CARTEIRINHA DIGITAL
                      </span>
                    </div>

                    {/* 2. Informações Principais (Nome e Plano) */}
                    <div className="relative z-10 mt-5 sm:mt-7">
                      <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#93C5FD]">
                        TITULAR DA CONTA
                      </div>
                      <h2 className="mt-0.5 text-xl sm:text-3xl font-extrabold tracking-tight text-white break-words line-clamp-2">
                        {fullName}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] sm:text-xs text-slate-300 font-medium">
                        <span>Nasc: {birthDateFormatted}</span>
                        {age !== null && <span>· {age} anos</span>}
                        {user.sexo && <span>· Sexo {user.sexo}</span>}
                      </div>
                    </div>

                    {/* 3. Bloco do Convênio & Número com Copiar */}
                    <div className="relative z-10 mt-4 sm:mt-5 rounded-xl sm:rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4 backdrop-blur-md shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="block text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#93C5FD]">
                            CONVÊNIO / PLANO DE SAÚDE
                          </span>
                          <span className="text-sm sm:text-lg font-bold text-white block truncate">
                            {healthPlan || 'Plano Particular / Não informado'}
                          </span>
                        </div>

                        {rawCardNumber && (
                          <button
                            type="button"
                            onClick={handleCopyNumber}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#1E40AF] transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Copiar número da carteirinha"
                          >
                            {copiedNumber ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiedNumber ? 'Copiado!' : 'Copiar Nº'}</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-2.5 border-t border-white/10 pt-2 flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            Nº DA CARTEIRINHA
                          </span>
                          <span className="font-mono text-sm sm:text-lg font-extrabold tracking-wider text-white break-all">
                            {formattedCardNumber}
                          </span>
                        </div>
                        <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 shrink-0">
                          VÁLIDO
                        </span>
                      </div>
                    </div>

                    {/* 4. Rodapé do Cartão: Sanguíneo, Doador e QR Code */}
                    <div className="relative z-10 mt-4 sm:mt-5 flex items-end justify-between gap-2 sm:gap-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        {/* Tipo Sanguíneo */}
                        <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 backdrop-blur-xs shadow-2xs">
                          <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#93C5FD]">
                            <Droplets size={11} className="text-[#E8664A]" />
                            <span>SANGUE</span>
                          </div>
                          <div className="mt-0.5 text-lg sm:text-2xl font-black text-white leading-none">
                            {bloodType}
                          </div>
                        </div>

                        {/* Doador de Órgãos */}
                        <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 backdrop-blur-xs shadow-2xs">
                          <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#93C5FD]">
                            <Heart size={11} className="text-[#E8664A] fill-[#E8664A]" />
                            <span>DOADOR</span>
                          </div>
                          <div className="mt-0.5 text-xs sm:text-sm font-bold text-white leading-none">
                            {isDonor ? 'Sim, doador' : 'Não informado'}
                          </div>
                        </div>
                      </div>

                      {/* QR Code de Validação */}
                      <div className="flex flex-col items-center gap-1 rounded-xl sm:rounded-2xl border border-white/15 bg-white p-1.5 sm:p-2 shadow-xs shrink-0">
                        <QRCodeSVG
                          value={qrValidationUrl}
                          size={52}
                          level="M"
                          includeMargin={false}
                          className="rounded-md"
                        />
                        <span className="text-[7.5px] sm:text-[8px] font-extrabold tracking-wider text-[#1D4ED8] uppercase">
                          AUTENTICAR
                        </span>
                      </div>
                    </div>

                    {/* Linha de Microimpressão de Segurança */}
                    <div className="relative z-10 mt-4 sm:mt-5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-1 text-[8px] sm:text-[8.5px] font-mono tracking-widest text-slate-400 uppercase">
                      <span>PADRÃO TISS / ANS · CFM Nº 2.314/2022</span>
                      <span>AUTENTICAÇÃO CRIPTOGRÁFICA</span>
                    </div>
                  </div>

                  {/* Institutional Recognition Badge below Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#CFE0FF] bg-white px-4 py-2.5 text-xs text-[#5B6878] shadow-2xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#10B981]" />
                      <span className="font-semibold text-[#14211F]">Identificação Digital de Saúde</span>
                    </div>
                    <span className="text-[11px] text-[#5B6878]">Apresente na recepção de clínicas, consultórios ou laboratórios</span>
                  </div>

                  {/* ── SEÇÃO CLÍNICA COMPLEMENTAR (VERSO DO CARTÃO) ───── */}
                  <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3E8F0] pb-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#14211F]">
                        <Activity size={18} className="text-[#1D4ED8]" />
                        <span>Ficha Clínica Rápida</span>
                      </div>
                      <Link
                        href="/anamnese"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:underline"
                      >
                        <span>Atualizar dados da ficha</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
                      {/* Alergias */}
                      <div className="rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-3.5">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#E8664A]">
                          <AlertCircle size={14} />
                          <span>Alergias</span>
                        </div>
                        <div className="mt-1.5 font-semibold text-[#14211F]">
                          {allergiesList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {allergiesList.map((alergia) => (
                                <span
                                  key={alergia}
                                  className="inline-block rounded-lg border border-[#E8664A]/30 bg-[#FDE1DA] px-2 py-0.5 text-[11px] font-bold text-[#9B2C16]"
                                >
                                  {alergia}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#5B6878]">Nenhuma alergia cadastrada</span>
                          )}
                        </div>
                      </div>

                      {/* Medicamentos contínuos */}
                      <div className="rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-3.5">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#1D4ED8]">
                          <Pill size={14} />
                          <span>Medicamentos Contínuos</span>
                        </div>
                        <div className="mt-1.5 font-semibold text-[#14211F]">
                          {medicationsList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {medicationsList.map((med) => (
                                <span
                                  key={med}
                                  className="inline-block rounded-lg border border-[#1D4ED8]/20 bg-[#CFE0FF]/60 px-2 py-0.5 text-[11px] font-bold text-[#1D4ED8]"
                                >
                                  {med}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#5B6878]">Nenhum medicamento informado</span>
                          )}
                        </div>
                      </div>

                      {/* Condições de saúde ativas */}
                      <div className="rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-3.5">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#14211F]">
                          <Activity size={14} className="text-[#1D4ED8]" />
                          <span>Condições / Doenças</span>
                        </div>
                        <div className="mt-1.5 font-semibold text-[#14211F]">
                          {conditionsList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {conditionsList.map((cond) => (
                                <span
                                  key={cond}
                                  className="inline-block rounded-lg border border-[#CFE0FF] bg-white px-2 py-0.5 text-[11px] font-bold text-[#14211F] shadow-2xs"
                                >
                                  {cond}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#5B6878]">Nenhuma condição informada</span>
                          )}
                        </div>
                      </div>

                      {/* Contato de emergência com discagem direta */}
                      <div className="rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-3.5">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#1D4ED8]">
                          <Phone size={14} />
                          <span>Contato de Emergência</span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#14211F] truncate">
                            {emergencyContact || <span className="text-[#5B6878]">Não informado</span>}
                          </span>
                          {hasEmergencyPhone && (
                            <a
                              href={`tel:${emergencyPhone}`}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#10B981] px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#059669] transition-colors"
                            >
                              <Phone size={11} />
                              <span>Ligar</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cirurgias, Histórico Familiar, Observações ou Hábitos */}
                    {(surgeries || familyHistory || observations || generalHabits) && (
                      <div className="border-t border-[#E3E8F0] pt-3 text-xs space-y-1.5 text-[#5B6878]">
                        {surgeries && (
                          <div>
                            <strong className="text-[#14211F]">Cirurgias anteriores:</strong> {surgeries}
                          </div>
                        )}
                        {familyHistory && (
                          <div>
                            <strong className="text-[#14211F]">Histórico familiar:</strong> {familyHistory}
                          </div>
                        )}
                        {observations && (
                          <div>
                            <strong className="text-[#14211F]">Observações clínicas:</strong> {observations}
                          </div>
                        )}
                        {generalHabits && (
                          <div>
                            <strong className="text-[#14211F]">Hábitos e rotina:</strong> {generalHabits}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <AiDataNotice />
                </>
              ) : (
                /* ── ABA: DOCUMENTO ORIGINAL DO CONVÊNIO ─────────────── */
                <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-5 sm:p-6 shadow-xs">
                  {registeredCardUrl ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3E8F0] pb-3">
                        <div>
                          <h3 className="text-base font-bold text-[#14211F]">
                            Documento do Convênio Anexado
                          </h3>
                          <p className="text-xs text-[#5B6878]">
                            Arquivo original da sua carteirinha física registrado no Saúde Memora.
                          </p>
                        </div>
                        {!/\.pdf(?:[?#]|$)/i.test(registeredCardUrl) ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImageOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1D4ED8] bg-white px-3 py-1.5 text-xs font-bold text-[#1D4ED8] hover:bg-[#CFE0FF] transition-colors"
                          >
                            <ZoomIn size={14} />
                            <span>Ampliar imagem</span>
                          </button>
                        ) : (
                          <a
                            href={registeredCardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1D4ED8] bg-white px-3 py-1.5 text-xs font-bold text-[#1D4ED8] hover:bg-[#CFE0FF] transition-colors"
                          >
                            <ExternalLink size={14} />
                            <span>Abrir arquivo PDF</span>
                          </a>
                        )}
                      </div>

                      <div className="flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-3">
                        {/\.pdf(?:[?#]|$)/i.test(registeredCardUrl) ? (
                          <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                              <FileText size={32} />
                            </div>
                            <div>
                              <div className="font-bold text-[#14211F]">Documento em formato PDF</div>
                              <div className="text-xs text-[#5B6878]">Clique abaixo para visualizar o arquivo completo</div>
                            </div>
                            <a
                              href={registeredCardUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#1e40af] transition-colors"
                            >
                              <ExternalLink size={16} />
                              Visualizar PDF da carteirinha
                            </a>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewImageOpen(true)}
                            aria-label="Expandir imagem da carteirinha"
                            className="group relative cursor-zoom-in overflow-hidden rounded-xl focus:outline-none"
                          >
                            <img
                              src={registeredCardUrl}
                              alt="Foto da carteirinha do convênio"
                              className="max-h-[60vh] w-auto rounded-xl object-contain shadow-xs transition-transform duration-200 group-hover:scale-[1.01]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 rounded-xl">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1D4ED8] shadow-md">
                                <ZoomIn size={14} />
                                Clique para expandir
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                        <CreditCard size={28} />
                      </div>
                      <div className="max-w-sm">
                        <div className="text-base font-bold text-[#14211F]">Nenhuma foto anexada ainda</div>
                        <div className="mt-1 text-xs text-[#5B6878]">
                          Você pode anexar uma foto ou PDF da carteirinha física do seu plano para tê-la sempre à mão.
                        </div>
                      </div>
                      <Link
                        href="/perfil"
                        onClick={() => onOpenChange(false)}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1e40af] transition-colors"
                      >
                        <ArrowUpRight size={15} />
                        Ir para Perfil e anexar foto
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Modal Bottom Actions Bar ────────────────────────────── */}
          <div className="flex shrink-0 flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-[#E3E8F0] bg-white px-3.5 py-2.5 sm:px-6 sm:py-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyFullData}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E3E8F0] bg-white px-3 py-2 text-xs font-bold text-[#14211F] hover:bg-[#F4F7FC] transition-colors"
              >
                {copiedSummary ? <Check size={14} className="text-[#10B981]" /> : <Share2 size={14} className="text-[#1D4ED8]" />}
                <span>{copiedSummary ? 'Dados copiados!' : 'Copiar dados'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="sm:hidden inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E3E8F0] bg-white px-3 py-2 text-xs font-bold text-[#14211F] hover:bg-[#F4F7FC] transition-colors"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <Link
                href="/perfil"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-[#5B6878] hover:text-[#1D4ED8] hover:bg-[#F4F7FC] transition-colors"
              >
                <span>Editar dados</span>
                <ArrowUpRight size={13} />
              </Link>

              <DialogPrimitive.Close
                aria-label="Concluir visualização"
                className="rounded-xl bg-[#1D4ED8] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1e40af] transition-colors"
              >
                Concluir
              </DialogPrimitive.Close>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>

    {/* Lightbox para imagem ampliada sem sair da tela */}
    <DialogPrimitive.Root open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md animate-in fade-in duration-150" />
        <DialogPrimitive.Content
          aria-describedby="carteirinha-img-preview-desc"
          className="fixed inset-2 sm:inset-6 z-[65] flex items-center justify-center p-2 outline-none animate-in zoom-in-95 duration-150"
        >
          <DialogPrimitive.Title className="sr-only">Visualização da Carteirinha</DialogPrimitive.Title>
          <div id="carteirinha-img-preview-desc" className="sr-only">Imagem ampliada da carteirinha do convênio</div>
          <div className="relative flex max-h-[92vh] max-w-[95vw] flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setPreviewImageOpen(false)}
              aria-label="Fechar ampliação"
              className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#14211F] shadow-xl hover:bg-[#F4F7FC] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D4ED8]"
            >
              <X size={20} />
            </button>
            <img
              src={registeredCardUrl}
              alt="Carteirinha do convênio ampliada"
              className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl bg-white"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  </>
  );
}
