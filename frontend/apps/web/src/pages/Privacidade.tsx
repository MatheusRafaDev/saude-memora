import { Link } from 'wouter';
import { ArrowLeft, FileText, ShieldCheck, Trash2 } from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicPageHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8 md:py-12">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} className="mr-2" /> Voltar ao início
        </Link>

        <header>
          <h1 className="mb-4 text-3xl font-extrabold">Privacidade, sem complicação</h1>
          <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          <p className="mt-4 text-base leading-7 text-foreground">
            Você escolhe quais informações de saúde adicionar. Veja abaixo, em linguagem simples, o que acontece com os arquivos enviados.
          </p>
        </header>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <ShieldCheck size={19} className="text-primary" /> O caminho do seu arquivo
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5">
              <li>O arquivo é enviado ao SaúdeMemora para leitura e organização das informações.</li>
              <li>
                Quando você autoriza o processamento por inteligência artificial, o sistema pode encaminhar o arquivo a serviços externos de OCR e IA, como OCR.space, Google Gemini e Groq, conforme a etapa usada.
              </li>
              <li>
                As imagens originais ficam no Cloudinary, em armazenamento autenticado e não público. Os dados do documento, como título, texto extraído e resumo, ficam no banco de dados da plataforma.
              </li>
            </ol>
            <p className="mt-4">
              Esses serviços externos participam do processamento do arquivo. Não envie documentos de outras pessoas sem autorização. Você pode revogar o consentimento para impedir novos processamentos por IA; isso não apaga documentos que já foram salvos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Como excluir um documento</h2>
            <p className="mt-2">
              Abra <Link href="/documentos" className="font-semibold text-primary underline underline-offset-4">Meus documentos</Link>, abra o menu do documento e escolha “Apagar”. A imagem e os dados associados são removidos da sua lista.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">Como excluir sua conta</h2>
            <p className="mt-2">
              Em <Link href="/perfil" className="font-semibold text-primary underline underline-offset-4">Perfil</Link>, escolha “Deletar minha conta” e confirme com sua senha. O acesso é encerrado e a exclusão dos dados e arquivos é agendada para remoção pelo sistema; ela pode levar algum tempo para ser concluída.
            </p>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText size={19} className="text-primary" /> Precisão e uso dos dados
            </h2>
            <p className="mt-2">
              A leitura automática pode errar. Confira os dados extraídos antes de usá-los ou compartilhá-los com um profissional de saúde. O SaúdeMemora organiza informações e não faz diagnóstico nem substitui avaliação médica.
            </p>
            <p className="mt-3">
              Para uma emergência, procure atendimento de urgência ou ligue para o serviço de emergência da sua região.
            </p>
          </section>

          <p className="flex items-start gap-2 border-t border-border pt-5">
            <Trash2 size={17} className="mt-1 shrink-0 text-muted-foreground" />
            <span>
              Para gerenciar consentimento, documentos ou exclusão da conta, use a área autenticada do aplicativo. Consulte também os <Link href="/termos" className="font-semibold text-primary underline underline-offset-4">Termos de Uso</Link>.
            </span>
          </p>
        </div>
      </main>
      <PublicPageFooter />
    </div>
  );
}
