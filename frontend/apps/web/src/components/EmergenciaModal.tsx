import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  Phone,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  customFetch,
  getGetApiFichaMedicaMeQueryKey,
  getGetApiPacientesMeQueryKey,
  useGetApiFichaMedicaMe,
  useGetApiPacientesMe,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { rotateEmergencyToken } from "@/lib/emergency-token";

interface EmergenciaModalProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

function displayList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : item?.nome))
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#5a6a80]">
        {title}
      </h3>
      <div className="whitespace-pre-line break-words text-sm font-medium leading-relaxed text-[#1d2a3d]">
        {children || "Não informado"}
      </div>
    </section>
  );
}

export function EmergenciaModal({
  open,
  onClose,
  onOpenChange,
}: EmergenciaModalProps) {
  const { toast } = useToast();
  const [generatedToken, setGeneratedToken] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const [tokenErrorMessage, setTokenErrorMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const hasGeneratedTokenForOpen = useRef(false);

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const {
    data: profileRaw,
    isLoading: isProfileLoading,
    isError: profileError,
  } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      enabled: open,
      meta: { skipUnauthorizedRedirect: true },
    },
  });
  const {
    data: fichaRaw,
    isLoading: isFichaLoading,
    isError: fichaError,
  } = useGetApiFichaMedicaMe({
    query: {
      queryKey: getGetApiFichaMedicaMeQueryKey(),
      enabled: open,
      meta: { skipUnauthorizedRedirect: true },
    },
  });

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      hasGeneratedTokenForOpen.current = false;
      setGeneratedToken("");
      setTokenError(false);
      setTokenErrorMessage("");
      return;
    }
    if (!profileRaw || hasGeneratedTokenForOpen.current) return;
    const patientId = (profileRaw as any).id;
    if (!patientId) return;
    hasGeneratedTokenForOpen.current = true;
    setGeneratedToken("");
    setTokenError(false);
    setTokenErrorMessage("");
    rotateEmergencyToken(patientId)
      .then((token) => setGeneratedToken(token))
      .catch((error) => {
        console.error("Erro ao gerar link de emerg\u00eancia:", error);
        setTokenError(true);
        setTokenErrorMessage(
          (error as { status?: number })?.status === 401
            ? "Sua sess\u00e3o expirou. Entre novamente para gerar o QR Code."
            : "N\u00e3o foi poss\u00edvel gerar o QR Code. Tente novamente."
        );
      });
  }, [open, profileRaw]);

  if (!open) return null;

  const user = (profileRaw as any) || {};
  const ficha = (fichaRaw as any) || {};
  const birthDateValue = user.dataNascimento;
  const birthDate = birthDateValue
    ? /^\d{4}-\d{2}-\d{2}$/.test(birthDateValue)
      ? new Date(`${birthDateValue}T12:00:00`)
      : new Date(birthDateValue)
    : null;
  const hasValidBirthDate =
    birthDate !== null && !Number.isNaN(birthDate.getTime());
  const age = hasValidBirthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400000))
    : null;
  const birthDateFormatted = hasValidBirthDate
    ? birthDate.toLocaleDateString("pt-BR")
    : "";
  const sexValue = user.sexo || user.sexoBiologico || "";
  const sex =
    sexValue === "Masculino" ? "M" : sexValue === "Feminino" ? "F" : sexValue;
  const bloodType = ficha.tipoSanguineo || "Não informado";
  const allergies = displayList(ficha.alergias);
  const conditions = displayList(ficha.doencasCronicas);
  const medications = displayList(ficha.medicamentosContinuos);
  const emergencyContact =
    typeof user.contatoEmergencia === "string"
      ? user.contatoEmergencia.trim()
      : "";
  const emergencyPhone = emergencyContact.replace(/[^\d+]/g, "");
  const hasEmergencyPhone = emergencyPhone.replace(/\D/g, "").length >= 8;
  const isLoadingData = isProfileLoading || isFichaLoading;
  const hasDataError = profileError || fichaError;
  const shareUrl = generatedToken
    ? `${window.location.origin}/emergencia/${generatedToken}`
    : "";
  const donorLabel =
    ficha.doadorOrgaos === true
      ? "sim"
      : ficha.doadorOrgaos === false
        ? "não"
        : "não informado";
  const smokingLabel = ficha.fuma === true ? "Sim" : "Não informado";
  const alcoholLabel = ficha.bebe === true ? "Sim" : "Não informado";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        title: "Link copiado!",
        description: "Compartilhe apenas com quem precisa.",
      });
      window.setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast({
        title: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };


  return createPortal(
    // Overlay translúcido em vez de tela cheia opaca: a ficha se sobrepõe ao conteúdo
    // da página, que continua visível por trás. O desfoque preserva a legibilidade dos
    // textos escuros da ficha mesmo sobre fundos claros.
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#eef3fa]/80 p-2 backdrop-blur-sm sm:p-4"
      onClick={handleClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-modal-title"
        className="relative flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#dde3ec] bg-[#f7f9fc] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-[#dde3ec] bg-white p-4 pr-14 sm:p-6 sm:pr-16">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fde8e6] text-[#a13a30] sm:h-14 sm:w-14">
            <ShieldAlert size={26} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c0463a]">
              Ficha rápida
            </div>
            <h2
              id="emergency-modal-title"
              className="mt-0.5 text-2xl font-extrabold tracking-[-0.03em] text-[#1b3a60] sm:text-3xl"
            >
              Emergência
            </h2>
            <p className="mb-0 mt-1 text-sm leading-relaxed text-[#5a6a80]">
              Informações essenciais, em letras grandes e fáceis de ler.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4f8] text-[#5a6a80] transition-colors hover:bg-slate-200 sm:right-4 sm:top-4"
            aria-label="Fechar ficha de emergência"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto p-3 sm:p-6">
          {isLoadingData && (
            <div
              className="mb-3 flex items-center gap-2 rounded-xl bg-white p-3 text-sm text-[#5a6a80]"
              role="status"
            >
              <LoaderCircle size={16} className="animate-spin" />
              Carregando dados de emergência…
            </div>
          )}
          {hasDataError && (
            <p
              className="mb-3 rounded-xl border border-[#f0b8b2] bg-[#fff5f4] p-3 text-sm text-[#a13a30]"
              role="alert"
            >
              Não foi possível carregar todos os dados de emergência. Tente
              novamente mais tarde.
            </p>
          )}

          <div className="rounded-2xl border-2 border-[#c0463a] p-4 shadow-sm sm:rounded-[24px] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#c0463a]">
                  Ficha de emergência
                </div>
                <h3 className="mb-0 mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#1d2a3d] sm:text-4xl">
                  {user.nome || "Não informado"}
                </h3>
                <p className="mb-0 mt-1 text-sm text-[#5a6a80] sm:text-base">
                  {age !== null ? `${age} anos` : "Idade não informada"}
                  {birthDateFormatted
                    ? ` · Nascimento ${birthDateFormatted}`
                    : ""}
                  {sex ? ` · ${sex}` : ""}
                </p>
              </div>
              <div className="flex h-[92px] w-[100px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#c0463a] text-white shadow-sm sm:h-[110px] sm:w-[120px]">
                <span className="text-[11px] font-bold tracking-[0.1em]">
                  SANGUE
                </span>
                <span className="mt-0.5 text-3xl font-extrabold leading-tight sm:text-4xl">
                  {bloodType}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 border-t border-[#dde3ec] pt-4 sm:grid-cols-2">
              <InfoSection title="Alergias">
                {allergies.length ? allergies.join(" · ") : ""}
              </InfoSection>
              <InfoSection title="Condições de saúde">
                {conditions.length ? conditions.join(" · ") : ""}
              </InfoSection>
              <InfoSection title="Medicamentos contínuos">
                {medications.length ? medications.join(" · ") : ""}
              </InfoSection>
              <InfoSection title="Doador de órgãos">{donorLabel}</InfoSection>
              <InfoSection title="Cirurgias anteriores">
                {ficha.cirurgias?.trim()}
              </InfoSection>
              <InfoSection title="Plano de saúde">
                {user.planoSaude?.trim()
                  ? `${user.planoSaude.trim()} · Carteirinha: ${user.numeroCarteirinha?.trim() || "Não informada"}`
                  : `Não informado · Carteirinha: ${user.numeroCarteirinha?.trim() || "Não informada"}`}
              </InfoSection>
              <InfoSection title="Hábitos e rotina">
                {[
                  ficha.habitosGerais?.trim(),
                  `Tabagismo: ${smokingLabel} · Álcool: ${alcoholLabel}`,
                ]
                  .filter(Boolean)
                  .join("\n")}
              </InfoSection>
              <div className="sm:col-span-2">
                <InfoSection title="Histórico familiar">
                  {ficha.historicoFamiliar?.trim()}
                </InfoSection>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
            <section className="rounded-2xl bg-[#1b3a60] p-4 text-white sm:p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b7d9ff]">
                Emergência no Brasil
              </div>
              <div className="my-1 text-4xl font-extrabold leading-none sm:text-5xl">
                192
              </div>
              <p className="mb-3 text-sm leading-relaxed text-[#d8e5f5]">
                SAMU · ligue ou procure um serviço de urgência
              </p>
              <a
                href="tel:192"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-[#1b3a60] transition-colors hover:bg-[#e5eefb]"
              >
                <Phone size={17} />
                Ligar para 192
              </a>
            </section>

            <section className="rounded-2xl border border-[#dde3ec] bg-white p-4 sm:p-5">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#1f7fe0]">
                Contatos de emergência
              </div>
              <div className="flex min-h-16 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8] text-[#1b3a60]">
                  <User size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <b className="block break-words text-base text-[#1d2a3d]">
                    {emergencyContact || "Não informado"}
                  </b>
                  <span className="text-xs text-[#5a6a80]">
                    {emergencyContact
                      ? "Contato de emergência cadastrado"
                      : "Cadastre um contato no seu perfil"}
                  </span>
                </div>
                {hasEmergencyPhone && (
                  <a
                    href={`tel:${emergencyPhone}`}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#1f7fe0] px-3 text-sm font-bold text-white transition-colors hover:bg-[#1765b8]"
                  >
                    <Phone size={15} />
                    Ligar
                  </a>
                )}
              </div>
            </section>
          </div>

          <section className="mt-3 rounded-2xl border border-[#dde3ec] bg-white p-4 text-center sm:mt-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-left">
              <h3 className="mb-0 text-base font-bold text-[#1d2a3d]">
                QR Code da ficha
              </h3>
            </div>

            <div className="mx-auto mb-3 flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-[#dde3ec] bg-[#f7f9fc] p-2">
              {shareUrl ? (
                <QRCodeSVG
                  value={shareUrl}
                  size={124}
                  bgColor="#f7f9fc"
                  fgColor="#1b3a60"
                  level="M"
                  title="QR Code de emergência"
                />
              ) : (
                <span className="px-3 text-xs text-[#5a6a80]">
                  {tokenError ? tokenErrorMessage || "N\u00e3o foi poss\u00edvel gerar o QR Code. Tente novamente." : "Gerando QR Code da ficha de emerg\u00eancia\u2026"}
                </span>
              )}
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#5a6a80]">
              Mostre este QR Code para quem for prestar socorro acessar esta
              ficha.
            </p>
{shareUrl && (
              <>
<div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dde3ec] px-3 text-sm font-bold text-[#1b3a60] transition-colors hover:bg-[#f7f9fc] disabled:opacity-50"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? "Link copiado!" : "Copiar link"}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dde3ec] px-3 text-sm font-bold text-[#1b3a60] transition-colors hover:bg-[#f7f9fc]"
              >
                <ExternalLink size={16} />
                Abrir link
              </a>
            </div>
                          </>
            )}
            <p className="mb-0 mt-3 text-left text-[11px] leading-relaxed text-[#5a6a80]">
              Quem tiver o QR Code ou link poderá ver os dados exibidos nesta
              ficha. Compartilhe apenas com quem precisa.
            </p>
          </section>
        </div>
      </section>
    </div>,
    document.body,
  );
}
