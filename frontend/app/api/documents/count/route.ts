import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DocumentRecord from '@/lib/models/DocumentRecord';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await connectToDatabase();
    const docs = await DocumentRecord.find({ patientId: user.id });

    const exames = docs.filter(d => d.type === 'exame').length;
    const receitas = docs.filter(d => d.type === 'receita').length;
    const laudos = docs.filter(d => d.type === 'laudo').length;
    const receitasAtivas = docs.filter(d => d.type === 'receita' && d.status === 'pronto').length;

    return NextResponse.json({
      total: docs.length,
      exames,
      receitas,
      laudos,
      receitasAtivas
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro em GET documents/count:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
