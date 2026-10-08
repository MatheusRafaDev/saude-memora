import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { 
  ArrowLeft, CalendarDays, ChevronRight, ChevronLeft, FileCheck2, Info, Pill, 
  Stethoscope, MoreVertical, Trash2, Pencil, Code, Save, X, Plus,
  ClipboardList, IdCard, User, Building2, FlaskConical, Activity, 
  Building, FileText, ChevronDown, ChevronUp, Copy, ActivitySquare, AlertTriangle
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
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descriptions, setDescriptions] = useState<Record<number, { nome: string; descricao: string; fonte: string }>>({});
  const [loadingDescriptions, setLoadingDescriptions] = useState<Record<number, boolean>>({});
  const [descriptionErrors, setDescriptionErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, []);

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
        resultadosExame: doc.resultadosExame ? JSON.parse(JSON.stringify(doc.resultadosExame)) : [],
      });
    }
  }, [docRaw]);

  useEffect(() => {
    const medicamentos = (docRaw as any)?.medicamentos ?? [];
    if (!medicamentos.length) {
      setDescriptions({});
      setLoadingDescriptions({});
      return;
    }

    setDescriptions({});
    setDescriptionErrors({});
    setLoadingDescriptions(Object.fromEntries(medicamentos.map((_: any, index: number) => [index, true])));

    const consultar = async () => {
      const resultados = await Promise.all(medicamentos.map(async (medicine: any, index: number) => {
        try {
          const response = await customFetch(`/api/medicamentos/${encodeURIComponent(medicine.nome)}/descricao`);
          const data = await response.json();
          return [index, data] as const;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Não foi possível acessar a API da ANVISA.';
          return [index, { error: message }] as const;
        }
      }));

      const nextDescriptions = Object.fromEntries(resultados.filter(([, data]) => data?.descricao).map(([index, data]) => [index, data]));
      const nextErrors = Object.fromEntries(
        resultados.filter(([, data]) => !data?.descricao && data?.error).map(([index, data]) => [index, data.error])
      );
      setDescriptions(nextDescriptions);
      setDescriptionErrors(nextErrors);
      setLoadingDescriptions({});
    };

    void consultar();
  }, [docRaw]);

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ id: id || '' }, {
      onSuccess: () => {
        toast({ description: 'Documento apagado com sucesso.' });
        setLocation('/documentos');
      }
    });
  };

  const handleDispensarAlerta = async (alertaId: string) => {
    try {
      await customFetch(`/api/documents/${id}/alertas/${alertaId}/dispensar`, { method: 'POST' });
      refetch();
      toast({ description: 'Alerta dispensado.' });
    } catch(e) {
      toast({ description: 'Erro ao dispensar alerta.', variant: 'destructive' });
    }
  };

  const handleConsultarDescricao = async (medicine: any, index: number) => {
    setLoadingDescriptions((current) => ({ ...current, [index]: true }));
    setDescriptionErrors((current) => ({ ...current, [index]: '' }));

    try {
      const response = await customFetch(`/api/medicamentos/${encodeURIComponent(medicine.nome)}/descricao`);
      const data = await response.json();
      setDescriptions((current) => ({ ...current, [index]: data }));
      setDescriptionErrors((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível acessar a API da ANVISA.';
      setDescriptionErrors((current) => ({ ...current, [index]: message }));
      toast({ description: 'Não foi possível consultar a descrição neste momento.', variant: 'destructive' });
    } finally {
      setLoadingDescriptions((current) => ({ ...current, [index]: false }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await customFetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo:      formData.titulo,
          medico:      formData.medico,
          clinica:     formData.clinica,
          data:        formData.data,
          resumo:      formData.resumo,
          diagnostico: formData.diagnostico,
          crm:         formData.crm,
          resultadosExame: formData.resultadosExame,
        })
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

  const [isConfirmingRevisao, setIsConfirmingRevisao] = useState(false);
  const handleConfirmRevisao = async () => {
    try {
      setIsConfirmingRevisao(true);
      await customFetch(`/api/documents/${id}/revisao/confirmar`, { method: 'POST' });
      toast({ description: 'Revisão confirmada com sucesso!' });
      refetch();
    } catch (err) {
      toast({ description: 'Erro ao confirmar revisão.', variant: 'destructive' });
    } finally {
      setIsConfirmingRevisao(false);
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
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted transition-colors">
                <Pencil size={15} /> Editar
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {doc.textoExtraido && (
                    <DropdownMenuItem className="text-xs font-bold hover:bg-muted focus:bg-muted cursor-pointer" onClick={() => setShowTranscriptionModal(true)}>
                      <Code size={14} className="mr-2" /> Ver Transcrição
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 size={14} className="mr-2" /> Apagar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {doc.revisaoPendente && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-500">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-500">
                Confira estes campos antes de confiar neste documento
              </p>
              <p className="text-xs font-semibold text-amber-700/70 dark:text-amber-500/70 mt-0.5">
                A IA relatou baixa confiança em: {(doc.camposBaixaConfianca || []).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={handleConfirmRevisao}
            disabled={isConfirmingRevisao}
            className="shrink-0 h-9 px-4 bg-amber-500 text-white font-bold text-xs rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isConfirmingRevisao ? 'Confirmando...' : 'Confirmar Revisão'}
          </button>
        </div>
      )}

      {/* Alertas FASE 4 */}
      {doc.alertas && doc.alertas.filter((a: any) => !a.dispensado).length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
            <AlertTriangle size={12} className="inline mr-1" /> Avisos Médicos Importantes
          </p>
          {doc.alertas.filter((a: any) => !a.dispensado).map((alerta: any) => (
            <div key={alerta.id} className={`border rounded-xl p-4 flex flex-col gap-2 relative shadow-sm
              ${alerta.severidade === 'alta' ? 'bg-red-500/10 border-red-500/20' : 
                alerta.severidade === 'moderada' ? 'bg-amber-500/10 border-amber-500/20' : 
                'bg-blue-500/10 border-blue-500/20'}
            `}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full 
                    ${alerta.severidade === 'alta' ? 'bg-red-500 text-white' : 
                      alerta.severidade === 'moderada' ? 'bg-amber-500 text-white' : 
                      'bg-blue-500 text-white'}
                  `}>
                    Risco {alerta.severidade}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {alerta.tipo === 'alergia' ? 'Alergia Detectada' : alerta.tipo === 'duplicidade' ? 'Possível Duplicidade' : 'Interação Medicamentosa'}
                  </span>
                </div>
                <button 
                  onClick={() => handleDispensarAlerta(alerta.id)}
                  className="text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded-full transition-colors shrink-0"
                  title="Dispensar aviso"
                >
                  <X size={16} />
                </button>
              </div>
              <p className={`text-sm font-semibold 
                ${alerta.severidade === 'alta' ? 'text-red-900 dark:text-red-400' : 
                  alerta.severidade === 'moderada' ? 'text-amber-900 dark:text-amber-500' : 
                  'text-blue-900 dark:text-blue-400'}
              `}>
                {alerta.mensagem}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-semibold">
                <Info size={12} />
                <span>Isto não substitui orientação médica. Converse com seu médico ou farmacêutico.</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header Section */}
      <section className="relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-border/40 bg-gradient-to-br from-white to-[hsl(205_40%_97%)] dark:from-card dark:to-[hsl(205_20%_8%)] p-4 md:p-5 shadow-sm">
        <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] pointer-events-none rotate-12">
          <FileText size={150} />
        </div>
        <div className="relative w-full z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {typeLabel}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
              <CalendarDays size={12} /> {date}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              <FileCheck2 size={12} /> Arquivado
            </span>
          </div>
          
          {isEditing ? (
            <div className="space-y-4 mt-2">
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full text-xl font-bold tracking-tight md:text-2xl bg-transparent border-b border-border/50 focus:border-primary outline-none pb-1 transition-colors"
                placeholder="Título do Documento"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Stethoscope size={12} /> Médico(a)</label>
                  <input
                    type="text"
                    name="medico"
                    value={formData.medico}
                    onChange={handleChange}
                    className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Building size={12} /> Clínica / Hospital</label>
                  <input
                    type="text"
                    name="clinica"
                    value={formData.clinica}
                    onChange={handleChange}
                    className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h1 className="text-xl font-bold tracking-tight md:text-2xl text-slate-800 dark:text-slate-100">{doc.titulo}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded-lg border border-border/40">
                  <div className="flex text-blue-600 dark:text-blue-400">
                    <Stethoscope size={13} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {doc.medico || 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded-lg border border-border/40">
                  <div className="flex text-indigo-600 dark:text-indigo-400">
                    <Building size={13} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {doc.clinica || 'Não informada'}
                  </span>
                </div>
              </div>
            </div>
          )}
          </div>
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
              {(doc.urlImagens?.length > 0 ? doc.urlImagens[currentImageIndex] : doc.urlImagem) && (
                <button onClick={() => setShowFullScreenModal(true)} className="rounded-xl bg-card border border-border/50 px-4 py-2 text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer">
                  Tela Cheia
                </button>
              )}
            </div>
            
            <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-white p-3 border border-border/30 h-[600px] max-h-[70vh]">
              {doc.urlImagens?.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img src={doc.urlImagens[currentImageIndex]} alt={`Documento ${currentImageIndex + 1}`} className="max-w-full max-h-full object-contain rounded-lg border border-border/20 shadow-sm" />
                  
                  {doc.urlImagens.length > 1 && (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? doc.urlImagens.length - 1 : prev - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-primary shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setCurrentImageIndex(prev => prev === doc.urlImagens.length - 1 ? 0 : prev + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-primary shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                        {doc.urlImagens.map((_: any, i: number) => (
                          <button key={i} type="button" onClick={() => setCurrentImageIndex(i)} className={`h-2 rounded-full transition-all ${i === currentImageIndex ? 'w-4 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8">Imagem não disponível.</p>
              )}
            </div>
          </section>


        </div>

        {/* Right Column: Information, Diagnosis, Medicines (Sticky) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          
          {/* AI Summary */}
          <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Info size={20} />
              </span>
              <h2 className="text-base font-bold text-foreground">Resumo do Documento</h2>
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
                  <h2 className="text-base font-bold text-foreground">Informações Adicionais</h2>
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
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {allFields.map((field, idx) => (
                      <div key={idx} className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card p-3 shadow-sm transition-colors hover:border-primary/30">
                        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 font-bold">
                          {getIcon(field.chave)}
                          {field.chave}
                        </span>
                        <span className="text-xs font-semibold text-foreground mt-0.5 break-words">{field.valor}</span>
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
                  <h2 className="text-base font-bold text-foreground">Medicamentos</h2>
                </div>
                <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                  {(doc.medicamentos?.length || 0).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {doc.medicamentos.map((medicine: any, idx: number) => {
                  const description = descriptions[idx];
                  const descriptionError = descriptionErrors[idx];
                  return (
                    <div key={medicine.nome || idx} className="rounded-2xl border border-border/40 bg-muted/30 p-4 transition-colors hover:bg-muted/60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-foreground">{medicine.nome}</p>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {medicine.dosagem} {medicine.horario && `• ${medicine.horario}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConsultarDescricao(medicine, idx)}
                          disabled={loadingDescriptions[idx]}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
                        >
                          {loadingDescriptions[idx] ? 'Consultando…' : description?.descricao ? 'Atualizado' : 'Consultar'}
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      {description?.descricao && (
                        <div className="mt-3 border-t border-border/50 pt-3">
                          <p className="text-xs leading-5 text-muted-foreground">{description.descricao}</p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Fonte: {description.fonte}</p>
                        </div>
                      )}
                      {descriptionError && (
                        <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          Bula indisponível: {descriptionError}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Extracted Exam Results */}
      {(doc.resultadosExame?.length > 0 || isEditing) && doc.tipo === 'exame' && (
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ActivitySquare size={20} />
              </span>
              <h2 className="text-base font-bold text-foreground">Resultados do Exame</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="pb-3 px-2">Exame / Analito</th>
                  <th className="pb-3 px-2">Valor</th>
                  <th className="pb-3 px-2">Unidade</th>
                  <th className="pb-3 px-2">Ref. Mínima</th>
                  <th className="pb-3 px-2">Ref. Máxima</th>
                  <th className="pb-3 px-2">Status</th>
                  {isEditing && <th className="pb-3 px-2 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody>
                {(isEditing ? formData.resultadosExame : doc.resultadosExame).map((res: any, idx: number) => (
                  <tr key={idx} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={res.nome}
                          onChange={(e) => {
                            const novo = [...formData.resultadosExame];
                            novo[idx].nome = e.target.value;
                            setFormData({ ...formData, resultadosExame: novo });
                          }}
                          className="w-full bg-transparent border-b border-border outline-none focus:border-primary text-sm font-medium"
                          placeholder="Ex: Glicose"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{res.nome}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={res.valor !== null && res.valor !== undefined ? res.valor : res.valorTexto || ''}
                          onChange={(e) => {
                            const novo = [...formData.resultadosExame];
                            const num = parseFloat(e.target.value.replace(',','.'));
                            if (!isNaN(num)) {
                              novo[idx].valor = num;
                              novo[idx].valorTexto = '';
                            } else {
                              novo[idx].valor = null;
                              novo[idx].valorTexto = e.target.value;
                            }
                            setFormData({ ...formData, resultadosExame: novo });
                          }}
                          className="w-full bg-transparent border-b border-border outline-none focus:border-primary text-sm font-bold"
                        />
                      ) : (
                        <span className="text-sm font-bold text-foreground">
                          {res.valor !== null && res.valor !== undefined ? res.valor : res.valorTexto || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={res.unidade || ''}
                          onChange={(e) => {
                            const novo = [...formData.resultadosExame];
                            novo[idx].unidade = e.target.value;
                            setFormData({ ...formData, resultadosExame: novo });
                          }}
                          className="w-20 bg-transparent border-b border-border outline-none focus:border-primary text-xs"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">{res.unidade}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={res.refMin ?? ''}
                          onChange={(e) => {
                            const novo = [...formData.resultadosExame];
                            novo[idx].refMin = e.target.value ? parseFloat(e.target.value) : null;
                            setFormData({ ...formData, resultadosExame: novo });
                          }}
                          className="w-20 bg-transparent border-b border-border outline-none focus:border-primary text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{res.refMin ?? '-'}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={res.refMax ?? ''}
                          onChange={(e) => {
                            const novo = [...formData.resultadosExame];
                            novo[idx].refMax = e.target.value ? parseFloat(e.target.value) : null;
                            setFormData({ ...formData, resultadosExame: novo });
                          }}
                          className="w-20 bg-transparent border-b border-border outline-none focus:border-primary text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{res.refMax ?? '-'}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <select
                          value={res.status}
                          onChange={(e) => {
                            const novo = [...formData.resultadosExame];
                            novo[idx].status = e.target.value;
                            setFormData({ ...formData, resultadosExame: novo });
                          }}
                          className="bg-transparent border-b border-border outline-none focus:border-primary text-xs p-1"
                        >
                          <option value="normal">Normal</option>
                          <option value="alto">Alto</option>
                          <option value="baixo">Baixo</option>
                          <option value="indefinido">Indefinido</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          res.status === 'alto' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          res.status === 'baixo' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          res.status === 'normal' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        }`}>
                          {res.status}
                        </span>
                      )}
                    </td>
                    {isEditing && (
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => {
                            const novo = [...formData.resultadosExame];
                            novo.splice(idx, 1);
                            setFormData({ ...formData, resultadosExame: novo });
                          }}
                          className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                          title="Remover linha"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {isEditing && (
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    resultadosExame: [
                      ...formData.resultadosExame,
                      { nome: '', valor: null, valorTexto: '', unidade: '', refMin: null, refMax: null, status: 'indefinido' }
                    ]
                  });
                }}
                className="mt-4 flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={14} /> Adicionar Resultado
              </button>
            )}
          </div>
        </section>
      )}

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
      <AlertDialog open={showTranscriptionModal} onOpenChange={setShowTranscriptionModal}>
        <AlertDialogContent className="rounded-3xl border-border bg-card max-w-2xl max-h-[80vh] flex flex-col p-6">
          <AlertDialogHeader className="shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="text-left">
                <AlertDialogTitle className="font-extrabold text-xl flex items-center gap-2">
                  <Code size={20} className="text-primary" /> Transcrição por IA
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground font-medium mt-1">
                  Texto bruto extraído do documento.
                </AlertDialogDescription>
              </div>
              <button onClick={() => {
                navigator.clipboard.writeText(doc.textoExtraido);
                toast({ description: 'Copiado para a área de transferência!' });
              }} className="flex h-8 items-center gap-1.5 px-3 rounded-lg bg-muted/30 border border-border/50 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-accent/10 transition-colors shrink-0 cursor-pointer">
                <Copy size={13} /> <span className="hidden sm:inline">Copiar</span>
              </button>
            </div>
          </AlertDialogHeader>
          <div className="flex-1 overflow-auto mt-4 rounded-2xl bg-muted/20 border border-border/40 p-5 scrollbar-thin min-h-[200px]">
            <pre className="font-mono whitespace-pre-wrap text-[11px] md:text-xs leading-[1.8] text-muted-foreground">
              {doc.textoExtraido}
            </pre>
          </div>
          <AlertDialogFooter className="mt-4 shrink-0">
            <AlertDialogCancel className="rounded-xl border-border font-bold w-full sm:w-auto cursor-pointer">Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFullScreenModal} onOpenChange={setShowFullScreenModal}>
        <AlertDialogContent className="max-w-[95vw] h-[95vh] rounded-3xl border-border bg-black/95 p-0 flex flex-col overflow-hidden">
          <div className="flex justify-end p-4 absolute top-0 right-0 z-50">
            <button onClick={() => setShowFullScreenModal(false)} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors cursor-pointer">
              <X size={24} />
            </button>
          </div>
          <div className="grid flex-1 min-h-0 w-full md:grid-cols-[minmax(0,1fr)_360px]">
            <div className="relative flex min-h-0 items-center justify-center overflow-hidden p-5">
              <img
                src={doc.urlImagens?.length > 0 ? doc.urlImagens[currentImageIndex] : doc.urlImagem}
                alt="Documento em tela cheia"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <aside className="min-h-0 overflow-y-auto border-t border-white/10 bg-white/5 p-5 text-white md:border-l md:border-t-0">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Pill size={17} className="text-amber-300" />
                Informações do medicamento
              </div>
              <p className="mt-2 text-xs leading-5 text-white/55">Consultadas automaticamente ao abrir o documento.</p>
              <div className="mt-5 space-y-3">
                {(doc.medicamentos ?? []).map((medicine: any, index: number) => {
                  const description = descriptions[index];
                  const descriptionError = descriptionErrors[index];
                  return (
                    <div key={medicine.nome || index} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-sm font-extrabold">{medicine.nome}</p>
                      <p className="mt-1 text-xs text-white/55">
                        {medicine.dosagem} {medicine.horario && `• ${medicine.horario}`}
                      </p>
                      {description?.descricao ? (
                        <p className="mt-3 text-xs leading-5 text-white/80">{description.descricao}</p>
                      ) : descriptionError ? (
                        <p className="mt-3 text-xs leading-5 text-amber-300">Bula indisponível. Tente consultar novamente.</p>
                      ) : (
                        <p className="mt-3 text-xs italic text-white/40">Consulta da bula em andamento ou indisponível.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
