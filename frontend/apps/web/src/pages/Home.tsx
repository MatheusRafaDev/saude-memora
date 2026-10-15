import { useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight,
  FileText,
  Shield,
  FlaskConical,
  Pill,
  ClipboardList,
  Syringe,
  FileBadge,
  Upload,
  Search,
  Lock,
  Trash2,
  CheckCircle2,
  HeartPulse,
  Smartphone,
  FolderHeart,
} from 'lucide-react';
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
    <div className="min-h-screen bg-white font-sans text-[#1d2a3d] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[radial-gradient(900px_500px_at_8%_0,#e6eef9,transparent_60%),radial-gradient(700px_500px_at_100%_40%,#e5eefb,transparent_60%),#fff] px-4 py-10 sm:px-12 sm:py-20 md:py-24">
          <div className="mx-auto flex max-w-[1140px] flex-col flex-wrap items-center gap-9 sm:flex-row sm:gap-16">
            <div className="w-full min-w-0 flex-1 sm:min-w-[320px] sm:max-w-[560px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#bfd8f7] bg-[#e5eefb] px-4 py-2 text-[13px] font-bold text-[#1f7fe0]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f7fe0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
                </svg>
                Seu histórico de saúde, mais organizado
              </span>

              <h1 className="mt-5 text-[36px] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#1d2a3d] sm:mt-6 sm:text-[56px] sm:leading-[1.03] lg:text-[68px]">
                Cuidar da sua saúde também é <span className="text-[#1f7fe0]">ter sua história por perto.</span>
              </h1>

              <p className="mt-4 text-base leading-[1.6] text-[#5a6a80] sm:mt-6 sm:text-[20px] sm:leading-[1.65]">
                Reúna exames, receitas e informações importantes em um espaço pessoal, para encontrar o que precisa com mais facilidade.
              </p>

              <div className="mt-7 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3.5">
                <Link
                  href="/entrar"
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#1b3a60] px-5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(27,58,96,0.25)] transition-all hover:bg-[#244d7e] hover:-translate-y-0.5 sm:min-h-[54px] sm:w-auto sm:px-7 sm:text-base"
                >
                  <span>Acessar plataforma</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>

                <Link
                  href="/recursos"
                  className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[14px] border border-[#dde3ec] bg-white px-5 text-[15px] font-bold text-[#1d2a3d] transition-all hover:bg-[#f7f9fc] sm:min-h-[54px] sm:w-auto sm:px-7 sm:text-base"
                >
                  Conhecer os recursos
                </Link>
              </div>

              <div className="mt-7 flex flex-col gap-3 text-[13px] font-semibold text-[#5a6a80] sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-7 sm:text-[14px]">
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f7fe0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                  </svg>
                  Espaço pessoal
                </span>
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f7fe0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />
                  </svg>
                  Documentos reunidos
                </span>
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f7fe0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                  Você confere tudo
                </span>
              </div>
            </div>

            {/* Product overview without invented patient records. */}
            <div className="relative w-full min-w-0 flex-1 sm:min-w-[340px] sm:max-w-[500px]">
              <div className="overflow-hidden rounded-[28px] border border-[#dde3ec] bg-white shadow-[0_30px_70px_-30px_rgba(27,58,96,0.35)]">
                <div className="flex items-center gap-2 border-b border-[#dde3ec] bg-[#f1f4f8] px-5 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e7a9a0]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ecd08a]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7cc4e6]" />
                  <span className="ml-3 text-[12px] text-[#5a6a80]">Seu espaço pessoal</span>
                </div>

                <div className="p-4 sm:p-7">
                  <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1f7fe0]">
                    ACESSO PESSOAL
                  </div>
                  <div className="mt-1 mb-4 text-[26px] font-extrabold tracking-[-0.03em]">Seu histórico, no seu espaço</div>
                  <p className="mb-4 text-sm leading-relaxed text-[#5a6a80]">
                    Entre na sua conta para consultar os dados e documentos que você cadastrou.
                  </p>

                  {/* Tipos de documento com ícones */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      { icon: <FlaskConical size={15} />, label: 'Exames', color: '#1f7fe0', bg: '#e5eefb' },
                      { icon: <Pill size={15} />, label: 'Receitas', color: '#1b3a60', bg: '#f1f4f8' },
                      { icon: <FileBadge size={15} />, label: 'Laudos', color: '#1b3a60', bg: '#f1f4f8' },
                      { icon: <Syringe size={15} />, label: 'Vacinas', color: '#1b3a60', bg: '#f1f4f8' },
                      { icon: <ClipboardList size={15} />, label: 'Atestados', color: '#1b3a60', bg: '#f1f4f8' },
                      { icon: <FileText size={15} />, label: 'Outros', color: '#1b3a60', bg: '#f1f4f8' },
                    ].map(({ icon, label, color, bg }) => (
                      <span key={label} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-bold" style={{ background: bg, color }}>
                        {icon} {label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 border-t border-[#dde3ec] py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5eefb]">
                      <FlaskConical size={18} className="text-[#1f7fe0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold truncate">Exames e Laudos</div>
                      <div className="text-[12px] text-[#5a6a80]">Resultados e relatórios médicos</div>
                    </div>
                    <FileText size={18} className="text-[#1b3a60]" />
                  </div>

                  <div className="flex items-center gap-3 border-t border-[#dde3ec] py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                      <ClipboardList size={18} className="text-[#1b3a60]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold truncate">Ficha médica</div>
                      <div className="text-[12px] text-[#5a6a80]">Informações cadastradas por você</div>
                    </div>
                    <Shield size={18} className="text-[#1b3a60]" />
                  </div>

                  <div className="flex items-center gap-3 border-t border-[#dde3ec] py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                      <FolderHeart size={18} className="text-[#1b3a60]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold truncate">Histórico organizado</div>
                      <div className="text-[12px] text-[#5a6a80]">Consulte o que estiver salvo na sua conta</div>
                    </div>
                    <ArrowRight size={18} className="text-[#1b3a60]" />
                  </div>
                </div>
              </div>

              {/* Floating review card */}
              <div className="hidden rounded-[18px] border border-[#dde3ec] bg-white p-3.5 shadow-[0_30px_70px_-30px_rgba(27,58,96,0.35)] animate-in fade-in zoom-in-95 sm:absolute sm:-bottom-6 sm:-left-6 sm:flex sm:items-center sm:gap-3 sm:right-auto sm:px-5 sm:py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#e5eefb]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b3a60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                </div>
                <div>
                  <b className="text-[14px] text-[#1d2a3d]">Você no controle</b>
                  <div className="text-[12px] text-[#5a6a80]">Revise antes de confirmar</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4 Key Values Bar ────────────────────────────────────── */}
        <section className="border-t border-b border-[#dde3ec] bg-white px-6 py-12 sm:px-12">
          <div className="mx-auto max-w-[1140px]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5eefb]">
                  <Lock size={22} className="text-[#1f7fe0]" />
                </div>
                <div>
                  <b className="text-[16px] text-[#1d2a3d]">Espaço pessoal</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5a6a80]">Você decide o que adicionar.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5eefb]">
                  <FolderHeart size={22} className="text-[#1f7fe0]" />
                </div>
                <div>
                  <b className="text-[16px] text-[#1d2a3d]">Tudo reunido</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5a6a80]">Exames, receitas e laudos.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5eefb]">
                  <CheckCircle2 size={22} className="text-[#1f7fe0]" />
                </div>
                <div>
                  <b className="text-[16px] text-[#1d2a3d]">Você confere</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5a6a80]">Revise o que foi lido.</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5eefb]">
                  <Trash2 size={22} className="text-[#1f7fe0]" />
                </div>
                <div>
                  <b className="text-[16px] text-[#1d2a3d]">Você apaga</b>
                  <div className="mt-1 text-[14px] leading-relaxed text-[#5a6a80]">Exclua documentos ou a conta.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como funciona (3 Steps) ─────────────────────────────── */}
        <section className="border-b border-[#dde3ec] bg-[#f1f4f8] px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1f7fe0]">Como funciona</div>
            <h2 className="mt-3 text-[34px] sm:text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#1d2a3d]">
              Do papel ao histórico, em três passos.
            </h2>
            <p className="mt-3.5 max-w-[560px] text-[17px] leading-[1.6] text-[#5a6a80]">
              Os dados extraídos automaticamente podem conter erros, por isso a conferência fica com você.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-[24px] border border-[#dde3ec] bg-white p-7 transition-all hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1b3a60] text-[18px] font-extrabold text-white">
                    1
                  </div>
                  <h3 className="text-[22px] font-bold">Envie</h3>
                </div>
                <p className="mt-3.5 mb-5 text-[16px] leading-[1.6] text-[#5a6a80]">
                  Adicione uma foto ou PDF de exames, receitas e laudos.
                </p>
                <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-[16px] border-2 border-dashed border-[#b8c4d6] bg-[#f7f9fc] text-[13px] text-[#5a6a80]">
                  <Upload size={26} className="text-[#1b3a60]" />
                  <span>Arraste um arquivo ou toque para enviar</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-[24px] border border-[#dde3ec] bg-white p-7 transition-all hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1b3a60] text-[18px] font-extrabold text-white">
                    2
                  </div>
                  <h3 className="text-[22px] font-bold">Confira</h3>
                </div>
                <p className="mt-3.5 mb-5 text-[16px] leading-[1.6] text-[#5a6a80]">
                  A plataforma organiza as informações lidas e você revisa e corrige o que precisar.
                </p>
                <div className="flex h-11 items-center gap-2 rounded-[12px] border border-[#dde3ec] bg-[#f1f4f8] px-3.5 text-[13px] text-[#5a6a80]">
                  <span>Informações extraídas do documento</span>
                </div>
                <div className="mt-2 flex h-11 items-center justify-between gap-2 rounded-[12px] border border-[#dde3ec] bg-[#f1f4f8] px-3.5 text-[13px] text-[#5a6a80]">
                  <span>Confira e corrija os dados</span>
                  <span className="rounded-full bg-[#fdf3d8] px-2.5 py-0.5 text-[11px] font-bold text-[#6b4208]">
                    Revisar
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-[24px] border border-[#dde3ec] bg-white p-7 transition-all hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1b3a60] text-[18px] font-extrabold text-white">
                    3
                  </div>
                  <h3 className="text-[22px] font-bold">Encontre</h3>
                </div>
                <p className="mt-3.5 mb-5 text-[16px] leading-[1.6] text-[#5a6a80]">
                  Busque por título ou conteúdo e filtre por tipo, status e período.
                </p>
                <div className="flex h-11 items-center gap-2 rounded-[12px] border border-[#dde3ec] bg-[#f1f4f8] px-3.5 text-[13px] text-[#5a6a80]">
                  <Search size={16} className="text-[#5a6a80]" />
                  <span>Busque nos seus documentos</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#e5eefb] px-2.5 py-1 text-[12px] font-bold text-[#1f7fe0]">Tipo</span>
                  <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-[12px] font-bold text-[#1d2a3d]">Período</span>
                  <span className="rounded-full bg-[#e5eefb] px-2.5 py-1 text-[12px] font-bold text-[#1b3a60]">Status</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recursos Bento Grid ─────────────────────────────────── */}
        <section className="bg-white px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1f7fe0]">Recursos</div>
            <h2 className="mt-3 text-[34px] sm:text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#1d2a3d]">
              Tudo organizado em um só lugar
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-5">
              <div className="rounded-[28px] bg-[#1b3a60] p-9 text-white md:col-span-3">
                <div className="flex h-13 w-13 items-center justify-center rounded-[17px] bg-white/15">
                  <FolderHeart size={26} className="text-white" />
                </div>
                <h3 className="mt-6 text-[26px] font-bold">Documentos em um só lugar</h3>
                <p className="mt-2 mb-6 max-w-[460px] text-[16px] leading-[1.65] text-[#c9d6e8]">
                  Reúna exames, receitas, laudos, atestados, vacinas e encaminhamentos no seu espaço pessoal.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Exames', 'Receitas', 'Laudos', 'Atestados', 'Vacinas', 'Encaminhamentos'].map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#bfd8f7] bg-[#e5eefb] p-9 md:col-span-2">
                <div className="flex h-13 w-13 items-center justify-center rounded-[17px] bg-white shadow-sm">
                  <Pill size={26} className="text-[#1f7fe0]" />
                </div>
                <h3 className="mt-6 text-[26px] font-bold text-[#1d2a3d]">Medicamentos</h3>
                <p className="mt-2 text-[16px] leading-[1.65] text-[#5a6a80]">
                  Consulte os medicamentos identificados nas suas receitas.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-[24px] border border-[#dde3ec] bg-white p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1f4f8]">
                  <FlaskConical size={22} className="text-[#1b3a60]" />
                </div>
                <h3 className="mt-4 text-[19px] font-bold">Exames</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Organize exames e consulte os resultados registrados.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#dde3ec] bg-white p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1f4f8]">
                  <HeartPulse size={22} className="text-[#1b3a60]" />
                </div>
                <h3 className="mt-4 text-[19px] font-bold">Histórico de saúde</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Mantenha suas informações importantes reunidas.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#dde3ec] bg-white p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1f4f8]">
                  <Smartphone size={22} className="text-[#1b3a60]" />
                </div>
                <h3 className="mt-4 text-[19px] font-bold">Celular e computador</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5a6a80]">
                  Interface adaptada para consultar em qualquer tela.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Original ao lado dos dados lidos ────────────────────── */}
        <section className="border-t border-b border-[#dde3ec] bg-[#f1f4f8] px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto flex max-w-[1140px] flex-col flex-wrap items-center gap-12 sm:flex-row sm:gap-16">
            <div className="flex w-full min-w-0 flex-1 flex-col gap-4 sm:min-w-[340px] sm:flex-row">
              <div className="flex-1 rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_30px_70px_-30px_rgba(27,58,96,0.25)]">
                <div className="text-[12px] font-bold uppercase text-[#5a6a80]">ORIGINAL</div>
                <div className="mt-3.5 space-y-2.5">
                  <div className="h-2.5 w-[90%] rounded-full bg-[#d5dce8]" />
                  <div className="h-2.5 w-[70%] rounded-full bg-[#d5dce8]" />
                  <div className="h-2.5 w-[95%] rounded-full bg-[#d5dce8]" />
                  <div className="h-2.5 w-[60%] rounded-full bg-[#d5dce8]" />
                  <div className="h-2.5 w-[85%] rounded-full bg-[#d5dce8]" />
                  <div className="h-2.5 w-[75%] rounded-full bg-[#d5dce8]" />
                </div>
              </div>

              <div className="mt-10 flex-1 rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_30px_70px_-30px_rgba(27,58,96,0.25)]">
                <div className="text-[12px] font-bold uppercase text-[#1f7fe0]">DADOS LIDOS</div>
                <div className="mt-3.5 space-y-2">
                  <div className="rounded-xl border border-[#dde3ec] bg-[#f1f4f8] px-3 py-2 text-[13px] text-[#5a6a80]">
                    Exame · Hemograma
                  </div>
                  <div className="rounded-xl border border-[#dde3ec] bg-[#f1f4f8] px-3 py-2 text-[13px] text-[#5a6a80]">
                    Data · 12/09/2026
                  </div>
                  <div className="rounded-xl border-2 border-[#e3b95a] bg-[#fdf3d8] px-3 py-2 text-[13px] font-semibold text-[#6b4208]">
                    Valor · confirme este campo
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[340px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1f7fe0]">Você no controle</div>
              <h2 className="mt-3 text-[34px] sm:text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#1d2a3d]">
                Original ao lado dos dados lidos.
              </h2>
              <p className="mt-4 mb-6 text-[17px] leading-[1.65] text-[#5a6a80]">
                Compare o documento com o que foi extraído, corrija o que for preciso e mantenha seu histórico confiável.
              </p>

              <ul className="space-y-3.5">
                {[
                  'Campos que pedem atenção ficam destacados',
                  'Edite qualquer informação extraída',
                  'Os dados podem conter erros: confira sempre',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[16px] font-medium text-[#1d2a3d]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f7fe0] text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l4 4 10-10" />
                      </svg>
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
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1f7fe0]">Para toda a família</div>
              <h2 className="mt-3 text-[34px] sm:text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#1d2a3d]">
                Cuidado compartilhado, tudo ao seu alcance.
              </h2>
              <p className="mt-4 mb-6 text-[17px] leading-[1.65] text-[#5a6a80]">
                Medicamentos, carteirinhas e exames reunidos para você e para quem você ama.
              </p>

              <ul className="space-y-3.5">
                {[
                  'Medicamentos, carteirinhas e exames ao seu alcance',
                  'Interface adaptada para celular e computador',
                  'Você controla o que adiciona à sua conta',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[16px] font-medium text-[#1d2a3d]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f7fe0] text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l4 4 10-10" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/sobre"
                  className="inline-flex min-h-[52px] items-center rounded-xl border border-[#dde3ec] bg-white px-7 text-[16px] font-bold text-[#1d2a3d] transition-colors hover:bg-[#f7f9fc]"
                >
                  Conheça nossa história
                </Link>
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[340px]">
              <div className="rounded-[28px] border border-[#dde3ec] bg-gradient-to-br from-[#e5eefb] to-[#dfe9f5] p-6 shadow-sm flex items-center justify-center">
                <img
                  src="/home-illustration.svg"
                  alt="Ilustração família e saúde"
                  className="h-auto w-full max-w-[420px] block"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Privacidade e controle (Dark Navy Section) ──────────── */}
        <section className="bg-[#1b3a60] px-6 py-20 sm:px-12 md:py-24 text-white">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#7cc4e6]">Privacidade e controle</div>
            <h2 className="mt-3 text-[34px] sm:text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em]">
              Seus dados, sob o seu comando.
            </h2>

            <div className="mt-11 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/20 bg-white/10 p-7 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Lock size={24} className="text-[#7cc4e6]" />
                </div>
                <h3 className="mt-5 text-[20px] font-bold">Consentimento</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#c9d6e8]">
                  Gerencie seu consentimento a qualquer momento.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/20 bg-white/10 p-7 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Trash2 size={24} className="text-[#7cc4e6]" />
                </div>
                <h3 className="mt-5 text-[20px] font-bold">Apague documentos</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#c9d6e8]">
                  Remova documentos individualmente.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/20 bg-white/10 p-7 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Shield size={24} className="text-[#7cc4e6]" />
                </div>
                <h3 className="mt-5 text-[20px] font-bold">Exclua a conta</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#c9d6e8]">
                  Solicite a exclusão da sua conta quando quiser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ (Perguntas frequentes) ──────────────────────────── */}
        <section className="bg-white px-6 py-20 sm:px-12 md:py-24">
          <div className="mx-auto max-w-[1140px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1f7fe0]">Perguntas frequentes</div>
            <h2 className="mt-3 text-[34px] sm:text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#1d2a3d]">
              Antes de começar
            </h2>

            <div className="mt-10 max-w-[820px] divide-y divide-[#dde3ec]">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className="py-6">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between text-left text-[18px] sm:text-[19px] font-bold text-[#1d2a3d] transition-colors hover:text-[#1b3a60]"
                    >
                      <span>{faq.q}</span>
                      <span className="text-[24px] font-normal text-[#1f7fe0] transition-transform duration-200">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-[16px] leading-[1.65] text-[#5a6a80] animate-in fade-in slide-in-from-top-1">
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
        <section className="px-6 pb-24 sm:px-12">
          <div className="mx-auto max-w-[1140px] rounded-[36px] bg-gradient-to-r from-[#1b3a60] to-[#24507f] p-6 sm:p-10 md:p-16 text-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="max-w-[560px]">
                <h2 className="text-[32px] sm:text-[42px] font-extrabold leading-[1.1] tracking-[-0.035em]">
                  Comece a reunir sua história de saúde.
                </h2>
                <p className="mt-4 text-[17px] sm:text-[18px] leading-[1.6] text-[#c9d6e8]">
                  Crie sua conta em poucos minutos e adicione seu primeiro documento.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cadastro"
                  className="inline-flex min-h-[52px] items-center rounded-[14px] bg-white px-7 text-[16px] font-bold text-[#1b3a60] transition-all hover:bg-[#f1f4f8]"
                >
                  Criar conta
                </Link>
                <Link
                  href="/entrar"
                  className="inline-flex min-h-[52px] items-center rounded-[14px] border border-white/35 px-7 text-[16px] font-bold text-white transition-all hover:bg-white/10"
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
