import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  FileText,
  Upload,
  Search,
  ArrowRight,
  ChevronDown,
  FolderHeart,
  Pill,
  CalendarDays,
  Activity,
} from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (window.location.hash === '#recursos') {
      setTimeout(() => {
        document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, []);

  const faqs = [
    {
      q: 'O Saúde Memora substitui uma consulta médica?',
      a: 'Não. O Saúde Memora é um organizador pessoal para reunir seus exames, receitas e laudos em um só lugar com autonomia.',
    },
    {
      q: 'Posso editar ou excluir meus documentos quando quiser?',
      a: 'Sim. Você tem total controle: pode revisar, alterar ou excluir documentos do seu histórico a qualquer momento.',
    },
    {
      q: 'Funciona no celular sem precisar baixar aplicativo pesado?',
      a: 'Sim! Funciona diretamente no navegador de qualquer smartphone (Android e iPhone) e computador, com carregamento rápido.',
    },
  ];

  return (
    <div
      id="inicio"
      className="min-h-screen bg-white text-[#14211F] flex flex-col selection:bg-[#CFE0FF] selection:text-[#1D4ED8] no-scrollbar"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── CABEÇALHO OFICIAL UNIFICADO ─────────────────────────── */}
      <PublicPageHeader />

      {/* ── HERO SECTION DIRETO E OBJETIVO ─────────────────────── */}
      <section className="relative overflow-hidden min-h-[calc(100dvh-80px)] lg:min-h-[82vh] bg-gradient-to-br from-[#1E5ECC] via-[#193B9E] to-[#122568] text-white flex flex-col justify-between">
        <div className="h-20 sm:h-24 lg:h-28 shrink-0 relative z-10" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center justify-center text-center px-6 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-col items-center gap-6 max-w-[760px]">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs sm:text-sm font-bold tracking-[0.08em] text-white uppercase border border-white/20 backdrop-blur-xs animate-hero-title">
              <span className="h-2 w-2 rounded-full bg-[#52D17C] animate-pulse" />
              Sua Saúde Digital
            </div>

            <h1 className="m-0 text-[36px] sm:text-[52px] lg:text-[62px] font-extrabold leading-[1.08] tracking-[-0.035em] text-white animate-hero-title">
              Seus exames e receitas,{' '}
              <span className="text-[#CFE0FF]">sempre com você.</span>
            </h1>

            <p className="m-0 text-base sm:text-lg leading-[1.6] text-white/90 max-w-[580px] animate-hero-text">
              Guarde e organize seus documentos de saúde em um só lugar. Simples, prático e sempre à mão no celular.
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 animate-hero-actions">
              <Link
                href="/entrar?mode=register"
                className="group inline-flex h-[52px] sm:h-[56px] items-center justify-center gap-2.5 rounded-full bg-white px-8 text-sm sm:text-base font-extrabold text-[#193B9E] shadow-[0_10px_24px_rgba(8,25,80,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#F8FAFD] hover:shadow-[0_14px_30px_rgba(8,25,80,0.35)] active:translate-y-0 cursor-pointer"
              >
                <span>Criar conta grátis</span>
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <button
                type="button"
                onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex h-[52px] sm:h-[56px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 text-sm sm:text-base font-bold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:translate-y-0 cursor-pointer"
              >
                Ver recursos
              </button>
            </div>
          </div>
        </div>

        <div className="h-6 sm:h-10 relative z-10" aria-hidden="true" />
      </section>

      {/* ── RECURSOS DA PLATAFORMA (INTEGRADO AO INÍCIO) ───────────── */}
      <section id="recursos" className="scroll-mt-24 border-b border-[#E3E8F0] bg-[#F4F7FC] px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
              Recursos da Plataforma
            </div>
            <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.03em] text-[#14211F] sm:text-[36px]">
              Tudo o que você pode fazer
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[22px] border border-[#E3E8F0] bg-white p-6 transition-all hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <FolderHeart size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Central de Documentos</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Guarde exames de sangue, laudos, atestados e encaminhamentos organizados por data.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#E3E8F0] bg-white p-6 transition-all hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <Upload size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Envio Rápido</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Tire fotos da câmera do celular ou anexe PDFs com facilidade e rapidez.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#E3E8F0] bg-white p-6 transition-all hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <Pill size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Receitas e Medicamentos</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Acompanhe remédios prescritos, dosagens e orientações médicas sempre que precisar.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#E3E8F0] bg-white p-6 transition-all hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <Search size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Busca Instantânea</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Localize qualquer laudo ou exame por médico, clínica, data ou tipo em segundos.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#E3E8F0] bg-white p-6 transition-all hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <CalendarDays size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Linha do Tempo</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Visualize toda a história dos seus atendimentos em ordem cronológica contínua.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#E3E8F0] bg-white p-6 transition-all hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <Activity size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Carteirinha de Saúde</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Tipo sanguíneo, alergias e contatos de emergência sempre à mão em um toque.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA (3 PASSOS RÁPIDOS) ────────────────────────── */}
      <section id="como-funciona" className="scroll-mt-24 border-b border-[#E3E8F0] bg-white px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
              Como Funciona
            </div>
            <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.03em] text-[#14211F] sm:text-[36px]">
              Simples em 3 passos
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Passo 1 */}
            <div className="flex flex-col items-center text-center rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D4ED8] text-white font-bold text-lg shadow-xs">
                1
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Envie o arquivo</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Tire uma foto pelo celular ou anexe o PDF do seu exame ou receita médica.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col items-center text-center rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D4ED8] text-white font-bold text-lg shadow-xs">
                2
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Organização rápida</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                O Saúde Memora reconhece datas, laudos e dosagens na sua linha do tempo.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="flex flex-col items-center text-center rounded-[22px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D4ED8] text-white font-bold text-lg shadow-xs">
                3
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Consulte na hora</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Mostre exames e receitas direto ao médico durante suas consultas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ESSENCIAL ───────────────────────────────────────────── */}
      <section id="faq" className="border-b border-[#E3E8F0] bg-white px-6 py-14 sm:px-8 sm:py-18">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
              Dúvidas
            </div>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em] text-[#14211F] sm:text-[32px]">
              Perguntas frequentes
            </h2>
          </div>

          <div className="mt-8 divide-y divide-[#E3E8F0]">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={faq.q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between text-left text-sm font-bold text-[#14211F] transition-colors hover:text-[#1D4ED8] sm:text-base cursor-pointer"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F7FC] text-[#1D4ED8]">
                      <ChevronDown
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        size={15}
                      />
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-[#5B6878] leading-relaxed animate-in fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CHAMADA FINAL (CTA) ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1E5ECC] via-[#193B9E] to-[#122568] px-6 py-16 text-center text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[680px]">
          <h2 className="text-[28px] font-extrabold tracking-[-0.03em] sm:text-[38px] leading-tight">
            Pronto para organizar sua saúde?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/90">
            Crie sua conta gratuita em menos de 1 minuto e comece a reunir seus exames.
          </p>
          <div className="mt-8">
            <Link
              href="/entrar?mode=register"
              className="inline-flex h-[52px] sm:h-[56px] items-center justify-center gap-2 rounded-full bg-white px-9 text-sm sm:text-base font-extrabold text-[#193B9E] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#F8FAFD]"
            >
              <span>Começar agora gratuitamente</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── RODAPÉ ──────────────────────────────────────────────────── */}
      <PublicPageFooter />
    </div>
  );
}
