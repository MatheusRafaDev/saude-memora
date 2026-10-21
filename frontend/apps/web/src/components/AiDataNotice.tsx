import { Sparkles } from 'lucide-react';

export function AiDataNotice() {
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-[#CFE0FF] bg-[#CFE0FF] px-4 py-3.5 text-sm leading-relaxed text-[#1C2438]"
    >
      <Sparkles size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-[#1D4ED8]" />
      <p className="m-0">
        Os dados extraídos por IA podem conter erros. Confira sempre com o documento original.
      </p>
    </aside>
  );
}
