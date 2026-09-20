import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import FichaMedica from '@/lib/models/FichaMedica';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await connectToDatabase();
    const ficha = await FichaMedica.findOne({ patientId: user.id });
    if (!ficha) return NextResponse.json({ message: 'Ficha médica não encontrada' }, { status: 404 });

    return NextResponse.json(ficha, { status: 200 });

  } catch (error: any) {
    console.error('Erro em GET ficha-medica:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const dto = await req.json();
    await connectToDatabase();

    let ficha = await FichaMedica.findOne({ patientId: user.id });
    
    if (!ficha) {
      ficha = new FichaMedica({
        patientId: user.id,
        ...dto
      });
      await ficha.save();
      return NextResponse.json(ficha, { status: 200 });
    }

    if (dto.historicoFamiliar !== undefined) ficha.historicoFamiliar = dto.historicoFamiliar;
    if (dto.cirurgias !== undefined) ficha.cirurgias = dto.cirurgias;
    if (dto.fuma !== undefined) ficha.fuma = dto.fuma;
    if (dto.bebe !== undefined) ficha.bebe = dto.bebe;
    if (dto.habitosGerais !== undefined) ficha.habitosGerais = dto.habitosGerais;
    if (dto.observacoes !== undefined) ficha.observacoes = dto.observacoes;
    ficha.updatedAt = new Date();

    await ficha.save();
    return NextResponse.json(ficha, { status: 200 });

  } catch (error: any) {
    console.error('Erro em PATCH ficha-medica:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
