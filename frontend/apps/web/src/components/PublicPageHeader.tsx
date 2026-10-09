import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';

function preloadPublicRoute(href: string) {
  switch (href) {
    case '/recursos':
      void import('@/pages/Recursos');
      break;
    case '/sobre':
      void import('@/pages/Sobre');
      break;
    case '/entrar':
      void import('@/pages/Auth');
      break;
  }
}

export function PublicPageHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const navigation = [
    { href: '/', label: 'Início' },
    { href: '/recursos', label: 'Recursos' },
    { href: '/sobre', label: 'Sobre' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 md:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SaúdeMemora — início">
          <img src="/logo.png" alt="" className="brand-logo-animated h-9 w-9 object-contain" />
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Saúde<span className="text-accent">Memora</span>
          </span>
        </Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {navigation.map(({ href, label }) => {
            const isCurrent = location === href;
            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => preloadPublicRoute(href)}
                onFocus={() => preloadPublicRoute(href)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`relative py-2 text-[13px] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform ${isCurrent ? 'text-primary after:scale-x-100' : 'text-muted-foreground after:scale-x-0 hover:text-primary hover:after:scale-x-100'}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/entrar" onMouseEnter={() => preloadPublicRoute('/entrar')} onFocus={() => preloadPublicRoute('/entrar')} className="rounded-md px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted">
            Entrar
          </Link>
          <Link href="/entrar" onMouseEnter={() => preloadPublicRoute('/entrar')} onFocus={() => preloadPublicRoute('/entrar')} className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Criar conta
          </Link>
        </div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileMenuOpen && (
        <nav aria-label="Navegação móvel" className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {navigation.map(({ href, label }) => {
              const isCurrent = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onTouchStart={() => preloadPublicRoute(href)}
                  onFocus={() => preloadPublicRoute(href)}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`rounded-md px-3 py-3 text-sm font-medium transition-colors ${isCurrent ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                >
                  {label}
                </Link>
              );
            })}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <Link href="/entrar" onClick={() => setMobileMenuOpen(false)} className="rounded-md border border-border px-3 py-3 text-center text-sm font-semibold text-foreground">Entrar</Link>
              <Link href="/entrar" onClick={() => setMobileMenuOpen(false)} className="rounded-md bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground">Criar conta</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
