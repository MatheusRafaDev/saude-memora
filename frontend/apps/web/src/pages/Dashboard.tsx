import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "wouter";
import {
  ChevronRight,
  FilePlus2,
  FileText,
  Droplets,
  AlertTriangle,
  FlaskConical,
  Pill,
  Stethoscope,
  Plus,
  User,
  BookOpen,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Heart,
  Cigarette,
  Wine,
  Shield,
  Phone,
  CalendarDays,
  CreditCard,
  X,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import {
  useGetApiPacientesMe,
  useGetApiDocuments,
  useGetApiFichaMedicaMe,
} from "@workspace/api-client-react";
import { triggerUploadModal } from "@/components/UploadModal";

export default function Dashboard() {
  const [isCarteirinhaOpen, setIsCarteirinhaOpen] = useState(false);
  const [isCarteirinhaZoomOpen, setIsCarteirinhaZoomOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useGetApiPacientesMe();
  const { data: documentsRaw, isLoading: docsLoading } = useGetApiDocuments();
  const { data: fichaRaw, isLoading: fichaLoading } = useGetApiFichaMedicaMe();

  const user = (profile as any) || {};
  const docs = (documentsRaw as unknown as any[]) || [];
  const ficha = (fichaRaw as any) || {};

  // — Profile —
  const age = user.dataNascimento
    ? Math.floor(
        (Date.now() - new Date(user.dataNascimento).getTime()) /
          (365.25 * 86400000),
      )
    : null;

  // — Anamnese —
  const bloodType = ficha.tipoSanguineo as string | undefined;
  const allergies = (ficha.alergias as string[]) || [];
  const chronicDiseases = (ficha.doencasCronicas as string[]) || [];
  const conditions = (ficha.condicoes as any[]) || [];
  const positiveConditions = conditions.filter((c: any) => c.tem);
  const allConditions = [
    ...chronicDiseases,
    ...positiveConditions.map((c: any) => c.nome),
  ];
  const continuousMedications: string[] = Array.isArray(ficha.medicamentosContinuos)
    ? ficha.medicamentosContinuos.filter(
        (medication: unknown): medication is string =>
          typeof medication === "string" && medication.trim().length > 0,
      )
    : [];
  const familyHistory = ficha.historicoFamiliar as string | undefined;
  const smoker = ficha.fuma as boolean | undefined;
  const alcohol = ficha.bebe as boolean | undefined;
  const donor = ficha.doadorOrgaos as boolean | undefined;
  const habits = ficha.habitosGerais as string | undefined;

  // — Anamnese score —
  let anamneseScore = 0;
  if (bloodType) anamneseScore += 20;
  if (allergies.length > 0) anamneseScore += 20;
  if (chronicDiseases.length > 0 || positiveConditions.length > 0)
    anamneseScore += 20;
  if (familyHistory) anamneseScore += 20;
  if (smoker !== undefined || habits) anamneseScore += 20;

  // — Documents —
  const recentDocs = docs.slice(0, 4);

  // — Relatórios para o médico —
  const processedDocs = docs.filter((doc: any) => doc.status === "pronto");
  const prescriptions = processedDocs.filter((doc: any) =>
    (doc.tipo || "").toLowerCase().includes("receita"),
  );
  const medicationCounts = new Map<string, { nome: string; count: number }>();
  const examCounts = new Map<string, { nome: string; count: number }>();

  prescriptions.forEach((doc: any) => {
    const medications = Array.isArray(doc.medicamentos) ? doc.medicamentos : [];
    const uniqueMedicationNames = new Map<string, string>();
    medications.forEach((medication: any) => {
      const name = typeof medication.nome === "string" ? medication.nome.trim() : "";
      if (name) uniqueMedicationNames.set(name.toLocaleLowerCase(), name);
    });
    uniqueMedicationNames.forEach((name, key) => {
      const current = medicationCounts.get(key);
      medicationCounts.set(key, { nome: current?.nome ?? name, count: (current?.count ?? 0) + 1 });
    });

    const examResults = Array.isArray(doc.resultadosExame) ? doc.resultadosExame : [];
    const isExamDocument = (doc.tipo || "").toLowerCase().includes("exame") ||
      Boolean(doc.nomeExame || doc.tipoExame || examResults.length);
    if (!isExamDocument) return;

    const examName = [doc.tipoExame, doc.nomeExame, doc.titulo]
      .find((value: unknown) => typeof value === "string" && value.trim())?.trim();
    if (!examName) return;

    const key = examName.toLocaleLowerCase();
    const current = examCounts.get(key);
    examCounts.set(key, { nome: current?.nome ?? examName, count: (current?.count ?? 0) + 1 });
  });

  const topMedicacoes = [...medicationCounts.values()]
    .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, 5);
  const topExames = [...examCounts.values()]
    .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, 5);
  const totalExames = [...examCounts.values()].reduce((total, exam) => total + exam.count, 0);
  const highestMedicationCount = topMedicacoes[0]?.count ?? 1;
  const highestExamCount = topExames[0]?.count ?? 1;

  // — Alertas FASE 4 —
  const alertasAtivos = docs
    .flatMap((doc: any) =>
      (doc.alertas || []).map((a: any) => ({ ...a, docId: doc.id })),
    )
    .filter((a: any) => !a.dispensado)
    .sort((a, b) => {
      const p = { alta: 3, moderada: 2, baixa: 1 };
      return (
        (p[b.severidade as keyof typeof p] || 0) -
        (p[a.severidade as keyof typeof p] || 0)
      );
    });

  const firstName = user.nome?.split(" ")[0] || "Você";

  const statusBadge = (doc: any) => {
    if (doc.status === "pending" || doc.status === "processing") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          <LoaderCircle size={9} className="animate-spin" />{" "}
          {doc.status === "processing"
            ? `Processando ${doc.progress}%`
            : "Na Fila"}
        </span>
      );
    }
    if (doc.status === "failed") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">
          <ShieldAlert size={9} /> Falha
        </span>
      );
    }
    if (doc.revisaoPendente) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-500">
          <AlertTriangle size={9} /> Revisar
        </span>
      );
    }
    const t = (doc.tipo || "").toLowerCase();
    if (t.includes("exame"))
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          <FlaskConical size={9} /> Exame
        </span>
      );
    if (t.includes("receita"))
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          <Pill size={9} /> Receita
        </span>
      );
    if (t.includes("laudo"))
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
          <Stethoscope size={9} /> Laudo
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
        <FileText size={9} /> Clínico
      </span>
    );
  };

  if (profileLoading || docsLoading || fichaLoading) {
    return (
      <div className="page-enter space-y-5 pb-8">
        <div className="h-[104px] w-full rounded-2xl bg-muted animate-pulse" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
          <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
          <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-5 pb-8">
      {/* ── Header bar ── */}
      <section className="rounded-2xl bg-primary px-6 py-4 flex items-center justify-between gap-4 shadow-md">
        <div>
          <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Visão geral de saúde
          </p>
          <h1 className="text-lg font-bold text-white mt-0.5">
            Olá, {firstName}
          </h1>
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
                <AlertTriangle size={11} className="text-amber-300" />{" "}
                {allergies.length} alergia{allergies.length > 1 ? "s" : ""}
              </span>
            )}
            {donor && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/20 border border-emerald-300/30 px-2.5 py-1 text-xs font-semibold text-white">
                <Shield size={11} className="text-emerald-300" /> Doador de
                órgãos
              </span>
            )}
            {alertasAtivos.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 border border-red-400/30 px-2.5 py-1 text-xs font-semibold text-white">
                <ShieldAlert size={11} className="text-red-300" />{" "}
                {alertasAtivos.length} aviso
                {alertasAtivos.length > 1 ? "s" : ""} médico
                {alertasAtivos.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── 3-col grid: Perfil | Anamnese | Documentos ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── 1. Perfil ── */}
        <section className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a] text-white">
            <div className="flex items-center gap-2">
              <User size={14} className="text-blue-400" />
              <span className="text-sm font-bold">Perfil</span>
            </div>
            <Link
              href="/perfil"
              className="text-[11px] font-semibold text-blue-200 hover:text-white hover:underline"
            >
              Editar
            </Link>
          </div>
          <div className="px-5 py-4 space-y-3">
            {/* Name */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Nome completo
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {user.nome || "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Nascimento
                </p>
                <p className="text-xs font-medium text-foreground mt-0.5">
                  {user.dataNascimento
                    ? new Date(user.dataNascimento).toLocaleDateString("pt-BR")
                    : "—"}
                  {age !== null && (
                    <span className="text-muted-foreground ml-1">
                      ({age} anos)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Sexo
                </p>
                <p className="text-xs font-medium text-foreground mt-0.5">
                  {user.sexo || "—"}
                </p>
              </div>
            </div>
            {user.telefone && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Telefone
                </p>
                <p className="text-xs font-medium text-foreground mt-0.5 flex items-center gap-1">
                  <Phone size={11} className="text-muted-foreground" />{" "}
                  {user.telefone}
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
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${donor ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border/60 bg-muted/40 text-muted-foreground"}`}
              >
                <Shield size={11} /> {donor ? "Doador" : "Não doador"}
              </span>
            </div>
            {/* Plan */}
            {(user.planoSaude ||
              user.numeroCarteirinha ||
              user.urlCarteirinha) && (
              <div className="pt-3 border-t border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Convênio
                </p>
                {user.planoSaude && (
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {user.planoSaude}
                  </p>
                )}
                {user.numeroCarteirinha && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {user.numeroCarteirinha}
                  </p>
                )}
                {user.urlCarteirinha && (
                  <button
                    onClick={() => setIsCarteirinhaOpen(true)}
                    className="mt-2.5 flex items-center justify-center gap-2 w-full rounded-lg border border-accent/20 bg-accent/10 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-colors"
                  >
                    <CreditCard size={14} /> Abrir Carteirinha
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── 2. Anamnese ── */}
        <section className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a] text-white">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-blue-400" />
              <span className="text-sm font-bold">Anamnese</span>
            </div>
            <Link
              href="/anamnese"
              className="text-[11px] font-semibold text-blue-200 hover:text-white hover:underline"
            >
              Preencher
            </Link>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Alergias */}
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-blue-500" /> Alergias
              </p>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((a: string) => (
                    <span
                      key={a}
                      className="rounded-md border border-blue-200 bg-blue-50 text-blue-800 px-2 py-0.5 text-xs font-medium"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Não informado
                </p>
              )}
            </div>

            {/* Condições */}
            <div>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Activity size={12} className="text-indigo-500" /> Condições &
                Doenças
              </p>
              {allConditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allConditions.map((d: string) => (
                    <span
                      key={d}
                      className="rounded-md border border-indigo-200 bg-indigo-50 text-indigo-800 px-2 py-0.5 text-xs font-medium"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Não informado
                </p>
              )}
            </div>

            {/* Medicamentos de uso contínuo */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  <Pill size={12} className="text-emerald-600" /> Medicamentos de uso contínuo
                </p>
                <Link
                  href="/anamnese"
                  className="shrink-0 text-[10px] font-semibold text-primary hover:underline"
                >
                  Editar
                </Link>
              </div>
              {continuousMedications.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {continuousMedications.map((medication, index) => (
                    <span
                      key={`${medication}-${index}`}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                    >
                      {medication}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  Nenhum cadastrado. <Link href="/anamnese" className="not-italic font-semibold text-primary hover:underline">Adicionar</Link>
                </p>
              )}
            </div>

            {/* Hábitos */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Hábitos
              </p>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${smoker ? "border-rose-200 bg-rose-50 text-rose-700" : "border-border/50 bg-muted/40 text-muted-foreground"}`}
                >
                  <Cigarette size={10} />{" "}
                  {smoker === undefined
                    ? "Fumo n/i"
                    : smoker
                      ? "Fuma"
                      : "Não fuma"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${alcohol ? "border-amber-200 bg-amber-50 text-amber-700" : "border-border/50 bg-muted/40 text-muted-foreground"}`}
                >
                  <Wine size={10} />{" "}
                  {alcohol === undefined
                    ? "Álcool n/i"
                    : alcohol
                      ? "Bebe"
                      : "Não bebe"}
                </span>
              </div>
            </div>

            {/* Histórico familiar */}
            {familyHistory && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Histórico familiar
                </p>
                <p className="text-xs text-foreground leading-relaxed line-clamp-3">
                  {familyHistory}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── 3. Documentos ── */}
        <section className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a] text-white">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              <span className="text-sm font-bold">Documentos</span>
            </div>
            <Link
              href="/documentos"
              className="text-[11px] font-semibold text-blue-200 hover:text-white hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="px-5 py-4">
            {/* Recent docs */}
            {docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <FilePlus2 size={20} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Nenhum documento ainda
                </p>
                <button
                  onClick={() => triggerUploadModal()}
                  className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Plus size={11} /> Adicionar
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentDocs.map((doc: any) =>
                  doc.status === "pending" || doc.status === "processing" ? (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 opacity-70 cursor-not-allowed px-3 py-2.5"
                      title="Aguarde o processamento concluir"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <LoaderCircle size={12} className="animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground truncate">
                          Analisando documento...
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {statusBadge(doc)}
                          {doc.data && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {doc.data}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
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
                          {doc.titulo || "Documento sem título"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {statusBadge(doc)}
                          {doc.data && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {doc.data}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        size={13}
                        className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors"
                      />
                    </Link>
                  ),
                )}
                {docs.length > 4 && (
                  <Link
                    href="/documentos"
                    className="flex items-center justify-center gap-1 rounded-lg border border-border/50 bg-muted/20 hover:bg-primary hover:text-white hover:border-primary px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors"
                  >
                    Ver mais {docs.length - 4} documentos{" "}
                    <ChevronRight size={12} />
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
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
          <div className="flex flex-col gap-3 bg-[#0f172a] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                <BarChart3 size={17} />
              </div>
              <div>
                <h2 className="text-sm font-bold">Resumo para sua consulta</h2>
                <p className="mt-0.5 text-[11px] text-slate-300">Informações extraídas do seu histórico de saúde</p>
              </div>
            </div>
            <Link
              href="/documentos"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 sm:self-auto"
            >
              Ver documentos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 border-b border-border/50 bg-muted/10 p-4 sm:grid-cols-4 sm:p-5">
            {[
              { label: "Documentos analisados", value: processedDocs.length, icon: FileText, color: "text-primary bg-primary/10" },
              { label: "Receitas", value: prescriptions.length, icon: Pill, color: "text-emerald-700 bg-emerald-500/10" },
              { label: "Exames registrados", value: totalExames, icon: FlaskConical, color: "text-blue-700 bg-blue-500/10" },
              { label: "Remédios contínuos informados", value: continuousMedications.length, icon: Heart, color: "text-rose-700 bg-rose-500/10" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-4">
                <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                  <Icon size={15} />
                </div>
                <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
                <p className="mt-1.5 text-[10px] font-medium leading-4 text-muted-foreground sm:text-xs">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid divide-y divide-border/50 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Pill size={15} className="text-emerald-600" /> Medicamentos nas receitas
                </h3>
                <span className="shrink-0 text-[10px] text-muted-foreground">Mais recorrentes</span>
              </div>
              {topMedicacoes.length > 0 ? (
                <div className="space-y-4">
                  {topMedicacoes.map((med) => (
                    <div key={med.nome} className="space-y-1.5">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="truncate text-xs font-semibold text-foreground">{med.nome}</span>
                        <span className="shrink-0 text-[10px] font-bold text-emerald-700">
                          {med.count} {med.count === 1 ? "receita" : "receitas"}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                          style={{ width: `${Math.max(12, (med.count / highestMedicationCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
                  Ainda não há medicamentos identificados em receitas analisadas.
                </p>
              )}
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <FlaskConical size={15} className="text-blue-600" /> Exames mais registrados
                </h3>
                <span className="shrink-0 text-[10px] text-muted-foreground">Por documento</span>
              </div>
              {topExames.length > 0 ? (
                <div className="space-y-4">
                  {topExames.map((exam) => (
                    <div key={exam.nome} className="space-y-1.5">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="truncate text-xs font-semibold text-foreground">{exam.nome}</span>
                        <span className="shrink-0 text-[10px] font-bold text-blue-700">
                          {exam.count} {exam.count === 1 ? "registro" : "registros"}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-[width] duration-500"
                          style={{ width: `${Math.max(12, (exam.count / highestExamCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
                  Ainda não há exames identificados em documentos analisados.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-px border-t border-border/50 bg-border/50 md:grid-cols-3">
            {[
              { label: "Medicação contínua informada", items: continuousMedications, empty: "Nenhum medicamento contínuo informado.", dotColor: "bg-emerald-500" },
              { label: "Alergias registradas", items: allergies, empty: "Nenhuma alergia registrada.", dotColor: "bg-rose-500" },
              { label: "Condições registradas", items: allConditions, empty: "Nenhuma condição registrada.", dotColor: "bg-amber-500" },
            ].map(({ label, items, empty, dotColor }) => (
              <div key={label} className="min-w-0 bg-card p-4 sm:p-5">
                <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                  {label}
                </h3>
                {items.length ? (
                  <ul className="space-y-2">
                    {items.slice(0, 4).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs font-medium leading-5 text-foreground">
                        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                        <span className="break-words">{item}</span>
                      </li>
                    ))}
                    {items.length > 4 && (
                      <li className="text-[10px] font-semibold text-muted-foreground">+{items.length - 4} outros</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">{empty}</p>
                )}
              </div>
            ))}
          </div>
          <p className="px-4 py-3 text-[10px] leading-4 text-muted-foreground sm:px-5">
            Frequências calculadas pelos documentos analisados; uma receita não confirma que o medicamento foi utilizado. Confira os dados com o paciente.
          </p>
      </section>

      {/* ── Modal da Carteirinha ── */}
      <DialogPrimitive.Root
        open={isCarteirinhaOpen}
        onOpenChange={(open) => {
          setIsCarteirinhaOpen(open);
          if (!open) setIsCarteirinhaZoomOpen(false);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[99999] glass-modal page-enter" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[100000] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl outline-none sm:p-6 md:p-8">
            <DialogPrimitive.Title className="sr-only">Sua Carteirinha</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Informações do seu convênio ou plano de saúde.
            </DialogPrimitive.Description>

            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Fechar carteirinha"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-5 sm:top-5"
              >
                <X size={18} />
              </button>
            </DialogPrimitive.Close>

            <div className="mb-6 flex flex-col items-center text-center">
              <CreditCard className="mb-2 h-10 w-10 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Sua Carteirinha
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Informações do seu convênio ou plano de saúde.
              </p>
            </div>

            <div className="space-y-4">
              {user.urlCarteirinha ? (
                <button
                  type="button"
                  onClick={() => setIsCarteirinhaZoomOpen(true)}
                  aria-label="Ampliar imagem da carteirinha"
                  className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40 p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:p-3"
                >
                  <img
                    src={user.urlCarteirinha}
                    alt="Imagem da carteirinha do plano de saúde"
                    className="max-h-[min(48dvh,520px)] w-full object-contain"
                  />
                  <span className="absolute bottom-3 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    Toque para ampliar
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <CreditCard size={32} className="mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-muted-foreground">Nenhuma imagem adicionada</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Vá em Perfil para adicionar a foto da sua carteirinha.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                    Convênio / Plano de Saúde
                  </span>
                  <span className="break-words text-sm font-bold text-foreground">
                    {user.planoSaude || "Não informado"}
                  </span>
                </div>
                <div className="flex flex-col rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                    Número da Carteirinha
                  </span>
                  <span className="break-all text-sm font-mono font-bold text-foreground">
                    {user.numeroCarteirinha || "Não informado"}
                  </span>
                </div>
              </div>
            </div>

            <DialogPrimitive.Root open={isCarteirinhaZoomOpen} onOpenChange={setIsCarteirinhaZoomOpen}>
              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100001] bg-black/95" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[100002] flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 items-center justify-center p-3 outline-none sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:p-8">
                  <DialogPrimitive.Title className="sr-only">Imagem ampliada da carteirinha</DialogPrimitive.Title>
                  <DialogPrimitive.Close asChild>
                    <button
                      type="button"
                      aria-label="Fechar imagem ampliada"
                      className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5 sm:top-5"
                    >
                      <X size={22} />
                    </button>
                  </DialogPrimitive.Close>
                  <img
                    src={user.urlCarteirinha}
                    alt="Carteirinha ampliada"
                    className="max-h-full max-w-full object-contain"
                  />
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
