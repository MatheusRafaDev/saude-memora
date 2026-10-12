import { Link } from 'wouter';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1d2a3d] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#eef3fa] via-white via-55% to-[#e8f4f2] px-6 py-20 sm:px-12">
          <div className="mx-auto max-w-[1000px]">
            <span className="inline-block rounded-full bg-[#e8f4f2] px-3.5 py-1.5 text-[12px] font-bold text-[#2f7a70]">
              Sobre o SaúdeMemora
            </span>
            <h1 className="mt-5 text-[40px] sm:text-[50px] lg:text-[54px] font-extrabold leading-[1.06] tracking-[-0.04em] text-[#1d2a3d] max-w-[780px]">
              Sua história de saúde merece estar{' '}
              <span className="text-[#2f7a70]">organizada e ao seu alcance.</span>
            </h1>
            <p className="mt-5 text-[18px] leading-[1.65] text-[#5a6a80] max-w-[620px]">
              O SaúdeMemora nasceu para facilitar a organização de exames, receitas e informações importantes em um espaço digital pessoal.
            </p>
          </div>
        </section>

        {/* ── Nossa história ───────────────────────────────────────── */}
        <section className="px-6 py-16 sm:px-12">
          <div className="mx-auto flex max-w-[1000px] flex-wrap gap-14">
            <div className="flex-[1.2] min-w-[320px] text-[16px] leading-[1.8] text-[#5a6a80]">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#2f7a70]">
                Nossa história
              </div>
              <h2 className="mt-2.5 mb-5 text-[30px] sm:text-[34px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#1d2a3d]">
                Por que criamos a plataforma
              </h2>
              <p className="mb-4">
                Informações de saúde costumam ficar espalhadas entre papéis, arquivos e diferentes momentos da vida. O SaúdeMemora ajuda a reuni-las para que você possa consultar seu histórico com mais praticidade.
              </p>
              <p className="mb-6">
                Você continua no controle do que adiciona à sua conta.
              </p>

              <div className="rounded-[16px] border border-[#e3b95a] bg-[#fdf3d8] p-5 text-[#4a2c0a] text-[15px] leading-relaxed">
                <b className="text-[16px]">Importante</b>
                <p className="mt-1">
                  É uma ferramenta de organização. Não realiza diagnósticos nem substitui profissionais de saúde.
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-[320px]">
              <div className="rounded-[32px] border border-[#dde3ec] bg-white p-3 shadow-sm">
                <div className="rounded-[28px] border border-[#dde3ec] bg-gradient-to-br from-[#e8f4f2] to-[#dfe9f5] p-5">
                  <img
                    src="/sobre-illustration.svg"
                    alt="Ilustração missão"
                    className="h-auto w-full block"
                  />
                </div>
                <div className="p-5">
                  <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#2f7a70]">
                    NOSSA MISSÃO
                  </div>
                  <h3 className="mt-2 text-[19px] font-bold leading-snug">
                    Tornar seu histórico de saúde mais simples e acolhedor de acompanhar.
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── O que orienta o projeto ─────────────────────────────── */}
        <section className="border-t border-b border-[#dde3ec] bg-[#f1f4f8] px-6 py-16 sm:px-12">
          <div className="mx-auto max-w-[1000px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#2f7a70]">
              O que orienta o projeto
            </div>
            <h2 className="mt-2.5 text-[30px] sm:text-[34px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#1d2a3d]">
              Feito para organizar, com responsabilidade.
            </h2>

            <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Mais contexto para você</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Reunir registros ajuda a consultar suas informações quando precisar.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Privacidade como prioridade</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  O espaço é pessoal, e você decide o que adicionar.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Organização com tecnologia</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Ferramentas digitais tornam o histórico mais fácil de consultar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quem criou ──────────────────────────────────────────── */}
        <section className="px-6 py-16 sm:px-12">
          <div className="mx-auto flex max-w-[1000px] flex-wrap items-center gap-7 rounded-[32px] border border-[#dde3ec] bg-white p-10 shadow-sm">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2f7a70] to-[#1b3a60] text-[26px] font-extrabold text-white shadow-md">
              MR
            </div>
            <div className="flex-1 min-w-[280px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#2f7a70]">
                Quem criou
              </div>
              <h2 className="mt-1 text-[26px] font-bold">Matheus Rafael</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                Criador do SaúdeMemora, desenvolveu o projeto para facilitar a organização e o acesso às informações de saúde.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────── */}
        <section className="px-6 pb-16 sm:px-12">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-8 rounded-[32px] bg-[#1b3a60] p-12 sm:p-14 text-white">
            <div className="max-w-[520px]">
              <h2 className="text-[28px] sm:text-[32px] font-extrabold tracking-[-0.03em]">
                Comece a reunir sua história de saúde.
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-[#c9d6e8]">
                Crie sua conta em poucos minutos e adicione seu primeiro documento.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/cadastro"
                className="inline-flex min-h-[48px] items-center rounded-xl bg-white px-6 text-[15px] font-bold text-[#1b3a60] transition-colors hover:bg-[#f1f4f8]"
              >
                Criar conta
              </Link>
              <Link
                href="/entrar"
                className="inline-flex min-h-[48px] items-center rounded-xl border border-white/35 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicPageFooter variant="compact" />
    </div>
  );
}
