import { Link } from 'wouter';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';

export function PublicPageHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 md:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SaúdeMemora — início">
          <LourdesHeartMark className="h-8 w-8" />
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Saúde<span className="text-accent">Memora</span>
          </span>
        </Link>
        <nav aria-label="Navegação institucional" className="flex items-center gap-2">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Início
          </Link>
          <Link href="/entrar" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
