import { useState } from 'react';
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
  Users,
  LayoutDashboard,
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

function HeroVisual() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'family'>('assistant');

  return (
    <div
      aria-label="Apresentação visual da plataforma SaúdeMemora"
      className="relative mx-auto w-full max-w-[620px]"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" aria-hidden="true" />
      
      <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-white/95 shadow-[0_32px_90px_-38px_rgba(25,48,83,0.35)] backdrop-blur-sm">
        {/* Switcher Bar */}
        <div className="flex items-center justify-between border-b border-border/70 bg-slate-50/80 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="brand-logo-animated h-6 w-6 object-contain" />
            <span className="text-xs font-bold text-foreground">SaúdeMemora</span>
          </div>

          <div className="flex items-center rounded-xl bg-white p-1 shadow-xs border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold transition-all ${
                activeTab === 'assistant'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles size={12} />
              <span>Atendimento</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('family')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold transition-all ${
                activeTab === 'family'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users size={12} />
              <span>Família</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Atendimento Illustration */}
        {activeTab === 'assistant' && (
          <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 to-white p-3 sm:p-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-white shadow-inner group">
              <img
                src="/hero-health-illustration.jpg?v=clean3"
                alt="Ilustração do atendimento e cuidado SaúdeMemora"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
            
          </div>
        )}

        {/* Tab 2: Família Illustration */}
        {activeTab === 'family' && (
          <div className="relative overflow-hidden bg-gradient-to-b from-teal-50/40 to-white p-3 sm:p-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-white shadow-inner group">
              <img
                src="/family-health-illustration.jpg?v=clean3"
                alt="Ilustração da família acompanhando saúde no SaúdeMemora"
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-accent">
                <Heart size={13} /> Cuidado compartilhado para todas as idades
              </span>
              <span className="text-[10px]">Tudo em um só lugar</span>
            </div>
          </div>
        )}
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
            <div className="slide-up"><HeroVisual /></div>
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

        <section className="border-b border-border/70 bg-gradient-to-b from-white to-slate-50/60">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Conheça o projeto</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Tecnologia para deixar seu histórico mais acessível.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Entenda por que o SaúdeMemora foi criado e os princípios que orientam a plataforma: segurança, simplicidade e carinho com seus dados e os de quem você ama.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/sobre" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted">
                  Conheça nossa história <ArrowUpRight size={16} />
                </Link>
                <Link href="/recursos" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-primary transition-colors hover:bg-secondary/80">
                  Explorar recursos <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-white p-3 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="overflow-hidden rounded-2xl bg-teal-50/40">
                <img
                  src="/family-health-illustration.jpg?v=clean3"
                  alt="Família reunida acompanhando histórico de saúde"
                  className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <div className="mt-3 flex items-center justify-between px-2 py-1">
                <div>
                  <p className="text-xs font-bold text-foreground">Cuidado para toda a família</p>
                  <p className="text-[11px] text-muted-foreground">Medicamentos, carteirinhas e exames ao seu alcance.</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Heart size={16} className="fill-accent/20" />
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicPageFooter />
    </div>
  );
}
