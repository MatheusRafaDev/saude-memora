import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  Activity,
  FlaskConical,
  CalendarDays,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  useGetApiExamesAnalitos,
  useGetApiExamesSerie,
} from "@workspace/api-client-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

export default function Evolucao() {
  const [analito, setAnalito] = useState<string>("");
  const [meses, setMeses] = useState<string>("12");

  const { data: analitosRaw, isLoading: loadingAnalitos } =
    useGetApiExamesAnalitos();
  const analitos = (analitosRaw as unknown as any[]) || [];

  useEffect(() => {
    if (analitos.length > 0 && !analito) {
      setAnalito(analitos[0].nomeNormalizado);
    }
  }, [analitos, analito]);

  const { data: serieRaw, isLoading: loadingSerie } = useGetApiExamesSerie(
    { analito, meses: parseInt(meses) },
    // @ts-ignore
    { query: { enabled: !!analito } },
  );

  const serie = (serieRaw as unknown as any[]) || [];

  const firstWithRefs = serie.find(
    (s) =>
      s.refMin !== null &&
      s.refMin !== undefined &&
      s.refMax !== null &&
      s.refMax !== undefined,
  );
  const globalRefMin = firstWithRefs?.refMin;
  const globalRefMax = firstWithRefs?.refMax;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOut =
        data.refMin !== undefined &&
        data.refMax !== undefined &&
        (data.valor < data.refMin || data.valor > data.refMax);

      return (
        <div className="bg-card border border-border/50 p-4 rounded-xl shadow-lg w-56 flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground uppercase">
            {label}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${isOut ? "text-destructive" : "text-primary"}`}
            >
              {data.valor}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {data.unidade}
            </span>
          </div>
          {data.refMin !== undefined && data.refMax !== undefined && (
            <p className="text-[11px] text-muted-foreground">
              Referência: {data.refMin} a {data.refMax} {data.unidade}
            </p>
          )}
          <div className="mt-2 pt-2 border-t border-border/50">
            <Link
              href={`/documentos/${data.documentoId}`}
              className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              Ver documento original <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      );
    }
    return null;
  };

  const selectedAnalitoObj = analitos.find(
    (a) => a.nomeNormalizado === analito,
  );

  if (loadingAnalitos) {
    return (
      <div className="page-enter p-12 text-center text-muted-foreground animate-pulse">
        Carregando analitos...
      </div>
    );
  }

  if (analitos.length === 0) {
    return null;
  }

  return (
    <div className="page-enter space-y-7 w-full max-w-5xl mx-auto pt-8 mt-8 border-t border-border/50">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">
            Análise Clínica
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">
            Evolução
          </h1>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card border border-border/60 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FlaskConical size={20} />
          </div>
          <div className="w-full">
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
              Marcador (Analito)
            </label>
            <Select value={analito} onValueChange={setAnalito}>
              <SelectTrigger className="w-full md:w-[250px] font-bold border-border/60 bg-muted/20 focus:ring-0">
                <SelectValue placeholder="Selecione um exame" />
              </SelectTrigger>
              <SelectContent>
                {analitos.map((a: any) => (
                  <SelectItem
                    key={a.nomeNormalizado}
                    value={a.nomeNormalizado}
                    className="font-medium cursor-pointer"
                  >
                    {a.nome} ({a.count}x)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full md:w-auto flex items-center gap-4">
          <div className="flex h-12 w-12 md:hidden shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <CalendarDays size={20} />
          </div>
          <div className="w-full md:w-auto">
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
              Período
            </label>
            <Select value={meses} onValueChange={setMeses}>
              <SelectTrigger className="w-full md:w-[150px] font-bold border-border/60 bg-muted/20 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6" className="font-medium cursor-pointer">
                  Últimos 6 meses
                </SelectItem>
                <SelectItem value="12" className="font-medium cursor-pointer">
                  Últimos 12 meses
                </SelectItem>
                <SelectItem value="24" className="font-medium cursor-pointer">
                  Últimos 24 meses
                </SelectItem>
                <SelectItem value="60" className="font-medium cursor-pointer">
                  Últimos 5 anos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {selectedAnalitoObj?.nome || "Exame"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Visão temporal dos seus resultados
            </p>
          </div>
          {globalRefMin !== undefined && globalRefMax !== undefined && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs text-blue-700 dark:text-blue-400 font-semibold">
              <Info size={14} />
              Faixa Normal: {globalRefMin} a {globalRefMax}{" "}
              {selectedAnalitoObj?.unidade}
            </div>
          )}
        </div>

        {loadingSerie ? (
          <div className="h-[400px] w-full bg-muted/20 rounded-2xl animate-pulse flex items-center justify-center">
            <Activity size={32} className="text-muted-foreground/30" />
          </div>
        ) : serie.length === 0 ? (
          <div className="h-[300px] w-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <Activity size={32} className="opacity-20 mb-2" />
            <p className="font-semibold text-sm">
              Sem resultados neste período.
            </p>
          </div>
        ) : (
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={serie}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="data"
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                  dy={5}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "hsl(var(--border))",
                    strokeWidth: 2,
                    strokeDasharray: "4 4",
                  }}
                />

                {globalRefMin !== undefined && globalRefMax !== undefined && (
                  <ReferenceArea
                    y1={globalRefMin}
                    y2={globalRefMax}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.06}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  isAnimationActive={true}
                  animationDuration={1500}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isOut =
                      payload.refMin !== undefined &&
                      payload.refMax !== undefined &&
                      (payload.valor < payload.refMin ||
                        payload.valor > payload.refMax);
                    return (
                      <circle
                        key={`dot-${payload.documentoId}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={
                          isOut
                            ? "hsl(var(--destructive))"
                            : "hsl(var(--primary))"
                        }
                        stroke="hsl(var(--card))"
                        strokeWidth={3}
                      />
                    );
                  }}
                  activeDot={{
                    r: 8,
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
