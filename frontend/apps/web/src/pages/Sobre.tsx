import { Link } from 'wouter';
import {
  FolderHeart,
  Smartphone,
  User,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Sobre() {
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
                Sobre Nós
              </div>

              <h1 className="m-0 text-[36px] sm:text-[50px] lg:text-[60px] font-extrabold leading-[1.08] tracking-[-0.035em] text-white animate-hero-title">
                Sua saúde organizada,{' '}
                <span className="text-[#CFE0FF]">sem complicação.</span>
              </h1>

              <p className="m-0 text-base sm:text-lg leading-[1.6] text-white/90 max-w-[580px] animate-hero-text">
                O Saúde Memora nasceu para que você nunca mais perca exames ou receitas importantes em gavetas ou pastas antigas.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 animate-hero-actions">
                <Link
                  href="/criar-conta"
                  className="inline-flex h-[52px] sm:h-[56px] items-center justify-center gap-2 rounded-full bg-white px-8 text-sm sm:text-base font-extrabold text-[#193B9E] shadow-[0_10px_24px_rgba(8,25,80,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#F8FAFD] active:translate-y-0"
                >
                  Criar conta grátis
                </Link>
                <Link
                  href="/recursos"
                  className="inline-flex h-[52px] sm:h-[56px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 text-sm sm:text-base font-bold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:translate-y-0"
                >
                  Ver recursos
                </Link>
              </div>
            </div>
          </div>

          <div className="h-6 sm:h-10 relative z-10" aria-hidden="true" />
        </section>

        {/* ── PILARES DO PROJETO ───────────────────────────────────────── */}
        <section className="px-6 py-16 sm:px-8 sm:py-20 bg-white">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Nosso Propósito
              </div>
              <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.03em] text-[#14211F] sm:text-[36px]">
                Por que criamos a plataforma
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <FolderHeart size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Tudo em um só lugar</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Reúna exames de sangue, laudos e receitas em uma linha do tempo única e clara.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <Smartphone size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Sempre com você</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Acesse seu histórico no celular para consultar ou mostrar ao médico na consulta.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <User size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#14211F]">Você no controle</h3>
                <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                  Total autonomia para adicionar, revisar e excluir seus documentos com facilidade.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CRIADOR DO PROJETO ───────────────────────────────────────── */}
        <section className="border-t border-[#E3E8F0] bg-[#F4F7FC] px-6 py-14 sm:px-8 sm:py-18">
          <div className="mx-auto max-w-[820px] rounded-[24px] border border-[#CFE0FF] bg-white p-7 sm:p-9 shadow-xs flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1D4ED8] text-xl font-extrabold text-white shadow-sm">
              MR
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                Desenvolvedor
              </div>
              <h3 className="mt-1 text-xl font-bold text-[#14211F]">Matheus Rafael</h3>
              <p className="mt-1.5 text-sm text-[#5B6878] leading-relaxed">
                Criou o Saúde Memora para simplificar o acesso aos históricos de saúde de forma acolhedora, prática e direta.
              </p>
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-xs font-bold text-[#1D4ED8]">
                <a
                  href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  LinkedIn
                </a>
                <span>•</span>
                <a
                  href="https://github.com/MatheusRafaDev"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-[820px] items-center justify-center gap-2 text-center text-xs text-[#5B6878]">
            <Info size={15} className="text-[#1D4ED8] shrink-0" />
            <span>O Saúde Memora é um organizador pessoal de saúde e não substitui avaliação médica profissional.</span>
          </div>
        </section>

        {/* ── CHAMADA FINAL (CTA) ─────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#1E5ECC] via-[#193B9E] to-[#122568] px-6 py-16 text-center text-white sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[680px]">
            <h2 className="text-[28px] font-extrabold tracking-[-0.03em] sm:text-[38px] leading-tight">
              Comece a organizar seus exames hoje.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/90">
              Cadastre-se gratuitamente em menos de 1 minuto.
            </p>
            <div className="mt-8">
              <Link
                href="/criar-conta"
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
