import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentRecord extends Document {
  patientId: string;
  title: string;
  type: string; // exame | receita | laudo
  status: string; // processando | pronto | arquivado
  doctor?: string;
  crm?: string;
  medicines?: { name: string; dosage: string; schedule?: string }[];
  examName?: string;
  examType?: string;
  clinic?: string;
  result?: string;
  specialty?: string;
  clinicalType?: string;
  content?: string;
  conclusions?: string;
  date?: string;
  observations?: string;
  summary?: string;
  diagnosis?: string;
  imageUrl?: string;
  publicId?: string;
  extractedText?: string;
  createdAt: Date;
}

const DocumentRecordSchema: Schema = new Schema({
  patientId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, default: 'processando' },
  doctor: { type: String },
  crm: { type: String },
  medicines: [{
    name: { type: String },
    dosage: { type: String },
    schedule: { type: String }
  }],
  examName: { type: String },
  examType: { type: String },
  clinic: { type: String },
  result: { type: String },
  specialty: { type: String },
  clinicalType: { type: String },
  content: { type: String },
  conclusions: { type: String },
  date: { type: String },
  observations: { type: String },
  summary: { type: String },
  diagnosis: { type: String },
  imageUrl: { type: String },
  publicId: { type: String },
  extractedText: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'Documents'
});

export default mongoose.models.DocumentRecord || mongoose.model<IDocumentRecord>('DocumentRecord', DocumentRecordSchema);
