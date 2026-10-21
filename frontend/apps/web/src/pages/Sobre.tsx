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
      className="min-h-screen bg-white text-[#173754] flex flex-col font-sans selection:bg-[#CFE0FF] selection:text-[#1D4ED8]"
    >
      <PublicPageHeader variant="blue" />

      <main className="flex-1">
        {/* ── HERO SECTION ─────────────────────────────────────────── */}
        <section className="bg-[#1C51BB] text-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs sm:text-sm font-bold tracking-[0.08em] text-white uppercase border border-white/20 mb-6">
              Sobre o Saúde Memora
            </div>

            <h1
              className="text-[36px] sm:text-[50px] lg:text-[56px] font-bold leading-[1.1] tracking-[-0.025em] text-white mb-6"
              style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
            >
              Sua saúde organizada, sem complicação.
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-white/90 max-w-[580px] mx-auto mb-8 font-sans">
              O Saúde Memora nasceu para que você nunca mais perca exames ou receitas importantes em gavetas ou pastas antigas.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/criar-conta"
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-white text-[#2357D9] px-8 text-sm sm:text-base font-medium transition-all hover:bg-white/95 shadow-md active:translate-y-0.5 cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Criar conta grátis
              </Link>
              <a
                href="/#recursos"
                className="inline-flex h-[52px] items-center justify-center rounded-full border border-white/40 bg-white/10 text-white px-7 text-sm sm:text-base font-medium transition-all hover:bg-white/20 active:translate-y-0.5 cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Ver recursos
              </a>
            </div>
          </div>
        </section>

        {/* ── PILARES DO PROJETO ───────────────────────────────────── */}
        <section className="px-6 py-16 sm:px-8 sm:py-20 bg-white">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#2357D9] mb-2">
                Nosso Propósito
              </div>
              <h2
                className="text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] text-[#173754]"
                style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
              >
                Por que criamos a plataforma
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-[20px] bg-[#F7F9FC] p-6 transition-all hover:border-[#DFEBFF] border border-transparent">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DFEBFF] text-[#2357D9]">
                  <FolderHeart size={20} />
                </div>
                <h3
                  className="mt-4 text-[20px] font-normal text-[#173754]"
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  Tudo em um só lugar
                </h3>
                <p className="mt-2 text-sm text-[#536C80] leading-relaxed">
                  Reúna exames de sangue, laudos e receitas em uma linha do tempo única e clara.
                </p>
              </div>

              <div className="rounded-[20px] bg-[#F7F9FC] p-6 transition-all hover:border-[#DFEBFF] border border-transparent">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DFEBFF] text-[#2357D9]">
                  <Smartphone size={20} />
                </div>
                <h3
                  className="mt-4 text-[20px] font-normal text-[#173754]"
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  Sempre com você
                </h3>
                <p className="mt-2 text-sm text-[#536C80] leading-relaxed">
                  Acesse seu histórico no celular para consultar ou mostrar ao médico na consulta.
                </p>
              </div>

              <div className="rounded-[20px] bg-[#F7F9FC] p-6 transition-all hover:border-[#DFEBFF] border border-transparent">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DFEBFF] text-[#2357D9]">
                  <User size={20} />
                </div>
                <h3
                  className="mt-4 text-[20px] font-normal text-[#173754]"
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  Você no controle
                </h3>
                <p className="mt-2 text-sm text-[#536C80] leading-relaxed">
                  Total autonomia para adicionar, revisar e excluir seus documentos com facilidade.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CRIADOR DO PROJETO ───────────────────────────────────── */}
        <section className="border-t border-[#DFE7EF] bg-[#F7F9FC] px-6 py-14 sm:px-8 sm:py-18">
          <div className="mx-auto max-w-[820px] rounded-[24px] border border-[#DFE7EF] bg-white p-7 sm:p-9 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#2357D9] text-xl font-bold text-white shadow-sm">
              MR
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2357D9]">
                Criador
              </div>
              <h3
                className="mt-1 text-xl font-bold text-[#173754]"
                style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
              >
                Matheus Rafael
              </h3>
              <p className="mt-1.5 text-sm text-[#536C80] leading-relaxed">
                Criou o Saúde Memora para simplificar o acesso aos históricos de saúde de forma acolhedora, prática e direta.
              </p>
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-xs font-bold text-[#2357D9]">
                <a
                  href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  LinkedIn ↗
                </a>
                <span>•</span>
                <a
                  href="https://github.com/MatheusRafaDev"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-[820px] items-center justify-center gap-2 text-center text-xs text-[#536C80]">
            <Info size={15} className="text-[#2357D9] shrink-0" />
            <span>O Saúde Memora é um organizador pessoal de saúde e não substitui avaliação médica profissional.</span>
          </div>
        </section>

        {/* ── CHAMADA FINAL (CTA) ─────────────────────────────────── */}
        <section className="max-w-[1312px] mx-auto px-6 py-16 sm:px-8">
          <div className="bg-[#14377B] text-white rounded-[32px] p-8 sm:p-11 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h2
                className="font-medium text-[26px] sm:text-[32px] text-white leading-tight"
                style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
              >
                Comece a organizar seus exames hoje.
              </h2>
              <p className="mt-1 text-[15px] text-white/90">
                Cadastre-se gratuitamente em menos de 1 minuto.
              </p>
            </div>

            <Link
              href="/criar-conta"
              className="inline-flex items-center justify-center gap-2.5 h-[54px] px-7 rounded-[27px] bg-white text-[#2357D9] text-[16px] font-medium transition-all hover:bg-white/95 shadow-md active:translate-y-0.5 cursor-pointer shrink-0"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span>Criar conta gratuita</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <PublicPageFooter />
    </div>
  );
}
