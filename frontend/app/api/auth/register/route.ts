import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Paciente from '@/lib/models/Paciente';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { nome, cpf, dataNascimento, sexo, email, senha } = await req.json();

    if (!nome || !cpf || !dataNascimento || !sexo || !email || !senha) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await Paciente.findOne({ $or: [{ email }, { cpf }] });
    if (existingUser) {
      return NextResponse.json({ message: 'Email ou CPF já cadastrado' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    const novoPaciente = new Paciente({
      nome,
      cpf,
      dataNascimento,
      sexo,
      email,
      senha: hashedPassword,
    });

    await novoPaciente.save();

    return NextResponse.json({ message: 'Paciente registrado com sucesso!' }, { status: 201 });
  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
