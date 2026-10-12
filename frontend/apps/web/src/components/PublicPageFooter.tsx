import { Link } from 'wouter';

export function PublicPageFooter({ variant = 'home' }: { variant?: 'home' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <footer className="border-t border-[#dde3ec] bg-[#f1f4f8] px-6 py-7 sm:px-12 text-[13px] text-[#5a6a80]">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Organização e acesso às suas informações de saúde.</span>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-[#1b3a60]">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#1b3a60]">Termos de uso</Link>
            <span>© {new Date().getFullYear()} SaúdeMemora</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-[#dde3ec] bg-[#f1f4f8] p-8 sm:p-12">
      <div className="mx-auto flex max-w-[1140px] flex-wrap justify-between gap-12 text-[#5a6a80]">
        <div className="max-w-[300px]">
          <div className="text-[18px] font-extrabold text-[#1d2a3d]">
            saúde<span className="font-semibold text-[#1f7fe0]">memora</span>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed">
            Organização e acesso às suas informações de saúde.
          </p>
        </div>

        <div>
          <b className="text-[14px] font-bold text-[#1d2a3d]">Produto</b>
          <div className="mt-2.5 text-[14px]">
            <Link href="/recursos" className="transition-colors hover:text-[#1b3a60]">Recursos</Link>
          </div>
          <div className="mt-2.5 text-[14px]">
            <Link href="/sobre" className="transition-colors hover:text-[#1b3a60]">Sobre</Link>
          </div>
        </div>

        <div>
          <b className="text-[14px] font-bold text-[#1d2a3d]">Legal</b>
          <div className="mt-2.5 text-[14px]">
            <Link href="/privacidade" className="transition-colors hover:text-[#1b3a60]">Privacidade</Link>
          </div>
          <div className="mt-2.5 text-[14px]">
            <Link href="/termos" className="transition-colors hover:text-[#1b3a60]">Termos de uso</Link>
          </div>
        </div>

        <div>
          <b className="text-[14px] font-bold text-[#1d2a3d]">Criador</b>
          <div className="mt-2.5 text-[14px] text-[#1d2a3d] font-semibold">Matheus Rafael</div>
          <div className="mt-2.5 flex items-center gap-2 text-[14px]">
            <a
              href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1b3a60]"
            >
              LinkedIn
            </a>
            <span>·</span>
            <a
              href="https://github.com/MatheusRafaDev"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1b3a60]"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1140px] border-t border-[#dde3ec] pt-5 text-[13px] text-[#5a6a80]">
        © {new Date().getFullYear()} SaúdeMemora
      </div>
    </footer>
  );
}
