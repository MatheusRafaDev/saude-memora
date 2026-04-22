import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileMedical, FaUser, FaFileAlt, FaUpload, FaChartLine } from "react-icons/fa";

import "../styles/pages/Inicio.css";

function Inicio() {
  const [nome, setNome] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("paciente") || "{}");
    if (p?.nome) setNome(p.nome);
  }, []);

  const cards = [
    { title: "Meu Perfil",          desc: "Acesse e atualize seus dados pessoais",        icon: <FaUser />,       to: "/perfil" },
    { title: "Ficha Médica",         desc: "Consulte seu histórico de saúde e alergias",   icon: <FaFileAlt />,    to: "/ficha-medica" },
    { title: "Meus Documentos",      desc: "Exames, receitas e documentos clínicos",       icon: <FaFileMedical />,to: "/meus-documentos" },
    { title: "Processar Documento",  desc: "Digitalize e organize novos documentos",       icon: <FaUpload />,     to: "/upload-documentos" },
    { title: "Relatórios",           desc: "Medicamentos, exames e análises do histórico", icon: <FaChartLine />,  to: "/relatorio" },
  ];

  return (
    <div className="hm-page">
      <div className="hm-hero">
        <h1>Olá, {nome || "Paciente"}!</h1>
        <p>Escolha uma opção para navegar</p>
      </div>

      <div className="hm-grid">
        {cards.map((c, i) => (
          <div key={i} className="hm-card" onClick={() => navigate(c.to)}>
            <div className="hm-card__icon">{c.icon}</div>
            <span className="hm-card__title">{c.title}</span>
            <p className="hm-card__desc">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Inicio;