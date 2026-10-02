import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { 
  ArrowLeft, CalendarDays, ChevronRight, FileCheck2, Info, Pill, 
  Stethoscope, MoreVertical, Trash2, Pencil, Code, Save, X, 
  ClipboardList, IdCard, User, Building2, FlaskConical, Activity, 
  Building, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { useGetApiDocumentsId, useDeleteApiDocumentsId, customFetch } from '@workspace/api-client-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DocumentDetail({ id: propId }: { id?: string }) {
  const [match, params] = useRoute('/documentos/:id');
  const id = propId || (params as any)?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deleteMutation = useDeleteApiDocumentsId();

  const { data: docRaw, isLoading, refetch } = useGetApiDocumentsId(id || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRawTextOpen, setIsRawTextOpen] = useState(false);

  useEffect(() => {
    if (docRaw) {
      const doc = docRaw as any;
      setFormData({
        titulo: doc.titulo || '',
        medico: doc.medico || '',
        clinica: doc.clinica || '',
        data: doc.data || '',
        resumo: doc.resumo || '',
        diagnostico: doc.diagnostico || '',
        crm: doc.crm || '',
      });
    }
  }, [docRaw]);

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ id: id || '' }, {
      onSuccess: () => {
        toast({ description: 'Documento apagado com sucesso.' });
        setLocation('/documentos');
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await customFetch(`/api/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      toast({ description: 'Documento atualizado com sucesso!' });
      setIsEditing(false);
      refetch();
    } catch (err) {
      toast({ description: 'Erro ao atualizar o documento.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando detalhes do documento...</div>;
  }

  if (!docRaw) {
    return <div className="page-enter p-12 text-center text-red-500 font-bold">Documento não encontrado.</div>;
  }

  const doc = docRaw as unknown as any;
  const date = new Date(doc.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const typeLabel = doc.tipo || 'Documento';

  return (
    <div className="page-enter space-y-7 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/documentos" data-testid="link-detail-back" className="flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft size={15} /> Voltar para lista
        </Link>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors">
                <X size={15} /> Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                <Save size={15} /> {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors">
                  <MoreVertical size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="text-xs font-bold cursor-pointer" onClick={() => setIsEditing(true)}>
                  <Pencil size={14} className="mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={14} className="mr-2" /> Apagar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Header Section */}
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-start rounded-3xl border border-border/60 bg-card p-6 md:p-8 shadow-sm">
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-accent">
              {typeLabel}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <CalendarDays size={13} /> {date}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold text-foreground">
              <FileCheck2 size={13} className="text-primary" /> Arquivado
            </span>
          </div>
          
          {isEditing ? (
            <div className="mt-6 space-y-5">
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full text-3xl font-extrabold tracking-[-.04em] md:text-4xl bg-transparent border-b border-border/50 focus:border-primary outline-none pb-2 transition-colors"
                placeholder="Título do Documento"
              />
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Stethoscope size={14} /> Médico(a)</label>
                  <input
                    type="text"
                    name="medico"
                    value={formData.medico}
                    onChange={handleChange}
                    className="w-full text-sm bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Building size={14} /> Clínica / Hospital</label>
                  <input
                    type="text"
                    name="clinica"
                    value={formData.clinica}
                    onChange={handleChange}
                    className="w-full text-sm bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-5 text-3xl font-extrabold tracking-[-.04em] md:text-4xl text-foreground">{doc.titulo}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Stethoscope size={16} className="text-accent" /> {doc.medico || 'Profissional não informado'}
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5">
                  <Building size={16} className="text-accent" /> {doc.clinica || 'Clínica não informada'}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Grid: asymmetric layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1.2fr_450px] items-start">
        
        {/* Left Column: Image & Raw Text */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-border/60 bg-[hsl(205_25%_95%)] dark:bg-[hsl(205_25%_10%)] p-5 md:p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground font-bold flex items-center gap-2">
                <FileText size={14} /> Documento Original
              </span>
              {(doc.urlImagens?.length > 0 ? doc.urlImagens[0] : doc.urlImagem) && (
                <a href={doc.urlImagens?.length > 0 ? doc.urlImagens[0] : doc.urlImagem} target="_blank" rel="noreferrer" className="rounded-xl bg-card border border-border/50 px-4 py-2 text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                  Tela Cheia
                </a>
              )}
            </div>
            
            <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-card p-4 text-[#45504f] shadow-sm border border-border/30">
              {doc.urlImagens?.length > 0 ? (
                <div className="flex flex-col gap-4 w-full">
                  {doc.urlImagens.map((url: string, i: number) => (
                    <img key={i} src={url} alt={`Documento ${i + 1}`} className="w-full h-auto rounded-xl shadow-sm border border-border/20" />
                  ))}
                </div>
              ) : doc.urlImagem ? (
                <img src={doc.urlImagem} alt="Documento Original" className="w-full h-auto object-contain max-h-[700px] rounded-xl shadow-sm border border-border/20" />
              ) : (
                <p className="text-sm text-muted-foreground">Imagem não disponível.</p>
              )}
            </div>
          </section>

          {/* Raw Text Section (Collapsible) */}
          {doc.textoExtraido && !isEditing && (
            <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all">
              <button 
                onClick={() => setIsRawTextOpen(!isRawTextOpen)}
                className="flex w-full items-center justify-between outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Code size={20} />
                  </span>
                  <div className="text-left">
                    <h2 className="text-base font-extrabold text-foreground">Transcrição Original</h2>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Texto lido por OCR</p>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  {isRawTextOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {isRawTextOpen && (
                <div className="mt-5 rounded-2xl bg-muted/20 border border-border/40 p-5">
                  <pre className="font-mono whitespace-pre-wrap text-[11px] md:text-xs leading-[1.8] text-muted-foreground overflow-auto max-h-[350px] scrollbar-thin">
                    {doc.textoExtraido}
                  </pre>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: Information, Diagnosis, Medicines (Sticky) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          
          {/* AI Summary */}
          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Info size={20} />
              </span>
              <h2 className="text-lg font-extrabold text-foreground">Resumo do Documento</h2>
            </div>
            
            {isEditing ? (
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Resumo Clínico</label>
                  <textarea
                    name="resumo"
                    value={formData.resumo}
                    onChange={handleChange}
                    rows={4}
                    className="w-full text-sm bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Diagnóstico / Interpretação</label>
                  <input
                    type="text"
                    name="diagnostico"
                    value={formData.diagnostico}
                    onChange={handleChange}
                    className="w-full text-sm font-bold bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="mt-6 text-[15px] leading-relaxed text-foreground/80 font-medium">{doc.resumo || 'Resumo não extraído.'}</p>
                {doc.diagnostico && (
                  <div className="mt-6 rounded-2xl bg-accent/5 border border-accent/10 p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[.15em] text-accent font-bold">Diagnóstico / Conclusão</p>
                    <p className="mt-2 text-base font-extrabold text-foreground">{doc.diagnostico}</p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Extracted Structured Fields */}
          {(() => {
            const kvFields: { chave: string; valor: string; name?: string }[] = [];
            (doc.conteudoIndentado || []).forEach((item: any) => {
              if (item.tipo === 'keyvalue' && item.chave && item.valor) {
                kvFields.push({ chave: item.chave.replace(/:$/, ''), valor: item.valor });
              }
            });

            const topFields: { chave: string; valor: string; name?: string }[] = [];
            const chavesPresentesLower = kvFields.map(k => k.chave.toLowerCase());
            
            if (doc.data && !chavesPresentesLower.some(c => c.includes('data') || c.includes('entrada'))) topFields.push({ chave: 'Data do Documento', valor: doc.data, name: 'data' });
            if (doc.crm && !chavesPresentesLower.some(c => c.includes('crm'))) topFields.push({ chave: 'CRM', valor: doc.crm, name: 'crm' });

            const allFields = [...topFields, ...kvFields];
            if (allFields.length === 0 && !isEditing) return null;

            const iconMap: Record<string, React.ReactNode> = {
              'paciente': <User size={15} />, 'nome': <User size={15} />, 'sr': <User size={15} />,
              'convênio': <Building2 size={15} />, 'convenio': <Building2 size={15} />, 'plano': <Building2 size={15} />, 'amil': <Building2 size={15} />, 'unimed': <Building2 size={15} />,
              'data': <CalendarDays size={15} />, 'entrada': <CalendarDays size={15} />, 'crm': <IdCard size={15} />,
              'prontuário': <ClipboardList size={15} />, 'prontuario': <ClipboardList size={15} />, 'amostra': <FlaskConical size={15} />,
              'idade': <Activity size={15} />
            };

            const getIcon = (chave: string) => {
              const lower = chave.toLowerCase();
              for (const key of Object.keys(iconMap)) {
                if (lower.includes(key)) return iconMap[key];
              }
              return <FileText size={15} />;
            };

            return (
              <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ClipboardList size={20} />
                  </span>
                  <h2 className="text-lg font-extrabold text-foreground">Informações Adicionais</h2>
                </div>
                
                {isEditing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><CalendarDays size={14} /> Data do Documento</label>
                      <input
                        type="text"
                        name="data"
                        value={formData.data}
                        onChange={handleChange}
                        className="w-full text-sm font-bold text-foreground bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><IdCard size={14} /> CRM</label>
                      <input
                        type="text"
                        name="crm"
                        value={formData.crm}
                        onChange={handleChange}
                        className="w-full text-sm font-bold text-foreground bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {allFields.map((field, idx) => (
                      <div key={idx} className="flex flex-col gap-1.5 rounded-2xl border border-border/40 bg-muted/20 px-5 py-4 transition-colors hover:bg-muted/40">
                        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground font-bold">
                          {getIcon(field.chave)}
                          {field.chave}
                        </span>
                        <span className="text-[14px] font-extrabold text-foreground mt-0.5 break-words">{field.valor}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })()}

          {/* Extracted Medicines */}
          {!isEditing && doc.medicamentos?.length > 0 && (
            <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Pill size={20} />
                  </span>
                  <h2 className="text-lg font-extrabold text-foreground">Medicamentos</h2>
                </div>
                <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                  {(doc.medicamentos?.length || 0).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {doc.medicamentos.map((medicine: any) => (
                  <div key={medicine.name} className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/30 p-4 transition-colors hover:bg-muted/60">
                    <div>
                      <p className="text-sm font-extrabold text-foreground">{medicine.name}</p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{medicine.dosage}</p>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground/50" />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold text-xl">Apagar documento?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-medium">
              Tem certeza que deseja apagar este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl border-border font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold border-none">
              Apagar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
