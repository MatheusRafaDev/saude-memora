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
    <div className="min-h-screen bg-white font-sans text-[#14211F] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1 page-transition-enter">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-[#F4F7FC] to-white px-6 py-16 sm:px-12 md:py-20 border-b border-[#E3E8F0]">
          <div className="mx-auto flex max-w-[1100px] flex-col flex-wrap items-center gap-10 sm:flex-row sm:gap-14">
            <div className="w-full min-w-0 flex-1 sm:min-w-[320px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Recursos da plataforma
              </div>
              <h1 className="mt-4 font-serif text-[38px] sm:text-[46px] lg:text-[50px] font-semibold leading-[1.08] tracking-tight text-[#14211F]">
                Suas informações de saúde, mais fáceis de{' '}
                <span className="text-[#1D4ED8] italic font-medium">organizar e encontrar.</span>
              </h1>
              <p className="mt-5 mb-7 text-[17px] sm:text-[18px] leading-[1.65] text-[#5B6878]">
                Conheça as ferramentas do Saúde Memora para reunir documentos, laudos e receitas em um espaço seguro, estruturado e com rigorosa privacidade.
              </p>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[320px]">
              <div className="rounded-[28px] border border-[#E3E8F0] bg-[#F4F7FC] p-3 sm:p-4 shadow-sm">
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
        <section className="px-6 py-16 sm:px-12 bg-white">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
              Funcionalidades
            </div>
            <h2 className="mt-2.5 font-serif text-[30px] sm:text-[36px] font-semibold leading-[1.15] tracking-tight text-[#14211F]">
              O que você encontra
            </h2>

            <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="rounded-[24px] bg-[#1C2438] p-8 text-white md:col-span-3 border border-[#36425F]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <SvgFolderHeart size={22} color="#CFE0FF" />
                </div>
                <h3 className="mt-5 font-serif text-[22px] font-semibold text-white">Documentos em um só lugar</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-[#A9B6CE]">
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
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white">
                      <IconComponent size={13} color="#CFE0FF" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#CFE0FF] bg-[#F4F7FC] p-8 md:col-span-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-xs">
                  <SvgUpload size={22} color="#1D4ED8" />
                </div>
                <h3 className="mt-5 font-serif text-[22px] font-semibold text-[#14211F]">Envio e leitura de arquivos</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-[#5B6878]">
                  Envie imagens ou PDFs. A plataforma organiza informações extraídas para você conferir e corrigir.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgSearch size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Busca e filtros</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Encontre registros pelo título ou conteúdo e filtre por tipo, status e período.
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgFlask size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Resultados de exames</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Consulte os resultados registrados nos seus documentos com clareza.
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgPill size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Medicamentos registrados</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Localize medicamentos identificados nas receitas e acompanhe prescrições.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgHeartPulse size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Ficha de saúde</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Mantenha reunidas informações pessoais de saúde para consultas e emergências.
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgShield size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Privacidade e controle</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Gerencie seu consentimento, apague documentos ou solicite a exclusão da conta.
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgSmartphone size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Acesso rápido</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Interface adaptada para celular e computador com visual limpo e legível.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Disclaimers ─────────────────────────────────────────── */}
        <section className="px-6 py-6 pb-16 sm:px-12 bg-white">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div className="w-full min-w-0 flex-1 sm:min-w-[300px] rounded-[18px] border border-[#E8664A]/30 bg-[#FDE1DA] p-5 text-[#9B2C16]">
              <div className="flex items-center gap-2">
                <SvgAlertTriangle size={18} color="#E8664A" />
                <b className="text-[16px] font-bold">Autonomia e Auditoria do Paciente</b>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed">
                As informações são digitalizadas de forma assistida para simplificar suas consultas. Você tem autonomia total para conferir, auditar e validar cada dado diretamente com o laudo original.
              </p>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[300px] rounded-[18px] border border-[#CFE0FF] bg-[#F4F7FC] p-5 text-[#14211F]">
              <div className="flex items-center gap-2">
                <SvgInfo size={18} color="#1D4ED8" />
                <b className="text-[16px] font-bold text-[#1D4ED8]">Ferramenta de organização pessoal</b>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5B6878]">
                O Saúde Memora não faz diagnósticos e não substitui avaliação médica nem atendimento de emergência. Em emergência no Brasil, ligue 192 (SAMU).
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────── */}
        <section className="px-6 pb-16 sm:px-12 bg-white">
          <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-8 rounded-[32px] bg-[#1C2438] border border-[#36425F] p-6 sm:flex-row sm:items-center sm:p-14 text-white shadow-lg">
            <div className="max-w-[520px]">
              <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tight text-white">
                Comece a reunir sua história de saúde.
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-[#A9B6CE]">
                Crie sua conta em poucos minutos e adicione seu primeiro documento.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/entrar?mode=register"
                className="inline-flex min-h-[48px] items-center rounded-xl bg-[#1D4ED8] px-6 text-[15px] font-bold text-white transition-colors hover:bg-[#1e40af] shadow-md"
              >
                Criar conta
              </Link>
              <Link
                href="/entrar"
                className="inline-flex min-h-[48px] items-center rounded-xl border border-white/20 bg-white/5 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
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
