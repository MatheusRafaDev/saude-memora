// ReceitaForm.jsx - Versão simplificada com o novo estilo
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import ReceitaService from "../../services/ReceitaService";
import ptBR from 'date-fns/locale/pt-BR';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import axiosInstance from '../../axiosConfig';
import '../../styles/components/DocumentoForm.css';

import {
  FaPills,
  FaCalendarAlt,
  FaUserMd,
  FaSave,
  FaTimes,
  FaStickyNote,
  FaEdit,
  FaTrash,
  FaSearchPlus,
  FaSearchMinus,
  FaUndo,
} from "react-icons/fa";

registerLocale('pt-BR', ptBR);

const ReceitaForm = ({ data: initialData, isLoading = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const urlBase = axiosInstance.defaults.baseURL;
  const [data, setData] = useState({
    id: null,
    dataReceita: null,
    medico: "",
    crmMedico: "",
    observacoes: "",
    medicamentos: [],
    resumo: "",
    imagem: null,
    tipo: "receitas",
  });

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

  useEffect(() => {
    if (initialData) {
      setData({
        id: initialData.id || null,
        dataReceita: parseDateString(initialData.dataReceita),
        imagem: initialData.imagem || null,
        medico: initialData.medico || "",
        crmMedico: initialData.crmMedico || "",
        observacoes: initialData.observacoes || "",
        medicamentos: initialData.medicamentos || [],
        resumo: initialData.resumo || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleDateChange = (date) => {
    setData(prev => ({ ...prev, dataReceita: date }));
    setError(null);
  };

  const handleMedicamentoChange = (index, field, value) => {
    const updatedMeds = [...data.medicamentos];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setData(prev => ({ ...prev, medicamentos: updatedMeds }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dataToSend = {
        ...data,
        dataReceita: formatDateForBackend(data.dataReceita),
        medicamentos: data.medicamentos.map((med) => ({
          id: med.id || null,
          nome: med.nome || "",
          quantidade: med.quantidade || "",
          formaDeUso: med.formaDeUso || "",
        })),
      };

      await ReceitaService.update(dataToSend.id, dataToSend);
      navigate("/meus-documentos");
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      setError(error.message || "Erro ao salvar receita");
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
              <FaPills className="doc-header-icon" />
              Editar Receita Médica
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
                        src={`${urlBase}/api/receitas/imagem/${data.id}`}
                        alt="Imagem da receita"
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
                  {isLoading ? "Carregando receita..." : "Salvando alterações..."}
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
                      <FaUserMd className="doc-label-icon" /> Médico
                    </label>
                    <input
                      type="text"
                      name="medico"
                      value={data.medico}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Nome do médico"
                    />
                  </div>

                  <div className="doc-field">
                    <label className="doc-label">
                      <FaCalendarAlt className="doc-label-icon" /> Data
                    </label>
                    <DatePicker
                      selected={data.dataReceita}
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

                  <div className="doc-field">
                    <label className="doc-label">CRM do Médico</label>
                    <input
                      type="text"
                      name="crmMedico"
                      value={data.crmMedico}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      className="doc-input"
                      placeholder="Número do CRM"
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
                      rows={4}
                      name="resumo"
                      value={data.resumo}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      className="doc-textarea"
                      placeholder="Resumo da receita..."
                    />
                  </div>
                </div>

                {/* Seção de Medicamentos */}
                <div className="doc-meds-section">
                  <div className="doc-meds-header">
                    <h5 className="doc-meds-title">
                      <FaPills className="doc-meds-title-icon" />
                      Medicamentos
                    </h5>
                  </div>

                  {data.medicamentos.length === 0 ? (
                    <div className="doc-alert doc-alert-info">
                      <FaPills />
                      <span>Nenhum medicamento cadastrado nesta receita.</span>
                    </div>
                  ) : (
                    data.medicamentos.map((med, index) => (
                      <div key={med.id || index} className="doc-med-card">
                        <div className="doc-med-grid">
                          <div className="doc-med-field">
                            <span className="doc-med-label">Medicamento</span>
                            <input
                              type="text"
                              value={med.nome}
                              onChange={(e) => handleMedicamentoChange(index, 'nome', e.target.value)}
                              className="doc-input"
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                          <div className="doc-med-field">
                            <span className="doc-med-label">Quantidade</span>
                            <input
                              type="text"
                              value={med.quantidade}
                              onChange={(e) => handleMedicamentoChange(index, 'quantidade', e.target.value)}
                              className="doc-input"
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                          <div className="doc-med-field">
                            <span className="doc-med-label">Forma de Uso</span>
                            <input
                              type="text"
                              value={med.formaDeUso}
                              onChange={(e) => handleMedicamentoChange(index, 'formaDeUso', e.target.value)}
                              className="doc-input"
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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

export default ReceitaForm;