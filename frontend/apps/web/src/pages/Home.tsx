import { useState } from 'react';
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

function Brand() {
  return (
    <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Saúde Memora — início">
      <img src="/logo.png" alt="" className="h-9 w-9 object-contain" />
      <span className="text-[15px] font-bold tracking-tight text-slate-800">
        Saúde <span className="text-blue-800">Memora</span>
      </span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div
      aria-label="Prévia da plataforma Saúde Memora"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,35,55,0.08)]"
    >
      <div className="flex min-h-12 items-center justify-between border-b border-slate-200 px-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
          <span className="text-xs font-semibold text-slate-700">Saúde Memora</span>
        </div>
        <span className="text-[11px] text-slate-500">Visão geral</span>
      </div>

      <div className="grid min-h-[290px] sm:grid-cols-[132px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-3 sm:block">
          <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
          <div className="space-y-1 text-[11px]">
            <p className="rounded-md bg-blue-50 px-2 py-2 font-medium text-blue-900">Visão geral</p>
            <p className="px-2 py-2 text-slate-600">Documentos</p>
            <p className="px-2 py-2 text-slate-600">Ficha médica</p>
          </div>
        </aside>

        <div className="p-4 sm:p-5">
          <p className="text-[10px] font-medium text-slate-500">Sua área de saúde</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Informações organizadas</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Exames, medicamentos e documentos reunidos em um só lugar.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['Exames', 'Medicamentos', 'Documentos'].map((item) => (
              <div key={item} className="flex min-h-16 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2">
                <span className="h-7 w-1 rounded-full bg-blue-800/70" aria-hidden="true" />
                <span className="text-[11px] font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
              <span className="text-[11px] font-semibold text-slate-700">Documentos recentes</span>
              <span className="text-[10px] text-slate-500">Sua biblioteca</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-4">
              <FileText size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              <p className="text-[10px] leading-4 text-slate-500">
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

  return (
    <div className="min-h-[100dvh] bg-white font-sans text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />

          <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
            {navigation.map(({ href, label }) => (
              <a key={label} href={href} className="text-[13px] font-medium text-slate-600 transition-colors hover:text-blue-900">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/entrar" className="rounded-md px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100">
              Entrar
            </Link>
            <Link href="/entrar" className="rounded-md bg-blue-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue-800">
              Criar conta
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav aria-label="Navegação móvel" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {navigation.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                <Link href="/entrar" onClick={() => setMobileMenuOpen(false)} className="rounded-md border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700">
                  Entrar
                </Link>
                <Link href="/entrar" onClick={() => setMobileMenuOpen(false)} className="rounded-md bg-blue-900 px-3 py-2.5 text-center text-sm font-semibold text-white">
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-800">Organização da sua saúde</p>
            <h1 className="mt-4 max-w-xl text-balance text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
              Suas informações de saúde em um só lugar.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Organize exames, medicamentos, documentos e histórico de saúde de forma simples e segura.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/entrar" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-800">
                Acessar plataforma <ArrowRight size={16} />
              </Link>
              <a href="#recursos" className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                Conhecer a plataforma
              </a>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section id="recursos" className="scroll-mt-20 border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Tudo organizado em um só lugar</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Acesse suas informações de saúde com mais facilidade.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {resources.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-md border border-slate-200 bg-white p-5">
                  <Icon size={19} strokeWidth={1.8} className="text-blue-800" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-[13px] leading-5 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="scroll-mt-20 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-800">Sobre</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Um projeto para organizar informações de saúde.</h2>
            </div>
            <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Saúde Memora</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  A plataforma reúne documentos e informações de saúde para ajudar você a consultar seu histórico quando precisar.
                  Ela apoia a organização dos registros e não substitui a avaliação ou a orientação de profissionais de saúde.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sobre o criador</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sou Matheus Rafael, criador do Saúde Memora. Desenvolvi este projeto com o propósito de facilitar a organização
                  e o acesso às informações de saúde no dia a dia.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900"
                  >
                    <Linkedin size={15} aria-hidden="true" />
                    LinkedIn
                  </a>
                  <a
                    href="https://github.com/MatheusRafaDev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-900"
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

      <footer className="border-t border-slate-200 bg-slate-50/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Brand />
            <p className="mt-2 text-xs text-slate-500">Organização e acesso às suas informações de saúde.</p>
            <p className="mt-1 text-xs text-slate-500">Criado por Matheus Rafael.</p>
          </div>
          <nav aria-label="Links institucionais" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
            <a href="#recursos" className="hover:text-blue-900">Recursos</a>
            <a href="#sobre" className="hover:text-blue-900">Sobre</a>
            <Link href="/privacidade" className="hover:text-blue-900">Privacidade</Link>
            <Link href="/termos" className="hover:text-blue-900">Termos de uso</Link>
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn de Matheus Rafael"
              className="text-slate-500 transition-colors hover:text-blue-900"
            >
              <Linkedin size={17} />
            </a>
            <a
              href="https://github.com/MatheusRafaDev"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub de Matheus Rafael"
              className="text-slate-500 transition-colors hover:text-blue-900"
            >
              <Github size={17} />
            </a>
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} Saúde Memora</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
