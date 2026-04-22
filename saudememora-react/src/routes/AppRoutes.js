import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import CadastroPaciente from "../pages/CadastroPaciente";
import FichaMedica from "../pages/FichaMedica";
import UploadDocumentos from "../pages/UploadDocumentos";
import Perfil from "../pages/Perfil";
import ListarDocumentos from "../pages/ListarDocumentos";
import VisualizadorDocumento from "../pages/VisualizadorDocumento";
import AlterarDocumento from "../components/AlterarDocumento"; 

import { AuthWrapper, PublicWrapper } from "./RouteWrappers";

const AppRoutes = () => {
  return (
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
  );
};

export default AppRoutes;