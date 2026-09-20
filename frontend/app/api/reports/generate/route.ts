import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Paciente from '@/lib/models/Paciente';
import FichaMedica from '@/lib/models/FichaMedica';
import DocumentRecord from '@/lib/models/DocumentRecord';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const monthsParam = searchParams.get('months');
    const months = monthsParam ? parseInt(monthsParam) : 6;

    await connectToDatabase();
    
    const paciente = await Paciente.findById(user.id);
    const ficha = await FichaMedica.findOne({ patientId: user.id });
    const docs = await DocumentRecord.find({ patientId: user.id });

    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() - months);
    
    const recentDocs = docs.filter(d => new Date(d.createdAt) >= limitDate);

    let prompt = `
Você é um médico especialista montando um dossiê clínico (prontuário resumido) para outro médico ler antes da consulta.
Aqui estão os dados do paciente:

[Perfil]:
Nome: ${paciente?.nome}, Sexo: ${paciente?.sexo}, Tipo Sanguíneo: ${paciente?.tipoSanguineo}
Alergias: ${(paciente?.alergias || []).join(", ")}
Doenças Crônicas: ${(paciente?.doencasCronicas || []).join(", ")}

[Ficha Médica]:
Histórico Familiar: ${ficha?.historicoFamiliar}
Cirurgias: ${ficha?.cirurgias}
Fuma: ${ficha?.fuma}, Bebe: ${ficha?.bebe}
Hábitos: ${ficha?.habitosGerais}
Obs: ${ficha?.observacoes}

[Documentos e Exames Recentes (últimos ${months} meses)]:
`;

    for (const doc of recentDocs) {
      prompt += `\n- ${doc.date || ''} | ${doc.type.toUpperCase()} | ${doc.title}: ${doc.summary || ''} | Diagnóstico: ${doc.diagnosis || ''}`;
      if (doc.medicines && doc.medicines.length > 0) {
        prompt += ` | Remédios: ${doc.medicines.map((m:any) => m.name + " " + m.dosage).join(", ")}`;
      }
    }

    prompt += "\n\nCrie um relatório médico coeso, profissional e bem formatado em Markdown destacando os pontos principais, evolução e estado atual. Seja direto.";

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ message: 'GROQ_API_KEY não configurada' }, { status: 400 });
    }

    const payload = {
      model: "groq/compound", // Pode ser llama-3.1-70b-versatile ou algo equivalente
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return NextResponse.json({ message: 'Erro ao gerar relatório via Groq' }, { status: 500 });
    }

    const data = await res.json();
    const report = data.choices[0].message.content;

    return NextResponse.json({ Report: report }, { status: 200 });

  } catch (error: any) {
    console.error('Erro em GET reports/generate:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
