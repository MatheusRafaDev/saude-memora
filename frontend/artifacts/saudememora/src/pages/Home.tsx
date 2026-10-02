import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  FileText,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Activity,
} from 'lucide-react';
import { Link } from 'wouter';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';

const documentRows = [
  { name: 'Hemograma completo',          detail: 'Dra. Helena Prado · 18 mar 2024',    tone: 'blue',  status: 'Processado' },
  { name: 'Receita — vitamina D',         detail: 'Dr. Rafael Nunes · 03 abr 2024',     tone: 'slate', status: 'Processado' },
  { name: 'Ultrassonografia abdominal',   detail: 'Dra. Camila Valença · 26 fev 2024',  tone: 'soft',  status: 'Revisar'    },
];

const features = [
  { icon: UploadCloud,    number: '01', title: 'Você envia',      description: 'Adicione uma foto ou arquivo do seu exame, receita ou relatório médico.' },
  { icon: Sparkles,       number: '02', title: 'Nós organizamos', description: 'A IA reconhece as informações e categoriza tudo automaticamente.' },
  { icon: HeartHandshake, number: '03', title: 'Você entende',    description: 'Tenha seu histórico ao alcance para cuidar melhor das suas decisões de saúde.' },
];

const values = [
  { icon: ShieldCheck,    title: 'Privacidade em primeiro lugar', description: 'Um espaço pensado para informações que pedem respeito e cuidado.' },
  { icon: LockKeyhole,    title: 'Tudo em um só lugar',           description: 'Exames, receitas e laudos organizados para você encontrar o que importa.' },
  { icon: FileText,       title: 'Clareza para conversar',        description: 'Chegue à consulta com contexto — sem perder tempo procurando documentos.' },
  { icon: HeartHandshake, title: 'Feito para pessoas',            description: 'Uma experiência serena para cuidar da sua história ao longo do tempo.' },
];

export default function Home() {
  return (
    <div className="app-noise min-h-[100dvh] overflow-hidden bg-background text-foreground">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 md:px-8 md:py-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SaúdeMemora início">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.2)]">
            <LourdesHeartMark className="h-7 w-7" strokeWidth={1.7} />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-[-0.055em]">
              saúde<span className="text-accent">memora</span>
            </span>
            <span className="block font-mono text-[8px] uppercase tracking-[.2em] text-muted-foreground/70">
              seu histórico, claro
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-[12px] font-medium text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">Como funciona</a>
          <a href="#cuidado"       className="transition-colors hover:text-foreground">Privacidade</a>
          <Link
            href="/entrar"
            className="flex items-center gap-1.5 rounded-xl bg-primary/8 px-4 py-2 font-semibold text-primary transition-all hover:bg-primary hover:text-white"
          >
            Entrar <ArrowUpRight size={13} />
          </Link>
        </nav>

        <Link
          href="/entrar"
          className="rounded-xl bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.18)] transition-all hover:-translate-y-0.5 md:hidden"
        >
          Entrar
        </Link>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-5 pb-20 pt-12 md:grid-cols-[1fr_1fr] md:px-8 md:pb-28 md:pt-20">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          {/* Left: copy */}
          <div className="relative page-enter">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.15em] text-accent shadow-xs">
              <Sparkles size={11} />
              Uma nova relação com sua saúde
            </div>

            <h1 className="max-w-[520px] text-[clamp(38px,5.5vw,68px)] font-black leading-[.96] tracking-[-0.06em] text-foreground">
              Sua história de saúde,{' '}
              <span className="text-primary">guardada com clareza.</span>
            </h1>

            <p className="mt-6 max-w-[460px] text-[15px] leading-[1.75] text-muted-foreground">
              O SaúdeMemora organiza seus exames, receitas e relatórios em um espaço pessoal, seguro e fácil de entender — para você chegar mais preparado a cada consulta.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/entrar"
                className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_24px_hsl(var(--primary)/.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_hsl(var(--primary)/.28)]"
              >
                Criar meu espaço
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#como-funciona"
                className="flex h-11 items-center justify-center rounded-xl border border-border bg-card/80 px-5 text-[13px] font-semibold text-foreground/70 transition-all hover:bg-muted hover:text-foreground"
              >
                Conhecer o sistema
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 text-[11px] text-muted-foreground/80">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-accent/80" /> Privacidade em primeiro lugar</span>
              <span className="flex items-center gap-1.5"><LockKeyhole size={12} className="text-accent/80" /> Feito para pessoas</span>
            </div>
          </div>

          {/* Right: UI preview */}
          <div className="relative mx-auto w-full max-w-[520px] page-enter stagger-2">
            {/* Glow */}
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

            {/* Card shell */}
            <div className="relative rounded-[22px] border border-border/70 bg-card shadow-[0_28px_70px_hsl(var(--primary)/.12)] backdrop-blur-xl p-2.5">
              <div className="overflow-hidden rounded-[16px] border border-border/60 bg-background">
                {/* Mini header */}
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-accent">
                      <LourdesHeartMark className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">visão geral</span>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-[9px] font-bold text-primary">MC</span>
                </div>

                <div className="p-4 md:p-5">
                  {/* Greeting */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[.16em] text-accent mb-1">seu resumo</p>
                      <h2 className="text-xl font-bold tracking-[-0.04em] text-primary">Olá, Marina.</h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Seu histórico, pronto quando você precisar.</p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-accent">
                      <Activity size={15} />
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-1.5 mb-4">
                    {[
                      { n: '06', label: 'documentos' },
                      { n: '02', label: 'receitas'   },
                      { n: '01', label: 'revisão'    },
                    ].map(({ n, label }) => (
                      <div key={label} className="rounded-xl border border-border bg-card p-2.5 text-center">
                        <p className="text-lg font-bold text-primary leading-none">{n}</p>
                        <p className="mt-1 text-[9px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Docs list */}
                  <div className="rounded-xl border border-border bg-card p-3">
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">últimos documentos</p>
                      <span className="text-[9px] font-semibold text-accent">ver todos</span>
                    </div>
                    <div className="space-y-1.5">
                      {documentRows.map((doc) => (
                        <div key={doc.name} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/60 px-2.5 py-2">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            doc.tone === 'blue'  ? 'bg-secondary text-accent' :
                            doc.tone === 'slate' ? 'bg-muted text-primary'   :
                                                   'bg-muted/50 text-accent/70'
                          }`}>
                            <FileText size={13} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-semibold text-foreground">{doc.name}</p>
                            <p className="truncate text-[9px] text-muted-foreground mt-0.5">{doc.detail}</p>
                          </div>
                          <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[8px] font-semibold sm:block ${
                            doc.status === 'Revisar'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {doc.status}
                          </span>
                          <ChevronRight size={12} className="text-muted-foreground/60" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload CTA */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-primary px-3.5 py-2.5 text-primary-foreground">
                    <div className="flex items-center gap-2.5">
                      <UploadCloud size={15} />
                      <div>
                        <p className="text-[10px] font-semibold">Adicionar documento</p>
                        <p className="text-[9px] text-primary-foreground/60 mt-0.5">Exame, receita ou relatório</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="opacity-70" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-4 hidden items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-lift sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <Check size={13} />
              </span>
              <div>
                <p className="text-[10px] font-semibold text-foreground">Tudo organizado</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Histórico em dia</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como funciona ─────────────────────────────────────────────── */}
        <section id="como-funciona" className="border-y border-border/60 bg-card/40">
          <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
            <div className="max-w-[480px] mb-10">
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent mb-3">como funciona</p>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-foreground md:text-4xl">
                Menos procura.<br />Mais contexto.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                O sistema transforma arquivos soltos em uma memória de saúde que acompanha você.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {features.map(({ number, icon: Icon, title, description }) => (
                <article
                  key={number}
                  className="group rounded-2xl border border-border/70 bg-background p-5 transition-all duration-250 hover:-translate-y-1 hover:border-border hover:shadow-lift"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-[10px] tracking-[.18em] text-muted-foreground/60">{number}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-accent transition-all duration-250 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon size={17} />
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Valores ───────────────────────────────────────────────────── */}
        <section id="cuidado" className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 md:grid-cols-[.75fr_1.25fr] md:px-8 md:py-24">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.18)]">
              <LourdesHeartMark className="h-8 w-8" strokeWidth={1.5} />
            </span>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[.2em] text-accent mb-3">feito com cuidado</p>
            <h2 className="max-w-[340px] text-3xl font-black leading-tight tracking-[-0.05em] text-foreground md:text-4xl">
              Sua saúde merece uma casa.
            </h2>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground max-w-[300px]">
              Construímos o SaúdeMemora com cuidado e respeito pela intimidade das informações de saúde.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border/70 bg-card/60 p-4.5 transition-all hover:border-border hover:shadow-soft"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-accent mb-3">
                  <Icon size={16} />
                </span>
                <h3 className="text-[13px] font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA final ─────────────────────────────────────────────────── */}
        <section className="mx-4 mb-10 overflow-hidden rounded-2xl bg-primary md:mx-auto md:max-w-[1200px] md:mx-8">
          <div className="relative px-7 py-12 md:px-14 md:py-16">
            {/* Decorative rings */}
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/8 pointer-events-none" />
            <div className="absolute right-20 -bottom-28 h-72 w-72 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            <div className="relative max-w-[580px]">
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary-foreground/50 mb-4">comece por você</p>
              <h2 className="text-3xl font-black tracking-[-0.05em] text-primary-foreground leading-tight md:text-5xl">
                Quando a sua história está organizada, tudo fica mais claro.
              </h2>
              <Link
                href="/entrar"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-semibold text-primary shadow-[0_8px_20px_rgba(0,0,0,.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,.2)]"
              >
                Criar meu espaço <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-6 text-[10px] text-muted-foreground/60 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex items-center gap-2">
          <LourdesHeartMark className="h-4 w-4 text-accent/60" strokeWidth={1.5} />
          <span>saúde<span className="font-semibold text-muted-foreground">memora</span></span>
        </div>
        <span>Seu histórico, claro.</span>
      </footer>
    </div>
  );
}
