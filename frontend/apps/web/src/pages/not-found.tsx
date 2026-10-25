import { Link } from 'wouter';
import { BrandLogo } from '@/components/BrandLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] flex-1 bg-white font-sans text-[#14211F] flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(700px_400px_at_50%_0,#CFE0FF/30,transparent_60%),#fff]">
      <BrandLogo
        iconClassName="h-10 w-10 transition-transform group-hover:scale-105"
        wordmarkClassName="text-[22px] text-[#14211F]"
      />

      <div className="mt-6 text-[110px] sm:text-[140px] font-bold leading-none tracking-[-0.04em] font-serif bg-gradient-to-br from-[#14211F] to-[#1D4ED8] bg-clip-text text-transparent select-none">
        404
      </div>

      <h1 className="mt-2 mb-2.5 text-[28px] sm:text-[34px] font-semibold tracking-[-0.03em] font-serif text-[#14211F]">
        Página não encontrada
      </h1>

      <p className="mb-7 max-w-[420px] text-[16px] sm:text-[17px] leading-relaxed text-[#5B6878]">
        O endereço pode ter mudado ou não existe mais. Vamos te levar de volta ao caminho certo.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-[#1D4ED8] px-6 text-[14px] font-bold text-white transition-all hover:bg-[#1e40af]"
        >
          Voltar ao início
        </Link>
        <Link
          href="/visao-geral"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-[#E3E8F0] bg-white px-6 text-[14px] font-bold text-[#14211F] transition-all hover:bg-[#F4F7FC]"
        >
          Ir para visão geral
        </Link>
      </div>
    </div>
  );
}
