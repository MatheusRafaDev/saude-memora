import {
  Activity,
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
} from 'lucide-react';
import { Link } from 'wouter';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';

const documentRows = [
  { name: 'Hemograma completo', detail: 'Dra. Helena Prado · 18 mar 2024', tone: 'blue', status: 'Processado' },
  { name: 'Receita — vitamina D', detail: 'Dr. Rafael Nunes · 03 abr 2024', tone: 'slate', status: 'Processado' },
  { name: 'Ultrassonografia abdominal', detail: 'Dra. Camila Valença · 26 fev 2024', tone: 'soft', status: 'Revisar' },
];

export default function Home() {
  return (
    <div className="app-noise min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <header className="relative z-10 mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 md:px-8 md:py-7">
        <Link href="/" className="flex items-center gap-3" aria-label="SaúdeMemora início">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_26px_hsl(var(--primary)/.18)]">
            <LourdesHeartMark className="h-9 w-9" strokeWidth={1.6} />
          </span>
          <span>
            <span className="block text-[17px] font-extrabold tracking-[-.055em]">saúde<span className="text-accent">memora</span></span>
            <span className="block font-mono text-[8px] uppercase tracking-[.2em] text-muted-foreground">seu histórico, claro</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-[12px] font-semibold text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-primary">Como funciona</a>
          <a href="#cuidado" className="transition-colors hover:text-primary">Cuidado e privacidade</a>
          <Link href="/auth" className="flex items-center gap-2 text-primary transition-colors hover:text-accent">Entrar <ArrowUpRight size={15} /></Link>
        </nav>
        <Link href="/auth" className="rounded-xl bg-primary px-4 py-2.5 text-[12px] font-bold text-primary-foreground shadow-[0_10px_24px_hsl(var(--primary)/.16)] transition-transform hover:-translate-y-0.5 md:hidden">Entrar</Link>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[.92fr_1.08fr] md:px-8 md:pb-28 md:pt-20">
          <div className="pointer-events-none absolute -left-28 top-8 h-72 w-72 rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute left-0 top-24 h-44 w-44 rounded-full border border-primary/10" />
          <div className="relative page-enter">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.17em] text-accent shadow-sm">
              <Sparkles size={13} /> Uma nova relação com sua saúde
            </div>
            <h1 className="max-w-[620px] text-[clamp(42px,6vw,78px)] font-extrabold leading-[.98] tracking-[-.075em] text-foreground">
              Sua história de saúde, <span className="text-primary">guardada com clareza.</span>
            </h1>
            <p className="mt-7 max-w-[500px] text-[16px] leading-7 text-muted-foreground md:text-[17px]">
              O SaúdeMemora organiza seus exames, receitas e relatórios em um espaço pessoal, seguro e fácil de entender — para você chegar mais preparado a cada conversa médica.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-bold text-primary-foreground shadow-[0_14px_28px_hsl(var(--primary)/.18)] transition-all hover:-translate-y-0.5">
                Criar meu espaço <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#como-funciona" className="flex h-12 items-center justify-center rounded-xl border border-border bg-card px-5 text-[13px] font-bold text-primary transition-colors hover:bg-muted">
                Conhecer o sistema
              </a>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-accent" /> Privacidade em primeiro lugar</span>
              <span className="flex items-center gap-2"><LockKeyhole size={14} className="text-accent" /> Feito para pessoas</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] page-enter md:pt-5">
            <div className="absolute -right-10 -top-6 h-32 w-32 rounded-full bg-[hsl(var(--accent)/.12)] blur-3xl" />
            <div className="relative rounded-[28px] border border-border/80 bg-card/90 p-3 shadow-[0_28px_80px_hsl(var(--primary)/.13)] backdrop-blur-xl">
              <div className="overflow-hidden rounded-[21px] border border-border/70 bg-background">
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-accent"><LourdesHeartMark className="h-6 w-6" strokeWidth={1.5} /></span>
                    <span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">visão geral</span>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-[10px] font-extrabold text-primary">MC</span>
                </div>
                <div className="p-5 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-accent">seu resumo</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.055em] text-primary">Olá, Marina.</h2><p className="mt-1 text-xs text-muted-foreground">Seu histórico, pronto quando você precisar.</p></div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-accent"><Activity size={17} /></span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-border bg-card p-3"><p className="text-xl font-extrabold text-primary">06</p><p className="mt-1 text-[9px] text-muted-foreground">documentos</p></div>
                    <div className="rounded-xl border border-border bg-card p-3"><p className="text-xl font-extrabold text-primary">02</p><p className="mt-1 text-[9px] text-muted-foreground">receitas</p></div>
                    <div className="rounded-xl border border-border bg-card p-3"><p className="text-xl font-extrabold text-primary">01</p><p className="mt-1 text-[9px] text-muted-foreground">revisão</p></div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.17em] text-muted-foreground">últimos documentos</p><span className="text-[10px] font-bold text-accent">ver todos</span></div>
                    <div className="space-y-2.5">
                      {documentRows.map((document) => (
                        <div key={document.name} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${document.tone === 'blue' ? 'bg-secondary text-accent' : document.tone === 'slate' ? 'bg-muted text-primary' : 'bg-[hsl(210_26%_94%)] text-[hsl(211_35%_48%)]'}`}><FileText size={15} /></span>
                          <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-foreground">{document.name}</p><p className="mt-0.5 truncate text-[9px] text-muted-foreground">{document.detail}</p></div>
                          <span className={`hidden rounded-full px-2 py-1 text-[8px] font-bold sm:block ${document.status === 'Revisar' ? 'bg-muted text-primary' : 'bg-secondary text-secondary-foreground'}`}>{document.status}</span>
                          <ChevronRight size={14} className="text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                    <div className="flex items-center gap-3"><UploadCloud size={17} /><div><p className="text-[11px] font-bold">Adicionar documento</p><p className="mt-0.5 text-[9px] text-primary-foreground/65">Exame, receita ou relatório</p></div></div>
                    <ArrowUpRight size={15} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-5 hidden items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_16px_36px_hsl(var(--primary)/.11)] sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-accent"><Check size={15} /></span>
              <div><p className="text-[10px] font-bold text-foreground">Tudo organizado</p><p className="mt-0.5 text-[9px] text-muted-foreground">Seu histórico está em dia</p></div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-border/70 bg-card/55">
          <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-20">
            <div className="max-w-[560px]"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">como funciona</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.06em] text-primary md:text-4xl">Menos procura. Mais contexto.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">O sistema transforma arquivos soltos em uma memória de saúde que acompanha você.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { number: '01', icon: UploadCloud, title: 'Você envia', description: 'Adicione uma foto ou arquivo do seu exame, receita ou relatório.' },
                { number: '02', icon: Sparkles, title: 'Nós organizamos', description: 'O SaúdeMemora reconhece as informações e deixa tudo mais fácil de consultar.' },
                { number: '03', icon: HeartHandshake, title: 'Você entende', description: 'Tenha seu histórico ao alcance para cuidar melhor das próximas decisões.' },
              ].map(({ number, icon: Icon, title, description }) => (
                <article key={number} className="group rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_42px_hsl(var(--primary)/.09)]">
                  <div className="flex items-center justify-between"><span className="font-mono text-[10px] tracking-[.18em] text-accent">{number}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon size={18} /></span></div>
                  <h3 className="mt-7 text-lg font-extrabold tracking-[-.04em] text-primary">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cuidado" className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 md:grid-cols-[.8fr_1.2fr] md:px-8 md:py-24">
          <div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_hsl(var(--primary)/.16)]"><LourdesHeartMark className="h-10 w-10" strokeWidth={1.45} /></span><p className="mt-6 font-mono text-[10px] uppercase tracking-[.2em] text-accent">feito com cuidado</p><h2 className="mt-3 max-w-[390px] text-3xl font-extrabold leading-tight tracking-[-.06em] text-primary md:text-4xl">Sua saúde merece uma casa.</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: 'Privacidade sem complicação', description: 'Um espaço pessoal pensado para informações que pedem respeito e cuidado.' },
              { icon: LockKeyhole, title: 'Tudo em um só lugar', description: 'Exames, receitas e relatórios organizados para você encontrar o que importa.' },
              { icon: FileText, title: 'Clareza para conversar', description: 'Chegue à consulta com mais contexto e menos tempo procurando documentos.' },
              { icon: HeartHandshake, title: 'Acompanhamento humano', description: 'Uma experiência serena para cuidar da sua história ao longo do tempo.' },
            ].map(({ icon: Icon, title, description }) => <div key={title} className="rounded-2xl border border-border bg-card p-5"><Icon size={18} className="text-accent" /><h3 className="mt-4 text-sm font-extrabold text-primary">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p></div>)}
          </div>
        </section>

        <section className="mx-5 mb-8 overflow-hidden rounded-[28px] bg-primary md:mx-auto md:max-w-[1240px]">
          <div className="relative px-6 py-12 md:px-14 md:py-16"><div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-primary-foreground/10" /><div className="absolute -bottom-32 right-28 h-80 w-80 rounded-full border border-primary-foreground/10" /><div className="relative max-w-[620px]"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary-foreground/60">comece por você</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.06em] text-primary-foreground md:text-5xl">Quando a sua história está organizada, tudo fica mais claro.</h2><Link href="/auth" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-primary-foreground px-5 text-[13px] font-bold text-primary transition-transform hover:-translate-y-0.5">Criar meu espaço <ArrowRight size={17} /></Link></div></div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-7 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex items-center gap-2"><LourdesHeartMark className="h-5 w-5 text-accent" strokeWidth={1.4} /><span>saúde<span className="font-bold text-primary">memora</span></span></div>
        <span>Seu histórico, claro.</span>
      </footer>
    </div>
  );
}