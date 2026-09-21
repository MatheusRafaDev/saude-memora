export type DocumentType = 'exam' | 'prescription' | 'report';
export type DocumentStatus = 'processed' | 'processing' | 'review';

export type Medicine = { name: string; dosage: string };

export type MedicalDocument = {
  id: string;
  title: string;
  date: string;
  doctor: string;
  clinic: string;
  type: DocumentType;
  status: DocumentStatus;
  summary: string;
  diagnosis: string;
  medicines: Medicine[];
};

export type UserProfile = {
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
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

export type Activity = { id: string; label: string; timestamp: string; type: 'upload' | 'edit' | 'view' | 'profile' };