"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Fields = {
  nome: string;
  cpf: string;
  nascimento: string;
  genero: string;
  email: string;
  senha: string;
};

const empty: Fields = { nome: "", cpf: "", nascimento: "", genero: "", email: "", senha: "" };

function maskCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

function validate(field: keyof Fields, value: string): string | null {
  if (!value.trim()) return "Campo obrigatório.";
  if (field === "nome" && value.trim().split(" ").length < 2) return "Informe nome e sobrenome.";
  if (field === "cpf" && value.replace(/\D/g, "").length !== 11) return "CPF deve ter 11 dígitos.";
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "E-mail inválido.";
  if (field === "senha" && value.length < 6) return "Mínimo de 6 caracteres.";
  if (field === "nascimento" && new Date(value) > new Date()) return "Data no futuro.";
  return null;
}

export default function CadastroPage() {
  const router = useRouter();
  const [values, setValues] = useState<Fields>(empty);
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const errorFor = (field: keyof Fields) =>
    touched[field] ? validate(field, values[field]) : null;

  const set = (field: keyof Fields, value: string) => {
    setValues((v) => ({ ...v, [field]: field === "cpf" ? maskCpf(value) : value }));
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marca todos como tocados para exibir erros
    const allTouched = Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched as Partial<Record<keyof Fields, boolean>>);

    const hasErrors = (Object.keys(values) as (keyof Fields)[]).some(
      (key) => validate(key, values[key]) !== null
    );

    if (hasErrors) {
      toast.error("Preencha todos os campos corretamente.");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/auth/register", {
        nome: values.nome,
        cpf: values.cpf,
        dataNascimento: values.nascimento,
        sexo: values.genero,
        email: values.email,
        senha: values.senha
      });
      toast.success("Conta criada com sucesso! Faça login.");
      router.push("/login");
    } catch (err: any) {
      const data = err.response?.data;
      const msg = Array.isArray(data) ? data[0] : (data?.error ?? data?.message ?? "Erro ao criar conta.");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Criar sua conta"
      subtitle="Leva menos de dois minutos. Seus dados são criptografados de ponta a ponta."
    >
      <form className="space-y-5" onSubmit={handleRegister}>
        <Field
          id="nome"
          label="Nome completo"
          placeholder="Maria Silva Souza"
          value={values.nome}
          error={errorFor("nome")}
          onChange={(v) => set("nome", v)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="cpf"
            label="CPF"
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={values.cpf}
            error={errorFor("cpf")}
            onChange={(v) => set("cpf", v)}
          />
          <Field
            id="nascimento"
            label="Data de nascimento"
            type="date"
            value={values.nascimento}
            error={errorFor("nascimento")}
            onChange={(v) => set("nascimento", v)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genero">Gênero</Label>
          <Select value={values.genero} onValueChange={(v) => set("genero", v)}>
            <SelectTrigger id="genero" className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="nao-binario">Não binário</SelectItem>
              <SelectItem value="prefiro-nao-informar">Prefiro não informar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Field
          id="email"
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          value={values.email}
          error={errorFor("email")}
          onChange={(v) => set("email", v)}
        />

        <Field
          id="senha"
          label="Senha"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          value={values.senha}
          error={errorFor("senha")}
          hint="Use letras, números e ao menos um símbolo."
          onChange={(v) => set("senha", v)}
        />

        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox id="terms" className="mt-0.5" />
          <span>
            Li e aceito os termos de uso e a política de privacidade da SaúdeMemora.
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
          ) : (
            "Criar conta"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  placeholder,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  hint?: string;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  const valid = !error && value.length > 0;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 rounded-xl pr-9",
            error && "border-destructive bg-destructive-soft focus-visible:ring-destructive",
            valid && "border-success",
          )}
        />
        {error ? (
          <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
        ) : valid ? (
          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
        ) : null}
      </div>
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
