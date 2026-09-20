import mongoose, { Schema, Document } from 'mongoose';

export interface IFichaMedica extends Document {
  patientId: string;
  historicoFamiliar?: string;
  cirurgias?: string;
  fuma?: boolean;
  bebe?: boolean;
  habitosGerais?: string;
  observacoes?: string;
  updatedAt: Date;
}

const FichaMedicaSchema: Schema = new Schema({
  patientId: { type: String, required: true, unique: true },
  historicoFamiliar: { type: String },
  cirurgias: { type: String },
  fuma: { type: Boolean, default: false },
  bebe: { type: Boolean, default: false },
  habitosGerais: { type: String },
  observacoes: { type: String },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'FichaMedicas'
});

export default mongoose.models.FichaMedica || mongoose.model<IFichaMedica>('FichaMedica', FichaMedicaSchema);
