import { useState } from 'react';
import { Link } from 'wouter';
import {
  ChevronRight, FileCheck2, FilePlus2,
  ShieldCheck, UploadCloud, FileText,
  BookOpen, User, Droplets, AlertTriangle, Sparkles, BrainCircuit, Table, Plus,
  FlaskConical, Pill, Stethoscope, HeartPulse, CheckCircle2, Filter, Eye
} from 'lucide-react';
import { useGetApiPacientesMe, useGetApiDocuments, useGetApiFichaMedicaMe } from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useGetApiPacientesMe();
  const { data: documentsRaw, isLoading: docsLoading } = useGetApiDocuments();
  const { data: fichaRaw } = useGetApiFichaMedicaMe();

  const [activeTab, setActiveTab] = useState<'todos' | 'exames' | 'receitas' | 'laudos' | 'outros'>('todos');

  const user = (profile as unknown as any) || {};
  const documents = (documentsRaw as unknown as any[]) || [];
  const ficha = (fichaRaw as unknown as any) || {};

  const bloodType = ficha.tipoSanguineo;
  const allergies = (ficha.alergias as string[]) || [];
  const chronicDiseases = (ficha.doencasCronicas as string[]) || [];
  const organDonor = ficha.doadorOrgaos;
  const smoker = ficha.fuma;
  const alcohol = ficha.bebe;
  const conditions = (ficha.condicoes as any[]) || [];
  const positiveConditions = conditions.filter((c: any) => c.tem);

  // Category counts
  const examesCount = documents.filter((d: any) => (d.tipo || '').toLowerCase().includes('exame')).length;
  const receitasCount = documents.filter((d: any) => (d.tipo || '').toLowerCase().includes('receita')).length;
  const laudosCount = documents.filter((d: any) => (d.tipo || '').toLowerCase().includes('laudo')).length;
  const outrosCount = documents.length - (examesCount + receitasCount + laudosCount);

  // Filtered documents for table
  const filteredDocuments = documents.filter((d: any) => {
    const t = (d.tipo || '').toLowerCase();
    if (activeTab === 'exames') return t.includes('exame');
    if (activeTab === 'receitas') return t.includes('receita');
    if (activeTab === 'laudos') return t.includes('laudo');
    if (activeTab === 'outros') return !t.includes('exame') && !t.includes('receita') && !t.includes('laudo');
    return true;
  });

  // Calculate completeness score for anamnese
  let anamneseScore = 0;
  if (bloodType) anamneseScore += 20;
  if (allergies.length > 0) anamneseScore += 20;
  if (chronicDiseases.length > 0 || positiveConditions.length > 0) anamneseScore += 20;
  if (ficha.historicoFamiliar) anamneseScore += 20;
  if (ficha.habitosGerais || smoker !== undefined) anamneseScore += 20;

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  if (profileLoading || docsLoading) {
    return (
      <div className="page-enter flex min-h-[400px] flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-xs font-bold">Carregando painel de saúde...</p>
      </div>
    );
  }
  if (!user.nome) {
    return (
      <div className="page-enter p-12 text-center text-red-500 font-bold">
        Falha ao carregar perfil. Por favor, recarregue a página ou faça login novamente.
      </div>
    );
  }

  const firstName = user.nome?.split(' ')[0] || 'Você';
  const age = user.dataNascimento
    ? Math.floor((new Date().getTime() - new Date(user.dataNascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const getDocumentTypeBadge = (typeStr: string) => {
    const t = (typeStr || '').toLowerCase();
    if (t.includes('exame')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
          <FlaskConical size={11} /> Exame
        </span>
      );
    }
    if (t.includes('receita')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
          <Pill size={11} /> Receita
        </span>
      );
    }
    if (t.includes('laudo')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
          <Stethoscope size={11} /> Laudo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-extrabold text-accent">
        <BrainCircuit size={11} /> {typeStr || 'Documento'}
      </span>
    );
  };

  return (
    <div className="page-enter space-y-8 pb-10">

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/90 to-accent p-8 md:p-12 shadow-2xl shadow-primary/20 border border-primary/20 transition-all duration-500 hover:shadow-primary/30 group">
        {/* Animated Background Blobs */}
        <div className="absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-white/20 to-transparent blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-gradient-to-tr from-accent/40 to-transparent blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md">
              <Stethoscope size={14} className="text-yellow-300 animate-pulse" /> Visão Geral Clínica · {todayCap}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-[-.05em] text-white md:text-[44px] leading-tight drop-shadow-sm">
              Prontuário de <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{user.nome || 'Paciente'}</span>
            </h1>
            <p className="mt-4 text-base text-white/80 leading-relaxed max-w-xl font-medium">
              Histórico médico unificado. Inteligência artificial analisa e organiza exames, receitas, laudos e o contexto de saúde do paciente em tempo real.
            </p>

            {/* User Quick Info Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {age !== null && (
                <span className="inline-flex items-center rounded-xl bg-white/10 px-3 py-1.5 text-sm font-bold text-white shadow-inner backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                  {age} anos
                </span>
              )}
              {bloodType && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/30 border border-red-400/30 px-3 py-1.5 text-sm font-black text-white backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/40 transition-colors">
                  <Droplets size={15} className="text-red-300" /> {bloodType}
                </span>
              )}
              {organDonor && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/30 border border-emerald-400/30 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/40 transition-colors">
                  <ShieldCheck size={15} className="text-emerald-300" /> Doador
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-colors">
                <CheckCircle2 size={15} className="text-emerald-400" /> IA Ativa
              </span>
            </div>
          </div>

          <div className="flex shrink-0">
            <button
              onClick={() => triggerUploadModal()}
              className="group relative flex items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-black text-primary shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-primary/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <UploadCloud size={20} className="text-accent group-hover:scale-110 transition-transform" />
              <span>Adicionar Documento</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Plus size={14} className="text-primary" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Patient Health Context (Alerts & Profile) */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <div className="group rounded-3xl border border-border/50 bg-card/60 p-6 md:p-8 backdrop-blur-xl shadow-lg transition-all hover:shadow-xl hover:border-border">
          <div className="flex items-center justify-between border-b border-border/50 pb-5">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={22} />
                <div className="absolute inset-0 rounded-2xl border border-amber-500/20" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Alergias & Condições</h2>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Alertas de segurança</p>
              </div>
            </div>
            <Link href="/anamnese" className="rounded-xl border border-border bg-muted/30 px-4 py-2 text-xs font-bold text-foreground hover:bg-accent hover:text-white hover:border-accent transition-colors">
              Editar Anamnese
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 p-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Filter size={12} /> Alergias Conocidas
              </span>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((a: string) => (
                    <span key={a} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 px-3 py-1.5 text-xs font-bold shadow-sm">
                      ⚠️ {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-muted-foreground italic">Nenhuma alergia cadastrada.</p>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20 p-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-500/10 blur-xl pointer-events-none" />
              <span className="text-[11px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                <HeartPulse size={12} /> Doenças Crônicas
              </span>
              {chronicDiseases.length > 0 || positiveConditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {chronicDiseases.map((d: string) => (
                    <span key={d} className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-100/80 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 px-3 py-1.5 text-xs font-bold shadow-sm">
                      🔴 {d}
                    </span>
                  ))}
                  {positiveConditions.map((c: any) => (
                    <span key={c.nome} className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/40 bg-orange-100/80 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 px-3 py-1.5 text-xs font-bold shadow-sm">
                      🔴 {c.nome}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-muted-foreground italic">Nenhuma doença declarada.</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="group rounded-3xl border border-border/50 bg-card/60 p-6 md:p-8 backdrop-blur-xl shadow-lg transition-all hover:shadow-xl hover:border-border">
          <div className="flex items-center justify-between border-b border-border/50 pb-5">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                <User size={22} />
                <div className="absolute inset-0 rounded-2xl border border-primary/20" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Ficha do Paciente</h2>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Informações e estilo de vida</p>
              </div>
            </div>
            <Link href="/perfil" className="rounded-xl border border-border bg-muted/30 px-4 py-2 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
              Editar Perfil
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-6">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-muted/50 to-muted/20 p-5 border border-border/40 hover:border-border transition-colors text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 opacity-0 hover:opacity-100 transition-opacity" />
              <Droplets size={20} className="text-red-400 mb-2 opacity-80" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sanguíneo</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{bloodType || '—'}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-muted/50 to-muted/20 p-5 border border-border/40 hover:border-border transition-colors text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 hover:opacity-100 transition-opacity" />
              <ShieldCheck size={20} className="text-emerald-400 mb-2 opacity-80" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Doador</span>
              <span className="text-lg font-black text-foreground mt-1">{organDonor ? 'Sim' : 'Não'}</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-muted/50 to-muted/20 p-5 border border-border/40 hover:border-border transition-colors text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 opacity-0 hover:opacity-100 transition-opacity" />
              <Sparkles size={20} className="text-accent/80 mb-2 opacity-80" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hábitos</span>
              <span className="text-sm font-bold text-foreground mt-1 leading-tight">{smoker ? 'Fuma' : 'Sem fumo'}<br/>{alcohol ? 'Álcool' : 'Sem álcool'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Unified Metrics Banner */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-border overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary/20 blur-2xl group-hover:bg-secondary/40 transition-colors" />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/80 text-accent font-black text-2xl shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform">
            <FileCheck2 size={28} />
          </span>
          <div>
            <p className="font-mono text-4xl font-black tracking-tighter text-foreground">{documents.length}</p>
            <p className="mt-1 text-sm font-bold text-foreground">Total de Documentos</p>
            <p className="text-xs font-medium text-muted-foreground">Tabela única de saúde</p>
          </div>
        </div>

        <div className="group relative flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-border overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-colors" />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent font-black text-2xl shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform">
            <BrainCircuit size={28} />
          </span>
          <div>
            <p className="font-mono text-4xl font-black tracking-tighter text-accent">{documents.length}</p>
            <p className="mt-1 text-sm font-bold text-foreground">Classificados por IA</p>
            <p className="text-xs font-medium text-muted-foreground">Identificação automática</p>
          </div>
        </div>

        <div className="group relative flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-border overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-2xl shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform">
            <FlaskConical size={28} />
          </span>
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-2xl font-black text-blue-600 dark:text-blue-400">{examesCount} <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Exames</span></span>
              <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">{receitasCount} <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rec.</span></span>
            </div>
            <p className="mt-1 text-sm font-bold text-foreground">Distribuição Detectada</p>
            <p className="text-xs font-medium text-muted-foreground">{laudosCount} laudos · {outrosCount} outros</p>
          </div>
        </div>

        <div className="group relative flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-border overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-2xl shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform">
            <HeartPulse size={28} />
          </span>
          <div>
            <p className="font-mono text-4xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">{anamneseScore}%</p>
            <p className="mt-1 text-sm font-bold text-foreground">Anamnese do Paciente</p>
            <p className="text-xs font-medium text-muted-foreground">Histórico médico ativo</p>
          </div>
        </div>
      </section>

      {/* Single Unified Documents Table */}
      <section className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur-2xl p-6 md:p-8 shadow-2xl shadow-black/5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent shadow-inner">
              <Table size={24} />
              <div className="absolute inset-0 rounded-2xl border border-accent/20" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.25em] text-accent">tabela única de documentos</p>
              <h2 className="text-2xl font-black tracking-tight mt-1 text-foreground">Documentos Classificados por IA</h2>
            </div>
          </div>

          {/* Table Filters & Link */}
          <div className="flex flex-wrap items-center justify-between xl:justify-end gap-4">
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted/50 p-1.5 shadow-inner border border-border/40 text-xs font-black">
              <button
                onClick={() => setActiveTab('todos')}
                className={`rounded-xl px-4 py-2 transition-all duration-300 cursor-pointer ${activeTab === 'todos' ? 'bg-card text-foreground shadow-md scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              >
                Todos <span className="ml-1 opacity-60">({documents.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('exames')}
                className={`rounded-xl px-4 py-2 transition-all duration-300 cursor-pointer ${activeTab === 'exames' ? 'bg-card text-blue-600 dark:text-blue-400 shadow-md scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              >
                Exames <span className="ml-1 opacity-60">({examesCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('receitas')}
                className={`rounded-xl px-4 py-2 transition-all duration-300 cursor-pointer ${activeTab === 'receitas' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-md scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              >
                Receitas <span className="ml-1 opacity-60">({receitasCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('laudos')}
                className={`rounded-xl px-4 py-2 transition-all duration-300 cursor-pointer ${activeTab === 'laudos' ? 'bg-card text-purple-600 dark:text-purple-400 shadow-md scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              >
                Laudos <span className="ml-1 opacity-60">({laudosCount})</span>
              </button>
            </div>

            <Link href="/documentos" className="group flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 ml-auto xl:ml-0">
              <span>Ver todos</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border/60 bg-muted/10 py-16 text-center transition-colors hover:bg-muted/20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/40">
              <FilePlus2 size={40} className="text-muted-foreground/50" />
            </div>
            <div className="max-w-md">
              <p className="text-lg font-black text-foreground">Nenhum documento nesta categoria</p>
              <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">
                Envie seus exames, receitas, laudos ou notas médicas. A Inteligência Artificial lerá o documento e classificará automaticamente nesta tabela.
              </p>
            </div>
            <button
              onClick={() => triggerUploadModal()}
              className="mt-4 group flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Adicionar Documento
            </button>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border/50 bg-card/30">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-black text-muted-foreground uppercase tracking-widest backdrop-blur-md">
                  <th className="py-4 px-5">Documento</th>
                  <th className="py-4 px-5">Tipo de Documento</th>
                  <th className="py-4 px-5">Emissor / Local</th>
                  <th className="py-4 px-5">Data</th>
                  <th className="py-4 px-5">Resumo Inteligente</th>
                  <th className="py-4 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredDocuments.map((doc: any) => (
                  <tr key={doc.id} className="group hover:bg-muted/40 transition-colors">
                    <td className="py-4 px-5 font-bold text-foreground">
                      <Link href={`/documentos/${doc.id}`} className="hover:text-primary transition-colors flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all">
                          <FileText size={16} />
                        </div>
                        <span className="truncate max-w-[220px] font-extrabold">{doc.titulo || 'Documento sem título'}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-5">
                      {getDocumentTypeBadge(doc.tipo)}
                    </td>
                    <td className="py-4 px-5 text-muted-foreground font-medium">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs">
                        {doc.medico || doc.clinica || 'Desconhecido'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-muted-foreground font-mono font-medium">
                      {doc.data || new Date(doc.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-5 text-muted-foreground max-w-[320px]">
                      <p className="truncate text-xs leading-relaxed">{doc.resumo || 'Resumo extraído pela inteligência artificial.'}</p>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link href={`/documentos/${doc.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 font-bold text-primary hover:bg-primary hover:text-white transition-colors text-xs">
                        <Eye size={14} /> Ver <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

</div>
  );
}

