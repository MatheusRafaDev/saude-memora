import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Github, HeartPulse, Linkedin, ShieldCheck, Sparkles } from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';

const principles = [
  {
    icon: HeartPulse,
    title: 'Mais contexto para você',
    description: 'Reunir registros ajuda a consultar suas informações de saúde quando precisar delas.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidade como prioridade',
    description: 'O espaço é pessoal, e você decide quais documentos e informações deseja adicionar.',
  },
  {
    icon: Sparkles,
    title: 'Organização com tecnologia',
    description: 'Ferramentas digitais ajudam a organizar documentos e tornar o histórico mais fácil de consultar.',
  },
];

export default function Sobre() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicPageHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border/70">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_10%,rgba(28,84,135,0.1),transparent_42%),radial-gradient(ellipse_at_90%_50%,rgba(20,125,128,0.08),transparent_35%)]" />
          <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft size={16} /> Voltar ao início
            </Link>
            <div className="mt-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-primary">
                <HeartPulse size={14} className="text-accent" /> Sobre o SaúdeMemora
              </span>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-[-0.045em] sm:text-5xl">
                Sua história de saúde merece estar organizada e ao seu alcance.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                O SaúdeMemora nasceu para facilitar a organização de exames, receitas e informações importantes em um espaço digital pessoal.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-10 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[1fr_0.72fr] md:gap-14">
          <article className="space-y-5 text-sm leading-7 text-muted-foreground">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Por que criamos a plataforma</h2>
            <p>
              Informações de saúde costumam ficar espalhadas entre papéis, arquivos e diferentes momentos da vida. O SaúdeMemora ajuda a reuni-las para que você possa consultar seu histórico com mais praticidade.
            </p>
            <p>
              A proposta é apoiar a organização pessoal: guardar documentos, visualizar informações extraídas e manter registros importantes em um só lugar. Você continua no controle do que adiciona à sua conta.
            </p>
            <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-5 text-foreground">
              <p className="font-semibold">Importante</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O SaúdeMemora é uma ferramenta de organização. Não realiza diagnósticos, não substitui profissionais de saúde e não deve ser usado para decisões de emergência.
              </p>
            </div>
          </article>

          <aside className="h-fit rounded-3xl border border-border/80 bg-white p-6 shadow-[0_20px_55px_-40px_rgba(25,48,83,0.4)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <HeartPulse size={23} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-accent">Nossa missão</p>
            <h2 className="mt-2 text-xl font-bold leading-snug tracking-tight">Tornar seu histórico de saúde mais simples de acompanhar.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Uma experiência acolhedora, prática e pensada para dar mais organização ao dia a dia.
            </p>
          </aside>
        </section>

        <section className="border-y border-border/70 bg-slate-50/70">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">O que orienta o projeto</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Feito para organizar, com responsabilidade.</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {principles.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent"><Icon size={19} /></span>
                  <h3 className="mt-4 text-sm font-bold">{title}</h3>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-12 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Quem criou</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Matheus Rafael</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Criador do SaúdeMemora, desenvolveu o projeto com o propósito de facilitar a organização e o acesso às informações de saúde no dia a dia.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="https://www.linkedin.com/in/matheus-rafael-50a676219/" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold transition-colors hover:bg-muted">
                <Linkedin size={15} /> LinkedIn
              </a>
              <a href="https://github.com/MatheusRafaDev" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold transition-colors hover:bg-muted">
                <Github size={15} /> GitHub
              </a>
            </div>
          </div>
          <Link href="/entrar" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary/90">
            Acessar plataforma <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  );
}
