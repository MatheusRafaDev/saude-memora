import { useEffect, useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useConsentimento, useSaveConsentimento } from '../hooks/useConsentimento';
import { useGetApiPacientesMe } from '@workspace/api-client-react';

export function ConsentModal() {
  const { data: user } = useGetApiPacientesMe();
  const { data, isLoading } = useConsentimento();
  const saveConsent = useSaveConsentimento();
  const [open, setOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  useEffect(() => {
    if (!user || isLoading) return;

    setOpen(Boolean(data?.mostrarModal));

    const handleEvent = () => setOpen(true);
    window.addEventListener('consentimento-necessario', handleEvent);
    return () => window.removeEventListener('consentimento-necessario', handleEvent);
  }, [user, data, isLoading]);

  const handleDismiss = () => {
    saveConsent.mutate({ dispensar: true }, {
      onSuccess: () => setOpen(false),
    });
  };

  const handleConsent = () => {
    saveConsent.mutate({ aceito: true }, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && open) {
        handleDismiss();
        return;
      }
      setOpen(nextOpen);
    }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[99998] bg-[#0f1e3c]/60 backdrop-blur-xs animate-in fade-in" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] w-[calc(100%-2rem)] max-w-[580px] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] overflow-y-auto bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] border border-[#dde3ec] outline-none animate-in zoom-in-95"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={saveConsent.isPending}
            className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-[#F4F7FC] hover:bg-[#E3E8F0] transition-colors flex items-center justify-center text-[#5B6878] cursor-pointer"
            aria-label="Agora não"
          >
            <X size={20} />
          </button>

          {/* Shield Icon */}
          <div className="w-14 h-14 rounded-[18px] bg-[#CFE0FF]/40 flex items-center justify-center shrink-0">
            <Shield size={28} className="text-[#1D4ED8]" strokeWidth={2} />
          </div>

          <h2 className="mt-4.5 mb-1.5 text-2xl sm:text-[26px] font-extrabold tracking-[-0.03em] text-[#14211F]">
            Antes de começar
          </h2>
          <p className="m-0 mb-5 text-[#5B6878] text-sm sm:text-base leading-relaxed">
            Para organizar seus documentos, precisamos do seu consentimento.
          </p>

          {/* Bullets */}
          <ul className="list-none m-0 mb-5 p-0 space-y-3">
            <li className="flex gap-3 items-center text-sm sm:text-[15px] text-[#14211F]">
              <span className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span>Você decide o que adicionar</span>
            </li>
            <li className="flex gap-3 items-center text-sm sm:text-[15px] text-[#14211F]">
              <span className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span>Os dados lidos podem conter erros: confira sempre</span>
            </li>
            <li className="flex gap-3 items-center text-sm sm:text-[15px] text-[#14211F]">
              <span className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check size={14} strokeWidth={2.5} />
              </span>
              <span>Você pode apagar documentos e a conta quando quiser</span>
            </li>
          </ul>

          {/* Accept checkbox pill */}
          <div
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className="flex gap-2.5 items-center p-3.5 rounded-2xl bg-[#F4F7FC] text-sm text-[#14211F] mb-5.5 cursor-pointer select-none hover:bg-[#E3E8F0] transition-colors"
          >
            <span
              className={`w-5.5 h-5.5 rounded-md flex items-center justify-center transition-colors ${
                acceptedTerms ? 'bg-[#1D4ED8] text-white shadow-xs' : 'border border-[#c6cfdb] bg-white'
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
              onClick={handleDismiss}
              disabled={saveConsent.isPending}
              className="min-h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-white text-[#14211F] border border-[#E3E8F0] hover:bg-[#F4F7FC] hover:border-[#CFE0FF] transition-all cursor-pointer shadow-xs"
            >
              Agora não
            </button>
            <button
              type="button"
              disabled={!acceptedTerms || saveConsent.isPending}
              onClick={handleConsent}
              className="min-h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              Aceitar e continuar
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
