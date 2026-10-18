import { useState } from 'react';
import { Link } from 'wouter';
import {
  SvgHeartPulse,
  SvgArrowRight,
  SvgShield,
  SvgFileText,
  SvgCheck,
  SvgLock,
  SvgTrash,
  SvgUpload,
  SvgSearch,
  SvgPill,
  SvgFlask,
  SvgSmartphone,
  SvgFolderHeart,
  SvgSyringe,
  SvgClipboard,
  SvgFileBadge,
  SvgSend,
  SvgCalendar,
  SvgSparkles,
} from '@/components/SvgIcons';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'O SaúdeMemora faz diagnósticos?',
      a: 'Não. É uma ferramenta de organização e não substitui avaliação médica nem atendimento de emergência.',
    },
    {
      q: 'Os dados lidos estão sempre certos?',
      a: 'Podem conter erros. Por isso você confere e corrige as informações extraídas.',
    },
    {
      q: 'Posso apagar o que adicionei?',
      a: 'Sim. Você pode apagar documentos individualmente ou solicitar a exclusão da conta.',
    },
    {
      q: 'Funciona no celular?',
      a: 'Sim, a interface é adaptada para celular e computador.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#14211F] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1 page-transition-enter">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[radial-gradient(900px_500px_at_8%_0,#CFE0FF/35,transparent_60%),radial-gradient(700px_500px_at_100%_40%,#CFE0FF/25,transparent_60%),#fff] px-4 py-10 sm:px-12 sm:py-20 md:py-24">
          <div className="mx-auto flex max-w-[1140px] flex-col flex-wrap items-center gap-9 sm:flex-row sm:gap-16">
            <div className="w-full min-w-0 flex-1 sm:min-w-[320px] sm:max-w-[560px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1D4ED8]/20 bg-[#CFE0FF] px-4 py-2 text-[13px] font-bold text-[#1D4ED8]">
                <SvgHeartPulse size={15} color="#1D4ED8" />
                Seu histórico de saúde, sempre à mão.
              </span>

              <h1 className="mt-5 text-[38px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#14211F] sm:mt-6 sm:text-[56px] sm:leading-[1.05] lg:text-[64px] font-serif">
                Cuidar da sua saúde também é <span className="text-[#1D4ED8] font-serif italic font-medium">ter sua história por perto.</span>
              </h1>

              <p className="mt-4 text-base leading-[1.6] text-[#5B6878] sm:mt-6 sm:text-[19px] sm:leading-[1.6]">
                Reúna exames, receitas, laudos e atestados em um espaço pessoal, claro e confiável, sempre disponível quando você precisar.
              </p>

              <div className="mt-7 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3.5">
                <Link
                  href="/entrar"
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-[15px] font-bold text-white shadow-sm transition-all hover:bg-[#1e40af] hover:-translate-y-0.5 sm:min-h-[52px] sm:w-auto sm:px-7 sm:text-base"
                >
                  <span>Acessar plataforma</span>
                  <SvgArrowRight size={18} color="#fff" />
                </Link>

                <Link
                  href="/recursos"
                  className="inline-flex min-h-[50px] w-full items-center justify-center rounded-xl border-[1.5px] border-[#14211F] bg-white px-6 text-[15px] font-bold text-[#14211F] transition-all hover:bg-[#F4F7FC] sm:min-h-[52px] sm:w-auto sm:px-7 sm:text-base"
                >
                  Conhecer os recursos
                </Link>
              </div>

              <div className="mt-7 flex flex-col gap-3 text-[13px] font-semibold text-[#5B6878] sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-7 sm:text-[14px]">
                <span className="flex items-center gap-2">
                  <SvgShield size={18} color="#1D4ED8" />
                  Espaço pessoal
                </span>
                <span className="flex items-center gap-2">
                  <SvgFileText size={18} color="#1D4ED8" />
                  Documentos reunidos
                </span>
                <span className="flex items-center gap-2">
                  <SvgCheck size={18} color="#1D4ED8" />
                  Você confere tudo
                </span>
              </div>
            </div>

            {/* Product overview mockup card */}
            <div className="relative w-full min-w-0 flex-1 sm:min-w-[340px] sm:max-w-[500px]">
              <div className="overflow-hidden rounded-[28px] border border-[#E3E8F0] bg-white shadow-[0_30px_70px_-30px_rgba(20,33,31,0.15)]">
                <div className="flex items-center gap-2 border-b border-[#E3E8F0] bg-[#F4F7FC] px-5 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E8664A]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#CFE0FF]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1D4ED8]" />
                  <span className="ml-3 text-[12px] font-medium text-[#5B6878]">Seu espaço pessoal</span>
                </div>

                <div className="p-5 sm:p-7">
                  <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1D4ED8]">
                    ACESSO PESSOAL
                  </div>
                  <div className="mt-1 mb-3 text-[24px] font-semibold tracking-[-0.02em] font-serif text-[#14211F]">
                    Seu histórico, no seu espaço
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-[#5B6878]">
                    Entre na sua conta para consultar os dados e documentos que você cadastrou.
                  </p>

                  {/* Tipos de documento com chips do desing.md */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      { icon: <SvgFlask size={14} color="#1D4ED8" />, label: 'Exames', color: '#1D4ED8', bg: '#CFE0FF' },
                      { icon: <SvgPill size={14} color="#14211F" />, label: 'Receitas', color: '#14211F', bg: '#F4F7FC' },
                      { icon: <SvgFileBadge size={14} color="#14211F" />, label: 'Laudos', color: '#14211F', bg: '#F4F7FC' },
                      { icon: <SvgSyringe size={14} color="#14211F" />, label: 'Vacinas', color: '#14211F', bg: '#F4F7FC' },
                      { icon: <SvgClipboard size={14} color="#14211F" />, label: 'Atestados', color: '#14211F', bg: '#F4F7FC' },
                      { icon: <SvgFileText size={14} color="#14211F" />, label: 'Outros', color: '#14211F', bg: '#F4F7FC' },
                    ].map(({ icon, label, color, bg }) => (
                      <span key={label} className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold border border-[#E3E8F0]" style={{ background: bg, color }}>
                        {icon} {label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 border-t border-[#E3E8F0] py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]">
                      <SvgFlask size={18} color="#1D4ED8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#14211F] truncate">Exames e Laudos</div>
                      <div className="text-[12px] text-[#5B6878]">Resultados e relatórios médicos</div>
                    </div>
                    <SvgFileText size={18} color="#14211F" />
                  </div>

                  <div className="flex items-center gap-3 border-t border-[#E3E8F0] py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                      <SvgClipboard size={18} color="#14211F" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#14211F] truncate">Ficha médica</div>
                      <div className="text-[12px] text-[#5B6878]">Informações cadastradas por você</div>
                    </div>
                    <SvgShield size={18} color="#14211F" />
                  </div>

                  <div className="flex items-center gap-3 border-t border-[#E3E8F0] py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                      <SvgFolderHeart size={18} color="#14211F" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#14211F] truncate">Histórico organizado</div>
                      <div className="text-[12px] text-[#5B6878]">Consulte o que estiver salvo na sua conta</div>
                    </div>
                    <SvgArrowRight size={18} color="#14211F" />
                  </div>
                </div>
              </div>

              {/* Floating review card */}
              <div className="hidden rounded-[18px] border border-[#E3E8F0] bg-white p-3.5 shadow-[0_20px_50px_-20px_rgba(20,33,31,0.18)] animate-in fade-in zoom-in-95 sm:absolute sm:-bottom-6 sm:-left-6 sm:flex sm:items-center sm:gap-3 sm:right-auto sm:px-5 sm:py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#CFE0FF]">
                  <SvgCheck size={20} color="#1D4ED8" />
                </div>
                <div>
                  <b className="text-[14px] text-[#14211F]">Você no controle</b>
                  <div className="text-[12px] text-[#5B6878]">Revise antes de confirmar</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4 Key Values Bar ────────────────────────────────────── */}
        <section className="border-t border-b border-[#E3E8F0] bg-white px-6 py-12 sm:px-12">
          <div className="mx-auto max-w-[1140px]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF]">
                  <SvgLock size={22} color="#1D4ED8" />
                </div>
                <div>
                  <b className="text-[16px] text-[#14211F]">Espaço pessoal</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5B6878]">Você decide o que adicionar.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF]">
                  <SvgFileText size={22} color="#1D4ED8" />
                </div>
                <div>
                  <b className="text-[16px] text-[#14211F]">Tudo reunido</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5B6878]">Exames, receitas e laudos.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF]">
                  <SvgCheck size={22} color="#1D4ED8" />
                </div>
                <div>
                  <b className="text-[16px] text-[#14211F]">Você confere</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5B6878]">Revise o que foi lido.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF]">
                  <SvgTrash size={22} color="#1D4ED8" />
                </div>
                <div>
                  <b className="text-[16px] text-[#14211F]">Você apaga</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5B6878]">Exclua documentos ou a conta.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como funciona (3 Steps) ─────────────────────────────── */}
        <section className="border-b border-[#E3E8F0] bg-[#F4F7FC] px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">Como funciona</div>
            <h2 className="mt-3 text-[34px] sm:text-[42px] font-semibold leading-[1.1] tracking-[-0.035em] text-[#14211F] font-serif">
              Do papel ao histórico, em três passos.
            </h2>
            <p className="mt-3.5 max-w-[560px] text-[17px] leading-[1.6] text-[#5B6878]">
              Os dados extraídos automaticamente podem conter erros, por isso a conferência fica com você.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-7 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1D4ED8] text-[18px] font-bold text-white">
                    1
                  </div>
                  <h3 className="text-[22px] font-semibold font-serif text-[#14211F]">Envie</h3>
                </div>
                <p className="mt-3.5 mb-5 text-[16px] leading-[1.6] text-[#5B6878]">
                  Adicione uma foto ou PDF de exames, receitas e laudos.
                </p>
                <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-[16px] border-2 border-dashed border-[#CFE0FF] bg-[#F4F7FC] text-[13px] text-[#5B6878]">
                  <SvgUpload size={26} color="#1D4ED8" />
                  <span>Arraste um arquivo ou toque para enviar</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-7 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1D4ED8] text-[18px] font-bold text-white">
                    2
                  </div>
                  <h3 className="text-[22px] font-semibold font-serif text-[#14211F]">Confira</h3>
                </div>
                <p className="mt-3.5 mb-5 text-[16px] leading-[1.6] text-[#5B6878]">
                  A plataforma organiza as informações lidas e você revisa e corrige o que precisar.
                </p>
                <div className="flex h-11 items-center gap-2 rounded-[12px] border border-[#E3E8F0] bg-[#F4F7FC] px-3.5 text-[13px] text-[#5B6878]">
                  <SvgFileText size={16} color="#1D4ED8" />
                  <span>Informações extraídas do documento</span>
                </div>
                <div className="mt-2 flex h-11 items-center justify-between gap-2 rounded-[12px] border border-[#E3E8F0] bg-[#F4F7FC] px-3.5 text-[13px] text-[#5B6878]">
                  <span className="flex items-center gap-2">
                    <SvgCheck size={16} color="#1D4ED8" />
                    <span>Confira e corrija os dados</span>
                  </span>
                  <span className="rounded-full bg-[#FDE1DA] px-2.5 py-0.5 text-[11px] font-bold text-[#9B2C16]">
                    Conferir dados
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-7 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1D4ED8] text-[18px] font-bold text-white">
                    3
                  </div>
                  <h3 className="text-[22px] font-semibold font-serif text-[#14211F]">Encontre</h3>
                </div>
                <p className="mt-3.5 mb-5 text-[16px] leading-[1.6] text-[#5B6878]">
                  Busque por título ou conteúdo e filtre por tipo, status e período.
                </p>
                <div className="flex h-11 items-center gap-2 rounded-[12px] border border-[#E3E8F0] bg-[#F4F7FC] px-3.5 text-[13px] text-[#5B6878]">
                  <SvgSearch size={16} color="#5B6878" />
                  <span>Busque nos seus documentos</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#CFE0FF] px-2.5 py-1 text-[12px] font-bold text-[#1D4ED8]">
                    <SvgFlask size={12} color="#1D4ED8" /> Exames
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F7FC] px-2.5 py-1 text-[12px] font-bold text-[#14211F] border border-[#E3E8F0]">
                    <SvgPill size={12} color="#14211F" /> Receitas
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#CFE0FF] px-2.5 py-1 text-[12px] font-bold text-[#1D4ED8]">
                    <SvgFileBadge size={12} color="#1D4ED8" /> Laudos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recursos Bento Grid ─────────────────────────────────── */}
        <section className="bg-white px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">Recursos</div>
            <h2 className="mt-3 font-serif text-[34px] sm:text-[42px] font-semibold leading-[1.1] tracking-tight text-[#14211F]">
              Tudo organizado em um só lugar
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-5">
              <div className="rounded-[28px] bg-[#1C2438] p-9 text-white md:col-span-3 border border-[#36425F]">
                <div className="flex h-13 w-13 items-center justify-center rounded-[17px] bg-white/10">
                  <SvgFolderHeart size={26} color="#CFE0FF" />
                </div>
                <h3 className="mt-6 font-serif text-[26px] font-semibold text-white">Documentos em um só lugar</h3>
                <p className="mt-2 mb-6 max-w-[460px] text-[16px] leading-[1.65] text-[#A9B6CE]">
                  Reúna exames, receitas, laudos, atestados, vacinas e encaminhamentos no seu espaço pessoal.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Exames', IconComponent: SvgFlask },
                    { label: 'Receitas', IconComponent: SvgPill },
                    { label: 'Laudos', IconComponent: SvgFileBadge },
                    { label: 'Atestados', IconComponent: SvgClipboard },
                    { label: 'Vacinas', IconComponent: SvgSyringe },
                    { label: 'Encaminhamentos', IconComponent: SvgSend },
                    { label: 'Outros', IconComponent: SvgFileText },
                  ].map(({ label, IconComponent }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-medium text-white">
                      <IconComponent size={14} color="#CFE0FF" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#CFE0FF] bg-[#F4F7FC] p-9 md:col-span-2">
                <div className="flex h-13 w-13 items-center justify-center rounded-[17px] bg-white shadow-xs">
                  <SvgPill size={26} color="#1D4ED8" />
                </div>
                <h3 className="mt-6 font-serif text-[26px] font-semibold text-[#14211F]">Medicamentos</h3>
                <p className="mt-2 text-[16px] leading-[1.65] text-[#5B6878]">
                  Consulte os medicamentos identificados nas suas receitas e acompanhe dosagens com tranquilidade.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-7 transition-all hover:border-[#CFE0FF] hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F7FC]">
                  <SvgFlask size={22} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[20px] font-semibold text-[#14211F]">Exames</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Organize exames e consulte os resultados registrados ao longo do tempo.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-7 transition-all hover:border-[#CFE0FF] hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F7FC]">
                  <SvgHeartPulse size={22} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[20px] font-semibold text-[#14211F]">Histórico de saúde</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Mantenha suas informações importantes reunidas para qualquer consulta.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-7 transition-all hover:border-[#CFE0FF] hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F7FC]">
                  <SvgSmartphone size={22} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[20px] font-semibold text-[#14211F]">Celular e computador</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Interface responsiva feita para consultar com agilidade em qualquer tela.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Original ao lado dos dados lidos ────────────────────── */}
        <section className="border-t border-b border-[#E3E8F0] bg-[#F4F7FC] px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto flex max-w-[1140px] flex-col flex-wrap items-center gap-12 sm:flex-row sm:gap-16">
            <div className="flex w-full min-w-0 flex-1 flex-col gap-4 sm:min-w-[340px] sm:flex-row">
              <div className="flex-1 rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-[#5B6878]">DOCUMENTO ORIGINAL</div>
                  <SvgFileText size={16} color="#5B6878" />
                </div>
                <div className="mt-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 pb-1 border-b border-[#E3E8F0] text-[12px] font-semibold text-[#14211F]">
                    <SvgFlask size={14} color="#1D4ED8" />
                    <span>Exame_Laboratorial_2026.pdf</span>
                  </div>
                  <div className="h-2.5 w-[90%] rounded-full bg-[#E3E8F0]" />
                  <div className="h-2.5 w-[70%] rounded-full bg-[#E3E8F0]" />
                  <div className="h-2.5 w-[95%] rounded-full bg-[#E3E8F0]" />
                  <div className="h-2.5 w-[60%] rounded-full bg-[#E3E8F0]" />
                  <div className="h-2.5 w-[85%] rounded-full bg-[#E3E8F0]" />
                  <div className="h-2.5 w-[75%] rounded-full bg-[#E3E8F0]" />
                </div>
              </div>

              <div className="mt-6 sm:mt-10 flex-1 rounded-[20px] border border-[#CFE0FF] bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-[#1D4ED8]">DADOS EXTRAÍDOS</div>
                  <SvgSparkles size={16} color="#1D4ED8" />
                </div>
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] px-3 py-2 text-[13px] text-[#14211F] font-medium">
                    <SvgFlask size={14} color="#1D4ED8" className="shrink-0" />
                    <span>Exame · Hemograma completo</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[#E3E8F0] bg-[#F4F7FC] px-3 py-2 text-[13px] text-[#5B6878]">
                    <SvgCalendar size={14} color="#5B6878" className="shrink-0" />
                    <span>Data · 12/09/2026</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[#E8664A]/30 bg-[#FDE1DA] px-3 py-2 text-[13px] font-semibold text-[#9B2C16]">
                    <SvgCheck size={14} color="#E8664A" className="shrink-0" />
                    <span>Conferir dados · clique e revise</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[340px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">Você no controle</div>
              <h2 className="mt-3 font-serif text-[34px] sm:text-[42px] font-semibold leading-[1.1] tracking-tight text-[#14211F]">
                Original ao lado dos dados lidos.
              </h2>
              <p className="mt-4 mb-6 text-[17px] leading-[1.65] text-[#5B6878]">
                Compare o documento com o que foi extraído, corrija o que for preciso e mantenha seu histórico confiável.
              </p>

              <ul className="space-y-3.5">
                {[
                  'Campos que pedem atenção ficam destacados',
                  'Edite qualquer informação extraída',
                  'Os dados podem conter erros: confira sempre',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[16px] font-medium text-[#14211F]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white">
                      <SvgCheck size={14} color="#fff" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Para toda a família ─────────────────────────────────── */}
        <section className="bg-white px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto flex max-w-[1140px] flex-col flex-wrap items-center gap-12 sm:flex-row sm:gap-16">
            <div className="w-full min-w-0 flex-1 sm:min-w-[340px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">Para toda a família</div>
              <h2 className="mt-3 font-serif text-[34px] sm:text-[42px] font-semibold leading-[1.1] tracking-tight text-[#14211F]">
                Cuidado compartilhado, tudo ao seu alcance.
              </h2>
              <p className="mt-4 mb-6 text-[17px] leading-[1.65] text-[#5B6878]">
                Medicamentos, carteirinhas e exames reunidos para você e para quem você ama.
              </p>

              <ul className="space-y-3.5">
                {[
                  'Medicamentos, carteirinhas e exames ao seu alcance',
                  'Interface adaptada para celular e computador',
                  'Você controla o que adiciona à sua conta',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[16px] font-medium text-[#14211F]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white">
                      <SvgCheck size={14} color="#fff" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/sobre"
                  className="inline-flex min-h-[52px] items-center rounded-xl border border-[#E3E8F0] bg-white px-7 text-[16px] font-bold text-[#14211F] transition-colors hover:bg-[#F4F7FC]"
                >
                  Conheça nossa história
                </Link>
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[340px]">
              <div className="rounded-[28px] border border-[#E3E8F0] bg-[#F4F7FC] p-3 sm:p-4 shadow-sm flex items-center justify-center">
                <img
                  src="/home-illustration.jpg"
                  alt="Consulta médica com idoso e família"
                  className="h-auto w-full max-w-[440px] rounded-[20px] object-cover block shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Privacidade e controle (Navy Block) ──────────────────── */}
        <section className="bg-[#1C2438] px-6 py-20 sm:px-12 md:py-24 text-white border-t border-b border-[#36425F]">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#CFE0FF]">Privacidade e controle</div>
            <h2 className="mt-3 font-serif text-[34px] sm:text-[42px] font-semibold leading-[1.1] tracking-tight text-white">
              Seus dados, sob o seu comando.
            </h2>

            <div className="mt-11 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-[22px] border border-[#36425F] bg-white/5 p-7 backdrop-blur-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <SvgLock size={24} color="#CFE0FF" />
                </div>
                <h3 className="mt-5 font-serif text-[20px] font-semibold text-white">Consentimento</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#A9B6CE]">
                  Gerencie seu consentimento e autorizações a qualquer momento.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#36425F] bg-white/5 p-7 backdrop-blur-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <SvgTrash size={24} color="#CFE0FF" />
                </div>
                <h3 className="mt-5 font-serif text-[20px] font-semibold text-white">Apague documentos</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#A9B6CE]">
                  Remova documentos e exames individualmente sempre que desejar.
                </p>
              </div>

              <div className="rounded-[22px] border border-[#36425F] bg-white/5 p-7 backdrop-blur-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <SvgShield size={24} color="#CFE0FF" />
                </div>
                <h3 className="mt-5 font-serif text-[20px] font-semibold text-white">Exclua a conta</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#A9B6CE]">
                  Solicite a exclusão definitiva da sua conta e dados quando quiser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ (Perguntas frequentes) ──────────────────────────── */}
        <section className="bg-white px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">Perguntas frequentes</div>
            <h2 className="mt-3 font-serif text-[34px] sm:text-[42px] font-semibold leading-[1.1] tracking-tight text-[#14211F]">
              Antes de começar
            </h2>

            <div className="mt-10 max-w-[820px] divide-y divide-[#E3E8F0]">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className="py-6">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between text-left font-serif text-[18px] sm:text-[20px] font-semibold text-[#14211F] transition-colors hover:text-[#1D4ED8]"
                    >
                      <span>{faq.q}</span>
                      <span className="text-[24px] font-normal text-[#1D4ED8] transition-transform duration-200">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-[16px] leading-[1.65] text-[#5B6878] animate-in fade-in slide-in-from-top-1 font-sans">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final Call To Action ─────────────────────────────────── */}
        <section className="px-6 pb-24 sm:px-12 bg-white">
          <div className="mx-auto max-w-[1140px] rounded-[36px] bg-[#1C2438] border border-[#36425F] p-6 sm:p-10 md:p-16 text-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="max-w-[560px]">
                <h2 className="font-serif text-[32px] sm:text-[42px] font-semibold leading-[1.1] tracking-tight text-white">
                  Comece a reunir sua história de saúde.
                </h2>
                <p className="mt-4 text-[17px] sm:text-[18px] leading-[1.6] text-[#A9B6CE]">
                  Crie sua conta em poucos minutos e adicione seu primeiro documento.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/entrar?mode=register"
                  className="inline-flex min-h-[52px] items-center rounded-[14px] bg-[#1D4ED8] px-7 text-[16px] font-bold text-white transition-all hover:bg-[#1e40af] shadow-md"
                >
                  Criar conta
                </Link>
                <Link
                  href="/entrar"
                  className="inline-flex min-h-[52px] items-center rounded-[14px] border border-white/20 bg-white/5 px-7 text-[16px] font-bold text-white transition-all hover:bg-white/10"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicPageFooter />
    </div>
  );
}
