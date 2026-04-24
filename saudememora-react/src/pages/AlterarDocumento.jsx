// AlterarDocumento.jsx - Versão Simplificada
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import DocumentoClinicoForm from "../components/forms/DocumentoClinicoForm";
import ExameForm from "../components/forms/ExameForm";
import ReceitaForm from "../components/forms/ReceitaForm";

import DocumentoClinicoService from "../services/DocumentoClinicoService";
import ExameService from "../services/ExameService";
import ReceitaService from "../services/ReceitaService";

const AlterarDocumento = () => {
  const location = useLocation();
  const { tipo, id } = location.state || {};

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarDocumento = async () => {
      try {
        let response;
        switch (tipo) {
          case "D":
            response = await DocumentoClinicoService.getById(id);
            break;
          case "E":
            response = await ExameService.getById(id);
            break;
          case "R":
            response = await ReceitaService.getById(id);
            break;
          default:
            throw new Error("Tipo de documento não suportado");
        }

        if (response.success) {
          setFormData(response.data);
        } else {
          throw new Error(response.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && tipo) {
      carregarDocumento();
    }
  }, [tipo, id]);

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Erro: {error}</div>
      </div>
    );
  }

  const renderFormByType = () => {
    if (!formData) return null;

    switch (tipo) {
      case "D":
        return <DocumentoClinicoForm data={formData} isLoading={loading} />;
      case "E":
        return <ExameForm data={formData} isLoading={loading} />;
      case "R":
        return <ReceitaForm data={formData} isLoading={loading} />;
      default:
        return <p className="text-danger">Tipo de documento não reconhecido: {tipo}</p>;
    }
  };

  return (
    <div className="container py-4">
      {renderFormByType()}
    </div>
  );
};

export default AlterarDocumento;