import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginPaciente } from "../services/pacienteService";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null);

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
        setErro("Erro ao conectar com o servidor.");
      }
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#e9f7fc" }}>
      <header
        className="text-center py-4 bg-white shadow-sm"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/home")}
      >
        <h1 className="text-primary mb-0">
          <i className="fas fa-heartbeat me-2"></i>Saúde Memora
        </h1>
        <small className="text-muted">Cuidando de você com tecnologia</small>
      </header>

      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
              <div className="p-4 rounded shadow border bg-white">
                <h4 className="text-center mb-4 text-primary">Login</h4>
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="form-control"
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="senha">
                      Senha
                    </label>
                    <input
                      className="form-control"
                      type="password"
                      id="senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    <i className="fas fa-sign-in-alt me-2"></i>Entrar
                  </button>

                  {erro && <p className="text-danger mt-2 small">{erro}</p>}
                </form>

                <div className="d-flex justify-content-between mt-3">
                  <button
                    onClick={() => navigate("/criar-conta")}
                    className="btn btn-link p-0"
                  >
                    Criar conta
                  </button>
                  <button
                    onClick={() => navigate("/esqueci-senha")}
                    className="btn btn-link p-0"
                    disabled
                  >
                    Esqueci a senha
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
