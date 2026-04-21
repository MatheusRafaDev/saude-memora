import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CadastroPaciente from "./pages/CadastroPaciente";
import FichaMedica from "./pages/FichaMedica";
import UploadDocumentos from "./pages/UploadDocumentos";
import Perfil from "./pages/Perfil";
import ListarDocumentos from "./pages/ListarDocumentos";

import VisualizadorDocumento from "./pages/VisualizadorDocumento";

import AlterarDocumento from "./pages/AlterarDocumento";
import Nav from "./components/Nav";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/global.css";

const isPacienteLoggedIn = () => {
  const data = localStorage.getItem("paciente");
  if (!data) return false;

  try {
    const paciente = JSON.parse(data);
    if (!paciente || !paciente.id) {
      localStorage.removeItem("paciente");
      return false;
    }
    return true;
  } catch (e) {
    localStorage.removeItem("paciente");
    return false;
  }
};

// Componente de Layout para páginas autenticadas
const Layout = ({ children }) => {
  return (
    <>
      <Nav />
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

const AuthWrapper = ({ children }) => {
  const [authState, setAuthState] = useState({ loading: true, isAuthenticated: false });

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await isPacienteLoggedIn();
      setAuthState({ loading: false, isAuthenticated: isAuth });
    };
    checkAuth();
  }, []);

  if (authState.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return authState.isAuthenticated ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const PublicWrapper = ({ children }) => {
  const [authState, setAuthState] = useState({ loading: true, isAuthenticated: false });

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await isPacienteLoggedIn();
      setAuthState({ loading: false, isAuthenticated: isAuth });
    };
    checkAuth();
  }, []);

  if (authState.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return authState.isAuthenticated ? <Navigate to="/home" replace /> : children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicWrapper>
              <Navigate to="/login" replace />
            </PublicWrapper>
          }
        />

        <Route
          path="/login"
          element={
            <PublicWrapper>
              <Login />
            </PublicWrapper>
          }
        />
        
        <Route
          path="/criar-conta"
          element={
            <PublicWrapper>
              <CadastroPaciente />
            </PublicWrapper>
          }
        />

        <Route
          path="/home"
          element={
            <AuthWrapper>
              <Home />
            </AuthWrapper>
          }
        />
        
        <Route
          path="/perfil"
          element={
            <AuthWrapper>
              <Perfil />
            </AuthWrapper>
          }
        />
        
        <Route
          path="/ficha-medica"
          element={
            <AuthWrapper>
              <FichaMedica />
            </AuthWrapper>
          }
        />
        

        <Route
          path="/upload-documentos"
          element={
            <AuthWrapper>
              <UploadDocumentos />
            </AuthWrapper>
          }
        />
        
        <Route
          path="/editar-documento"
          element={
            <AuthWrapper>
              <AlterarDocumento />
            </AuthWrapper>
          }
        />
        
        <Route
          path="/meus-documentos"
          element={
            <AuthWrapper>
              <ListarDocumentos />
            </AuthWrapper>
          }
        />
        
        <Route
          path="/visualizar-documento"
          element={
            <AuthWrapper>
              <VisualizadorDocumento />
            </AuthWrapper>
          }
        />
        


        <Route
          path="*"
          element={
            <PublicWrapper>
              <Navigate to="/login" replace />
            </PublicWrapper>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;