import { Link } from 'wouter';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';
import { SvgHeartPulse, SvgShield, SvgCheck, SvgAlertTriangle } from '@/components/SvgIcons';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#14211F] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1 page-transition-enter">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-[#F4F7FC] to-white px-6 py-20 sm:px-12 border-b border-[#E3E8F0]">
          <div className="mx-auto max-w-[1000px]">
            <span className="inline-block rounded-full bg-[#CFE0FF] px-4 py-1.5 text-[12px] font-bold text-[#1D4ED8]">
              Sobre o Saúde Memora
            </span>
            <h1 className="mt-5 font-serif text-[40px] sm:text-[50px] lg:text-[56px] font-semibold leading-[1.06] tracking-tight text-[#14211F] max-w-[780px]">
              Sua história de saúde merece estar{' '}
              <span className="text-[#1D4ED8] italic font-medium">organizada e ao seu alcance.</span>
            </h1>
            <p className="mt-5 text-[18px] leading-[1.65] text-[#5B6878] max-w-[620px]">
              O Saúde Memora nasceu para facilitar a organização de exames, receitas e informações importantes em um espaço digital pessoal e confiável.
            </p>
          </div>
        </section>

        {/* ── Nossa história ───────────────────────────────────────── */}
        <section className="px-6 py-16 sm:px-12 bg-white">
          <div className="mx-auto flex max-w-[1000px] flex-col flex-wrap gap-10 sm:flex-row sm:gap-14">
            <div className="w-full min-w-0 flex-[1.2] sm:min-w-[320px] text-[16px] leading-[1.8] text-[#5B6878]">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Nossa história
              </div>
              <h2 className="mt-2.5 mb-5 font-serif text-[30px] sm:text-[36px] font-semibold leading-[1.15] tracking-tight text-[#14211F]">
                Por que criamos a plataforma
              </h2>
              <p className="mb-4">
                Informações de saúde costumam ficar espalhadas entre papéis, arquivos e diferentes momentos da vida. O Saúde Memora ajuda a reuni-las para que você possa consultar seu histórico com mais praticidade.
              </p>
              <p className="mb-6">
                Você continua sempre no controle exclusivo do que adiciona à sua conta.
              </p>

              <div className="rounded-[18px] border border-[#E8664A]/30 bg-[#FDE1DA] p-5 text-[#9B2C16] text-[15px] leading-relaxed">
                <div className="flex items-center gap-2">
                  <SvgAlertTriangle size={18} color="#E8664A" />
                  <b className="text-[16px] font-bold">Importante</b>
                </div>
                <p className="mt-1">
                  É uma ferramenta de organização pessoal. Não realiza diagnósticos nem substitui profissionais de saúde ou serviços de emergência (SAMU 192).
                </p>
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 sm:min-w-[320px]">
              <div className="rounded-[32px] border border-[#E3E8F0] bg-[#F4F7FC] p-3 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-[28px] border border-[#E3E8F0] bg-white p-2">
                  <img
                    src="/sobre-illustration.jpg"
                    alt="Acolhimento e consulta médica com carinho"
                    className="h-auto w-full rounded-[20px] object-cover block shadow-sm"
                  />
                </div>
                <div className="p-5">
                  <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                    NOSSA MISSÃO
                  </div>
                  <h3 className="mt-2 font-serif text-[20px] font-semibold leading-snug text-[#14211F]">
                    Tornar seu histórico de saúde mais simples e acolhedor de acompanhar.
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── O que orienta o projeto ─────────────────────────────── */}
        <section className="border-t border-b border-[#E3E8F0] bg-[#F4F7FC] px-6 py-16 sm:px-12">
          <div className="mx-auto max-w-[1000px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
              O que orienta o projeto
            </div>
            <h2 className="mt-2.5 font-serif text-[30px] sm:text-[36px] font-semibold leading-[1.15] tracking-tight text-[#14211F]">
              Feito para organizar, com responsabilidade.
            </h2>

            <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgHeartPulse size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Mais contexto para você</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Reunir registros ajuda a consultar suas informações quando precisar.
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgShield size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Privacidade como prioridade</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  O espaço é estritamente pessoal, e você decide o que adicionar.
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF] hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <SvgCheck size={20} color="#1D4ED8" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-semibold text-[#14211F]">Organização com tecnologia</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                  Ferramentas digitais tornam o histórico mais fácil e claro de consultar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quem criou ──────────────────────────────────────────── */}
        <section className="px-6 py-16 sm:px-12 bg-white">
          <div className="mx-auto flex max-w-[1000px] flex-wrap items-center gap-7 rounded-[32px] border border-[#E3E8F0] bg-[#F4F7FC] p-10 shadow-xs transition-all hover:shadow-md">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-[#1D4ED8] text-[26px] font-serif font-semibold text-white shadow-md">
              MR
            </div>
            <div className="w-full min-w-0 flex-1 sm:min-w-[280px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Quem criou
              </div>
              <h2 className="mt-1 font-serif text-[26px] font-semibold text-[#14211F]">Matheus Rafael</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-[#5B6878]">
                Criador do Saúde Memora, desenvolveu o projeto com dedicação para facilitar a organização e o acesso às informações de saúde de forma acolhedora.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────── */}
        <section className="px-6 pb-16 sm:px-12 bg-white">
          <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-8 rounded-[32px] bg-[#1C2438] border border-[#36425F] p-6 sm:flex-row sm:items-center sm:p-14 text-white shadow-xl">
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
