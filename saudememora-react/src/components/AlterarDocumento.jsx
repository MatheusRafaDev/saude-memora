import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaSave } from "react-icons/fa";

import DocumentoClinicoForm from "./forms/DocumentoClinicoForm";
import ExameForm from "./forms/ExameForm";
import ReceitaForm from "./forms/ReceitaForm";

import Notification from "./Notification";

import DocumentoClinicoService from "../services/DocumentoClinicoService";
import ExameService from "../services/ExameService";
import ReceitaService from "../services/ReceitaService";
import MedicamentoService from "../services/MedicamentoService";
import '../styles/components/DocumentoForm.css';

const AlterarDocumento = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tipo, id } = location.state;

  const [formData, setFormData] = useState({
    tipo: tipo,
    resumo: "",
    observacoes: "",
    ...(tipo === "documentoclinico" && {
      tipoDoc: "",
      data: null,
      medico: "",
      crm: "",
      instituicao: "",
      especialidade: "",
    }),
    ...(tipo === "exame" && {
      nomeExame: "",
      tipoExame: "",
      dataExame: null,
      laboratorio: "",
      data: null,
      resultado: "",
    }),
    ...(tipo === "receita" && {
      dataReceita: null,
      medico: "",
      crmMedico: "",
      medicamentos: [],
      documentos: [],
    }),
  });

  const [medicamentoEdit, setMedicamentoEdit] = useState({
    nome: "",
    quantidade: "",
    formaDeUso: "",
  });
  const [editingMedId, setEditingMedId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [loading, setLoading] = useState(false);

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

            if (response.success) {
              const medsResponse = await MedicamentoService.getMedicamentosByReceitaId(id);

              if (medsResponse.success) {
                response.data.medicamentos = medsResponse.data;
              }
            }
            break;
          default:
            throw new Error("Tipo de documento não suportado");
        }

        if (response.success) {

          setFormData((prev) => ({
            ...prev,
            ...response.data,
            ...(response.data.data  ),
            ...(response.data.dataReceita && {
              dataReceita: response.data.dataReceita,
              dataExame: response.data.dataExame,
              documento: response.data.documento ||{},
              paciente: response.data.paciente || {},
              medicamentos: response.data.medicamentos || [],
            }),
          }));
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        setNotification({
          show: true,
          message: `Erro ao carregar documento: ${error.message}`,
          type: "error",
        });
      }
    };

    carregarDocumento();
  }, [tipo, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  const handleMedicamentoChange = (e) => {
    const { name, value } = e.target;
    setMedicamentoEdit((prev) => ({ ...prev, [name]: value }));
  };

  const onAddMedicamento = () => {
    if (!medicamentoEdit.nome || !medicamentoEdit.quantidade || !medicamentoEdit.formaDeUso) {
      setNotification({
        show: true,
        message: "Preencha todos os campos do medicamento",
        type: "warning",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      medicamentos: [
        ...prev.medicamentos,
        {
          ...medicamentoEdit,
          id: Date.now(),
        },
      ],
    }));
    setMedicamentoEdit({ nome: "", quantidade: "", formaDeUso: "" });
  };

  const onRemoveMedicamento = (id) => {
    setFormData((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((med) => med.id !== id),
    }));
  };

  const onStartEdit = (medicamento) => {
    setMedicamentoEdit(medicamento);
    setEditingMedId(medicamento.id);
  };

  const onSaveEdit = () => {
    setFormData((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos.map((med) =>
        med.id === editingMedId ? medicamentoEdit : med
      ),
    }));
    setMedicamentoEdit({ nome: "", quantidade: "", formaDeUso: "" });
    setEditingMedId(null);
  };

  const onCancelEdit = () => {
    setMedicamentoEdit({ nome: "", quantidade: "", formaDeUso: "" });
    setEditingMedId(null);
  };

 

  const renderFormByType = () => {
    switch (tipo) {
      case "D":
        return (
          <DocumentoClinicoForm
            data={formData}
            onChange={handleChange}
            onDateChange={handleDateChange}
          />
        );
      case "E":
        return (
          <ExameForm
            data={formData}
            onChange={handleChange}
            onDateChange={handleDateChange}
          />
        );
      case "R":
        return (
          <ReceitaForm
            data={formData}
            onChange={handleChange}
            onDateChange={handleDateChange}
          />
        );
      default:
        return <p className="text-danger">Tipo de documento não reconhecido: {tipo}</p>;
    }
  };

  return (
    <div>

      <div className="container mt-4">

        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ ...notification, show: false })}
          />
        )}

          {renderFormByType()}
      </div>
    </div>
  );
};

export default AlterarDocumento;
