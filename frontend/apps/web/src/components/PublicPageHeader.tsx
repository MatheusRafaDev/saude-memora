import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'wouter';

export function PublicPageHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link href="/" className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">Início</Link>
          <Link href="/recursos" className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">Recursos</Link>
          <Link href="/sobre" className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">Sobre</Link>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/entrar" className="rounded-md px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted">
            Entrar
          </Link>
          <Link href="/entrar" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
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
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">Início</Link>
            <Link href="/recursos" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">Recursos</Link>
            <Link href="/sobre" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">Sobre</Link>
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
