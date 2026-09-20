import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Paciente from '@/lib/models/Paciente';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    await connectToDatabase();

    const paciente = await Paciente.findOne({ email });
    if (!paciente) {
      return NextResponse.json({ message: 'Email ou senha inválidos' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(senha, paciente.senha!);
    if (!isMatch) {
      return NextResponse.json({ message: 'Email ou senha inválidos' }, { status: 400 });
    }

    const secret = process.env.JWT_SECRET_KEY || 'defaultSecret12345678901234567890';
    const expiresInStr = process.env.JWT_EXPIRES_IN || '7';
    const expiresIn = `${expiresInStr}d`;

    const token = jwt.sign(
      { nameid: paciente._id.toString(), email: paciente.email, name: paciente.nome },
      secret,
      { expiresIn }
    );

    return NextResponse.json({
      token,
      user: { id: paciente._id, nome: paciente.nome, email: paciente.email }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
