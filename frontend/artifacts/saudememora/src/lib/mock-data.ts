import type { Activity, MedicalDocument, MedicalRecord, UserProfile } from './types';

export const initialProfile: UserProfile = {
  name: 'Marina Costa',
  email: 'marina.costa@email.com',
  cpf: '•••.•••.•••-42',
  birthDate: '1992-08-17',
  phone: '(11) 98842-1760',
  bloodType: 'O+',
  allergies: 'Dipirona, poeira',
  chronicDiseases: 'Nenhuma',
  organDonor: true,
};

export const initialRecord: MedicalRecord = {
  familyHistory: 'Hipertensão (avó materna)',
  previousConditions: 'Anemia ferropriva em 2019',
  surgeries: 'Apendicectomia — 2011',
  smoker: 'Não',
  alcohol: 'Socialmente',
  exercise: 'Caminhada, 3 vezes por semana',
  notes: 'Prefiro receber orientações por escrito.',
};

export const initialDocuments: MedicalDocument[] = [
  { id: 'doc-1', title: 'Hemograma completo', date: '2024-05-18', doctor: 'Dra. Helena Prado', clinic: 'Laboratório Vitta', type: 'exam', status: 'processed', summary: 'Exame de sangue com resultados dentro dos valores de referência, com ferritina levemente reduzida.', diagnosis: 'Sem alterações significativas. Acompanhar ferritina.', medicines: [] },
  { id: 'doc-2', title: 'Receita — vitamina D', date: '2024-04-03', doctor: 'Dr. Rafael Nunes', clinic: 'Clínica Horizonte', type: 'prescription', status: 'processed', summary: 'Prescrição de suplementação de vitamina D por 12 semanas.', diagnosis: 'Insuficiência de vitamina D', medicines: [{ name: 'Vitamina D3', dosage: '7.000 UI · 1 cápsula por semana' }] },
  { id: 'doc-3', title: 'Ultrassonografia abdominal', date: '2024-02-26', doctor: 'Dra. Camila Valença', clinic: 'Imagem & Cuidado', type: 'report', status: 'review', summary: 'Avaliação ultrassonográfica de fígado, vias biliares, pâncreas e rins.', diagnosis: 'Esteatose hepática grau I', medicines: [] },
  { id: 'doc-4', title: 'Painel tireoidiano', date: '2023-11-09', doctor: 'Dra. Helena Prado', clinic: 'Laboratório Vitta', type: 'exam', status: 'processed', summary: 'TSH e T4 livre em níveis adequados para o momento.', diagnosis: 'Função tireoidiana preservada', medicines: [] },
  { id: 'doc-5', title: 'Relatório de consulta', date: '2023-08-14', doctor: 'Dr. Rafael Nunes', clinic: 'Clínica Horizonte', type: 'report', status: 'processed', summary: 'Consulta de acompanhamento anual e revisão do histórico de saúde.', diagnosis: 'Saúde geral estável', medicines: [] },
  { id: 'doc-6', title: 'Receita — loratadina', date: '2023-06-22', doctor: 'Dra. Lívia Melo', clinic: 'Pronto Atendimento Norte', type: 'prescription', status: 'processed', summary: 'Prescrição para alívio temporário de sintomas alérgicos.', diagnosis: 'Rinite alérgica', medicines: [{ name: 'Loratadina', dosage: '10 mg · 1 comprimido ao dia' }] },
];

export const initialActivities: Activity[] = [
  { id: 'act-1', label: 'Hemograma completo processado', timestamp: 'Hoje, 09:42', type: 'upload' },
  { id: 'act-2', label: 'Perfil de saúde atualizado', timestamp: 'Ontem, 18:20', type: 'profile' },
  { id: 'act-3', label: 'Relatório de consulta visualizado', timestamp: '12 jun, 14:05', type: 'view' },
  { id: 'act-4', label: 'Anamnese revisada', timestamp: '08 jun, 10:18', type: 'edit' },
];
