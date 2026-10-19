import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export function PublicPageHeader() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { href: '/', label: 'Início' },
    { href: '/sobre', label: 'Sobre' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#193B9E]/90 backdrop-blur-md border-b border-white/10 py-3 sm:py-3.5'
          : 'bg-transparent border-b border-transparent py-4 sm:py-5'
      }`}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 sm:px-8">
        {/* Logo Saúde Memora oficial */}
        <BrandLogo
          href="/"
          variant="white"
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
                    ? 'font-bold text-white'
                    : 'font-medium text-white/80 hover:text-white'
                }`}
              >
                <span>{label}</span>
                {/* Linha discreta sob o item ativo / hover */}
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-all duration-200 ${
                    isCurrent
                      ? 'bg-white opacity-100 shadow-xs'
                      : 'bg-white/60 opacity-0 group-hover:opacity-100'
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
            className="px-3.5 py-2 text-sm font-semibold text-white/90 transition-colors hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/entrar?mode=register"
            className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-[#193B9E] shadow-xs transition-all hover:bg-[#F8FAFD] hover:shadow-sm active:translate-y-0"
          >
            Criar conta
          </Link>
        </div>

        {/* Ações Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/entrar"
            className="inline-flex h-8 items-center justify-center rounded-full bg-white/15 px-3 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/25"
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-xs transition-colors hover:bg-white/20"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Gaveta do Menu Mobile Limpa */}
      {mobileMenuOpen && (
        <div className="mx-4 mt-3 rounded-2xl border border-white/15 bg-[#193B9E]/95 p-5 shadow-xl backdrop-blur-xl lg:hidden animate-in fade-in slide-in-from-top-3 max-h-[calc(100dvh-90px)] overflow-y-auto">
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
                      ? 'font-bold text-white border-white'
                      : 'font-medium text-white/80 border-white/10 hover:text-white'
                  }`}
                >
                  <span>{label}</span>
                  {isCurrent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/entrar"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-full border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/entrar?mode=register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-bold text-[#193B9E] shadow-sm transition-all hover:bg-[#F8FAFD]"
            >
              Criar conta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
