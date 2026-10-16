import { Link } from 'wouter';
import { BrandLogo } from '@/components/BrandLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1d2a3d] flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(700px_400px_at_50%_0,#e6eef9,transparent_60%),#fff]">
      <BrandLogo
        iconClassName="h-10 w-10 transition-transform group-hover:scale-105"
        wordmarkClassName="text-[22px] tracking-[-0.03em] text-[#1b3a60]"
      />

      <div className="mt-6 text-[120px] sm:text-[150px] font-extrabold leading-none tracking-[-0.06em] bg-gradient-to-br from-[#1b3a60] to-[#1f7fe0] bg-clip-text text-transparent select-none">
        404
      </div>

      <h1 className="mt-2 mb-2.5 text-[28px] sm:text-[32px] font-extrabold tracking-[-0.03em]">
        Página não encontrada
      </h1>

      <p className="mb-7 max-w-[420px] text-[16px] sm:text-[17px] leading-relaxed text-[#5a6a80]">
        O endereço pode ter mudado ou não existe mais. Vamos te levar de volta ao caminho certo.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-[#1b3a60] px-5 text-[14px] font-bold text-white transition-all hover:bg-[#244d7e]"
        >
          Voltar ao início
        </Link>
        <Link
          href="/visao-geral"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-[#dde3ec] bg-white px-5 text-[14px] font-bold text-[#1d2a3d] transition-all hover:bg-[#f7f9fc]"
        >
          Ir para visão geral
        </Link>
      </div>
    </div>
  );
}
