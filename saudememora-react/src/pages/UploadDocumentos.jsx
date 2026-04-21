
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ocrSpaceDuplo } from "../ocr/ocrSpace";
import {
  formatarTextoOCR,
  extrairMedicamentosDoOCR,
} from "../services/OpenRouter";
import { AdicionarDocumento } from "../documentos/AdicionarDocumento";
import "../styles/pages/UploadDocumentos.css";

const Icon = ({ d, size = 20, stroke = "currentColor", sw = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  file: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  check: "M5 13l4 4L19 7",
  x: "M6 18L18 6M6 6l12 12",
  refresh: "M4 4v5h.582m15.356 2A8 8 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8 8 0 01-15.357-2m15.357 2H15",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  chevronRight: "M9 18l6-6-6-6",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtSize = (b) =>
  b < 1024
    ? `${b} B`
    : b < 1048576
    ? `${(b / 1024).toFixed(1)} KB`
    : `${(b / 1048576).toFixed(1)} MB`;

// ── Componente principal ─────────────────────────────────────────────────────
export default function UploadDocumentos() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tipo, setTipo] = useState("");
  const [paciente, setPaciente] = useState(null);

  // Processo silencioso
  const [currentStep, setCurrentStep] = useState(0); // 0 idle, 1-4 processing, 5 done, -1 erro
  const [stepError, setStepError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  // Toast
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
  const toastTimer = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("paciente") || "{}");
    if (p?.id) setPaciente(p);
  }, []);

  const showToast = (msg, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ show: true, msg, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      4000
    );
  };

  // ── Arquivo ────────────────────────────────────────────────────────────────
  const applyFile = (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      showToast("Arquivo muito grande. Limite: 10 MB.", "error");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setCurrentStep(0);
    setStepError("");
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setCurrentStep(0);
    setStepError("");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    applyFile(e.dataTransfer.files[0]);
  };

  // ── Submit silencioso ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file) return showToast("Selecione um arquivo.", "error");
    if (!tipo) return showToast("Selecione o tipo de documento.", "error");
    if (!paciente?.id) return showToast("Nenhum paciente na sessão.", "error");

    setCurrentStep(1);
    setProcessingStep("Enviando imagem...");
    setStepError("");

    try {
      // ── 1. OCR ─────────────────────────────────────────────────────────────
      setProcessingStep("Realizando leitura OCR...");
      const { texto1, texto2 } = await ocrSpaceDuplo(file);
      
      setCurrentStep(2);
      
      // ── 2. Formatar com IA ─────────────────────────────────────────────────
      setProcessingStep("Corrigindo e estruturando com IA...");
      const textoFormatado = await formatarTextoOCR(texto1, texto2);
      
      setCurrentStep(3);
      
      // ── 3. Extrair medicamentos (só receita) ───────────────────────────────
      setProcessingStep("Processando informações...");
      let medicamentos = [];
      if (tipo === "R") {
        const med = await extrairMedicamentosDoOCR(textoFormatado);
        medicamentos = Array.isArray(med) ? med : [];
      }
      
      setCurrentStep(4);
      
      // ── 4. Salvar ──────────────────────────────────────────────────────────
      setProcessingStep("Salvando documento...");
      const response = await AdicionarDocumento(
        tipo,
        textoFormatado,
        paciente,
        file,
        navigate,
        medicamentos
      );

      if (response?.success === false)
        throw new Error(response.message || "Erro ao salvar.");

      // ── Concluído ──────────────────────────────────────────────────────────
      setCurrentStep(5);
      setProcessingStep("");
      showToast("Documento salvo com sucesso!", "success");
      
      // Reset automático após 3 segundos
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err) {
      console.error("Erro no processamento:", err);
      setCurrentStep(-1);
      setStepError(err.message || "Erro inesperado no processamento.");
      setProcessingStep("");
      showToast("Erro: " + (err.message || "Tente novamente."), "error");
    }
  };

  const resetForm = useCallback(() => {
    removeFile();
    setTipo("");
    setCurrentStep(0);
    setStepError("");
    setProcessingStep("");
  }, [preview]);

  // ── Passos ─────────────────────────────────────────────────────────────────
  const STEPS = [
    { id: 1, label: "Enviando imagem", icon: "upload" },
    { id: 2, label: "Leitura OCR", icon: "file" },
    { id: 3, label: "Processamento IA", icon: "refresh" },
    { id: 4, label: "Salvando documento", icon: "check" },
  ];

  const getStepStatus = (stepId) => {
    if (currentStep === 5) return "completed";
    if (currentStep === -1) {
      // Se houve erro, marca como erro o passo atual ou o último que tentou
      return stepId === Math.abs(currentStep) ? "error" : "pending";
    }
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "active";
    return "pending";
  };

  const isProcessing = currentStep >= 1 && currentStep <= 4;
  const isDone = currentStep === 5;
  const isError = currentStep === -1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="up-page">
      {/* ── Toast ─────────────────────────────────────────────────── */}
      <div
        className={`up-toast up-toast--${toast.type}${
          toast.show ? " show" : ""
        }`}
      >
        <Icon
          d={toast.type === "success" ? ICONS.check : ICONS.info}
          size={16}
        />
        <span>{toast.msg}</span>
      </div>

      <div className="up-container">
        <div className="up-header">
          <h1 className="up-title">Enviar Documento</h1>
          <p className="up-subtitle">
            Upload de exames, receitas ou documentos clínicos
          </p>
        </div>

        {/* ── Upload zone ────────────────────────────────────────────── */}
        <div
          className={`up-dropzone ${dragging ? "dragging" : ""} ${
            file ? "has-file" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !file && !isProcessing && document.getElementById("up-file-input").click()}
        >
          <input
            id="up-file-input"
            type="file"
            accept="image/*,.pdf"
            hidden
            onChange={(e) => applyFile(e.target.files[0])}
          />
          <input
            id="up-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => applyFile(e.target.files[0])}
          />

          {!file ? (
            <div className="up-dropzone__empty">
              <div className="up-dropzone__icon">
                <Icon d={ICONS.upload} size={32} stroke="#2563eb" sw={1.8} />
              </div>
              <p className="up-dropzone__label">
                Arraste ou clique para selecionar
              </p>
              <p className="up-dropzone__hint">PNG, JPG, PDF · máx. 10 MB</p>
              <div className="up-dropzone__actions">
                <button
                  type="button"
                  className="up-btn up-btn--outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("up-file-input").click();
                  }}
                >
                  <Icon d={ICONS.file} size={16} />
                  <span>Arquivo</span>
                </button>
                <button
                  type="button"
                  className="up-btn up-btn--outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("up-camera-input").click();
                  }}
                >
                  <Icon d={ICONS.camera} size={16} />
                  <span>Câmera</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="up-file-preview">
              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="up-file-preview__img"
                />
              )}
              <div className="up-file-preview__info">
                <span className="up-file-preview__name">{file.name}</span>
                <span className="up-file-preview__size">{fmtSize(file.size)}</span>
              </div>
              {!isProcessing && (
                <button
                  type="button"
                  className="up-file-preview__remove"
                  title="Remover"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                >
                  <Icon d={ICONS.x} size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Formulário ────────────────────────────────────────────── */}
        <div className="up-form-card">
          <div className="up-field">
            <label htmlFor="up-tipo">Tipo de documento *</label>
            <select
              id="up-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={isProcessing}
              className={isProcessing ? "disabled" : ""}
            >
              <option value="">Selecione o tipo...</option>
              <option value="E">📋 Exame</option>
              <option value="R">💊 Receita</option>
              <option value="D">📄 Documento Clínico</option>
            </select>
          </div>
        </div>

        {/* ── Painel de progresso ───────────────────────────────────── */}
        {(isProcessing || isDone || isError) && (
          <div className={`up-progress-panel ${isError ? "error" : isDone ? "success" : ""}`}>
            <div className="up-progress-header">
              <div className="up-progress-icon">
                {isDone && <Icon d={ICONS.check} size={24} stroke="#16a34a" />}
                {isError && <Icon d={ICONS.x} size={24} stroke="#dc2626" />}
                {isProcessing && <div className="up-progress-spinner" />}
              </div>
              <div className="up-progress-title">
                {isDone && "Processamento concluído!"}
                {isError && "Erro no processamento"}
                {isProcessing && (
                  <>
                    <span className="up-progress-step-text">
                      {processingStep}
                    </span>
                    <span className="up-progress-percent">
                      {Math.round((currentStep / 4) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="up-steps-container">
              {STEPS.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className={`up-step-item ${status}`}>
                    <div className="up-step-indicator">
                      {status === "completed" && (
                        <Icon d={ICONS.check} size={14} stroke="#16a34a" sw={2.5} />
                      )}
                      {status === "active" && (
                        <div className="up-step-spinner" />
                      )}
                      {status === "error" && (
                        <Icon d={ICONS.x} size={14} stroke="#dc2626" sw={2.5} />
                      )}
                      {status === "pending" && (
                        <div className="up-step-number">{step.id}</div>
                      )}
                    </div>
                    <div className="up-step-label">{step.label}</div>
                    {step.id < 4 && (
                      <div className={`up-step-connector ${status === "completed" ? "completed" : ""}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Barra de progresso */}
            <div className="up-progress-bar">
              <div
                className="up-progress-fill"
                style={{
                  width: isDone ? "100%" : isError ? "0%" : `${(currentStep / 4) * 100}%`,
                }}
              />
            </div>

            {isError && stepError && (
              <div className="up-error-message">
                <Icon d={ICONS.info} size={14} />
                <span>{stepError}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Botão principal ───────────────────────────────────────── */}
        <button
          className={`up-submit-btn ${isDone ? "success" : isError ? "error" : ""}`}
          onClick={isDone || isError ? resetForm : handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="sm-spinner" />
              <span>Processando...</span>
            </>
          ) : isDone ? (
            <>
              <Icon d={ICONS.upload} size={18} />
              <span>Novo documento</span>
            </>
          ) : isError ? (
            <>
              <Icon d={ICONS.refresh} size={18} />
              <span>Tentar novamente</span>
            </>
          ) : (
            <>
              <Icon d={ICONS.upload} size={18} />
              <span>Processar documento</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}