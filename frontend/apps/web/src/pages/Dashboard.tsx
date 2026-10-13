import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  FileText,
  Pill,
  Plus,
  Shield,
  ArrowRight,
  Activity,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  useGetApiPacientesMe,
  useGetApiDocuments,
  useGetApiFichaMedicaMe,
} from '@workspace/api-client-react';
import { triggerUploadModal } from '@/components/UploadModal';
import { triggerEmergencyModal } from '@/lib/emergency-modal';

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
  const [cardZoom, setCardZoom] = useState(1);

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
      <div className="mx-auto w-full max-w-[1240px] space-y-5 px-5 pb-16 pt-9 sm:px-10" aria-busy="true" aria-label="Carregando visão geral">
        <div className="space-y-2"><div className="animate-shimmer h-3 w-32 rounded-lg" /><div className="animate-shimmer h-9 w-56 max-w-full rounded-lg" /><div className="animate-shimmer h-4 w-72 max-w-full rounded-lg" /></div>
        <div className="grid gap-5 lg:grid-cols-3"><div className="animate-shimmer h-72 rounded-[24px] lg:col-span-2" /><div className="animate-shimmer h-24 rounded-[20px]" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="animate-shimmer h-52 rounded-[20px]" /><div className="animate-shimmer h-52 rounded-[20px]" /></div>
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
            <button
              onClick={() => triggerUploadModal()}
              className="min-h-[44px] flex-1 rounded-xl bg-[#1b3a60] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#24507f] sm:flex-none sm:px-5"
            >
              <span className="inline-flex items-center gap-2"><Plus size={16} strokeWidth={2.5} />Adicionar documento</span>
            </button>
          </div>
        </div>

          {/* Meu perfil e ficha de emergência */}
          <div className="mb-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
            {/* CARTEIRINHA DE SAÚDE */}
            <button
              type="button"
              onClick={() => setIsCarteirinhaOpen(true)}
              aria-label="Abrir carteirinha de saúde em tela inteira"
              className="block w-full cursor-zoom-in bg-gradient-to-br from-[#1b3a60] to-[#24507f] text-left text-white rounded-[24px] p-6 shadow-md relative overflow-hidden transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7fe0] lg:col-span-2"
            >
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
              <div className="mt-2 text-[13px] text-[#c9d6e8]">
                <span className="font-bold text-white">Sexo:</span> {user.sexo || user.sexoBiologico || 'Não informado'}
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
                Condições: {conditionsDisplay}
              </div>
              <div className="mt-4 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9fc3ea]">Medicamentos contínuos</div>
                  <div className="mt-1 break-words text-sm font-semibold text-white">{continuousMeds.join(' · ') || 'Não informado'}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9fc3ea]">Cirurgias anteriores</div>
                  <div className="mt-1 break-words text-sm font-semibold text-white">{ficha.cirurgias?.trim() || 'Não informado'}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9fc3ea]">Contato de emergência</div>
                  <div className="mt-1 break-words text-sm font-semibold text-white">{user.contatoEmergencia?.trim() || 'Não informado'}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2 text-xs font-bold text-white">
                Toque para ampliar a carteirinha
              </div>
            </button>

            {/* Quick Emergency Card */}
            <button
              type="button"
              onClick={triggerEmergencyModal}
              className="block w-full border border-[#f0b8b2] bg-white p-4.5 text-left rounded-[20px] shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] hover:border-[#a13a30] transition-colors"
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
            </button>

          </div>


        {/* Documentos e tendências */}
        <div className="grid grid-cols-1 items-start gap-5">
          <div className="flex flex-col gap-5">
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

        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Informações organizadas com segurança para o seu acompanhamento contínuo.
        </p>
      </main>

      {/* Carteirinha Modal Dialog */}
      <DialogPrimitive.Root open={isCarteirinhaOpen} onOpenChange={setIsCarteirinhaOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#f7f9fc] p-3 outline-none sm:p-6">
            <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[#dde3ec] bg-white px-2 py-3 sm:px-4">
              <DialogPrimitive.Title className="text-sm font-bold tracking-wide text-[#1b3a60] sm:text-base">
                Carteirinha de Saúde
              </DialogPrimitive.Title>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Diminuir zoom" onClick={() => setCardZoom((zoom) => Math.max(0.75, Number((zoom - 0.15).toFixed(2))))} disabled={cardZoom <= 0.75} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1b3a60] hover:bg-[#f1f4f8] disabled:opacity-40">
                  <ZoomOut size={19} />
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-[#5a6a80]">{Math.round(cardZoom * 100)}%</span>
                <button type="button" aria-label="Aumentar zoom" onClick={() => setCardZoom((zoom) => Math.min(1.6, Number((zoom + 0.15).toFixed(2))))} disabled={cardZoom >= 1.6} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1b3a60] hover:bg-[#f1f4f8] disabled:opacity-40">
                  <ZoomIn size={19} />
                </button>
                <DialogPrimitive.Close aria-label="Fechar carteirinha" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5a6a80] hover:bg-slate-100 transition-colors">
                <X size={18} />
                </DialogPrimitive.Close>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-1 sm:p-4">
              <div style={{ zoom: cardZoom }} className="mx-auto max-w-3xl">
            <div className="bg-gradient-to-br from-[#1b3a60] to-[#24507f] text-white rounded-2xl p-6 shadow-md mb-4">
              <div className="text-xs tracking-wider text-[#9fc3ea] font-bold">
                SAÚDEMÉMORA · IDENTIFICAÇÃO PESSOAL
              </div>
              <div className="text-2xl font-black mt-2">{fullName}</div>
              <div className="text-xs text-[#c9d6e8] mt-1">
                Nascimento: {birthDateFormatted}{age !== null ? ` · Idade: ${age} anos` : ''}
              </div>
              <div className="mt-2 text-sm text-white"><strong>Sexo:</strong> {user.sexo || user.sexoBiologico || 'Não informado'}</div>

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
                <div><strong className="text-white">Cirurgias:</strong> {ficha.cirurgias?.trim() || 'Não informado'}</div>
                <div><strong className="text-white">Contato de emergência:</strong> {user.contatoEmergencia?.trim() || 'Não informado'}</div>
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
                  <img
                    src={registeredCardUrl}
                    alt="Carteirinha do plano de saúde cadastrada"
                    className="max-h-[70vh] w-full object-contain"
                  />
                )}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-[#dde3ec] bg-white p-4 text-sm text-[#33445d]">
              <strong>Histórico familiar:</strong> {ficha.historicoFamiliar?.trim() || 'Não informado'}
            </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
