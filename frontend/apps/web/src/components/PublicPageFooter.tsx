import { Link } from 'wouter';
import { BrandLogo } from '@/components/BrandLogo';

export function PublicPageFooter() {
  return (
    <footer className="border-t border-[#E3E8F0] bg-white px-6 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 text-[#5B6878] sm:gap-x-8 lg:grid-cols-[44%_21%_24%_11%] lg:gap-x-0 lg:gap-y-0">
        <div className="col-span-2 max-w-[340px] lg:col-span-1">
          <BrandLogo
            iconClassName="h-8 w-8 transition-transform group-hover:scale-105"
            wordmarkClassName="text-[19px] text-[#14211F]"
          />
          <p className="mt-3 text-[14px] leading-relaxed text-[#5B6878]">
            Seu histórico de saúde, sempre à mão. Organize exames, receitas e laudos em um espaço pessoal.
          </p>
        </div>

        <div>
          <b className="text-[14px] font-bold text-[#14211F]">Produto</b>
          <div className="mt-2.5 text-[14px]">
            <Link href="/#recursos" className="transition-colors hover:text-[#1D4ED8]">Recursos</Link>
          </div>
          <div className="mt-2.5 text-[14px]">
            <Link href="/sobre" className="transition-colors hover:text-[#1D4ED8]">Sobre</Link>
          </div>
        </div>

        <div>
          <b className="text-[14px] font-bold text-[#14211F]">Legal</b>
          <div className="mt-2.5 text-[14px]">
            <Link href="/privacidade" className="transition-colors hover:text-[#1D4ED8]">Privacidade</Link>
          </div>
          <div className="mt-2.5 text-[14px]">
            <Link href="/termos" className="transition-colors hover:text-[#1D4ED8]">Termos de uso</Link>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1">
          <b className="text-[14px] font-bold text-[#14211F]">Criador</b>
          <div className="mt-2.5 text-[14px] text-[#14211F] font-semibold">Matheus Rafael</div>
          <div className="mt-2.5 flex items-center gap-2 text-[14px]">
            <a
              href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1D4ED8]"
            >
              LinkedIn
            </a>
            <span>·</span>
            <a
              href="https://github.com/MatheusRafaDev"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1D4ED8]"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1200px] border-t border-[#E3E8F0] pt-5 text-[13px] leading-relaxed text-[#5B6878]">
        <p className="mb-2">
          Os dados extraídos podem conter erros e devem ser conferidos pelo usuário e por profissionais de saúde. Este serviço não faz diagnóstico nem aconselhamento médico.
        </p>
        <div>
          © {new Date().getFullYear()} Saúde Memora. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
