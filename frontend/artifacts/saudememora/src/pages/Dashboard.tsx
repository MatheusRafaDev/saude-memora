import { useState } from 'react';
import { Link } from 'wouter';
import {
  ChevronRight, FilePlus2, FileText,
  Droplets, AlertTriangle, FlaskConical, Pill,
  Stethoscope, Plus, User, BookOpen, Activity, BarChart3, PieChart, TrendingUp,
  Heart, Cigarette, Wine, Shield, Phone, CalendarDays, CreditCard, X,
  LoaderCircle, ShieldAlert
} from 'lucide-react';
import { useGetApiPacientesMe, useGetApiDocuments, useGetApiFichaMedicaMe } from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';

export default function Dashboard() {
  const [isCarteirinhaOpen, setIsCarteirinhaOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useGetApiPacientesMe();
  const { data: documentsRaw, isLoading: docsLoading } = useGetApiDocuments();
  const { data: fichaRaw, isLoading: fichaLoading } = useGetApiFichaMedicaMe();

  const user    = (profile as any) || {};
  const docs    = (documentsRaw as unknown as any[]) || [];
  const ficha   = (fichaRaw as any) || {};

  // — Profile —
  const age = user.dataNascimento
    ? Math.floor((Date.now() - new Date(user.dataNascimento).getTime()) / (365.25 * 86400000))
    : null;

  // — Anamnese —
  const bloodType          = ficha.tipoSanguineo as string | undefined;
  const allergies          = (ficha.alergias as string[]) || [];
  const chronicDiseases    = (ficha.doencasCronicas as string[]) || [];
  const conditions         = (ficha.condicoes as any[]) || [];
  const positiveConditions = conditions.filter((c: any) => c.tem);
  const allConditions      = [
    ...chronicDiseases,
    ...positiveConditions.map((c: any) => c.nome),
  ];
  const familyHistory      = ficha.historicoFamiliar as string | undefined;
  const smoker             = ficha.fuma as boolean | undefined;
  const alcohol            = ficha.bebe as boolean | undefined;
  const donor              = ficha.doadorOrgaos as boolean | undefined;
  const habits             = ficha.habitosGerais as string | undefined;

  // — Anamnese score —
  let anamneseScore = 0;
  if (bloodType)                                                     anamneseScore += 20;
  if (allergies.length > 0)                                         anamneseScore += 20;
  if (chronicDiseases.length > 0 || positiveConditions.length > 0)  anamneseScore += 20;
  if (familyHistory)                                                 anamneseScore += 20;
  if (smoker !== undefined || habits)                                anamneseScore += 20;

  // — Documents —
  const recentDocs    = docs.slice(0, 4);

  // — Relatórios para o médico —
  const medicacoesCount: Record<string, number> = {};
  const examesCountMap: Record<string, number> = {};
  
  docs.forEach((doc: any) => {
    if (doc.medicamentos && Array.isArray(doc.medicamentos)) {
      doc.medicamentos.forEach((m: any) => {
        if (m.nome) {
          const key = m.nome.trim().toLowerCase();
          medicacoesCount[key] = (medicacoesCount[key] || 0) + 1;
        }
      });
    }
    
    const tipo = (doc.tipoIdentificado || doc.tipo || '').toLowerCase();
    if (tipo.includes('exame') || tipo.includes('laudo')) {
      const titulo = doc.titulo || doc.nomeExame;
      if (titulo) {
        const key = titulo.trim().toLowerCase();
        examesCountMap[key] = (examesCountMap[key] || 0) + 1;
      }
    }
  });

  const topMedicacoes = Object.entries(medicacoesCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([key, count]) => {
      let originalName = key;
      for (const d of docs) {
        if (d.medicamentos) {
          const match = d.medicamentos.find((m: any) => m.nome?.trim().toLowerCase() === key);
          if (match) { originalName = match.nome; break; }
        }
      }
      return { nome: originalName, count };
    });

  const topExames = Object.entries(examesCountMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([key, count]) => {
      let originalName = key;
      for (const d of docs) {
        const tipo = (d.tipoIdentificado || d.tipo || '').toLowerCase();
        if (tipo.includes('exame') || tipo.includes('laudo')) {
          const t = d.titulo || d.nomeExame;
          if (t?.trim().toLowerCase() === key) { originalName = t; break; }
        }
      }
      return { nome: originalName, count };
    });

  const firstName = user.nome?.split(' ')[0] || 'Você';

  const statusBadge = (doc: any) => {
    if (doc.status === 'pending' || doc.status === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          <LoaderCircle size={9} className="animate-spin" /> {doc.status === 'processing' ? `Processando ${doc.progress}%` : 'Na Fila'}
        </span>
      );
    }
    if (doc.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">
          <ShieldAlert size={9} /> Falha
        </span>
      );
    }
    const t = (doc.tipo || '').toLowerCase();
    if (t.includes('exame'))
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700"><FlaskConical size={9} /> Exame</span>;
    if (t.includes('receita'))
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"><Pill size={9} /> Receita</span>;
    if (t.includes('laudo'))
      return <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-700"><Stethoscope size={9} /> Laudo</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary"><FileText size={9} /> Clínico</span>;
  };

  if (profileLoading || docsLoading || fichaLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-5 pb-8">

      {/* ── Header bar ── */}
      <section className="rounded-2xl bg-primary px-6 py-4 flex items-center justify-between gap-4 shadow-md">
        <div>
          <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Visão geral de saúde</p>
          <h1 className="text-lg font-bold text-white mt-0.5">Olá, {firstName}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {bloodType && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                <Droplets size={11} className="text-red-300" /> {bloodType}
              </span>
            )}
            {age !== null && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                <CalendarDays size={11} className="text-blue-200" /> {age} anos
              </span>
            )}
            {allergies.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 border border-amber-300/30 px-2.5 py-1 text-xs font-semibold text-white">
                <AlertTriangle size={11} className="text-amber-300" /> {allergies.length} alergia{allergies.length > 1 ? 's' : ''}
              </span>
            )}
            {donor && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/20 border border-emerald-300/30 px-2.5 py-1 text-xs font-semibold text-white">
                <Shield size={11} className="text-emerald-300" /> Doador de órgãos
              </span>
            )}
          </div>
        </div>

      </section>

      {/* ── 3-col grid: Perfil | Anamnese | Documentos ── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── 1. Perfil ── */}
        <section className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <div className="flex items-center gap-2 text-foreground">
              <User size={14} className="text-primary" />
              <span className="text-sm font-bold">Perfil</span>
            </div>
            <Link href="/perfil" className="text-[11px] font-semibold text-primary hover:underline">Editar</Link>
          </div>
          <div className="px-5 py-4 space-y-3">
            {/* Name */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome completo</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{user.nome || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nascimento</p>
                <p className="text-xs font-medium text-foreground mt-0.5">
                  {user.dataNascimento
                    ? new Date(user.dataNascimento).toLocaleDateString('pt-BR')
                    : '—'}
                  {age !== null && <span className="text-muted-foreground ml-1">({age} anos)</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sexo</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{user.sexo || '—'}</p>
              </div>
            </div>
            {user.telefone && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</p>
                <p className="text-xs font-medium text-foreground mt-0.5 flex items-center gap-1">
                  <Phone size={11} className="text-muted-foreground" /> {user.telefone}
                </p>
              </div>
            )}
            {/* Health ID badges */}
            <div className="pt-1 flex flex-wrap gap-2">
              {bloodType && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  <Droplets size={11} /> Tipo {bloodType}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${donor ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-border/60 bg-muted/40 text-muted-foreground'}`}>
                <Shield size={11} /> {donor ? 'Doador' : 'Não doador'}
              </span>
            </div>
            {/* Plan */}
            {(user.planoSaude || user.numeroCarteirinha || user.urlCarteirinha) && (
              <div className="pt-3 border-t border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Convênio</p>
                {user.planoSaude && <p className="text-xs font-bold text-foreground mt-0.5">{user.planoSaude}</p>}
                {user.numeroCarteirinha && (
                  <p className="text-[10px] text-muted-foreground font-mono">{user.numeroCarteirinha}</p>
                )}
                {user.urlCarteirinha && (
                  <button onClick={() => setIsCarteirinhaOpen(true)} className="mt-2.5 flex items-center justify-center gap-2 w-full rounded-lg border border-accent/20 bg-accent/10 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-colors">
                    <CreditCard size={14} /> Abrir Carteirinha
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── 2. Anamnese ── */}
        <section className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <div className="flex items-center gap-2 text-foreground">
              <BookOpen size={14} className="text-primary" />
              <span className="text-sm font-bold">Anamnese</span>
            </div>
            <Link href="/anamnese" className="text-[11px] font-semibold text-primary hover:underline">Preencher</Link>
          </div>
          <div className="px-5 py-4 space-y-4">


            {/* Alergias */}
            <div>
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5">Alergias</p>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a: string) => (
                    <span key={a} className="rounded-md border border-amber-200 bg-amber-50 text-amber-800 px-2 py-0.5 text-xs font-medium">{a}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Não informado</p>
              )}
            </div>

            {/* Condições */}
            <div>
              <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-1.5">Condições & Doenças</p>
              {allConditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allConditions.map((d: string) => (
                    <span key={d} className="rounded-md border border-orange-200 bg-orange-50 text-orange-800 px-2 py-0.5 text-xs font-medium">{d}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Não informado</p>
              )}
            </div>

            {/* Hábitos */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Hábitos</p>
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${smoker ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-border/50 bg-muted/40 text-muted-foreground'}`}>
                  <Cigarette size={10} /> {smoker === undefined ? 'Fumo n/i' : smoker ? 'Fuma' : 'Não fuma'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${alcohol ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-border/50 bg-muted/40 text-muted-foreground'}`}>
                  <Wine size={10} /> {alcohol === undefined ? 'Álcool n/i' : alcohol ? 'Bebe' : 'Não bebe'}
                </span>
              </div>
            </div>

            {/* Histórico familiar */}
            {familyHistory && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Histórico familiar</p>
                <p className="text-xs text-foreground leading-relaxed line-clamp-3">{familyHistory}</p>
              </div>
            )}


          </div>
        </section>

        {/* ── 3. Documentos ── */}
        <section className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <div className="flex items-center gap-2 text-foreground">
              <Activity size={14} className="text-primary" />
              <span className="text-sm font-bold">Documentos</span>
            </div>
            <Link href="/documentos" className="text-[11px] font-semibold text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="px-5 py-4">
            {/* Recent docs */}
            {docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <FilePlus2 size={20} />
                </div>
                <p className="text-xs text-muted-foreground">Nenhum documento ainda</p>
                <button
                  onClick={() => triggerUploadModal()}
                  className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Plus size={11} /> Adicionar
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentDocs.map((doc: any) => (
                  <Link
                    key={doc.id}
                    href={`/documentos/${doc.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/50 px-3 py-2.5 transition-colors group"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                      <FileText size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {doc.titulo || ((doc.status === 'pending' || doc.status === 'processing') ? 'Analisando documento...' : 'Documento sem título')}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {statusBadge(doc)}
                        {doc.data && (
                          <span className="text-[10px] text-muted-foreground font-mono">{doc.data}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </Link>
                ))}
                {docs.length > 4 && (
                  <Link
                    href="/documentos"
                    className="flex items-center justify-center gap-1 rounded-lg border border-border/50 bg-muted/20 hover:bg-primary hover:text-white hover:border-primary px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors"
                  >
                    Ver mais {docs.length - 4} documentos <ChevronRight size={12} />
                  </Link>
                )}
                <button
                  onClick={() => triggerUploadModal()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/4 hover:bg-primary hover:text-white hover:border-primary px-3 py-2 text-[11px] font-semibold text-primary transition-colors cursor-pointer mt-1"
                >
                  <Plus size={11} /> Adicionar documento
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── 4. Relatórios e Estatísticas (Para o Médico) ── */}
      {(topMedicacoes.length > 0 || topExames.length > 0) && (
        <section className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/10">
            <div className="flex items-center gap-2 text-foreground">
              <BarChart3 size={15} className="text-primary" />
              <span className="text-sm font-bold">Relatórios e Estatísticas</span>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Apoio Médico</span>
          </div>
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {/* Top Medicamentos */}
            <div className="p-5">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <Pill size={12} className="text-emerald-500" /> Remédios Mais Frequentes
              </h3>
              {topMedicacoes.length > 0 ? (
                <div className="space-y-3">
                  {topMedicacoes.map((med, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground truncate pr-4">{med.nome}</span>
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-200">
                        {med.count}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum medicamento registrado.</p>
              )}
            </div>

            {/* Top Exames */}
            <div className="p-5">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <FlaskConical size={12} className="text-blue-500" /> Exames Mais Realizados
              </h3>
              {topExames.length > 0 ? (
                <div className="space-y-3">
                  {topExames.map((exame, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground truncate pr-4">{exame.nome}</span>
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-bold border border-blue-200">
                        {exame.count}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum exame registrado.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Saúde em destaque: alertas críticos ── */}
      {(allergies.length > 0 || allConditions.length > 0) && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={14} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">Informações de Segurança</p>
            <span className="ml-auto text-[10px] text-amber-600 font-semibold">Para médicos e emergências</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {allergies.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">Alergias</p>
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a: string) => (
                    <span key={a} className="rounded-md border border-amber-300 bg-white text-amber-800 px-2.5 py-0.5 text-xs font-semibold shadow-xs">⚠ {a}</span>
                  ))}
                </div>
              </div>
            )}
            {allConditions.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider mb-1.5">Condições</p>
                <div className="flex flex-wrap gap-1.5">
                  {allConditions.map((d: string) => (
                    <span key={d} className="rounded-md border border-orange-300 bg-white text-orange-800 px-2.5 py-0.5 text-xs font-semibold shadow-xs">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Modal da Carteirinha ── */}
      {isCarteirinhaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCarteirinhaOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                Sua Carteirinha
              </h2>
              <button
                onClick={() => setIsCarteirinhaOpen(false)}
                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Imagem da carteirinha */}
              {user.urlCarteirinha && (
                <div className="rounded-xl overflow-hidden border border-border/50 bg-black/5 flex items-center justify-center">
                  <img 
                    src={user.urlCarteirinha} 
                    alt="Carteirinha" 
                    className="max-h-[300px] w-full object-contain"
                  />
                </div>
              )}
              
              {/* Inputs informativos (ReadOnly no Dashboard) */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Convênio / Plano de Saúde</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={user.planoSaude || 'Não informado'} 
                    className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Número da Carteirinha</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={user.numeroCarteirinha || 'Não informado'} 
                    className="mt-1 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-mono font-semibold text-foreground outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/20">
              <Link href="/perfil" className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-colors">
                Editar no Perfil
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
