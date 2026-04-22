import React, { useState, useEffect } from "react";
import { Form, Spinner, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ReceitaService from "../../services/ReceitaService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance from '../../axiosConfig';
import {
  FaPills,
  FaCalendarAlt,
  FaUserMd,
  FaSave,
  FaTimes,
  FaStickyNote,
} from "react-icons/fa";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";


import '../../styles/components/DocumentoForm.css';

const ReceitaForm = ({ data: initialData, isLoading = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  };

  const handleDateChange = (date) => {
    setData(prev => ({ ...prev, dataReceita: date }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      alert("Erro ao salvar receita. Por favor, tente novamente.");
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
          <h2 className="mb-0 fs-5 fw-bold">Editar Receita Médica</h2>
        </div>

        <div className="card-body py-3">
          {isLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary" />
              <p className="mt-2 mb-0">Carregando receita...</p>
            </div>
          )}

          {data.imagem && (
            <div
              className="border-top bg-light mb-3"
              style={{ height: "350px", overflow: "hidden" }}
            >
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={5}
                wheel={{ step: 0.1 }}
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
                    src={`${urlBase}/api/receitas/imagem/${data.id}`}
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

          <Form onSubmit={handleUpdate}>
            <div style={{ opacity: isLoading ? 0.5 : 1 }}>
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <Form.Group controlId="medico">
                    <Form.Label className="fw-semibold small">
                      <FaUserMd className="me-2 text-primary" /> Médico
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="medico"
                      value={data.medico}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      placeholder="Nome do médico"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="dataReceita">
                    <Form.Label className="fw-semibold small">
                      <FaCalendarAlt className="me-2 text-primary" /> Data
                    </Form.Label>
                    <DatePicker
                      selected={data.dataReceita}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      disabled={isLoading || loading}
                      required
                      className="form-control"
                      placeholderText="Selecione a data"
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="crmMedico">
                    <Form.Label className="fw-semibold small">CRM</Form.Label>
                    <Form.Control
                      type="text"
                      name="crmMedico"
                      value={data.crmMedico}
                      onChange={handleChange}
                      required
                      disabled={isLoading || loading}
                      placeholder="Número do CRM"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group controlId="observacoes">
                    <Form.Label className="fw-semibold small">
                      <FaStickyNote className="me-2 text-primary" />
                      Notas
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="observacoes"
                      value={data.observacoes}
                      onChange={handleChange}
                      disabled={isLoading || loading}
                      placeholder="Observações adicionais"
                    />
                  </Form.Group>
                </Col>

                <Form.Group controlId="resumo">
                  <Form.Label className="fw-semibold small">
                    <FaStickyNote className="me-2 text-primary" /> Resumo
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={7}
                    name="resumo"
                    value={data.resumo}
                    onChange={handleChange}
                    disabled={isLoading || loading}
                    placeholder="Resumo da receita"
                  />
                </Form.Group>
              </Row>

              <div className="border-top pt-3 mt-2">
                <h5 className="mb-3 fs-5 fw-bold">
                  <FaPills className="me-2 text-primary" /> Medicamentos
                </h5>

                {data.medicamentos.length > 0 && (
                  <div className="mb-3">
                    {data.medicamentos.map((m) => (
                      <div key={m.id} className="border rounded p-3 mb-3">
                        <Row className="g-3 align-items-center">
                          <Col md={5}>
                            <Form.Group>
                              <Form.Label className="small text-muted mb-1">
                                Nome do Medicamento
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="nome"
                                value={m.nome}
                                onChange={(e) => {
                                  const updatedMeds = data.medicamentos.map(
                                    (med) =>
                                      med.id === m.id
                                        ? { ...med, nome: e.target.value }
                                        : med
                                  );
                                  setData({
                                    ...data,
                                    medicamentos: updatedMeds,
                                  });
                                }}
                                required
                              />
                            </Form.Group>
                          </Col>

                          <Col md={3}>
                            <Form.Group>
                              <Form.Label className="small text-muted mb-1">
                                Quantidade
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="quantidade"
                                value={m.quantidade}
                                onChange={(e) => {
                                  const updatedMeds = data.medicamentos.map(
                                    (med) =>
                                      med.id === m.id
                                        ? { ...med, quantidade: e.target.value }
                                        : med
                                  );
                                  setData({
                                    ...data,
                                    medicamentos: updatedMeds,
                                  });
                                }}
                                required
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="small text-muted mb-1">
                                Forma de Uso
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="formaDeUso"
                                value={m.formaDeUso}
                                onChange={(e) => {
                                  const updatedMeds = data.medicamentos.map(
                                    (med) =>
                                      med.id === m.id
                                        ? { ...med, formaDeUso: e.target.value }
                                        : med
                                  );
                                  setData({
                                    ...data,
                                    medicamentos: updatedMeds,
                                  });
                                }}
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-center gap-3 mt-4 pt-3 border-top">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={loading || isLoading}
                >
                  <FaTimes className="me-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || isLoading}
                  style={{ minWidth: "200px" }}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ReceitaForm;