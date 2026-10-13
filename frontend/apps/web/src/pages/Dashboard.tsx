import { lazy, Suspense, useState } from 'react';
import { Link } from 'wouter';
import {
  FileText,
  AlertTriangle,
  FlaskConical,
  Pill,
  Plus,
  Shield,
  LoaderCircle,
  ShieldAlert,
  ArrowRight,
  Activity,
  Heart,
  Calendar,
  X,
  CreditCard,
  Maximize2
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  useGetApiPacientesMe,
  useGetApiDocuments,
  useGetApiFichaMedicaMe,
} from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';
const Insights = lazy(() => import('@/pages/Insights'));

function uniqueLabels(values: unknown[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    if (typeof value !== 'string') return [];
    const label = value.trim().replace(/\s+/g, ' ');
    const key = label.toLocaleLowerCase('pt-BR');
    if (!label || seen.has(key)) return [];
    seen.add(key);
    return [label];
  });
}

export default function Dashboard() {
  const [isCarteirinhaOpen, setIsCarteirinhaOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading, isError: profileError } = useGetApiPacientesMe();
  const { data: documentsRaw, isLoading: isDocumentsLoading, isError: documentsError } = useGetApiDocuments();
  const { data: fichaRaw, isLoading: isFichaLoading, isError: fichaError } = useGetApiFichaMedicaMe();

  const user = (profile as any) || {};
  const docs = (documentsRaw as unknown as any[]) || [];
  const ficha = (fichaRaw as any) || {};

  const firstName = user.nome ? user.nome.trim().split(/\s+/)[0] : '';
  const fullName = user.nome || 'Nome não informado';
  const healthPlan = typeof user.planoSaude === 'string' ? user.planoSaude.trim() : '';
  const insuranceCardNumber = typeof user.numeroCarteirinha === 'string'
    ? user.numeroCarteirinha.trim()
    : '';
  const registeredCardUrl = typeof user.urlCarteirinha === 'string' ? user.urlCarteirinha : '';

  const birthDate = user.dataNascimento ? new Date(user.dataNascimento) : null;
  const hasValidBirthDate = birthDate !== null && !Number.isNaN(birthDate.getTime());
  const birthDateFormatted = hasValidBirthDate
    ? birthDate.toLocaleDateString('pt-BR')
    : 'Não informado';
  const age = hasValidBirthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400000))
    : null;

  const bloodType = ficha.tipoSanguineo || 'Não informado';
  const allergiesList = uniqueLabels(Array.isArray(ficha.alergias) ? ficha.alergias : []);
  const allergiesDisplay = allergiesList.length > 0 ? allergiesList.join(' · ') : 'Não informado';

  const chronicDiseases = uniqueLabels(Array.isArray(ficha.doencasCronicas) ? ficha.doencasCronicas : []);
  const conditions = (ficha.condicoes as any[]) || [];
  const positiveConditions = conditions.filter((c: any) => c.tem);
  const allConditions = uniqueLabels([
    ...chronicDiseases,
    ...positiveConditions.map((c: any) => c.nome),
    ficha.outrasDoencas,
  ]);
  const conditionsDisplay = allConditions.length > 0 ? allConditions.join(' · ') : 'Não informado';

  const continuousMeds = uniqueLabels(
    Array.isArray(ficha.medicamentosContinuos) ? ficha.medicamentosContinuos : []
  );

  const examDocs = docs.filter((d: any) => (d.tipo || '').toLowerCase().includes('exame'));
  const prescriptionDocs = docs.filter((d: any) => (d.tipo || '').toLowerCase().includes('receita'));
  const totalExams = examDocs.length;
  const totalPrescriptions = prescriptionDocs.length;

  const reviewDocs = docs.filter((d: any) => d.revisaoPendente);
  const processingDocs = docs.filter((d: any) => d.status === 'pending' || d.status === 'processing');

  const medicalAlerts = docs
    .flatMap((doc: any) => (doc.alertas || []).map((a: any) => ({ ...a, docId: doc.id })))
    .filter((a: any) => !a.dispensado);

  const displayRecentDocs = docs.slice(0, 4).map((d: any) => {
    let badge = 'Pronto';
    let badgeClass = 'bg-[#e5eefb] text-[#1b3a60]';
    if (d.status === 'processing' || d.status === 'pending') {
      badge = `Processando ${d.progress ?? 0}%`;
    } else if (d.status === 'failed') {
      badge = 'Falha';
      badgeClass = 'bg-[#fde8e6] text-[#a13a30]';
    } else if (d.revisaoPendente) {
      badge = 'Revisar';
      badgeClass = 'bg-[#fdf3d8] text-[#6b4208]';
    }
    const createdAt = d.criadoEm || d.createdAt;
    const parsedDate = createdAt ? new Date(createdAt) : null;
    return {
      id: d.id,
      titulo: d.titulo || d.tipo || 'Documento',
      data: parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Data não informada',
      status: d.status,
      badge,
      badgeClass,
    };
  });

  const getFrequencies = (values: unknown[]) => {
    const counts = new Map<string, number>();
    values.forEach((value) => {
      const label = typeof value === 'string'
        ? value.trim()
        : value && typeof value === 'object'
          ? String((value as any).nome || (value as any).nomeNormalizado || '').trim()
          : '';
      if (label) counts.set(label, (counts.get(label) || 0) + 1);
    });
    const sorted = Array.from(counts, ([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    const max = sorted[0]?.count || 1;
    return sorted.map((item) => ({ ...item, pct: Math.round((item.count / max) * 100) }));
  };
  const frequentMeds = getFrequencies(docs.flatMap((doc: any) => doc.medicamentos || []));
  const frequentExams = getFrequencies(docs.flatMap((doc: any) => [
    ...(doc.resultadosExame || []),
    doc.nomeExame,
  ]));

  if (isProfileLoading || isDocumentsLoading || isFichaLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#5a6a80]">
        <LoaderCircle size={22} className="mr-2 animate-spin" /> Carregando seus dados…
      </div>
    );
  }

  if (profileError || documentsError || fichaError) {
    return (
      <div role="alert" className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#f0b8b2] bg-white p-8 text-center text-[#a13a30]">
        Não foi possível carregar os dados da sua conta. Atualize a página ou tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title & Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1f7fe0]">
              Seu espaço de saúde
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Olá{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              Veja o que precisa de atenção e seus dados em um só lugar.
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Link
              href="/anamnese"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#c6cfdb] bg-white px-3 text-sm font-bold text-[#1b3a60] hover:bg-[#f1f4f8] lg:hidden"
            >
              Anamnese
            </Link>
            <button
              onClick={() => triggerUploadModal()}
              className="min-h-[44px] flex-1 rounded-xl bg-[#1b3a60] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#24507f] sm:flex-none sm:px-5"
            >
              <span className="inline-flex items-center gap-2"><Plus size={16} strokeWidth={2.5} />Adicionar documento</span>
            </button>
          </div>
        </div>

        {/* Alerts are only shown when the API reports items that need attention. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
          {/* Alert 1 */}
          {medicalAlerts.length > 0 && <div className="flex items-center gap-3.5 bg-[#fff5f4] border border-[#f0b8b2] rounded-[18px] p-4.5">
            <div className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={22} className="text-[#a13a30]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <b className="text-[15px] text-[#1d2a3d] block leading-tight">
                {medicalAlerts.length} avisos médicos
              </b>
              <div className="text-[13px] text-[#5a6a80] mt-0.5 truncate">
                {medicalAlerts[0]?.mensagem || 'Confira os alertas dos seus documentos'}
              </div>
            </div>
            <Link
              href="/chat"
              className="text-[13px] font-bold text-[#1b3a60] hover:underline shrink-0"
            >
              Ver →
            </Link>
          </div>}

          {/* Alert 2 */}
          {reviewDocs.length > 0 && <div className="flex items-center gap-3.5 bg-[#fdf3d8] border border-[#e3b95a] rounded-[18px] p-4.5">
            <div className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={22} className="text-[#6b4208]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <b className="text-[15px] text-[#1d2a3d] block leading-tight">
                {reviewDocs.length} documento(s) para revisar
              </b>
              <div className="text-[13px] text-[#5a6a80] mt-0.5 truncate">
                {reviewDocs[0]?.titulo || 'Documento sem título'}
              </div>
            </div>
            <Link
              href="/documentos"
              className="text-[13px] font-bold text-[#1b3a60] hover:underline shrink-0"
            >
              Ver →
            </Link>
          </div>}

          {/* Alert 3 */}
          {processingDocs.length > 0 && <div className="flex items-center gap-3.5 bg-[#e5eefb] border border-[#b8cdee] rounded-[18px] p-4.5">
            <div className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center shrink-0 shadow-xs">
              <LoaderCircle size={22} className="text-[#1b3a60] animate-spin" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <b className="text-[15px] text-[#1d2a3d] block leading-tight">
                {processingDocs.length} em processamento
              </b>
              <div className="text-[13px] text-[#5a6a80] mt-0.5 truncate">
                {processingDocs[0]?.titulo || 'Documento'} · {processingDocs[0]?.progress ?? 0}%
              </div>
            </div>
            <Link
              href="/documentos"
              className="text-[13px] font-bold text-[#1b3a60] hover:underline shrink-0"
            >
              Ver →
            </Link>
          </div>}
        </div>

        {/* 4 KPI Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <div className="bg-white border border-[#dde3ec] rounded-[20px] p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="text-[13px] text-[#5a6a80] font-semibold">Documentos</div>
            <div className="text-3xl sm:text-[34px] font-extrabold tracking-[-0.03em] mt-1 text-[#1d2a3d]">
              {docs.length}
            </div>
          </div>

          <div className="bg-white border border-[#dde3ec] rounded-[20px] p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="text-[13px] text-[#5a6a80] font-semibold">Exames</div>
            <div className="text-3xl sm:text-[34px] font-extrabold tracking-[-0.03em] mt-1 text-[#1d2a3d]">
              {totalExams}
            </div>
          </div>

          <div className="bg-white border border-[#dde3ec] rounded-[20px] p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="text-[13px] text-[#5a6a80] font-semibold">Receitas</div>
            <div className="text-3xl sm:text-[34px] font-extrabold tracking-[-0.03em] mt-1 text-[#1d2a3d]">
              {totalPrescriptions}
            </div>
          </div>

          <div className="bg-white border border-[#dde3ec] rounded-[20px] p-5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            <div className="text-[13px] text-[#5a6a80] font-semibold">Medicamentos</div>
            <div className="text-3xl sm:text-[34px] font-extrabold tracking-[-0.03em] mt-1 text-[#1d2a3d]">
              {continuousMeds.length}
            </div>
          </div>
        </div>

        {/* Main Grid: 2 cols left, 1 col right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Recent Documents Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[#1b3a60]" />
                </div>
                <b className="text-base text-[#1d2a3d] flex-1">Documentos recentes</b>
                <Link
                  href="/documentos"
                  className="text-[13px] font-bold text-[#1b3a60] hover:underline"
                >
                  Ver todos
                </Link>
              </div>

              <div className="divide-y divide-[#dde3ec]">
                {displayRecentDocs.length === 0 ? (
                  <p className="py-5 text-sm text-[#5a6a80]">
                    Você ainda não adicionou documentos.
                  </p>
                ) : displayRecentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documentos/${doc.id}`}
                    className="flex items-center gap-3.5 py-3.5 hover:bg-slate-50/60 rounded-xl px-1 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-[14px] bg-[#f1f4f8] flex items-center justify-center shrink-0">
                      {doc.titulo.toLowerCase().includes('receita') ? (
                        <Pill size={22} className="text-[#1b3a60]" />
                      ) : (
                        <FileText size={22} className="text-[#1b3a60]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#1d2a3d] truncate">
                        {doc.titulo}
                      </div>
                      <div className="text-[13px] text-[#5a6a80]">
                        {doc.data}
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${doc.badgeClass}`}
                    >
                      {doc.badge}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Horizontal Charts Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Most Frequent Medications */}
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <Pill size={18} className="text-[#1b3a60]" />
                  </div>
                  <b className="text-base text-[#1d2a3d] flex-1">
                    Medicamentos mais frequentes
                  </b>
                </div>

                <div className="space-y-3">
                  {frequentMeds.length === 0 ? (
                    <p className="text-sm text-[#5a6a80]">Não há medicamentos registrados nos documentos.</p>
                  ) : frequentMeds.map((med) => (
                    <div key={med.nome}>
                      <div className="flex justify-between text-[13px] mb-1.5">
                        <span className="font-semibold text-[#1d2a3d]">{med.nome}</span>
                        <span className="text-[#5a6a80]">{med.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#f1f4f8] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1f7fe0]"
                          style={{ width: `${med.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Frequent Exams */}
              <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <Activity size={18} className="text-[#1b3a60]" />
                  </div>
                  <b className="text-base text-[#1d2a3d] flex-1">
                    Exames mais frequentes
                  </b>
                </div>

                <div className="space-y-3">
                  {frequentExams.length === 0 ? (
                    <p className="text-sm text-[#5a6a80]">Não há resultados de exames registrados nos documentos.</p>
                  ) : frequentExams.map((exam) => (
                    <div key={exam.nome}>
                      <div className="flex justify-between text-[13px] mb-1.5">
                        <span className="font-semibold text-[#1d2a3d]">{exam.nome}</span>
                        <span className="text-[#5a6a80]">{exam.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#f1f4f8] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1f7fe0]"
                          style={{ width: `${exam.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* CARTEIRINHA DE SAÚDE */}
            <div className="bg-gradient-to-br from-[#1b3a60] to-[#24507f] text-white rounded-[24px] p-6 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center text-xs tracking-[0.14em] font-bold text-[#9fc3ea]">
                <span>MEU PERFIL</span>
                <span className="opacity-80">DIGITAL</span>
              </div>

              <div className="text-2xl font-extrabold mt-3.5 mb-0.5 tracking-[-0.03em]">
                {fullName}
              </div>
              <div className="text-[13px] text-[#c9d6e8]">
                Nascimento {birthDateFormatted}{age !== null ? ` · ${age} anos` : ''}
              </div>
              <div className="mt-2 text-[13px] text-white">
                <span className="font-bold">Plano:</span> {healthPlan || 'Não cadastrado'}
                <span className="mx-1.5 text-[#9fc3ea]">·</span>
                <span className="font-bold">Carteirinha:</span> {insuranceCardNumber || 'Não informada'}
              </div>

              <div className="flex gap-2.5 mt-5">
                <div className="flex-1 bg-white/10 rounded-[14px] p-3 backdrop-blur-xs">
                  <div className="text-[11px] text-[#9fc3ea] font-bold tracking-wider">
                    TIPO SANGUÍNEO
                  </div>
                  <div className="text-2xl font-extrabold mt-0.5">{bloodType}</div>
                </div>

                <div className="flex-[2] bg-white/10 rounded-[14px] p-3 backdrop-blur-xs">
                  <div className="text-[11px] text-[#9fc3ea] font-bold tracking-wider">
                    ALERGIAS
                  </div>
                  <div className="text-sm font-bold mt-1 truncate">
                    {allergiesDisplay}
                  </div>
                </div>
              </div>

              <div className="mt-3.5 text-[13px] text-[#c9d6e8]">
                Condições: {conditionsDisplay} · Medicamentos contínuos: {continuousMeds.length}
              </div>

              <button
                onClick={() => setIsCarteirinhaOpen(true)}
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Maximize2 size={13} /> Ver dados completos do perfil
              </button>
              <Link
                href="/perfil"
                className="mt-2 block text-center text-xs font-bold text-[#c9d6e8] underline-offset-2 hover:text-white hover:underline"
              >
                Editar meu perfil
              </Link>
            </div>

            {/* Quick Emergency Card */}
            <Link
              href="/emergencia"
              className="bg-white border border-[#f0b8b2] rounded-[20px] p-4.5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] hover:border-[#a13a30] transition-colors block"
            >
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-[#fde8e6] flex items-center justify-center shrink-0">
                  <Shield size={22} className="text-[#a13a30]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <b className="text-[15px] text-[#1d2a3d] block leading-tight">
                    Ficha de emergência
                  </b>
                  <div className="text-[13px] text-[#5a6a80] mt-0.5">
                    Acesso rápido a contatos e alergias
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#a13a30]" />
              </div>
            </Link>

          </div>
        </div>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="m-0 text-2xl font-extrabold text-[#1b3a60]">Análise do histórico</h2>
            <p className="mb-0 mt-1 text-sm text-[#5a6a80]">Relatórios, tendências de exames e consultas a referências clínicas.</p>
          </div>
          <Suspense fallback={<div className="py-8 text-center text-sm text-[#5a6a80]">Carregando análise…</div>}>
            <Insights embedded />
          </Suspense>
        </section>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Informações organizadas com segurança para o seu acompanhamento contínuo.
        </p>
      </main>

      {/* Carteirinha Modal Dialog */}
      <DialogPrimitive.Root open={isCarteirinhaOpen} onOpenChange={setIsCarteirinhaOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#dde3ec] outline-none">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-bold tracking-widest text-[#1f7fe0] uppercase">
                Carteirinha de Saúde
              </div>
              <DialogPrimitive.Close className="p-1 rounded-lg text-[#5a6a80] hover:bg-slate-100 transition-colors">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>

            <div className="bg-gradient-to-br from-[#1b3a60] to-[#24507f] text-white rounded-2xl p-6 shadow-md mb-4">
              <div className="text-xs tracking-wider text-[#9fc3ea] font-bold">
                SAÚDEMÉMORA · IDENTIFICAÇÃO PESSOAL
              </div>
              <div className="text-2xl font-black mt-2">{fullName}</div>
              <div className="text-xs text-[#c9d6e8] mt-1">
                Nascimento: {birthDateFormatted}{age !== null ? ` · Idade: ${age} anos` : ''}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-[10px] text-[#9fc3ea] font-bold">TIPO SANGUÍNEO</div>
                  <div className="text-xl font-black">{bloodType}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-[10px] text-[#9fc3ea] font-bold">DOADOR DE ÓRGÃOS</div>
                  <div className="text-sm font-bold mt-1">
                    {ficha.doadorOrgaos ? 'Sim, doador' : 'Não informado'}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-xs text-[#c9d6e8]">
                <div><strong className="text-white">Alergias:</strong> {allergiesDisplay}</div>
                <div><strong className="text-white">Condições:</strong> {conditionsDisplay}</div>
                <div><strong className="text-white">Remédios contínuos:</strong> {continuousMeds.join(', ') || 'Nenhum'}</div>
                <div><strong className="text-white">Plano de saúde:</strong> {healthPlan || 'Não cadastrado'}</div>
                <div><strong className="text-white">Número da carteirinha:</strong> {insuranceCardNumber || 'Não informado'}</div>
              </div>
            </div>

            {registeredCardUrl && (
              <div className="mb-4 overflow-hidden rounded-xl border border-[#dde3ec] bg-[#f7f9fc]">
                {/\.pdf(?:[?#]|$)/i.test(registeredCardUrl) ? (
                  <a
                    href={registeredCardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-14 items-center gap-2 px-4 text-sm font-semibold text-[#1b3a60] hover:bg-[#f1f4f8]"
                  >
                    <FileText size={18} />
                    Abrir carteirinha cadastrada
                  </a>
                ) : (
                  <a href={registeredCardUrl} target="_blank" rel="noreferrer" aria-label="Abrir carteirinha de plano cadastrada">
                    <img
                      src={registeredCardUrl}
                      alt="Carteirinha do plano de saúde cadastrada"
                      className="max-h-56 w-full object-contain"
                    />
                  </a>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Link
                href="/emergencia"
                onClick={() => setIsCarteirinhaOpen(false)}
                className="flex-1 py-3 bg-[#fff5f4] border border-[#f0b8b2] text-[#a13a30] text-center font-bold text-sm rounded-xl hover:bg-[#fde8e6] transition-colors"
              >
                Abrir ficha completa
              </Link>
              <button
                onClick={() => setIsCarteirinhaOpen(false)}
                className="px-4 py-3 bg-[#f1f4f8] text-[#1b3a60] font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
