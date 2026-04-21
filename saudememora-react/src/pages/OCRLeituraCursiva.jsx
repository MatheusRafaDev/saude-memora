/**
 * OCRLeituraCursiva.jsx
 *
 * OCR para letra cursiva com correção ortográfica via backend.
 * O frontend apenas pré-processa a imagem localmente (binarização canvas)
 * e envia para POST /api/ocr/cursivo — sem Tesseract.js, sem LanguageTool externo.
 */

import React, { useState } from "react";
import axiosInstance from "../axiosConfig";

function preprocessarImagem(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const bw = avg < 180 ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = bw;
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Falha ao converter imagem.")),
        "image/png"
      );
    };
  });
}

const OcrCursivoCorrigido = () => {
  const [image, setImage] = useState(null);
  const [textoOriginal, setTextoOriginal] = useState("");
  const [textoCorrigido, setTextoCorrigido] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setTextoOriginal("");
      setTextoCorrigido("");
      setErro("");
    }
  };

  const handleOcr = async () => {
    if (!image) return;
    setLoading(true);
    setTextoOriginal("Processando...");
    setTextoCorrigido("");
    setErro("");

    try {
      const blob = await preprocessarImagem(image);
      const formData = new FormData();
      formData.append("imagem", blob, image.name || "cursivo.png");

      const response = await axiosInstance.post("/api/ocr/cursivo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 90000,
      });

      setTextoOriginal(response.data.textoOriginal || "Nenhum texto extraído.");
      setTextoCorrigido(response.data.textoCorrigido || "");
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Erro ao processar a imagem.";
      setTextoOriginal("");
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "800px", margin: "0 auto" }}>
      <h2>OCR para Letra Cursiva + Correção Ortográfica</h2>

      <div className="mb-3">
        <input type="file" accept="image/*" onChange={handleImageChange} className="form-control" />
      </div>

      <button className="btn btn-primary" onClick={handleOcr} disabled={!image || loading}>
        {loading ? (
          <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Processando...</>
        ) : "Fazer OCR e Corrigir"}
      </button>

      {erro && <div className="alert alert-danger mt-3">{erro}</div>}

      {textoOriginal && !erro && (
        <div className="mt-4">
          <h3>Texto original (OCR):</h3>
          <textarea className="form-control" rows="6" readOnly value={textoOriginal} />
        </div>
      )}

      {textoCorrigido && (
        <div className="mt-4">
          <h3>Texto corrigido:</h3>
          <textarea className="form-control" rows="6" readOnly value={textoCorrigido} style={{ color: "#007700" }} />
        </div>
      )}
    </div>
  );
};

export default OcrCursivoCorrigido;