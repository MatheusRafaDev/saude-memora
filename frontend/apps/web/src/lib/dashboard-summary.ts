import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';

/**
 * Resumo agregado da Visão geral.
 *
 * Vem de `/api/dashboard/resumo` em uma única chamada. O cálculo é feito no servidor
 * porque os indicadores (exames fora da faixa, alertas ativos, consultas por profissional,
 * cobertura da ficha) dependem do conteúdo completo de cada documento — montar isso no
 * cliente exigiria uma requisição de detalhe por documento.
 *
 * Nota: o tipo é declarado aqui porque o cliente gerado pelo Orval ainda não conhece este
 * endpoint (o `openapi.json` precisa ser regenerado a partir do backend).
 */
export type DashboardIndicadores = {
  total: number;
  prontos: number;
  processando: number;
  falhados: number;
  exames: number;
  receitas: number;
  receitasAtivas: number;
  revisaoPendente: number;
};

export type DashboardItemAtencao = {
  tipo: string;
  severidade: string;
  titulo: string;
  descricao: string;
  documentoId?: string | null;
};

export type DashboardDistribuicao = {
  tipo: string;
  rotulo: string;
  quantidade: number;
  percentual: number;
};

export type DashboardBiomarcador = {
  nome: string;
  nomeNormalizado: string;
  ultimoValor?: number | null;
  valorTexto: string;
  unidade: string;
  refMin?: number | null;
  refMax?: number | null;
  status: string;
  foraDaFaixa: boolean;
  data: string;
  documentoId?: string | null;
  medicoes: number;
};

export type DashboardConsulta = {
  medico: string;
  clinica: string;
  especialidade: string;
  totalDocumentos: number;
  ultimaData: string;
};

export type DashboardMedicamento = {
  nome: string;
  dosagem: string;
  horario: string;
  documentoId?: string | null;
  data: string;
  prescricoes: number;
};

export type DashboardFicha = {
  tipoSanguineo: string;
  doadorOrgaos: boolean;
  alergias: string[];
  condicoes: string[];
  outrasDoencas: string;
  medicamentosContinuos: string[];
  cirurgias: string;
  historicoFamiliar: string;
  fuma: boolean;
  bebe: boolean;
  habitosGerais: string;
  contatoEmergencia: string;
  planoSaude: string;
  numeroCarteirinha: string;
  coberturaPercentual: number;
  itensPendentes: string[];
};

export type DashboardDocumentoRecente = {
  id?: string | null;
  titulo: string;
  tipo: string;
  data: string;
  medico: string;
  clinica: string;
  status: string;
  criadoEm: string;
};

export type DashboardAlerta = {
  tipo: string;
  severidade: string;
  mensagem: string;
  medicamentos: string[];
  documentoId?: string | null;
  titulo: string;
};

export type DashboardResumo = {
  indicadores: DashboardIndicadores;
  atencao: DashboardItemAtencao[];
  distribuicao: DashboardDistribuicao[];
  biomarcadores: DashboardBiomarcador[];
  consultas: DashboardConsulta[];
  medicamentosRecentes: DashboardMedicamento[];
  ficha: DashboardFicha;
  documentosRecentes: DashboardDocumentoRecente[];
  alertas: DashboardAlerta[];
};

export function useDashboardResumo() {
  return useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: () => customFetch<DashboardResumo>('/api/dashboard/resumo'),
    // Conteúdo clínico: mantemos em cache curto para voltar à tela sem recarregar tudo.
    staleTime: 60_000,
  });
}

/** Rótulos em pt-BR para os tipos de documento usados no sistema. */
export const ROTULO_TIPO_DOCUMENTO: Record<string, string> = {
  exame: 'Exame',
  receita: 'Receita',
  laudo: 'Laudo',
  atestado: 'Atestado',
  vacina: 'Vacina',
  encaminhamento: 'Encaminhamento',
  relatorio: 'Relatório',
  outro: 'Outro',
};

/** Rótulos e cores para severidade de alertas. */
export const SEVERIDADE_ALERTA: Record<string, { rotulo: string; cor: string; fundo: string }> = {
  alta: { rotulo: 'Alta', cor: 'text-[#E8664A]', fundo: 'bg-[#E8664A]/10' },
  moderada: { rotulo: 'Moderada', cor: 'text-[#8a5a00]', fundo: 'bg-[#fdf3e0]' },
  media: { rotulo: 'Moderada', cor: 'text-[#8a5a00]', fundo: 'bg-[#fdf3e0]' },
  baixa: { rotulo: 'Baixa', cor: 'text-[#1D4ED8]', fundo: 'bg-[#CFE0FF]/40' },
};
