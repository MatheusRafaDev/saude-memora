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
  neutro: 'border-[#dde3ec] bg-white',
  atencao: 'border-[#f0d9b2] bg-[#fffaf0]',
  alerta: 'border-[#f0b8b2] bg-[#fff5f4]',
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
      <div role="alert" className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#f0b8b2] bg-white p-8 text-center text-[#a13a30]">
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
      icon: <FileText size={18} className="text-[#1b3a60]" />,
    },
    {
      rotulo: 'Exames',
      valor: indicadores.exames,
      detalhe: pluralizar(biomarcadores.length, 'tipo de biomarcador', 'tipos de biomarcadores'),
      tom: 'neutro',
      icon: <Activity size={18} className="text-[#1b3a60]" />,
    },
    {
      rotulo: 'Receitas ativas',
      valor: indicadores.receitasAtivas,
      detalhe: `de ${indicadores.receitas} ${indicadores.receitas === 1 ? 'receita' : 'receitas'}`,
      tom: 'neutro',
      icon: <Pill size={18} className="text-[#1b3a60]" />,
    },
    {
      rotulo: 'Precisam de atenção',
      valor: atencao.length,
      detalhe: indicadores.revisaoPendente > 0
        ? pluralizar(indicadores.revisaoPendente, 'revisão pendente', 'revisões pendentes')
        : 'tudo em ordem',
      tom: alertaAlta ? 'alerta' : atencao.length > 0 ? 'atencao' : 'neutro',
      icon: <AlertTriangle size={18} className={alertaAlta ? 'text-[#a13a30]' : 'text-[#1b3a60]'} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1f7fe0]">
              Seu espaço de saúde
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Olá{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              Veja o que precisa de atenção e a evolução dos seus exames.
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              onClick={() => triggerUploadModal()}
              className="min-h-[44px] flex-1 rounded-xl bg-[#1b3a60] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#24507f] sm:flex-none sm:px-5"
            >
              <span className="inline-flex items-center gap-2"><Plus size={16} strokeWidth={2.5} />Adicionar documento</span>
            </button>
          </div>
        </div>

        {/* Indicadores */}
        {dados && (
          <section aria-label="Indicadores" className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {indicadoresExibidos.map((item) => (
              <div
                key={item.rotulo}
                className={`rounded-2xl border p-4 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] ${TOM_CLASSES[item.tom]}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#5a6a80]">{item.rotulo}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">{item.icon}</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#1d2a3d]">{item.valor}</div>
                <div className="mt-0.5 text-[13px] text-[#5a6a80]">{item.detalhe}</div>
              </div>
            ))}
          </section>
        )}

        {/* Carteirinha + emergência */}
        <div className="mb-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsCarteirinhaOpen(true)}
            aria-label="Abrir carteirinha de saúde em tela inteira"
            className="block w-full cursor-zoom-in bg-gradient-to-br from-[#1b3a60] to-[#24507f] text-left text-white rounded-[24px] p-6 shadow-md relative overflow-hidden transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7fe0] lg:col-span-2"
          >
            <div className="flex justify-between items-center text-xs tracking-[0.14em] font-bold text-[#9fc3ea]">
              <span>MEU PERFIL</span>
              <span className="opacity-80">DIGITAL</span>
            </div>

            <div className="text-2xl font-extrabold mt-3.5 mb-0.5 tracking-[-0.03em]">{fullName}</div>
            <div className="text-[13px] text-[#c9d6e8]">
              Nascimento {birthDateFormatted}{age !== null ? ` · ${age} anos` : ''}
            </div>
            <div className="mt-2 text-[13px] text-white">
              <span className="font-bold">Plano:</span> {healthPlan || 'Não cadastrado'}
              <span className="mx-1.5 text-[#9fc3ea]">·</span>
              <span className="font-bold">Carteirinha:</span> {insuranceCardNumber || 'Não informada'}
            </div>
            <div className="mt-2 text-[13px] text-[#c9d6e8]">
              <span className="font-bold text-white">Sexo:</span> {user.sexo || 'Não informado'}
            </div>

            <div className="flex gap-2.5 mt-5">
              <div className="flex-1 bg-white/10 rounded-[14px] p-3 backdrop-blur-xs">
                <div className="text-[11px] text-[#9fc3ea] font-bold tracking-wider">TIPO SANGUÍNEO</div>
                <div className="text-2xl font-extrabold mt-0.5">{bloodType}</div>
              </div>
              <div className="flex-[2] bg-white/10 rounded-[14px] p-3 backdrop-blur-xs">
                <div className="text-[11px] text-[#9fc3ea] font-bold tracking-wider">ALERGIAS</div>
                <div className="text-sm font-bold mt-1 line-clamp-2">{allergiesDisplay}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-2">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9fc3ea]">Condições</div>
                <div className="mt-1 break-words text-sm font-semibold text-white">
                  {resumoFicha.condicoes.length > 0 || resumoFicha.outrasDoencas
                    ? [...resumoFicha.condicoes, resumoFicha.outrasDoencas].filter(Boolean).join(' · ')
                    : 'Não informado'}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9fc3ea]">Contato de emergência</div>
                <div className="mt-1 break-words text-sm font-semibold text-white">{resumoFicha.contatoEmergencia || 'Não informado'}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2 text-xs font-bold text-white">
              Toque para ampliar a carteirinha
            </div>
          </button>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={triggerEmergencyModal}
              className="block w-full border border-[#f0b8b2] bg-white p-4.5 text-left rounded-[20px] shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] hover:border-[#a13a30] transition-colors"
            >
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-[#fde8e6] flex items-center justify-center shrink-0">
                  <Shield size={22} className="text-[#a13a30]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <b className="text-[15px] text-[#1d2a3d] block leading-tight">Ficha de emergência</b>
                  <div className="text-[13px] text-[#5a6a80] mt-0.5">Acesso rápido a contatos e alergias</div>
                </div>
                <ArrowRight size={16} className="text-[#a13a30]" />
              </div>
            </button>

            {/* Completude da ficha */}
            <div className="rounded-[20px] border border-[#dde3ec] bg-white p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                  <ClipboardCheck size={18} className="text-[#1b3a60]" />
                </div>
                <b className="text-sm text-[#1d2a3d] flex-1">Ficha médica</b>
                <span className="text-sm font-bold text-[#1b3a60]">{resumoFicha.coberturaPercentual}%</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1f4f8]">
                <div
                  className="h-full rounded-full bg-[#1f7fe0] transition-all"
                  style={{ width: `${resumoFicha.coberturaPercentual}%` }}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Atenção + Documentos por tipo */}
        <div className="mb-5 grid gap-5 lg:grid-cols-3">
          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                <AlertTriangle size={18} className="text-[#1b3a60]" />
              </div>
              <b className="text-base text-[#1d2a3d] flex-1">Precisa da sua atenção</b>
              {atencao.length > 0 && (
                <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-bold text-[#1b3a60]">
                  {atencao.length}
                </span>
              )}
            </div>

            {atencao.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                <CheckCircle2 size={16} className="text-[#1b3a60]" />
                Nada pendente: seus documentos estão processados e sem alertas em aberto.
              </p>
            ) : (
              <ul className="divide-y divide-[#dde3ec]">
                {atencao.map((item, index) => {
                  const severidade = SEVERIDADE_ALERTA[item.severidade?.toLowerCase()] ?? SEVERIDADE_ALERTA.baixa;
                  const conteudo = (
                    <>
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${severidade.fundo} ${severidade.cor}`}>
                        <AlertTriangle size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <b className="text-sm text-[#1d2a3d]">{item.titulo}</b>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${severidade.fundo} ${severidade.cor}`}>
                            {severidade.rotulo}
                          </span>
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-[#5a6a80]">{item.descricao}</span>
                      </span>
                      {item.documentoId && <ArrowRight size={15} className="mt-1.5 shrink-0 text-[#9aa8b8]" />}
                    </>
                  );

                  return (
                    <li key={`${item.tipo}-${item.documentoId ?? index}-${index}`}>
                      {item.documentoId ? (
                        <Link
                          href={`/documentos/${item.documentoId}`}
                          className="flex items-start gap-3 py-3.5 transition-colors hover:bg-[#f7f9fc]"
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
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#dde3ec] pt-4 text-[13px] text-[#5a6a80]">
                {indicadores.processando > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <LoaderCircle size={14} className="animate-spin text-[#1f7fe0]" />
                    {pluralizar(indicadores.processando, 'documento em processamento', 'documentos em processamento')}
                  </span>
                )}
                {indicadores.falhados > 0 && (
                  <span className="text-[#a13a30]">
                    {pluralizar(indicadores.falhados, 'documento com falha', 'documentos com falha')}
                  </span>
                )}
              </p>
            )}
          </section>

          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                <FileText size={18} className="text-[#1b3a60]" />
              </div>
              <b className="text-base text-[#1d2a3d] flex-1">Documentos por tipo</b>
            </div>

            {distribuicao.length === 0 ? (
              <p className="rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                Nenhum documento arquivado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {distribuicao.map((item) => (
                  <div key={item.tipo}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span className="font-semibold text-[#1d2a3d]">{item.rotulo}</span>
                      <span className="text-[#5a6a80]">{item.quantidade} · {item.percentual}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f1f4f8]">
                      <div className="h-full rounded-full bg-[#1f7fe0]" style={{ width: `${item.percentual}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Biomarcadores + Alertas */}
        <div className="mb-5 grid gap-5 lg:grid-cols-3">
          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                <HeartPulse size={18} className="text-[#1b3a60]" />
              </div>
              <b className="text-base text-[#1d2a3d] flex-1">Últimos resultados de exames</b>
              <Link href="/analises" className="text-[13px] font-bold text-[#1f7fe0] hover:underline">
                Ver tendências
              </Link>
            </div>

            {biomarcadores.length === 0 ? (
              <p className="rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                Ainda não há resultados de exames com valores registrados. Envie um exame para começar a acompanhar a evolução.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#dde3ec] text-[11px] uppercase tracking-wider text-[#5a6a80]">
                      <th className="py-2 pr-3 font-bold">Analito</th>
                      <th className="py-2 pr-3 font-bold">Último valor</th>
                      <th className="py-2 pr-3 font-bold">Referência</th>
                      <th className="py-2 pr-3 font-bold">Data</th>
                      <th className="py-2 font-bold">Medições</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1f5]">
                    {biomarcadores.map((item) => (
                      <tr key={item.nomeNormalizado} className="align-top">
                        <td className="py-3 pr-3 font-semibold text-[#1d2a3d]">
                          {item.documentoId ? (
                            <Link href={`/documentos/${item.documentoId}`} className="hover:text-[#1f7fe0] hover:underline">
                              {item.nome}
                            </Link>
                          ) : item.nome}
                          {item.foraDaFaixa && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#fde8e6] px-2 py-0.5 text-[11px] font-bold text-[#a13a30]">
                              <AlertTriangle size={11} /> Fora da faixa
                            </span>
                          )}
                        </td>
                        <td className={`py-3 pr-3 font-bold ${item.foraDaFaixa ? 'text-[#a13a30]' : 'text-[#1d2a3d]'}`}>
                          {valorExibido(item)}
                        </td>
                        <td className="py-3 pr-3 text-[#5a6a80]">{formatarFaixa(item)}</td>
                        <td className="py-3 pr-3 text-[#5a6a80]">{item.data || '—'}</td>
                        <td className="py-3 text-[#5a6a80]">{item.medicoes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                <Pill size={18} className="text-[#1b3a60]" />
              </div>
              <b className="text-base text-[#1d2a3d] flex-1">Alertas de medicamentos</b>
            </div>

            {alertas.length === 0 ? (
              <p className="rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
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
                      <p className="mb-0 mt-1 text-[13px] leading-relaxed text-[#1d2a3d]">{alerta.mensagem}</p>
                      {alerta.documentoId && (
                        <Link
                          href={`/documentos/${alerta.documentoId}`}
                          className="mt-1.5 inline-block text-[12px] font-bold text-[#1f7fe0] hover:underline"
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
        <div className="mb-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                <Stethoscope size={18} className="text-[#1b3a60]" />
              </div>
              <b className="text-base text-[#1d2a3d] flex-1">Profissionais e locais</b>
            </div>

            {consultas.length === 0 ? (
              <p className="rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                Nenhum profissional ou clínica identificado nos seus documentos.
              </p>
            ) : (
              <ul className="divide-y divide-[#dde3ec]">
                {consultas.map((item, index) => (
                  <li key={`${item.medico}-${item.clinica}-${index}`} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                      <Stethoscope size={16} className="text-[#1b3a60]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm text-[#1d2a3d]">
                        {item.medico || 'Profissional não informado'}
                      </b>
                      <span className="mt-0.5 block text-[13px] text-[#5a6a80]">
                        {[item.especialidade, item.clinica].filter(Boolean).join(' · ') || 'Sem detalhes'}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[12px] text-[#5a6a80]">
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

          <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                <Pill size={18} className="text-[#1b3a60]" />
              </div>
              <b className="text-base text-[#1d2a3d] flex-1">Medicamentos prescritos</b>
            </div>

            {medicamentosRecentes.length === 0 ? (
              <p className="rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
                Nenhum medicamento identificado nas receitas.
              </p>
            ) : (
              <ul className="divide-y divide-[#dde3ec]">
                {medicamentosRecentes.map((item, index) => (
                  <li key={`${item.nome}-${index}`} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                      <Pill size={16} className="text-[#1b3a60]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm text-[#1d2a3d]">{item.nome}</b>
                      <span className="mt-0.5 block text-[13px] text-[#5a6a80]">
                        {[item.dosagem, item.horario].filter(Boolean).join(' · ') || 'Sem posologia registrada'}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[12px] text-[#5a6a80]">
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
        <section className="rounded-[20px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
              <CalendarDays size={18} className="text-[#1b3a60]" />
            </div>
            <b className="text-base text-[#1d2a3d] flex-1">Documentos recentes</b>
            <Link href="/documentos" className="text-[13px] font-bold text-[#1f7fe0] hover:underline">
              Ver todos
            </Link>
          </div>

          {documentosRecentes.length === 0 ? (
            <p className="rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#5a6a80]">
              Você ainda não arquivou documentos. Comece enviando um exame, receita ou laudo.
            </p>
          ) : (
            <ul className="divide-y divide-[#dde3ec]">
              {documentosRecentes.map((doc, index) => (
                <li key={doc.id ?? index}>
                  {doc.id ? (
                    <Link
                      href={`/documentos/${doc.id}`}
                      className="flex items-start gap-3 py-3.5 transition-colors hover:bg-[#f7f9fc]"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                        <FileText size={16} className="text-[#1b3a60]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm text-[#1d2a3d]">{doc.titulo}</b>
                        <span className="mt-0.5 block text-[13px] text-[#5a6a80]">
                          {[doc.medico, doc.clinica].filter(Boolean).join(' · ') || 'Sem profissional identificado'}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[12px] text-[#5a6a80]">
                        <span className="block font-semibold text-[#1b3a60]">
                          {ROTULO_TIPO_DOCUMENTO[doc.tipo] ?? doc.tipo ?? 'Documento'}
                        </span>
                        <span className="block">{doc.data || new Date(doc.criadoEm).toLocaleDateString('pt-BR')}</span>
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 py-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]">
                        <FileText size={16} className="text-[#1b3a60]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm text-[#1d2a3d]">{doc.titulo}</b>
                        <span className="mt-0.5 block text-[13px] text-[#5a6a80]">{doc.medico || 'Sem profissional identificado'}</span>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Informações organizadas com segurança para o seu acompanhamento contínuo.
        </p>
      </main>

      {/* Carteirinha Modal */}
      <DialogPrimitive.Root open={isCarteirinhaOpen} onOpenChange={setIsCarteirinhaOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#f7f9fc] p-3 outline-none sm:p-6">
            <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[#dde3ec] bg-white px-2 py-3 sm:px-4">
              <DialogPrimitive.Title className="text-sm font-bold tracking-wide text-[#1b3a60] sm:text-base">
                Carteirinha de Saúde
              </DialogPrimitive.Title>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Diminuir zoom" onClick={() => setCardZoom((zoom) => Math.max(0.75, Number((zoom - 0.15).toFixed(2))))} disabled={cardZoom <= 0.75} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1b3a60] hover:bg-[#f1f4f8] disabled:opacity-40">
                  <ZoomOut size={19} />
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-[#5a6a80]">{Math.round(cardZoom * 100)}%</span>
                <button type="button" aria-label="Aumentar zoom" onClick={() => setCardZoom((zoom) => Math.min(1.6, Number((zoom + 0.15).toFixed(2))))} disabled={cardZoom >= 1.6} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1b3a60] hover:bg-[#f1f4f8] disabled:opacity-40">
                  <ZoomIn size={19} />
                </button>
                <DialogPrimitive.Close aria-label="Fechar carteirinha" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5a6a80] hover:bg-slate-100 transition-colors">
                  <X size={18} />
                </DialogPrimitive.Close>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-1 sm:p-4">
              <div style={{ zoom: cardZoom }} className="mx-auto max-w-3xl">
                <div className="bg-gradient-to-br from-[#1b3a60] to-[#24507f] text-white rounded-2xl p-6 shadow-md mb-4">
                  <div className="text-xs tracking-wider text-[#9fc3ea] font-bold">
                    SAÚDEMÉMORA · IDENTIFICAÇÃO PESSOAL
                  </div>
                  <div className="text-2xl font-black mt-2">{fullName}</div>
                  <div className="text-xs text-[#c9d6e8] mt-1">
                    Nascimento: {birthDateFormatted}{age !== null ? ` · Idade: ${age} anos` : ''}
                  </div>
                  <div className="mt-2 text-sm text-white"><strong>Sexo:</strong> {user.sexo || 'Não informado'}</div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="text-[10px] text-[#9fc3ea] font-bold">TIPO SANGUÍNEO</div>
                      <div className="text-xl font-black">{bloodType}</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <div className="text-[10px] text-[#9fc3ea] font-bold">DOADOR DE ÓRGÃOS</div>
                      <div className="text-sm font-bold mt-1">{resumoFicha.doadorOrgaos ? 'Sim, doador' : 'Não informado'}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-xs text-[#c9d6e8]">
                    <div><strong className="text-white">Alergias:</strong> {allergiesDisplay}</div>
                    <div>
                      <strong className="text-white">Condições:</strong>{' '}
                      {[...resumoFicha.condicoes, resumoFicha.outrasDoencas].filter(Boolean).join(' · ') || 'Não informado'}
                    </div>
                    <div><strong className="text-white">Remédios contínuos:</strong> {resumoFicha.medicamentosContinuos.join(', ') || 'Nenhum'}</div>
                    <div><strong className="text-white">Cirurgias:</strong> {resumoFicha.cirurgias || 'Não informado'}</div>
                    <div><strong className="text-white">Contato de emergência:</strong> {resumoFicha.contatoEmergencia || 'Não informado'}</div>
                    <div><strong className="text-white">Plano de saúde:</strong> {resumoFicha.planoSaude || 'Não cadastrado'}</div>
                    <div><strong className="text-white">Número da carteirinha:</strong> {resumoFicha.numeroCarteirinha || 'Não informado'}</div>
                  </div>
                </div>

                {registeredCardUrl && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-[#dde3ec] bg-[#f7f9fc]">
                    {/\.pdf(?:[?#]|$)/i.test(registeredCardUrl) ? (
                      <a
                        href={registeredCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-14 items-center gap-2 px-4 text-sm font-semibold text-[#1b3a60] hover:bg-[#f1f4f8]"
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

                <div className="mt-4 rounded-xl border border-[#dde3ec] bg-white p-4 text-sm text-[#33445d]">
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
