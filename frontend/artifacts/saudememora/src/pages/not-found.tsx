import { Link } from 'wouter';
import { ArrowLeft, FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-6 p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4">
          <FileSearch size={40} />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent mb-2">Erro 404</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.06em] text-foreground">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link href="/visao-geral" className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>
      </div>
    </div>
  );
}
