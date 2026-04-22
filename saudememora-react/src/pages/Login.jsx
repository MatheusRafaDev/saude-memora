import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginPaciente } from "../services/pacienteService";
import "../styles/pages/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null);
    setIsSubmitting(true);

    // Validação básica
    if (!email.trim()) {
      setErro("Por favor, informe seu e-mail");
      setIsSubmitting(false);
      return;
    }
    if (!senha) {
      setErro("Por favor, informe sua senha");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await loginPaciente(email, senha);

      if (result.success) {
        localStorage.setItem("paciente", JSON.stringify(result.data));
        navigate("/inicio");
      } else {
        setErro(result.message || "Falha ao fazer login");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const mensagem =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data.message || "Erro inesperado ao fazer login.";
        setErro(mensagem);
      } else {
        setErro("Erro ao conectar com o servidor. Verifique sua internet.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#2563eb"/>
              <path d="M16 24s-9-6.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 12-11 12z" fill="#fff" opacity=".9"/>
              <path d="M9 16h3l2-4 2 8 2-4 1 2h4" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="login-title">Saúde Memora</h1>
          <p className="login-subtitle">Cuidando de você com tecnologia</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">
              <i className="icon-envelope"></i>
              E-mail
            </label>
            <input
              type="email"
              className={`form-input ${erro && !email ? 'has-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <i className="icon-lock"></i>
              Senha
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className={`form-input ${erro && !senha ? 'has-error' : ''}`}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div className="alert-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{erro}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Entrando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M14 10L21 3M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>
                </svg>
                Entrar
              </>
            )}
          </button>

          <div className="login-links">
            <button
              type="button"
              onClick={() => navigate("/criar-conta")}
              className="link-button"
            >
              Criar conta
            </button>
            <span className="separator">|</span>
            <button
              type="button"
              onClick={() => navigate("/esqueci-senha")}
              className="link-button disabled"
              disabled
            >
              Esqueci a senha
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2024 Saúde Memora - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}