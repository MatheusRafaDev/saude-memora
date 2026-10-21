import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export function PublicPageHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { href: '/#como-funciona', label: 'Como funciona' },
    { href: '/#recursos', label: 'Recursos' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E3E8F0] bg-white/95 py-3 backdrop-blur-md sm:py-3.5">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 sm:px-8">
        {/* Logo Saúde Memora oficial */}
        <BrandLogo
          href="/"
          iconClassName="h-[36px] w-[36px] rounded-[10px] shadow-xs transition-transform group-hover:scale-105"
          wordmarkClassName="text-[19px] sm:text-[20px]"
        />

        {/* Menu de Navegação Desktop Limpo */}
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-2 text-[15px] lg:flex"
        >
          {navigation.map(({ href, label }) => {
            const isCurrent = location === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                className={`group relative px-4 py-2 transition-colors cursor-pointer ${
                  isCurrent
                    ? 'font-bold text-[#1D4ED8]'
                    : 'font-medium text-[#5B6878] hover:text-[#1D4ED8]'
                }`}
              >
                <span>{label}</span>
                {/* Linha discreta sob o item ativo / hover */}
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#1D4ED8] opacity-100'
                      : 'bg-[#1D4ED8] opacity-0 group-hover:opacity-100'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        {/* Botões Entrar e Criar conta (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/entrar"
            className="px-3.5 py-2 text-sm font-semibold text-[#14211F] transition-colors hover:text-[#1D4ED8]"
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            className="inline-flex h-11 min-h-11 items-center justify-center rounded-xl bg-[#1D4ED8] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1E40AF]"
          >
            Criar conta
          </Link>
        </div>

        {/* Ações Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/entrar"
            className="inline-flex h-11 min-h-11 items-center justify-center rounded-xl px-3 text-xs font-semibold text-[#14211F] transition-colors hover:bg-[#F4F7FC]"
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E3E8F0] bg-white text-[#14211F] transition-colors hover:bg-[#F4F7FC]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Gaveta do Menu Mobile Limpa */}
      {mobileMenuOpen && (
        <div className="mx-4 mt-3 rounded-2xl border border-[#E3E8F0] bg-white p-5 shadow-md lg:hidden animate-in fade-in slide-in-from-top-3 max-h-[calc(100dvh-90px)] overflow-y-auto">
          <div className="flex flex-col gap-1 text-base font-semibold">
            {navigation.map(({ href, label }) => {
              const isCurrent = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`flex items-center justify-between py-2.5 px-2 border-b transition-colors cursor-pointer ${
                    isCurrent
                      ? 'font-bold text-[#1D4ED8] border-[#1D4ED8]'
                      : 'font-medium text-[#5B6878] border-[#E3E8F0] hover:text-[#1D4ED8]'
                  }`}
                >
                  <span>{label}</span>
                  {isCurrent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8]" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2.5 border-t border-[#E3E8F0] pt-4">
            <Link
              href="/entrar"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-[#14211F] text-sm font-semibold text-[#14211F] transition-colors hover:bg-[#F4F7FC]"
            >
              Entrar
            </Link>
            <Link
              href="/criar-conta"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-[#1D4ED8] text-sm font-bold text-white transition-colors hover:bg-[#1E40AF]"
            >
              Criar conta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
