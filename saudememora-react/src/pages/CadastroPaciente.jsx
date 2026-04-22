// CadastroPaciente.jsx
import React, { useState } from "react";
import { IMaskInput } from "react-imask";
import { cadastrarPaciente } from "../services/pacienteService";
import { useNavigate } from "react-router-dom";
import "../styles/pages/CadastroPaciente.css";

const CadastroPaciente = () => {
  const navigate = useNavigate();
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    sexo: "",
    email: "",
    telefone: "",
    endereco: "",
    senha: "",
    confirmarSenha: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: null,
      });
    }

    if (error) setError("");
  };

  const validateForm = () => {
    const { nome, cpf, dataNascimento, sexo, email, senha, confirmarSenha } = formData;
    let isValid = true;
    const newErrors = {};

    if (!aceitaTermos) {
      setError("Você deve aceitar os termos para continuar");
      isValid = false;
    }

    if (!nome || nome.trim() === "") {
      newErrors.nome = "Nome completo é obrigatório";
      isValid = false;
    } else if (nome.trim().length < 3) {
      newErrors.nome = "Nome deve ter pelo menos 3 caracteres";
      isValid = false;
    }

    if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF inválido";
      isValid = false;
    }

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

    if (!sexo) {
      newErrors.sexo = "Selecione o sexo";
      isValid = false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "E-mail inválido";
      isValid = false;
    }

    if (!senha) {
      newErrors.senha = "Senha é obrigatória";
      isValid = false;
    } else if (senha.length < 6) {
      newErrors.senha = "A senha deve ter pelo menos 6 caracteres";
      isValid = false;
    }

    if (!confirmarSenha) {
      newErrors.confirmarSenha = "Confirme sua senha";
      isValid = false;
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
      isValid = false;
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setError("Por favor, corrija os erros destacados");
    } else if (Object.keys(newErrors).length === 0 && error && error.includes("termos")) {
      setError(error);
    } else if (Object.keys(newErrors).length === 0 && !error?.includes("termos")) {
      setError("");
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isValid = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
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

    const { confirmarSenha, ...dadosParaBackend } = formData;

    try {
      const result = await cadastrarPaciente(dadosParaBackend);

      if (result.success) {
        localStorage.setItem("paciente", JSON.stringify(result.dados));
        navigate("/ficha-medica");
      } else {
        if (result.message === "O email informado já está em uso.") {
          setFieldErrors((prev) => ({ ...prev, email: result.message }));
          setError("E-mail já cadastrado");
        } else if (result.message === "O CPF informado já está em uso.") {
          setFieldErrors((prev) => ({ ...prev, cpf: result.message }));
          setError("CPF já cadastrado");
        } else {
          setError(result.message || "Erro ao cadastrar. Tente novamente.");
        }
      }
    } catch (err) {
      setError("Erro na conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TermsModal = () => (
    <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Termos e Condições</h2>
          <button className="modal-close" onClick={() => setShowTermsModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <h3>1. Aceitação dos Termos</h3>
          <p>Ao acessar e usar o sistema Saúde Memora, você concorda em cumprir estes termos e condições.</p>
          
          <h3>2. Privacidade e Dados</h3>
          <p>Seus dados pessoais e informações de saúde serão tratados com confidencialidade e protegidos conforme a LGPD (Lei Geral de Proteção de Dados).</p>
          
          <h3>3. Responsabilidades do Usuário</h3>
          <p>Você é responsável por fornecer informações precisas e verdadeiras durante o cadastro e uso do sistema.</p>
          
          <h3>4. Segurança da Conta</h3>
          <p>Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrerem em sua conta.</p>
          
          <h3>5. Uso do Sistema</h3>
          <p>O sistema destina-se exclusivamente ao acompanhamento de informações médicas pessoais. Não substitui consultas médicas profissionais.</p>
          
          <h3>6. Modificações</h3>
          <p>Reservamo-nos o direito de modificar estes termos a qualquer momento, com notificação aos usuários.</p>
          
          <h3>7. Cancelamento</h3>
          <p>Você pode solicitar o cancelamento de sua conta a qualquer momento através do suporte.</p>
          
          <h3>8. Contato</h3>
          <p>Em caso de dúvidas, entre em contato pelo e-mail: suporte@saudememora.com.br</p>
        </div>
        <div className="modal-footer">
          <button className="btn-terms" onClick={() => {
            setAceitaTermos(true);
            setShowTermsModal(false);
          }}>
            Li e Aceito os Termos
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <div className="cadastro-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#2563eb"/>
              <path d="M16 24s-9-6.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 12-11 12z" fill="#fff" opacity=".9"/>
              <path d="M9 16h3l2-4 2 8 2-4 1 2h4" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="cadastro-title">Criar Conta</h1>
          <p className="cadastro-subtitle">Preencha seus dados para começar</p>
        </div>

        {error && (
          <div className="alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
            <button type="button" className="alert-close" onClick={() => setError("")}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cadastro-form" noValidate>
          <div className="form-grid">
            <div className="form-group full-width">
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`form-input ${fieldErrors.nome ? 'has-error' : ''}`}
                placeholder="Nome completo *"
                disabled={isSubmitting}
              />
              {fieldErrors.nome && <span className="field-error">{fieldErrors.nome}</span>}
            </div>

            <div className="form-group">
              <IMaskInput
                mask="000.000.000-00"
                name="cpf"
                value={formData.cpf}
                onAccept={(value) => {
                  setFormData(prev => ({ ...prev, cpf: value }));
                  if (fieldErrors.cpf) setFieldErrors(prev => ({ ...prev, cpf: null }));
                }}
                className={`form-input ${fieldErrors.cpf ? 'has-error' : ''}`}
                placeholder="CPF *"
                disabled={isSubmitting}
              />
              {fieldErrors.cpf && <span className="field-error">{fieldErrors.cpf}</span>}
            </div>

            <div className="form-group">
              <IMaskInput
                mask="00/00/0000"
                name="dataNascimento"
                value={formData.dataNascimento}
                onAccept={(value) => {
                  setFormData(prev => ({ ...prev, dataNascimento: value }));
                  if (fieldErrors.dataNascimento) setFieldErrors(prev => ({ ...prev, dataNascimento: null }));
                }}
                className={`form-input ${fieldErrors.dataNascimento ? 'has-error' : ''}`}
                placeholder="Data de Nascimento *"
                disabled={isSubmitting}
              />
              {fieldErrors.dataNascimento && <span className="field-error">{fieldErrors.dataNascimento}</span>}
            </div>

            <div className="form-group">
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className={`form-select ${fieldErrors.sexo ? 'has-error' : ''}`}
                disabled={isSubmitting}
              >
                <option value="">Sexo *</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
              {fieldErrors.sexo && <span className="field-error">{fieldErrors.sexo}</span>}
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${fieldErrors.email ? 'has-error' : ''}`}
                placeholder="E-mail"
                disabled={isSubmitting}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <IMaskInput
                mask="(00) 00000-0000"
                name="telefone"
                value={formData.telefone}
                onAccept={(value) => setFormData(prev => ({ ...prev, telefone: value }))}
                className="form-input"
                placeholder="Telefone"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group full-width">
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="form-input"
                placeholder="Endereço completo"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.senha ? 'has-error' : ''}`}
                  placeholder="Senha * (mínimo 6 caracteres)"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.senha && <span className="field-error">{fieldErrors.senha}</span>}
            </div>

            <div className="form-group">
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.confirmarSenha ? 'has-error' : ''}`}
                  placeholder="Confirmar senha *"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmarSenha && <span className="field-error">{fieldErrors.confirmarSenha}</span>}
            </div>
          </div>

          <div className="terms-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={aceitaTermos}
                onChange={() => setAceitaTermos(!aceitaTermos)}
                disabled={isSubmitting}
              />
              <span>
                Li e aceito os <button type="button" className="terms-link" onClick={() => setShowTermsModal(true)}>termos e condições</button>
                <span className="required">*</span>
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/login")}
              disabled={isSubmitting}
            >
              Já tenho conta
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Cadastrando...
                </>
              ) : (
                "Cadastrar"
              )}
            </button>
          </div>
        </form>

        <div className="cadastro-footer">
          <p>© 2024 Saúde Memora</p>
        </div>
      </div>

      {showTermsModal && <TermsModal />}
    </div>
  );
};

export default CadastroPaciente;