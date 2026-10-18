import { useState } from 'react';
import { Link } from 'wouter';
import {
  ShieldCheck,
  FileText,
  Lock,
  Trash2,
  Upload,
  Search,
  Pill,
  FlaskConical,
  Smartphone,
  FolderHeart,
  Syringe,
  ClipboardCheck,
  FileBadge,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Heart,
  Droplets,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';
import { BrandLogo } from '@/components/BrandLogo';

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'O Saúde Memora substitui uma consulta médica?',
      a: 'Não. O Saúde Memora é um organizador pessoal de saúde. Ele reúne seus exames, receitas e laudos para você ter autonomia, mas não faz diagnósticos nem substitui a avaliação de um profissional de saúde.',
    },
    {
      q: 'Meus dados e exames estão seguros?',
      a: 'Sim. Seus dados de saúde são estritamente confidenciais e protegidos com criptografia. Seguimos com rigor a Lei Geral de Proteção de Dados (LGPD) e o sigilo médico. Suas informações nunca são vendidas ou compartilhadas com terceiros.',
    },
    {
      q: 'Posso conferir e editar as informações extraídas dos documentos?',
      a: 'Sempre. Quando você envia um exame ou receita, as informações lidas são apresentadas para você revisar e corrigir antes de salvar definitivamente no seu histórico.',
    },
    {
      q: 'Posso apagar meus exames ou excluir minha conta?',
      a: 'Sim, a qualquer momento. Você tem controle total: pode excluir documentos individuais ou solicitar a eliminação completa e definitiva de toda a sua conta com um clique.',
    },
    {
      q: 'Funciona no celular sem precisar instalar aplicativo pesado?',
      a: 'Sim! O Saúde Memora funciona perfeitamente no navegador de qualquer smartphone (Android e iPhone) e computador, com carregamento rápido e suporte a atalho na tela inicial.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#14211F] flex flex-col selection:bg-[#CFE0FF] selection:text-[#1D4ED8]">
      <PublicPageHeader />

      <main className="flex-1 page-transition-enter">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-[#E3E8F0] bg-gradient-to-b from-[#F8FAFC] via-white to-white px-4 py-12 sm:px-8 sm:py-20 lg:py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
            
            {/* Left Column: Human, trustworthy value proposition */}
            <div className="w-full min-w-0 flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1D4ED8]/20 bg-[#CFE0FF]/60 px-3.5 py-1.5 text-xs font-bold text-[#1D4ED8] shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#1D4ED8] animate-pulse" />
                Histórico de Saúde Pessoal & Familiar
              </div>

              <h1 className="mt-5 text-[36px] sm:text-[52px] lg:text-[58px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#14211F]">
                Seus exames, receitas e consultas reunidos em um{' '}
                <span className="text-[#1D4ED8]">só lugar seguro.</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#5B6878] max-w-[560px] mx-auto lg:mx-0">
                A tranquilidade de ter seu histórico médico completo na palma da mão — pronto para qualquer consulta, retorno ou momento de emergência.
              </p>

              {/* Action buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/entrar?mode=register"
                  className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-7 text-base font-bold text-white shadow-sm transition-all hover:bg-[#1E40AF] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Começar gratuitamente</span>
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#como-funciona"
                  className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center rounded-xl border border-[#D5DCE6] bg-white px-6 text-base font-bold text-[#14211F] transition-all hover:bg-[#F4F7FC] hover:border-[#CFE0FF]"
                >
                  Conhecer como funciona
                </a>
              </div>

              {/* Reassuring trust badges */}
              <div className="mt-8 pt-6 border-t border-[#E3E8F0] flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-[13px] font-semibold text-[#5B6878]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#1D4ED8]" />
                  Conforme com a LGPD
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#10B981]" />
                  Você confere e valida tudo
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={15} className="text-[#1D4ED8]" />
                  Criptografia de ponta a ponta
                </span>
              </div>
            </div>

            {/* Right Column: Realistic Interactive Product Showcase (No fake OS dots) */}
            <div className="w-full flex-1 max-w-[500px] lg:max-w-[520px]">
              <div className="relative rounded-[32px] border border-[#DCE4F0] bg-[#F8FAFD] p-4 sm:p-6 shadow-xl">
                
                {/* Visual Item 1: Realistic Digital Health Card */}
                <div className="relative overflow-hidden rounded-[24px] border border-[#1D4ED8]/30 bg-gradient-to-br from-[#CFE0FF] via-[#DBE8FC] to-[#CFE0FF] p-5 sm:p-6 text-[#14211F] shadow-md">
                  {/* Subtle guilloche wave */}
                  <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/40 blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-[#1D4ED8] border border-[#1D4ED8]/20 shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8]" />
                        CARTEIRINHA DIGITAL
                      </span>
                    </div>
                    <BrandLogo withLink={false} iconClassName="h-6 w-6" wordmarkClassName="text-sm font-bold" layout="inline" />
                  </div>

                  <div className="mt-4">
                    <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#14211F]">
                      Maria Clara Santos
                    </div>
                    <div className="text-xs font-bold text-[#1D4ED8] mt-0.5">
                      Plano Unimed Nacional · Nº 0824 1928 3491
                    </div>
                  </div>

                  {/* Badges: Sangue & Alergia */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-white/85 p-2.5 border border-[#1D4ED8]/15 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8] flex items-center gap-1">
                        <Droplets size={11} /> TIPO SANGUÍNEO
                      </div>
                      <div className="text-base font-extrabold text-[#14211F]">A positivo (A+)</div>
                    </div>
                    <div className="rounded-xl bg-[#FFF5F3] p-2.5 border border-[#E8664A]/25 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#E8664A] flex items-center gap-1">
                        <AlertCircle size={11} /> ALERGIA
                      </div>
                      <div className="text-base font-extrabold text-[#9B2C16] truncate">Dipirona</div>
                    </div>
                  </div>
                </div>

                {/* Visual Item 2: Real Clinical Exam Summary Tile */}
                <div className="mt-3.5 rounded-2xl border border-[#E3E8F0] bg-white p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                      <FlaskConical size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#14211F] truncate">Hemograma Completo</div>
                      <div className="text-xs text-[#5B6878]">Laboratório Fleury · 14 Outubro</div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#E8F8F0] px-2.5 py-1 text-xs font-bold text-[#059669] border border-[#10B981]/25">
                    Normal ✓
                  </span>
                </div>

                {/* Visual Item 3: Continuous Medication Tile */}
                <div className="mt-3 rounded-2xl border border-[#E3E8F0] bg-white p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDE1DA] text-[#E8664A]">
                      <Pill size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#14211F] truncate">Losartana Potássica 50mg</div>
                      <div className="text-xs text-[#5B6878]">Uso contínuo · 1x ao dia pela manhã</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#1D4ED8]">
                    Ativo
                  </span>
                </div>

                {/* Floating Reassurance Tag */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#5B6878]">
                  <ShieldCheck size={14} className="text-[#1D4ED8]" />
                  <span>Histórico completo acessível em 1 clique durante suas consultas</span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ── 4 Key Pillars of Trust ──────────────────────────────── */}
        <section className="border-b border-[#E3E8F0] bg-white px-4 py-12 sm:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14211F]">Privacidade Médica Total</h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#5B6878]">
                    Seus exames pertencem exclusivamente a você. Seus dados nunca são vendidos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <FolderHeart size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14211F]">Tudo em um só Histórico</h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#5B6878]">
                    Diga adeus a papéis amassados e gavetas cheias de laudos esquecidos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14211F]">Você Confere e Aprova</h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#5B6878]">
                    Toda informação lida é revisada por você antes de ser adicionada ao histórico.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#CFE0FF] text-[#1D4ED8]">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14211F]">Liberdade de Exclusão</h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#5B6878]">
                    Remova qualquer exame ou exclua toda a sua conta com facilidade a qualquer hora.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Como funciona (3 Passos Realistas) ───────────────────── */}
        <section id="como-funciona" className="border-b border-[#E3E8F0] bg-[#F4F7FC] px-4 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
              Praticidade no seu dia a dia
            </div>
            <h2 className="mt-2.5 text-[28px] sm:text-[40px] font-extrabold tracking-[-0.03em] text-[#14211F]">
              Do papel ao seu histórico digital em três passos simples.
            </h2>
            <p className="mt-3 max-w-[620px] text-sm sm:text-base leading-relaxed text-[#5B6878]">
              Sem formulários intermináveis ou processos burocráticos. Organize sua saúde com autonomia e clareza.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              
              {/* Passo 1 */}
              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D4ED8] text-sm font-extrabold text-white">
                      1
                    </span>
                    <h3 className="text-xl font-bold text-[#14211F]">Envie o arquivo</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#5B6878]">
                    Tire uma foto nítida pelo celular ou anexe o arquivo PDF que você recebeu do laboratório ou hospital.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-[#CFE0FF] bg-[#F8FAFD] p-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#CFE0FF] text-[#1D4ED8]">
                    <Upload size={18} />
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#14211F]">PDF, Foto ou Escaneado</div>
                  <div className="text-[11px] text-[#5B6878]">Exames, receitas, laudos e atestados</div>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D4ED8] text-sm font-extrabold text-white">
                      2
                    </span>
                    <h3 className="text-xl font-bold text-[#14211F]">Confira e aprove</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#5B6878]">
                    O sistema identifica datas, biomarcadores e médicos responsáveis. Você confere tudo lado a lado antes de salvar.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-[#E3E8F0] bg-[#F8FAFD] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-[#E3E8F0]">
                    <span className="font-semibold text-[#14211F]">Data do Exame</span>
                    <span className="font-mono text-[#1D4ED8] font-bold">14/10/2026</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#E8F8F0] p-2.5 border border-[#10B981]/25 text-[#059669]">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Você no controle
                    </span>
                    <span className="font-bold">Aprovado</span>
                  </div>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="rounded-[24px] border border-[#E3E8F0] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D4ED8] text-sm font-extrabold text-white">
                      3
                    </span>
                    <h3 className="text-xl font-bold text-[#14211F]">Acesse em segundos</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#5B6878]">
                    Pesquise por medicamento, especialista ou biomarcador. Tudo organizado cronologicamente para você e seu médico.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-[#E3E8F0] bg-[#F8FAFD] p-3.5">
                  <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E3E8F0] px-3 py-2 text-xs text-[#5B6878]">
                    <Search size={14} />
                    <span>Buscar: "colesterol", "cardiologista"...</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#CFE0FF] px-2 py-0.5 text-[10px] font-bold text-[#1D4ED8]">Exames</span>
                    <span className="rounded-full bg-white border border-[#E3E8F0] px-2 py-0.5 text-[10px] font-bold text-[#14211F]">Receitas</span>
                    <span className="rounded-full bg-white border border-[#E3E8F0] px-2 py-0.5 text-[10px] font-bold text-[#14211F]">Vacinas</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Documento Original ao lado dos Dados Organizados ──────── */}
        <section className="border-b border-[#E3E8F0] bg-white px-4 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-12 lg:flex-row lg:gap-16">
            
            {/* Visual Comparison: Real Clinical Values (Zero generic gray bars) */}
            <div className="w-full flex-1 max-w-[560px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Left Card: Documento Original Simulado */}
                <div className="rounded-[22px] border border-[#E3E8F0] bg-[#FAFCFF] p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#E3E8F0] pb-3 text-xs font-bold text-[#5B6878]">
                    <span>DOCUMENTO ORIGINAL</span>
                    <FileText size={15} />
                  </div>
                  
                  {/* Real medical report excerpt */}
                  <div className="mt-3 text-xs font-mono space-y-2.5">
                    <div className="font-bold text-[#14211F]">LABORATÓRIO CENTRAL</div>
                    <div className="text-[11px] text-[#5B6878]">Dr. Roberto Alves · CRM 104829</div>
                    <div className="h-px bg-[#E3E8F0] my-2" />
                    <div>
                      <span className="text-[#5B6878] block text-[10px]">GLICEMIA DE JEJUM</span>
                      <span className="font-bold text-[#14211F]">88 mg/dL</span>
                      <span className="text-[10px] text-[#5B6878] block">Ref: 70 a 99 mg/dL</span>
                    </div>
                    <div>
                      <span className="text-[#5B6878] block text-[10px]">COLESTEROL TOTAL</span>
                      <span className="font-bold text-[#14211F]">172 mg/dL</span>
                      <span className="text-[10px] text-[#5B6878] block">Ref: &lt; 190 mg/dL</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Ficha Extraída e Conferida */}
                <div className="rounded-[22px] border border-[#1D4ED8]/30 bg-gradient-to-b from-[#F0F5FF] to-white p-5 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#1D4ED8]/20 pb-3 text-xs font-bold text-[#1D4ED8]">
                    <span>ORGANIZADO NO APP</span>
                    <ShieldCheck size={16} />
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="rounded-xl bg-white p-2.5 border border-[#CFE0FF] shadow-2xs">
                      <div className="text-[10px] font-bold uppercase text-[#1D4ED8]">Glicemia</div>
                      <div className="text-base font-extrabold text-[#14211F]">88 mg/dL</div>
                      <div className="text-[11px] text-[#059669] font-semibold">Dentro do normal ✓</div>
                    </div>
                    <div className="rounded-xl bg-white p-2.5 border border-[#CFE0FF] shadow-2xs">
                      <div className="text-[10px] font-bold uppercase text-[#1D4ED8]">Colesterol Total</div>
                      <div className="text-base font-extrabold text-[#14211F]">172 mg/dL</div>
                      <div className="text-[11px] text-[#059669] font-semibold">Desejável ✓</div>
                    </div>
                    <div className="rounded-lg bg-[#E8F8F0] px-2.5 py-1 text-[11px] font-bold text-[#059669] text-center border border-[#10B981]/25">
                      ✓ Conferido pelo paciente
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Explicação Humana */}
            <div className="w-full flex-1">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Transparência e Confiança
              </div>
              <h2 className="mt-2.5 text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] text-[#14211F]">
                O documento original sempre ao lado dos dados lidos.
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#5B6878]">
                Nada acontece em uma "caixa preta". Você pode sempre comparar o exame ou receita original com os dados extraídos, ajustar qualquer valor e ter certeza absoluta de que seu prontuário está correto.
              </p>

              <ul className="mt-6 space-y-3 text-sm font-semibold text-[#14211F]">
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white text-xs">
                    ✓
                  </span>
                  <span>Acesso ao PDF ou imagem original a qualquer momento</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white text-xs">
                    ✓
                  </span>
                  <span>Avisos claros de valores que merecem conferência</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-white text-xs">
                    ✓
                  </span>
                  <span>Edição livre de médicos, laboratórios e datas</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* ── Privacidade & Segurança Rigorosa ─────────────────────── */}
        <section className="bg-[#1C2438] px-4 py-16 sm:px-8 sm:py-24 text-white border-b border-[#36425F]">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#CFE0FF]">
              Segurança e Ética Médica
            </div>
            <h2 className="mt-2.5 text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] text-white">
              Seus dados de saúde protegidos sob o mais alto padrão.
            </h2>
            <p className="mt-3 max-w-[620px] text-sm sm:text-base leading-relaxed text-[#A9B6CE]">
              Entendemos a sensibilidade de informações médicas. Construímos o Saúde Memora com privacidade desde o primeiro dia.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-[24px] border border-[#36425F] bg-white/5 p-7 backdrop-blur-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#CFE0FF]">
                  <Lock size={20} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">Conformidade com a LGPD</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A9B6CE]">
                  Consentimento explícito e controle completo sobre todas as autorizações de tratamento de dados.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#36425F] bg-white/5 p-7 backdrop-blur-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#CFE0FF]">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">Criptografia em Repouso e Trânsito</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A9B6CE]">
                  Seus arquivos e prontuários trafegam por canais encriptados e são salvos com segurança de nível bancário.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#36425F] bg-white/5 p-7 backdrop-blur-xs">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#CFE0FF]">
                  <Trash2 size={20} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">Direito ao Esquecimento</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A9B6CE]">
                  Exclua exames individuais ou solicite o apagamento definitivo e irreversível da sua conta a qualquer instante.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section className="bg-white px-4 py-16 sm:px-8 sm:py-24 border-b border-[#E3E8F0]">
          <div className="mx-auto max-w-[860px]">
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#1D4ED8]">
                Tire suas dúvidas
              </div>
              <h2 className="mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em] text-[#14211F]">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="mt-10 divide-y divide-[#E3E8F0]">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className="py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between text-left text-base sm:text-lg font-bold text-[#14211F] transition-colors hover:text-[#1D4ED8]"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F7FC] text-sm text-[#1D4ED8]">
                        <ChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={16} />
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-sm leading-relaxed text-[#5B6878] animate-in fade-in slide-in-from-top-1">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ─────────────────────────────────── */}
        <section className="bg-white px-4 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1200px] rounded-[32px] bg-gradient-to-br from-[#1C2438] via-[#212C45] to-[#171E2E] p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-[620px] text-center lg:text-left">
                <h2 className="text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] text-white leading-tight">
                  Comece a organizar seu histórico de saúde hoje mesmo.
                </h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#A9B6CE]">
                  Crie sua conta gratuitamente em menos de 1 minuto. Sem cartão de crédito, sem mensalidades surpresa.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/entrar?mode=register"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-[#1D4ED8] px-7 text-base font-bold text-white shadow-md transition-all hover:bg-[#1E40AF]"
                >
                  Criar conta gratuita
                </Link>
                <Link
                  href="/entrar"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 text-base font-bold text-white transition-all hover:bg-white/10"
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
