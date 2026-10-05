import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function Termos() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Link>
        
        <div>
          <h1 className="text-3xl font-extrabold mb-4">Termos de Uso</h1>
          <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-sm md:prose-base dark:prose-invert">
          <h2 className="text-xl font-bold mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p>
            Ao utilizar o Saúde Memora, você concorda com estes termos de uso. Se não concordar,
            por favor, não utilize a plataforma.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Uso de Inteligência Artificial</h2>
          <p>
            O Saúde Memora utiliza ferramentas de IA de terceiros (como Google Gemini e OCR.space) para extrair
            texto e dados estruturados das imagens de receitas médicas, laudos e exames que você envia.
            Ao aceitar os termos de consentimento, você autoriza o envio dessas imagens para processamento e a armazenagem
            dos resultados para fins de preenchimento do seu prontuário pessoal.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Responsabilidade</h2>
          <p>
            Os dados extraídos pela IA podem conter imprecisões. É de responsabilidade do usuário
            verificar as informações extraídas e validar com seu médico. O Saúde Memora não fornece
            diagnósticos médicos, apenas organiza seu histórico de saúde.
          </p>
        </div>
      </div>
    </div>
  );
}
