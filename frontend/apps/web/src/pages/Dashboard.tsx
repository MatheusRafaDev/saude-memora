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
} from 'lucide-react';
import {
  useGetApiPacientesMe,
  useGetApiFichaMedicaMe,
} from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';
import { triggerEmergencyModal } from '@/lib/emergency-modal';
import { CarteirinhaModal } from '@/components/CarteirinhaModal';
import { BrandLogo } from '@/components/BrandLogo';
import { AiDataNotice } from '@/components/AiDataNotice';
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

  const isLoading = isProfileLoading || isFichaLoading || resumo.isLoading;
  const hasError = profileError || fichaError || resumo.isError;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1240px] space-y-5 px-3.5 sm:px-6 lg:px-10 pb-16 pt-5 sm:pt-9" aria-busy="true" aria-label="Carregando visão geral">
        <div className="space-y-2"><div className="animate-shimmer h-3 w-32 rounded-lg" /><div className="animate-shimmer h-9 w-56 max-w-full rounded-lg" /><div className="animate-shimmer h-4 w-72 max-w-full rounded-lg" /></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="animate-shimmer h-28 rounded-2xl" /><div className="animate-shimmer h-28 rounded-2xl" /><div className="animate-shimmer h-28 rounded-2xl" /><div className="animate-shimmer h-28 rounded-2xl" /></div>
        <div className="grid gap-5 lg:grid-cols-3"><div className="animate-shimmer h-80 rounded-[24px] lg:col-span-2" /><div className="animate-shimmer h-80 rounded-[24px]" /></div>
      </div>
    );
  }

  if (hasError || !dados) {
    return (
      <div role="alert" className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#E8664A]/30 bg-[#E8664A]/10 p-8 text-center text-[#E8664A]">
        Não foi possível carregar os dados da sua conta. Atualize a página ou tente novamente mais tarde.
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
      detalhe: indicadores.revisaoPendente > 0
        ? pluralizar(indicadores.revisaoPendente, 'revisão pendente', 'revisões pendentes')
        : 'tudo em ordem',
      tom: tomAtencao,
      icon: <AlertTriangle size={18} className={alertaAlta ? 'text-[#E8664A]' : 'text-[#1D4ED8]'} />,
      href: atencao.length > 0 ? (atencao[0].documentoId ? `/documentos/${atencao[0].documentoId}` : '/documentos') : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#14211F] font-sans pb-16">
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

          <div className="flex flex-wrap items-center w-full gap-2.5 sm:w-auto">
            <button
              type="button"
              onClick={() => triggerUploadModal({ mode: 'batch' })}
              className="min-h-[44px] flex-1 sm:flex-none px-4 rounded-xl border border-[#CFE0FF] bg-[#F4F7FC] text-[#1D4ED8] hover:bg-[#CFE0FF]/40 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Layers size={16} />
              <span>Enviar em lote</span>
            </button>

            <button
              type="button"
              onClick={() => triggerUploadModal({ mode: 'single' })}
              className="btn-primary min-h-[44px] flex-1 sm:flex-none shadow-xs inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Adicionar documento</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <AiDataNotice />
        </div>

        {/* Carteirinha em azul céu e um único cartão azul-marinho de destaque. */}
        <div className="mb-6 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsCarteirinhaOpen(true)}
            aria-label="Abrir carteirinha de saúde em tela inteira"
            className="group flex w-full cursor-zoom-in flex-col justify-between rounded-[20px] border border-[#CFE0FF] bg-[#CFE0FF] p-5 text-left text-[#14211F] transition-colors hover:bg-[#CFE0FF]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] lg:col-span-2 sm:p-7"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#1D4ED8]">Carteirinha de saúde</span>
                <BrandLogo withLink={false} iconClassName="h-6 w-6" wordmarkClassName="text-xs text-[#14211F]" layout="inline" />
              </div>
              <div className="mt-4">
                <div className="font-serif text-2xl font-semibold text-[#14211F]">{fullName}</div>
                <div className="mt-1 text-base text-[#14211F]">{healthPlan || 'Plano não informado'}</div>
                <div className="mt-1 font-mono text-sm text-[#5B6878]">Nº {insuranceCardNumber || 'Não informado'}</div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E3E8F0] bg-white p-3">
                  <div className="text-xs font-semibold text-[#5B6878]">Tipo sanguíneo</div>
                  <div className="mt-1 font-serif text-lg font-semibold text-[#14211F]">{bloodType}</div>
                </div>
                <div className="rounded-xl border border-[#E3E8F0] bg-white p-3">
                  <div className="text-xs font-semibold text-[#5B6878]">Alergias</div>
                  <div className="mt-1 text-sm text-[#14211F]">{allergiesDisplay}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white transition-colors group-hover:bg-[#1E40AF]">
              <ZoomIn size={15} />
              Abrir carteirinha
            </div>
          </button>

          <section className="relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#36425F] border-t-4 border-t-[#E8664A] bg-[#1C2438] p-5 text-white sm:p-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#A9B6CE]">Acesso rápido em emergências</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#E8664A]" aria-hidden="true"><Shield size={17} /></span>
              </div>
              <h2 className="mt-3 text-xl text-white">Ficha de emergência</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A9B6CE]">Informado por você na ficha médica. Confira com um profissional de saúde.</p>
              <div className="mt-4 space-y-2 border-t border-[#36425F] pt-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-[#A9B6CE]">Contato</span><span className="truncate text-right font-semibold text-white">{resumoFicha.contatoEmergencia || 'Não informado'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-[#A9B6CE]">Condições</span><span className="truncate text-right font-semibold text-white">{resumoFicha.condicoes.length > 0 ? resumoFicha.condicoes.join(', ') : 'Nenhuma'}</span></div>
              </div>
            </div>
            <button type="button" onClick={triggerEmergencyModal} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1E40AF]">
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
                  className={`h-full rounded-[18px] sm:rounded-[20px] border p-3.5 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${TOM_CLASSES[item.tom]} ${
                    item.href ? (isDestaque ? 'hover:border-[#60A5FA]/80 cursor-pointer' : 'hover:border-[#1D4ED8]/40 cursor-pointer') : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate transition-colors ${
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
                  <div className={`mt-1 text-xs sm:text-[13px] truncate ${
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

        {/* Atenção + Documentos por tipo */}
        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                <AlertTriangle size={18} className="text-[#1D4ED8]" />
              </div>
              <h2 className="text-base font-bold text-[#14211F] flex-1">Precisa da sua atenção</h2>
              {atencao.length > 0 && (
                <span className="rounded-full bg-[#F4F7FC] px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">
                  {atencao.length}
                </span>
              )}
            </div>

            {atencao.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
                <CheckCircle2 size={16} className="text-[#1D4ED8]" />
                Nada pendente: seus documentos estão processados e sem alertas em aberto.
              </p>
            ) : (
              <ul className="divide-y divide-[#E3E8F0]">
                {atencao.map((item, index) => {
                  const severidade = SEVERIDADE_ALERTA[item.severidade?.toLowerCase()] ?? SEVERIDADE_ALERTA.baixa;
                  const conteudo = (
                    <>
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${severidade.fundo} ${severidade.cor}`}>
                        <AlertTriangle size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <b className="text-sm text-[#14211F]">{item.titulo}</b>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${severidade.fundo} ${severidade.cor}`}>
                            {severidade.rotulo}
                          </span>
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-[#5B6878]">{item.descricao}</span>
                      </span>
                      {item.documentoId && <ArrowRight size={15} className="mt-1.5 shrink-0 text-[#9aa8b8]" />}
                    </>
                  );

                  return (
                    <li key={`${item.tipo}-${item.documentoId ?? index}-${index}`}>
                      {item.documentoId ? (
                        <Link
                          href={`/documentos/${item.documentoId}`}
                          className="flex items-start gap-3 py-3.5 transition-colors hover:bg-[#F4F7FC]"
                        >
                          {conteudo}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 py-3.5">{conteudo}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {(indicadores.falhados > 0 || indicadores.processando > 0) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E3E8F0] pt-4 text-[13px] text-[#5B6878]">
                {indicadores.processando > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <LoaderCircle size={14} className="animate-spin text-[#1D4ED8]" />
                    {pluralizar(indicadores.processando, 'documento em processamento', 'documentos em processamento')}
                  </span>
                )}
                {indicadores.falhados > 0 && (
                  <span className="text-[#9B2C16]">
                    {pluralizar(indicadores.falhados, 'documento com falha', 'documentos com falha')}
                  </span>
                )}
              </p>
            )}
          </section>

          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                  <FileText size={18} className="text-[#1D4ED8]" />
                </div>
                <h2 className="text-base font-bold text-[#14211F]">Documentos por tipo</h2>
              </div>
              <Link href="/documentos" className="text-[13px] font-bold text-[#1D4ED8] hover:underline">
                Ver todos
              </Link>
            </div>

            {distribuicao.length === 0 ? (
              <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
                Nenhum documento arquivado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {distribuicao.map((item) => (
                  <Link
                    key={item.tipo}
                    href={`/documentos?tipo=${encodeURIComponent(item.tipo)}`}
                    className="group block transition-opacity hover:opacity-95"
                  >
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#14211F] group-hover:text-[#1D4ED8] transition-colors">
                        {getTipoIcon(item.tipo)}
                        <span>{item.rotulo}</span>
                      </span>
                      <span className="text-[#5B6878]">
                        {item.quantidade} {item.quantidade === 1 ? 'doc' : 'docs'} · {item.percentual}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F4F7FC]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]"
                        style={{ width: `${item.percentual}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Biomarcadores + Alertas */}
        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                <HeartPulse size={18} className="text-[#1D4ED8]" />
              </div>
              <h2 className="text-base font-bold text-[#14211F] flex-1">Últimos resultados de exames</h2>
              <Link href="/analises" className="text-[13px] font-bold text-[#1D4ED8] hover:underline">
                Ver tendências
              </Link>
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

          <section className="rounded-[20px] border border-[#E3E8F0] bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                <Pill size={18} className="text-[#1D4ED8]" />
              </div>
              <h2 className="text-base font-bold text-[#14211F] flex-1">Alertas de medicamentos</h2>
            </div>

            {alertas.length === 0 ? (
              <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
                Nenhum alerta em aberto nas suas receitas.
              </p>
            ) : (
              <ul className="space-y-3">
                {alertas.map((alerta, index) => {
                  const severidade = SEVERIDADE_ALERTA[alerta.severidade?.toLowerCase()] ?? SEVERIDADE_ALERTA.baixa;
                  return (
                    <li key={`${alerta.tipo}-${index}`} className={`rounded-xl border p-3 ${severidade.fundo} border-transparent`}>
                      <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${severidade.cor}`}>
                        <AlertTriangle size={12} />
                        {alerta.tipo} · {severidade.rotulo}
                      </div>
                      <p className="mb-0 mt-1 text-[13px] leading-relaxed text-[#14211F]">{alerta.mensagem}</p>
                      {alerta.documentoId && (
                        <Link
                          href={`/documentos/${alerta.documentoId}`}
                          className="mt-1.5 inline-block text-[12px] font-bold text-[#1D4ED8] hover:underline"
                        >
                          Abrir documento
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

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
                        <b className="block truncate text-sm text-[#14211F]">{doc.titulo}</b>
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
                        <b className="block truncate text-sm text-[#14211F]">{doc.titulo}</b>
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
