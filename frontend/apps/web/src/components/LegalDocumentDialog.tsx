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
          'Os dados extraídos pela IA podem conter imprecisões. Confira as informações e valide-as com seu médico. O SaúdeMemora organiza seu histórico, não faz diagnósticos e não substitui avaliação médica ou atendimento de emergência.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    sections: [
      {
        title: '1. Dados e processamento',
        paragraphs: [
          'Guardamos os dados de perfil e os documentos de saúde que você escolhe adicionar. Para leitura automática, arquivos podem ser encaminhados a serviços externos de OCR e inteligência artificial, como OCR.space, Google Gemini e Groq. O processamento por IA requer seu consentimento; revogá-lo impede novos processamentos, mas não apaga o que já foi salvo.',
        ],
      },
      {
        title: '2. Armazenamento e exclusão',
        paragraphs: [
          'As imagens originais são armazenadas no Cloudinary em modo autenticado; os dados extraídos, como texto e resumo, ficam no banco de dados da plataforma. Você pode apagar documentos na lista de documentos ou solicitar a exclusão da conta, confirmando sua senha, em Perfil. A exclusão da conta é agendada e pode levar algum tempo para ser concluída.',
        ],
      },
      {
        title: '3. Uso responsável',
        paragraphs: [
          'A extração automática pode conter erros. Confira as informações antes de usá-las. O SaúdeMemora organiza informações e não substitui avaliação médica nem atendimento de emergência.',
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
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5 pr-14 text-left sm:px-8 sm:py-6">
          <DialogTitle className="text-xl leading-tight">{content.title}</DialogTitle>
          <DialogDescription>
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          <div className="space-y-7 text-sm leading-7 text-muted-foreground">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 font-semibold leading-6 text-foreground">{section.title}</h3>
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
