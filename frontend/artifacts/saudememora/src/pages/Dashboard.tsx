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
  const examesCount = documents.filter((d: any) => (d.type || '').toLowerCase().includes('exame')).length;
  const receitasCount = documents.filter((d: any) => (d.type || '').toLowerCase().includes('receita')).length;
  const laudosCount = documents.filter((d: any) => (d.type || '').toLowerCase().includes('laudo')).length;
  const outrosCount = documents.length - (examesCount + receitasCount + laudosCount);

  // Filtered documents for table
  const filteredDocuments = documents.filter((d: any) => {
    const t = (d.type || '').toLowerCase();
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
    <div className="page-enter space-y-7">

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-accent/90 p-6 md:p-8 text-primary-foreground shadow-lg">
        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full glass-badge px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
              <Sparkles size={12} className="text-yellow-300" /> Visão Geral do Paciente · {todayCap}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-white md:text-[38px] leading-tight">
              Olá, {firstName}! 👋
            </h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-xl">
              Todos os seus documentos de saúde unificados em um único histórico. A Inteligência Artificial analisa, lê e organiza automaticamente seus exames, receitas e laudos.
            </p>

            {/* User Quick Info Badges */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {age !== null && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {age} anos
                </span>
              )}
              {bloodType && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/30 border border-red-300/40 px-2.5 py-1 text-xs font-black text-white backdrop-blur-sm">
                  <Droplets size={13} className="text-red-300" /> Tipo {bloodType}
                </span>
              )}
              {organDonor && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/30 border border-emerald-300/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  <ShieldCheck size={13} className="text-emerald-300" /> Doador de Órgãos
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                <CheckCircle2 size={13} className="text-emerald-300" /> IA Ativa
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => triggerUploadModal()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-primary shadow-md hover:bg-white/90 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <UploadCloud size={17} className="text-accent" /> Adicionar Documento <Plus size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Unified Metrics Banner */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent font-black text-xl">
            <FileCheck2 size={24} />
          </span>
          <div>
            <p className="font-mono text-3xl font-black leading-none">{documents.length}</p>
            <p className="mt-1 text-xs font-bold text-foreground">Total de Documentos</p>
            <p className="text-[10px] text-muted-foreground">Tabela única de saúde</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent font-black text-xl">
            <BrainCircuit size={24} />
          </span>
          <div>
            <p className="font-mono text-3xl font-black leading-none text-accent">{documents.length}</p>
            <p className="mt-1 text-xs font-bold text-foreground">Classificados por IA</p>
            <p className="text-[10px] text-muted-foreground">Identificação automática</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xl">
            <FlaskConical size={24} />
          </span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-extrabold text-blue-600 dark:text-blue-400">{examesCount} <span className="text-[10px] font-bold text-muted-foreground">Exames</span></span>
              <span className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{receitasCount} <span className="text-[10px] font-bold text-muted-foreground">Rec.</span></span>
            </div>
            <p className="mt-1 text-xs font-bold text-foreground">Distribuição Detectada</p>
            <p className="text-[10px] text-muted-foreground">{laudosCount} laudos · {outrosCount} outros</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xl">
            <HeartPulse size={24} />
          </span>
          <div>
            <p className="font-mono text-3xl font-black leading-none text-emerald-600 dark:text-emerald-400">{anamneseScore}%</p>
            <p className="mt-1 text-xs font-bold text-foreground">Anamnese do Paciente</p>
            <p className="text-[10px] text-muted-foreground">Histórico médico ativo</p>
          </div>
        </div>
      </section>

      {/* Single Unified Documents Table */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Table size={20} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">tabela única de documentos</p>
              <h2 className="text-lg font-extrabold tracking-[-.03em]">Documentos de Saúde (Classificados por IA)</h2>
            </div>
          </div>

          {/* Table Filters & Link */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 text-[11px] font-bold">
              <button
                onClick={() => setActiveTab('todos')}
                className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${activeTab === 'todos' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Todos ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('exames')}
                className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${activeTab === 'exames' ? 'bg-card text-blue-600 dark:text-blue-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Exames ({examesCount})
              </button>
              <button
                onClick={() => setActiveTab('receitas')}
                className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${activeTab === 'receitas' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Receitas ({receitasCount})
              </button>
              <button
                onClick={() => setActiveTab('laudos')}
                className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${activeTab === 'laudos' ? 'bg-card text-purple-600 dark:text-purple-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Laudos ({laudosCount})
              </button>
            </div>

            <Link href="/documentos" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent transition-colors ml-auto lg:ml-0">
              <span>Ver todos ({documents.length})</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <FilePlus2 size={32} className="text-muted-foreground/40" />
            <div>
              <p className="text-sm font-bold">Nenhum documento nesta categoria</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Envie seus exames, receitas, laudos ou notas médicas. A Inteligência Artificial lerá o documento e classificará automaticamente nesta tabela.
              </p>
            </div>
            <button
              onClick={() => triggerUploadModal()}
              className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              <Plus size={15} /> Adicionar Documento
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-3">Documento</th>
                  <th className="py-3 px-3">Tipo (Detectado por IA)</th>
                  <th className="py-3 px-3">Profissional / Emissor</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Resumo Inteligente</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredDocuments.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="py-3.5 px-3 font-bold text-foreground">
                      <Link href={`/documentos/${doc.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                        <FileText size={16} className="text-accent shrink-0" />
                        <span className="truncate max-w-[200px]">{doc.title || 'Documento sem título'}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-3">
                      {getDocumentTypeBadge(doc.type)}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-medium">
                      {doc.doctor || doc.clinic || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground font-mono">
                      {doc.date || new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground max-w-[280px]">
                      <p className="truncate font-normal">{doc.summary || 'Resumo extraído pela inteligência artificial.'}</p>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link href={`/documentos/${doc.id}`} className="inline-flex items-center gap-1 font-bold text-primary hover:text-accent text-xs">
                        <Eye size={13} /> Ver <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Patient Health Context (Alerts & Profile) */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* Alerts */}
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={17} />
              </span>
              <div>
                <h2 className="text-sm font-extrabold">Alergias & Doenças Crônicas</h2>
                <p className="text-[10px] text-muted-foreground">Alertas de segurança do paciente</p>
              </div>
            </div>
            <Link href="/anamnese" className="text-[11px] font-bold text-accent hover:underline">Editar na Anamnese</Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3.5">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-2">Alergias Conocidas</span>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a: string) => (
                    <span key={a} className="rounded-lg border border-amber-400/40 bg-amber-100/70 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 px-2.5 py-1 text-xs font-bold">
                      ⚠️ {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhuma alergia cadastrada.</p>
              )}
            </div>

            <div className="rounded-xl bg-orange-500/5 border border-orange-500/15 p-3.5">
              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider block mb-2">Doenças / Condições</span>
              {chronicDiseases.length > 0 || positiveConditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {chronicDiseases.map((d: string) => (
                    <span key={d} className="rounded-lg border border-orange-400/40 bg-orange-100/70 dark:bg-orange-950/70 text-orange-900 dark:text-orange-200 px-2.5 py-1 text-xs font-bold">
                      🔴 {d}
                    </span>
                  ))}
                  {positiveConditions.map((c: any) => (
                    <span key={c.nome} className="rounded-lg border border-orange-400/40 bg-orange-100/70 dark:bg-orange-950/70 text-orange-900 dark:text-orange-200 px-2.5 py-1 text-xs font-bold">
                      🔴 {c.nome}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhuma doença declarada.</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User size={17} />
              </span>
              <div>
                <h2 className="text-sm font-extrabold">Ficha do Paciente</h2>
                <p className="text-[10px] text-muted-foreground">Informações médicas e estilo de vida</p>
              </div>
            </div>
            <Link href="/perfil" className="text-[11px] font-bold text-accent hover:underline">Editar Perfil</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/40 p-3 text-center border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Tipo Sanguíneo</span>
              <span className="text-base font-black text-red-600 dark:text-red-400 mt-1 block">{bloodType || '—'}</span>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Doador de Órgãos</span>
              <span className="text-xs font-extrabold text-foreground mt-1 block">{organDonor ? 'Sim' : 'Não'}</span>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-center border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Estilo de Vida</span>
              <span className="text-xs font-extrabold text-foreground mt-1 block">{smoker ? 'Fuma' : 'Sem fumo'} · {alcohol ? 'Álcool' : 'Sem álcool'}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
