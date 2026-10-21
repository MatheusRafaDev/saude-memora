import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { BrandWordmark } from '@/components/BrandWordmark';

type PublicPageHeaderProps = {
  variant?: 'blue' | 'light';
};

export function PublicPageHeader({ variant = 'blue' }: PublicPageHeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { href: '/#inicio', label: 'Início' },
    { href: '/#recursos', label: 'Recursos' },
    { href: '/#como-funciona', label: 'Como funciona' },
    { href: '/#duvidas', label: 'Dúvidas' },
    { href: '/sobre', label: 'Sobre' },
  ];

  const isBlue = variant === 'blue';

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors ${
        isBlue
          ? 'bg-[#2357D9] text-white shadow-xs'
          : 'bg-white/95 text-[#14211F] border-b border-[#E3E8F0] backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-20 sm:h-24 max-w-[1376px] items-center justify-between px-6 sm:px-8">
        {/* Logo Saúde Memora oficial */}
        <Link href="/" aria-label="Saúde Memora — início" className="transition-opacity hover:opacity-95">
          <BrandWordmark height={26} variant={isBlue ? 'white' : 'default'} />
        </Link>

        {/* Menu de Navegação Desktop */}
        <nav
          aria-label="Navegação principal"
          className={`hidden items-center gap-7 text-[14px] md:flex ${
            isBlue ? 'text-white/85 font-medium' : 'text-[#5B6878] font-medium'
          }`}
        >
          {navigation.map(({ href, label }) => {
            const isCurrent = location === href || (href.startsWith('/#') && location === '/' && window.location.hash === href.replace('/', ''));
            return (
              <a
                key={href}
                href={href}
                className={`transition-colors cursor-pointer ${
                  isBlue
                    ? isCurrent
                      ? 'text-white font-semibold'
                      : 'hover:text-white'
                    : isCurrent
                      ? 'text-[#2357D9] font-bold'
                      : 'hover:text-[#2357D9]'
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Botões Entrar e Criar conta (Desktop) */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/entrar"
            className={`text-sm font-bold transition-opacity hover:opacity-90 ${
              isBlue ? 'text-white' : 'text-[#14211F] hover:text-[#2357D9]'
            }`}
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            className={`inline-flex h-11 items-center justify-center rounded-[22px] px-6 text-[15px] font-medium transition-all ${
              isBlue
                ? 'bg-white text-[#2357D9] hover:bg-white/95 shadow-sm active:translate-y-0.5'
                : 'bg-[#2357D9] text-white hover:bg-[#1E40AF] shadow-sm active:translate-y-0.5'
            }`}
          >
            Criar conta
          </Link>
        </div>

        {/* Ações Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/entrar"
            className={`text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
              isBlue ? 'text-white hover:bg-white/10' : 'text-[#14211F] hover:bg-slate-100'
            }`}
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isBlue
                ? 'text-white bg-white/15 hover:bg-white/25'
                : 'border border-[#E3E8F0] bg-white text-[#14211F] hover:bg-[#F4F7FC]'
            }`}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Gaveta do Menu Mobile */}
      {mobileMenuOpen && (
        <div className="mx-4 mb-4 rounded-2xl border border-[#DFE7EF] bg-white text-[#173754] p-5 shadow-xl md:hidden animate-in fade-in slide-in-from-top-3">
          <div className="flex flex-col gap-1 text-base font-semibold">
            {navigation.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-2 border-b border-[#EEF3FA] text-[#536C80] hover:text-[#2357D9] transition-colors cursor-pointer"
              >
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2.5 pt-2">
            <Link
              href="/entrar"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-[#D8E1EC] text-sm font-semibold text-[#18324B] transition-colors hover:bg-[#F7F9FC]"
            >
              Entrar
            </Link>
            <Link
              href="/criar-conta"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-[#2357D9] text-sm font-bold text-white transition-colors hover:bg-[#1E40AF]"
            >
              Criar conta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
