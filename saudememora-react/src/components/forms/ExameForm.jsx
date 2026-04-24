// ExameForm.jsx - Refatorado com o novo estilo
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ptBR from "date-fns/locale/pt-BR";
import ExameService from "../../services/ExameService";
import axiosInstance from '../../axiosConfig';
import '../../styles/components/DocumentoForm.css';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import {
  FaCalendarAlt,
  FaFlask,
  FaFileMedical,
  FaMicroscope,
  FaSave,
  FaTimes,
  FaStickyNote,
  FaSearchPlus,
  FaSearchMinus,
  FaUndo,
} from "react-icons/fa";

registerLocale('pt-BR', ptBR);

const ExameForm = ({ data: initialData, isLoading = false }) => {
  const [data, setData] = useState({
    nomeExame: "",
    tipo: "",
    laboratorio: "",
    data: null,
    observacoes: "",
    resultado: "",
    resumo: "",
    id: null,
    imagem: null,
    dataExame: null,
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const urlBase = axiosInstance.defaults.baseURL;

  // Função para converter string de data em objeto Date
  const parseDateString = (dateString) => {
    if (!dateString) return null;
    
    if (dateString instanceof Date) {
      return new Date(
        dateString.getTime() + dateString.getTimezoneOffset() * 60000
      );
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString);
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
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

  useEffect(() => {
    if (initialData) {
      const dataExame = initialData.dataExame 
        ? parseDateString(initialData.dataExame)
        : null;

      setData({
        nomeExame: initialData.nomeExame || "",
        tipo: initialData.tipo || "",
        laboratorio: initialData.laboratorio || "",
        data: initialData.data ? parseDateString(initialData.data) : null,
        observacoes: initialData.observacoes || "",
        resultado: initialData.resultado || "",
        resumo: initialData.resumo || "",
        id: initialData.id || null,
        imagem: initialData.imagem || null,
        dataExame
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleDateChange = (date) => {
    setData(prev => ({ ...prev, dataExame: date }));
    setError(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { id, imagem, ...dados } = data;

      if (dados.dataExame) {
        dados.dataExame = formatDateForBackend(dados.dataExame);
      }

      await ExameService.update(id, dados);
      navigate("/meus-documentos");
    } catch (error) {
      console.error("Falha na atualização:", error);
      setError(error.message || "Erro ao atualizar exame");
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
              <FaFlask className="doc-header-icon" />
              Editar Exame
            </h2>
          </div>

          {data.imagem && (
            <div className="doc-image-area">
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={5}
                wheel={{ step: 0.1 }}
                doubleClick={{ disabled: true }}
              >
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
                        src={`${urlBase}/api/exames/imagem/${data.id}`}
                        alt="Imagem do exame"
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
                  {isLoading ? "Carregando exame..." : "Salvando alterações..."}
                </p>
              </div>
            )}

            {error && (
              <div className="doc-alert doc-alert-error">
                <FaTimes />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div style={{ opacity: (isLoading || loading) ? 0.5 : 1, pointerEvents: (isLoading || loading) ? 'none' : 'auto' }}>
                <div className="doc-form-grid">
                  <div className="doc-field">
                    <label className="doc-label">
                      <FaFileMedical className="doc-label-icon" /> Nome do Exame
                    </label>
                    <input
                      type="text"
                      name="nomeExame"
                      value={data.nomeExame}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Digite o nome do exame"
                    />
                  </div>

                  <div className="doc-field">
                    <label className="doc-label">
                      <FaFlask className="doc-label-icon" /> Tipo de Exame
                    </label>
                    <input
                      type="text"
                      name="tipo"
                      value={data.tipo}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Informe o tipo do exame"
                    />
                  </div>

                  <div className="doc-field">
                    <label className="doc-label">
                      <FaMicroscope className="doc-label-icon" /> Laboratório
                    </label>
                    <input
                      type="text"
                      name="laboratorio"
                      value={data.laboratorio}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Nome do laboratório"
                    />
                  </div>

                  <div className="doc-field">
                    <label className="doc-label">
                      <FaCalendarAlt className="doc-label-icon" /> Data do Exame
                    </label>
                    <DatePicker
                      selected={data.dataExame}
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
                      placeholder="Adicione observações relevantes..."
                    />
                  </div>

                  <div className="doc-field doc-field-full">
                    <label className="doc-label">
                      <FaFlask className="doc-label-icon" /> Resultado
                    </label>
                    <textarea
                      rows={6}
                      name="resultado"
                      value={data.resultado}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      className="doc-textarea"
                      style={{ minHeight: "150px" }}
                      placeholder="Informe o resultado do exame"
                    />
                  </div>

                  <div className="doc-field doc-field-full">
                    <label className="doc-label">
                      <FaStickyNote className="doc-label-icon" /> Resumo
                    </label>
                    <textarea
                      rows={4}
                      name="resumo"
                      value={data.resumo}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      className="doc-textarea"
                      placeholder="Resumo geral do exame..."
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

export default ExameForm;