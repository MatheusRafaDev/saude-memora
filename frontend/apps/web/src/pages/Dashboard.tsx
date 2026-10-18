import { useState } from 'react';
import { Link } from 'wouter';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  FileText,
  Pill,
  Plus,
  Shield,
  ArrowRight,
  Activity,
  X,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Stethoscope,
  HeartPulse,
  CalendarDays,
  LoaderCircle,
} from 'lucide-react';
import {
  useGetApiPacientesMe,
  useGetApiFichaMedicaMe,
} from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';
import { triggerEmergencyModal } from '@/lib/emergency-modal';
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
  tom: 'neutro' | 'atencao' | 'alerta';
  icon: React.ReactNode;
};

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
  neutro: 'border-[#E3E8F0] bg-white',
  atencao: 'border-[#f0d9b2] bg-[#fffaf0]',
  alerta: 'border-[#E8664A]/30 bg-[#E8664A]/10',
};

export default function Dashboard() {
  const [isCarteirinhaOpen, setIsCarteirinhaOpen] = useState(false);
  const [cardZoom, setCardZoom] = useState(1);

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

  const bloodType = ficha.tipoSanguineo || 'Não informado';
  const allergiesList: string[] = Array.isArray(ficha.alergias) ? ficha.alergias : [];
  const allergiesDisplay = allergiesList.length > 0 ? allergiesList.join(' · ') : 'Não informado';

  const isLoading = isProfileLoading || isFichaLoading || resumo.isLoading;
  const hasError = profileError || fichaError || resumo.isError;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1240px] space-y-5 px-5 pb-16 pt-9 sm:px-10" aria-busy="true" aria-label="Carregando visão geral">
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

  const indicadoresExibidos: Indicador[] = [
    {
      rotulo: 'Documentos arquivados',
      valor: indicadores.total,
      detalhe: pluralizar(indicadores.prontos, 'processado', 'processados'),
      tom: 'neutro',
      icon: <FileText size={18} className="text-[#1D4ED8]" />,
    },
    {
      rotulo: 'Exames',
      valor: indicadores.exames,
      detalhe: pluralizar(biomarcadores.length, 'tipo de biomarcador', 'tipos de biomarcadores'),
      tom: 'neutro',
      icon: <Activity size={18} className="text-[#1D4ED8]" />,
    },
    {
      rotulo: 'Receitas ativas',
      valor: indicadores.receitasAtivas,
      detalhe: `de ${indicadores.receitas} ${indicadores.receitas === 1 ? 'receita' : 'receitas'}`,
      tom: 'neutro',
      icon: <Pill size={18} className="text-[#1D4ED8]" />,
    },
    {
      rotulo: 'Precisam de atenção',
      valor: atencao.length,
      detalhe: indicadores.revisaoPendente > 0
        ? pluralizar(indicadores.revisaoPendente, 'revisão pendente', 'revisões pendentes')
        : 'tudo em ordem',
      tom: alertaAlta ? 'alerta' : atencao.length > 0 ? 'atencao' : 'neutro',
      icon: <AlertTriangle size={18} className={alertaAlta ? 'text-[#E8664A]' : 'text-[#1D4ED8]'} />,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#14211F] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase text-[#1D4ED8] mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
              Visão geral
            </div>
            <h1 className="mt-1 mb-0 text-[32px] sm:text-[38px] font-bold tracking-[-0.035em] text-[#14211F]">
              Olá{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 mb-0 text-[#5B6878] text-sm sm:text-base">
              Veja o que precisa de atenção e a evolução dos seus exames.
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              onClick={() => triggerUploadModal()}
              className="btn-primary min-h-[44px] flex-1 sm:flex-none shadow-xs"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Adicionar documento</span>
            </button>
          </div>
        </div>

        {/* AI Disclaimer Banner (desing.md Seção 5 & 8) */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#CFE0FF] bg-gradient-to-r from-[#CFE0FF]/40 to-[#F4F7FC] px-4.5 py-3 text-[13px] text-[#1D4ED8] shadow-xs">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1D4ED8]/10 text-[#1D4ED8]">
            <Shield size={16} />
          </div>
          <span className="leading-relaxed text-[#14211F]">
            <b className="font-semibold text-[#1D4ED8]">Aviso de IA:</b> Os dados extraídos por inteligência artificial podem conter imprecisões. Confira sempre com o documento original.
          </span>
        </div>

        {/* Carteirinha (--sky) + Emergência (1 card Navy com faixa coral de 4px) */}
        <div className="mb-6 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          {/* Carteirinha de saúde com fundo --sky e gradiente suave */}
          <button
            type="button"
            onClick={() => setIsCarteirinhaOpen(true)}
            aria-label="Abrir carteirinha de saúde em tela inteira"
            className="group block w-full cursor-zoom-in bg-gradient-to-br from-[#CFE0FF] via-[#DBE8FF] to-[#CFE0FF] text-left text-[#14211F] rounded-[24px] p-6 sm:p-7 border border-[#1D4ED8]/20 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] lg:col-span-2 flex flex-col justify-between"
          >
            {/* Subtle background glow */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/40 blur-2xl pointer-events-none" />

            <div>
              <div className="flex justify-between items-center text-xs tracking-[0.14em] font-bold text-[#1D4ED8]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1D4ED8]" />
                  CARTEIRINHA DIGITAL
                </span>
                <span className="opacity-75 font-semibold text-[13px]">Saúde Memora</span>
              </div>

              <div className="text-2xl sm:text-[26px] font-bold mt-4 mb-1 tracking-tight text-[#14211F]">
                {fullName}
              </div>

              <div className="mt-3 text-[14px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] block">Plano de Saúde</span>
                <span className="text-[17px] font-bold text-[#14211F]">
                  {healthPlan || 'Plano particular / Não informado'}
                </span>
                <div className="text-[13px] text-[#5B6878] font-medium mt-0.5">
                  Nº {insuranceCardNumber || 'Não informado'}
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <div className="flex-1 bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#1D4ED8]/15 shadow-xs">
                  <div className="text-[10px] text-[#1D4ED8] font-bold tracking-wider uppercase">TIPO SANGUÍNEO</div>
                  <div className="text-xl font-extrabold mt-0.5 text-[#14211F]">{bloodType}</div>
                </div>
                <div className="flex-[2] bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#1D4ED8]/15 shadow-xs">
                  <div className="text-[10px] text-[#1D4ED8] font-bold tracking-wider uppercase">ALERGIAS</div>
                  <div className="text-sm font-semibold mt-0.5 line-clamp-2 text-[#14211F]">{allergiesDisplay}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white/85 py-2.5 text-xs font-bold text-[#1D4ED8] shadow-xs group-hover:bg-white transition-colors">
              <ZoomIn size={14} />
              <span>Toque para ampliar a carteirinha</span>
            </div>
          </button>

          {/* Card Destaque de Emergência: Navy com faixa coral de 4px */}
          <div className="rounded-[24px] bg-gradient-to-br from-[#1C2438] via-[#212C45] to-[#171E2E] text-white p-6 sm:p-7 shadow-md border-t-4 border-t-[#E8664A] flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E8664A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E8664A] animate-pulse" />
                  ACESSO RÁPIDO
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8664A]/20 text-[#E8664A]">
                  <Shield size={16} />
                </span>
              </div>

              <h2 className="text-[20px] font-bold mt-3 mb-1 tracking-tight text-white">
                Ficha de emergência
              </h2>

              <p className="text-[13px] leading-relaxed text-[#A9B6CE] mt-2">
                Informado por você na ficha médica. Confira com um profissional de saúde.
              </p>

              <div className="mt-4 space-y-2.5 border-t border-[#36425F] pt-3.5 text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#A9B6CE]">Contato:</span>
                  <span className="font-semibold text-white truncate max-w-[140px]">
                    {resumoFicha.contatoEmergencia || 'Não informado'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A9B6CE]">Condições:</span>
                  <span className="font-semibold text-white truncate max-w-[140px]">
                    {resumoFicha.condicoes.length > 0 ? resumoFicha.condicoes.join(', ') : 'Nenhuma'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={triggerEmergencyModal}
              className="mt-6 w-full min-h-[44px] rounded-xl bg-gradient-to-r from-[#E8664A] to-[#F07055] px-4 text-sm font-bold text-white transition-all duration-150 hover:shadow-lg hover:shadow-[#E8664A]/25 hover:-translate-y-0.5 active:translate-y-0 shadow-xs flex items-center justify-center gap-2"
            >
              <span>Abrir modo emergência</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Indicadores */}
        {dados && (
          <section aria-label="Indicadores" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {indicadoresExibidos.map((item) => (
              <div
                key={item.rotulo}
                className="rounded-[20px] border border-[#E3E8F0] bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6878]">{item.rotulo}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8]/10 text-[#1D4ED8]">{item.icon}</span>
                </div>
                <div className="mt-3 text-[38px] font-bold leading-none tracking-tight text-[#14211F]">{item.valor}</div>
                <div className="mt-1 text-[13px] text-[#5B6878]">{item.detalhe}</div>
              </div>
            ))}
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
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FC]">
                <FileText size={18} className="text-[#1D4ED8]" />
              </div>
              <h2 className="text-base font-bold text-[#14211F] flex-1">Documentos por tipo</h2>
            </div>

            {distribuicao.length === 0 ? (
              <p className="rounded-xl bg-[#F4F7FC] p-4 text-sm text-[#5B6878]">
                Nenhum documento arquivado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {distribuicao.map((item) => (
                  <div key={item.tipo}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span className="font-semibold text-[#14211F]">{item.rotulo}</span>
                      <span className="text-[#5B6878]">{item.quantidade} · {item.percentual}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F4F7FC]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]" style={{ width: `${item.percentual}%` }} />
                    </div>
                  </div>
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
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
      <DialogPrimitive.Root open={isCarteirinhaOpen} onOpenChange={setIsCarteirinhaOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#F4F7FC] p-3 outline-none sm:p-6">
            <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[#E3E8F0] bg-white px-2 py-3 sm:px-4">
              <DialogPrimitive.Title className="text-sm font-bold tracking-tight text-[#14211F] sm:text-base">
                Carteirinha de Saúde
              </DialogPrimitive.Title>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Diminuir zoom" onClick={() => setCardZoom((zoom) => Math.max(0.75, Number((zoom - 0.15).toFixed(2))))} disabled={cardZoom <= 0.75} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1D4ED8] hover:bg-[#F4F7FC] disabled:opacity-40">
                  <ZoomOut size={19} />
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-[#5B6878]">{Math.round(cardZoom * 100)}%</span>
                <button type="button" aria-label="Aumentar zoom" onClick={() => setCardZoom((zoom) => Math.min(1.6, Number((zoom + 0.15).toFixed(2))))} disabled={cardZoom >= 1.6} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1D4ED8] hover:bg-[#F4F7FC] disabled:opacity-40">
                  <ZoomIn size={19} />
                </button>
                <DialogPrimitive.Close aria-label="Fechar carteirinha" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5B6878] hover:bg-[#F4F7FC] transition-colors">
                  <X size={18} />
                </DialogPrimitive.Close>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-1 sm:p-4">
              <div style={{ zoom: cardZoom }} className="mx-auto max-w-3xl">
                <div className="bg-gradient-to-br from-[#CFE0FF] via-[#DBE8FF] to-[#CFE0FF] text-[#14211F] rounded-3xl p-6 sm:p-8 border border-[#1D4ED8]/25 shadow-lg mb-4">
                  <div className="text-xs tracking-wider text-[#1D4ED8] font-bold">
                    SAÚDE MEMORA · IDENTIFICAÇÃO PESSOAL
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight text-[#14211F]">{fullName}</div>
                  <div className="text-xs text-[#5B6878] mt-1 font-medium">
                    Nascimento: {birthDateFormatted}{age !== null ? ` · Idade: ${age} anos` : ''}
                  </div>
                  <div className="mt-2 text-sm text-[#14211F]"><strong>Sexo:</strong> {user.sexo || 'Não informado'}</div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#1D4ED8]/15 shadow-xs">
                      <div className="text-[10px] text-[#1D4ED8] font-bold uppercase tracking-wider">TIPO SANGUÍNEO</div>
                      <div className="text-2xl font-black text-[#14211F] mt-0.5">{bloodType}</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#1D4ED8]/15 shadow-xs">
                      <div className="text-[10px] text-[#1D4ED8] font-bold uppercase tracking-wider">DOADOR DE ÓRGÃOS</div>
                      <div className="text-sm font-bold mt-1 text-[#14211F]">{resumoFicha.doadorOrgaos ? 'Sim, doador' : 'Não informado'}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#1D4ED8]/20 space-y-1.5 text-xs text-[#5B6878]">
                    <div><strong className="text-[#14211F]">Alergias:</strong> {allergiesDisplay}</div>
                    <div>
                      <strong className="text-[#14211F]">Condições:</strong>{' '}
                      {[...resumoFicha.condicoes, resumoFicha.outrasDoencas].filter(Boolean).join(' · ') || 'Não informado'}
                    </div>
                    <div><strong className="text-[#14211F]">Remédios contínuos:</strong> {resumoFicha.medicamentosContinuos.join(', ') || 'Nenhum'}</div>
                    <div><strong className="text-[#14211F]">Cirurgias:</strong> {resumoFicha.cirurgias || 'Não informado'}</div>
                    <div><strong className="text-[#14211F]">Contato de emergência:</strong> {resumoFicha.contatoEmergencia || 'Não informado'}</div>
                    <div><strong className="text-[#14211F]">Plano de saúde:</strong> {resumoFicha.planoSaude || 'Não cadastrado'}</div>
                    <div><strong className="text-[#14211F]">Número da carteirinha:</strong> {resumoFicha.numeroCarteirinha || 'Não informado'}</div>
                  </div>
                </div>

                {registeredCardUrl && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-[#E3E8F0] bg-[#F4F7FC]">
                    {/\.pdf(?:[?#]|$)/i.test(registeredCardUrl) ? (
                      <a
                        href={registeredCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-14 items-center gap-2 px-4 text-sm font-semibold text-[#1D4ED8] hover:bg-[#F4F7FC]"
                      >
                        <FileText size={18} />
                        Abrir carteirinha cadastrada
                      </a>
                    ) : (
                      <img
                        src={registeredCardUrl}
                        alt="Carteirinha do plano de saúde cadastrada"
                        className="max-h-[70vh] w-full object-contain"
                      />
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-[#E3E8F0] bg-white p-4 text-sm text-[#14211F]">
                  <strong>Histórico familiar:</strong> {resumoFicha.historicoFamiliar || 'Não informado'}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
