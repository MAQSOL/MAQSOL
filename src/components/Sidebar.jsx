import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import RailNav from "./RailNav";

function Sidebar() {
  const [abierto, setAbierto] = useState(false);

  const cerrar = () => setAbierto(false);

  return (
    <>
      <button
        className="btn-menu"
        onClick={() => setAbierto(!abierto)}
        title="Menú"
      >
        {abierto ? "✕" : "☰"}
      </button>

      <div
        className={abierto ? "fondo-menu visible" : "fondo-menu"}
        onClick={cerrar}
      ></div>

      <aside className={abierto ? "sidebar abierta" : "sidebar"}>

        <Link
          to="/"
          onClick={cerrar}
          className="logo-container"
          style={{ display: "block", textDecoration: "none", color: "inherit", cursor: "pointer" }}
          title="Ir al Dashboard"
        >
          <img
            src={logo}
            alt="MAQSISTEM"
            className="logo-img"
          />

          <h2>MAQSISTEM</h2>
          <p>Sistema Integral</p>
        </Link>

        <div className="menu-section">
          <h4>Clientes</h4>
          <RailNav
            onNavigate={cerrar}
            items={[
              { label: "Cotización Venta", href: "/ventas" },
              { label: "Cotización Renta", href: "/rentas" },
              { label: "Cotización Refacciones", href: "/refacciones" }
            ]}
          />
        </div>

        <div className="menu-section">
          <h4>Equipos</h4>
          <RailNav
            onNavigate={cerrar}
            items={[
              { label: "Equipos Internos", href: "/internos" },
              { label: "Equipos Externos", href: "/externos" },
              { label: "Alquileres Activos", href: "/alquileres" }
            ]}
          />
        </div>

        <div className="menu-section">
          <h4>Recepción</h4>
          <RailNav
            onNavigate={cerrar}
            items={[{ label: "Recepción Equipos", href: "/recepcion" }]}
          />
        </div>

        <div className="menu-section">
          <h4>Administración</h4>
          <RailNav
            onNavigate={cerrar}
            items={[
              { label: "Asistencias", href: "/asistencias" },
              { label: "Bitácora Fleteros", href: "/bitacora" },
              { label: "Gestión de Clientes", href: "/clientes" },
              { label: "Lista de Precios", href: "/precios" },
              { label: "Reporte de Horas", href: "/horas" },
              { label: "Generador de Contratos", href: "/contratos" }
            ]}
          />
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
