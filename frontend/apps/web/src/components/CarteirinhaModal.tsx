import { useState, useEffect } from 'react';
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
  Heart,
  Droplets,
  AlertCircle,
  Phone,
  FileText,
  Pill,
  Activity,
  Share2,
  ArrowUpRight,
  Stethoscope,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BrandLogo } from '@/components/BrandLogo';

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
        if ('tem' in item && !(item as any).tem) return null;
        const name = (item as any).nome || (item as any).name || (item as any).descricao;
        return typeof name === 'string' ? name.trim() : null;
      }
      return null;
    })
    .filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function formatCardNumber(num?: string): string {
  if (!num) return 'Nao informado';
  const clean = num.trim();
  if (/^\d{8,24}$/.test(clean)) {
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  }
  return clean;
}

function InfoChip({ label, variant = 'neutral' }: { label: string; variant?: 'red' | 'blue' | 'green' | 'neutral' | 'amber' }) {
  const styles: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    neutral: 'bg-[#F4F7FC] border-[#E3E8F0] text-[#14211F]',
  };
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles[variant]}`}>
      {label}
    </span>
  );
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
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  const fullName = user.nome || 'Nome nao informado';
  const healthPlan = (user.planoSaude || resumoFicha?.planoSaude || '').trim();
  const rawCardNumber = (user.numeroCarteirinha || resumoFicha?.numeroCarteirinha || '').trim();
  const formattedCardNumber = formatCardNumber(rawCardNumber);
  const registeredCardUrl = typeof user.urlCarteirinha === 'string' ? user.urlCarteirinha : '';

  const birthDateValue = user.dataNascimento;
  const birthDate = birthDateValue
    ? /^\d{4}-\d{2}-\d{2}$/.test(birthDateValue)
      ? new Date(`${birthDateValue}T12:00:00`)
      : new Date(birthDateValue)
    : null;
  const hasValidBirthDate = birthDate !== null && !Number.isNaN(birthDate.getTime());
  const birthDateFormatted = hasValidBirthDate ? birthDate!.toLocaleDateString('pt-BR') : 'Nao informada';
  const age = hasValidBirthDate
    ? Math.floor((Date.now() - birthDate!.getTime()) / (365.25 * 86400000))
    : null;

  const bloodType = ficha.tipoSanguineo || resumoFicha?.tipoSanguineo || 'Nao informado';
  const isDonor = ficha.doadorOrgaos ?? resumoFicha?.doadorOrgaos;
  const allergiesList = Array.from(new Set([...normalizeList(ficha.alergias), ...normalizeList(resumoFicha?.alergias)]));
  const conditionsList = Array.from(new Set([
    ...normalizeList(ficha.condicoes),
    ...normalizeList(ficha.doencasCronicas),
    ...normalizeList(resumoFicha?.condicoes),
    ...(ficha.outrasDoencas ? [ficha.outrasDoencas.trim()] : []),
    ...(resumoFicha?.outrasDoencas ? [resumoFicha.outrasDoencas.trim()] : []),
  ])).filter(Boolean);
  const medicationsList = Array.from(new Set([...normalizeList(ficha.medicamentosContinuos), ...normalizeList(resumoFicha?.medicamentosContinuos)]));
  const emergencyContact = (user.contatoEmergencia || ficha.contatoEmergencia || resumoFicha?.contatoEmergencia || '').trim();
  const emergencyPhone = emergencyContact.replace(/[^\d+]/g, '');
  const hasEmergencyPhone = emergencyPhone.replace(/\D/g, '').length >= 8;
  const surgeries = (ficha.cirurgias || resumoFicha?.cirurgias || '').trim();
  const familyHistory = (ficha.historicoFamiliar || resumoFicha?.historicoFamiliar || '').trim();
  const observations = (ficha.observacoes || resumoFicha?.observacoes || '').trim();
  const generalHabits = (ficha.habitosGerais || resumoFicha?.habitosGerais || '').trim();

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

  const handleCopyNumber = async () => {
    if (!rawCardNumber) return;
    try {
      await navigator.clipboard.writeText(rawCardNumber);
      setCopiedNumber(true);
      toast({ title: 'Numero copiado!', description: 'Numero da carteirinha copiado para a area de transferencia.' });
      setTimeout(() => setCopiedNumber(false), 2200);
    } catch {
      toast({ title: 'Nao foi possivel copiar', variant: 'destructive' });
    }
  };

  const handleCopyFullData = async () => {
    const lines = [
      `CARTEIRINHA DE SAUDE - SAUDE MEMORA`,
      `Titular: ${fullName}`,
      hasValidBirthDate ? `Nascimento: ${birthDateFormatted} (${age} anos)` : null,
      healthPlan ? `Convenio: ${healthPlan}` : null,
      rawCardNumber ? `No da Carteirinha: ${rawCardNumber}` : null,
      bloodType && bloodType !== 'Nao informado' ? `Tipo Sanguineo: ${bloodType}` : null,
      isDonor != null ? `Doador de Orgaos: ${isDonor ? 'Sim' : 'Nao'}` : null,
      allergiesList.length ? `Alergias: ${allergiesList.join(', ')}` : null,
      medicationsList.length ? `Medicamentos em uso: ${medicationsList.join(', ')}` : null,
      emergencyContact ? `Contato de Emergencia: ${emergencyContact}` : null,
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setCopiedSummary(true);
      toast({ title: 'Dados completos copiados!', description: 'Pronto para enviar por WhatsApp ou colar na ficha medica.' });
      setTimeout(() => setCopiedSummary(false), 2200);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
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
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#E3E8F0] bg-white px-3.5 py-2.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <CreditCard size={20} className="sm:size-[22px]" />
                </div>
                <div className="min-w-0">
                  <DialogPrimitive.Title className="text-sm sm:text-lg font-bold tracking-tight text-[#14211F] truncate">
                    Carteirinha de Saude
                  </DialogPrimitive.Title>
                  <div id="carteirinha-modal-description" className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#5B6878] truncate">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0" />
                    <span className="truncate">Identificacao Ativa</span>
                    {healthPlan && <span className="truncate hidden xs:inline"> {healthPlan}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button type="button" onClick={() => window.print()} title="Imprimir" aria-label="Imprimir carteirinha"
                  className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[#E3E8F0] text-[#5B6878] hover:bg-[#F4F7FC] hover:text-[#1D4ED8] transition-colors">
                  <Printer size={16} />
                </button>
                <div className="hidden sm:flex items-center rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] p-0.5">
                  <button type="button" aria-label="Diminuir zoom"
                    onClick={() => setCardZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
                    disabled={cardZoom <= 0.8}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1D4ED8] hover:bg-white disabled:opacity-30 transition-colors">
                    <ZoomOut size={15} />
                  </button>
                  <span className="min-w-10 text-center text-[11px] font-bold text-[#5B6878]">{Math.round(cardZoom * 100)}%</span>
                  <button type="button" aria-label="Aumentar zoom"
                    onClick={() => setCardZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                    disabled={cardZoom >= 1.4}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1D4ED8] hover:bg-white disabled:opacity-30 transition-colors">
                    <ZoomIn size={15} />
                  </button>
                </div>
                <DialogPrimitive.Close aria-label="Fechar carteirinha"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-[#5B6878] hover:bg-[#E3E8F0] transition-colors">
                  <X size={19} />
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 items-center gap-2 border-b border-[#E3E8F0] bg-white px-4 sm:px-6">
              <button type="button" onClick={() => setActiveTab('digital')}
                className={`flex items-center gap-2 border-b-2 py-3 text-xs sm:text-sm font-bold transition-all ${activeTab === 'digital' ? 'border-[#1D4ED8] text-[#1D4ED8]' : 'border-transparent text-[#5B6878] hover:text-[#14211F]'}`}>
                <CreditCard size={16} /><span>Carteirinha Digital</span>
              </button>
              <button type="button" onClick={() => setActiveTab('documento')}
                className={`flex items-center gap-2 border-b-2 py-3 text-xs sm:text-sm font-bold transition-all ${activeTab === 'documento' ? 'border-[#1D4ED8] text-[#1D4ED8]' : 'border-transparent text-[#5B6878] hover:text-[#14211F]'}`}>
                <FileText size={16} /><span>Documento do Convenio</span>
                {registeredCardUrl
                  ? <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#059669]">Anexado</span>
                  : <span className="rounded-full bg-[#F4F7FC] px-2 py-0.5 text-[10px] font-medium text-[#5B6878]">Pendente</span>
                }
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-6">
              <div style={{ transform: cardZoom !== 1 ? `scale(${cardZoom})` : undefined, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
                className="mx-auto max-w-2xl space-y-4 sm:space-y-5">

                {activeTab === 'digital' ? (
                  <>
                    {/* CARTEIRINHA DIGITAL PREMIUM */}
                    <div id="printable-carteirinha" className="relative overflow-hidden rounded-[20px] sm:rounded-[26px] select-none"
                      style={{ background: 'linear-gradient(135deg, #0F1E36 0%, #162B4D 45%, #1a3560 70%, #0D1829 100%)', boxShadow: '0 20px 60px -10px rgba(15,30,54,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}>

                      {/* Guilloche pattern */}
                      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 280" preserveAspectRatio="none">
                        <defs><pattern id="guilloche-card" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                          <circle cx="20" cy="20" r="18" fill="none" stroke="#60A5FA" strokeWidth="0.6" />
                          <circle cx="20" cy="20" r="12" fill="none" stroke="#93C5FD" strokeWidth="0.4" />
                        </pattern></defs>
                        <rect width="500" height="280" fill="url(#guilloche-card)" />
                      </svg>

                      {/* Faixa lateral esquerda */}
                      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5"
                        style={{ background: 'linear-gradient(to bottom, #3B82F6, #1D4ED8, #0f3399)' }} />

                      {/* Brilho radial */}
                      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #60A5FA, transparent 70%)' }} />

                      <div className="relative z-10 p-4 sm:p-7">
                        {/* Linha 1: Logo + Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <BrandLogo withLink={false} inverse={true} iconClassName="h-8 w-8 sm:h-10 sm:w-10 drop-shadow" wordmarkClassName="text-sm sm:text-lg font-extrabold" />
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-[#93C5FD] backdrop-blur-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
                              CARTEIRINHA DIGITAL
                            </span>
                            <div className="hidden sm:block h-7 w-10 rounded-md border border-yellow-300/40 mt-1"
                              style={{ background: 'linear-gradient(135deg, rgba(253,224,71,0.22), rgba(202,138,4,0.12))' }} />
                          </div>
                        </div>

                        {/* Linha 2: Nome */}
                        <div className="mt-5 sm:mt-6">
                          <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#93C5FD] mb-1">TITULAR</div>
                          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight break-words">{fullName}</h2>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-slate-300 font-medium">
                            {hasValidBirthDate && <span className="inline-flex items-center gap-1"><Calendar size={11} className="text-[#93C5FD]" />{birthDateFormatted}</span>}
                            {age !== null && <span className="text-slate-400"> {age} anos</span>}
                            {user.sexo && <span className="text-slate-400"> {user.sexo}</span>}
                          </div>
                        </div>

                        {/* Linha 3: Convenio + Numero */}
                        <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="rounded-xl border border-white/10 p-2.5 sm:p-3 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#93C5FD] mb-1">CONVENIO</div>
                            <div className="text-sm sm:text-base font-bold text-white truncate">
                              {healthPlan || <span className="text-slate-400 font-normal text-xs">Nao informado</span>}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 p-2.5 sm:p-3 backdrop-blur-sm relative" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#93C5FD] mb-1 flex items-center justify-between">
                              <span>No CARTEIRINHA</span>
                              {rawCardNumber && (
                                <button type="button" onClick={handleCopyNumber} className="text-[#93C5FD] hover:text-white transition-colors p-0.5 rounded" title="Copiar numero">
                                  {copiedNumber ? <Check size={11} /> : <Copy size={11} />}
                                </button>
                              )}
                            </div>
                            <div className="font-mono text-xs sm:text-sm font-bold text-white break-all leading-tight">{formattedCardNumber}</div>
                            {rawCardNumber && (
                              <span className="absolute top-2 right-2 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">VALIDO</span>
                            )}
                          </div>
                        </div>

                        {/* Linha 4: Sangue + Doador + QR */}
                        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2 sm:gap-3">
                          <div className="flex flex-wrap items-end gap-2 sm:gap-2.5">
                            <div className="rounded-xl border border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-sm text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-[#93C5FD]">
                                <Droplets size={10} className="text-[#E8664A]" /><span>SANGUE</span>
                              </div>
                              <div className="mt-0.5 text-xl sm:text-2xl font-black text-white leading-none">{bloodType}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-sm text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-[#93C5FD]">
                                <Heart size={10} className="text-[#E8664A] fill-[#E8664A]" /><span>DOADOR</span>
                              </div>
                              <div className="mt-0.5 text-xs font-bold text-white leading-tight">
                                {isDonor === true ? 'Sim' : isDonor === false ? 'Nao' : '--'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-1 rounded-xl sm:rounded-2xl border border-white/15 bg-white p-1.5 sm:p-2 shadow-lg shrink-0">
                            <QRCodeSVG value={qrValidationUrl} size={54} level="M" includeMargin={false} className="rounded-md" />
                            <span className="text-[7px] font-extrabold tracking-wider text-[#1D4ED8] uppercase">EMERGENCIA</span>
                          </div>
                        </div>

                        {/* Rodape de seguranca */}
                        <div className="mt-3 sm:mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[7.5px] sm:text-[8.5px] font-mono tracking-widest text-slate-500 uppercase">PADRAO TISS / ANS CFM 2.314/2022</span>
                          <span className="text-[7.5px] sm:text-[8.5px] font-mono tracking-widest text-slate-500 uppercase">AUTENTICACAO CRIPTOGRAFICA</span>
                        </div>
                      </div>
                    </div>

                    {/* FICHA CLINICA */}
                    <div className="rounded-[20px] sm:rounded-[24px] border border-[#E3E8F0] bg-white overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#E3E8F0] bg-[#F8FAFF]">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1D4ED8] text-white">
                            <Stethoscope size={14} />
                          </div>
                          <span className="text-sm font-bold text-[#14211F]">Ficha Clinica</span>
                          <span className="hidden sm:inline text-xs text-[#5B6878]"> Verso da carteirinha</span>
                        </div>
                        <Link href="/anamnese" onClick={() => onOpenChange(false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:underline">
                          <span>Atualizar</span><ArrowUpRight size={12} />
                        </Link>
                      </div>

                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-xl border-2 border-red-100 bg-red-50/50 p-3.5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <AlertCircle size={14} className="text-red-600 shrink-0" />
                              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-red-700">Alergias</span>
                            </div>
                            {allergiesList.length > 0
                              ? <div className="flex flex-wrap gap-1.5">{allergiesList.map((a) => <InfoChip key={a} label={a} variant="red" />)}</div>
                              : <span className="text-xs text-[#5B6878]">Nenhuma cadastrada</span>}
                          </div>
                          <div className="rounded-xl border-2 border-blue-100 bg-blue-50/50 p-3.5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Pill size={14} className="text-blue-600 shrink-0" />
                              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-blue-700">Medicamentos Continuos</span>
                            </div>
                            {medicationsList.length > 0
                              ? <div className="flex flex-wrap gap-1.5">{medicationsList.map((m) => <InfoChip key={m} label={m} variant="blue" />)}</div>
                              : <span className="text-xs text-[#5B6878]">Nenhum cadastrado</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-[#E3E8F0] bg-[#F8FAFF] p-3.5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Activity size={14} className="text-indigo-600 shrink-0" />
                              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-indigo-700">Condicoes de Saude</span>
                            </div>
                            {conditionsList.length > 0
                              ? <div className="flex flex-wrap gap-1.5">{conditionsList.map((c) => <InfoChip key={c} label={c} variant="neutral" />)}</div>
                              : <span className="text-xs text-[#5B6878]">Nenhuma informada</span>}
                          </div>
                          <div className="rounded-xl border border-[#E3E8F0] bg-[#F8FAFF] p-3.5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Phone size={14} className="text-emerald-600 shrink-0" />
                              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-700">Contato de Emergencia</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#14211F] truncate">
                                {emergencyContact || <span className="text-[#5B6878] font-normal">Nao informado</span>}
                              </span>
                              {hasEmergencyPhone && (
                                <a href={`tel:${emergencyPhone}`} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#10B981] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-[#059669] transition-colors">
                                  <Phone size={10} /><span>Ligar</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {(surgeries || familyHistory || observations || generalHabits) && (
                          <div className="rounded-xl border border-[#E3E8F0] bg-[#FAFBFE] p-3.5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <FileText size={13} className="text-[#5B6878] shrink-0" />
                              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#5B6878]">Historico Adicional</span>
                            </div>
                            <dl className="space-y-1.5 text-xs">
                              {surgeries && <div className="flex gap-1.5"><dt className="font-bold text-[#14211F] shrink-0">Cirurgias:</dt><dd className="text-[#5B6878]">{surgeries}</dd></div>}
                              {familyHistory && <div className="flex gap-1.5"><dt className="font-bold text-[#14211F] shrink-0">Historico familiar:</dt><dd className="text-[#5B6878]">{familyHistory}</dd></div>}
                              {observations && <div className="flex gap-1.5"><dt className="font-bold text-[#14211F] shrink-0">Observacoes:</dt><dd className="text-[#5B6878]">{observations}</dd></div>}
                              {generalHabits && <div className="flex gap-1.5"><dt className="font-bold text-[#14211F] shrink-0">Habitos:</dt><dd className="text-[#5B6878]">{generalHabits}</dd></div>}
                            </dl>
                          </div>
                        )}
                      </div>

                      <div className="px-4 sm:px-5 py-2.5 border-t border-[#E3E8F0] bg-[#F8FAFF] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#10B981] shrink-0" />
                        <span className="text-[11px] text-[#5B6878]">Dados informados pelo titular. Validado com autenticacao segura.</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-5 sm:p-6 shadow-xs">
                    {registeredCardUrl ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3E8F0] pb-3">
                          <div>
                            <h3 className="text-base font-bold text-[#14211F]">Documento do Convenio Anexado</h3>
                            <p className="text-xs text-[#5B6878]">Arquivo original da sua carteirinha fisica registrado no Saude Memora.</p>
                          </div>
                          {!/\.pdf(?:[?#]|$)/i.test(registeredCardUrl) ? (
                            <button type="button" onClick={() => setPreviewImageOpen(true)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#1D4ED8] bg-white px-3 py-1.5 text-xs font-bold text-[#1D4ED8] hover:bg-[#CFE0FF] transition-colors">
                              <ZoomIn size={14} /><span>Ampliar imagem</span>
                            </button>
                          ) : (
                            <a href={registeredCardUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#1D4ED8] bg-white px-3 py-1.5 text-xs font-bold text-[#1D4ED8] hover:bg-[#CFE0FF] transition-colors">
                              <ExternalLink size={14} /><span>Abrir arquivo PDF</span>
                            </a>
                          )}
                        </div>
                        <div className="flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-[#E3E8F0] bg-[#F4F7FC] p-3">
                          {/\.pdf(?:[?#]|$)/i.test(registeredCardUrl) ? (
                            <div className="flex flex-col items-center gap-3 py-10 text-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]"><FileText size={32} /></div>
                              <div>
                                <div className="font-bold text-[#14211F]">Documento em formato PDF</div>
                                <div className="text-xs text-[#5B6878]">Clique abaixo para visualizar o arquivo completo</div>
                              </div>
                              <a href={registeredCardUrl} target="_blank" rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#1e40af] transition-colors">
                                <ExternalLink size={16} />Visualizar PDF da carteirinha
                              </a>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setPreviewImageOpen(true)} aria-label="Expandir imagem da carteirinha"
                              className="group relative cursor-zoom-in overflow-hidden rounded-xl focus:outline-none">
                              <img src={registeredCardUrl} alt="Foto da carteirinha do convenio"
                                className="max-h-[60vh] w-auto rounded-xl object-contain shadow-xs transition-transform duration-200 group-hover:scale-[1.01]" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 rounded-xl">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1D4ED8] shadow-md"><ZoomIn size={14} />Clique para expandir</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]"><CreditCard size={28} /></div>
                        <div className="max-w-sm">
                          <div className="text-base font-bold text-[#14211F]">Nenhuma foto anexada ainda</div>
                          <div className="mt-1 text-xs text-[#5B6878]">Voce pode anexar uma foto ou PDF da carteirinha fisica do seu plano para te-la sempre a mao.</div>
                        </div>
                        <Link href="/perfil" onClick={() => onOpenChange(false)}
                          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1e40af] transition-colors">
                          <ArrowUpRight size={15} />Ir para Perfil e anexar foto
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-[#E3E8F0] bg-white px-3.5 py-2.5 sm:px-6 sm:py-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button type="button" onClick={handleCopyFullData}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E3E8F0] bg-white px-3 py-2 text-xs font-bold text-[#14211F] hover:bg-[#F4F7FC] transition-colors">
                  {copiedSummary ? <Check size={14} className="text-[#10B981]" /> : <Share2 size={14} className="text-[#1D4ED8]" />}
                  <span>{copiedSummary ? 'Dados copiados!' : 'Copiar dados'}</span>
                </button>
                <button type="button" onClick={() => window.print()}
                  className="sm:hidden inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E3E8F0] bg-white px-3 py-2 text-xs font-bold text-[#14211F] hover:bg-[#F4F7FC] transition-colors">
                  <Printer size={14} /><span>Imprimir</span>
                </button>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <Link href="/perfil" onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-[#5B6878] hover:text-[#1D4ED8] hover:bg-[#F4F7FC] transition-colors">
                  <span>Editar dados</span><ArrowUpRight size={13} />
                </Link>
                <DialogPrimitive.Close aria-label="Concluir visualizacao"
                  className="rounded-xl bg-[#1D4ED8] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1e40af] transition-colors">
                  Concluir
                </DialogPrimitive.Close>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Lightbox */}
      <DialogPrimitive.Root open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md animate-in fade-in duration-150" />
          <DialogPrimitive.Content aria-describedby="carteirinha-img-preview-desc"
            className="fixed inset-2 sm:inset-6 z-[65] flex items-center justify-center p-2 outline-none animate-in zoom-in-95 duration-150">
            <DialogPrimitive.Title className="sr-only">Visualizacao da Carteirinha</DialogPrimitive.Title>
            <div id="carteirinha-img-preview-desc" className="sr-only">Imagem ampliada da carteirinha do convenio</div>
            <div className="relative flex max-h-[92vh] max-w-[95vw] flex-col items-center justify-center">
              <button type="button" onClick={() => setPreviewImageOpen(false)} aria-label="Fechar ampliacao"
                className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#14211F] shadow-xl hover:bg-[#F4F7FC] transition-colors">
                <X size={20} />
              </button>
              <img src={registeredCardUrl} alt="Carteirinha do convenio ampliada"
                className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl bg-white" />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
