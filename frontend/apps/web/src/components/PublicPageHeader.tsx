import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { BrandWordmark } from '@/components/BrandWordmark';

export function PublicPageHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const navigation = [
    { href: '/', label: 'Início' },
    { href: '/recursos', label: 'Recursos' },
    { href: '/sobre', label: 'Sobre' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#dde3ec] bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-6 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SaúdeMemora — início">
          <img src="/logo.png" alt="SaúdeMemora" className="h-9 w-9 object-contain flex-none" />
          <BrandWordmark className="text-[18px] tracking-[-0.03em] text-[#1d2a3d]" />
        </Link>

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

        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#1d2a3d] hover:bg-[#f1f4f8] md:hidden"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav aria-label="Navegação móvel" className="border-t border-[#dde3ec] bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navigation.map(({ href, label }) => {
              const isCurrent = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
                    isCurrent ? 'bg-[#f1f4f8] font-bold text-[#1b3a60]' : 'text-[#5a6a80] hover:bg-[#f1f4f8]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#dde3ec] pt-4">
              <Link
                href="/entrar"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-[#dde3ec] px-4 py-3 text-center text-[14px] font-semibold text-[#1d2a3d]"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-[#1b3a60] px-4 py-3 text-center text-[14px] font-bold text-white"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
