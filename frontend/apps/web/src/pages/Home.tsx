import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  ClipboardList,
  FileText,
  Heart,
  Pill,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'wouter';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

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

function ProductPreview() {
  return (
    <div
      aria-label="Prévia ilustrativa da plataforma SaúdeMemora"
      className="relative mx-auto w-full max-w-[600px]"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/15 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-white shadow-[0_32px_90px_-38px_rgba(25,48,83,0.35)]">
        <div className="flex min-h-14 items-center justify-between border-b border-border/70 bg-white/90 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="brand-logo-animated h-7 w-7 object-contain" />
            <span className="text-xs font-bold text-foreground">SaúdeMemora</span>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold text-primary">Prévia ilustrativa</span>
        </div>

        <div className="grid min-h-[330px] sm:grid-cols-[145px_1fr]">
          <aside className="hidden border-r border-border/70 bg-slate-50/80 p-4 sm:block">
            <p className="mb-3 px-2 text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">Seu espaço</p>
            <div className="space-y-1.5 text-[11px]">
              <p className="flex items-center gap-2 rounded-xl bg-primary px-2.5 py-2.5 font-semibold text-white"><Activity size={13} /> Visão geral</p>
              <p className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-muted-foreground"><FileText size={13} /> Documentos</p>
              <p className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-muted-foreground"><ClipboardList size={13} /> Ficha médica</p>
            </div>
            <div className="mt-8 rounded-xl border border-primary/10 bg-white p-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary"><ShieldCheck size={14} /></div>
              <p className="mt-2 text-[10px] font-semibold text-foreground">Acesso protegido</p>
              <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Seu histórico em um espaço pessoal.</p>
            </div>
          </aside>

          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Seu espaço de saúde</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">Visão geral</h2>
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-medium text-muted-foreground">Tudo em ordem</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                { icon: FileText, label: 'Documentos', value: 'Seu histórico' },
                { icon: Activity, label: 'Exames', value: 'Resultados' },
                { icon: Pill, label: 'Medicamentos', value: 'Receitas' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-border/80 bg-white p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary"><Icon size={15} /></span>
                  <p className="mt-3 text-[10px] font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-border/80 bg-white">
              <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-3">
                <span className="text-[10px] font-bold text-foreground">Acesso rápido</span>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Sparkles size={15} /></span>
                <div>
                  <p className="text-[10px] font-semibold text-foreground">Organize um novo documento</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">Exames, receitas e outros registros</p>
                </div>
                <ArrowRight size={14} className="ml-auto text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background font-sans text-foreground">
      <PublicPageHeader />

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_15%,rgba(28,84,135,0.09),transparent_38%),radial-gradient(ellipse_at_88%_40%,rgba(20,125,128,0.08),transparent_34%)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[0.92fr_1.08fr] md:gap-10 md:py-24 lg:gap-16">
            <div className="page-enter">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm">
                <Heart size={13} className="fill-accent/15 text-accent" />
                Seu histórico de saúde, mais organizado
              </div>
              <h1 className="mt-6 max-w-xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[3.65rem]">
                Cuidar da sua saúde também é <span className="text-primary">ter sua história por perto.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-[17px]">
                Reúna exames, receitas e informações importantes em um espaço pessoal, para encontrar o que precisa com mais facilidade.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/entrar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Acessar plataforma <ArrowRight size={16} />
                </Link>
                <Link href="/recursos" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white/75 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white">
                  Conhecer os recursos
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-accent" /> Espaço pessoal</span>
                <span className="inline-flex items-center gap-1.5"><FileText size={14} className="text-accent" /> Seus documentos reunidos</span>
              </div>
            </div>
            <div className="slide-up"><ProductPreview /></div>
          </div>
        </section>

        <section id="recursos" className="scroll-mt-20 border-y border-border/70 bg-slate-50/70">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Tudo organizado em um só lugar</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Acesse suas informações de saúde com mais facilidade.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {resources.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/70">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 sm:py-16 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Conheça o projeto</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Tecnologia para deixar seu histórico mais acessível.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Entenda por que o SaúdeMemora foi criado e os princípios que orientam a plataforma.</p>
            </div>
            <Link href="/sobre" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              Conheça nossa história <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <PublicPageFooter />
    </div>
  );
}
