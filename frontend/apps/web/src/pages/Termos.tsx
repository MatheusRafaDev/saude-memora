import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Termos() {
  return (
    <div className="min-h-screen bg-white text-[#14211F] font-sans">
      <PublicPageHeader />
      <main className="flex-1 page-transition-enter">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#F4F7FC] to-white px-6 sm:px-12 py-16 border-b border-[#E3E8F0]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-xs font-bold tracking-[0.16em] text-[#1D4ED8] uppercase">
            Documento Legal
          </div>
          <h1 className="mt-2.5 mb-2 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[#14211F]">
            Termos de Uso
          </h1>
          <p className="m-0 text-sm sm:text-base text-[#5B6878]">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </section>

      {/* Content Container */}
      <div className="max-w-[1000px] mx-auto px-6 sm:px-12 py-14">
        {/* Legal Text */}
        <div className="flex-1 space-y-10">
          <section id="sobre" className="scroll-mt-28">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#14211F] mb-2.5">
              1. Sobre o serviço
            </h2>
            <p className="text-[15px] sm:text-base leading-relaxed text-[#5B6878]">
              O Saúde Memora é uma ferramenta de organização pessoal de informações de saúde.
              A plataforma permite a digitalização, catalogação e consulta unificada de exames, receitas,
              atestados e dados clínicos, facilitando o acompanhamento do histórico pelo próprio paciente
              e a apresentação dos dados em consultas médicas.
            </p>
          </section>

          <section id="nao-e" className="scroll-mt-28">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#14211F] mb-2.5">
              2. O que o serviço não é
            </h2>
            <div className="p-4 rounded-xl bg-[#FDE1DA] border border-[#E8664A]/30 mb-3">
              <p className="text-[14px] leading-relaxed text-[#9B2C16] font-medium m-0">
                Não realiza diagnósticos, não substitui profissionais de saúde nem atendimento de emergência.
                Em emergência médica no Brasil, ligue imediatamente para o <strong>192 (SAMU)</strong> ou dirija-se à UPA/Pronto-Socorro mais próximo.
              </p>
            </div>
            <p className="text-[15px] sm:text-base leading-relaxed text-[#5B6878]">
              O Saúde Memora não prescreve tratamentos nem substitui o julgamento clínico individual de médicos,
              enfermeiros ou farmacêuticos. As respostas e resumos gerados pelo assistente virtual devem ser
              utilizados estritamente para suporte à organização pessoal do usuário.
            </p>
          </section>

          <section id="dados" className="scroll-mt-28">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#14211F] mb-2.5">
              3. Dados extraídos
            </h2>
            <p className="text-[15px] sm:text-base leading-relaxed text-[#5B6878]">
              Os dados extraídos por inteligência artificial podem conter imprecisões
              ou omissões e devem ser conferidos por você na tela de detalhes do documento antes da confirmação.
              Você é responsável por validar e retificar qualquer dado inserido no seu prontuário digital.
            </p>
          </section>

          <section id="responsabilidades" className="scroll-mt-28">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#14211F] mb-2.5">
              4. Responsabilidades
            </h2>
            <p className="text-[15px] sm:text-base leading-relaxed text-[#5B6878]">
              Você é responsável por manter a confidencialidade de suas credenciais de acesso e pela veracidade
              dos documentos que escolhe carregar na plataforma. O Saúde Memora compromete-se a aplicar padrões
              modernos de criptografia e proteção de dados em conformidade com a LGPD.
            </p>
          </section>
        </div>
      </div>
      </main>

      <PublicPageFooter />
    </div>
  );
}
