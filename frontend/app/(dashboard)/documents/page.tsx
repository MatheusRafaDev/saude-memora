"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Search, SlidersHorizontal, Upload, UserRound, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocTypeIcon, StatusBadge, TypeBadge } from "@/components/documents/DocumentBits";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { UploadModal } from "@/components/documents/UploadModal";
import { api } from "@/lib/api";
import { toast } from "sonner";

const tabs = [
  { value: "todos", label: "Todos os arquivos" },
  { value: "recentes", label: "Recentes" },
  { value: "receitas", label: "Receitas" },
  { value: "exames", label: "Exames" },
];

export default function DocumentsPage() {
  const [tab, setTab] = useState("todos");
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = () => {
    setLoading(true);
    api.get("/documents").then((res) => setDocuments(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (selectedDocId) {
    return <DocumentViewer id={selectedDocId} onClose={() => setSelectedDocId(null)} />;
  }

  // Filtra por aba e por texto de busca
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filtered = documents
    .filter((d) => {
      if (tab === "receitas") return d.type === "receita";
      if (tab === "exames") return d.type === "exame";
      if (tab === "recentes") return d.createdAt && new Date(d.createdAt) >= sevenDaysAgo;
      return true; // "todos"
    })
    .filter((d) =>
      d.title?.toLowerCase().includes(query.toLowerCase()) ||
      d.clinic?.toLowerCase().includes(query.toLowerCase()) ||
      d.doctor?.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <AppShell 
      title="Biblioteca de Saúde" 
      subtitle="Todos os seus exames, receitas e laudos em um só lugar."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por médico, medicamento ou tipo de exame…"
            className="h-12 rounded-2xl pl-9"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl" aria-label="Filtros">
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </Button>
          <Button onClick={() => setIsUploadModalOpen(true)} className="hidden h-12 rounded-2xl sm:inline-flex">
            <Upload className="mr-1 h-4 w-4" /> Enviar
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="h-11 w-full justify-start overflow-x-auto rounded-2xl bg-secondary p-1 sm:w-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="rounded-xl px-4">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/20 hover:shadow-hover"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <DocTypeIcon type={doc.type} className="h-10 w-10" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg -mr-2">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => setSelectedDocId(doc.id)}>
                      <Search className="mr-2 h-4 w-4" /> Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="rounded-lg text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => {
                        toast(
                          "Excluir documento?",
                          {
                            description: `"${doc.title}" será removido permanentemente.`,
                            action: {
                              label: "Excluir",
                              onClick: async () => {
                                try {
                                  await api.delete(`/documents/${doc.id}`);
                                  setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                  toast.success("Documento excluído com sucesso.");
                                } catch {
                                  toast.error("Erro ao excluir o documento.");
                                }
                              },
                            },
                          }
                        );
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 
                className="mt-4 font-display text-base font-semibold leading-tight tracking-tight cursor-pointer hover:text-primary transition-colors"
                onClick={() => setSelectedDocId(doc.id)}
              >
                {doc.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {doc.summary || doc.clinic}
              </p>
            </div>
            
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {doc.date}
                <span className="mx-1.5 h-1 w-1 rounded-full bg-border" />
                <UserRound className="h-3.5 w-3.5" />
                <span className="truncate">{doc.doctor}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                <TypeBadge type={doc.type} />
                <StatusBadge status={doc.status} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-6 font-display text-lg font-medium">Nenhum documento encontrado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente outro termo de busca ou envie um novo documento.
          </p>
          <Button onClick={() => setIsUploadModalOpen(true)} className="mt-6 rounded-xl">
            <Upload className="mr-2 h-4 w-4" /> Enviar Documento
          </Button>
        </div>
      )}

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={fetchDocuments} 
      />
    </AppShell>
  );
}
