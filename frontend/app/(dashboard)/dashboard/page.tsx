"use client";

import Link from "next/link";
import { ArrowRight, BellRing, CloudUpload, FileStack, Pill, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DocTypeIcon, StatusBadge } from "@/components/documents/DocumentBits";
import { UploadSection } from "@/components/documents/UploadSection";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type DocCount = {
  total: number;
  exames: number;
  receitas: number;
  laudos: number;
  receitasAtivas: number;
};

type Doc = {
  id: string;
  title: string;
  type: string;
  status: string;
  doctor: string;
  date: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [counts, setCounts] = useState<DocCount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/documents").then((res) => setDocs(res.data)),
      api.get("/documents/count").then((res) => setCounts(res.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const metrics = [
    {
      label: "Documentos totais",
      value: counts ? String(counts.total) : "—",
      delta: counts
        ? `${counts.exames} exame${counts.exames !== 1 ? "s" : ""}, ${counts.laudos} laudo${counts.laudos !== 1 ? "s" : ""}`
        : "Carregando...",
      icon: FileStack,
      tone: "bg-primary-soft text-primary",
    },
    {
      label: "Receitas ativas",
      value: counts ? String(counts.receitasAtivas) : "—",
      delta: counts
        ? `${counts.receitas} receita${counts.receitas !== 1 ? "s" : ""} no total`
        : "Carregando...",
      icon: Pill,
      tone: "bg-success-soft text-success",
    },
    {
      label: "Lembretes pendentes",
      value: "—",
      delta: "Em breve",
      icon: BellRing,
      tone: "bg-warning-soft text-warning-foreground",
    },
  ];

  return (
    <AppShell
      title={`Olá, ${user?.nome?.split(" ")[0] || "Usuário"} 👋`}
      subtitle="Aqui está o resumo do seu histórico de saúde hoje."
    >
      {/* Métricas */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ label, value, delta, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    value
                  )}
                </p>
              </div>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{delta}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <UploadSection />

      {/* Documentos recentes */}
      <section className="mt-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="truncate text-lg font-semibold">Documentos recentes</h2>
          <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-lg">
            <Link href="/documents">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ul className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : docs.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground border rounded-xl border-dashed">
              Nenhum documento ainda. Envie seu primeiro documento acima.
            </p>
          ) : (
            docs.slice(0, 4).map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <DocTypeIcon type={doc.type as import("@/lib/mock-data").DocType} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{doc.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {doc.doctor} · {doc.date}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <StatusBadge status={doc.status as import("@/lib/mock-data").DocStatus} />
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}
