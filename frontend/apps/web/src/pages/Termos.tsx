import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Termos() {
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
              Termos de Uso
            </h1>
            <p className="m-0 text-sm sm:text-base text-white/85">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </section>

        {/* ── Content Container ────────────────────────────────────── */}
        <div className="max-w-[1000px] mx-auto px-6 sm:px-12 py-14">
          <div className="flex-1 space-y-10">
            <section id="sobre" className="scroll-mt-28">
              <h2 className="text-2xl font-bold tracking-tight text-[#14211F] mb-2.5">
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
              <h2 className="text-2xl font-bold tracking-tight text-[#14211F] mb-2.5">
                2. O que o serviço não é
              </h2>
              <div className="p-4 rounded-2xl bg-[#FFF5F3] border border-[#E8664A]/30 mb-3">
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
              <h2 className="text-2xl font-bold tracking-tight text-[#14211F] mb-2.5">
                3. Dados extraídos
              </h2>
              <p className="text-[15px] sm:text-base leading-relaxed text-[#5B6878]">
                Os dados extraídos por inteligência artificial podem conter imprecisões
                ou omissões e devem ser conferidos por você na tela de detalhes do documento antes da confirmação.
                Você é responsável por validar e retificar qualquer dado inserido no seu prontuário digital.
              </p>
            </section>

            <section id="responsabilidades" className="scroll-mt-28">
              <h2 className="text-2xl font-bold tracking-tight text-[#14211F] mb-2.5">
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
