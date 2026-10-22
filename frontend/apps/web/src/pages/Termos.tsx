import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Termos() {
  return (
    <div
      className="min-h-screen bg-white text-[#173754] flex flex-col font-sans selection:bg-[#CFE0FF] selection:text-[#1D4ED8]"
    >
      <PublicPageHeader variant="blue" />
      <main className="flex-1">
        {/* ── Hero Section ─────────────────────────────────────────── */}
        <section className="bg-[#1C51BB] text-white py-14 sm:py-18">
          <div className="relative z-10 max-w-[1000px] mx-auto px-6 sm:px-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold tracking-[0.12em] text-white uppercase border border-white/20">
              Documento Legal
            </div>
            <h1
              className="mt-4 mb-2 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white"
            >
              Termos de Uso
            </h1>
            <p className="m-0 text-sm sm:text-base text-white/80">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </section>

        {/* ── Content Container ────────────────────────────────────── */}
        <div className="max-w-[1000px] mx-auto px-6 sm:px-12 py-14">
          <div className="flex-1 space-y-10">
            <section id="sobre" className="scroll-mt-28">
              <h2
                className="text-2xl font-bold tracking-tight text-[#173754] mb-2.5"
              >
                1. Sobre o serviço
              </h2>
              <p className="text-[15px] sm:text-base leading-relaxed text-[#536C80]">
                O Saúde Memora é uma ferramenta de organização pessoal de informações de saúde.
                A plataforma permite a digitalização, catalogação e consulta unificada de exames, receitas,
                atestados e dados clínicos, facilitando o acompanhamento do histórico pelo próprio paciente
                e a apresentação dos dados em consultas médicas.
              </p>
            </section>

            <section id="nao-e" className="scroll-mt-28">
              <h2
                className="text-2xl font-bold tracking-tight text-[#173754] mb-2.5"
              >
                2. O que o serviço não é
              </h2>
              <div className="p-4 rounded-2xl bg-[#FFF5F3] border border-[#E8664A]/30 mb-3">
                <p className="text-[14px] leading-relaxed text-[#9B2C16] font-medium m-0">
                  Não realiza diagnósticos, não substitui profissionais de saúde nem atendimento de emergência.
                  Em emergência médica no Brasil, ligue imediatamente para o <strong>192 (SAMU)</strong> ou dirija-se à UPA/Pronto-Socorro mais próximo.
                </p>
              </div>
              <p className="text-[15px] sm:text-base leading-relaxed text-[#536C80]">
                O Saúde Memora não prescreve tratamentos nem substitui o julgamento clínico individual de médicos,
                enfermeiros ou farmacêuticos. As respostas e resumos gerados pelo assistente virtual devem ser
                utilizados estritamente para suporte à organização pessoal do usuário.
              </p>
            </section>

            <section id="dados" className="scroll-mt-28">
              <h2
                className="text-2xl font-bold tracking-tight text-[#173754] mb-2.5"
              >
                3. Responsabilidade pelos dados
              </h2>
              <p className="text-[15px] sm:text-base leading-relaxed text-[#536C80]">
                O usuário é o único responsável pela veracidade e exatidão dos documentos e informações que insere na plataforma.
                A leitura automática assistida por OCR e inteligência artificial visa facilitar o preenchimento,
                mas pode conter imprecisões e deve ser sempre conferida pelo usuário em relação ao documento original.
              </p>
            </section>

            <section id="privacidade-seguranca" className="scroll-mt-28">
              <h2
                className="text-2xl font-bold tracking-tight text-[#173754] mb-2.5"
              >
                4. Privacidade e segurança
              </h2>
              <p className="text-[15px] sm:text-base leading-relaxed text-[#536C80]">
                Adotamos medidas técnicas e administrativas aptas a proteger seus dados pessoais e dados sensíveis de saúde,
                em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Seus dados não são comercializados
                nem compartilhados para finalidades comerciais ou publicitárias de terceiros.
              </p>
            </section>

            <section id="encerramento" className="scroll-mt-28">
              <h2
                className="text-2xl font-bold tracking-tight text-[#173754] mb-2.5"
              >
                5. Exclusão de conta e encerramento
              </h2>
              <p className="text-[15px] sm:text-base leading-relaxed text-[#536C80]">
                Você pode excluir documentos individualmente ou encerrar sua conta a qualquer momento por meio das configurações de perfil.
                Ao solicitar a exclusão da conta, seus documentos e dados pessoais são removidos definitivamente dos nossos servidores ativos.
              </p>
            </section>
          </div>
        </div>
      </main>
      <PublicPageFooter />
    </div>
  );
}
