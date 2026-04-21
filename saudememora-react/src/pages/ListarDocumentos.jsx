import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DocumentoService from "../services/DocumentoService";
import formatarData from "../utils/formatarData";
import ReceitaService from "../services/ReceitaService";
import ExameService from "../services/ExameService";
import DocumentoClinicoService from "../services/DocumentoClinicoService";
import ReactModal from "react-modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/pages/ListarDocumentos.css";

import {
  FaPrescriptionBottle,
  FaVials,
  FaFileAlt,
  FaFileUpload,
  FaTrash,
  FaEye,
  FaUserMd,
  FaTimes,
  FaCheck,
  FaEdit,
  FaFilter,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSpinner,
} from "react-icons/fa";

// Componente de Toast separado
const Toast = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`notification ${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="notification-close">
        <FaTimes />
      </button>
    </div>
  );
};

// Componente de Loading
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner-large">
      <FaSpinner className="spinner-icon" />
    </div>
    <p className="loading-text">Carregando documentos...</p>
  </div>
);

// Componente de Error
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <p className="error-message">{error}</p>
    <button onClick={onRetry} className="reload-btn">
      Tentar novamente
    </button>
  </div>
);

// Componente de Empty State
const EmptyState = ({ hasDocuments, onClearFilters }) => (
  <div className="empty-container">
    <div className="empty-icon">📄</div>
    <p className="empty-message">
      {hasDocuments
        ? "Nenhum documento corresponde aos filtros aplicados."
        : "Nenhum documento encontrado."}
    </p>
    {hasDocuments && (
      <button onClick={onClearFilters} className="btn-limpar-filtros">
        Limpar filtros
      </button>
    )}
  </div>
);

// Componente de Modal de Confirmação
const ConfirmationModal = ({ show, message, onConfirm, onClose, loading }) => (
  <ReactModal
    isOpen={show}
    onRequestClose={onClose}
    contentLabel="Confirmação"
    className="modal-content"
    overlayClassName="modal-overlay"
    shouldCloseOnOverlayClick={!loading}
    shouldCloseOnEsc={!loading}
  >
    <div className="modal-inner">
      <div className="modal-header">
        <h3 className="modal-title">Confirmar ação</h3>
        <button onClick={onClose} disabled={loading} className="modal-close-btn">
          <FaTimes />
        </button>
      </div>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <button onClick={onClose} disabled={loading} className="modal-cancel-btn">
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading} className="modal-confirm-btn">
          {loading ? (
            <>
              <FaSpinner className="spinner" /> Processando...
            </>
          ) : (
            <>
              <FaCheck /> Confirmar
            </>
          )}
        </button>
      </div>
    </div>
  </ReactModal>
);

// Componente de Documento Item
const DocumentoItem = ({ documento, tipo, onVisualizar, onAlterar, onDeletar }) => {
  const getDocumentoInfo = useMemo(() => {
    switch (tipo) {
      case "D":
        return {
          titulo: documento.clinico?.tipoDoc || "Documento Clínico",
          meta: documento.clinico?.medico && (
            <div className="documento-meta">
              <FaUserMd className="meta-icon" />
              <span>{documento.clinico.medico}</span>
              {documento.clinico.crm && (
                <span className="crm">CRM: {documento.clinico.crm}</span>
              )}
            </div>
          ),
          dataDocumento: documento.clinico?.dataDocumentoCli,
        };
      case "E":
        return {
          titulo: documento.exame?.nomeExame || "Exame Clínico",
          meta: documento.exame?.laboratorio && (
            <div className="documento-meta">
              <span>Laboratório: {documento.exame.laboratorio}</span>
            </div>
          ),
          dataDocumento: documento.exame?.dataExame,
        };
      case "R":
        return {
          titulo: "Receita",
          meta: documento.receita?.medico && (
            <div className="documento-meta">
              <FaUserMd className="meta-icon" />
              <span>{documento.receita.medico}</span>
              {documento.receita.crm && (
                <span className="crm">CRM: {documento.receita.crm}</span>
              )}
            </div>
          ),
          dataDocumento: documento.receita?.dataReceita,
        };
      default:
        return { titulo: "Documento", meta: null, dataDocumento: null };
    }
  }, [documento, tipo]);

  return (
    <li className="documento-item">
      <div className="documento-info">
        <div className="documento-header">
          <span className="documento-tipo">{getDocumentoInfo.titulo}</span>
          <span className="documento-id">ID: {documento.documento.id}</span>
          <div className="documento-data">
            <span>Upload: {formatarData(documento.documento.dataUpload)}</span>
            {getDocumentoInfo.dataDocumento && (
              <span>
                Data do {tipo === "D" ? "documento" : tipo === "E" ? "exame" : "receita"}:{" "}
                {formatarData(getDocumentoInfo.dataDocumento)}
              </span>
            )}
          </div>
        </div>
        {getDocumentoInfo.meta}
      </div>
      <div className="documento-actions">
        <button
          className="btn-action"
          onClick={() => onVisualizar(documento.documento.id, tipo)}
          title="Visualizar"
        >
          <FaEye />
        </button>
        <button
          className="btn-action primary"
          onClick={() => onAlterar(tipo, documento[tipo.toLowerCase()]?.id)}
          title="Alterar"
        >
          <FaEdit />
        </button>
        <button
          className="btn-action danger"
          onClick={() => onDeletar(documento.documento.id, tipo)}
          title="Deletar"
        >
          <FaTrash />
        </button>
      </div>
    </li>
  );
};

// Componente Principal
export default function ListarDocumentos() {
  const [documentosDetalhados, setDocumentosDetalhados] = useState({
    DocumentosClinicos: [],
    Exames: [],
    Receitas: [],
  });
  const [documentosFiltrados, setDocumentosFiltrados] = useState({
    DocumentosClinicos: [],
    Exames: [],
    Receitas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [paciente, setPaciente] = useState(null);
  const [filtros, setFiltros] = useState({
    texto: "",
    tipo: "todos",
    dataInicio: null,
    dataFim: null,
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [paginacao, setPaginacao] = useState({
    paginaAtual: 1,
    itensPorPagina: 10,
  });
  const [ordenacao, setOrdenacao] = useState({
    campo: "dataUpload",
    direcao: "desc",
  });
  const [confirmationModal, setConfirmationModal] = useState({
    show: false,
    message: "",
    onConfirm: null,
    tipoDocumento: "",
    loading: false,
  });

  const navigate = useNavigate();
  const abortControllerRef = useRef(null);

  ReactModal.setAppElement("#root");

  // Helpers
  const showNotification = useCallback((message, type = "info") => {
    setNotification({ show: true, message, type });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification({ show: false, message: "", type: "" });
  }, []);

  const closeModal = useCallback(() => {
    setConfirmationModal((prev) => ({
      ...prev,
      show: false,
      message: "",
      onConfirm: null,
      tipoDocumento: "",
      loading: false,
    }));
  }, []);

  const showConfirmationModal = useCallback((message, onConfirm, tipoDocumento) => {
    setConfirmationModal({
      show: true,
      message,
      onConfirm,
      tipoDocumento,
      loading: false,
    });
  }, []);

  const getTipoNome = useCallback((tipo) => {
    switch (tipo) {
      case "D": return "Documento Clínico";
      case "E": return "Exame";
      case "R": return "Receita";
      default: return "Documento";
    }
  }, []);

  // Buscar paciente
  useEffect(() => {
    const stored = localStorage.getItem("paciente");
    if (stored) {
      setPaciente(JSON.parse(stored));
    } else {
      setError("Paciente não encontrado.");
      setLoading(false);
    }
  }, []);

  // Buscar documentos
  useEffect(() => {
    if (!paciente?.id) return;

    abortControllerRef.current = new AbortController();

    const buscarDocumentosDetalhados = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await DocumentoService.getPorPacienteAgrupado(paciente.id);

        const processDocumento = async (doc, tipo, service, mapper) => {
          try {
            const detalhes = await service(doc.id);
            const dados = Array.isArray(detalhes.data) ? detalhes.data[0] : detalhes.data;
            return mapper(doc, dados);
          } catch (err) {
            console.error(`Erro ao carregar ${tipo}:`, err);
            return null;
          }
        };

        const docs = {
          DocumentosClinicos: (await Promise.all(
            response.data
              .filter((doc) => doc.tipoDocumento === "D")
              .map((doc) => processDocumento(
                doc,
                "D",
                DocumentoClinicoService.getDocumentoClinicoByDocumentoId,
                (doc, dados) => ({
                  paciente: { id: doc.paciente?.id, nome: doc.paciente?.nome, cpf: doc.paciente?.cpf, dataNascimento: doc.paciente?.dataNascimento, sexo: doc.paciente?.sexo },
                  documento: { id: doc.id, tipo: "D", tipoDocumento: doc.tipoDocumento, status: doc.status, dataUpload: doc.dataUpload, data: new Date(doc.dataUpload) },
                  clinico: { id: dados?.id, tipoDoc: dados?.tipo || "Documento Clínico", dataDocumentoCli: dados?.dataDocumentoCli, medico: dados?.medico, crm: dados?.crmMedico, especialidade: dados?.especialidade, conteudo: dados?.conteudo, observacoes: dados?.observacoes, imagem: dados?.imagem, resumo: dados?.resumo, conclusoes: dados?.conclusoes },
                  titulo: `Consulta ${formatarData(doc.dataUpload)}`,
                })
              ))
          )).filter(Boolean),

          Exames: (await Promise.all(
            response.data
              .filter((doc) => doc.tipoDocumento === "E")
              .map((doc) => processDocumento(
                doc,
                "E",
                ExameService.getExameByDocumentoId,
                (doc, dados) => ({
                  paciente: { id: doc.paciente?.id, nome: doc.paciente?.nome, cpf: doc.paciente?.cpf, dataNascimento: doc.paciente?.dataNascimento, sexo: doc.paciente?.sexo },
                  documento: { id: doc.id, tipo: "E", tipoDocumento: doc.tipoDocumento, status: doc.status, dataUpload: doc.dataUpload, data: new Date(doc.dataUpload) },
                  exame: { id: dados?.id, nomeExame: dados?.nomeExame, laboratorio: dados?.laboratorio, dataExame: dados?.dataExame, resultado: dados?.resultado, observacoes: dados?.observacoes, imagem: dados?.imagem },
                  titulo: dados?.nomeExame || "Exame Clínico",
                })
              ))
          )).filter(Boolean),

          Receitas: (await Promise.all(
            response.data
              .filter((doc) => doc.tipoDocumento === "R")
              .map((doc) => processDocumento(
                doc,
                "R",
                ReceitaService.getReceitaByDocumentoId,
                (doc, dados) => ({
                  paciente: { id: doc.paciente?.id, nome: doc.paciente?.nome, cpf: doc.paciente?.cpf, dataNascimento: doc.paciente?.dataNascimento, sexo: doc.paciente?.sexo },
                  documento: { id: doc.id, tipo: "R", tipoDocumento: doc.tipoDocumento, status: doc.status, dataUpload: doc.dataUpload, data: new Date(doc.dataUpload) },
                  receita: { id: dados?.id, medico: dados?.medico || "Dr. Não Especificado", crm: dados?.crmMedico, dataReceita: dados?.dataReceita, medicamentos: dados?.medicamentos, observacoes: dados?.observacoes, validade: dados?.validade },
                  titulo: `Receita ${formatarData(doc.dataUpload)}`,
                })
              ))
          )).filter(Boolean),
        };

        setDocumentosDetalhados(docs);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Erro ao carregar documentos:", err);
          setError("Erro ao carregar documentos. Tente novamente.");
          showNotification("Erro ao carregar documentos", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    buscarDocumentosDetalhados();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [paciente, showNotification]);

  // Aplicar filtros (memoizado)
  const aplicarFiltros = useCallback(() => {
    const { texto, tipo, dataInicio, dataFim } = filtros;

    const filtrarPorTexto = (doc) => {
      if (!texto) return true;
      const searchText = texto.toLowerCase();
      return (
        (doc.titulo?.toLowerCase().includes(searchText)) ||
        (doc.clinico?.medico?.toLowerCase().includes(searchText)) ||
        (doc.clinico?.tipoDoc?.toLowerCase().includes(searchText)) ||
        (doc.exame?.laboratorio?.toLowerCase().includes(searchText)) ||
        (doc.receita?.medico?.toLowerCase().includes(searchText))
      );
    };

    const filtrarPorTipo = (doc) => tipo === "todos" || doc.documento.tipo === tipo;

    const filtrarPorData = (doc) => {
      if (!dataInicio && !dataFim) return true;
      const docDate = new Date(doc.documento.dataUpload);
      if (dataInicio && !dataFim) return docDate >= dataInicio;
      if (!dataInicio && dataFim) return docDate <= dataFim;
      return docDate >= dataInicio && docDate <= dataFim;
    };

    const ordenarDocumentos = (documentos) => {
      return [...documentos].sort((a, b) => {
        let comparacao = 0;
        if (ordenacao.campo === "dataUpload") {
          comparacao = new Date(a.documento.dataUpload) - new Date(b.documento.dataUpload);
        } else if (ordenacao.campo === "tipo") {
          comparacao = a.documento.tipo.localeCompare(b.documento.tipo);
        } else if (ordenacao.campo === "medico") {
          const medicoA = a.clinico?.medico || a.receita?.medico || "";
          const medicoB = b.clinico?.medico || b.receita?.medico || "";
          comparacao = medicoA.localeCompare(medicoB);
        }
        return ordenacao.direcao === "asc" ? comparacao : -comparacao;
      });
    };

    const filtered = {
      DocumentosClinicos: documentosDetalhados.DocumentosClinicos.filter(
        (doc) => filtrarPorTexto(doc) && filtrarPorTipo(doc) && filtrarPorData(doc)
      ),
      Exames: documentosDetalhados.Exames.filter(
        (doc) => filtrarPorTexto(doc) && filtrarPorTipo(doc) && filtrarPorData(doc)
      ),
      Receitas: documentosDetalhados.Receitas.filter(
        (doc) => filtrarPorTexto(doc) && filtrarPorTipo(doc) && filtrarPorData(doc)
      ),
    };

    const sorted = {
      DocumentosClinicos: ordenarDocumentos(filtered.DocumentosClinicos),
      Exames: ordenarDocumentos(filtered.Exames),
      Receitas: ordenarDocumentos(filtered.Receitas),
    };

    const paginated = {
      DocumentosClinicos: sorted.DocumentosClinicos.slice(
        (paginacao.paginaAtual - 1) * paginacao.itensPorPagina,
        paginacao.paginaAtual * paginacao.itensPorPagina
      ),
      Exames: sorted.Exames.slice(
        (paginacao.paginaAtual - 1) * paginacao.itensPorPagina,
        paginacao.paginaAtual * paginacao.itensPorPagina
      ),
      Receitas: sorted.Receitas.slice(
        (paginacao.paginaAtual - 1) * paginacao.itensPorPagina,
        paginacao.paginaAtual * paginacao.itensPorPagina
      ),
    };

    setDocumentosFiltrados(paginated);
  }, [filtros, documentosDetalhados, ordenacao, paginacao]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const limparFiltros = useCallback(() => {
    setFiltros({
      texto: "",
      tipo: "todos",
      dataInicio: null,
      dataFim: null,
    });
    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
    setMostrarFiltros(false);
  }, []);

  const handleVisualizar = useCallback(async (documentoId, tipo) => {
    try {
      let documento;
      const services = {
        R: ReceitaService.getReceitaByDocumentoId,
        E: ExameService.getExameByDocumentoId,
        D: DocumentoClinicoService.getDocumentoClinicoByDocumentoId,
      };
      const res = await services[tipo](documentoId);
      documento = Array.isArray(res.data) ? res.data[0] : res.data;
      navigate("/visualizar-documento", { state: { documento, tipo } });
    } catch (err) {
      console.error("Erro ao visualizar documento:", err);
      showNotification("Erro ao carregar o documento", "error");
    }
  }, [navigate, showNotification]);

  const handleAlterar = useCallback((tipo, id) => {
    navigate("/editar-documento", { state: { tipo, id } });
  }, [navigate]);

  const handleDeletar = useCallback(async (documentoId, tipo) => {
    showConfirmationModal(
      `Tem certeza que deseja deletar este ${getTipoNome(tipo)}?`,
      async () => {
        setConfirmationModal((prev) => ({ ...prev, loading: true }));
        try {
          const response = await DocumentoService.deleteDocumento(documentoId, tipo);
          if (response.success) {
            setDocumentosDetalhados((prev) => ({
              DocumentosClinicos: prev.DocumentosClinicos.filter(
                (doc) => doc.documento.id !== documentoId
              ),
              Exames: prev.Exames.filter((doc) => doc.documento.id !== documentoId),
              Receitas: prev.Receitas.filter((doc) => doc.documento.id !== documentoId),
            }));
            showNotification(`${getTipoNome(tipo)} deletado com sucesso`, "success");
            closeModal();
          } else {
            showNotification(response.message || `Erro ao deletar ${getTipoNome(tipo)}`, "error");
          }
        } catch (err) {
          console.error("Erro ao deletar documento:", err);
          showNotification(`Erro ao deletar ${getTipoNome(tipo)}`, "error");
        } finally {
          setConfirmationModal((prev) => ({ ...prev, loading: false }));
        }
      },
      tipo
    );
  }, [showConfirmationModal, getTipoNome, showNotification, closeModal]);

  const totalDocumentos = useMemo(() => 
    documentosDetalhados.DocumentosClinicos.length +
    documentosDetalhados.Exames.length +
    documentosDetalhados.Receitas.length
  , [documentosDetalhados]);

  const totalDocumentosFiltrados = useMemo(() =>
    documentosFiltrados.DocumentosClinicos.length +
    documentosFiltrados.Exames.length +
    documentosFiltrados.Receitas.length
  , [documentosFiltrados]);

  const hasFiltersApplied = useMemo(() =>
    filtros.texto !== "" ||
    filtros.tipo !== "todos" ||
    filtros.dataInicio !== null ||
    filtros.dataFim !== null
  , [filtros]);

  return (
    <div className="prontuario-container">
      <Toast
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />

      <ConfirmationModal
        show={confirmationModal.show}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onClose={closeModal}
        loading={confirmationModal.loading}
      />

      <div className="content">
        <div className="header-with-actions">
          <h1 className="title">Documentos</h1>
          <div className="header-actions">
            <span className="documentos-count">
              {totalDocumentosFiltrados} de {totalDocumentos} documentos
            </span>
            <div className="action-buttons">
              <button className="btn-processar" onClick={() => navigate("/upload-documentos")}>
                <FaFileUpload /> Processar Novo Documento
              </button>
              <button className={`btn-filter ${mostrarFiltros ? "active" : ""}`} onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                <FaFilter /> {mostrarFiltros ? "Ocultar Filtros" : "Mostrar Filtros"}
              </button>
            </div>
          </div>
        </div>

        {mostrarFiltros && (
          <div className="filtros-container">
            <div className="filtro-group">
              <label htmlFor="texto">Buscar:</label>
              <div className="search-input">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  id="texto"
                  placeholder="Pesquisar por título, médico, etc..."
                  value={filtros.texto}
                  onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                />
              </div>
            </div>

            <div className="filtro-group">
              <label htmlFor="tipo">Tipo de Documento:</label>
              <select
                id="tipo"
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              >
                <option value="todos">Todos</option>
                <option value="D">Documentos Clínicos</option>
                <option value="E">Exames</option>
                <option value="R">Receitas</option>
              </select>
            </div>

            <div className="filtro-group">
              <label>Período:</label>
              <div className="date-range">
                <DatePicker
                  selected={filtros.dataInicio}
                  onChange={(date) => setFiltros({ ...filtros, dataInicio: date })}
                  selectsStart
                  startDate={filtros.dataInicio}
                  endDate={filtros.dataFim}
                  placeholderText="Data inicial"
                  className="date-input"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
                <span>até</span>
                <DatePicker
                  selected={filtros.dataFim}
                  onChange={(date) => setFiltros({ ...filtros, dataFim: date })}
                  selectsEnd
                  startDate={filtros.dataInicio}
                  endDate={filtros.dataFim}
                  minDate={filtros.dataInicio}
                  placeholderText="Data final"
                  className="date-input"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </div>
            </div>

            <button className="btn-limpar" onClick={limparFiltros} disabled={!hasFiltersApplied}>
              Limpar Filtros
            </button>
          </div>
        )}

        <div className="controles-avancados">
          <div className="ordenacao">
            <label>Ordenar por:</label>
            <select value={ordenacao.campo} onChange={(e) => setOrdenacao({ ...ordenacao, campo: e.target.value })}>
              <option value="dataUpload">Data</option>
              <option value="tipo">Tipo</option>
              <option value="medico">Médico</option>
            </select>
            <button
              onClick={() => setOrdenacao({ ...ordenacao, direcao: ordenacao.direcao === "asc" ? "desc" : "asc" })}
              className="btn-ordenacao"
            >
              {ordenacao.direcao === "asc" ? <FaSortUp /> : <FaSortDown />}
            </button>
          </div>

          <div className="paginacao">
            <button
              disabled={paginacao.paginaAtual === 1}
              onClick={() => setPaginacao({ ...paginacao, paginaAtual: paginacao.paginaAtual - 1 })}
              className="btn-paginacao"
            >
              Anterior
            </button>
            <span>Página {paginacao.paginaAtual}</span>
            <button
              onClick={() => setPaginacao({ ...paginacao, paginaAtual: paginacao.paginaAtual + 1 })}
              className="btn-paginacao"
              disabled={paginacao.paginaAtual * paginacao.itensPorPagina >= totalDocumentosFiltrados}
            >
              Próxima
            </button>
          </div>
        </div>

        {loading && <LoadingSpinner />}

        {error && <ErrorDisplay error={error} onRetry={() => window.location.reload()} />}

        {!loading && !error && totalDocumentosFiltrados === 0 && (
          <EmptyState hasDocuments={totalDocumentos > 0} onClearFilters={limparFiltros} />
        )}

        <div className="documentos-wrapper">
          {documentosFiltrados.DocumentosClinicos.length > 0 && (
            <section className="documentos-section">
              <h2>
                <FaFileAlt className="icon" /> Documentos Clínicos
                <span className="badge">{documentosFiltrados.DocumentosClinicos.length}</span>
              </h2>
              <ul className="documentos-list">
                {documentosFiltrados.DocumentosClinicos.map((doc) => (
                  <DocumentoItem
                    key={`D-${doc.documento.id}`}
                    documento={doc}
                    tipo="D"
                    onVisualizar={handleVisualizar}
                    onAlterar={handleAlterar}
                    onDeletar={handleDeletar}
                  />
                ))}
              </ul>
            </section>
          )}

          {documentosFiltrados.Exames.length > 0 && (
            <section className="documentos-section">
              <h2>
                <FaVials className="icon" /> Exames
                <span className="badge">{documentosFiltrados.Exames.length}</span>
              </h2>
              <ul className="documentos-list">
                {documentosFiltrados.Exames.map((doc) => (
                  <DocumentoItem
                    key={`E-${doc.documento.id}`}
                    documento={doc}
                    tipo="E"
                    onVisualizar={handleVisualizar}
                    onAlterar={handleAlterar}
                    onDeletar={handleDeletar}
                  />
                ))}
              </ul>
            </section>
          )}

          {documentosFiltrados.Receitas.length > 0 && (
            <section className="documentos-section">
              <h2>
                <FaPrescriptionBottle className="icon" /> Receitas
                <span className="badge">{documentosFiltrados.Receitas.length}</span>
              </h2>
              <ul className="documentos-list">
                {documentosFiltrados.Receitas.map((doc) => (
                  <DocumentoItem
                    key={`R-${doc.documento.id}`}
                    documento={doc}
                    tipo="R"
                    onVisualizar={handleVisualizar}
                    onAlterar={handleAlterar}
                    onDeletar={handleDeletar}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}