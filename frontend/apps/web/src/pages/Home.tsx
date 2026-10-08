import { useState, type MouseEvent } from 'react';
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FileText,
  Github,
  Linkedin,
  Menu,
  Pill,
  X,
} from 'lucide-react';
import { Link } from 'wouter';

const resources = [
  {
    icon: Activity,
    title: 'Exames',
    description: 'Organize exames e consulte os resultados registrados.',
  },
  {
    icon: Pill,
    title: 'Medicamentos',
    description: 'Consulte os medicamentos identificados nas suas receitas.',
  },
  {
    icon: FileText,
    title: 'Documentos',
    description: 'Acesse receitas, laudos, atestados e outros documentos.',
  },
  {
    icon: ClipboardList,
    title: 'Histórico de saúde',
    description: 'Mantenha suas informações importantes reunidas.',
  },
];

const navigation = [
  { href: '/', label: 'Início' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#sobre', label: 'Sobre' },
];

function Brand({ animate = false }: { animate?: boolean }) {
  return (
    <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="SaúdeMemora — início">
      <img src="/logo.png" alt="" className={`h-9 w-9 object-contain${animate ? ' home-logo-arrival' : ''}`} />
      <span className="text-[15px] font-bold tracking-tight text-foreground">
        Saúde<span className="text-accent">Memora</span>
      </span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div
      aria-label="Prévia da plataforma SaúdeMemora"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-soft"
    >
      <div className="flex min-h-12 items-center justify-between border-b border-border px-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
          <span className="text-xs font-semibold text-foreground">SaúdeMemora</span>
        </div>
        <span className="text-[11px] text-muted-foreground">Visão geral</span>
      </div>

      <div className="grid min-h-[290px] sm:grid-cols-[132px_1fr]">
        <aside className="hidden border-r border-border bg-muted/50 p-3 sm:block">
          <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          <div className="space-y-1 text-[11px]">
            <p className="rounded-md bg-secondary px-2 py-2 font-medium text-primary">Visão geral</p>
            <p className="px-2 py-2 text-muted-foreground">Documentos</p>
            <p className="px-2 py-2 text-muted-foreground">Ficha médica</p>
          </div>
        </aside>

        <div className="p-4 sm:p-5">
          <p className="text-[10px] font-medium text-muted-foreground">Sua área de saúde</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Informações organizadas</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Exames, medicamentos e documentos reunidos em um só lugar.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['Exames', 'Medicamentos', 'Documentos'].map((item) => (
              <div key={item} className="flex min-h-16 items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2">
                <span className="h-7 w-1 rounded-full bg-primary/70" aria-hidden="true" />
                <span className="text-[11px] font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-border">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-[11px] font-semibold text-foreground">Documentos recentes</span>
              <span className="text-[10px] text-muted-foreground">Sua biblioteca</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-4">
              <FileText size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-[10px] leading-4 text-muted-foreground">
                Seus documentos de saúde ficam disponíveis nesta área.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigateToSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    event.preventDefault();
    const section = document.getElementById(href.slice(1));
    if (!section) return;
    window.history.replaceState(null, '', href);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand animate />

          <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
            {navigation.map(({ href, label }) => (
              <a key={label} href={href} onClick={(event) => navigateToSection(event, href)} className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">
                {label}
              </a>
            ))}
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
            className="flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav aria-label="Navegação móvel" className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {navigation.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(event) => {
                    setMobileMenuOpen(false);
                    navigateToSection(event, href);
                  }}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Link href="/entrar" onClick={() => setMobileMenuOpen(false)} className="rounded-md border border-border px-3 py-2.5 text-center text-sm font-semibold text-foreground">
                  Entrar
                </Link>
                <Link href="/entrar" onClick={() => setMobileMenuOpen(false)} className="rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground">
                  Criar conta
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[0.9fr_1.1fr] md:gap-12 md:py-20 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Organização da sua saúde</p>
            <h1 className="mt-4 max-w-xl text-balance text-4xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-5xl">
              Suas informações de saúde em um só lugar.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Organize exames, medicamentos, documentos e histórico de saúde de forma simples e segura.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/entrar" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Acessar plataforma <ArrowRight size={16} />
              </Link>
              <a href="#recursos" onClick={(event) => navigateToSection(event, '#recursos')} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                Conhecer a plataforma
              </a>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section id="recursos" className="scroll-mt-20 border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Tudo organizado em um só lugar</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Acesse suas informações de saúde com mais facilidade.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {resources.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-md border border-border bg-card p-5">
                  <Icon size={19} strokeWidth={1.8} className="text-accent" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Sobre</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Um projeto para organizar informações de saúde.</h2>
            </div>
            <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <h3 className="text-sm font-semibold text-foreground">SaúdeMemora</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A plataforma reúne documentos e informações de saúde para ajudar você a consultar seu histórico quando precisar.
                  Ela apoia a organização dos registros e não substitui a avaliação ou a orientação de profissionais de saúde.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Sobre o criador</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sou Matheus Rafael, criador do SaúdeMemora. Desenvolvi este projeto com o propósito de facilitar a organização
                  e o acesso às informações de saúde no dia a dia.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Linkedin size={15} aria-hidden="true" />
                    LinkedIn
                  </a>
                  <a
                    href="https://github.com/MatheusRafaDev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Github size={15} aria-hidden="true" />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Brand />
            <p className="mt-2 text-xs text-muted-foreground">Organização e acesso às suas informações de saúde.</p>
            <p className="mt-1 text-xs text-muted-foreground">Criado por Matheus Rafael.</p>
          </div>
          <nav aria-label="Links institucionais" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            <a href="#recursos" onClick={(event) => navigateToSection(event, '#recursos')} className="hover:text-primary">Recursos</a>
            <a href="#sobre" onClick={(event) => navigateToSection(event, '#sobre')} className="hover:text-primary">Sobre</a>
            <Link href="/privacidade" className="hover:text-primary">Privacidade</Link>
            <Link href="/termos" className="hover:text-primary">Termos de uso</Link>
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn de Matheus Rafael"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <Linkedin size={17} />
            </a>
            <a
              href="https://github.com/MatheusRafaDev"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub de Matheus Rafael"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <Github size={17} />
            </a>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SaúdeMemora</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
