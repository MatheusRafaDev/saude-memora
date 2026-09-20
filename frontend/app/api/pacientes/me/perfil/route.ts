import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Paciente from '@/lib/models/Paciente';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const dto = await req.json();
    await connectToDatabase();

    const paciente = await Paciente.findById(user.id);
    if (!paciente) return NextResponse.json({ message: 'Paciente não encontrado' }, { status: 404 });

    if (dto.tipoSanguineo !== undefined) paciente.tipoSanguineo = dto.tipoSanguineo;
    if (dto.doadorOrgaos !== undefined) paciente.doadorOrgaos = dto.doadorOrgaos;
    if (dto.alergias !== undefined) paciente.alergias = dto.alergias;
    if (dto.doencasCronicas !== undefined) paciente.doencasCronicas = dto.doencasCronicas;
    if (dto.medicamentosContinuos !== undefined) {
      paciente.medicamentosContinuos = dto.medicamentosContinuos.map((m: any) => ({
        nome: m.nome,
        dosagem: m.dosagem,
        horario: m.horario
      }));
    }

    await paciente.save();
    return NextResponse.json({ message: 'Perfil atualizado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro em pacientes/me/perfil:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
