import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface PublicPageCtaProps {
  variant?: 'home' | 'compact';
}

export function PublicPageCta({ variant = 'compact' }: PublicPageCtaProps) {
  const isHome = variant === 'home';

  return (
    <section className={`mx-auto max-w-[1140px] px-4 pb-16 sm:px-6 sm:pb-24 ${isHome ? 'md:min-h-[408px]' : 'md:min-h-[289px]'}`}>
      <div className={`flex ${isHome ? 'min-h-[240px] sm:py-12' : 'min-h-[193px] md:py-7'} flex-col gap-7 rounded-[2rem] bg-primary px-7 py-10 text-primary-foreground sm:px-10 sm:py-12 md:flex-row md:items-center md:justify-between md:px-14`}>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Seu espaço de saúde</p>
          <h2 className="mt-2 max-w-[470px] text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Comece a reunir sua história de saúde.</h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Crie sua conta em poucos minutos e adicione seu primeiro documento.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/cadastro"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
          >
            Criar conta <ArrowRight size={16} />
          </Link>
          <Link
            href="/entrar"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </section>
  );
}
