import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import formatarData from "../utils/formatarData";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import axiosInstance from "../axiosConfig";
import {
  FaCalendarAlt,
  FaFileAlt,
  FaUserMd,
  FaInfoCircle,
  FaStickyNote,
  FaDownload,
  FaFlask,
  FaNotesMedical,
  FaFileMedical,
  FaAward,
  FaPills,
  FaArrowLeft,
} from "react-icons/fa";
import "../styles/pages/VisualizadorDocumento.css";

const VisualizadorDocumento = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlBase = axiosInstance.defaults.baseURL;

  const documentoArray = location.state?.documento;
  const tipoDocumento = location.state?.tipo;

  const documento = Array.isArray(documentoArray)
    ? documentoArray[0]
    : documentoArray;

  useEffect(() => {
    if (!documento) {
      navigate("/meus-documentos");
    }
  }, [documento, navigate]);

  const getTipoLabel = () => {
    switch (tipoDocumento) {
      case "R":
        return { text: "Receita Médica", class: "receita", icon: <FaPills /> };
      case "E":
        return { text: "Exame Clínico", class: "exame", icon: <FaFlask /> };
      case "D":
        return {
          text: "Documento Clínico",
          class: "clinico",
          icon: <FaFileAlt />,
        };
      default:
        return { text: "Documento", class: "", icon: null };
    }
  };

  const tipoInfo = getTipoLabel();

  // Handlers de download
  const handleDownloadClinico = async () => {
    try {
      const response = await fetch(
        `${urlBase}/api/documentosclinicos/imagem/${documento.id}`,
      );
      if (!response.ok) throw new Error("Erro ao baixar a imagem");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documento-clinico-${documento.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao baixar a imagem");
    }
  };

  const handleDownloadExame = async () => {
    try {
      const response = await fetch(
        `${urlBase}/api/exames/imagem/${documento.id}`,
      );
      if (!response.ok) throw new Error("Erro ao baixar a imagem");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exame-${documento.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao baixar a imagem");
    }
  };

  const handleDownloadReceita = async () => {
    try {
      const response = await fetch(
        `${urlBase}/api/receitas/imagem/${documento.id}`,
      );
      if (!response.ok) throw new Error("Erro ao baixar a imagem");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receita-${documento.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao baixar a imagem");
    }
  };

  const getImageUrl = () => {
    switch (tipoDocumento) {
      case "D":
        return `${urlBase}/api/documentosclinicos/imagem/${documento.id}`;
      case "E":
        return `${urlBase}/api/exames/imagem/${documento.id}`;
      case "R":
        return `${urlBase}/api/receitas/imagem/${documento.id}`;
      default:
        return "";
    }
  };

  const handleDownload = () => {
    switch (tipoDocumento) {
      case "D":
        handleDownloadClinico();
        break;
      case "E":
        handleDownloadExame();
        break;
      case "R":
        handleDownloadReceita();
        break;
      default:
        break;
    }
  };

  const renderImagem = () => {
    const hasImagem = documento?.imagem || true; // Se tiver campo imagem no objeto
    const imageUrl = getImageUrl();

    if (!hasImagem) {
      return (
        <div className="no-image-message">
          <FaFileAlt size={48} />
          <p>Imagem não disponível</p>
        </div>
      );
    }

    return (
      <>
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={5}
          wheel={{ step: 0.1 }}
        >
          <TransformComponent
            wrapperStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            contentStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={imageUrl}
              alt={`Documento ${tipoInfo.text}`}
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
        <button
          onClick={handleDownload}
          className="btn-download-image"
          title="Baixar imagem"
        >
          <FaDownload size={14} />
          Salvar imagem
        </button>
      </>
    );
  };

  const renderConteudo = () => {
    switch (tipoDocumento) {
      case "D": // Documento Clínico
        return (
          <>
            <div className="info-card">
              <div className="info-card-body">
                <div className="info-card-title">
                  <FaFileAlt /> Informações do Documento Clínico
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Data do Documento</div>
                    <div className="info-value">
                      {formatarData(documento.dataDocumentoCli)}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaUserMd />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Médico</div>
                    <div className="info-value">
                      {documento.medico || "Não informado"}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaInfoCircle />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Especialidade</div>
                    <div className="info-value">
                      {documento.especialidade || "Não informado"}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaStickyNote />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Conclusões</div>
                    <div className="info-value">
                      {documento.conclusoes || "Nenhuma descrição disponível."}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaStickyNote />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Observações</div>
                    <div className="info-value">
                      {documento.observacoes || "Nenhuma observação."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-body">
                <div className="section-title">
                  <FaStickyNote /> Resumo
                </div>
                <textarea
                  className="resumo-textarea"
                  value={documento.resumo || ""}
                  readOnly
                  rows={5}
                />
              </div>
            </div>
          </>
        );

      case "E": // Exame
        return (
          <>
            <div className="info-card">
              <div className="info-card-body">
                <div className="info-card-title">
                  <FaFileMedical /> Informações do Exame
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaFileMedical />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Nome do Exame</div>
                    <div className="info-value">
                      {documento.nomeExame || "Exame sem nome"}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Data do Exame</div>
                    <div className="info-value">
                      {formatarData(documento.dataExame)}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaFlask />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Tipo</div>
                    <div className="info-value">
                      {documento.tipo || "Não informado"}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaInfoCircle />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Laboratório</div>
                    <div className="info-value">
                      {documento.laboratorio || "Não informado"}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaNotesMedical />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Resultado</div>
                    <div className="info-value">
                      {documento.resultado || "Sem resultado disponível"}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaStickyNote />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Observações</div>
                    <div className="info-value">
                      {documento.observacoes || "Nenhuma observação."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-body">
                <div className="section-title">
                  <FaStickyNote /> Resumo
                </div>
                <textarea
                  className="resumo-textarea"
                  value={documento.resumo || ""}
                  readOnly
                  rows={5}
                />
              </div>
            </div>
          </>
        );

      case "R": // Receita
        return (
          <>
            <div className="info-card">
              <div className="info-card-body">
                <div className="info-card-title">
                  <FaPills /> Informações da Receita
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Data da Receita</div>
                    <div className="info-value">
                      {formatarData(documento.dataReceita)}
                    </div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaUserMd />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Doutor(a)</div>
                    <div className="info-value">{documento.medico}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaAward />
                  </div>
                  <div className="info-content">
                    <div className="info-label">CRM/MS</div>
                    <div className="info-value">{documento.crmMedico}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">
                    <FaStickyNote />
                  </div>
                  <div className="info-content">
                    <div className="info-label">Observação</div>
                    <div className="info-value">
                      {documento.observacoes || "Nenhuma observação."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-body">
                <div className="section-title">
                  <FaPills /> Medicamentos
                </div>
                <ul className="medicamentos-list">
                  {documento.medicamentos?.map((med) => (
                    <li key={med.id} className="medicamento-item">
                      <div className="medicamento-bullet"></div>
                      <div className="medicamento-info">
                        <div className="medicamento-nome">{med.nome}</div>
                        <div className="medicamento-posologia">
                          <strong>Posologia:</strong> {med.quantidade} —{" "}
                          {med.formaDeUso}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-body">
                <div className="section-title">
                  <FaStickyNote /> Resumo
                </div>
                <textarea
                  className="resumo-textarea"
                  value={documento.resumo || ""}
                  readOnly
                  rows={8}
                />
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p className="error-message">
              Tipo de documento não suportado para visualização.
            </p>
          </div>
        );
    }
  };

  if (!documento) {
    return (
      <div className="visualizador-page">
        <div className="visualizador-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando documento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="visualizador-page">
      <div className="visualizador-container">
        <div className="visualizador-header">
          <div className="visualizador-title">
            <h1>Visualizar Documento</h1>
            <span className={`tipo-badge ${tipoInfo.class}`}>
              {tipoInfo.icon} {tipoInfo.text}
            </span>
          </div>
          <button className="btn-voltar" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Voltar
          </button>
        </div>

        <div className="documento-card">
          {/* Área da imagem */}
          <div className="info-card">
            <div className="info-card-body">
              <div className="image-area">
                <div className="image-zoom-wrapper">{renderImagem()}</div>
              </div>
            </div>
          </div>

          {/* Conteúdo específico por tipo */}
          {renderConteudo()}
        </div>
      </div>
    </div>
  );
};

export default VisualizadorDocumento;
