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
  return (
    <div
      className="min-h-screen bg-white text-[#14211F] flex flex-col selection:bg-[#CFE0FF] selection:text-[#1D4ED8]"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <PublicPageHeader />

      <main className="flex-1">
        {/* ── Hero Section em Azul Oficial (#193B9E) com Degradê ──────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1E5ECC] via-[#193B9E] to-[#122568] text-white">
          <div className="h-20 sm:h-24 lg:h-28 shrink-0" aria-hidden="true" />

          <div className="relative z-10 max-w-[1000px] mx-auto px-6 sm:px-12 py-10 sm:py-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold tracking-[0.12em] text-white uppercase border border-white/20 backdrop-blur-xs">
              Documento Legal
            </div>
            <h1 className="mt-3 mb-2 text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-white">
              Política de Privacidade
            </h1>
            <p className="m-0 text-sm sm:text-base text-white/85">Última atualização: 12 de outubro de 2026</p>
          </div>
        </section>

        {/* ── Content Layout ──────────────────────────────────────── */}
        <div className="mx-auto max-w-[1000px] px-6 py-14 sm:px-12">
          <div className="space-y-9">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="mb-2.5 text-2xl font-bold tracking-tight text-[#14211F]">
                  {section.title}
                </h2>
                <p className="text-[16px] leading-[1.8] text-[#5B6878]">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <PublicPageFooter />
    </div>
  );
}
