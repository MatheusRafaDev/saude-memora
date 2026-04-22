import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MedicamentoService from "../services/MedicamentoService";
import ExameService from "../services/ExameService";
import ReceitaService from "../services/ReceitaService";
import DocumentoService from "../services/DocumentoService";
import { buscarFichaMedica } from "../services/FichaMedicaService";
import "../styles/pages/Relatorio.css";

/* ── helpers ─────────────────────────────────────────────────── */
const formatDate = (raw) => {
  if (!raw) return "—";
  try { return new Date(raw).toLocaleDateString("pt-BR"); }
  catch { return raw; }
};

// Exame usa "tipo" e "nomeExame", não "tipoExame"
const getExameTipo = (e) => e.nomeExame || e.tipo || "Desconhecido";

const countBy = (arr, getFn) => {
  const map = {};
  arr.forEach((item) => {
    const val = typeof getFn === "function" ? getFn(item) : (item[getFn] || "Desconhecido");
    map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
};

/* ── Sub-components ─────────────────────────────────────────── */
const Badge = ({ label, variant = "blue" }) => (
  <span className={`rel-badge rel-badge--${variant}`}>{label}</span>
);

const KpiCard = ({ icon, label, value, caption, accent = "blue" }) => (
  <div className={`rel-kpi rel-kpi--${accent}`}>
    <div className="rel-kpi__icon">{icon}</div>
    <div className="rel-kpi__body">
      <div className="rel-kpi__value">{value}</div>
      <div className="rel-kpi__label">{label}</div>
      {caption && <div className="rel-kpi__caption">{caption}</div>}
    </div>
    <div className="rel-kpi__glow" />
  </div>
);

const SectionHead = ({ icon, title, count }) => (
  <div className="rel-shead">
    <div className="rel-shead__icon">{icon}</div>
    <h2 className="rel-shead__title">{title}</h2>
    {count !== undefined && <span className="rel-shead__count">{count}</span>}
  </div>
);

const BarChart = ({ data, maxBars = 7 }) => {
  const items = data.slice(0, maxBars);
  const max = items[0]?.[1] || 1;
  if (!items.length) return <p className="rel-empty">Nenhum dado disponível</p>;
  return (
    <div className="rel-bars">
      {items.map(([name, count], i) => (
        <div key={i} className="rel-bars__row" style={{ "--delay": `${i * 70}ms` }}>
          <span className="rel-bars__label" title={name}>{name}</span>
          <div className="rel-bars__track">
            <div className="rel-bars__fill" style={{ "--pct": `${(count / max) * 100}%` }} />
          </div>
          <span className="rel-bars__n">{count}</span>
        </div>
      ))}
    </div>
  );
};

const FichaAlerts = ({ ficha }) => {
  if (!ficha) return <p className="rel-empty">Ficha médica não preenchida</p>;

  const risk = [];
  const warn = [];
  const info = [];

  if (ficha.alergias) risk.push(`Alergias${ficha.alergiasExtra ? ": " + ficha.alergiasExtra : ""}`);
  if (ficha.alergiaMedicamentos) risk.push(`Alergia medicamentos${ficha.alergiaMedicamentosExtra ? ": " + ficha.alergiaMedicamentosExtra : ""}`);
  if (ficha.coagulacao) risk.push("Prob. de Coagulação");
  if (ficha.hemorragicos) risk.push("Hemorrágicos");
  if (ficha.hiv) risk.push("HIV");
  if (ficha.diabetes) warn.push(`Diabetes${ficha.diabetesExtra ? ": " + ficha.diabetesExtra : ""}`);
  if (ficha.doencaCardioVascular) warn.push(`Cardiovascular${ficha.doencaCardioVascularExtra ? ": " + ficha.doencaCardioVascularExtra : ""}`);
  if (ficha.hepatite) warn.push(`Hepatite${ficha.hepatiteExtra ? ": " + ficha.hepatiteExtra : ""}`);
  if (ficha.problemasAnestesia) warn.push(`Anestesia${ficha.problemasAnestesiaExtra ? ": " + ficha.problemasAnestesiaExtra : ""}`);
  if (ficha.tratamentoMedico) info.push(`Tratamento${ficha.tratamentoMedicoExtra ? ": " + ficha.tratamentoMedicoExtra : ""}`);
  if (ficha.reumatica) info.push("Febre Reumática");
  if (ficha.fumante) info.push("Fumante");
  if (ficha.drogas) info.push("Uso de drogas");
  if (ficha.respiratorio) info.push(`Respiratório${ficha.respiratorioExtra ? ": " + ficha.respiratorioExtra : ""}`);
  if (ficha.gravidez) info.push(`Gravidez${ficha.gravidezExtra ? ": " + ficha.gravidezExtra : ""}`);
  if (ficha.doencaFamilia) info.push(`Hist. familiar${ficha.doencaFamiliaExtra ? ": " + ficha.doencaFamiliaExtra : ""}`);

  if (!risk.length && !warn.length && !info.length) {
    return (
      <div className="rel-ok">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Nenhum fator de risco registrado</span>
      </div>
    );
  }

  return (
    <div className="rel-alert-groups">
      {risk.length > 0 && (
        <div className="rel-alert-group">
          <span className="rel-alert-group__label rel-alert-group__label--red">⚠ Alto risco</span>
          <div className="rel-badge-wrap">
            {risk.map((l, i) => <Badge key={i} label={l} variant="red" />)}
          </div>
        </div>
      )}
      {warn.length > 0 && (
        <div className="rel-alert-group">
          <span className="rel-alert-group__label rel-alert-group__label--orange">◆ Atenção</span>
          <div className="rel-badge-wrap">
            {warn.map((l, i) => <Badge key={i} label={l} variant="orange" />)}
          </div>
        </div>
      )}
      {info.length > 0 && (
        <div className="rel-alert-group">
          <span className="rel-alert-group__label rel-alert-group__label--blue">● Informativo</span>
          <div className="rel-badge-wrap">
            {info.map((l, i) => <Badge key={i} label={l} variant="blue" />)}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Icons ──────────────────────────────────────────────────── */
const Icon = {
  doc: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  pulse: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  clip: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  pill: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3"/><circle cx="18" cy="18" r="3"/><path d="M18 15v6M15 18h6"/></svg>,
  warn: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  bar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  cal: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
};

/* ════════════════════════════════════════════════════════════════
   Componente principal
   ════════════════════════════════════════════════════════════════ */
function Relatorio() {
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resumo");

  const [medicamentos, setMedicamentos] = useState([]);
  const [exames, setExames] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [ficha, setFicha] = useState(null);

  const loadData = useCallback(async (pac) => {
    setLoading(true);
    try {
      const [medRes, exaRes, recRes, docRes, fichaRes] = await Promise.allSettled([
        MedicamentoService.getAll(),
        ExameService.getAll(),
        ReceitaService.getAll(),
        DocumentoService.getPorPacienteAgrupado(pac.id),
        buscarFichaMedica(pac.id),
      ]);

      if (medRes.status === "fulfilled" && medRes.value?.success)
        setMedicamentos(medRes.value.data || []);
      if (exaRes.status === "fulfilled" && exaRes.value?.success)
        setExames(exaRes.value.data || []);
      if (recRes.status === "fulfilled" && recRes.value?.success)
        setReceitas(recRes.value.data || []);
      if (docRes.status === "fulfilled" && docRes.value?.success)
        setDocumentos(docRes.value.data || []);
      if (fichaRes.status === "fulfilled" && fichaRes.value?.success)
        setFicha(fichaRes.value.data);
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("paciente") || "{}");
    if (!p?.id) { navigate("/login"); return; }
    setPaciente(p);
    loadData(p);
  }, [loadData, navigate]);

  /* ── derivações ──────────────────────────────────────────── */
  // Medicamentos podem vir da listagem direta OU aninhados dentro das receitas
  const allMeds = medicamentos.length
    ? medicamentos
    : receitas.flatMap((r) => r.medicamentos || []);

  const medMaisUsados = countBy(allMeds, "nome");
  const examesPorTipo = countBy(exames, getExameTipo);

  const recentesExames = [...exames]
    .sort((a, b) => new Date(b.dataExame || 0) - new Date(a.dataExame || 0))
    .slice(0, 5);

  const recentesMed = [...receitas]
    .sort((a, b) => new Date(b.dataReceita || 0) - new Date(a.dataReceita || 0))
    .slice(0, 5);

  const totalDocs = Array.isArray(documentos)
    ? documentos.reduce((s, g) => s + (g.documentos?.length || 0), 0)
    : 0;

  const tabs = [
    { id: "resumo",       label: "Resumo",          icon: Icon.doc },
    { id: "medicamentos", label: "Medicamentos",     icon: Icon.pill },
    { id: "exames",       label: "Exames",           icon: Icon.pulse },
    { id: "ficha",        label: "Alertas Clínicos", icon: Icon.warn },
  ];

  /* ── loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="rel-splash">
        <div className="rel-splash__ring" />
        <p>Carregando relatório…</p>
      </div>
    );
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="rel-root">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="rel-header">

        <div className="rel-header__titles">
          <h1>Relatório Médico</h1>
          <span>{paciente?.nome}</span>
        </div>
        <div className="rel-header__date">
          Atualizado em {new Date().toLocaleDateString("pt-BR")}
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <nav className="rel-nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`rel-nav__btn ${activeTab === t.id ? "rel-nav__btn--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="rel-nav__icon">{t.icon}</span>
            <span className="rel-nav__label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="rel-main">

        {/* ════════════════════════════════════════════════════
            TAB: RESUMO
           ════════════════════════════════════════════════════ */}
        {activeTab === "resumo" && (
          <div className="rel-section rel-section--fade">
            <div className="rel-kpis">
              <KpiCard accent="blue"   icon={Icon.doc}   label="Documentos"    value={totalDocs}          caption="Digitalizados" />
              <KpiCard accent="teal"   icon={Icon.pulse} label="Exames"         value={exames.length}      caption="Registrados" />
              <KpiCard accent="amber"  icon={Icon.clip}  label="Receitas"       value={receitas.length}    caption="Emitidas" />
              <KpiCard accent="violet" icon={Icon.pill}  label="Medicamentos"   value={allMeds.length}     caption="Cadastrados" />
            </div>

            <div className="rel-grid-2">
              <div className="rel-card">
                <SectionHead icon={Icon.bar}  title="Medicamentos mais prescritos" count={medMaisUsados.length} />
                <BarChart data={medMaisUsados} />
              </div>
              <div className="rel-card">
                <SectionHead icon={Icon.pulse} title="Tipos de exame mais comuns" count={examesPorTipo.length} />
                <BarChart data={examesPorTipo} />
              </div>
            </div>

            <div className="rel-card">
              <SectionHead icon={Icon.warn} title="Fatores clínicos de atenção" />
              <FichaAlerts ficha={ficha} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: MEDICAMENTOS
           ════════════════════════════════════════════════════ */}
        {activeTab === "medicamentos" && (
          <div className="rel-section rel-section--fade">
            <div className="rel-card">
              <SectionHead icon={Icon.bar} title="Ranking de Medicamentos" count={medMaisUsados.length} />
              <BarChart data={medMaisUsados} maxBars={10} />
            </div>

            <div className="rel-card">
              <SectionHead icon={Icon.cal} title="Últimas Receitas" count={recentesMed.length} />
              {recentesMed.length === 0 ? (
                <p className="rel-empty">Nenhuma receita encontrada</p>
              ) : (
                <ul className="rel-list">
                  {recentesMed.map((r, i) => (
                    <li key={i} className="rel-list__item">
                      <div className="rel-list__dot rel-list__dot--teal">{Icon.clip}</div>
                      <div className="rel-list__body">
                        <strong>{r.medico || r.Medico || "Médico não informado"}</strong>
                        <span>{formatDate(r.dataReceita)} · CRM {r.crmMedico || r.crm || "—"}</span>
                      </div>
                      <Badge label="Receita" variant="teal" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rel-card">
              <SectionHead icon={Icon.pill} title="Todos os Medicamentos" count={allMeds.length} />
              {allMeds.length === 0 ? (
                <p className="rel-empty">Nenhum medicamento cadastrado</p>
              ) : (
                <div className="rel-table-wrap">
                  <table className="rel-table">
                    <thead>
                      <tr><th>Nome</th><th>Quantidade</th><th>Forma de uso</th></tr>
                    </thead>
                    <tbody>
                      {allMeds.map((m, i) => (
                        <tr key={i}>
                          <td><strong>{m.nome || "—"}</strong></td>
                          <td>{m.quantidade || "—"}</td>
                          <td>{m.formaDeUso || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: EXAMES
           ════════════════════════════════════════════════════ */}
        {activeTab === "exames" && (
          <div className="rel-section rel-section--fade">
            <div className="rel-card">
              <SectionHead icon={Icon.bar} title="Distribuição por Tipo de Exame" count={examesPorTipo.length} />
              <BarChart data={examesPorTipo} maxBars={10} />
            </div>

            <div className="rel-card">
              <SectionHead icon={Icon.cal} title="Exames Mais Recentes" count={recentesExames.length} />
              {recentesExames.length === 0 ? (
                <p className="rel-empty">Nenhum exame encontrado</p>
              ) : (
                <ul className="rel-list">
                  {recentesExames.map((e, i) => (
                    <li key={i} className="rel-list__item">
                      <div className="rel-list__dot rel-list__dot--blue">{Icon.pulse}</div>
                      <div className="rel-list__body">
                        <strong>{getExameTipo(e)}</strong>
                        <span>{formatDate(e.dataExame)} · {e.laboratorio || "Lab. não informado"}</span>
                      </div>
                      <Badge label={e.tipo || "Exame"} variant="blue" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rel-card">
              <SectionHead icon={Icon.doc} title="Histórico Completo de Exames" count={exames.length} />
              {exames.length === 0 ? (
                <p className="rel-empty">Nenhum exame cadastrado</p>
              ) : (
                <div className="rel-table-wrap">
                  <table className="rel-table">
                    <thead>
                      <tr><th>Nome / Tipo</th><th>Data</th><th>Laboratório</th><th>Resultado</th></tr>
                    </thead>
                    <tbody>
                      {exames.map((e, i) => (
                        <tr key={i}>
                          <td><strong>{getExameTipo(e)}</strong></td>
                          <td>{formatDate(e.dataExame)}</td>
                          <td>{e.laboratorio || "—"}</td>
                          <td className="rel-table__trunc">{e.resultado || e.resumo || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: FICHA / ALERTAS
           ════════════════════════════════════════════════════ */}
        {activeTab === "ficha" && (
          <div className="rel-section rel-section--fade">
            {ficha ? (
              <>
                <div className="rel-card">
                  <SectionHead icon={Icon.warn} title="Alertas Clínicos Importantes" />
                  <FichaAlerts ficha={ficha} />
                </div>

                <div className="rel-grid-2">
                  <div className="rel-card">
                    <SectionHead icon={Icon.pulse} title="Dados de Saúde" />
                    <dl className="rel-dl">
                      <div className="rel-dl__row">
                        <dt>Pressão Arterial</dt>
                        <dd>{ficha.pressao || "—"}</dd>
                      </div>
                      <div className="rel-dl__row">
                        <dt>Diabetes</dt>
                        <dd className={ficha.diabetes ? "rel-dl__dd--alert" : ""}>
                          {ficha.diabetes ? `Sim${ficha.diabetesExtra ? " — " + ficha.diabetesExtra : ""}` : "Não"}
                        </dd>
                      </div>
                      <div className="rel-dl__row">
                        <dt>Cardiovascular</dt>
                        <dd className={ficha.doencaCardioVascular ? "rel-dl__dd--alert" : ""}>
                          {ficha.doencaCardioVascular
                            ? `Sim${ficha.doencaCardioVascularExtra ? " — " + ficha.doencaCardioVascularExtra : ""}`
                            : "Não"}
                        </dd>
                      </div>
                      <div className="rel-dl__row">
                        <dt>Respiratório</dt>
                        <dd className={ficha.respiratorio ? "rel-dl__dd--warn" : ""}>
                          {ficha.respiratorio
                            ? `Sim${ficha.respiratorioExtra ? " — " + ficha.respiratorioExtra : ""}`
                            : "Não"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rel-card">
                    <SectionHead icon={Icon.shield} title="Histórico & Hábitos" />
                    <dl className="rel-dl">
                      <div className="rel-dl__row">
                        <dt>Fumante</dt>
                        <dd className={ficha.fumante ? "rel-dl__dd--warn" : ""}>
                          {ficha.fumante ? "Sim" : ficha.fumou ? "Ex-fumante" : "Não"}
                        </dd>
                      </div>
                      <div className="rel-dl__row">
                        <dt>Drogas</dt>
                        <dd className={ficha.drogas ? "rel-dl__dd--alert" : ""}>
                          {ficha.drogas ? "Sim" : "Não"}
                        </dd>
                      </div>
                      <div className="rel-dl__row">
                        <dt>HIV</dt>
                        <dd className={ficha.hiv ? "rel-dl__dd--alert" : ""}>
                          {ficha.hiv ? "Positivo" : "Negativo / Não informado"}
                        </dd>
                      </div>
                      <div className="rel-dl__row">
                        <dt>Histórico Familiar</dt>
                        <dd className={ficha.doencaFamilia ? "rel-dl__dd--warn" : ""}>
                          {ficha.doencaFamilia ? ficha.doencaFamiliaExtra || "Sim" : "Sem registro"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="rel-card">
                  <SectionHead icon={Icon.pill} title="Alergias e Medicamentos" />
                  <dl className="rel-dl rel-dl--4col">
                    <div className="rel-dl__row">
                      <dt>Alergias gerais</dt>
                      <dd className={ficha.alergias ? "rel-dl__dd--alert" : ""}>
                        {ficha.alergias ? ficha.alergiasExtra || "Sim" : "Não"}
                      </dd>
                    </div>
                    <div className="rel-dl__row">
                      <dt>Alergia a medicamentos</dt>
                      <dd className={ficha.alergiaMedicamentos ? "rel-dl__dd--alert" : ""}>
                        {ficha.alergiaMedicamentos ? ficha.alergiaMedicamentosExtra || "Sim" : "Não"}
                      </dd>
                    </div>
                    <div className="rel-dl__row">
                      <dt>Problemas c/ anestesia</dt>
                      <dd className={ficha.problemasAnestesia ? "rel-dl__dd--warn" : ""}>
                        {ficha.problemasAnestesia ? ficha.problemasAnestesiaExtra || "Sim" : "Não"}
                      </dd>
                    </div>
                    <div className="rel-dl__row">
                      <dt>Tratamento em curso</dt>
                      <dd className={ficha.tratamentoMedico ? "rel-dl__dd--warn" : ""}>
                        {ficha.tratamentoMedico ? ficha.tratamentoMedicoExtra || "Sim" : "Não"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </>
            ) : (
              <div className="rel-card rel-card--empty">
                {Icon.clip}
                <h3>Ficha médica não preenchida</h3>
                <p>Preencha sua ficha médica para visualizar alertas clínicos</p>
                <button className="rel-btn" onClick={() => navigate("/ficha-medica")}>
                  Preencher Ficha Médica
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default Relatorio;