import { Link } from 'wouter';
import { BrandWordmark } from '@/components/BrandWordmark';

export function PublicPageFooter() {
  return (
    <footer className="w-full bg-white">
      <div className="mx-auto max-w-[1312px] px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-8">
          <div>
            <Link href="/" aria-label="Saúde Memora — início">
              <BrandWordmark height={24} />
            </Link>
            <p className="mt-5 max-w-[30ch] text-[15px] leading-relaxed text-[#536C80]">
              Um lugar para guardar os documentos que contam a sua história de saúde.
            </p>
          </div>

          <div>
            <div className="mb-3.5 text-[14px] font-semibold text-[#173754]">
              Produto
            </div>
            <div className="flex flex-col gap-2.5 text-[14px] text-[#536C80]">
              <a href="/#recursos" className="transition-colors hover:text-[#2357D9]">
                Recursos
              </a>
              <a href="/#como-funciona" className="transition-colors hover:text-[#2357D9]">
                Como funciona
              </a>
              <a href="/#duvidas" className="transition-colors hover:text-[#2357D9]">
                Dúvidas
              </a>
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-[14px] font-semibold text-[#173754]">
              Legal
            </div>
            <div className="flex flex-col gap-2.5 text-[14px] text-[#536C80]">
              <Link href="/privacidade" className="transition-colors hover:text-[#2357D9]">
                Privacidade
              </Link>
              <Link href="/termos" className="transition-colors hover:text-[#2357D9]">
                Termos de uso
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-[14px] font-semibold text-[#173754]">
              Criador
            </div>
            <div className="flex flex-col gap-2.5 text-[14px] text-[#536C80]">
              <span className="text-[#173754] font-medium">Matheus Rafael</span>
              <a
                href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[#2357D9]"
              >
                LinkedIn ↗
              </a>
              <a
                href="https://github.com/MatheusRafaDev"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[#2357D9]"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </div>

        {/* Linha divisória e créditos */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#DFE7EF] pt-8 text-[13px] text-[#536C80] sm:flex-row">
          <span>© 2026 Saúde Memora. Todos os direitos reservados.</span>
          <span className="inline-flex items-center">
            <span
              className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#E88773]"
              aria-hidden="true"
            />
            Feito para acompanhar você.
          </span>
        </div>
      </div>
    </footer>
  );
}
