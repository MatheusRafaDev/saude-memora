import { Link } from 'wouter';
import { BrandLogo } from '@/components/BrandLogo';

export function PublicPageFooter() {
  return (
    <footer className="border-t border-[#dde3ec] bg-[#f1f4f8] px-6 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 text-[#5a6a80] sm:gap-x-8 lg:grid-cols-[44%_21%_24%_11%] lg:gap-x-0 lg:gap-y-0">
        <div className="col-span-2 max-w-[320px] lg:col-span-1">
          <BrandLogo
            iconClassName="h-8 w-8 transition-transform group-hover:scale-105"
            wordmarkClassName="text-[18px] text-[#1d2a3d]"
          />
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

        <div className="col-span-2 lg:col-span-1">
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

      <div className="mx-auto mt-8 max-w-[1200px] border-t border-[#dde3ec] pt-5 text-[13px] text-[#5a6a80]">
        © {new Date().getFullYear()} SaúdeMemora
      </div>
    </footer>
  );
}
