import { useState } from 'react';
import { Link } from 'wouter';
import {
  FileText,
  Pill,
  Plus,
  Shield,
  ArrowRight,
  Activity,
  ZoomIn,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Stethoscope,
  HeartPulse,
  CalendarDays,
  LoaderCircle,
  CreditCard,
  FileSearch,
  FileHeart,
  Syringe,
  Send,
  FileBarChart,
  Layers,
  X,
} from 'lucide-react';
import {
  useGetApiPacientesMe,
  useGetApiFichaMedicaMe,
} from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';
import { triggerEmergencyModal } from '@/lib/emergency-modal';
import { CarteirinhaModal } from '@/components/CarteirinhaModal';
import { BrandLogo } from '@/components/BrandLogo';
import Insights from '@/pages/Insights';

import {
  useDashboardResumo,
  ROTULO_TIPO_DOCUMENTO,
  SEVERIDADE_ALERTA,
  type DashboardBiomarcador,
} from '@/lib/dashboard-summary';

type Indicador = {
  rotulo: string;
  valor: number;
  detalhe: string;
  tom: 'destaque' | 'neutro' | 'atencao' | 'alerta';
  icon: React.ReactNode;
  href?: string;
};

function getTipoIcon(tipo: string) {
  switch (tipo.toLowerCase()) {
    case 'exame':
      return <Activity size={18} className="text-[#1D4ED8]" />;
    case 'receita':
      return <Pill size={18} className="text-[#1D4ED8]" />;
    case 'laudo':
      return <FileSearch size={18} className="text-[#1D4ED8]" />;
    case 'atestado':
      return <FileHeart size={18} className="text-[#1D4ED8]" />;
    case 'vacina':
      return <Syringe size={18} className="text-[#1D4ED8]" />;
    case 'encaminhamento':
      return <Send size={18} className="text-[#1D4ED8]" />;
    case 'relatorio':
      return <FileBarChart size={18} className="text-[#1D4ED8]" />;
    default:
      return <Layers size={18} className="text-[#1D4ED8]" />;
  }
}

function pluralizar(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function formatarFaixa(biomarcador: DashboardBiomarcador) {
  const { refMin, refMax } = biomarcador;
  if (refMin != null && refMax != null) return `Referência ${refMin}–${refMax}`;
  if (refMin != null) return `Referência ≥ ${refMin}`;
  if (refMax != null) return `Referência ≤ ${refMax}`;
  return 'Sem faixa de referência';
}

function valorExibido(biomarcador: DashboardBiomarcador) {
  if (biomarcador.ultimoValor != null) {
    return `${biomarcador.ultimoValor}${biomarcador.unidade ? ` ${biomarcador.unidade}` : ''}`;
  }
  return biomarcador.valorTexto || '—';
}

const TOM_CLASSES: Record<Indicador['tom'], string> = {
  destaque: 'border-[#E3E8F0] bg-white text-[#14211F]',
  neutro: 'border-[#E3E8F0] bg-white text-[#14211F]',
  atencao: 'border-[#FDE1DA] bg-[#FDE1DA]/60 text-[#9B2C16]',
  alerta: 'border-[#E8664A]/40 bg-[#FDE1DA] text-[#9B2C16]',
};

export default function Dashboard() {
  const [isCarteirinhaOpen, setIsCarteirinhaOpen] = useState(false);
  const [isAnalysesOpen, setIsAnalysesOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading, isError: profileError } = useGetApiPacientesMe();
  const { data: fichaRaw, isLoading: isFichaLoading, isError: fichaError } = useGetApiFichaMedicaMe();
  const resumo = useDashboardResumo();

  const user = (profile as any) || {};
  const ficha = (fichaRaw as any) || {};
  const dados = resumo.data;

  const firstName = user.nome ? String(user.nome).trim().split(/\s+/)[0] : '';
  const fullName = user.nome || 'Nome não informado';
  const healthPlan = typeof user.planoSaude === 'string' ? user.planoSaude.trim() : '';
  const insuranceCardNumber = typeof user.numeroCarteirinha === 'string'
    ? user.numeroCarteirinha.trim()
    : '';
  const registeredCardUrl = typeof user.urlCarteirinha === 'string' ? user.urlCarteirinha : '';

  const birthDate = user.dataNascimento ? new Date(user.dataNascimento) : null;
  const hasValidBirthDate = birthDate !== null && !Number.isNaN(birthDate.getTime());
  const birthDateFormatted = hasValidBirthDate ? birthDate.toLocaleDateString('pt-BR') : 'Não informado';
  const age = hasValidBirthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400000))
    : null;

  const bloodType = ficha.tipoSanguineo || dados?.ficha?.tipoSanguineo || 'Não informado';
  const allergiesList: string[] = (Array.isArray(ficha.alergias) && ficha.alergias.length > 0)
    ? ficha.alergias
    : (Array.isArray(dados?.ficha?.alergias) ? dados.ficha.alergias : []);
  const allergiesDisplay = allergiesList.length > 0 ? allergiesList.join(' · ') : 'Não informado';

  const isLoading = !dados && (isProfileLoading || isFichaLoading || resumo.isLoading);
  const hasError = profileError || fichaError || resumo.isError;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1240px] flex-1 min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] space-y-5 px-3.5 sm:px-6 lg:px-10 pb-16 pt-5 sm:pt-9" aria-busy="true" aria-label="Carregando visão geral">
        <div className="space-y-2"><div className="animate-shimmer h-3 w-32 rounded-lg" /><div className="animate-shimmer h-9 w-56 max-w-full rounded-lg" /><div className="animate-shimmer h-4 w-72 max-w-full rounded-lg" /></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="animate-shimmer h-28 rounded-2xl" /><div className="animate-shimmer h-28 rounded-2xl" /><div className="animate-shimmer h-28 rounded-2xl" /><div className="animate-shimmer h-28 rounded-2xl" /></div>
        <div className="grid gap-5 lg:grid-cols-3"><div className="animate-shimmer h-80 rounded-[24px] lg:col-span-2" /><div className="animate-shimmer h-80 rounded-[24px]" /></div>
      </div>
    );
  }

  if ((hasError && !dados) || !dados) {
    return (
      <div className="mx-auto w-full max-w-[1240px] flex-1 min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] px-3.5 sm:px-6 lg:px-10 py-12 flex items-center justify-center">
        <div role="alert" className="w-full max-w-2xl rounded-2xl border border-[#E8664A]/30 bg-[#E8664A]/10 p-8 text-center text-[#E8664A] space-y-4">
          <p className="font-semibold text-base">Não foi possível carregar os dados da sua conta.</p>
          <p className="text-xs text-[#5B6878]">Verifique sua conexão e tente novamente.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors cursor-pointer"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  const { indicadores, atencao, distribuicao, biomarcadores, consultas, medicamentosRecentes, ficha: resumoFicha, documentosRecentes, alertas } = dados;
  const alertaAlta = atencao.some((item) => item.severidade === 'alta') || alertas.some((a) => a.severidade === 'alta');

  // Constrói cards dinâmicos para TODOS os tipos de documentos adicionados no acervo
  const tiposPresentesCards: Indicador[] = distribuicao.map((item) => {
    let detalhe = `${item.percentual}% do acervo`;
    if (item.tipo === 'exame') {
      detalhe = biomarcadores.length > 0
        ? pluralizar(biomarcadores.length, 'tipo de biomarcador', 'tipos de biomarcadores')
        : `${item.percentual}% do acervo`;
    } else if (item.tipo === 'receita') {
      detalhe = indicadores.receitasAtivas > 0
        ? `${indicadores.receitasAtivas} ${indicadores.receitasAtivas === 1 ? 'ativa' : 'ativas'} de ${item.quantidade}`
        : `de ${item.quantidade} ${item.quantidade === 1 ? 'receita' : 'receitas'}`;
    } else if (item.tipo === 'vacina') {
      detalhe = 'imunizações registradas';
    } else if (item.tipo === 'atestado') {
      detalhe = 'atestados médicos';
    } else if (item.tipo === 'laudo') {
      detalhe = 'laudos e pareceres';
    } else if (item.tipo === 'encaminhamento') {
      detalhe = 'referências clínicas';
    } else if (item.tipo === 'relatorio') {
      detalhe = 'relatórios clínicos';
    }

    return {
      rotulo: item.rotulo,
      valor: item.quantidade,
      detalhe,
      tom: 'neutro',
      icon: getTipoIcon(item.tipo),
      href: `/documentos?tipo=${encodeURIComponent(item.tipo)}`,
    };
  });

  const fallbackCards: Indicador[] = [
    {
      rotulo: 'Exames',
      valor: 0,
      detalhe: 'nenhum exame adicionado',
      tom: 'neutro',
      icon: <Activity size={18} className="text-[#1D4ED8]" />,
      href: '/documentos?tipo=exame',
    },
    {
      rotulo: 'Receitas',
      valor: 0,
      detalhe: 'nenhuma receita adicionada',
      tom: 'neutro',
      icon: <Pill size={18} className="text-[#1D4ED8]" />,
      href: '/documentos?tipo=receita',
    },
  ];

  const tomAtencao: Indicador['tom'] = alertaAlta ? 'alerta' : atencao.length > 0 ? 'atencao' : 'neutro';

  const indicadoresExibidos: Indicador[] = [
    {
      rotulo: 'Documentos arquivados',
      valor: indicadores.total,
      detalhe: pluralizar(indicadores.prontos, 'processado', 'processados'),
      tom: 'neutro',
      icon: <FileText size={18} className="text-[#1D4ED8]" />,
      href: '/documentos',
    },
    // Mostra os tipos de documentos que o usuário TEM adicionados
    ...(tiposPresentesCards.length > 0 ? tiposPresentesCards : fallbackCards),
    {
      rotulo: 'Precisam de atenção',
      valor: atencao.length,
      detalhe: atencao.length > 0
        ? (indicadores.revisaoPendente > 0
            ? pluralizar(indicadores.revisaoPendente, 'revisão pendente', 'revisões pendentes')
            : pluralizar(atencao.length, 'alerta clínico', 'alertas clínicos'))
        : 'tudo em ordem',
      tom: tomAtencao,
      icon: <AlertTriangle size={18} className={alertaAlta ? 'text-[#E8664A]' : (atencao.length > 0 ? 'text-[#9B2C16]' : 'text-[#1D4ED8]')} />,
      href: atencao.length > 0 ? (atencao[0].documentoId ? `/documentos/${atencao[0].documentoId}` : '/documentos') : undefined,
    },
  ];

  return (
    <div className="min-h-screen min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] flex-1 bg-white text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-3.5 sm:px-6 lg:px-10 pt-4 sm:pt-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase text-[#1D4ED8] mb-1.5 sm:mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
              Visão geral
            </div>
            <h1 className="mt-1 mb-0 text-2xl sm:text-[32px] font-semibold tracking-[-0.035em] text-[#14211F]">
              Olá{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 mb-0 text-[#5B6878] text-xs sm:text-base">
              Veja o que precisa de atenção e a evolução dos seus exames.
            </p>
          </div>

        </div>


        {/* Carteirinha e acesso de emergência em azul-marinho. */}
        <div className="mb-6 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsCarteirinhaOpen(true)}
            aria-label="Abrir carteirinha de saúde em tela inteira"
            className="group relative flex w-full cursor-pointer flex-col justify-between overflow-hidden rounded-[20px] border border-[#36425F] bg-[#1C2438] p-5 text-left text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#222d47] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] lg:col-span-2 sm:p-7"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#60A5FA] via-[#2563EB] to-[#1D4ED8]" />
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#2563EB]/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-2/3 bg-gradient-to-l from-[#2563EB]/10 to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#A9B6CE]">Carteirinha de saúde</span>
                <BrandLogo withLink={false} variant="white" iconClassName="h-6 w-6" wordmarkClassName="text-xs" layout="inline" />
              </div>
              <div className="mt-4">
                <div className="font-serif text-2xl font-semibold text-white">{fullName}</div>
                <div className="mt-1 text-base text-white">{healthPlan || 'Plano não informado'}</div>
                <div className="mt-1 font-mono text-sm text-[#A9B6CE]">Nº {insuranceCardNumber || 'Não informado'}</div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-sm [&>div:first-child]:text-[#A9B6CE] [&>div:last-child]:text-white">
                  <div className="text-xs font-semibold text-[#5B6878]">Tipo sanguíneo</div>
                  <div className="mt-1 font-serif text-lg font-semibold text-[#14211F]">{bloodType}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-sm [&>div:first-child]:text-[#A9B6CE] [&>div:last-child]:text-white">
                  <div className="text-xs font-semibold text-[#5B6878]">Alergias</div>
                  <div className="mt-1 text-sm text-[#14211F]">{allergiesDisplay}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#A9B6CE]">Contato de emergencia</div>
                  <div className="mt-1 truncate text-sm font-semibold text-white" title={resumoFicha.contatoEmergencia || 'Nao informado'}>
                    {resumoFicha.contatoEmergencia || 'Nao informado'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#A9B6CE]">Condicoes</div>
                  <div className="mt-1 truncate text-sm font-semibold text-white" title={resumoFicha.condicoes.length > 0 ? resumoFicha.condicoes.join(', ') : 'Nenhuma'}>
                    {resumoFicha.condicoes.length > 0 ? resumoFicha.condicoes.join(', ') : 'Nenhuma'}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-5 inline-flex min-h-11 items-center justify-center gap-2 self-stretch rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition-colors group-hover:bg-[#1D4ED8]">
              <ZoomIn size={15} />
              Abrir carteirinha
            </div>
          </button>

          <section className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#36425F] border-t-4 border-t-[#E8664A] bg-[#1C2438] p-5 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#29283c] hover:shadow-lg sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#E8664A]/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-2/3 bg-gradient-to-l from-[#E8664A]/15 to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#A9B6CE]">Acesso rápido em emergências</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8664A]/15 text-[#FCA5A5]" aria-hidden="true"><Shield size={17} /></span>
              </div>
              <h2 className="mt-3 text-xl text-white">Ficha de emergência</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A9B6CE]">Informado por você na ficha médica. Confira com um profissional de saúde.</p>
              <div className="hidden">
                <div className="flex justify-between gap-3"><span className="text-[#A9B6CE]">Contato</span><span className="break-words text-right font-semibold text-white">{resumoFicha.contatoEmergencia || 'Não informado'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-[#A9B6CE]">Condições</span><span className="break-words text-right font-semibold text-white">{resumoFicha.condicoes.length > 0 ? resumoFicha.condicoes.join(', ') : 'Nenhuma'}</span></div>
              </div>
            </div>
            <button type="button" onClick={triggerEmergencyModal} className="relative mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E8664A] px-4 text-sm font-bold text-white shadow-sm shadow-red-950/20 transition-colors hover:bg-[#C94E35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8664A]">
              Abrir modo emergência <ArrowRight size={16} />
            </button>
          </section>
        </div>

        {/* Indicadores Dinâmicos por Tipo de Documento */}
        {dados && (
          <section
            aria-label="Indicadores"
            className={`mb-6 grid gap-3 sm:gap-4 grid-cols-2 ${
              indicadoresExibidos.length <= 4
                ? 'sm:grid-cols-2 xl:grid-cols-4'
                : indicadoresExibidos.length === 5
                ? 'sm:grid-cols-3 xl:grid-cols-5'
                : 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
            }`}
          >
            {indicadoresExibidos.map((item) => {
              const isDestaque = item.tom === 'destaque';
              const cardInner = (
                <div
                  className={`flex flex-col justify-between h-full rounded-[18px] sm:rounded-[20px] border p-3.5 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${TOM_CLASSES[item.tom]} ${
                    item.href ? (isDestaque ? 'hover:border-[#60A5FA]/80 cursor-pointer' : 'hover:border-[#1D4ED8]/40 cursor-pointer') : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-h-[30px] sm:min-h-[34px]">
                      <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide leading-tight break-words min-w-0 flex-1 transition-colors ${
                        isDestaque ? 'text-[#93C5FD]' : 'text-[#5B6878] group-hover:text-[#1D4ED8]'
                      }`}>
                        {item.rotulo}
                      </span>
                      <span className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
                        isDestaque ? 'bg-white/10 text-[#93C5FD]' : 'bg-[#1D4ED8]/10 text-[#1D4ED8]'
                      }`}>
                        {item.icon}
                      </span>
                    </div>
                    <div className={`mt-2.5 sm:mt-3 text-2xl font-serif font-semibold leading-none tracking-tight sm:text-[42px] ${
                      isDestaque ? 'text-white' : 'text-[#14211F]'
                    }`}>
                      {item.valor}
                    </div>
                  </div>
                  <div className={`mt-2 text-xs sm:text-[13px] leading-snug break-words ${
                    isDestaque ? 'text-blue-100/80 font-medium' : 'text-[#5B6878]'
                  }`}>
                    {item.detalhe}
                  </div>
                </div>
              );

              return item.href ? (
                <Link
                  key={item.rotulo}
                  href={item.href}
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-[18px] sm:rounded-[20px]"
                >
                  {cardInner}
                </Link>
              ) : (
                <div key={item.rotulo} className="group">
                  {cardInner}
                </div>
              );
            })}
          </section>
        )}



        {/* Biomarcadores / Resultados de exames */}
        <section className="mb-6 rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
              <HeartPulse size={18} className="text-[#1D4ED8]" />
            </div>
            <h2 className="text-base font-bold text-[#14211F] flex-1">Últimos resultados de exames</h2>
            <button type="button" onClick={() => setIsAnalysesOpen(true)} className="text-[13px] font-bold text-[#1D4ED8] hover:underline">
              Ver tendências
            </button>
          </div>

          {biomarcadores.length === 0 ? (
            <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
              Ainda não há resultados de exames com valores registrados. Envie um exame para começar a acompanhar a evolução.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E3E8F0] text-[11px] uppercase tracking-wider text-[#5B6878]">
                    <th className="py-2.5 pr-3 font-bold">Analito</th>
                    <th className="py-2.5 pr-3 font-bold">Último valor</th>
                    <th className="py-2.5 pr-3 font-bold">Referência</th>
                    <th className="py-2.5 pr-3 font-bold">Data</th>
                    <th className="py-2.5 font-bold">Medições</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F0]/70">
                  {biomarcadores.map((item) => (
                    <tr key={item.nomeNormalizado} className="align-top hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="py-3.5 pr-3 font-semibold text-[#14211F]">
                        {item.documentoId ? (
                          <Link href={`/documentos/${item.documentoId}`} className="hover:text-[#1D4ED8] hover:underline">
                            {item.nome}
                          </Link>
                        ) : item.nome}
                        {item.foraDaFaixa && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FDE1DA] px-2 py-0.5 text-[11px] font-bold text-[#9B2C16]">
                            <AlertTriangle size={11} /> Fora da faixa
                          </span>
                        )}
                      </td>
                      <td className={`py-3.5 pr-3 font-bold ${item.foraDaFaixa ? 'text-[#9B2C16]' : 'text-[#14211F]'}`}>
                        {valorExibido(item)}
                      </td>
                      <td className="py-3.5 pr-3 text-[#5B6878]">{formatarFaixa(item)}</td>
                      <td className="py-3.5 pr-3 text-[#5B6878]">{item.data || '—'}</td>
                      <td className="py-3.5 text-[#5B6878]">{item.medicoes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Profissionais + Medicamentos prescritos */}
        <div className="mb-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                <Stethoscope size={18} className="text-[#1D4ED8]" />
              </div>
              <h2 className="text-base font-bold text-[#14211F] flex-1">Profissionais e locais</h2>
            </div>

            {consultas.length === 0 ? (
              <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
                Nenhum profissional ou clínica identificado nos seus documentos.
              </p>
            ) : (
              <ul className="divide-y divide-[#E3E8F0]">
                {consultas.map((item, index) => (
                  <li key={`${item.medico}-${item.clinica}-${index}`} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                      <Stethoscope size={16} className="text-[#1D4ED8]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm text-[#14211F]">
                        {item.medico || 'Profissional não informado'}
                      </b>
                      <span className="mt-0.5 block text-[13px] text-[#5B6878]">
                        {[item.especialidade, item.clinica].filter(Boolean).join(' · ') || 'Sem detalhes'}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[12px] text-[#5B6878]">
                      {item.ultimaData && <span className="block">{item.ultimaData}</span>}
                      <span className="block">
                        {pluralizar(item.totalDocumentos, 'documento', 'documentos')}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                <Pill size={18} className="text-[#1D4ED8]" />
              </div>
              <h2 className="text-base font-bold text-[#14211F] flex-1">Medicamentos prescritos</h2>
            </div>

            {medicamentosRecentes.length === 0 ? (
              <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
                Nenhum medicamento identificado nas receitas.
              </p>
            ) : (
              <ul className="divide-y divide-[#E3E8F0]">
                {medicamentosRecentes.map((item, index) => (
                  <li key={`${item.nome}-${index}`} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                      <Pill size={16} className="text-[#1D4ED8]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm text-[#14211F]">{item.nome}</b>
                      <span className="mt-0.5 block text-[13px] text-[#5B6878]">
                        {[item.dosagem, item.horario].filter(Boolean).join(' · ') || 'Sem posologia registrada'}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[12px] text-[#5B6878]">
                      {item.data && <span className="block">{item.data}</span>}
                      <span className="block">
                        {pluralizar(item.prescricoes, 'prescrição', 'prescrições')}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Documentos recentes */}
        <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
              <CalendarDays size={18} className="text-[#1D4ED8]" />
            </div>
            <h2 className="text-base font-bold text-[#14211F] flex-1">Documentos recentes</h2>
            <Link href="/documentos" className="text-[13px] font-bold text-[#1D4ED8] hover:underline">
              Ver todos
            </Link>
          </div>

          {documentosRecentes.length === 0 ? (
            <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
              Você ainda não arquivou documentos. Comece enviando um exame, receita ou laudo.
            </p>
          ) : (
            <ul className="divide-y divide-[#E3E8F0]">
              {documentosRecentes.map((doc, index) => (
                <li key={doc.id ?? index}>
                  {doc.id ? (
                    <Link
                      href={`/documentos/${doc.id}`}
                      className="flex items-start gap-3 py-3.5 transition-colors hover:bg-[#F4F7FC]"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                        <FileText size={16} className="text-[#1D4ED8]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block break-words text-sm text-[#14211F]">{doc.titulo}</b>
                        <span className="mt-0.5 block text-[13px] text-[#5B6878]">
                          {[doc.medico, doc.clinica].filter(Boolean).join(' · ') || 'Sem profissional identificado'}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[12px] text-[#5B6878]">
                        <span className="block font-semibold text-[#1D4ED8]">
                          {ROTULO_TIPO_DOCUMENTO[doc.tipo] ?? doc.tipo ?? 'Documento'}
                        </span>
                        <span className="block">{doc.data || new Date(doc.criadoEm).toLocaleDateString('pt-BR')}</span>
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 py-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                        <FileText size={16} className="text-[#1D4ED8]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block break-words text-sm text-[#14211F]">{doc.titulo}</b>
                        <span className="mt-0.5 block text-[13px] text-[#5B6878]">{doc.medico || 'Sem profissional identificado'}</span>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-[#5B6878]">
          Informações organizadas com segurança para o seu acompanhamento contínuo.
        </p>
      </main>

      {isAnalysesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="analyses-modal-title">
          <div className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[#E3E8F0] bg-[#F4F7FC] shadow-2xl sm:rounded-[28px]">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E3E8F0] bg-white px-4 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <p className="mb-0 text-xs font-bold uppercase tracking-[0.14em] text-[#1D4ED8]">Acompanhamento clínico</p>
                <h2 id="analyses-modal-title" className="mb-0 mt-0.5 truncate text-lg font-bold text-[#14211F] sm:text-xl">Análises e tendências</h2>
              </div>
              <button type="button" onClick={() => setIsAnalysesOpen(false)} aria-label="Fechar análises" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#5B6878] transition-colors hover:bg-[#F4F7FC] hover:text-[#14211F]">
                <X size={20} />
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
              <Insights embedded />
            </div>
          </div>
        </div>
      )}

      {/* Carteirinha Modal */}
      <CarteirinhaModal
        open={isCarteirinhaOpen}
        onOpenChange={setIsCarteirinhaOpen}
        user={user}
        ficha={ficha}
        resumoFicha={resumoFicha}
      />
    </div>
  );
}
