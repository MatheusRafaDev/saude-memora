export type DocumentType = 'exam' | 'prescription' | 'report';
export type DocumentStatus = 'processed' | 'processing' | 'review';

export type Medicine = { nome: string; dosagem: string };

export type MedicalDocument = {
  id: string;
  titulo: string;
  data: string;
  medico: string;
  clinica: string;
  tipo: DocumentType;
  status: DocumentStatus;
  resumo: string;
  diagnostico: string;
  medicamentos: Medicine[];
};

export type UserProfile = {
  nome: string;
  email: string;
  cpf: string;
  birthdata: string;
  phone: string;
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  organDonor: boolean;
};

export type MedicalRecord = {
  familyHistory: string;
  previousConditions: string;
  surgeries: string;
  smoker: string;
  alcohol: string;
  exercise: string;
  notes: string;
};

export type Activity = { id: string; label: string; timestamp: string; tipo: 'upload' | 'edit' | 'view' | 'profile' };



