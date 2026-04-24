// DocumentoClinicoForm.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import DocumentoClinicoService from "../../services/DocumentoClinicoService";
import ptBR from 'date-fns/locale/pt-BR';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import axiosInstance from '../../axiosConfig';
import '../../styles/components/DocumentoForm.css';

import {
  FaFileMedical,
  FaCalendarAlt,
  FaUserMd,
  FaSave,
  FaTimes,
  FaStickyNote,
  FaInfoCircle,
  FaSearchPlus,
  FaSearchMinus,
  FaUndo,
} from "react-icons/fa";

registerLocale('pt-BR', ptBR);

const documentoClinicoModel = {
  id: null,
  tipo: "",
  medico: "",
  dataDocumentoCli: null,
  observacoes: "",
  imagem: null,
  resumo: "",
  conclusoes: "",
  conteudo: "",
  especialidade: "",
};

const parseDateString = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    return new Date(dateString.getTime() + dateString.getTimezoneOffset() * 60000);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  return null;
};

const formatDateForBackend = (date) => {
  const d = parseDateString(date);
  if (!d) return "";
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DocumentoClinicoForm = ({ data: initialData, isLoading = false }) => {
  const [data, setData] = useState(documentoClinicoModel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const urlBase = axiosInstance.defaults.baseURL;

  useEffect(() => {
    if (initialData) {
      setData({
        ...documentoClinicoModel,
        ...initialData,
        dataDocumentoCli: initialData.dataDocumentoCli 
          ? parseDateString(initialData.dataDocumentoCli) 
          : null
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleDateChange = (date) => {
    setData(prev => ({ ...prev, dataDocumentoCli: date }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const documentoToSave = {
        ...data,
        dataDocumentoCli: data.dataDocumentoCli ? formatDateForBackend(data.dataDocumentoCli) : null
      };
      await DocumentoClinicoService.update(documentoToSave.id, documentoToSave);
      navigate("/meus-documentos");
    } catch (error) {
      console.error("Falha na atualização:", error);
      setError(error.message || "Erro ao atualizar documento");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/meus-documentos");
  };

  return (
    <div className="doc-page">
      <div className="doc-container">
        <div className="doc-card">
          <div className="doc-header">
            <h2>
              <FaFileMedical className="doc-header-icon" />
              {data.id ? "Editar Documento Clínico" : "Novo Documento Clínico"}
            </h2>
          </div>

          {data.imagem && (
            <div className="doc-image-area">
              <TransformWrapper initialScale={1} minScale={1} maxScale={5} wheel={{ step: 0.1 }}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <TransformComponent
                      wrapperStyle={{ width: "100%", height: "100%" }}
                      contentStyle={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={`${urlBase}/api/documentosclinicos/imagem/${data.id}`}
                        alt="Imagem do documento"
                        className="doc-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/imagem-padrao.png";
                        }}
                      />
                    </TransformComponent>
                    <div className="doc-zoom-controls">
                      <button className="doc-zoom-btn" onClick={() => zoomIn()} title="Aproximar">
                        <FaSearchPlus />
                      </button>
                      <button className="doc-zoom-btn" onClick={() => zoomOut()} title="Afastar">
                        <FaSearchMinus />
                      </button>
                      <button className="doc-zoom-btn" onClick={() => resetTransform()} title="Resetar">
                        <FaUndo />
                      </button>
                    </div>
                  </>
                )}
              </TransformWrapper>
            </div>
          )}

          <div className="doc-body">
            {(isLoading || loading) && (
              <div className="doc-loading">
                <div className="doc-loading-spinner"></div>
                <p className="doc-loading-text">
                  {isLoading ? "Carregando documento..." : "Salvando alterações..."}
                </p>
              </div>
            )}

            {error && (
              <div className="doc-alert doc-alert-error">
                <FaTimes />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ opacity: (isLoading || loading) ? 0.5 : 1, pointerEvents: (isLoading || loading) ? 'none' : 'auto' }}>
                <div className="doc-form-grid">
                  <div className="doc-field">
                    <label className="doc-label">
                      <FaFileMedical className="doc-label-icon" /> Tipo de Documento
                    </label>
                    <input
                      type="text"
                      name="tipo"
                      value={data.tipo}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Ex: Consulta, Atestado, Laudo"
                    />
                  </div>

                  <div className="doc-field">
                    <label className="doc-label">
                      <FaUserMd className="doc-label-icon" /> Médico
                    </label>
                    <input
                      type="text"
                      name="medico"
                      value={data.medico}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Nome do médico responsável"
                    />
                  </div>

                  <div className="doc-field">
                    <label className="doc-label">
                      <FaInfoCircle className="doc-label-icon" /> Especialidade
                    </label>
                    <input
                      type="text"
                      name="especialidade"
                      value={data.especialidade}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Ex: Cardiologia, Dermatologia"
                    />
                  </div>

                  <div className="doc-field">
                    <label className="doc-label">
                      <FaCalendarAlt className="doc-label-icon" /> Data
                    </label>
                    <DatePicker
                      selected={data.dataDocumentoCli}
                      onChange={handleDateChange}
                      className="doc-datepicker"
                      dateFormat="dd/MM/yyyy"
                      placeholderText="DD/MM/AAAA"
                      required
                      disabled={isLoading || loading}
                      locale="pt-BR"
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>

                  <div className="doc-field doc-field-full">
                    <label className="doc-label">Conclusões</label>
                    <textarea
                      rows={3}
                      name="conclusoes"
                      value={data.conclusoes}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      className="doc-textarea"
                      placeholder="Conclusões do documento clínico..."
                    />
                  </div>

                  <div className="doc-field doc-field-full">
                    <label className="doc-label">
                      <FaStickyNote className="doc-label-icon" /> Observações
                    </label>
                    <textarea
                      rows={3}
                      name="observacoes"
                      value={data.observacoes}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      className="doc-textarea"
                      placeholder="Observações adicionais..."
                    />
                  </div>

                  <div className="doc-field doc-field-full">
                    <label className="doc-label">Resumo</label>
                    <textarea
                      rows={5}
                      name="resumo"
                      value={data.resumo}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      className="doc-textarea"
                      placeholder="Resumo do documento..."
                    />
                  </div>
                </div>

                <div className="doc-actions">
                  <button
                    type="button"
                    className="doc-btn doc-btn-secondary"
                    onClick={handleCancel}
                    disabled={isLoading || loading}
                  >
                    <FaTimes />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="doc-btn doc-btn-primary"
                    disabled={isLoading || loading}
                  >
                    {loading ? (
                      <div className="doc-submit-spinner"></div>
                    ) : (
                      <FaSave />
                    )}
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentoClinicoForm;