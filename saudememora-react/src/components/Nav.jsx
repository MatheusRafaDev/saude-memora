import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/components/Nav.css";

// Icon components instead of Bootstrap Icons
const Icon = ({ d, size = 20, stroke = "currentColor", strokeWidth = 1.8, fill = "none" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={fill} 
    stroke={stroke} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  docs: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  ficha: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  relatorio: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  user: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  chevronDown: "M19 9l-7 7-7-7",
};

const menuItems = [
  { path: "/inicio",              icon: "home",      text: "Início" },
  { path: "/meus-documentos",   icon: "docs",      text: "Documentos" },
  { path: "/upload-documentos", icon: "upload",    text: "Upload" },
  { path: "/ficha-medica",      icon: "ficha",     text: "Ficha Médica" },
  { path: "/relatorio",         icon: "relatorio", text: "Relatório" },
];

const Nav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [pacienteNome, setPacienteNome] = useState("");

  useEffect(() => {
    // Carregar nome do paciente do localStorage
    const storedPaciente = localStorage.getItem("paciente");
    if (storedPaciente) {
      const paciente = JSON.parse(storedPaciente);
      setPacienteNome(paciente.nome.split(" ")[0] || "Usuário");
    }
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("paciente");
    navigate("/login");
  };

  const handlePerfil = () => {
    navigate("/perfil");
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      {/* ── Top Nav — desktop ─────────────────────────────────── */}
      <nav className="sm-top-nav">
        <div className="sm-top-nav__container">
          <div className="sm-top-nav__brand">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#2563eb"/>
              <path d="M16 24s-9-6.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 12-11 12z" fill="#fff" opacity=".9"/>
              <path d="M9 16h3l2-4 2 8 2-4 1 2h4" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>SaúdeMemora</span>
          </div>

          <div className="sm-top-nav__menu">
            {menuItems.map(item => {
              const active = pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className={`sm-top-nav__item${active ? " active" : ""}`}>
                  <Icon d={ICONS[item.icon]} size={20} />
                  <span>{item.text}</span>
                </Link>
              );
            })}
          </div>

          {/* Dropdown do Perfil */}
          <div className="sm-top-nav__profile" ref={dropdownRef}>
            <button className="sm-top-nav__profile-btn" onClick={toggleDropdown}>
              <div className="profile-avatar">
                <Icon d={ICONS.user} size={20} />
              </div>
              <span className="profile-name">{pacienteNome}</span>
              <Icon d={ICONS.chevronDown} size={16} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="profile-dropdown">
                <button className="dropdown-item" onClick={handlePerfil}>
                  <Icon d={ICONS.profile} size={18} />
                  <span>Meu Perfil</span>
                </button>
                <hr className="dropdown-divider" />
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <Icon d={ICONS.logout} size={18} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Bottom nav — mobile ───────────────────────────────── */}
      <nav className="sm-bottom-nav">
        {menuItems.map(item => {
          const active = pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`sm-bottom-nav__item${active ? " active" : ""}`}>
              <Icon d={ICONS[item.icon]} size={22} />
              <span>{item.text}</span>
            </Link>
          );
        })}
        <Link to="/perfil" className={`sm-bottom-nav__item${pathname === "/perfil" ? " active" : ""}`}>
          <Icon d={ICONS.profile} size={22} />
          <span>Perfil</span>
        </Link>
      </nav>
    </>
  );
};

export default Nav;