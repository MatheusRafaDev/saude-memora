import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Paciente from '@/lib/models/Paciente';
import { getUserFromRequest } from '@/lib/auth';
import { differenceInYears, parseISO } from 'date-fns';
import DocumentRecord from '@/lib/models/DocumentRecord';
import FichaMedica from '@/lib/models/FichaMedica';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await connectToDatabase();
    const paciente = await Paciente.findById(user.id);
    if (!paciente) return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 });

    let idade = 0;
    if (paciente.dataNascimento) {
      try {
        idade = differenceInYears(new Date(), parseISO(paciente.dataNascimento));
      } catch (e) {}
    }

    return NextResponse.json({
      id: paciente._id,
      nome: paciente.nome,
      email: paciente.email,
      cpf: paciente.cpf,
      dataNascimento: paciente.dataNascimento,
      Idade: idade,
      sexo: paciente.sexo,
      telefone: paciente.telefone,
      endereco: paciente.endereco,
      tipoSanguineo: paciente.tipoSanguineo,
      doadorOrgaos: paciente.doadorOrgaos,
      alergias: paciente.alergias,
      doencasCronicas: paciente.doencasCronicas,
      MedicamentosContinuos: paciente.medicamentosContinuos?.map(m => ({
        name: m.nome,
        dosage: m.dosagem,
        schedule: m.horario
      })) || []
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro em pacientes/me:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await connectToDatabase();
    
    // Deletar documentos e imagens do Cloudinary
    const docs = await DocumentRecord.find({ patientId: user.id });
    for (const doc of docs) {
      if (doc.publicId && doc.publicId !== "mock_public_id_12345") {
        try {
          await cloudinary.uploader.destroy(doc.publicId);
        } catch (e) {
          console.error("Cloudinary delete error:", e);
        }
      }
      await DocumentRecord.findByIdAndDelete(doc._id);
    }

    // Deletar ficha médica
    await FichaMedica.findOneAndDelete({ patientId: user.id });

    // Deletar paciente
    await Paciente.findByIdAndDelete(user.id);

    return NextResponse.json({ message: 'Conta excluída com sucesso.' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao deletar conta:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
