import React, { useState, useEffect } from "react";
import { Form, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ExameService from "../../services/ExameService";
import axiosInstance from '../../axiosConfig';
import '../../styles/components/DocumentoForm.css';

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  FaCalendarAlt,
  FaFlask,
  FaFileMedical,
  FaEdit,
  FaArrowLeft,
  FaMicroscope,
  FaSave,
  FaStickyNote,
  FaTimes,
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
  };

  const handleDateChange = (date) => {
    setData(prev => ({ ...prev, dataExame: date }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { id, imagem, ...dados } = data;

      if (dados.dataExame) {
        dados.dataExame = formatDateForBackend(dados.dataExame);
      }

      await ExameService.update(id, dados);
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
        <div className="card-header d-flex align-items-center justify-content-between bg-white border-bottom py-3">
          <h2 className="mb-0 fs-5 fw-bold">Editar Exame</h2>
        </div>

        {data.imagem && (
          <div
            className="border-top bg-light"
            style={{
              height: "350px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={5}
              wheel={{ step: 0.1 }}
              doubleClick={{ disabled: true }}
            >
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
                  className="img-fluid rounded shadow"
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                    cursor: "grab",
                  }}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
        )}

        <div className="card-body">
          {isLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary" />
              <p className="mt-2 mb-0 fs-5">Carregando exame...</p>
            </div>
          )}

          <Form onSubmit={handleUpdate}>
            <div className="row g-3" style={{ opacity: isLoading ? 0.5 : 1 }}>
              <div className="col-md-6">
                <Form.Group controlId="nomeExame">
                  <Form.Label className="fw-semibold">
                    <FaFileMedical className="me-1 text-primary" /> Nome do Exame
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="nomeExame"
                    value={data.nomeExame}
                    onChange={handleChange}
                    required
                    disabled={isLoading || loading}
                    placeholder="Digite o nome do exame"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group controlId="tipo">
                  <Form.Label className="fw-semibold">
                    <FaFlask className="me-1 text-primary" /> Tipo de Exame
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="tipo"
                    value={data.tipo}
                    onChange={handleChange}
                    required
                    disabled={isLoading || loading}
                    placeholder="Informe o tipo do exame"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group controlId="laboratorio">
                  <Form.Label className="fw-semibold">
                    <FaMicroscope className="me-1 text-primary" /> Laboratório
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="laboratorio"
                    value={data.laboratorio}
                    onChange={handleChange}
                    required
                    disabled={isLoading || loading}
                    placeholder="Nome do laboratório"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group controlId="dataExame">
                  <Form.Label className="fw-semibold">
                    <FaCalendarAlt className="me-1 text-primary" /> Data do Exame
                  </Form.Label>
                  <DatePicker
                    selected={data.dataExame}
                    onChange={handleDateChange}
                    className="form-control"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/AAAA"
                    required
                    disabled={isLoading || loading}
                    locale="pt-BR"
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group controlId="observacoes">
                  <Form.Label className="fw-semibold">
                    <FaStickyNote className="me-1 text-primary" /> Observações
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observacoes"
                    value={data.observacoes}
                    onChange={handleChange}
                    disabled={isLoading || loading}
                    placeholder="Adicione observações relevantes..."
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group controlId="resultado">
                  <Form.Label className="fw-semibold">
                    <FaFlask className="me-1 text-primary" /> Resultado
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="resultado"
                    value={data.resultado}
                    onChange={handleChange}
                    required
                    disabled={isLoading || loading}
                    style={{ minHeight: "150px" }}
                    placeholder="Informe o resultado do exame"
                  />
                </Form.Group>
              </div>

              <div className="col-12">
                <Form.Group controlId="resumo">
                  <Form.Label className="fw-semibold">
                    <FaStickyNote className="me-1 text-primary" /> Resumo
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="resumo"
                    value={data.resumo}
                    onChange={handleChange}
                    disabled={isLoading || loading}
                    placeholder="Resumo geral do exame..."
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

export default ExameForm;