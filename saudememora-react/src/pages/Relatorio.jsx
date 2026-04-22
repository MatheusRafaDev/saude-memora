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
  try {
    return new Date(raw).toLocaleDateString("pt-BR");
  } catch { return raw; }
};

const countBy = (arr, key) => {
  const map = {};
  arr.forEach((item) => {
    const val = item[key] || "Desconhecido";
    map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
};

const Chip = ({ label, color = "blue" }) => (
  <span className={`rel-chip rel-chip--${color}`}>{label}</span>
);

const StatCard = ({ icon, label, value, sub, color = "blue" }) => (
  <div className={`rel-stat rel-stat--${color}`}>
    <div className="rel-stat__icon">{icon}</div>
    <div className="rel-stat__body">
      <div className="rel-stat__value">{value}</div>
      <div className="rel-stat__label">{label}</div>
      {sub && <div className="rel-stat__sub">{sub}</div>}
    </div>
  </div>
);

const SectionTitle = ({ icon, title }) => (
  <div className="rel-section-header">
    <span className="rel-section-icon">{icon}</span>
    <h2 className="rel-section-title">{title}</h2>
  </div>
);

/* ── Bar chart simples ──────────────────────────────────────── */
const BarChart = ({ data, maxBars = 6 }) => {
  const items = data.slice(0, maxBars);
  const max = items[0]?.[1] || 1;
  return (
    <div className="rel-bar-chart">
      {items.map(([name, count], i) => (
        <div key={i} className="rel-bar-row">
          <span className="rel-bar-label" title={name}>{name}</span>
          <div className="rel-bar-track">
            <div
              className="rel-bar-fill"
              style={{ width: `${(count / max) * 100}%`, animationDelay: `${i * 80}ms` }}
            />
          </div>
          <span className="rel-bar-count">{count}x</span>
        </div>
      ))}
      {items.length === 0 && (
        <p className="rel-empty-text">Nenhum dado disponível</p>
      )}
    </div>
  );
};

/* ── Alert badges da ficha ──────────────────────────────────── */
const FichaAlerts = ({ ficha }) => {
  if (!ficha) return <p className="rel-empty-text">Ficha médica não preenchida</p>;

  const alerts = [];
  if (ficha.alergias) alerts.push({ label: `Alergias: ${ficha.alergiasExtra || "Sim"}`, color: "red" });
  if (ficha.alergiaMedicamentos) alerts.push({ label: `Alergia a medicamentos: ${ficha.alergiaMedicamentosExtra || "Sim"}`, color: "red" });
  if (ficha.diabetes) alerts.push({ label: "Diabetes", color: "orange" });
  if (ficha.doencaCardioVascular) alerts.push({ label: `Cardio: ${ficha.doencaCardioVascularExtra || "Sim"}`, color: "orange" });
  if (ficha.tratamentoMedico) alerts.push({ label: `Tratamento: ${ficha.tratamentoMedicoExtra || "Em curso"}`, color: "yellow" });
  if (ficha.reumatica) alerts.push({ label: "Febre Reumática", color: "yellow" });
  if (ficha.coagulacao) alerts.push({ label: "Problemas de Coagulação", color: "red" });
  if (ficha.hemorragicos) alerts.push({ label: "Hemorrágicos", color: "red" });
  if (ficha.hiv) alerts.push({ label: "HIV", color: "purple" });
  if (ficha.hepatite) alerts.push({ label: `Hepatite: ${ficha.hepatiteExtra || "Sim"}`, color: "orange" });
  if (ficha.fumante) alerts.push({ label: "Fumante", color: "yellow" });
  if (ficha.drogas) alerts.push({ label: "Uso de drogas", color: "purple" });
  if (ficha.respiratorio) alerts.push({ label: `Respiratório: ${ficha.respiratorioExtra || "Sim"}`, color: "blue" });
  if (ficha.gravidez) alerts.push({ label: `Gravidez: ${ficha.gravidezExtra || "Sim"}`, color: "pink" });
  if (ficha.problemasAnestesia) alerts.push({ label: `Anestesia: ${ficha.problemasAnestesiaExtra || "Sim"}`, color: "orange" });
  if (ficha.doencaFamilia) alerts.push({ label: `Histórico familiar: ${ficha.doencaFamiliaExtra || "Sim"}`, color: "blue" });

  if (alerts.length === 0) {
    return (
      <div className="rel-alert-ok">
        <span>✓</span>
        <p>Nenhum fator de risco registrado na ficha médica</p>
      </div>
    );
  }

  return (
    <div className="rel-alerts-grid">
      {alerts.map((a, i) => <Chip key={i} label={a.label} color={a.color} />)}
    </div>
  );
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

      if (medRes.status === "fulfilled" && medRes.value.success)
        setMedicamentos(medRes.value.data || []);
      if (exaRes.status === "fulfilled" && exaRes.value.success)
        setExames(exaRes.value.data || []);
      if (recRes.status === "fulfilled" && recRes.value.success)
        setReceitas(recRes.value.data || []);
      if (docRes.status === "fulfilled" && docRes.value.success)
        setDocumentos(docRes.value.data || []);
      if (fichaRes.status === "fulfilled" && fichaRes.value.success)
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

  /* ── derivações ─────────────────────────────────────────────── */
  const medMaisUsados = countBy(medicamentos, "nome");
  const examesPorTipo = countBy(exames, "tipoExame");
  const recentesExames = [...exames].sort(
    (a, b) => new Date(b.dataExame || 0) - new Date(a.dataExame || 0)
  ).slice(0, 5);
  const recentesMed = [...receitas].sort(
    (a, b) => new Date(b.dataReceita || 0) - new Date(a.dataReceita || 0)
  ).slice(0, 5);

  const totalDocs = Array.isArray(documentos)
    ? documentos.reduce((s, g) => s + (g.documentos?.length || 0), 0)
    : 0;

  const tabs = [
    { id: "resumo", label: "Resumo" },
    { id: "medicamentos", label: "Medicamentos" },
    { id: "exames", label: "Exames" },
    { id: "ficha", label: "Alertas Clínicos" },
  ];

  if (loading) {
    return (
      <div className="rel-loading">
        <div className="rel-spinner" />
        <p>Carregando relatório…</p>
      </div>
    );
  }

  return (
    <div className="rel-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="rel-header">
        <div className="rel-header__left">
          <button className="rel-back" onClick={() => navigate("/inicio")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="rel-header__title">Relatório Médico</h1>
            <p className="rel-header__sub">{paciente?.nome}</p>
          </div>
        </div>
        <div className="rel-header__badge">
          <span className="rel-header__date">
            Atualizado em {new Date().toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="rel-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`rel-tab ${activeTab === t.id ? "rel-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB: RESUMO
         ══════════════════════════════════════════════════════════ */}
      {activeTab === "resumo" && (
        <div className="rel-content">
          {/* Stats row */}
          <div className="rel-stats-row">
            <StatCard
              color="blue"
              label="Documentos"
              value={totalDocs}
              sub="Total digitalizado"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
            />
            <StatCard
              color="green"
              label="Exames"
              value={exames.length}
              sub="Registrados"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
            <StatCard
              color="orange"
              label="Receitas"
              value={receitas.length}
              sub="Emitidas"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              color="purple"
              label="Medicamentos"
              value={medicamentos.length}
              sub="Cadastrados"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3" />
                  <circle cx="18" cy="18" r="3" />
                  <path d="M18 15v6M15 18h6" />
                </svg>
              }
            />
          </div>

          <div className="rel-two-col">
            {/* Top medicamentos */}
            <div className="rel-card">
              <SectionTitle
                title="Medicamentos mais prescritos"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 12h6M12 9v6" />
                  </svg>
                }
              />
              <BarChart data={medMaisUsados} />
            </div>

            {/* Top exames */}
            <div className="rel-card">
              <SectionTitle
                title="Tipos de exame mais comuns"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
              />
              <BarChart data={examesPorTipo} />
            </div>
          </div>

          {/* Alertas clínicos resumo */}
          <div className="rel-card">
            <SectionTitle
              title="Fatores clínicos de atenção"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
            />
            <FichaAlerts ficha={ficha} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: MEDICAMENTOS
         ══════════════════════════════════════════════════════════ */}
      {activeTab === "medicamentos" && (
        <div className="rel-content">
          <div className="rel-card">
            <SectionTitle
              title="Ranking de Medicamentos"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              }
            />
            <BarChart data={medMaisUsados} maxBars={10} />
          </div>

          <div className="rel-card">
            <SectionTitle
              title="Últimas Receitas"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
            {recentesMed.length === 0 ? (
              <p className="rel-empty-text">Nenhuma receita encontrada</p>
            ) : (
              <div className="rel-list">
                {recentesMed.map((r, i) => (
                  <div key={i} className="rel-list-item">
                    <div className="rel-list-item__icon rel-list-item__icon--green">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      </svg>
                    </div>
                    <div className="rel-list-item__body">
                      <span className="rel-list-item__title">
                        {r.medico || "Médico não informado"}
                      </span>
                      <span className="rel-list-item__sub">
                        {formatDate(r.dataReceita)} · CRM {r.crm || "—"}
                      </span>
                    </div>
                    <Chip label="Receita" color="green" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rel-card">
            <SectionTitle
              title="Todos os Medicamentos"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12h6M12 9v6" />
                </svg>
              }
            />
            {medicamentos.length === 0 ? (
              <p className="rel-empty-text">Nenhum medicamento cadastrado</p>
            ) : (
              <div className="rel-table-wrap">
                <table className="rel-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Dosagem</th>
                      <th>Frequência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicamentos.map((m, i) => (
                      <tr key={i}>
                        <td><strong>{m.nome || "—"}</strong></td>
                        <td>{m.dosagem || "—"}</td>
                        <td>{m.frequencia || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: EXAMES
         ══════════════════════════════════════════════════════════ */}
      {activeTab === "exames" && (
        <div className="rel-content">
          <div className="rel-card">
            <SectionTitle
              title="Distribuição por Tipo de Exame"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
            <BarChart data={examesPorTipo} maxBars={10} />
          </div>

          <div className="rel-card">
            <SectionTitle
              title="Exames Mais Recentes"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
            {recentesExames.length === 0 ? (
              <p className="rel-empty-text">Nenhum exame encontrado</p>
            ) : (
              <div className="rel-list">
                {recentesExames.map((e, i) => (
                  <div key={i} className="rel-list-item">
                    <div className="rel-list-item__icon rel-list-item__icon--blue">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <div className="rel-list-item__body">
                      <span className="rel-list-item__title">
                        {e.tipoExame || "Tipo não informado"}
                      </span>
                      <span className="rel-list-item__sub">
                        {formatDate(e.dataExame)} · {e.laboratorio || "Lab. não informado"}
                      </span>
                    </div>
                    <Chip label={e.tipoExame || "Exame"} color="blue" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rel-card">
            <SectionTitle
              title="Histórico Completo de Exames"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
            />
            {exames.length === 0 ? (
              <p className="rel-empty-text">Nenhum exame cadastrado</p>
            ) : (
              <div className="rel-table-wrap">
                <table className="rel-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Data</th>
                      <th>Laboratório</th>
                      <th>Médico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exames.map((e, i) => (
                      <tr key={i}>
                        <td><strong>{e.tipoExame || "—"}</strong></td>
                        <td>{formatDate(e.dataExame)}</td>
                        <td>{e.laboratorio || "—"}</td>
                        <td>{e.medico || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: FICHA / ALERTAS CLÍNICOS
         ══════════════════════════════════════════════════════════ */}
      {activeTab === "ficha" && (
        <div className="rel-content">
          {ficha ? (
            <>
              <div className="rel-card">
                <SectionTitle
                  title="Alertas Clínicos Importantes"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  }
                />
                <FichaAlerts ficha={ficha} />
              </div>

              <div className="rel-two-col">
                <div className="rel-card">
                  <SectionTitle title="Dados Vitais" icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  } />
                  <div className="rel-info-grid">
                    <div className="rel-info-item">
                      <span className="rel-info-label">Pressão Arterial</span>
                      <span className="rel-info-value">{ficha.pressao || "—"}</span>
                    </div>
                    <div className="rel-info-item">
                      <span className="rel-info-label">Diabetes</span>
                      <span className={`rel-info-value ${ficha.diabetes ? "rel-info-value--alert" : ""}`}>
                        {ficha.diabetes ? `Sim${ficha.diabetesExtra ? " — " + ficha.diabetesExtra : ""}` : "Não"}
                      </span>
                    </div>
                    <div className="rel-info-item">
                      <span className="rel-info-label">Cardiovascular</span>
                      <span className={`rel-info-value ${ficha.doencaCardioVascular ? "rel-info-value--alert" : ""}`}>
                        {ficha.doencaCardioVascular ? `Sim${ficha.doencaCardioVascularExtra ? " — " + ficha.doencaCardioVascularExtra : ""}` : "Não"}
                      </span>
                    </div>
                    <div className="rel-info-item">
                      <span className="rel-info-label">Respiratório</span>
                      <span className={`rel-info-value ${ficha.respiratorio ? "rel-info-value--warn" : ""}`}>
                        {ficha.respiratorio ? `Sim${ficha.respiratorioExtra ? " — " + ficha.respiratorioExtra : ""}` : "Não"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rel-card">
                  <SectionTitle title="Histórico & Hábitos" icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  } />
                  <div className="rel-info-grid">
                    <div className="rel-info-item">
                      <span className="rel-info-label">Fumante</span>
                      <span className={`rel-info-value ${ficha.fumante ? "rel-info-value--warn" : ""}`}>
                        {ficha.fumante ? "Sim" : ficha.fumou ? "Ex-fumante" : "Não"}
                      </span>
                    </div>
                    <div className="rel-info-item">
                      <span className="rel-info-label">Drogas</span>
                      <span className={`rel-info-value ${ficha.drogas ? "rel-info-value--alert" : ""}`}>
                        {ficha.drogas ? "Sim" : "Não"}
                      </span>
                    </div>
                    <div className="rel-info-item">
                      <span className="rel-info-label">HIV</span>
                      <span className={`rel-info-value ${ficha.hiv ? "rel-info-value--alert" : ""}`}>
                        {ficha.hiv ? "Positivo" : "Negativo / Não informado"}
                      </span>
                    </div>
                    <div className="rel-info-item">
                      <span className="rel-info-label">Histórico Familiar</span>
                      <span className={`rel-info-value ${ficha.doencaFamilia ? "rel-info-value--warn" : ""}`}>
                        {ficha.doencaFamilia ? ficha.doencaFamiliaExtra || "Sim" : "Sem registro"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rel-card">
                <SectionTitle title="Alergias e Medicamentos" icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                } />
                <div className="rel-info-grid">
                  <div className="rel-info-item">
                    <span className="rel-info-label">Alergias gerais</span>
                    <span className={`rel-info-value ${ficha.alergias ? "rel-info-value--alert" : ""}`}>
                      {ficha.alergias ? ficha.alergiasExtra || "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="rel-info-item">
                    <span className="rel-info-label">Alergia a medicamentos</span>
                    <span className={`rel-info-value ${ficha.alergiaMedicamentos ? "rel-info-value--alert" : ""}`}>
                      {ficha.alergiaMedicamentos ? ficha.alergiaMedicamentosExtra || "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="rel-info-item">
                    <span className="rel-info-label">Problemas c/ anestesia</span>
                    <span className={`rel-info-value ${ficha.problemasAnestesia ? "rel-info-value--warn" : ""}`}>
                      {ficha.problemasAnestesia ? ficha.problemasAnestesiaExtra || "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="rel-info-item">
                    <span className="rel-info-label">Tratamento em curso</span>
                    <span className={`rel-info-value ${ficha.tratamentoMedico ? "rel-info-value--warn" : ""}`}>
                      {ficha.tratamentoMedico ? ficha.tratamentoMedicoExtra || "Sim" : "Não"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rel-card">
              <div className="rel-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3>Ficha médica não preenchida</h3>
                <p>Preencha sua ficha médica para visualizar alertas clínicos</p>
                <button className="rel-btn-primary" onClick={() => navigate("/ficha-medica")}>
                  Preencher Ficha Médica
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Relatorio;