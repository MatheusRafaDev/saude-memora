import { Link } from 'wouter';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Recursos() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1d2a3d] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#eef3fa] via-white via-55% to-[#e5eefb] px-6 py-16 sm:px-12 md:py-20">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-14">
            <div className="flex-1 min-w-[320px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1f7fe0]">
                Recursos da plataforma
              </div>
              <h1 className="mt-4 text-[38px] sm:text-[46px] lg:text-[50px] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#1d2a3d]">
                Suas informações de saúde, mais fáceis de{' '}
                <span className="text-[#1f7fe0]">organizar e encontrar.</span>
              </h1>
              <p className="mt-5 mb-7 text-[17px] sm:text-[18px] leading-[1.65] text-[#5a6a80]">
                Conheça as ferramentas do SaúdeMemora para reunir documentos, laudos e receitas em um espaço seguro com suporte de inteligência artificial.
              </p>
              <Link
                href="/cadastro"
                className="inline-flex min-h-[48px] items-center rounded-xl bg-[#1b3a60] px-6 text-[15px] font-bold text-white transition-all hover:bg-[#244d7e]"
              >
                Experimentar agora
              </Link>
            </div>

            <div className="flex-1 min-w-[320px]">
              <div className="rounded-[28px] border border-[#dde3ec] bg-gradient-to-br from-[#e5eefb] to-[#dfe9f5] p-5 shadow-sm">
                <img
                  src="/recursos-illustration.svg"
                  alt="Ilustração recursos"
                  className="h-auto w-full block"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Funcionalidades ─────────────────────────────────────── */}
        <section className="px-6 py-16 sm:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1f7fe0]">
              Funcionalidades
            </div>
            <h2 className="mt-2.5 text-[30px] sm:text-[34px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#1d2a3d]">
              O que você encontra
            </h2>

            <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="rounded-[24px] bg-[#1b3a60] p-8 text-white md:col-span-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />
                  </svg>
                </div>
                <h3 className="mt-5 text-[22px] font-bold">Documentos em um só lugar</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-[#c9d6e8]">
                  Reúna exames, receitas, laudos, atestados, vacinas e encaminhamentos no seu espaço pessoal.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#dde3ec] bg-[#e5eefb] p-8 md:col-span-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f7fe0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V5M7 10l5-5 5 5M5 19h14" />
                  </svg>
                </div>
                <h3 className="mt-5 text-[22px] font-bold text-[#1d2a3d]">Envio e leitura de arquivos</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-[#5a6a80]">
                  Envie imagens ou PDFs. A plataforma organiza informações extraídas para você conferir e corrigir.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5a6 6 0 100 12 6 6 0 000-12zM16 16l4 4" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Busca e filtros</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Encontre registros pelo título ou conteúdo e filtre por tipo, status e período.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Resultados de exames</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Consulte os resultados registrados nos documentos.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 4a4 4 0 015.7 0l6.3 6.3a4 4 0 01-5.7 5.7L8 9.7A4 4 0 018 4zM11 7l6 6" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Medicamentos registrados</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Localize medicamentos identificados nas receitas.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Ficha de saúde</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Mantenha reunidas informações pessoais de saúde.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Privacidade e controle</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Gerencie seu consentimento, apague documentos ou solicite a exclusão da conta.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Acesso rápido</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Interface adaptada para celular e computador.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Disclaimers ─────────────────────────────────────────── */}
        <section className="px-6 py-6 pb-16 sm:px-12">
          <div className="mx-auto flex max-w-[1100px] flex-wrap gap-4">
            <div className="flex-1 min-w-[300px] rounded-[16px] border border-[#e3b95a] bg-[#fdf3d8] p-5 text-[#4a2c0a]">
              <b>Confira os dados extraídos</b>
              <p className="mt-2 text-[15px] leading-relaxed">
                Os dados extraídos automaticamente podem conter erros; confira-os sempre.
              </p>
            </div>

            <div className="flex-1 min-w-[300px] rounded-[16px] border border-[#e3b95a] bg-[#fdf3d8] p-5 text-[#4a2c0a]">
              <b>Uma ferramenta de organização</b>
              <p className="mt-2 text-[15px] leading-relaxed">
                O SaúdeMemora não faz diagnósticos e não substitui avaliação médica nem atendimento de emergência. Em emergência no Brasil, ligue 192 (SAMU).
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

      <PublicPageFooter />
    </div>
  );
}
