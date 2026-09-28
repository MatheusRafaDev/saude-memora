import type { Activity, MedicalDocument, MedicalRecord, UserProfile } from './types';

export const initialProfile: UserProfile = {
  nome: 'Marina Costa',
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
  { id: 'doc-1', titulo: 'Hemograma completo', data: '2024-05-18', medico: 'Dra. Helena Prado', clinica: 'Laboratório Vitta', tipo: 'exam', status: 'processed', resumo: 'Exame de sangue com resultados dentro dos valores de referência, com ferritina levemente reduzida.', diagnostico: 'Sem alterações significativas. Acompanhar ferritina.', medicamentos: [] },
  { id: 'doc-2', titulo: 'Receita — vitamina D', data: '2024-04-03', medico: 'Dr. Rafael Nunes', clinica: 'Clínica Horizonte', tipo: 'prescription', status: 'processed', resumo: 'Prescrição de suplementação de vitamina D por 12 semanas.', diagnostico: 'Insuficiência de vitamina D', medicamentos: [{ nome: 'Vitamina D3', dosagem: '7.000 UI · 1 cápsula por semana' }] },
  { id: 'doc-3', titulo: 'Ultrassonografia abdominal', data: '2024-02-26', medico: 'Dra. Camila Valença', clinica: 'Imagem & Cuidado', tipo: 'report', status: 'review', resumo: 'Avaliação ultrassonográfica de fígado, vias biliares, pâncreas e rins.', diagnostico: 'Esteatose hepática grau I', medicamentos: [] },
  { id: 'doc-4', titulo: 'Painel tireoidiano', data: '2023-11-09', medico: 'Dra. Helena Prado', clinica: 'Laboratório Vitta', tipo: 'exam', status: 'processed', resumo: 'TSH e T4 livre em níveis adequados para o momento.', diagnostico: 'Função tireoidiana preservada', medicamentos: [] },
  { id: 'doc-5', titulo: 'Relatório de consulta', data: '2023-08-14', medico: 'Dr. Rafael Nunes', clinica: 'Clínica Horizonte', tipo: 'report', status: 'processed', resumo: 'Consulta de acompanhamento anual e revisão do histórico de saúde.', diagnostico: 'Saúde geral estável', medicamentos: [] },
  { id: 'doc-6', titulo: 'Receita — loratadina', data: '2023-06-22', medico: 'Dra. Lívia Melo', clinica: 'Pronto Atendimento Norte', tipo: 'prescription', status: 'processed', resumo: 'Prescrição para alívio temporário de sintomas alérgicos.', diagnostico: 'Rinite alérgica', medicamentos: [{ nome: 'Loratadina', dosagem: '10 mg · 1 comprimido ao dia' }] },
];

export const initialActivities: Activity[] = [
  { id: 'act-1', label: 'Hemograma completo processado', timestamp: 'Hoje, 09:42', tipo: 'upload' },
  { id: 'act-2', label: 'Perfil de saúde atualizado', timestamp: 'Ontem, 18:20', tipo: 'profile' },
  { id: 'act-3', label: 'Relatório de consulta visualizado', timestamp: '12 jun, 14:05', tipo: 'view' },
  { id: 'act-4', label: 'Anamnese revisada', timestamp: '08 jun, 10:18', tipo: 'edit' },
];


