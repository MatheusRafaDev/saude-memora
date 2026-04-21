import React from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const Nav = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/home", icon: "bi-house", text: "Início" },
    { path: "/perfil", icon: "bi-person", text: "Perfil" },
    { path: "/meus-documentos", icon: "bi-file-earmark-medical", text: "Docs" },
    {
      path: "/upload-documentos",
      icon: "bi-cloud-arrow-up",
      text: "Processar Doc",
    },
    { path: "/visualizar-ficha", icon: "bi-file-text", text: "Ficha" },
  ];

  return (
    <>
      {/* Sidebar para Desktop */}
      <nav className="sidebar d-none d-lg-flex flex-column bg-primary text-white shadow-lg">
        <div className="sidebar-header p-4">
          <h4 className="text-white mb-0">SaudeMemora</h4>
        </div>
        
        <div className="sidebar-menu flex-grow-1">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`sidebar-item d-flex align-items-center px-4 py-3 ${
                location.pathname === item.path ? "active" : ""
              }`}
              style={{
                color: location.pathname === item.path ? "#ffffff" : "#d1e5ff",
                backgroundColor: location.pathname === item.path ? "rgba(255, 255, 255, 0.1)" : "transparent",
                textDecoration: "none",
                transition: "all 0.3s ease",
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: "1.3rem", width: "2rem" }}></i>
              <span className="ms-3">{item.text}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Navigation para Mobile */}
      <nav className="bottom-nav d-flex d-lg-none justify-content-around align-items-center shadow-lg bg-primary text-white">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`nav-item text-center px-2 py-1 flex-fill ${
              location.pathname === item.path ? "active" : ""
            }`}
            style={{
              color: location.pathname === item.path ? "#ffffff" : "#d1e5ff",
              fontWeight: location.pathname === item.path ? "600" : "400",
              textDecoration: "none",
              fontSize: "0.85rem",
            }}
          >
            <i className={`bi ${item.icon}`} style={{ fontSize: "1.2rem" }}></i>
            <div>{item.text}</div>
          </Link>
        ))}
      </nav>

      <style jsx="true">{`
        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 260px;
          z-index: 1050;
          overflow-y: auto;
        }

        .sidebar-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-item {
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
        }

        .sidebar-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .sidebar-item.active {
          border-left-color: #ffffff;
          background-color: rgba(255, 255, 255, 0.1);
        }

        /* Bottom Navigation Styles */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          z-index: 1050;
        }

        .bottom-nav .nav-item {
          transition: all 0.3s ease;
        }

        .bottom-nav .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .bottom-nav .active {
          border-top: 3px solid #ffffff;
        }

        /* Ajuste para o conteúdo principal */
        @media (min-width: 992px) {
          body {
            margin-left: 260px;
          }
        }

        @media (max-width: 991.98px) {
          body {
            margin-bottom: 60px;
          }
        }
      `}</style>
    </>
  );
};

export default Nav;