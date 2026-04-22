import React, { useState, useEffect } from "react";
import { Form, Spinner, Button } from "react-bootstrap";
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
  FaFileAlt,
  FaFileMedical,
  FaCalendarAlt,
  FaUserMd,
  FaSave,
  FaTimes,
  FaStickyNote,
  FaInfoCircle,
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

const DocumentoClinicoForm = ({ data: initialData, isLoading = false }) => {
  const [data, setData] = useState(documentoClinicoModel);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const urlBase = axiosInstance.defaults.baseURL;

  useEffect(() => {
    if (initialData) {
      const mappedData = {
        ...documentoClinicoModel,
        ...initialData,
        dataDocumentoCli: initialData.dataDocumentoCli 
          ? parseDateString(initialData.dataDocumentoCli) 
          : null
      };
      setData(mappedData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setData(prev => ({ ...prev, dataDocumentoCli: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const documentoToSave = {
        ...data,
        dataDocumentoCli: data.dataDocumentoCli 
          ? formatDateForBackend(data.dataDocumentoCli) 
          : null
      };

      await DocumentoClinicoService.update(documentoToSave.id, documentoToSave);
      
      navigate("/meus-documentos");

    } catch (error) {
      console.error("Falha na atualização:", error);
      alert(`Erro ao atualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
      navigate("/meus-documentos");
  };

  return (
    <div className="mx-auto px-3" style={{ maxWidth: "900px" }}>
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3">
          <h2 className="mb-0 fs-5 fw-bold">
            {data.id ? "Editar Documento Clínico" : "Novo Documento Clínico"}
          </h2>
        </div>

        {data.imagem && (
          <div className="border-top bg-light" style={{ height: "350px", overflow: "hidden" }}>
            <TransformWrapper initialScale={1} minScale={1} maxScale={5} wheel={{ step: 0.1 }}>
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
                  className="img-fluid rounded shadow"
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                    cursor: "grab",
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/imagem-padrao.png";
                  }}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
        )}

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 mb-0 fs-5">Carregando documento...</p>
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="row g-3" style={{ opacity: isLoading ? 0.5 : 1 }}>

              <div className="col-md-6">
                <Form.Group controlId="tipo">
                  <Form.Label className="fw-semibold">
                    <FaFileMedical className="me-1 text-primary" /> Tipo de Documento
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="tipo"
                    value={data.tipo}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group controlId="medico">
                  <Form.Label className="fw-semibold">
                    <FaUserMd className="me-1 text-primary" /> Médico
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="medico"
                    value={data.medico}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group controlId="especialidade">
                  <Form.Label className="fw-semibold">
                    <FaInfoCircle className="me-1 text-primary" /> Especialidade
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="especialidade"
                    value={data.especialidade}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group controlId="dataDocumentoCli">
                  <Form.Label className="fw-semibold small">
                    <FaCalendarAlt className="me-2 text-primary" /> Data
                  </Form.Label>
                  <DatePicker
                    selected={data.dataDocumentoCli}
                    onChange={handleDateChange}
                    className="form-control"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/AAAA"
                    required
                    disabled={loading}
                    locale="pt-BR"
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group controlId="conclusoes">
                  <Form.Label className="fw-semibold">Conclusões</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="conclusoes"
                    value={data.conclusoes}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group controlId="observacoes">
                  <Form.Label className="fw-semibold">Observações</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observacoes"
                    value={data.observacoes}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group controlId="resumo">
                  <Form.Label className="fw-semibold">Resumo</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="resumo"
                    value={data.resumo}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-3 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading || isLoading}
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || isLoading}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  <FaSave className="me-2" />
                )}
                {loading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default DocumentoClinicoForm;