import { Link } from 'wouter';
import {
  SvgFolderHeart,
  SvgUpload,
  SvgSearch,
  SvgFlask,
  SvgPill,
  SvgHeartPulse,
  SvgShield,
  SvgSmartphone,
  SvgFileBadge,
  SvgClipboard,
  SvgSyringe,
  SvgSend,
  SvgFileText,
  SvgAlertTriangle,
  SvgInfo,
} from '@/components/SvgIcons';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Recursos() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1d2a3d] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1 page-transition-enter">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#eef3fa] via-white via-55% to-[#e5eefb] px-6 py-16 sm:px-12 md:py-20">
          <div className="mx-auto flex max-w-[1100px] flex-col flex-wrap items-center gap-10 sm:flex-row sm:gap-14">
            <div className="w-full min-w-0 flex-1 sm:min-w-[320px]">
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
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[320px]">
              <div className="rounded-[28px] border border-[#dde3ec] bg-white p-3 sm:p-4 shadow-sm">
                <img
                  src="/recursos-illustration.jpg"
                  alt="Organização de prontuários e exames médicos"
                  className="h-auto w-full rounded-[20px] object-cover block shadow-sm"
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
                  <SvgFolderHeart size={22} color="#ffffff" />
                </div>
                <h3 className="mt-5 text-[22px] font-bold">Documentos em um só lugar</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-[#c9d6e8]">
                  Reúna exames, receitas, laudos, atestados, vacinas e encaminhamentos no seu espaço pessoal.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    { label: 'Exames', IconComponent: SvgFlask },
                    { label: 'Receitas', IconComponent: SvgPill },
                    { label: 'Laudos', IconComponent: SvgFileBadge },
                    { label: 'Atestados', IconComponent: SvgClipboard },
                    { label: 'Vacinas', IconComponent: SvgSyringe },
                    { label: 'Encaminhamentos', IconComponent: SvgSend },
                    { label: 'Outros', IconComponent: SvgFileText },
                  ].map(({ label, IconComponent }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white">
                      <IconComponent size={13} color="#7cc4e6" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#dde3ec] bg-[#e5eefb] p-8 md:col-span-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <SvgUpload size={22} color="#1f7fe0" />
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
                  <SvgSearch size={20} color="#1b3a60" />
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Busca e filtros</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Encontre registros pelo título ou conteúdo e filtre por tipo, status e período.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <SvgFlask size={20} color="#1b3a60" />
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Resultados de exames</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Consulte os resultados registrados nos documentos.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <SvgPill size={20} color="#1b3a60" />
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
                  <SvgHeartPulse size={20} color="#1b3a60" />
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Ficha de saúde</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Mantenha reunidas informações pessoais de saúde.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <SvgShield size={20} color="#1b3a60" />
                </div>
                <h3 className="mt-4 text-[17px] font-bold">Privacidade e controle</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Gerencie seu consentimento, apague documentos ou solicite a exclusão da conta.
                </p>
              </div>

              <div className="rounded-[16px] border border-[#dde3ec] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <SvgSmartphone size={20} color="#1b3a60" />
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
          <div className="mx-auto flex max-w-[1100px] flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div className="w-full min-w-0 flex-1 sm:min-w-[300px] rounded-[16px] border border-[#e3b95a] bg-[#fdf3d8] p-5 text-[#4a2c0a]">
              <div className="flex items-center gap-2">
                <SvgAlertTriangle size={18} color="#9a620b" />
                <b className="text-[16px]">Confira os dados extraídos</b>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">
                Os dados extraídos automaticamente podem conter erros; confira-os sempre.
              </p>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[300px] rounded-[16px] border border-[#e3b95a] bg-[#fdf3d8] p-5 text-[#4a2c0a]">
              <div className="flex items-center gap-2">
                <SvgInfo size={18} color="#9a620b" />
                <b className="text-[16px]">Uma ferramenta de organização</b>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">
                O SaúdeMemora não faz diagnósticos e não substitui avaliação médica nem atendimento de emergência. Em emergência no Brasil, ligue 192 (SAMU).
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────── */}
        <section className="px-6 pb-16 sm:px-12">
          <div className="mx-auto flex max-w-[1100px] flex flex-col items-start justify-between gap-8 rounded-[32px] bg-[#1b3a60] p-6 sm:flex-row sm:items-center sm:p-14 text-white">
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
                href="/entrar?mode=register"
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
