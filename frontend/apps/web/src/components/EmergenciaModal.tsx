import { createPortal } from 'react-dom';
import { X, ShieldAlert, Phone, User, QrCode } from 'lucide-react';
import { useGetApiPacientesMe, useGetApiFichaMedicaMe } from '@workspace/api-client-react';

interface EmergenciaModalProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function EmergenciaModal({ open, onClose, onOpenChange }: EmergenciaModalProps) {
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };
  const { data: profileRaw } = useGetApiPacientesMe();
  const { data: fichaRaw } = useGetApiFichaMedicaMe();

  if (!open) return null;

  const user = (profileRaw as any) || {};
  const ficha = (fichaRaw as any) || {};

  const bloodType = ficha.tipoSanguineo || 'O+';
  const allergies = Array.isArray(ficha.alergias) && ficha.alergias.length > 0
    ? ficha.alergias.join(' · ')
    : 'Dipirona · Penicilina';

  const emergencyContactName = user.contatoEmergenciaNome || 'Carlos Souza';
  const emergencyContactPhone = user.contatoEmergencia || '(11) 90000-0000';
  const emergencyContactRelation = user.contatoEmergenciaParentesco || 'Esposo';

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0f1e3c]/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[580px] bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] border border-[#dde3ec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 w-10 h-10 rounded-[13px] bg-[#f1f4f8] hover:bg-slate-200 transition-colors flex items-center justify-center text-[#5a6a80] cursor-pointer"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-[18px] bg-[#fde8e6] flex items-center justify-center shrink-0">
          <ShieldAlert size={28} className="text-[#a13a30]" strokeWidth={2} />
        </div>

        {/* Title & Description */}
        <h2 className="mt-4.5 mb-1.5 text-2xl sm:text-[28px] font-extrabold tracking-[-0.03em] text-[#7a2a22]">
          Emergência
        </h2>
        <p className="mt-0 mb-4.5 text-[#5a6a80] text-sm sm:text-base leading-relaxed">
          Em risco de vida, ligue agora. Depois mostre estes dados a quem prestar socorro.
        </p>

        {/* Big SAMU Button */}
        <a
          href="tel:192"
          className="flex h-[60px] rounded-2xl bg-[#c0463a] hover:bg-[#a13a30] text-white text-lg sm:text-xl font-extrabold items-center justify-center transition-colors mb-5 shadow-sm"
        >
          Ligar para o SAMU · 192
        </a>

        {/* Blood & Allergies Cards */}
        <div className="flex gap-2.5 mb-3.5">
          <div className="flex-1 bg-[#fff5f4] border border-[#f0b8b2] rounded-2xl p-3.5">
            <div className="text-[11px] font-extrabold text-[#a13a30] tracking-[0.1em] uppercase">
              SANGUE
            </div>
            <div className="text-2xl sm:text-[30px] font-extrabold text-[#1d2a3d] mt-0.5">
              {bloodType}
            </div>
          </div>

          <div className="flex-[2] bg-[#fff5f4] border border-[#f0b8b2] rounded-2xl p-3.5">
            <div className="text-[11px] font-extrabold text-[#a13a30] tracking-[0.1em] uppercase">
              ALERGIAS
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#1d2a3d] mt-1.5 truncate">
              {allergies}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="text-sm font-bold mt-4.5 mb-1 text-[#1d2a3d]">
          Contato de emergência
        </div>

        <div className="flex gap-3.5 items-center py-3.5 border-t border-[#dde3ec]">
          <div className="w-12 h-12 rounded-2xl bg-[#f1f4f8] flex items-center justify-center shrink-0 text-[#1b3a60]">
            <User size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <b className="text-[17px] text-[#1d2a3d] block truncate">
              {emergencyContactName}
            </b>
            <div className="text-sm text-[#5a6a80]">
              {emergencyContactRelation} · {emergencyContactPhone}
            </div>
          </div>
          <a
            href={`tel:${emergencyContactPhone.replace(/\D/g, '')}`}
            className="min-h-[44px] px-4.5 rounded-xl bg-[#2f7a70] text-white font-bold text-sm inline-flex items-center hover:bg-[#26635b] transition-colors shrink-0"
          >
            Ligar
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
