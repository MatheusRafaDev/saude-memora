import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  FolderHeart,
  Upload,
  Pill,
  Search,
  CalendarDays,
  Activity,
  ArrowRight,
  Minus,
  Plus,
} from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Home() {
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const recursos = [
    {
      title: 'Central de documentos',
      description: 'Exames, laudos, atestados e encaminhamentos organizados por data.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 10.5V8a2 2 0 0 0-2-2h-6.5L10 4H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6" />
          <path d="M18 21s-3-1.8-3-4a1.7 1.7 0 0 1 3-1 1.7 1.7 0 0 1 3 1c0 2.2-3 4-3 4Z" />
        </svg>
      ),
    },
    {
      title: 'Envio rápido',
      description: 'Guarde uma foto feita com o celular ou envie seu arquivo em PDF.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M8 12h8" />
        </svg>
      ),
    },
    {
      title: 'Receitas e medicamentos',
      description: 'Receitas, dosagens e orientações médicas fáceis de consultar.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      ),
    },
    {
      title: 'Busca instantânea',
      description: 'Encontre por médico, clínica, data ou tipo de documento.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
    },
    {
      title: 'Linha do tempo',
      description: 'Veja seu histórico de documentos em ordem cronológica.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5M12 7v5l3 2" />
        </svg>
      ),
    },
    {
      title: 'Carteirinha de saúde',
      description: 'Tipo sanguíneo, alergias e contatos de emergência à mão.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 19a5 5 0 0 1 10 0" />
        </svg>
      ),
    },
  ];

  const faqs = [
    {
      q: 'Substitui uma consulta médica?',
      a: 'Não. O Saúde Memora organiza seus documentos e não substitui a avaliação de um profissional de saúde.',
    },
    {
      q: 'Posso alterar meus documentos?',
      a: 'Sim. Você pode revisar, editar e excluir seus documentos quando quiser.',
    },
    {
      q: 'Preciso instalar um aplicativo?',
      a: 'Não. Acesse pelo navegador no Android, iPhone ou computador, sem baixar um aplicativo pesado.',
    },
  ];

  return (
    <div
      id="inicio"
      className="min-h-screen bg-white text-[#173754] flex flex-col font-sans selection:bg-[#CFE0FF] selection:text-[#1D4ED8]"
    >
      {/* ── CABEÇALHO OFICIAL ─────────────────────────────────────── */}
      <PublicPageHeader variant="blue" />

      <main className="flex-1">
        {/* ── HERO SECTION ─────────────────────────────────────────── */}
        <section className="bg-[#1C51BB] text-white">
          <div className="mx-auto max-w-[1312px] px-6 py-14 sm:px-8 sm:py-16">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] lg:gap-12">
              <div>
                <h1
                  className="font-normal text-[38px] sm:text-[52px] lg:text-[64px] leading-[1.1] tracking-[-0.025em] mb-7 text-white"
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  Seus exames<br />e receitas, sempre com você.
                </h1>
                <p className="text-[17px] sm:text-[18px] max-w-[44ch] mb-9 text-white/95 leading-relaxed font-sans">
                  Menos papéis espalhados. Mais facilidade para guardar, encontrar e levar seus documentos à consulta.
                </p>
                <div>
                  <a
                    href="#recursos"
                    className="inline-flex items-center justify-center gap-2.5 h-[54px] px-7 rounded-[27px] bg-white text-[#2357D9] text-[16px] font-medium transition-all hover:bg-white/95 shadow-md active:translate-y-0.5 cursor-pointer"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Ver recursos
                  </a>
                </div>
              </div>

              <div className="w-full">
                <img
                  src="/images/hero-home.jpg"
                  alt="Mulher à mesa com o celular numa mão e um documento na outra, cercada por pastas e papéis"
                  className="w-full aspect-[666/474] object-cover rounded-[20px] shadow-lg block"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── RECURSOS SECTION ─────────────────────────────────────── */}
        <section id="recursos" className="scroll-mt-24 max-w-[1312px] mx-auto px-6 pt-20 sm:px-8 sm:pt-24">
          <div className="text-[12px] font-bold text-[#2357D9] uppercase tracking-wider mb-3">
            Recursos
          </div>
          <h2
            className="text-[30px] sm:text-[38px] lg:text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-[#173754]"
            style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            Um lugar para o que importa.
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recursos.map((rec) => (
              <div
                key={rec.title}
                className="bg-[#F7F9FC] rounded-[20px] p-6 grid grid-cols-[44px_1fr] gap-4 items-start border border-transparent hover:border-[#DFEBFF] hover:bg-[#F3F6FB] transition-all"
              >
                <div className="w-[44px] h-[44px] rounded-[12px] bg-[#DFEBFF] text-[#2357D9] flex items-center justify-center flex-none">
                  {rec.icon}
                </div>
                <div>
                  <h3
                    className="font-normal text-[20px] text-[#173754] mb-1.5 leading-snug"
                    style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                  >
                    {rec.title}
                  </h3>
                  <p className="text-[15px] text-[#536C80] leading-[1.55]">
                    {rec.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMO FUNCIONA SECTION ─────────────────────────────────── */}
        <section id="como-funciona" className="scroll-mt-24 bg-[#1C51BB] text-white mt-20 py-16 sm:py-20">
          <div className="max-w-[1312px] mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[530px_minmax(0,1fr)] gap-12 lg:gap-20 items-center">
              <div>
                <img
                  src="/images/como-funciona.jpg"
                  alt="Ilustração de documentos e pastas de saúde organizados"
                  className="w-full aspect-[530/392] object-cover rounded-[20px] shadow-lg block"
                  loading="lazy"
                />
              </div>

              <div>
                <div className="text-[12px] font-bold text-white uppercase tracking-wider mb-2">
                  Como funciona
                </div>
                <h2
                  className="text-[30px] sm:text-[38px] lg:text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-white mb-8"
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  Da papelada à consulta.<br />Em três passos.
                </h2>

                <div className="grid gap-5">
                  <div className="grid grid-cols-[38px_1fr] gap-4.5 items-start">
                    <span className="w-[38px] h-[38px] rounded-[12px] bg-white text-[#2357D9] font-bold text-[13px] flex items-center justify-center flex-none">
                      01
                    </span>
                    <div>
                      <h3
                        className="font-normal text-[20px] text-white pt-1 leading-snug"
                        style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                      >
                        Envie
                      </h3>
                      <p className="text-[14px] text-white/90 mt-0.5 leading-relaxed">
                        Fotografe o documento ou escolha um PDF.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[38px_1fr] gap-4.5 items-start">
                    <span className="w-[38px] h-[38px] rounded-[12px] bg-white text-[#2357D9] font-bold text-[13px] flex items-center justify-center flex-none">
                      02
                    </span>
                    <div>
                      <h3
                        className="font-normal text-[20px] text-white pt-1 leading-snug"
                        style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                      >
                        Organize
                      </h3>
                      <p className="text-[14px] text-white/90 mt-0.5 leading-relaxed">
                        Revise as informações e mantenha seu histórico em ordem.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[38px_1fr] gap-4.5 items-start">
                    <span className="w-[38px] h-[38px] rounded-[12px] bg-white text-[#2357D9] font-bold text-[13px] flex items-center justify-center flex-none">
                      03
                    </span>
                    <div>
                      <h3
                        className="font-normal text-[20px] text-white pt-1 leading-snug"
                        style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                      >
                        Consulte
                      </h3>
                      <p className="text-[14px] text-white/90 mt-0.5 leading-relaxed">
                        Mostre seus exames e receitas ao médico, quando precisar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── DÚVIDAS (FAQ) SECTION ─────────────────────────────────── */}
        <section id="duvidas" className="scroll-mt-24 max-w-[1312px] mx-auto px-6 pt-20 sm:px-8 sm:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] gap-8 lg:gap-12 items-start">
            <div>
              <div className="text-[12px] font-bold text-[#2357D9] uppercase tracking-wider mb-2">
                Dúvidas
              </div>
              <h2
                className="text-[30px] sm:text-[38px] lg:text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-[#173754]"
                style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
              >
                Bom saber antes<br />de começar.
              </h2>
            </div>

            <div className="divide-y divide-[#EEF3FA]">
              {faqs.map((faq, i) => {
                const isOpen = !!openFaqs[i];
                return (
                  <div key={faq.q} className="py-5 first:pt-0">
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-center justify-between text-left cursor-pointer group"
                    >
                      <span
                        className="font-normal text-[18px] sm:text-[19px] text-[#173754] group-hover:text-[#2357D9] transition-colors"
                        style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                      >
                        {faq.q}
                      </span>
                      <span className="text-[#2357D9] font-bold text-lg flex items-center justify-center pl-4 shrink-0">
                        {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-[15px] text-[#536C80] leading-relaxed animate-in fade-in">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER FINAL ─────────────────────────────────────── */}
        <section className="max-w-[1312px] mx-auto px-6 mt-20 sm:px-8 sm:mt-24">
          <div className="bg-[#14377B] text-white rounded-[32px] p-8 sm:p-11 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
              <div className="w-16 h-16 rounded-[20px] bg-white/[0.07] text-white flex items-center justify-center shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10.5V8a2 2 0 0 0-2-2h-6.5L10 4H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6" />
                  <path d="M18 21s-3-1.8-3-4a1.7 1.7 0 0 1 3-1 1.7 1.7 0 0 1 3 1c0 2.2-3 4-3 4Z" />
                </svg>
              </div>
              <div>
                <h2
                  className="font-medium text-[26px] sm:text-[32px] text-white leading-tight"
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  Pronto para organizar sua saúde?
                </h2>
                <p className="mt-1 text-[15px] text-white/90">
                  Comece pelo primeiro documento. Sua conta é grátis.
                </p>
              </div>
            </div>

            <Link
              href="/criar-conta"
              className="inline-flex items-center justify-center gap-2.5 h-[54px] px-7 rounded-[27px] bg-white text-[#2357D9] text-[16px] font-medium transition-all hover:bg-white/95 shadow-md active:translate-y-0.5 cursor-pointer shrink-0 w-full sm:w-auto"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Criar conta grátis
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── RODAPÉ ──────────────────────────────────────────────── */}
      <PublicPageFooter />
    </div>
  );
}
