"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Maximize2,
  Share2,
  Sparkles,
  Trash2,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocTypeIcon, StatusBadge, TypeBadge } from "@/components/documents/DocumentBits";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function DocumentDetail() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get(`/documents/${id}`)
      .then((res) => setDoc(res.data))
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) {
    return (
      <AppShell title="Carregando..." subtitle="Buscando informações do documento">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (error || !doc) {
    notFound();
    return null;
  }

  return (
    <AppShell title={doc.title} subtitle={`${doc.clinic} · ${doc.date}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="justify-self-start rounded-lg">
          <Link href="/documents">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar à biblioteca
          </Link>
        </Button>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button variant="outline" className="rounded-xl">
            <Share2 className="mr-1 h-4 w-4" /> Compartilhar
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Download className="mr-1 h-4 w-4" /> Baixar
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl text-destructive" 
            aria-label="Excluir"
            onClick={async () => {
              if (confirm("Tem certeza que deseja excluir este documento?")) {
                try {
                  await api.delete(`/documents/${id}`);
                  window.location.href = "/documents";
                } catch (error) {
                  alert("Erro ao excluir o documento.");
                }
              }
            }}
          >
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium">Visualizador do documento</p>
            <div className="flex shrink-0 gap-1">
              {[ZoomOut, ZoomIn, Maximize2].map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>
          <div className="bg-surface p-5 sm:p-8">
            <article className="mx-auto aspect-[1/1.35] w-full max-w-xl overflow-hidden rounded-xl bg-card p-6 shadow-lift sm:p-9">
              <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border pb-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-wide">
                    {doc.clinic}
                  </p>
                  <p className="text-xs text-muted-foreground">CRM 12.345 · São Paulo/SP</p>
                </div>
                <DocTypeIcon type={doc.type} className="h-9 w-9" />
              </header>
              <h2 className="mt-5 font-display text-lg">{doc.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Paciente: Matheus Rafael · Emitido em {doc.date}
              </p>
              <div className="mt-5 space-y-2.5">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2.5 rounded-full bg-muted"
                    style={{ width: `${94 - ((i * 13) % 45)}%` }}
                  />
                ))}
              </div>
              <div className="mt-7 border-t border-dashed border-border pt-4">
                <div className="h-2.5 w-40 rounded-full bg-muted" />
                <p className="mt-2 text-xs text-muted-foreground">{doc.doctor}</p>
              </div>
            </article>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-soft px-2.5 py-1 text-xs font-medium text-ai">
                <Sparkles className="h-3.5 w-3.5" /> Dados extraídos por IA
              </span>
              <StatusBadge status={doc.status} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Revise e corrija os campos se necessário. As alterações treinam a leitura dos seus
              próximos documentos.
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data do documento</Label>
                <Input id="data" defaultValue={doc.date} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medico">Médico responsável</Label>
                <Input id="medico" defaultValue={doc.doctor} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinica">Clínica / laboratório</Label>
                <Input id="clinica" defaultValue={doc.clinic} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Input id="diagnostico" defaultValue={doc.diagnosis} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resumo">Resumo clínico</Label>
                <Textarea id="resumo" defaultValue={doc.summary} rows={3} className="rounded-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold">Medicamentos prescritos</h3>
            {doc.medicines.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum medicamento identificado neste documento.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {doc.medicines.map((med: { name: string; dosage: string; schedule?: string }, i: number) => (
                  <li key={med.name} className="space-y-2">
                    <Label htmlFor={`med-${i}`}>Medicamento {i + 1}</Label>
                    <Input id={`med-${i}`} defaultValue={med.name} className="h-11 rounded-xl" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input defaultValue={med.dosage} className="h-11 rounded-xl" />
                      <Input defaultValue={med.schedule} className="h-11 rounded-xl" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <TypeBadge type={doc.type} />
            </div>
            <Button className="mt-5 w-full rounded-xl">Salvar correções</Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
