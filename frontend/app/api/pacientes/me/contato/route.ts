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

    if (dto.telefone !== undefined) paciente.telefone = dto.telefone;
    if (dto.endereco !== undefined) paciente.endereco = dto.endereco;

    await paciente.save();
    return NextResponse.json({ message: 'Contato atualizado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro em pacientes/me/contato:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
