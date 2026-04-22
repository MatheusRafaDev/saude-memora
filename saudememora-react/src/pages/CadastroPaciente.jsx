import React, { useState } from "react";
import { IMaskInput } from "react-imask";
import { cadastrarPaciente } from "../services/pacienteService";
import { useNavigate } from "react-router-dom";
import "../styles/pages/CadastroPaciente.css";
import "bootstrap/dist/css/bootstrap.min.css";

const CadastroPaciente = () => {
  const navigate = useNavigate();
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

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
    const { nome, cpf, dataNascimento, sexo, senha, confirmarSenha } = formData;
    let isValid = true;
    const newErrors = {};

    if (!aceitaTermos) {
      setError("Você deve aceitar os termos para continuar");
      isValid = false;
    }

    if (!nome) {
      newErrors.nome = "Nome completo é obrigatório";
      isValid = false;
    }

    if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF inválido";
      isValid = false;
    }

    if (!dataNascimento || dataNascimento.length !== 10) {
      newErrors.dataNascimento = "Data de nascimento inválida";
      isValid = false;
    }

    if (!sexo) {
      newErrors.sexo = "Selecione o sexo";
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

    if (Object.keys(newErrors).length > 0 && !error.includes("termos")) {
      setError("Por favor, corrija os erros destacados");
    } else if (Object.keys(newErrors).length === 0 && error && error.includes("termos")) {
      // mantém erro dos termos, se for o caso
      setError(error);
    } else if (Object.keys(newErrors).length === 0) {
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

      const firstErrorField = Object.keys(fieldErrors).find(
        (field) => fieldErrors[field]
      );
      if (firstErrorField) {
        const el = document.querySelector(`[name="${firstErrorField}"]`);
        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
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
        } else if (result.message === "O CPF informado já está em uso.") {
          setFieldErrors((prev) => ({ ...prev, cpf: result.message }));
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

  const hasError = (fieldName) => {
    return fieldErrors[fieldName] ? "is-invalid" : "";
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div
        className="card shadow-sm rounded-3 w-100 mx-3 mx-md-4"
        style={{ maxWidth: "500px" }}
      >
        <div className="card-body p-3 p-md-4">
          <h2 className="text-center mb-4">Criar conta</h2>

          {error && !error.includes("termos") && (
            <div
              className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4 desktop-only"
              role="alert"
            >
              <i
                className="bi bi-exclamation-triangle-fill me-2"
                style={{ fontSize: "1.5rem" }}
              ></i>
              <div>
                <strong>Erro!</strong> {error}
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
                aria-label="Close"
              ></button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-2">
              {/* Nome */}
              <div className="col-12">
                <label className="form-label">
                  Nome completo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`form-control ${hasError("nome")}`}
                  placeholder="Digite seu nome completo"
                  required
                  autoComplete="name"
                />
                {fieldErrors.nome && (
                  <div className="invalid-feedback d-flex align-items-center error-mobile-hide">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {fieldErrors.nome}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  CPF <span className="text-danger">*</span>
                </label>
                <IMaskInput
                  mask="000.000.000-00"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className={`form-control ${hasError("cpf")}`}
                  placeholder="000.000.000-00"
                  required
                  autoComplete="off"
                />
                {fieldErrors.cpf && (
                  <div className="invalid-feedback d-flex align-items-center error-mobile-hide">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {fieldErrors.cpf}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  Nascimento <span className="text-danger">*</span>
                </label>
                <IMaskInput
                  mask="00/00/0000"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  className={`form-control ${hasError("dataNascimento")}`}
                  placeholder="DD/MM/AAAA"
                  required
                  autoComplete="bday"
                />
                {fieldErrors.dataNascimento && (
                  <div className="invalid-feedback d-flex align-items-center error-mobile-hide">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {fieldErrors.dataNascimento}
                  </div>
                )}
              </div>

              {/* Sexo e Email */}
              <div className="col-md-6">
                <label className="form-label">
                  Sexo <span className="text-danger">*</span>
                </label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                  className={`form-select ${hasError("sexo")}`}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
                {fieldErrors.sexo && (
                  <div className="invalid-feedback d-flex align-items-center error-mobile-hide">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {fieldErrors.sexo}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                  placeholder="Email"
                  required
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback">
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              {/* Telefone e Endereço */}
              <div className="col-md-6">
                <label className="form-label">Telefone</label>
                <IMaskInput
                  mask="(00) 00000-0000"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="(00) 00000-0000"
                  autoComplete="text"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Rua, número, bairro"
                  autoComplete="street-address"
                />
              </div>

              {/* Senha */}
              <div className="col-md-6">
                <label className="form-label">
                  Senha <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  className={`form-control ${fieldErrors.senha ? "is-invalid" : ""}`}
                  placeholder="Senha"
                  required
                  autoComplete="new-password"
                />
                {fieldErrors.senha && (
                  <div className="invalid-feedback">
                    {fieldErrors.senha}
                  </div>
                )}

              </div>

              {/* Confirmar senha */}
              <div className="col-md-6">
                <label className="form-label">
                  Confirmar Senha <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className={`form-control ${hasError("confirmarSenha")}`}
                  placeholder="Repita a senha"
                  required
                  autoComplete="new-password"
                />
                {fieldErrors.confirmarSenha && (
                  <div className="invalid-feedback d-flex align-items-center error-mobile-hide">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {fieldErrors.confirmarSenha}
                  </div>
                )}
              </div>

              {/* Aceitar termos */}
              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="aceitaTermos"
                    checked={aceitaTermos}
                    onChange={() => setAceitaTermos(!aceitaTermos)}
                  />
                  <label className="form-check-label" htmlFor="aceitaTermos">
                    Aceito os{" "}
                    <a href="#termos" target="_blank" rel="noopener noreferrer">
                      termos e condições
                    </a>
                    <span className="text-danger">*</span>
                  </label>
                </div>

                {!aceitaTermos && error.includes("termos") && (
                  <div
                    className="text-danger small mt-1 d-flex align-items-center error-mobile-hide"
                    style={{ fontWeight: "500" }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    {error}
                  </div>
                )}
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-between mt-4">

                <button
                  type="button"
                  className="btn btn-outline-secondary flex-grow-1 me-md-2"
                  onClick={() => navigate("/login")}
                >
                  Já tenho conta
                </button>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Cadastrar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastroPaciente;
