import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DocumentRecord from '@/lib/models/DocumentRecord';
import { getUserFromRequest } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenAI } from '@google/genai';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    let docType = formData.get('type') as string;

    if (!file) return NextResponse.json({ message: 'Nenhum arquivo enviado' }, { status: 400 });
    if (!docType) docType = 'receita';

    // 1. Upload to Cloudinary via ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'saudememora' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const imageUrl = uploadResult.secure_url;
    const publicId = uploadResult.public_id;

    // 2. OCR AI Processing via Gemini
    let extractedData = {
      title: 'Documento Clínico',
      doctor: '',
      clinic: '',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      diagnosis: '',
      extractedText: '',
      medicines: [] as any[]
    };

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const mimeType = file.type;

      const prompt = `
Você é um especialista em extração de dados médicos. Analise esta imagem e retorne um JSON válido sem marcações markdown.
O documento é do tipo: ${docType}.

Modelo esperado:
{
  "Title": "Título do documento (ex: Receita de Ibuprofeno, Hemograma Completo)",
  "Doctor": "Nome do médico",
  "Clinic": "Clínica ou laboratório",
  "Date": "Data no formato YYYY-MM-DD",
  "Summary": "Resumo em 1-2 frases simples do que é este documento",
  "Diagnosis": "Qualquer diagnóstico, indicação clínica ou CID mencionado",
  "Medicines": [{"Name": "Nome", "Dosage": "Dosagem/Uso"}],
  "ExtractedText": "Todo o texto bruto legível encontrado"
}`;
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: buffer.toString("base64"),
              mimeType: mimeType
            }
          }
        ]
      });

      let jsonStr = response.text || "{}";
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(jsonStr);

      extractedData = {
        title: aiData.Title || `Novo ${docType}`,
        doctor: aiData.Doctor || '',
        clinic: aiData.Clinic || '',
        date: aiData.Date || new Date().toISOString().split('T')[0],
        summary: aiData.Summary || '',
        diagnosis: aiData.Diagnosis || '',
        extractedText: aiData.ExtractedText || '',
        medicines: (aiData.Medicines || []).map((m: any) => ({
          name: m.Name,
          dosage: m.Dosage
        }))
      };
    } catch (e) {
      console.error('Gemini OCR Error:', e);
      // Failsafe se o OCR der erro, salvamos mesmo assim com os dados básicos
      extractedData.title = `Novo Documento (${docType})`;
      extractedData.extractedText = 'Erro ao processar OCR.';
    }

    // 3. Salvar no MongoDB
    await connectToDatabase();
    const docRecord = new DocumentRecord({
      patientId: user.id,
      imageUrl,
      publicId,
      type: docType,
      status: 'pronto',
      title: extractedData.title,
      doctor: extractedData.doctor,
      clinic: extractedData.clinic,
      date: extractedData.date,
      summary: extractedData.summary,
      diagnosis: extractedData.diagnosis,
      extractedText: extractedData.extractedText,
      medicines: extractedData.medicines,
    });

    await docRecord.save();

    return NextResponse.json({ id: docRecord._id, message: 'Documento processado com sucesso!' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no upload de documento:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
