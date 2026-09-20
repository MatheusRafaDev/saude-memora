import mongoose, { Schema, Document } from 'mongoose';

export interface IPaciente extends Document {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  email: string;
  senha?: string; // Hashed
  telefone?: string;
  endereco?: string;
  tipoSanguineo?: string;
  doadorOrgaos?: boolean;
  alergias?: string[];
  doencasCronicas?: string[];
  medicamentosContinuos?: {
    nome: string;
    dosagem: string;
    horario: string;
  }[];
}

const PacienteSchema: Schema = new Schema({
  nome: { type: String, required: true },
  cpf: { type: String, required: true, unique: true },
  dataNascimento: { type: String, required: true },
  sexo: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  telefone: { type: String },
  endereco: { type: String },
  tipoSanguineo: { type: String },
  doadorOrgaos: { type: Boolean, default: false },
  alergias: [{ type: String }],
  doencasCronicas: [{ type: String }],
  medicamentosContinuos: [{
    nome: { type: String },
    dosagem: { type: String },
    horario: { type: String }
  }]
}, {
  timestamps: true,
  collection: 'Pacientes'
});

export default mongoose.models.Paciente || mongoose.model<IPaciente>('Paciente', PacienteSchema);
