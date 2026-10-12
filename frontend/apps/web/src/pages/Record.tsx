import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Check,
  Plus,
  X,
  Pill,
  Shield,
  LoaderCircle,
  ArrowRight,
  ArrowLeft,
  Heart,
  Save,
} from 'lucide-react';
import {
  useGetApiFichaMedicaMe,
  usePatchApiFichaMedicaMe,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const STEPS = [
  { id: 1, name: 'Dados gerais' },
  { id: 2, name: 'Condições' },
  { id: 3, name: 'Alergias e remédios' },
  { id: 4, name: 'Hábitos' },
  { id: 5, name: 'Revisão' },
];

export default function Record() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: fichaRaw, refetch } = useGetApiFichaMedicaMe();
  const patchFicha = usePatchApiFichaMedicaMe();

  const [currentStep, setCurrentStep] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('Salvo automaticamente');

  // Form State
  const [bloodType, setBloodType] = useState('O+');
  const [allergies, setAllergies] = useState<string[]>(['Dipirona', 'Penicilina']);
  const [allergyInput, setAllergyInput] = useState('');

  const [medications, setMedications] = useState<Array<{ nome: string; posologia: string }>>([
    { nome: 'Losartana 50 mg', posologia: '1 vez ao dia' },
    { nome: 'Vitamina D', posologia: '1 vez por semana' },
  ]);
  const [newMedNome, setNewMedNome] = useState('');
  const [newMedPosologia, setNewMedPosologia] = useState('');
  const [isAddingMed, setIsAddingMed] = useState(false);

  const [isDonor, setIsDonor] = useState(true);
  const [isSmoker, setIsSmoker] = useState(false);
  const [isAlcohol, setIsAlcohol] = useState(false);

  // Conditions
  const [conditionsList, setConditionsList] = useState<Array<{ nome: string; tem: boolean }>>([
    { nome: 'Hipertensão arterial', tem: true },
    { nome: 'Diabetes Mellitus', tem: false },
    { nome: 'Asma / Bronquite', tem: false },
    { nome: 'Doença cardíaca', tem: false },
    { nome: 'Colesterol alto', tem: false },
  ]);

  // General data
  const [altura, setAltura] = useState('1.68');
  const [peso, setPeso] = useState('65');
  const [habitosGerais, setHabitosGerais] = useState('Caminhada 3x por semana, 7h de sono.');
  const [historicoFamiliar, setHistoricoFamiliar] = useState('Hipertensão materna.');

  // Load from API
  useEffect(() => {
    if (fichaRaw) {
      const f = fichaRaw as any;
      if (f.tipoSanguineo) setBloodType(f.tipoSanguineo);
      if (Array.isArray(f.alergias) && f.alergias.length > 0) setAllergies(f.alergias);
      if (f.doadorOrgaos !== undefined) setIsDonor(Boolean(f.doadorOrgaos));
      if (f.fuma !== undefined) setIsSmoker(Boolean(f.fuma));
      if (f.bebe !== undefined) setIsAlcohol(Boolean(f.bebe));
      if (f.habitosGerais) setHabitosGerais(f.habitosGerais);
      if (f.historicoFamiliar) setHistoricoFamiliar(f.historicoFamiliar);
      if (Array.isArray(f.medicamentosContinuos) && f.medicamentosContinuos.length > 0) {
        setMedications(
          f.medicamentosContinuos.map((m: any) =>
            typeof m === 'string' ? { nome: m, posologia: 'Uso contínuo' } : m
          )
        );
      }
    }
  }, [fichaRaw]);

  // Handle add allergy
  const handleAddAllergy = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allergyInput.trim()) {
      e.preventDefault();
      const val = allergyInput.trim();
      if (!allergies.includes(val)) {
        setAllergies([...allergies, val]);
      }
      setAllergyInput('');
    }
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const handleAddMed = () => {
    if (newMedNome.trim()) {
      setMedications([
        ...medications,
        { nome: newMedNome.trim(), posologia: newMedPosologia.trim() || 'Uso contínuo' },
      ]);
      setNewMedNome('');
      setNewMedPosologia('');
      setIsAddingMed(false);
    }
  };

  const handleSaveToApi = async () => {
    try {
      setIsSaving(true);
      await patchFicha.mutateAsync({
        data: {
          tipoSanguineo: bloodType as any,
          alergias: allergies,
          medicamentosContinuos: medications.map((m) => m.nome),
          doadorOrgaos: isDonor,
          fuma: isSmoker,
          bebe: isAlcohol,
          habitosGerais,
          historicoFamiliar,
          condicoes: conditionsList,
        } as any,
      });
      setLastSavedText('Salvo agora');
      toast({ title: 'Anamnese atualizada com sucesso!' });
      refetch();
    } catch {
      toast({ title: 'Erro ao salvar alterações', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSaveToApi();
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({ title: 'Anamnese concluída com sucesso!' });
      setLocation('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercent = Math.round((currentStep / 5) * 100);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#2f7a70]">
              Ficha de saúde
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Anamnese
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              Responda no seu ritmo: o progresso é salvo a cada passo.
            </p>
          </div>
        </div>

        {/* Stepper Header Bar */}
        <div className="bg-white border border-[#dde3ec] rounded-[20px] p-5.5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] mb-5 overflow-x-auto">
          <div className="flex gap-4 items-center min-w-[600px]">
            {STEPS.map((s, idx) => {
              const isPassed = s.id < currentStep;
              const isCurrent = s.id === currentStep;

              return (
                <div key={s.id} className="flex-1 flex items-center gap-2.5">
                  <div
                    onClick={() => setCurrentStep(s.id)}
                    className={`w-[34px] h-[34px] rounded-full font-bold flex items-center justify-center text-sm shrink-0 cursor-pointer transition-colors ${
                      isPassed
                        ? 'bg-[#2f7a70] text-white border border-[#2f7a70]'
                        : isCurrent
                        ? 'bg-[#1b3a60] text-white border border-[#1b3a60]'
                        : 'bg-white text-[#5a6a80] border border-[#dde3ec]'
                    }`}
                  >
                    {isPassed ? <Check size={16} strokeWidth={2.5} /> : s.id}
                  </div>
                  <span
                    className={`text-sm whitespace-nowrap ${
                      isCurrent
                        ? 'font-bold text-[#1d2a3d]'
                        : isPassed
                        ? 'font-medium text-[#1d2a3d]'
                        : 'font-medium text-[#5a6a80]'
                    }`}
                  >
                    {s.name}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] transition-colors ${
                        isPassed ? 'bg-[#2f7a70]' : 'bg-[#dde3ec]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main 2-col Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Content Card (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#dde3ec] rounded-[20px] p-8 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
            {/* Step 1: Dados gerais */}
            {currentStep === 1 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#2f7a70] uppercase">
                  Passo 1 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#1b3a60]">
                  Dados gerais de saúde
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Dados corporais e medidas básicas para acompanhamento médico.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-[#1d2a3d] mb-1.5">
                      Altura (metros)
                    </label>
                    <input
                      type="text"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="Ex: 1.70"
                      className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1d2a3d] mb-1.5">
                      Peso aproximado (kg)
                    </label>
                    <input
                      type="text"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="Ex: 70"
                      className="w-full h-[46px] px-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Condições */}
            {currentStep === 2 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#2f7a70] uppercase">
                  Passo 2 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#1b3a60]">
                  Condições de saúde
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Selecione as condições preexistentes diagnosticadas por um médico.
                </p>

                <div className="space-y-3 mb-6">
                  {conditionsList.map((cond, idx) => (
                    <label
                      key={cond.nome}
                      className="flex items-center gap-3 p-3.5 border border-[#dde3ec] rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={cond.tem}
                        onChange={(e) => {
                          const updated = [...conditionsList];
                          updated[idx].tem = e.target.checked;
                          setConditionsList(updated);
                        }}
                        className="w-4 h-4 rounded text-[#2f7a70] focus:ring-[#2f7a70]"
                      />
                      <span className="text-sm font-semibold text-[#1d2a3d]">
                        {cond.nome}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Alergias e remédios */}
            {currentStep === 3 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#2f7a70] uppercase">
                  Passo 3 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#1b3a60]">
                  Alergias e medicamentos
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Essas informações ajudam a alertar interações nas suas receitas.
                </p>

                {/* Tipo Sanguíneo */}
                <div className="text-sm font-bold mb-2.5">Tipo sanguíneo</div>
                <div className="flex gap-2 flex-wrap mb-6.5">
                  {BLOOD_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBloodType(type)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors ${
                        bloodType === type
                          ? 'bg-[#1b3a60] text-white border border-[#1b3a60] shadow-xs'
                          : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Alergias */}
                <div className="text-sm font-bold mb-2.5">Alergias</div>
                <div className="h-[46px] w-full border border-[#c6cfdb] rounded-xl bg-white flex items-center gap-2 px-3.5 text-sm text-[#5a6a80] focus-within:border-[#1b3a60]">
                  <Plus size={16} className="text-[#5a6a80]" />
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={handleAddAllergy}
                    placeholder="Digite e pressione Enter"
                    className="w-full bg-transparent border-none outline-none text-[#1d2a3d] placeholder:text-[#5a6a80] text-sm"
                  />
                </div>

                {/* Tag Pills */}
                <div className="flex gap-2 flex-wrap my-3 mb-6.5">
                  {allergies.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#fdf3d8] text-[#6b4208] text-sm font-semibold"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeAllergy(item)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Medicamentos contínuos */}
                <div className="flex justify-between items-center mb-2.5">
                  <div className="text-sm font-bold">Medicamentos de uso contínuo</div>
                  <button
                    type="button"
                    onClick={() => setIsAddingMed(true)}
                    className="text-xs font-bold text-[#1b3a60] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                {isAddingMed && (
                  <div className="p-4 bg-slate-50 border border-[#dde3ec] rounded-xl mb-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Nome do remédio (Ex: Losartana 50mg)"
                      value={newMedNome}
                      onChange={(e) => setNewMedNome(e.target.value)}
                      className="w-full h-10 px-3 border border-[#c6cfdb] rounded-lg text-sm bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Posologia (Ex: 1 comprimido ao dia)"
                      value={newMedPosologia}
                      onChange={(e) => setNewMedPosologia(e.target.value)}
                      className="w-full h-10 px-3 border border-[#c6cfdb] rounded-lg text-sm bg-white"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingMed(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#5a6a80] hover:bg-slate-200 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMed}
                        className="px-3 py-1.5 text-xs font-bold bg-[#1b3a60] text-white rounded-lg hover:bg-[#24507f]"
                      >
                        Salvar remédio
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-[#dde3ec] mb-4">
                  {medications.map((med, index) => (
                    <div key={index} className="flex items-center gap-3.5 py-3.5">
                      <div className="w-11 h-11 rounded-[14px] bg-[#f1f4f8] flex items-center justify-center shrink-0">
                        <Pill size={22} className="text-[#1b3a60]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-[#1d2a3d]">{med.nome}</div>
                        <div className="text-[13px] text-[#5a6a80]">{med.posologia}</div>
                      </div>
                      <span className="inline-block px-2.5 py-1 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold whitespace-nowrap">
                        Contínuo
                      </span>
                    </div>
                  ))}
                </div>

                {/* Switches */}
                <div className="divide-y divide-[#dde3ec]">
                  <div className="flex justify-between items-center py-3.5 text-[15px] font-semibold">
                    <span>Doador de órgãos</span>
                    <button
                      type="button"
                      onClick={() => setIsDonor(!isDonor)}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                        isDonor ? 'bg-[#2f7a70]' : 'bg-[#c6cfdb]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all shadow-xs ${
                          isDonor ? 'right-[3px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-3.5 text-[15px] font-semibold">
                    <span>Fumante</span>
                    <button
                      type="button"
                      onClick={() => setIsSmoker(!isSmoker)}
                      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                        isSmoker ? 'bg-[#2f7a70]' : 'bg-[#c6cfdb]'
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all shadow-xs ${
                          isSmoker ? 'right-[3px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Hábitos */}
            {currentStep === 4 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#2f7a70] uppercase">
                  Passo 4 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#1b3a60]">
                  Hábitos e rotina
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Atividade física, sono e histórico relevante na família.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-[#1d2a3d] mb-1.5">
                      Hábitos gerais (Sono, alimentação, atividade física)
                    </label>
                    <textarea
                      rows={3}
                      value={habitosGerais}
                      onChange={(e) => setHabitosGerais(e.target.value)}
                      className="w-full p-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1d2a3d] mb-1.5">
                      Histórico familiar de saúde
                    </label>
                    <textarea
                      rows={2}
                      value={historicoFamiliar}
                      onChange={(e) => setHistoricoFamiliar(e.target.value)}
                      placeholder="Ex: Diabetes paterno, Hipertensão materna"
                      className="w-full p-3.5 border border-[#c6cfdb] rounded-xl outline-none text-sm text-[#1d2a3d] focus:border-[#1b3a60]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Revisão */}
            {currentStep === 5 && (
              <div>
                <div className="text-xs font-bold tracking-[0.14em] text-[#2f7a70] uppercase">
                  Passo 5 de 5
                </div>
                <h2 className="mt-1.5 mb-1 text-2xl font-bold tracking-[-0.03em] text-[#1b3a60]">
                  Revisão da Anamnese
                </h2>
                <p className="m-0 mb-6 text-[#5a6a80] text-sm">
                  Confira o resumo das suas informações de saúde antes de finalizar.
                </p>

                <div className="space-y-3 bg-[#f7f9fc] p-5 rounded-2xl border border-[#dde3ec] mb-6 text-sm">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Tipo Sanguíneo:</span>
                    <strong className="text-[#1b3a60]">{bloodType}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Alergias:</span>
                    <strong>{allergies.join(', ') || 'Nenhuma'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Remédios contínuos:</span>
                    <strong>{medications.map((m) => m.nome).join(', ') || 'Nenhum'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[#5a6a80]">Doador de órgãos:</span>
                    <strong>{isDonor ? 'Sim' : 'Não'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a6a80]">Fumante:</span>
                    <strong>{isSmoker ? 'Sim' : 'Não'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions: Voltar / Continuar */}
            <div className="flex justify-between items-center mt-6.5 pt-4 border-t border-[#dde3ec]">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-white text-[#1d2a3d] border border-[#dde3ec] hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Voltar
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1b3a60] text-white hover:bg-[#24507f] transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : currentStep === 5 ? (
                  'Concluir Anamnese'
                ) : (
                  'Continuar →'
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Progress & Auto-save Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Progress Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex justify-between font-bold text-sm">
                <span>Progresso</span>
                <span className="text-[#2f7a70]">{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#f1f4f8] my-2.5 mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2f7a70] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-1">
                {STEPS.map((s) => {
                  const isDone = s.id < currentStep;
                  const isCurrent = s.id === currentStep;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setCurrentStep(s.id)}
                      className={`flex gap-2.5 items-center py-2 text-sm cursor-pointer rounded-lg px-1 transition-colors ${
                        isCurrent
                          ? 'font-bold text-[#1d2a3d]'
                          : isDone
                          ? 'font-medium text-[#1d2a3d]'
                          : 'font-medium text-[#5a6a80]'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-[#e8f4f2] text-[#2f7a70]'
                            : isCurrent
                            ? 'bg-[#1b3a60] text-white'
                            : 'bg-[#f1f4f8] text-[#5a6a80]'
                        }`}
                      >
                        {isDone ? (
                          <Check size={14} strokeWidth={2.5} />
                        ) : (
                          <span className="text-xs">{s.id}</span>
                        )}
                      </div>
                      {s.name}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-save Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-4.5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-[14px] bg-[#e8f4f2] flex items-center justify-center shrink-0">
                  <Shield size={22} className="text-[#2f7a70]" strokeWidth={2} />
                </div>
                <div>
                  <b className="text-[15px] text-[#1d2a3d] block leading-tight">
                    {lastSavedText}
                  </b>
                  <div className="text-[13px] text-[#5a6a80] mt-0.5">
                    Seus dados são protegidos por criptografia.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Tela de design com dados de exemplo.
        </p>
      </main>
    </div>
  );
}
