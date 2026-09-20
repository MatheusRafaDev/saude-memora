import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DocumentRecord from '@/lib/models/DocumentRecord';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await connectToDatabase();
    const docs = await DocumentRecord.find({ patientId: user.id }).sort({ createdAt: -1 });

    const mappedDocs = docs.map(d => ({
      id: d._id,
      title: d.title,
      type: d.type,
      status: d.status,
      doctor: d.doctor,
      clinic: d.clinic,
      date: d.date,
      summary: d.summary,
      diagnosis: d.diagnosis,
      medicines: d.medicines?.map((m: any) => ({ name: m.name, dosage: m.dosage })),
      imageUrl: d.imageUrl,
      createdAt: d.createdAt
    }));

    return NextResponse.json(mappedDocs, { status: 200 });

  } catch (error: any) {
    console.error('Erro em GET documents:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
