import { useEffect, useState } from "react";
import { customFetch } from "@workspace/api-client-react";
import {
  Activity,
  AlertTriangle,
  Droplets,
  Pill,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { LourdesHeartMark } from "@/components/LourdesHeartMark";

type EmergencyProfile = {
  nome?: string | null;
  tipoSanguineo?: string | null;
  contatosEmergencia?: string | null;
  alergias?: string[] | null;
  doencasCronicas?: string[] | null;
  medicamentosContinuos?: string[] | null;
};

function getRecordedItems(items?: string[] | null) {
  return items?.filter((item) => item.trim().length > 0) ?? [];
}

export default function Emergencia({ token }: { token?: string }) {
  const [publicData, setPublicData] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!token) {
          if (isMounted) setError("Link de emergência inválido ou expirado.");
          return;
        }

        const res = await customFetch<EmergencyProfile>(
          `/api/emergencia/${token}`,
        );
        if (isMounted) setPublicData(res);
      } catch {
        if (isMounted)
          setError("Não foi possível carregar este perfil de emergência.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4">
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-4 text-sm font-medium text-muted-foreground shadow-sm"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Carregando perfil de emergência...
        </div>
      </main>
    );
  }

  if (error || !publicData) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4">
        <div
          role="alert"
          className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl shadow-red-950/5"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Perfil indisponível
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error ?? "Não foi possível encontrar este perfil de emergência."}
          </p>
        </div>
      </main>
    );
  }

  const allergies = getRecordedItems(publicData.alergias);
  const chronicConditions = getRecordedItems(publicData.doencasCronicas);
  const medications = getRecordedItems(publicData.medicamentosContinuos);
  const bloodType = publicData.tipoSanguineo?.trim();
  const emergencyContact = publicData.contatosEmergencia?.trim();

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-5 flex items-center justify-center gap-2">
          <LourdesHeartMark className="h-7 w-7" />
          <span className="text-sm font-extrabold tracking-tight text-foreground">
            saúde<span className="text-accent">memora</span>
          </span>
        </div>

        <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-34px_rgba(21,50,84,0.35)]">
          <header className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-red-600 to-red-700 px-6 py-7 text-white sm:px-8 sm:py-8">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[30px] border-white/[0.07]" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <ShieldAlert size={26} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-100">
                  Informações de saúde
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Perfil de emergência
                </h1>
                <p className="mt-2 text-sm leading-5 text-rose-50">
                  Acesso rápido para auxiliar no atendimento médico.
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 sm:space-y-7 sm:p-8">
            <section aria-labelledby="patient-name">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Paciente
              </p>
              <h2
                id="patient-name"
                className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
              >
                {publicData.nome?.trim() || "Nome não informado"}
              </h2>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <section
                className="flex min-h-28 items-center gap-4 rounded-2xl border border-red-100 bg-red-50/80 p-4 sm:p-5"
                aria-label="Tipo sanguíneo"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                  <Droplets size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-red-800/65">
                    Tipo sanguíneo
                  </p>
                  <p className="mt-0.5 break-words text-2xl font-black leading-tight text-red-800">
                    {bloodType || "Não informado"}
                  </p>
                </div>
              </section>

              <section
                className="flex min-h-28 items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:p-5"
                aria-label="Contato de emergência"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <Smartphone size={21} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-blue-900/60">
                    Contato de emergência
                  </p>
                  <p className="mt-1 break-words text-sm font-bold leading-5 text-blue-900">
                    {emergencyContact || "Não informado"}
                  </p>
                </div>
              </section>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80">
              <section className="flex gap-3 p-4 sm:p-5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Alergias</h3>
                  {allergies.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {allergies.map((allergy, index) => (
                        <li
                          key={`${allergy}-${index}`}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-900"
                        >
                          {allergy}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nenhuma informação registrada
                    </p>
                  )}
                </div>
              </section>

              <section className="flex gap-3 p-4 sm:p-5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Activity size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Doenças crônicas
                  </h3>
                  {chronicConditions.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {chronicConditions.map((condition, index) => (
                        <li
                          key={`${condition}-${index}`}
                          className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-sm font-semibold text-violet-900"
                        >
                          {condition}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nenhuma informação registrada
                    </p>
                  )}
                </div>
              </section>

              <section className="flex gap-3 p-4 sm:p-5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Pill size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Medicamentos de uso contínuo
                  </h3>
                  {medications.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {medications.map((medication, index) => (
                        <li
                          key={`${medication}-${index}`}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-900"
                        >
                          {medication}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nenhuma informação registrada
                    </p>
                  )}
                </div>
              </section>
            </div>

            <p className="text-center text-[11px] leading-5 text-muted-foreground">
              Informações fornecidas pelo paciente. Confirme os dados durante o
              atendimento.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
