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
    <header className="sticky top-0 z-40 w-full border-b border-[#E3E8F0] bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-6 sm:px-12">
        <BrandLogo
          iconClassName="h-9 w-9 transition-transform group-hover:scale-105"
          wordmarkClassName="text-[20px] text-[#14211F]"
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
                    ? 'font-bold text-[#1D4ED8]'
                    : 'font-medium text-[#5B6878] hover:text-[#1D4ED8]'
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
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-[15px] font-semibold text-[#14211F] transition-colors hover:bg-[#F4F7FC]"
          >
            Entrar
          </Link>
          <Link
            href="/entrar?mode=register"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1D4ED8] px-5 py-2 text-[15px] font-bold text-white transition-all hover:bg-[#1E40AF] active:bg-[#1E3A8A] shadow-xs"
          >
            Criar conta
          </Link>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <Link href="/entrar" className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold text-[#14211F] hover:bg-[#F4F7FC]">
            Entrar
          </Link>
          <Link href="/entrar?mode=register" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#1D4ED8] px-3.5 py-1.5 text-sm font-bold text-white hover:bg-[#1E40AF]">
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
