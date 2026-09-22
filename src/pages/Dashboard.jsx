import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import RailNav from "../components/RailNav";
import DeleteButton from "../components/DeleteButton";
import UserMenu from "../components/UserMenu";
import { useSharedTable } from "../hooks/useSharedTable";
import { useCotizaciones } from "../hooks/useCotizaciones";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";
import { migrarLocalStorage } from "../utils/migrarLocalStorage";
import { IconoCampana, IconoPortapapeles, IconoBarras, IconoPersonas } from "../components/Icons";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIA_DESCANSO = 6;

function diasPara(f) {
  if (!f) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(f + "T00:00:00") - hoy) / 86400000);
}

function lunesDeLaSemana(fecha) {
  const d = new Date(fecha);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function numeroDeSemana(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const primerJueves = new Date(d.getFullYear(), 0, 4);
  primerJueves.setDate(primerJueves.getDate() + 3 - ((primerJueves.getDay() + 6) % 7));
  return 1 + Math.round((d - primerJueves) / (7 * 24 * 60 * 60 * 1000));
}

function Dashboard() {
  const { isAdmin, user } = useAuth();
  const { registros: pendientes, loading, guardar, eliminar } = useSharedTable("pendientes");
  const { registros: equiposInternos } = useSharedTable("equipos_internos");
  const { registros: equiposExternos } = useSharedTable("equipos_externos");
  const { registros: clientes } = useSharedTable("clientes");
  const { registros: colaboradores } = useSharedTable("colaboradores");
  const { registros: cotizacionesVenta } = useCotizaciones("venta");
  const { registros: cotizacionesRenta } = useCotizaciones("renta");
  const { registros: cotizacionesRefaccion } = useCotizaciones("refaccion");

  const equiposConMantto = [
    ...equiposInternos.map((e) => ({ ...e, origen: "Interno", href: "/internos" })),
    ...equiposExternos.filter((e) => e.estado !== "Devuelto").map((e) => ({ ...e, origen: "Externo", href: "/externos" }))
  ];

  const alertasMantto = equiposConMantto
    .map((e) => ({ ...e, dias: diasPara(e.proximoMantto) }))
    .filter((e) => e.dias !== null && e.dias <= 15)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 6);

  const manttosPendientes = equiposConMantto.filter((e) => {
    const d = diasPara(e.proximoMantto);
    return d !== null && d <= 15;
  }).length;

  // ---- Rentas por mes (últimos 6 meses) ----
  const hoy = new Date();
  const mesesGrafica = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
    return { clave: `${d.getFullYear()}-${d.getMonth()}`, etiqueta: MESES_CORTOS[d.getMonth()], cantidad: 0 };
  });
  cotizacionesRenta.forEach((c) => {
    if (!c.fecha) return;
    const partes = c.fecha.split("/");
    if (partes.length !== 3) return;
    const d = new Date(+partes[2], +partes[1] - 1, +partes[0]);
    if (isNaN(d)) return;
    const m = mesesGrafica.find((x) => x.clave === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.cantidad += 1;
  });
  const maxRentasMes = Math.max(1, ...mesesGrafica.map((m) => m.cantidad));

  // ---- Asistencias de la semana actual ----
  const [asistSemana, setAsistSemana] = useState(null);
  const claveSemanaActual = `${lunesDeLaSemana(hoy).getFullYear()}-S${numeroDeSemana(hoy)}`;
  useEffect(() => {
    supabase
      .from("asistencias")
      .select("data")
      .eq("id", claveSemanaActual)
      .maybeSingle()
      .then(({ data }) => setAsistSemana(data?.data || {}));
  }, [claveSemanaActual]);

  const colaboradoresActivos = colaboradores.filter((c) => !c.baja);
  let presentes = 0, faltas = 0;
  colaboradoresActivos.forEach((c) => {
    for (let i = 0; i < 7; i++) {
      if (i === DIA_DESCANSO) continue;
      const dia = asistSemana?.[c.id]?.[i];
      if (dia?.estado === "A") presentes++;
      else if (dia?.estado === "F") faltas++;
    }
  });
  const totalRegistrosSemana = presentes + faltas;
  const porcentajeAsistencia = totalRegistrosSemana ? Math.round((presentes / totalRegistrosSemana) * 100) : null;

  const [nuevoPendiente, setNuevoPendiente] = useState("");
  const [nuevoAsignado, setNuevoAsignado] = useState("");
  const [migrando, setMigrando] = useState(false);
  const [resultadoMigracion, setResultadoMigracion] = useState(null);

  const correrMigracion = async () => {
    if (
      !window.confirm(
        "Esto sube a la base de datos compartida todo lo que este navegador tenga guardado localmente (equipos, fletes, checklists, clientes, cotizaciones, etc.). Solo debe correrse una vez. ¿Continuar?"
      )
    )
      return;
    setMigrando(true);
    const resumen = await migrarLocalStorage(user?.email, user?.id);
    setResultadoMigracion(resumen);
    setMigrando(false);
  };

  const agregarPendiente = () => {
    if (!nuevoPendiente.trim()) return;

    guardar(String(Date.now()), {
      texto: nuevoPendiente,
      asignado: nuevoAsignado.trim(),
      completado: false
    });

    setNuevoPendiente("");
    setNuevoAsignado("");
  };

  const togglePendiente = (item) => {
    guardar(item.id, { ...item, completado: !item.completado });
  };

  const eliminarPendiente = (item) => {
    eliminar(item.id);
  };

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="logo-container">
          <img
            src={logo}
            alt="MAQSISTEM"
            className="logo-img"
          />

          <h2>MAQSISTEM</h2>
          <p>Sistema Integral</p>
        </div>

        <div className="menu-section">
          <h4>Clientes</h4>
          <RailNav
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
            items={[
              { label: "Equipos Internos", href: "/internos" },
              { label: "Equipos Externos", href: "/externos" }
            ]}
          />
        </div>

        <div className="menu-section">
          <h4>Recepción</h4>
          <RailNav
            items={[{ label: "Recepción Equipos", href: "/recepcion" }]}
          />
        </div>

        <div className="menu-section">
          <h4>Administración</h4>
          <RailNav
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

      <main className="contenido">

        <header
          className="header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}
        >
          <div>
            <h1>Panel Ejecutivo</h1>
            <p>Sistema Integral de Administración de Maquinaria</p>
          </div>

          <UserMenu />
        </header>

        {isAdmin && (
          <div
            style={{
              background: "#fff",
              border: "1px dashed #ccc",
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "25px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ flex: 1, minWidth: "220px" }}>
              <strong>Migrar datos de este navegador</strong>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#777" }}>
                Solo se hace una vez: sube lo que ya capturaste aquí a la base
                de datos compartida, para que todos lo vean.
              </p>
            </div>
            <button
              onClick={correrMigracion}
              disabled={migrando}
              style={{
                background: "var(--acento)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontWeight: "700",
                cursor: migrando ? "default" : "pointer",
                opacity: migrando ? 0.6 : 1
              }}
            >
              {migrando ? "Migrando…" : "Migrar ahora"}
            </button>
            {resultadoMigracion && (
              <div style={{ width: "100%", fontSize: "12.5px", color: "#555" }}>
                {resultadoMigracion.map((linea, i) => (
                  <div key={i}>{linea}</div>
                ))}
                {resultadoMigracion.length === 0 && <div>No había nada nuevo que migrar.</div>}
              </div>
            )}
          </div>
        )}

        <section className="cards-grid">

          <Link to="/internos" className="card">
            <h3>EQUIPOS INTERNOS</h3>
            <div className="numero">{equiposInternos.length}</div>
            <p>Unidades registradas</p>
          </Link>

          <Link to="/clientes" className="card">
            <h3>CLIENTES ACTIVOS</h3>
            <div className="numero">{clientes.length}</div>
            <p>Clientes registrados</p>
          </Link>

          <Link to="/rentas" className="card">
            <h3>ALQUILERES ACTIVOS</h3>
            <div className="numero">{cotizacionesRenta.length}</div>
            <p>Cotizaciones de renta</p>
          </Link>

          <Link to="/ventas" className="card">
            <h3>COTIZACIONES TOTALES</h3>
            <div className="numero">{cotizacionesVenta.length + cotizacionesRenta.length + cotizacionesRefaccion.length}</div>
            <p>Venta + renta + refacciones (tuyas)</p>
          </Link>

          <Link to="/internos" className="card">
            <h3>MANTTOS PENDIENTES</h3>
            <div className="numero">{manttosPendientes}</div>
            <p>Próximos o vencidos</p>
          </Link>

        </section>

        <section className="paneles">

          <div className="panel">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconoCampana style={{ color: "var(--acento)" }} /> Alertas y Noticias
            </h3>

            {alertasMantto.length === 0 ? (
              <p>No hay mantenimientos próximos ni vencidos en los siguientes 15 días.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {alertasMantto.map((e) => {
                  const vencido = e.dias < 0;
                  const color = vencido ? "#c62828" : e.dias <= 3 ? "#c98a00" : "#1f8b4c";
                  return (
                    <Link
                      key={e.origen + e.id}
                      to={e.href}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textDecoration: "none",
                        color: "inherit",
                        padding: "8px 0",
                        borderBottom: "1px solid #ececec"
                      }}
                    >
                      <span>
                        <strong>{e.tipo || "Equipo"}</strong>{" "}
                        <span style={{ color: "#999", fontSize: "12px" }}>
                          {e.marca} {e.modelo} · {e.origen}
                        </span>
                      </span>
                      <span style={{ color, fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap" }}>
                        {vencido ? `Vencido ${Math.abs(e.dias)} d` : `Faltan ${e.dias} d`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel">

            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconoPortapapeles style={{ color: "var(--acento)" }} /> Pendientes
            </h3>

            <div className="agregar-pendiente">

              <input
                type="text"
                placeholder="Nuevo pendiente..."
                value={nuevoPendiente}
                onChange={(e) =>
                  setNuevoPendiente(e.target.value)
                }
              />

              <input
                type="text"
                placeholder="¿Para quién es?"
                value={nuevoAsignado}
                onChange={(e) =>
                  setNuevoAsignado(e.target.value)
                }
                style={{ maxWidth: "160px" }}
              />

              <button
                className="btn-agregar"
                onClick={agregarPendiente}
              >
                Agregar
              </button>

            </div>

            <div className="lista-pendientes">

              {loading && <p style={{ color: "#999" }}>Cargando…</p>}

              {!loading && pendientes.map((item) => (

                <div
                  key={item.id}
                  className="pendiente-item"
                >

                  <span
                    style={{
                      textDecoration:
                        item.completado
                          ? "line-through"
                          : "none",
                    }}
                  >
                    {item.texto}
                    {item.asignado && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "var(--acento)",
                          background: "#f7e6e9",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {item.asignado}
                      </span>
                    )}
                  </span>

                  <div className="acciones-pendiente">

                    <button
                      className="btn-check"
                      onClick={() =>
                        togglePendiente(item)
                      }
                    >
                      ✓
                    </button>

                    {(
                      <DeleteButton
                        size="sm"
                        title="Eliminar pendiente"
                        onConfirm={() => eliminarPendiente(item)}
                      />
                    )}

                  </div>

                </div>

              ))}

            </div>

          </div>

          <div className="panel">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconoBarras style={{ color: "var(--acento)" }} /> Rentas por Mes
            </h3>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "150px", marginTop: "10px" }}>
              {mesesGrafica.map((m) => (
                <div key={m.clave} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--acento)" }}>{m.cantidad}</span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "34px",
                      height: `${Math.max(4, (m.cantidad / maxRentasMes) * 100)}px`,
                      background: "var(--acento)",
                      borderRadius: "5px 5px 0 0"
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "#999", textTransform: "capitalize" }}>{m.etiqueta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">

            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconoPersonas style={{ color: "var(--acento)" }} /> Asistencias de la Semana
            </h3>

            {colaboradoresActivos.length === 0 ? (
              <p>Aún no hay colaboradores registrados.</p>
            ) : porcentajeAsistencia === null ? (
              <p>Todavía no se captura asistencia esta semana.</p>
            ) : (
              <p>
                <strong style={{ fontSize: "28px", color: "var(--acento)" }}>{porcentajeAsistencia}%</strong>{" "}
                de asistencia esta semana ({presentes} asistencias, {faltas} faltas registradas de{" "}
                {colaboradoresActivos.length} colaboradores).
              </p>
            )}

            <Link
              to="/asistencias"
              className="btn-panel"
            >
              Ir a Asistencias
            </Link>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;