import { Link, useLocation } from 'wouter';
import { BrandLogo } from '@/components/BrandLogo';

export function PublicPageHeader() {
  const [location] = useLocation();
  const navigation = [
    { href: '/', label: 'Início' },
    { href: '/recursos', label: 'Recursos' },
    { href: '/sobre', label: 'Sobre' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#dde3ec] bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-6 sm:px-12">
        <BrandLogo
          iconClassName="h-9 w-9 transition-transform group-hover:scale-105"
          wordmarkClassName="text-[19px] tracking-[-0.03em] text-[#1d2a3d]"
        />

        <nav aria-label="Navegação principal" className="hidden items-center gap-9 md:flex">
          {navigation.map(({ href, label }) => {
            const isCurrent = location === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                className={`text-[15px] transition-colors ${
                  isCurrent
                    ? 'font-bold text-[#1b3a60]'
                    : 'font-medium text-[#5a6a80] hover:text-[#1b3a60]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/entrar"
            className="rounded-xl px-4 py-3 text-[15px] font-semibold text-[#1d2a3d] transition-colors hover:bg-[#f1f4f8]"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-xl bg-[#1b3a60] px-5 py-3 text-[15px] font-bold text-white transition-all hover:bg-[#244d7e]"
          >
            Criar conta
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Link href="/entrar" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-[#1d2a3d]">
            Entrar
          </Link>
          <Link href="/cadastro" className="rounded-lg bg-[#1b3a60] px-3 py-2 text-sm font-bold text-white">
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
