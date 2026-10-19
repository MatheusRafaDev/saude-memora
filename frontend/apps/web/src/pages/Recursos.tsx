import { Link } from 'wouter';
import {
  FolderHeart,
  Upload,
  Search,
  Pill,
  Activity,
  CalendarDays,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Recursos() {
  return (
    <div
      className="min-h-screen bg-white text-[#14211F] flex flex-col selection:bg-[#CFE0FF] selection:text-[#1D4ED8] no-scrollbar"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <PublicPageHeader />

      <main className="flex-1">
        {/* ── HERO SECTION DIRETO ───────────────────────────────── */}
        <section className="relative overflow-hidden min-h-[calc(100dvh-80px)] lg:min-h-[75vh] bg-gradient-to-br from-[#1E5ECC] via-[#193B9E] to-[#122568] text-white flex flex-col justify-between">
          <div className="h-20 sm:h-24 lg:h-28 shrink-0 relative z-10" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center justify-center text-center px-6 py-12 sm:px-8 sm:py-16">
            <div className="flex flex-col items-center gap-6 max-w-[760px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs sm:text-sm font-bold tracking-[0.08em] text-white uppercase border border-white/20 backdrop-blur-xs animate-hero-title">
                Recursos da Plataforma
              </div>

              <h1 className="m-0 text-[36px] sm:text-[50px] lg:text-[60px] font-extrabold leading-[1.08] tracking-[-0.035em] text-white animate-hero-title">
                Tudo para organizar{' '}
                <span className="text-[#CFE0FF]">sua saúde com facilidade.</span>
              </h1>

              <p className="m-0 text-base sm:text-lg leading-[1.6] text-white/90 max-w-[580px] animate-hero-text">
                Ferramentas práticas e intuitivas para reunir seus exames, laudos e receitas em um espaço pessoal.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 animate-hero-actions">
                <Link
                  href="/entrar?mode=register"
                  className="inline-flex h-[52px] sm:h-[56px] items-center justify-center gap-2 rounded-full bg-white px-8 text-sm sm:text-base font-extrabold text-[#193B9E] shadow-[0_10px_24px_rgba(8,25,80,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#F8FAFD] active:translate-y-0"
                >
                  Criar conta grátis
                </Link>
                <Link
                  href="/entrar"
                  className="inline-flex h-[52px] sm:h-[56px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 text-sm sm:text-base font-bold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:translate-y-0"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>

          <div className="h-6 sm:h-10 relative z-10" aria-hidden="true" />
        </section>

        {/* ── GRADE SIMPLIFICADA DE RECURSOS ───────────────────────────── */}
        <section className="px-6 py-16 sm:px-8 sm:py-20 bg-white">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Funcionalidades
              </div>
              <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.03em] text-[#14211F] sm:text-[36px]">
                O que você pode fazer
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <FolderHeart size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Central de Documentos</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Guarde exames, laudos, atestados e encaminhamentos organizados por data.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <Upload size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Envio Rápido</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Tire fotos da câmera do celular ou anexe PDFs com facilidade.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <Pill size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Receitas e Medicamentos</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Acompanhe dosagens e orientações médicas das receitas ativas.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <Search size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Busca Instantânea</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Localize qualquer laudo ou exame por médico, data ou palavra-chave.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <CalendarDays size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Linha do Tempo</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Visualize toda a história dos seus atendimentos em ordem cronológica.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <Activity size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Carteirinha de Saúde</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Tipo sanguíneo, alergias e contatos de emergência sempre à mão.
                </p>
              </div>
            </div>

            {/* Nota simples e direta */}
            <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-[#5B6878]">
              <Info size={15} className="text-[#1D4ED8] shrink-0" />
              <span>O Saúde Memora é um organizador pessoal e não substitui consultas médicas profissionais.</span>
            </div>
          </div>
        </section>

        {/* ── CHAMADA FINAL (CTA) ─────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#1E5ECC] via-[#193B9E] to-[#122568] px-6 py-16 text-center text-white sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[680px]">
            <h2 className="text-[28px] font-extrabold tracking-[-0.03em] sm:text-[38px] leading-tight">
              Pronto para começar?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/90">
              Crie sua conta gratuita e acesse seus exames em qualquer lugar.
            </p>
            <div className="mt-8">
              <Link
                href="/entrar?mode=register"
                className="inline-flex h-[52px] sm:h-[56px] items-center justify-center gap-2 rounded-full bg-white px-9 text-sm sm:text-base font-extrabold text-[#193B9E] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#F8FAFD]"
              >
                <span>Criar conta gratuita</span>
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicPageFooter />
    </div>
  );
}
