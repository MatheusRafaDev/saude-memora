import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { PublicPageHeader } from '@/components/PublicPageHeader';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicPageHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8 md:py-12">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} className="mr-2" /> Voltar ao início
        </Link>

        <div>
          <h1 className="text-3xl font-extrabold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-sm md:prose-base dark:prose-invert">
          <h2 className="text-xl font-bold mt-8 mb-4">1. Coleta de Dados</h2>
          <p>
            Coletamos apenas os dados necessários para o funcionamento do seu prontuário eletrônico:
            informações de perfil que você nos fornece e imagens de exames/receitas que você decide
            enviar para processamento.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Processamento com IA</h2>
          <p>
            Para oferecer a extração automática de dados, utilizamos serviços de IA (como Groq, Gemini).
            Apenas processamos seus arquivos caso você tenha dado o consentimento explícito em nossa plataforma.
            Caso o consentimento seja revogado, novos arquivos não serão processados.
          </p>
          <p>
            Documentos identificados como não relacionados à saúde são descartados imediatamente e
            não são armazenados em nossos servidores ou na nuvem (Cloudinary).
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Armazenamento e Exclusão</h2>
          <p>
            Os dados são armazenados de forma criptografada sempre que possível.
            Você pode solicitar a exclusão da sua conta e de todos os seus dados a qualquer momento
            através da área "Perfil" do aplicativo.
          </p>
        </div>
      </main>
    </div>
  );
}
