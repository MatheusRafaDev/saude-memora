import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Activity,
  FlaskConical,
  CalendarDays,
  ExternalLink,
  Info,
  AlertTriangle,
  HelpCircle,
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
  ReferenceLine,
} from "recharts";

interface SeriePonto {
  data: string;
  valor: number;
  unidade: string;
  refMin?: number;
  refMax?: number;
  status: string;
  documentoId: string;
  isOutlier?: boolean;
  outlierMotivo?: string | null;
}

export default function Evolucao() {
  const [analito, setAnalito] = useState<string>("");
  const [meses, setMeses] = useState<string>("12");
  const [hoveredOutlier, setHoveredOutlier] = useState<string | null>(null);

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

  const serie = ((serieRaw as unknown as SeriePonto[]) || []);

  // Estatísticas gerais
  const validPoints = serie.filter((s) => !s.isOutlier);
  const outlierPoints = serie.filter((s) => s.isOutlier);

  // Valores de referência (pega o primeiro ponto que tem refMin e refMax)
  const firstWithRefs = serie.find(
    (s) =>
      s.refMin !== null &&
      s.refMin !== undefined &&
      s.refMax !== null &&
      s.refMax !== undefined,
  );
  const globalRefMin = firstWithRefs?.refMin;
  const globalRefMax = firstWithRefs?.refMax;

  // Unidade (pega do primeiro ponto)
  const unidade = serie.find((s) => s.unidade)?.unidade ?? "";

  // Detecta inconsistência de unidades (ex: mg/dL e g/L misturados)
  const unidadesUnicas = [...new Set(serie.map((s) => s.unidade).filter(Boolean))];
  const hasUnitMismatch = unidadesUnicas.length > 1;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SeriePonto;
      const isOut =
        data.refMin !== undefined &&
        data.refMax !== undefined &&
        (data.valor < data.refMin || data.valor > data.refMax);

      return (
        <div className="bg-card border border-border/50 p-4 rounded-xl shadow-lg w-64 flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground uppercase">
            {label}
          </p>

          {/* Valor */}
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                data.isOutlier
                  ? "text-amber-500"
                  : isOut
                    ? "text-destructive"
                    : "text-primary"
              }`}
            >
              {data.valor}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {data.unidade}
            </span>
          </div>

          {/* Badge de outlier */}
          {data.isOutlier && (
            <div className="flex items-start gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>
                {data.outlierMotivo ?? "Valor atípico — considere confirmar este resultado com um novo exame."}
              </span>
            </div>
          )}

          {/* Referência */}
          {data.refMin !== undefined && data.refMax !== undefined && (
            <p className="text-[11px] text-muted-foreground">
              Referência: {data.refMin} a {data.refMax} {data.unidade}
            </p>
          )}

          <div className="mt-1 pt-2 border-t border-border/50">
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
    (a: any) => a.nomeNormalizado === analito,
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

      {/* Seletores */}
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

      {/* Gráfico */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {selectedAnalitoObj?.nome || "Exame"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Visão temporal dos seus resultados
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {globalRefMin !== undefined && globalRefMax !== undefined && (
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs text-blue-700 dark:text-blue-400 font-semibold">
                <Info size={14} />
                Faixa Normal: {globalRefMin} a {globalRefMax} {unidade}
              </div>
            )}
            {outlierPoints.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                <AlertTriangle size={14} />
                {outlierPoints.length} valor{outlierPoints.length > 1 ? "es" : ""} atípico{outlierPoints.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Alerta de incompatibilidade de unidades */}
        {hasUnitMismatch && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
            <HelpCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Unidades incompatíveis detectadas
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                Foram encontradas medições com unidades diferentes ({unidadesUnicas.join(", ")}). Os valores podem não ser comparáveis entre si. Consulte os documentos originais.
              </p>
            </div>
          </div>
        )}

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
          <>
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

                  {/* Área de referência normal */}
                  {globalRefMin !== undefined && globalRefMax !== undefined && (
                    <ReferenceArea
                      y1={globalRefMin}
                      y2={globalRefMax}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.06}
                    />
                  )}

                  {/* Linha da série */}
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    isAnimationActive={true}
                    animationDuration={1500}
                    connectNulls={false}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props as { cx: number; cy: number; payload: SeriePonto };

                      // Valor nulo ou ausente: renderiza ícone de dado faltando
                      if (payload.valor === null || payload.valor === undefined) {
                        return (
                          <g key={`dot-missing-${payload.documentoId}`}>
                            <circle
                              cx={cx} cy={cy} r={8}
                              fill="hsl(var(--muted))"
                              stroke="hsl(var(--border))"
                              strokeWidth={2}
                              strokeDasharray="3 3"
                            />
                            <text
                              x={cx} y={cy + 4}
                              textAnchor="middle"
                              fontSize={10}
                              fill="hsl(var(--muted-foreground))"
                            >
                              ?
                            </text>
                          </g>
                        );
                      }

                      // Outlier: diamante laranja com ponto de exclamação
                      if (payload.isOutlier) {
                        return (
                          <g key={`dot-outlier-${payload.documentoId}`}>
                            <polygon
                              points={`${cx},${cy - 10} ${cx + 9},${cy} ${cx},${cy + 10} ${cx - 9},${cy}`}
                              fill="hsl(var(--amber-500, 245 158 11))"
                              stroke="hsl(var(--card))"
                              strokeWidth={2.5}
                              style={{ fill: "#f59e0b" }}
                            />
                            <text
                              x={cx} y={cy + 4}
                              textAnchor="middle"
                              fontSize={9}
                              fontWeight="bold"
                              fill="white"
                            >
                              !
                            </text>
                          </g>
                        );
                      }

                      // Fora dos limites: círculo vermelho
                      const isOut =
                        payload.refMin !== undefined &&
                        payload.refMax !== undefined &&
                        (payload.valor < payload.refMin || payload.valor > payload.refMax);

                      return (
                        <circle
                          key={`dot-${payload.documentoId}`}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={isOut ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
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

            {/* Legenda de outliers */}
            {outlierPoints.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Valores que precisam de atenção
                </p>
                {outlierPoints.map((p) => (
                  <div
                    key={p.documentoId}
                    className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3"
                  >
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">
                        {p.data} — {p.valor} {p.unidade}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {p.outlierMotivo ?? "Valor estatisticamente atípico para o seu histórico."}
                      </p>
                    </div>
                    <Link
                      href={`/documentos/${p.documentoId}`}
                      className="shrink-0 text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                    >
                      Ver <ExternalLink size={11} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
