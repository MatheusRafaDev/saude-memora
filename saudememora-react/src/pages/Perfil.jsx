import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IMaskInput } from 'react-imask';
import ReactModal from "react-modal";
import {
  FaEdit,
  FaUserAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaTrash,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTimes,
  FaCheck,
  FaSave,
  FaTimesCircle,
  FaIdCard,
  FaVenusMars,
  FaSignOutAlt,
  FaSpinner,
} from "react-icons/fa";
import { atualizarPaciente, deletarPaciente } from "../services/pacienteService";
import "../styles/pages/Perfil.css";

ReactModal.setAppElement("#root");

const SEXO_MAP = {
  M: "Masculino",
  F: "Feminino",
  O: "Outro"
};

const Perfil = () => {
  const [paciente, setPaciente] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dadosForm, setDadosForm] = useState({
    id: '',
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    email: '',
    telefone: '',
    endereco: '',
    senha: '',
    confirmarSenha: ''
  });
  
  const navigate = useNavigate();

  // Carregar dados do paciente
  useEffect(() => {
    const loadPaciente = async () => {
      setInitialLoading(true);
      const storedPaciente = localStorage.getItem("paciente");
      if (storedPaciente) {
        const pacienteData = JSON.parse(storedPaciente);
        setPaciente(pacienteData);
        setDadosForm({
          ...pacienteData,
          senha: '',
          confirmarSenha: ''
        });
      } else {
        navigate("/login");
      }
      setInitialLoading(false);
    };
    
    loadPaciente();
  }, [navigate]);

  // Aviso de alterações não salvas
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDadosForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    setHasUnsavedChanges(true);

    // Limpar erro do campo específico
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Limpar erro geral
    if (error) setError(null);
  };

  const validateForm = () => {
    const { nome, dataNascimento, sexo, senha, confirmarSenha, cpf } = dadosForm;
    const newErrors = {};
    let isValid = true;

    // Validação do nome
    if (!nome || nome.trim() === "") {
      newErrors.nome = "Nome completo é obrigatório";
      isValid = false;
    }

    // Validação do CPF
    if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF inválido";
      isValid = false;
    }

    // Validação da data de nascimento
    if (!dataNascimento || dataNascimento.length !== 10) {
      newErrors.dataNascimento = "Data de nascimento inválida";
      isValid = false;
    } else {
      const partes = dataNascimento.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);
        const data = new Date(ano, mes - 1, dia);
        if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
          newErrors.dataNascimento = "Data de nascimento inválida";
          isValid = false;
        }
      }
    }

    // Validação do sexo
    if (!sexo) {
      newErrors.sexo = "Selecione o sexo";
      isValid = false;
    }

    // Validação da senha
    if (senha && senha.length < 6) {
      newErrors.senha = "A senha deve ter pelo menos 6 caracteres";
      isValid = false;
    }

    // Validação de confirmação de senha
    if (senha && (!confirmarSenha || senha !== confirmarSenha)) {
      newErrors.confirmarSenha = "As senhas não coincidem";
      isValid = false;
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setError("Por favor, corrija os erros destacados");
    } else {
      setError(null);
    }

    return isValid;
  };

  const getChangedFields = () => {
    const changedFields = {};
    const { confirmarSenha, ...dadosSemConfirmacao } = dadosForm;
    
    Object.keys(dadosSemConfirmacao).forEach(key => {
      if (key === 'senha') {
        // Só inclui senha se foi preenchida
        if (dadosSemConfirmacao[key] && dadosSemConfirmacao[key] !== '') {
          changedFields[key] = dadosSemConfirmacao[key];
        }
      } else if (dadosSemConfirmacao[key] !== paciente[key]) {
        changedFields[key] = dadosSemConfirmacao[key];
      }
    });
    
    return changedFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const el = document.querySelector(`[name="${firstErrorField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const changedFields = getChangedFields();
      
      // Se não houver alterações, apenas sai do modo de edição
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        setHasUnsavedChanges(false);
        setSuccessMessage("Nenhuma alteração foi feita");
        setTimeout(() => setSuccessMessage(null), 3000);
        setLoading(false);
        return;
      }
      
      const response = await atualizarPaciente(paciente.id, changedFields);
      
      const updatedPaciente = { ...paciente, ...changedFields };
      localStorage.setItem('paciente', JSON.stringify(updatedPaciente));
      setPaciente(updatedPaciente);
      
      setSuccessMessage("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setDadosForm(prev => ({
        ...prev,
        ...updatedPaciente,
        senha: '',
        confirmarSenha: ''
      }));
    } catch (error) {
      if (error.response?.data?.message === "O email informado já está em uso.") {
        setFieldErrors(prev => ({ ...prev, email: error.response.data.message }));
        setError("E-mail já está em uso por outro usuário");
      } else if (error.response?.data?.message === "O CPF informado já está em uso.") {
        setFieldErrors(prev => ({ ...prev, cpf: error.response.data.message }));
        setError("CPF já está em uso por outro usuário");
      } else {
        setError('Erro ao atualizar o paciente. Tente novamente.');
      }
      console.error("Erro ao atualizar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await deletarPaciente(paciente.id);
      localStorage.removeItem("paciente");
      navigate("/login");
    } catch (err) {
      setError("Erro ao deletar perfil. Por favor, tente novamente.");
      console.error("Erro ao deletar perfil:", err);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Você tem alterações não salvas. Tem certeza que deseja sair?')) {
        localStorage.removeItem("paciente");
        navigate("/");
      }
    } else {
      localStorage.removeItem("paciente");
      navigate("/login");
    }
  };

  const cancelEdit = () => {
    if (hasUnsavedChanges) {
      
        setIsEditing(false);
        setDadosForm({
          ...paciente,
          senha: '',
          confirmarSenha: ''
        });
        setFieldErrors({});
        setError(null);
        setHasUnsavedChanges(false);
      
    } else {
      setIsEditing(false);
      setDadosForm({
        ...paciente,
        senha: '',
        confirmarSenha: ''
      });
      setFieldErrors({});
      setError(null);
    }
  };

  const renderInfoField = (icon, label, value) => (
    <div className="profile-info-field">
      <div className="profile-info-icon">{icon}</div>
      <div className="profile-info-content">
        <span className="profile-info-label">{label}:</span>
        <span className="profile-info-value">{value || "Não informado"}</span>
      </div>
    </div>
  );

  const DeleteConfirmationModal = () => (
    <ReactModal
      isOpen={showDeleteModal}
      onRequestClose={() => setShowDeleteModal(false)}
      contentLabel="Confirmação de exclusão"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <div className="modal-inner">
        <div className="modal-header">
          <h3 className="modal-title">Confirmar ação</h3>
          <button onClick={() => setShowDeleteModal(false)} className="modal-close-btn" disabled={loading}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <p>Tem certeza que deseja deletar seu perfil permanentemente?</p>
          <p className="text-warning">⚠️ Esta ação não pode ser desfeita.</p>
          {error && <p className="text-danger">{error}</p>}
        </div>
        
        <div className="modal-footer">
          <button onClick={() => setShowDeleteModal(false)} className="btn-cancel" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleDeleteProfile} className="btn-confirm-delete" disabled={loading}>
            {loading ? <><FaSpinner className="spinner" /> Deletando...</> : <><FaCheck /> Confirmar</>}
          </button>
        </div>
      </div>
    </ReactModal>
  );

  // Loading inicial
  if (initialLoading) {
    return (
      <div className="perfil-container">
        <div className="perfil-card">
          <div className="loading-spinner-container">
            <FaSpinner className="spinner-large" />
            <p>Carregando seus dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="perfil-container">
        <div className="perfil-card">
          <div className="perfil-header">
            <div className="perfil-avatar">
              <FaUserAlt />
            </div>
            <h1 className="perfil-title">Perfil</h1>
          </div>
          <div className="profile-info-grid">
            <p className="perfil-message">Nenhum dado encontrado. Por favor, faça login novamente.</p>
          </div>
          <div className="perfil-actions">
            <button className="btn-action btn-edit" onClick={() => navigate("/login")}>
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        {/* Header */}
        <div className="perfil-header">
          <div className="perfil-avatar">
            <FaUserAlt />
          </div>
          <h1 className="perfil-title">Meu Perfil</h1>
          <p className="perfil-subtitle">Gerencie suas informações pessoais</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert-success">
            <FaCheck /> {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert-error">
            <FaTimesCircle /> {error}
          </div>
        )}

        {/* Mode: View */}
        {!isEditing && (
          <>
            <div className="profile-info-grid">
              {renderInfoField(<FaUserAlt />, "Nome completo", paciente.nome)}
              {renderInfoField(<FaIdCard />, "CPF", paciente.cpf)}
              {renderInfoField(<FaCalendarAlt />, "Data de nascimento", paciente.dataNascimento)}
              {renderInfoField(<FaVenusMars />, "Sexo", SEXO_MAP[paciente.sexo] || "Não informado")}
              {renderInfoField(<FaEnvelope />, "E-mail", paciente.email)}
              {renderInfoField(<FaPhoneAlt />, "Telefone", paciente.telefone)}
              {renderInfoField(<FaMapMarkerAlt />, "Endereço", paciente.endereco)}
            </div>

            <div className="perfil-actions">
              <button className="btn-action btn-edit" onClick={() => setIsEditing(true)}>
                <FaEdit /> Editar Perfil
              </button>
 
              <button className="btn-action btn-delete" onClick={() => setShowDeleteModal(true)}>
                <FaTrash /> Deletar Conta
              </button>
              <button className="btn-action btn-logout" onClick={handleLogout}>
                <FaSignOutAlt /> Sair
              </button>
            </div>
          </>
        )}

        {/* Mode: Edit */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="perfil-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Nome completo *</label>
                <input
                  type="text"
                  name="nome"
                  value={dadosForm.nome}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.nome ? 'has-error' : ''}`}
                  required
                />
                {fieldErrors.nome && <span className="field-error">{fieldErrors.nome}</span>}
              </div>

              <div className="form-group">
                <label>CPF *</label>
                <IMaskInput
                  mask="000.000.000-00"
                  name="cpf"
                  value={dadosForm.cpf}
                  onAccept={(value) => {
                    setDadosForm(prev => ({ ...prev, cpf: value }));
                    setHasUnsavedChanges(true);
                  }}
                  className={`form-input ${fieldErrors.cpf ? 'has-error' : ''}`}
                  required
                />
                {fieldErrors.cpf && <span className="field-error">{fieldErrors.cpf}</span>}
              </div>

              <div className="form-group">
                <label>Data de nascimento *</label>
                <IMaskInput
                  mask="00/00/0000"
                  name="dataNascimento"
                  value={dadosForm.dataNascimento}
                  onAccept={(value) => {
                    setDadosForm(prev => ({ ...prev, dataNascimento: value }));
                    setHasUnsavedChanges(true);
                  }}
                  className={`form-input ${fieldErrors.dataNascimento ? 'has-error' : ''}`}
                  required
                />
                {fieldErrors.dataNascimento && <span className="field-error">{fieldErrors.dataNascimento}</span>}
              </div>

              <div className="form-group">
                <label>Sexo *</label>
                <select
                  name="sexo"
                  value={dadosForm.sexo}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.sexo ? 'has-error' : ''}`}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
                {fieldErrors.sexo && <span className="field-error">{fieldErrors.sexo}</span>}
              </div>

              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={dadosForm.email}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.email ? 'has-error' : ''}`}
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <IMaskInput
                  mask="(00) 00000-0000"
                  name="telefone"
                  value={dadosForm.telefone}
                  onAccept={(value) => {
                    setDadosForm(prev => ({ ...prev, telefone: value }));
                    setHasUnsavedChanges(true);
                  }}
                  className="form-input"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="form-group full-width">
                <label>Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  value={dadosForm.endereco}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Nova senha (opcional)</label>
                <input
                  type="password"
                  name="senha"
                  value={dadosForm.senha}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.senha ? 'has-error' : ''}`}
                  placeholder="Digite uma nova senha"
                />
                {fieldErrors.senha && <span className="field-error">{fieldErrors.senha}</span>}
              </div>

              <div className="form-group">
                <label>Confirmar senha</label>
                <input
                  type="password"
                  name="confirmarSenha"
                  value={dadosForm.confirmarSenha}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.confirmarSenha ? 'has-error' : ''}`}
                  placeholder="Confirme a nova senha"
                />
                {fieldErrors.confirmarSenha && <span className="field-error">{fieldErrors.confirmarSenha}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? <><FaSpinner className="spinner" /> Salvando...</> : <><FaSave /> Salvar alterações</>}
              </button>
              <button type="button" className="btn-cancel" onClick={cancelEdit} disabled={loading}>
                <FaTimes /> Cancelar
              </button>
            </div>
            
          </form>
        )}
      </div>

      <DeleteConfirmationModal />
    </div>
  );
};

export default Perfil;