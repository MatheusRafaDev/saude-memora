import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Nav from "../components/Nav";
import "../styles/global.css";

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
export const Layout = ({ children }) => {
  return (
    <>
      <Nav />
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

export const AuthWrapper = ({ children }) => {
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

export const PublicWrapper = ({ children }) => {
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

  return authState.isAuthenticated ? <Navigate to="/inicio" replace /> : children;
};