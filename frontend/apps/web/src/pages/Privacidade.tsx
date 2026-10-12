import { useState } from 'react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

const sections = [
  {
    id: 'dados',
    title: '1. Quais dados você adiciona',
    content:
      'Você decide quais documentos e informações adicionar ao seu espaço pessoal. Isso pode incluir receitas médicas, exames laboratoriais, laudos de imagem, atestados e dados de anamnese (como alergias, tipo sanguíneo e condições crônicas). O envio é sempre voluntário e gerido por você.',
  },
  {
    id: 'uso',
    title: '2. Como os dados são usados',
    content:
      'Os documentos são usados exclusivamente para organizar e consultar seu histórico de saúde pessoal, inclusive com apoio de inteligência artificial para leitura e extração de campos, mediante o seu consentimento. Seus dados não são vendidos nem compartilhados com terceiros para fins publicitários.',
  },
  {
    id: 'controle',
    title: '3. Seu controle',
    content:
      'Você tem total autonomia sobre suas informações: pode visualizar o documento original lado a lado com os dados lidos, editar qualquer campo extraído, revogar o consentimento para recursos de IA, apagar documentos individualmente ou solicitar a exclusão definitiva da sua conta a qualquer momento.',
  },
  {
    id: 'contato',
    title: '4. Contato',
    content:
      'Para dúvidas sobre privacidade, exercício dos seus direitos como titular de dados ou suporte, você pode entrar em contato através dos canais de suporte da plataforma ou pelo e-mail suporte@saudememora.com.br.',
  },
];

export default function Privacidade() {
  const [activeSection, setActiveSection] = useState('dados');

  return (
    <div className="min-h-screen bg-white font-sans text-[#1d2a3d] flex flex-col">
      <PublicPageHeader />

      <main className="flex-1">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="border-b border-[#dde3ec] bg-gradient-to-br from-[#eef3fa] via-white via-55% to-[#e8f4f2] px-6 py-16 sm:px-12">
          <div className="mx-auto max-w-[1000px]">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#2f7a70]">
              DOCUMENTO LEGAL
            </div>
            <h1 className="mt-2.5 mb-2 text-[38px] sm:text-[46px] font-extrabold tracking-[-0.04em] text-[#1d2a3d]">
              Política de Privacidade
            </h1>
            <p className="text-[15px] text-[#5a6a80]">Última atualização: 12 de outubro de 2026</p>
          </div>
        </section>

        {/* ── Content Layout ──────────────────────────────────────── */}
        <div className="mx-auto flex max-w-[1000px] flex-col gap-12 px-6 py-14 sm:px-12 md:flex-row">
          <aside className="w-full md:w-60 shrink-0">
            <div className="sticky top-28 flex flex-col gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`rounded-xl px-3.5 py-2.5 text-left text-[14px] transition-colors ${
                    activeSection === section.id
                      ? 'bg-[#f1f4f8] font-bold text-[#1b3a60]'
                      : 'font-medium text-[#5a6a80] hover:bg-[#f1f4f8] hover:text-[#1d2a3d]'
                  }`}
                >
                  {section.title.split('. ')[1]}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 space-y-9">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="mb-2.5 text-[24px] font-bold tracking-[-0.02em] text-[#1d2a3d]">
                  {section.title}
                </h2>
                <p className="text-[16px] leading-[1.8] text-[#5a6a80]">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <PublicPageFooter variant="compact" />
    </div>
  );
}
