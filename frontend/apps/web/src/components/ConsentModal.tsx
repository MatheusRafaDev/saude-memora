import { useEffect, useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useConsentimento, useSaveConsentimento } from '../hooks/useConsentimento';
import { useGetApiPacientesMe } from '@workspace/api-client-react';

const VERSAO_ATUAL = 'v1.0';

export function ConsentModal() {
  const { data: user } = useGetApiPacientesMe();
  const { data, isLoading } = useConsentimento();
  const saveConsent = useSaveConsentimento();
  const [open, setOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  useEffect(() => {
    if (!user || isLoading) return;

    if (!data?.versaoTermo || data.versaoTermo !== VERSAO_ATUAL) {
      setOpen(true);
    }

    const handleEvent = () => setOpen(true);
    window.addEventListener('consentimento-necessario', handleEvent);
    return () => window.removeEventListener('consentimento-necessario', handleEvent);
  }, [user, data, isLoading]);

  const handleConsent = (aceito: boolean) => {
    saveConsent.mutate(aceito, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[99998] bg-[#0f1e3c]/60 backdrop-blur-xs animate-in fade-in" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] w-full max-w-[580px] bg-white rounded-[28px] p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] border border-[#dde3ec] outline-none animate-in zoom-in-95"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Close button */}
          <DialogPrimitive.Close
            onClick={() => handleConsent(false)}
            className="absolute right-4 top-4 w-10 h-10 rounded-[13px] bg-[#f1f4f8] hover:bg-slate-200 transition-colors flex items-center justify-center text-[#5a6a80] cursor-pointer"
          >
            <X size={20} />
          </DialogPrimitive.Close>

          {/* Shield Icon */}
          <div className="w-14 h-14 rounded-[18px] bg-[#e5eefb] flex items-center justify-center shrink-0">
            <Shield size={28} className="text-[#1f7fe0]" strokeWidth={2} />
          </div>

          <h2 className="mt-4.5 mb-1.5 text-2xl sm:text-[26px] font-extrabold tracking-[-0.03em] text-[#1b3a60]">
            Antes de começar
          </h2>
          <p className="m-0 mb-5 text-[#5a6a80] text-sm sm:text-base leading-relaxed">
            Para organizar seus documentos, precisamos do seu consentimento.
          </p>

          {/* Bullets */}
          <ul className="list-none m-0 mb-5 p-0 space-y-3">
            <li className="flex gap-3 items-center text-sm sm:text-[15px] text-[#1d2a3d]">
              <span className="w-6 h-6 rounded-full bg-[#1f7fe0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span>Você decide o que adicionar</span>
            </li>
            <li className="flex gap-3 items-center text-sm sm:text-[15px] text-[#1d2a3d]">
              <span className="w-6 h-6 rounded-full bg-[#1f7fe0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span>Os dados lidos podem conter erros: confira sempre</span>
            </li>
            <li className="flex gap-3 items-center text-sm sm:text-[15px] text-[#1d2a3d]">
              <span className="w-6 h-6 rounded-full bg-[#1f7fe0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span>Você pode apagar documentos e a conta quando quiser</span>
            </li>
          </ul>

          {/* Accept checkbox pill */}
          <div
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className="flex gap-2.5 items-center p-3.5 rounded-2xl bg-[#f1f4f8] text-sm text-[#1d2a3d] mb-5.5 cursor-pointer select-none hover:bg-slate-200/70 transition-colors"
          >
            <span
              className={`w-5.5 h-5.5 rounded-md flex items-center justify-center transition-colors ${
                acceptedTerms ? 'bg-[#1b3a60] text-white' : 'border border-[#c6cfdb] bg-white'
              }`}
            >
              {acceptedTerms && <Check size={14} strokeWidth={2.5} />}
            </span>
            <span>Li e aceito a Política de Privacidade e os Termos</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 justify-end">
            <button
              type="button"
              onClick={() => handleConsent(false)}
              className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Agora não
            </button>
            <button
              type="button"
              disabled={!acceptedTerms || saveConsent.isPending}
              onClick={() => handleConsent(true)}
              className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1b3a60] text-white hover:bg-[#24507f] transition-colors cursor-pointer disabled:opacity-50"
            >
              Aceitar e continuar
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
