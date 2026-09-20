import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DocumentRecord from '@/lib/models/DocumentRecord';
import { getUserFromRequest } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    await connectToDatabase();
    const doc = await DocumentRecord.findById(id);

    if (!doc || doc.patientId !== user.id) {
      return NextResponse.json({ message: 'Documento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      doctor: doc.doctor,
      clinic: doc.clinic,
      date: doc.date,
      summary: doc.summary,
      diagnosis: doc.diagnosis,
      medicines: doc.medicines?.map((m: any) => ({ name: m.name, dosage: m.dosage })),
      imageUrl: doc.imageUrl,
      extractedText: doc.extractedText,
      createdAt: doc.createdAt
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro em GET document by id:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    await connectToDatabase();
    const doc = await DocumentRecord.findById(id);

    if (!doc || doc.patientId !== user.id) {
      return NextResponse.json({ message: 'Documento não encontrado' }, { status: 404 });
    }

    if (doc.publicId && doc.publicId !== "mock_public_id_12345") {
      try {
        await cloudinary.uploader.destroy(doc.publicId);
      } catch (e) {
        console.error("Erro ao deletar imagem do Cloudinary:", e);
      }
    }

    await DocumentRecord.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Documento deletado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro em DELETE document by id:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
