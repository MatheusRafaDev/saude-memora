import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
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
  Smartphone,
  User,
  Info,
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
    <motion.div
      id="inicio"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white text-[#173754] flex flex-col font-sans selection:bg-[#CFE0FF] selection:text-[#1D4ED8] overflow-x-hidden"
    >
      {/* ── CABEÇALHO OFICIAL ─────────────────────────────────────── */}
      <PublicPageHeader variant="blue" />

      <main className="flex-1">
        {/* ── HERO SECTION ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#1C51BB] text-white">
          {/* Luzes e gradientes decorativos no fundo */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.22, 0.38, 0.22], scale: [1, 1.08, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-blue-400/30 blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.15, 0.28, 0.15], scale: [1, 1.1, 1] }}
              transition={{ duration: 8, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-24 right-10 h-[460px] w-[460px] rounded-full bg-cyan-300/25 blur-3xl"
            />
          </div>

          <div className="relative mx-auto max-w-[1312px] px-6 py-14 sm:px-8 sm:py-16">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] lg:gap-12">
              <div>
                {/* Título Principal */}
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="font-normal text-[32px] xs:text-[38px] sm:text-[52px] lg:text-[64px] leading-[1.12] sm:leading-[1.1] tracking-[-0.025em] mb-6 sm:mb-7 text-white"
                >
                  Seus exames<br />e receitas, sempre com você.
                </motion.h1>

                {/* Descrição */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[16px] sm:text-[18px] max-w-[44ch] mb-8 sm:mb-9 text-white/95 leading-relaxed font-sans"
                >
                  Menos papéis espalhados. Mais facilidade para guardar, encontrar e levar seus documentos à consulta.
                </motion.p>

                {/* Botões de Ação */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-wrap items-center gap-3.5"
                >
                  <motion.a
                    href="#recursos"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="inline-flex items-center justify-center gap-2.5 h-[54px] px-7 rounded-[27px] bg-white text-[#2357D9] text-[16px] font-semibold transition-all hover:bg-white/95 shadow-md active:translate-y-0.5 cursor-pointer"
                  >
                    <span>Ver recursos</span>
                    <ArrowRight size={18} />
                  </motion.a>

                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Link
                      href="/criar-conta"
                      className="inline-flex items-center justify-center gap-2 h-[54px] px-6 rounded-[27px] bg-white/10 hover:bg-white/20 text-white border border-white/25 text-[15px] font-medium backdrop-blur-sm transition-all shadow-xs"
                    >
                      Criar conta grátis
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
              {/* Coluna Visual Direita com Imagem e Badges Flutuantes */}
              <motion.div
                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative group"
                >
                  <img
                    src="/images/saude-memora-app.jpg"
                    alt="Mulher à mesa com documentos e celular exibindo o aplicativo Saúde Memora"
                    className="w-full aspect-[666/474] object-cover rounded-[24px] shadow-2xl border border-white/20 block bg-white"
                    loading="eager"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── RECURSOS SECTION ─────────────────────────────────────── */}
        <section id="recursos" className="scroll-mt-24 max-w-[1312px] mx-auto px-6 pt-20 sm:px-8 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[12px] font-bold text-[#2357D9] uppercase tracking-wider mb-3">
              Recursos
            </div>
            <h2 className="text-[30px] sm:text-[38px] lg:text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-[#173754]">
              Um lugar para o que importa.
            </h2>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recursos.map((rec, index) => (
              <motion.div
                key={rec.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-[#F7F9FC] rounded-[20px] p-6 grid grid-cols-[44px_1fr] gap-4 items-start border border-transparent hover:border-[#DFEBFF] hover:bg-[#F3F6FB] hover:shadow-md transition-all cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-[44px] h-[44px] rounded-[12px] bg-[#DFEBFF] text-[#2357D9] flex items-center justify-center flex-none transition-colors group-hover:bg-[#2357D9] group-hover:text-white"
                >
                  {rec.icon}
                </motion.div>
                <div>
                  <h3 className="font-normal text-[20px] text-[#173754] mb-1.5 leading-snug">
                    {rec.title}
                  </h3>
                  <p className="text-[15px] text-[#536C80] leading-[1.55]">
                    {rec.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── CARD DE DESTAQUE: ROTINA E MEDICAMENTOS ───────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.25 } }}
            className="mt-12 bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFC] to-[#EEF4FF] rounded-[28px] border border-[#DCE7F6] p-7 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xs hover:shadow-lg transition-all"
          >
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DFEBFF] text-[#2357D9] text-xs font-bold uppercase tracking-wider mb-3">
                <Activity size={14} />
                <span>Tranquilidade no seu dia a dia</span>
              </div>
              <h3 className="text-[26px] sm:text-[34px] font-bold text-[#173754] leading-[1.2] mb-4">
                Medicamentos, consultas e cuidados sempre em dia.
              </h3>
              <p className="text-[15px] sm:text-[16px] text-[#536C80] leading-relaxed mb-6">
                Tenha clareza sobre suas prescrições e dosagens. O Saúde Memora reúne suas orientações médicas para você não esquecer tratamentos e ter tudo pronto quando precisar retornar ao consultório.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/criar-conta"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#2357D9] text-white text-sm font-bold shadow-md hover:bg-[#1E4DC4] transition-colors"
                  >
                    <span>Começar agora</span>
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2357D9] hover:underline"
                >
                  <span>Ver como funciona</span>
                </a>
              </div>
            </div>
            <div className="lg:col-span-6 overflow-hidden rounded-[20px] shadow-lg border border-white bg-white group">
              <img
                src="/images/rotina-saude.jpg"
                alt="Mulher acompanhando medicamentos, lembretes e rotina de saúde no celular"
                className="w-full aspect-[4/3] object-cover block group-hover:scale-[1.02] transition-transform duration-500"
                loading="lazy"
              />
            </div>
          </motion.div>
        </section>

        {/* ── COMO FUNCIONA SECTION ─────────────────────────────────── */}
        <section id="como-funciona" className="scroll-mt-24 bg-[#1C51BB] text-white mt-20 py-16 sm:py-20 relative overflow-hidden">
          <div className="max-w-[1312px] mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[530px_minmax(0,1fr)] gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -35 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  src="/images/consulta-medica.jpg"
                  alt="Médico e paciente em consulta analisando exames e histórico de saúde no tablet"
                  className="w-full aspect-[530/392] object-cover rounded-[24px] shadow-2xl border border-white/20 block bg-white"
                  loading="lazy"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 35 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="text-[12px] font-bold text-white uppercase tracking-wider mb-2">
                  Como funciona
                </div>
                <h2 className="text-[30px] sm:text-[38px] lg:text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-white mb-8">
                  Da papelada à consulta.<br />Em três passos.
                </h2>

                <div className="grid gap-5">
                  {[
                    { num: '01', title: 'Envie', desc: 'Fotografe o documento ou escolha um PDF.' },
                    { num: '02', title: 'Organize', desc: 'Revise as informações e mantenha seu histórico em ordem.' },
                    { num: '03', title: 'Consulte', desc: 'Mostre seus exames e receitas ao médico, quando precisar.' },
                  ].map((step, index) => (
                    <motion.div
                      key={step.num}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      className="grid grid-cols-[38px_1fr] gap-4.5 items-start group"
                    >
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className="w-[38px] h-[38px] rounded-[12px] bg-white text-[#2357D9] font-bold text-[13px] flex items-center justify-center flex-none shadow-sm"
                      >
                        {step.num}
                      </motion.span>
                      <div>
                        <h3 className="font-normal text-[20px] text-white pt-1 leading-snug">
                          {step.title}
                        </h3>
                        <p className="text-[14px] text-white/90 mt-0.5 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── DÚVIDAS (FAQ) SECTION ─────────────────────────────────── */}
        <section id="duvidas" className="scroll-mt-24 max-w-[1312px] mx-auto px-6 pt-20 sm:px-8 sm:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] gap-8 lg:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-[12px] font-bold text-[#2357D9] uppercase tracking-wider mb-2">
                Dúvidas
              </div>
              <h2 className="text-[30px] sm:text-[38px] lg:text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-[#173754]">
                Bom saber antes<br />de começar.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="divide-y divide-[#EEF3FA]"
            >
              {faqs.map((faq, i) => {
                const isOpen = !!openFaqs[i];
                return (
                  <div key={faq.q} className="py-5 first:pt-0">
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-center justify-between text-left cursor-pointer group"
                    >
                      <span className="font-normal text-[18px] sm:text-[19px] text-[#173754] group-hover:text-[#2357D9] transition-colors">
                        {faq.q}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                        className="text-[#2357D9] font-bold text-lg flex items-center justify-center pl-4 shrink-0"
                      >
                        {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2.5 pb-1 text-[15px] text-[#536C80] leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ── SOBRE SECTION ─────────────────────────────────────────── */}
        <section id="sobre" className="scroll-mt-24 max-w-[1312px] mx-auto px-6 pt-20 sm:px-8 sm:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="text-[12px] font-bold text-[#2357D9] uppercase tracking-wider mb-2">
                Sobre o projeto
              </div>
              <h2 className="text-[30px] sm:text-[38px] lg:text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-[#173754]">
                Sua saúde organizada,<br />sem complicação.
              </h2>
              <p className="mt-4 text-[16px] sm:text-[17px] text-[#536C80] leading-relaxed">
                O Saúde Memora nasceu para que você nunca mais perca exames, laudos ou receitas importantes em gavetas ou pastas antigas. Tudo reunido em um só lugar, seguro e fácil de consultar no dia a dia e na hora da consulta.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5 text-xs sm:text-sm font-semibold text-[#173754]">
                <div className="flex items-center gap-2 bg-[#F1F5F9] px-3.5 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#2357D9]" />
                  <span>Para pacientes e famílias</span>
                </div>
                <div className="flex items-center gap-2 bg-[#F1F5F9] px-3.5 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#2357D9]" />
                  <span>Facilita a consulta médica</span>
                </div>
                <div className="flex items-center gap-2 bg-[#F1F5F9] px-3.5 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#2357D9]" />
                  <span>Privacidade e segurança</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="relative w-full max-w-[420px] p-6 bg-gradient-to-b from-[#F0F5FF] via-white to-[#F8FAFC] rounded-[28px] border border-[#DFE7EF] shadow-md flex flex-col items-center text-center">
                <img
                  src="/images/equipe-medica.jpg"
                  alt="Profissionais de saúde e médicos apoiando o cuidado e organização do paciente"
                  className="w-full h-auto object-contain block max-h-[320px] rounded-2xl"
                  loading="lazy"
                />
                <span className="mt-4 text-xs sm:text-sm font-bold text-[#2357D9]">
                  Pensado para fortalecer a relação entre paciente e médico
                </span>
              </div>
            </motion.div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: <FolderHeart size={22} />,
                title: 'Tudo em um só lugar',
                desc: 'Reúna exames de sangue, laudos e receitas em uma linha do tempo única e clara.',
              },
              {
                icon: <Smartphone size={22} />,
                title: 'Sempre com você',
                desc: 'Acesse seu histórico no celular para consultar ou mostrar ao médico durante a consulta.',
              },
              {
                icon: <User size={22} />,
                title: 'Você no controle',
                desc: 'Total autonomia para adicionar, revisar e excluir seus documentos com facilidade.',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-[#F7F9FC] rounded-[20px] p-6 border border-transparent hover:border-[#DFEBFF] hover:bg-[#F3F6FB] transition-all"
              >
                <div className="w-[44px] h-[44px] rounded-[12px] bg-[#DFEBFF] text-[#2357D9] flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="font-normal text-[20px] text-[#173754] mb-1.5 leading-snug">
                  {card.title}
                </h3>
                <p className="text-[15px] text-[#536C80] leading-[1.55]">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Card do Criador */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 rounded-[24px] border border-[#DFE7EF] bg-[#F7F9FC] p-7 sm:p-9 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#2357D9] text-xl font-bold text-white shadow-sm">
              MR
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2357D9]">
                Criador
              </div>
              <h3 className="mt-1 text-xl font-bold text-[#173754]">
                Matheus Rafael
              </h3>
              <p className="mt-1.5 text-sm text-[#536C80] leading-relaxed">
                Criou o Saúde Memora para simplificar o acesso aos históricos de saúde de forma acolhedora, prática e direta.
              </p>
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-xs font-bold text-[#2357D9]">
                <a
                  href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline transition-colors"
                >
                  LinkedIn ↗
                </a>
                <span>•</span>
                <a
                  href="https://github.com/MatheusRafaDev"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline transition-colors"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-[#536C80]">
            <Info size={15} className="text-[#2357D9] shrink-0" />
            <span>O Saúde Memora é um organizador pessoal de saúde e não substitui avaliação médica profissional.</span>
          </div>
        </section>

        {/* ── CTA BANNER FINAL ─────────────────────────────────────── */}
        <section className="max-w-[1312px] mx-auto px-6 mt-20 sm:px-8 sm:mt-24 mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#14377B] text-white rounded-[32px] p-8 sm:p-11 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
              <div className="w-16 h-16 rounded-[20px] bg-white/[0.07] text-white flex items-center justify-center shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10.5V8a2 2 0 0 0-2-2h-6.5L10 4H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6" />
                  <path d="M18 21s-3-1.8-3-4a1.7 1.7 0 0 1 3-1 1.7 1.7 0 0 1 3 1c0 2.2-3 4-3 4Z" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-[26px] sm:text-[32px] text-white leading-tight">
                  Pronto para organizar sua saúde?
                </h2>
                <p className="mt-1 text-[15px] text-white/90">
                  Comece pelo primeiro documento. Sua conta é grátis.
                </p>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto shrink-0"
            >
              <Link
                href="/criar-conta"
                className="inline-flex items-center justify-center gap-2.5 h-[54px] px-7 rounded-[27px] bg-white text-[#2357D9] text-[16px] font-medium transition-all hover:bg-white/95 shadow-md active:translate-y-0.5 cursor-pointer w-full sm:w-auto"
              >
                Criar conta grátis
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* ── RODAPÉ ──────────────────────────────────────────────── */}
      <PublicPageFooter />
    </motion.div>
  );
}
