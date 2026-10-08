import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type LegalDocument = 'terms' | 'privacy';

const documents = {
  terms: {
    title: 'Termos de Uso',
    sections: [
      {
        title: '1. Aceitação dos Termos',
        paragraphs: [
          'Ao utilizar o SaúdeMemora, você concorda com estes termos de uso. Se não concordar, por favor, não utilize a plataforma.',
        ],
      },
      {
        title: '2. Uso de Inteligência Artificial',
        paragraphs: [
          'O SaúdeMemora utiliza ferramentas de IA de terceiros (como Google Gemini e OCR.space) para extrair texto e dados estruturados das imagens de receitas médicas, laudos e exames que você envia. Ao aceitar os termos de consentimento, você autoriza o envio dessas imagens para processamento e a armazenagem dos resultados para fins de preenchimento do seu prontuário pessoal.',
        ],
      },
      {
        title: '3. Responsabilidade',
        paragraphs: [
          'Os dados extraídos pela IA podem conter imprecisões. É de responsabilidade do usuário verificar as informações extraídas e validar com seu médico. O SaúdeMemora não fornece diagnósticos médicos, apenas organiza seu histórico de saúde.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    sections: [
      {
        title: '1. Coleta de Dados',
        paragraphs: [
          'Coletamos apenas os dados necessários para o funcionamento do seu prontuário eletrônico: informações de perfil que você nos fornece e imagens de exames/receitas que você decide enviar para processamento.',
        ],
      },
      {
        title: '2. Processamento com IA',
        paragraphs: [
          'Para oferecer a extração automática de dados, utilizamos serviços de IA (como Groq, Gemini). Apenas processamos seus arquivos caso você tenha dado o consentimento explícito em nossa plataforma. Caso o consentimento seja revogado, novos arquivos não serão processados.',
          'Documentos identificados como não relacionados à saúde são descartados imediatamente e não são armazenados em nossos servidores ou na nuvem (Cloudinary).',
        ],
      },
      {
        title: '3. Armazenamento e Exclusão',
        paragraphs: [
          'Os dados são armazenados de forma criptografada sempre que possível. Você pode solicitar a exclusão da sua conta e de todos os seus dados a qualquer momento através da área "Perfil" do aplicativo.',
        ],
      },
    ],
  },
} satisfies Record<LegalDocument, {
  title: string;
  sections: { title: string; paragraphs: string[] }[];
}>;

export function LegalDocumentDialog({
  document,
  open,
  onOpenChange,
}: {
  document: LegalDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const content = documents[document];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6 text-sm leading-6 text-muted-foreground">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 font-semibold text-foreground">{section.title}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-2">{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
