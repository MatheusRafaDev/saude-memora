import { Link } from 'wouter';
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Pill,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

const resources = [
  {
    icon: FileText,
    title: 'Documentos em um só lugar',
    description: 'Reúna exames, receitas, laudos, atestados, vacinas e encaminhamentos no seu espaço pessoal.',
  },
  {
    icon: Upload,
    title: 'Envio e leitura de arquivos',
    description: 'Envie imagens ou PDFs. A plataforma organiza informações extraídas para você conferir e corrigir.',
  },
  {
    icon: Search,
    title: 'Busca e filtros',
    description: 'Encontre registros pelo título ou conteúdo e filtre por tipo, status e período.',
  },
  {
    icon: Activity,
    title: 'Resultados de exames',
    description: 'Consulte os resultados registrados nos documentos e mantenha o histórico mais acessível.',
  },
  {
    icon: Pill,
    title: 'Medicamentos registrados',
    description: 'Localize medicamentos identificados nas receitas adicionadas à sua conta.',
  },
  {
    icon: ClipboardList,
    title: 'Ficha de saúde',
    description: 'Mantenha reunidas informações pessoais de saúde para consultar quando precisar.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidade e controle',
    description: 'Gerencie seu consentimento, apague documentos individualmente ou solicite a exclusão da conta.',
  },
  {
    icon: HeartPulse,
    title: 'Acesso rápido às informações',
    description: 'Consulte seus registros em uma interface adaptada para celular e computador.',
  },
];

export default function Recursos() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicPageHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border/70">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_10%,rgba(28,84,135,0.1),transparent_42%),radial-gradient(ellipse_at_90%_50%,rgba(20,125,128,0.08),transparent_35%)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Recursos da plataforma</p>
              <h1 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">
                Suas informações de saúde, mais fáceis de organizar e encontrar.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Conheça as ferramentas do SaúdeMemora para reunir documentos, laudos e receitas em um espaço seguro com suporte de inteligência artificial.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/entrar" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Experimentar agora <ArrowRight size={16} />
                </Link>
                <a href="#resources-list-title" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white/80 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white">
                  Ver funcionalidades
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[480px]">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-accent/15 via-primary/10 to-transparent blur-2xl" aria-hidden="true" />
              <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-white p-2.5 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="overflow-hidden rounded-2xl bg-teal-50/50">
                  <img
                    src="/recursos-illustration.jpg?v=clean3"
                    alt="Ilustração 3D dos recursos de organização do SaúdeMemora"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <ShieldCheck size={13} /> OCR inteligente para receitas e exames
                  </span>
                  <span className="text-[10px]">SaúdeMemora 3D</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="resources-list-title" className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 id="resources-list-title" className="text-2xl font-bold tracking-tight sm:text-3xl">O que você encontra</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Os recursos ajudam a organizar e consultar informações. Os dados extraídos automaticamente podem conter erros; confira-os sempre.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-amber-300 bg-amber-50">
          <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
            <h2 className="font-bold text-amber-950">Uma ferramenta de organização</h2>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              O SaúdeMemora não faz diagnósticos e não substitui avaliação médica nem atendimento de emergência. Em uma emergência no Brasil, ligue 192 (SAMU) ou procure um serviço de urgência.
            </p>
          </div>
        </section>

        <section className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-12 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quer organizar seu histórico?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Acesse sua conta para começar a reunir seus documentos.</p>
          </div>
          <Link href="/entrar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Acessar plataforma <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <PublicPageFooter />
    </div>
  );
}
