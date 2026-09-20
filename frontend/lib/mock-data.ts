export type DocStatus = "processed" | "pending" | "review" | "pronto" | "processando" | "arquivado";
export type DocType = "exame" | "receita" | "laudo";

export type MedDoc = {
  id: string;
  title: string;
  type: DocType;
  date: string;
  doctor: string;
  clinic: string;
  status: DocStatus;
  summary: string;
  diagnosis: string;
  medicines: { name: string; dosage: string; schedule: string }[];
};

export const documents: MedDoc[] = [
  {
    id: "hemograma-2026-08",
    title: "Hemograma Completo",
    type: "exame",
    date: "12 ago 2026",
    doctor: "Dra. Marina Costa",
    clinic: "Laboratório Vita",
    status: "processed",
    summary: "Série vermelha e branca dentro dos valores de referência.",
    diagnosis: "Sem alterações significativas",
    medicines: [],
  },
  {
    id: "receita-losartana",
    title: "Receita — Losartana 50mg",
    type: "receita",
    date: "02 ago 2026",
    doctor: "Dr. Paulo Andrade",
    clinic: "Cardio Clínica SP",
    status: "processed",
    summary: "Uso contínuo por 90 dias, retorno em novembro.",
    diagnosis: "Hipertensão arterial essencial",
    medicines: [
      { name: "Losartana Potássica", dosage: "50 mg", schedule: "1x ao dia — manhã" },
      { name: "Hidroclorotiazida", dosage: "25 mg", schedule: "1x ao dia — manhã" },
    ],
  },
  {
    id: "laudo-ressonancia",
    title: "Laudo — Ressonância de Joelho",
    type: "laudo",
    date: "28 jul 2026",
    doctor: "Dr. Henrique Lima",
    clinic: "Instituto de Imagem",
    status: "review",
    summary: "Discreto edema em menisco medial. Revisar dados extraídos.",
    diagnosis: "Lesão meniscal grau I",
    medicines: [{ name: "Ibuprofeno", dosage: "600 mg", schedule: "8/8h por 5 dias" }],
  },
  {
    id: "exame-glicemia",
    title: "Glicemia de Jejum",
    type: "exame",
    date: "19 jul 2026",
    doctor: "Dra. Marina Costa",
    clinic: "Laboratório Vita",
    status: "pending",
    summary: "Documento enviado, aguardando processamento por IA.",
    diagnosis: "—",
    medicines: [],
  },
  {
    id: "laudo-cardiologico",
    title: "Relatório Cardiológico Anual",
    type: "laudo",
    date: "05 jul 2026",
    doctor: "Dr. Paulo Andrade",
    clinic: "Cardio Clínica SP",
    status: "processed",
    summary: "Função ventricular preservada, manter tratamento atual.",
    diagnosis: "Hipertensão controlada",
    medicines: [],
  },
  {
    id: "receita-vitamina-d",
    title: "Receita — Vitamina D",
    type: "receita",
    date: "21 jun 2026",
    doctor: "Dra. Camila Reis",
    clinic: "Clínica Bem Viver",
    status: "processed",
    summary: "Reposição por 6 meses.",
    diagnosis: "Hipovitaminose D",
    medicines: [{ name: "Colecalciferol", dosage: "7.000 UI", schedule: "1x por semana" }],
  },
];

export const typeLabels: Record<DocType, string> = {
  exame: "Exame",
  receita: "Receita",
  laudo: "Laudo clínico",
};

export const statusLabels: Record<DocStatus, string> = {
  processed: "Processado por IA",
  pending: "Pendente",
  review: "Revisar dados",
  pronto: "Pronto",
  processando: "Processando...",
  arquivado: "Arquivado",
};
