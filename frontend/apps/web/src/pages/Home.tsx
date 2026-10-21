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
    >
      {/* ── CABEÇALHO OFICIAL UNIFICADO ─────────────────────────── */}
      <PublicPageHeader />

      {/* ── HERO SECTION DIRETO E OBJETIVO ─────────────────────── */}
      <section className="bg-white px-6 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-32">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div className="max-w-[570px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#CFE0FF]/60 px-3.5 py-1.5 text-xs font-semibold text-[#1D4ED8]">
              <FileText size={14} aria-hidden="true" />
              Seu histórico de saúde, sempre à mão
            </div>
            <h1 className="m-0 text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#14211F] sm:text-[54px] lg:text-[64px]">
              Seus documentos de saúde, em um só lugar.
            </h1>
            <p className="mt-5 max-w-[540px] text-base leading-[1.6] text-[#5B6878] sm:text-[17px]">
              Organize receitas, exames e laudos. A leitura assistida ajuda a localizar informações para você conferir no documento original.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/criar-conta" className="btn-primary inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm">
                Criar conta grátis <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a href="#como-funciona" className="btn-secondary inline-flex min-h-12 items-center rounded-xl px-6 text-sm font-semibold text-[#14211F]">
                Como funciona
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[470px] rounded-[28px] bg-[#1C2438] p-5 text-white sm:p-7">
            <div className="flex items-center justify-between gap-3 border-b border-[#36425F] pb-4">
              <div>
                <div className="text-xs font-medium text-[#A9B6CE]">Documento recente</div>
                <h2 className="mt-1 text-xl text-white">Receita</h2>
              </div>
              <span className="rounded-full bg-[#CFE0FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">Conferir dados</span>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#36425F] bg-white/5 p-4">
                <div className="text-xs text-[#A9B6CE]">Clínica</div>
                <div className="mt-1 font-medium text-white">[Clínica]</div>
                <div className="mt-3 text-xs text-[#A9B6CE]">Paciente</div>
                <div className="mt-1 font-medium text-white">[Nome]</div>
              </div>
              <div className="rounded-xl bg-[#CFE0FF] p-3.5 text-sm leading-relaxed text-[#14211F]">
                Os dados extraídos por IA podem conter erros. Confira sempre com o documento original.
              </div>
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
            <div className="flex flex-col items-center text-center rounded-[20px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:border-[#CFE0FF]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D4ED8] text-white font-bold text-lg shadow-xs">
                1
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Envie o arquivo</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Tire uma foto pelo celular ou anexe o PDF do seu exame ou receita médica.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col items-center text-center rounded-[20px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:border-[#CFE0FF]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D4ED8] text-white font-bold text-lg shadow-xs">
                2
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Organização rápida</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                O Saúde Memora reconhece datas, laudos e dosagens na sua linha do tempo.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="flex flex-col items-center text-center rounded-[20px] border border-[#E3E8F0] bg-[#F8FAFD] p-6 transition-all hover:border-[#CFE0FF]">
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

      <section id="recursos" className="scroll-mt-24 border-b border-[#E3E8F0] bg-white px-6 py-16 sm:px-8 sm:py-20">
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
            <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <FolderHeart size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Central de Documentos</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Guarde exames de sangue, laudos, atestados e encaminhamentos organizados por data.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <Upload size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Envio Rápido</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Tire fotos da câmera do celular ou anexe PDFs com facilidade e rapidez.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <Pill size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Receitas e Medicamentos</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Acompanhe remédios prescritos, dosagens e orientações médicas sempre que precisar.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <Search size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Busca Instantânea</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Localize qualquer laudo ou exame por médico, clínica, data ou tipo em segundos.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                <CalendarDays size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#14211F]">Linha do Tempo</h3>
              <p className="mt-2 text-sm text-[#5B6878] leading-relaxed">
                Visualize toda a história dos seus atendimentos em ordem cronológica contínua.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 transition-all hover:border-[#CFE0FF]">
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
      <section id="privacidade" className="scroll-mt-24 border-t border-[#E3E8F0] bg-white px-6 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-[1120px] gap-5 sm:grid-cols-2 sm:gap-10">
          <div>
            <h2 className="m-0 text-2xl text-[#14211F] sm:text-[32px]">Privacidade e uso responsável</h2>
            <p className="mb-0 mt-3 text-[15px] leading-relaxed text-[#5B6878]">
              Suas informações de saúde são sensíveis. O serviço organiza documentos e dados que você fornece; não faz diagnóstico nem aconselhamento médico. Confira os dados extraídos e converse com profissionais de saúde.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F4F7FC] p-5 sm:p-6">
            <h3 className="m-0 text-lg text-[#14211F]">A IA ajuda na organização</h3>
            <p className="mb-0 mt-2 text-sm leading-relaxed text-[#5B6878]">
              A leitura automática pode errar ou deixar informações de fora. Use sempre o documento original para conferir nomes, datas e resultados.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-14 text-center sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[680px]">
          <h2 className="m-0 text-[28px] text-[#14211F] sm:text-[38px]">Pronto para organizar sua saúde?</h2>
          <p className="mt-3 text-sm text-[#5B6878] sm:text-base">
            Reúna exames, receitas e laudos em um só lugar.
          </p>
          <div className="mt-7">
            <Link href="/criar-conta" className="btn-primary inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm">
              Criar conta grátis <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <PublicPageFooter />
    </div>
  );
}
