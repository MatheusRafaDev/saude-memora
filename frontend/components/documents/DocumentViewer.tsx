"use client";

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
  Calendar,
  User,
  Building2,
  Stethoscope,
  FileText,
  Pill,
  Clock,
  ScanText
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DocTypeIcon, StatusBadge, TypeBadge } from "@/components/documents/DocumentBits";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentViewerProps {
  id: string;
  onClose: () => void;
}

export function DocumentViewer({ id, onClose }: DocumentViewerProps) {
  const { user } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const onMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
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
    return (
      <AppShell title="Erro" subtitle="Documento não encontrado">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Não foi possível carregar este documento.</p>
          <Button onClick={onClose} className="mt-4">Voltar à biblioteca</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={doc.title} subtitle={`${doc.clinic} · ${doc.date}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Button onClick={onClose} variant="ghost" size="sm" className="justify-self-start rounded-lg">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar à biblioteca
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
                  onClose();
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
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleReset}><Maximize2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="bg-surface p-5 sm:p-8 flex justify-center overflow-hidden">
            <div 
              className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-lift flex items-center justify-center min-h-[500px]"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              {doc.imageUrl ? (
                 /* eslint-disable-next-line @next/next/no-img-element */
                 <img 
                    src={doc.imageUrl} 
                    alt="Documento" 
                    draggable={false}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-xl transition-transform duration-75" 
                    style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
                 />
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma imagem disponível.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-soft px-2.5 py-1 text-xs font-medium text-ai">
                  <Sparkles className="h-3.5 w-3.5" /> Dados extraídos
                </span>
                <StatusBadge status={doc.status} />
              </div>
              <Button 
                variant={isEditing ? "outline" : "secondary"} 
                size="sm" 
                className="rounded-lg text-xs" 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancelar edição" : "Editar campos"}
              </Button>
            </div>
            {isEditing && (
              <p className="mt-3 text-xs text-muted-foreground">
                Revise e corrija os campos se necessário.
              </p>
            )}

            <div className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="data" className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Data</Label>
                  {isEditing ? (
                    <Input id="data" defaultValue={doc.date} className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:bg-transparent transition-colors" />
                  ) : (
                    <p className="text-sm font-medium pl-6">{doc.date || "Não informado"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinica" className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /> Clínica / Lab</Label>
                  {isEditing ? (
                    <Input id="clinica" defaultValue={doc.clinic} className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:bg-transparent transition-colors" />
                  ) : (
                    <p className="text-sm font-medium pl-6">{doc.clinic || "Não informado"}</p>
                  )}
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medico" className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Médico</Label>
                  {isEditing ? (
                    <Input id="medico" defaultValue={doc.doctor} className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:bg-transparent transition-colors" />
                  ) : (
                    <p className="text-sm font-medium pl-6">{doc.doctor || "Não informado"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnostico" className="flex items-center gap-2 text-muted-foreground"><Stethoscope className="h-4 w-4" /> Diagnóstico</Label>
                  {isEditing ? (
                    <Input id="diagnostico" defaultValue={doc.diagnosis} className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:bg-transparent transition-colors" />
                  ) : (
                    <p className="text-sm font-medium pl-6">{doc.diagnosis || "Não informado"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumo" className="flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4" /> Resumo clínico</Label>
                {isEditing ? (
                  <Textarea id="resumo" defaultValue={doc.summary} rows={3} className="rounded-xl bg-muted/20 border-border/50 focus-visible:bg-transparent resize-none transition-colors" />
                ) : (
                  <div className="pl-6 text-sm text-foreground/90 whitespace-pre-wrap">{doc.summary || "Não informado"}</div>
                )}
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ocr" className="border-border/50 border-b-0">
                  <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline hover:text-foreground transition-colors">
                    <span className="flex items-center gap-2"><ScanText className="h-4 w-4" /> Mostrar Texto Extraído (OCR)</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 pb-1">
                    <Textarea id="texto-extraido" defaultValue={doc.extractedText} rows={5} className="rounded-xl font-mono text-xs bg-muted/40 border-border/50 resize-none text-muted-foreground custom-scrollbar" readOnly />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Pill className="h-4 w-4 text-primary" /> Medicamentos prescritos
            </h3>
            {!doc.medicines || doc.medicines.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                Nenhum medicamento identificado neste documento.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {doc.medicines.map((med: { name: string; dosage: string; schedule?: string }, i: number) => (
                  <li key={med.name} className="group relative overflow-hidden rounded-xl border border-border/60 bg-muted/10 p-4 transition-all hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1 bg-primary/20 transition-all group-hover:bg-primary/60"></div>
                    <div className="space-y-3 pl-1">
                      <div className="space-y-1.5">
                        <Label htmlFor={`med-${i}-name`} className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Medicamento</Label>
                        {isEditing ? (
                          <Input id={`med-${i}-name`} defaultValue={med.name} className="h-10 rounded-lg bg-background/50 border-border/50 font-medium transition-colors focus-visible:bg-background" />
                        ) : (
                          <p className="text-sm font-semibold">{med.name}</p>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`med-${i}-dosage`} className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Dosagem</Label>
                          {isEditing ? (
                            <Input id={`med-${i}-dosage`} defaultValue={med.dosage} className="h-9 rounded-lg bg-background/50 border-border/50 text-sm transition-colors focus-visible:bg-background" />
                          ) : (
                            <p className="text-sm font-medium">{med.dosage || "-"}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`med-${i}-schedule`} className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3"/> Horário</Label>
                          {isEditing ? (
                            <Input id={`med-${i}-schedule`} defaultValue={med.schedule || ""} placeholder="Ex: 8h em 8h" className="h-9 rounded-lg bg-background/50 border-border/50 text-sm transition-colors focus-visible:bg-background" />
                          ) : (
                            <p className="text-sm font-medium">{med.schedule || "-"}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-border/50">
              <TypeBadge type={doc.type} />
            </div>
            {isEditing && (
              <Button className="mt-6 w-full rounded-xl shadow-sm transition-all hover:shadow-md">Salvar alterações</Button>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
