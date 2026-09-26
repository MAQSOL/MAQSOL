import Layout from "../../components/Layout";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "../Clientes/Ventas.css";
import { descargarExcelBonito, nombreArchivoSemana } from "../../utils/exportExcel";
import DeleteButton from "../../components/DeleteButton";
import { supabase } from "../../supabaseClient";
import { useListaCompartida } from "../../hooks/useSharedTable";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIA_DESCANSO = 6;

const VINO = "var(--acento)";
const VINO_IMPRESION = "#8f1d2c"; // hex fijo para el PDF (ventana aparte, sin las variables CSS de la app)
const VERDE = "#2e7d32";
const ROJO = "#b00020";

const lunesDeLaSemana = (fecha) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
};

const numeroDeSemana = (fecha) => {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const primerJueves = new Date(d.getFullYear(), 0, 4);
  primerJueves.setDate(
    primerJueves.getDate() + 3 - ((primerJueves.getDay() + 6) % 7)
  );
  return 1 + Math.round((d - primerJueves) / (7 * 24 * 60 * 60 * 1000));
};

const formatoCorto = (f) =>
  f.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" });

const aMinutos = (hora) => {
  if (!hora) return null;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

const minutosATexto = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

const esMismoDia = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

function Asistencias() {

  const [pestana, setPestana] = useState("semanal");

  // ==========================
  // COLABORADORES
  // ==========================

  const [colaboradores, guardarColaboradores] = useListaCompartida("colaboradores");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPuesto, setNuevoPuesto] = useState("");

  const agregarColaborador = () => {
    if (!nuevoNombre.trim()) {
      alert("Escribe el nombre del colaborador");
      return;
    }
    guardarColaboradores([
      ...colaboradores,
      {
        id: String(Date.now()),
        nombre: nuevoNombre.trim(),
        puesto: nuevoPuesto.trim(),
        baja: false
      }
    ]);
    setNuevoNombre("");
    setNuevoPuesto("");
  };

  const toggleBaja = (id) => {
    guardarColaboradores(
      colaboradores.map((c) =>
        c.id === id ? { ...c, baja: !c.baja } : c
      )
    );
  };

  const eliminarColaborador = (id) => {
    guardarColaboradores(colaboradores.filter((c) => c.id !== id));
  };

  // ==========================
  // SEMANA
  // ==========================

  const [lunes, setLunes] = useState(() => lunesDeLaSemana(new Date()));
  const hoy = new Date();

  const [irSemana, setIrSemana] = useState("");
  const [irAnio, setIrAnio] = useState(new Date().getFullYear());

  const irASemana = () => {
    const semana = parseInt(irSemana, 10);
    if (!semana || semana < 1 || semana > 53) {
      alert("Escribe un número de semana válido (1 a 53)");
      return;
    }
    const anio = parseInt(irAnio, 10) || new Date().getFullYear();
    const simple = new Date(anio, 0, 1 + (semana - 1) * 7);
    const dow = simple.getDay();
    const destino = new Date(simple);
    if (dow <= 4) destino.setDate(simple.getDate() - dow + 1);
    else destino.setDate(simple.getDate() + 8 - dow);
    setLunes(lunesDeLaSemana(destino));
  };

  const fechasSemana = DIAS.map((_, i) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + i);
    return d;
  });

  const claveSemana = `${lunes.getFullYear()}-S${numeroDeSemana(lunes)}`;

  const cambiarSemana = (delta) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + delta * 7);
    setLunes(d);
  };

  // ==========================
  // REGISTROS
  // ==========================

  const [registros, setRegistros] = useState({});

  useEffect(() => {
    supabase
      .from("asistencias")
      .select("*")
      .then(({ data }) => {
        const todo = {};
        (data || []).forEach((r) => {
          todo[r.id] = r.data || {};
        });
        setRegistros(todo);
      });
  }, []);

  const guardarRegistros = async (nuevos) => {
    setRegistros(nuevos);
    const { error } = await supabase.from("asistencias").upsert({
      id: claveSemana,
      data: nuevos[claveSemana] || {},
      updated_at: new Date().toISOString()
    });
    if (error) alert("No se pudo guardar la asistencia: " + error.message);
  };

  const obtenerDia = (id, i) =>
    registros?.[claveSemana]?.[id]?.[i] || {
      estado: "",
      entrada: "",
      salida: "",
      observaciones: ""
    };

  const actualizarDia = (id, i, cambios) => {
    const copia = JSON.parse(JSON.stringify(registros));
    if (!copia[claveSemana]) copia[claveSemana] = {};
    if (!copia[claveSemana][id]) copia[claveSemana][id] = {};
    copia[claveSemana][id][i] = { ...obtenerDia(id, i), ...cambios };
    guardarRegistros(copia);
  };

  const ciclarEstado = (id, i) => {
    const actual = obtenerDia(id, i);
    const nuevo =
      actual.estado === "" ? "A" : actual.estado === "A" ? "F" : "";

    const cambios = { estado: nuevo };

    if (nuevo === "A" && !actual.entrada && !actual.salida && i !== DIA_DESCANSO) {
      cambios.entrada = "08:00";
      cambios.salida = "18:00";
    }

    actualizarDia(id, i, cambios);
  };

  // ==========================
  // HORAS EXTRAS
  // ==========================

  const extrasDelDia = (dia, indice) => {
    if (dia.estado !== "A") return 0;

    const entrada = aMinutos(dia.entrada);
    const salida = aMinutos(dia.salida);
    if (salida === null) return 0;

    // Domingo es descanso: todo lo trabajado cuenta como extra
    if (indice === DIA_DESCANSO) {
      if (entrada === null) return 0;
      const trabajado = salida - entrada;
      return trabajado > 0 ? trabajado : 0;
    }

    const jornada = aMinutos("18:00");
    return salida > jornada ? salida - jornada : 0;
  };

  const resumenColaborador = (id) => {
    let asistencias = 0;
    let faltas = 0;
    let extras = 0;

    DIAS.forEach((_, i) => {
      const dia = obtenerDia(id, i);
      if (dia.estado === "A") asistencias++;
      if (dia.estado === "F" && i !== DIA_DESCANSO) faltas++;
      extras += extrasDelDia(dia, i);
    });

    return { asistencias, faltas, extras };
  };

  const totalExtrasSemana = colaboradores.reduce(
    (acc, c) => acc + resumenColaborador(c.id).extras,
    0
  );

  // ==========================
  // DETALLE
  // ==========================

  const [detalle, setDetalle] = useState(null);

  // ==========================
  // DESCARGAS
  // ==========================

  const descargarExcel = () => {
    const columnas = [
      "Colaborador", "Puesto", "Día", "Fecha", "Estado",
      "Entrada", "Salida", "Horas extras", "Observaciones"
    ];
    const filas = [];

    colaboradores.forEach((c) => {
      DIAS.forEach((nombreDia, i) => {
        const dia = obtenerDia(c.id, i);
        const estadoTexto =
          dia.estado === "A" ? "Asistió" : dia.estado === "F" ? "Falta" : "";
        const extras = extrasDelDia(dia, i);
        filas.push([
          c.nombre, c.puesto, nombreDia, formatoCorto(fechasSemana[i]),
          estadoTexto, dia.entrada, dia.salida,
          extras > 0 ? minutosATexto(extras) : "",
          dia.observaciones || ""
        ]);
      });
    });

    descargarExcelBonito({
      titulo: "Lista de Asistencia",
      subtitulo: `Semana ${numeroDeSemana(lunes)} \u00b7 ${lunes.getFullYear()} \u00b7 Del ${formatoCorto(fechasSemana[0])} al ${formatoCorto(fechasSemana[6])}`,
      columnas,
      filas,
      nombreArchivo: nombreArchivoSemana("A", lunes)
    });
  };

  const DIAS_PDF = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const pad2 = (n) => String(n).padStart(2, "0");
  const fechaLarga = (d) =>
    `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

  const descargarPDF = () => {
    const ventana = window.open("", "_blank");
    const mesCrudo = lunes.toLocaleDateString("es-MX", { month: "long" });
    const mesNombre =
      mesCrudo.charAt(0).toUpperCase() + mesCrudo.slice(1).toLowerCase();
    const semana = numeroDeSemana(lunes);
    const mesAnio =
      String(lunes.getMonth() + 1).padStart(2, "0") + lunes.getFullYear();
    const nombreArchivo = `A-SEMANA${semana}-${mesAnio}`;

    let tarjetas = "";
    colaboradores.forEach((c) => {
      const filasDias = DIAS_PDF.map((nombreDia, i) => {
        const esDomingo = i === DIA_DESCANSO;
        const dia = obtenerDia(c.id, i);
        const fecha = fechaLarga(fechasSemana[i]);
        let clase = "";
        let texto = "";
        if (esDomingo) {
          clase = "descanso";
          texto = "Descanso";
        } else if (dia.estado === "A") {
          clase = "asistio";
          texto = "A";
        } else if (dia.estado === "F") {
          clase = "falta";
          texto = "F";
        }
        return `<tr class="${esDomingo ? "fila-domingo" : ""}">
          ${i === 0 ? `<td class="nombre" rowspan="${DIAS_PDF.length}">${c.puesto ? `${c.nombre}<br>(${c.puesto.toUpperCase()})` : c.nombre}</td>` : ""}
          <td class="dia">${nombreDia}</td>
          <td class="fecha">${fecha}</td>
          <td class="estado ${clase}">${texto}</td>
        </tr>`;
      }).join("");

      const observaciones = DIAS_PDF.map((_, i) => obtenerDia(c.id, i).observaciones)
        .filter(Boolean)
        .join(" ");

      tarjetas += `
        <table class="tarjeta">
          <tr class="encabezado">
            <th class="mes">${mesNombre}</th>
            <th>ASISTENCIAS SEMANA:</th>
            <th class="centrado">${semana}</th>
            <th class="centrado">ASISTENCIA</th>
          </tr>
          ${filasDias}
          <tr class="fila-obs">
            <td class="obs-label">Observaciones:</td>
            <td class="obs-texto" colspan="3">${observaciones}</td>
          </tr>
        </table>`;
    });

    ventana.document.write(`
      <html><head><title>${nombreArchivo}</title>
      <style>
        @page{size:auto;margin:0;}
        *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:12mm 10mm;color:#000;}
        h2{margin:0 0 16px;color:${VINO_IMPRESION};font-size:17px;}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 24px;}
        .tarjeta{border-collapse:collapse;width:100%;border:1px solid #000;page-break-inside:avoid;font-size:11px;}
        .tarjeta td,.tarjeta th{border:1px solid #999;padding:5px 8px;}
        .encabezado th{border:1px solid #000;border-bottom:3px solid ${VINO_IMPRESION};background:#fff;font-weight:700;text-align:left;padding:6px 8px;}
        .encabezado th.centrado{text-align:center;}
        .encabezado .mes{font-size:13px;letter-spacing:0.5px;text-align:center;}
        .nombre{background:#d9d9d9;font-weight:700;text-align:center;vertical-align:middle;width:22%;}
        .dia{text-transform:lowercase;width:16%;}
        .fecha{text-align:center;width:20%;}
        .estado{text-align:center;font-weight:800;width:20%;}
        .estado.asistio{background:#a9d18e;color:#1a7f37;}
        .estado.falta{background:#f4b6b6;color:#c62828;}
        .fila-domingo td{background:#bcd4e6;}
        .fila-domingo .estado{background:#bcd4e6;font-weight:700;color:#1a4d7a;}
        .fila-obs td{background:#fff;}
        .obs-label{background:#d9d9d9;font-weight:700;text-align:center;}
        .obs-texto{font-weight:700;text-align:center;padding:10px 8px;}
        @media print{.grid{gap:16px 20px;}}
      </style></head>
      <body>
        <h2>Lista de Asistencia · ${mesNombre} · Semana ${semana} · ${lunes.getFullYear()}</h2>
        <div class="grid">${tarjetas}</div>
      </body></html>
    `);

    ventana.document.close();
    ventana.print();
  };

  // ==========================
  // ESTILOS
  // ==========================

  const celda = {
    borderBottom: "1px solid #eee",
    padding: "14px 8px",
    textAlign: "center",
    verticalAlign: "middle"
  };

  const encabezado = {
    padding: "14px 8px",
    textAlign: "center",
    background: VINO,
    color: "#fff",
    fontWeight: "700",
    fontSize: "13px",
    letterSpacing: "0.5px"
  };

  const botonEstado = (estado, descanso) => ({
    width: "42px",
    height: "42px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "17px",
    color: estado === "" ? "#bbb" : "#fff",
    background:
      estado === "A"
        ? VERDE
        : estado === "F"
        ? ROJO
        : descanso
        ? "#e4e4e4"
        : "#f0f0f0",
    transition: ".2s",
    boxShadow: estado !== "" ? "0 2px 6px rgba(0,0,0,.18)" : "none"
  });

  const input = {
    width: "100%",
    padding: "13px 15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    textAlign: "center"
  };

  const tab = (activa) => ({
    padding: "13px 34px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
    background: activa ? VINO : "#f0f0f0",
    color: activa ? "#fff" : "#888",
    transition: ".2s"
  });

  const flecha = {
    background: VINO,
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    cursor: "pointer",
    fontSize: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const chip = (color, fondo) => ({
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: color,
    background: fondo,
    margin: "2px"
  });

  return (
    <Layout>

      <div className="ventas-layout" style={{ gridTemplateColumns: "1fr" }}>

        <div className="ventas-container">

          {/* ENCABEZADO */}
          <div className="panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "25px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <img src={logo} alt="MAQSISTEM" style={{ width: "70px" }} />
                <h2 style={{ margin: 0 }}>Lista de Asistencia</h2>
              </div>

              <Link to="/" className="btn-panel">← Dashboard</Link>
            </div>
          </div>

          {/* PESTAÑAS */}
          <div className="panel">
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                marginBottom: "25px"
              }}
            >
              <button style={tab(pestana === "semanal")} onClick={() => setPestana("semanal")}>
                Semanal
              </button>
              <button style={tab(pestana === "quincenal")} onClick={() => setPestana("quincenal")}>
                Quincenal
              </button>
            </div>
          </div>

          {pestana === "quincenal" && (
            <div className="panel">
              <div
                style={{
                  padding: "70px 20px",
                  textAlign: "center",
                  border: "2px dashed #e0e0e0",
                  borderRadius: "16px",
                  background: "#fafafa"
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗓️</div>
                <h3 style={{ color: "#777", marginBottom: "8px" }}>Próximamente...</h3>
                <p style={{ color: "#999" }}>
                  El control quincenal estará disponible más adelante.
                </p>
              </div>
            </div>
          )}

          {pestana === "semanal" && (
            <>

              {/* ALTA */}
              <div className="panel">
                <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
                  Agregar Colaborador
                </h3>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    maxWidth: "760px",
                    margin: "0 auto"
                  }}
                >
                  <input
                    placeholder="Nombre completo"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    style={{ ...input, flex: "1 1 260px" }}
                  />

                  <input
                    placeholder="Puesto (ej. Operador)"
                    value={nuevoPuesto}
                    onChange={(e) => setNuevoPuesto(e.target.value)}
                    style={{ ...input, flex: "1 1 220px" }}
                  />

                  <button
                    onClick={agregarColaborador}
                    style={{
                      background: VERDE,
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "13px 30px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "15px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* NAVEGACION */}
              <div className="panel">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "18px",
                    flexWrap: "wrap",
                    marginBottom: "18px"
                  }}
                >
                  <button style={flecha} onClick={() => cambiarSemana(-1)}>←</button>

                  <div style={{ textAlign: "center", minWidth: "210px" }}>
                    <h3 style={{ margin: 0, color: VINO }}>
                      Semana {numeroDeSemana(lunes)} · {lunes.getFullYear()}
                    </h3>
                    <small style={{ color: "#888" }}>
                      Del {formatoCorto(fechasSemana[0])} al {formatoCorto(fechasSemana[6])}
                    </small>
                  </div>

                  <button style={flecha} onClick={() => cambiarSemana(1)}>→</button>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "14px"
                  }}
                >
                  <small style={{ color: "#999" }}>Ir directo a la semana:</small>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    placeholder="Núm."
                    value={irSemana}
                    onChange={(e) => setIrSemana(e.target.value)}
                    style={{ ...input, width: "70px", padding: "8px 10px" }}
                  />
                  <input
                    type="number"
                    placeholder="Año"
                    value={irAnio}
                    onChange={(e) => setIrAnio(e.target.value)}
                    style={{ ...input, width: "85px", padding: "8px 10px" }}
                  />
                  <button
                    onClick={irASemana}
                    style={{
                      background: VINO,
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 18px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px"
                    }}
                  >
                    Ir
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "20px"
                  }}
                >
                  <button
                    onClick={() => setLunes(lunesDeLaSemana(new Date()))}
                    style={{
                      background: "#f0f0f0",
                      color: "#666",
                      border: "none",
                      borderRadius: "10px",
                      padding: "11px 22px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Semana actual
                  </button>

                  <button
                    onClick={descargarExcel}
                    style={{
                      background: VERDE,
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "11px 26px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Excel
                  </button>

                  <button
                    onClick={descargarPDF}
                    style={{
                      background: VINO,
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "11px 26px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    PDF
                  </button>
                </div>

                <p
                  style={{
                    color: "#999",
                    fontSize: "12.5px",
                    textAlign: "center",
                    marginBottom: "22px",
                    lineHeight: "1.7"
                  }}
                >
                  Jornada de 8:00 a 18:00 con comida de 13:00 a 14:00 · Domingo de
                  descanso
                  <br />
                  Un clic marca asistencia, dos marcan falta, tres limpian la celda
                </p>

                {colaboradores.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "50px 20px",
                      color: "#aaa",
                      border: "2px dashed #eee",
                      borderRadius: "14px"
                    }}
                  >
                    Aún no hay colaboradores. Agrega el primero arriba.
                  </div>
                ) : (
                  <div
                    style={{
                      overflowX: "auto",
                      borderRadius: "14px",
                      border: "1px solid #eee",
                      boxShadow: "0 2px 10px rgba(0,0,0,.05)"
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "13px",
                        minWidth: "980px"
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              ...encabezado,
                              textAlign: "left",
                              paddingLeft: "20px",
                              minWidth: "200px"
                            }}
                          >
                            COLABORADOR
                          </th>

                          {DIAS.map((nombreDia, i) => (
                            <th
                              key={i}
                              style={{
                                ...encabezado,
                                background:
                                  i === DIA_DESCANSO ? "#5a5a5a" : VINO,
                                minWidth: "88px"
                              }}
                            >
                              {nombreDia.slice(0, 3).toUpperCase()}
                              <br />
                              <small style={{ fontWeight: "400", opacity: ".85" }}>
                                {formatoCorto(fechasSemana[i])}
                              </small>
                            </th>
                          ))}

                          <th style={{ ...encabezado, background: "#2b2b2b", minWidth: "130px" }}>
                            RESUMEN
                          </th>

                          <th style={{ ...encabezado, background: "#2b2b2b", width: "60px" }}></th>
                        </tr>
                      </thead>

                      <tbody>
                        {colaboradores.map((c, fila) => {
                          const r = resumenColaborador(c.id);

                          return (
                            <tr
                              key={c.id}
                              style={{
                                background: fila % 2 === 0 ? "#fff" : "#fbfbfb",
                                opacity: c.baja ? 0.55 : 1
                              }}
                            >
                              <td
                                style={{
                                  ...celda,
                                  textAlign: "left",
                                  paddingLeft: "20px"
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: "14px",
                                    textDecoration: c.baja ? "line-through" : "none"
                                  }}
                                >
                                  {c.nombre}
                                </strong>
                                {c.baja && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "10px",
                                      fontWeight: "700",
                                      color: ROJO,
                                      background: "#fdeaec",
                                      padding: "2px 7px",
                                      borderRadius: "10px"
                                    }}
                                  >
                                    DE BAJA
                                  </span>
                                )}
                                <br />
                                <small style={{ color: "#999" }}>{c.puesto}</small>
                                <br />
                                <button
                                  onClick={() => toggleBaja(c.id)}
                                  style={{
                                    marginTop: "4px",
                                    background: "transparent",
                                    border: "none",
                                    color: c.baja ? VERDE : "#999",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    padding: 0
                                  }}
                                >
                                  {c.baja ? "Reactivar" : "Dar de baja"}
                                </button>
                              </td>

                              {DIAS.map((_, i) => {
                                const dia = obtenerDia(c.id, i);
                                const extras = extrasDelDia(dia, i);
                                const descanso = i === DIA_DESCANSO;
                                const esHoy = esMismoDia(fechasSemana[i], hoy);

                                return (
                                  <td
                                    key={i}
                                    style={{
                                      ...celda,
                                      background: descanso
                                        ? "#f7f7f7"
                                        : esHoy
                                        ? "#fff8f9"
                                        : "transparent"
                                    }}
                                  >
                                    <button
                                      style={botonEstado(dia.estado, descanso)}
                                      onClick={() => ciclarEstado(c.id, i)}
                                      title={
                                        descanso
                                          ? "Domingo de descanso · marcar solo si trabajó"
                                          : "Clic para cambiar"
                                      }
                                    >
                                      {dia.estado === "A"
                                        ? "✓"
                                        : dia.estado === "F"
                                        ? "✕"
                                        : descanso
                                        ? "D"
                                        : "—"}
                                    </button>

                                    <div style={{ marginTop: "6px" }}>
                                      <button
                                        onClick={() =>
                                          setDetalle({ colaborador: c, indiceDia: i })
                                        }
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          color: "#bbb",
                                          cursor: "pointer",
                                          fontSize: "11px"
                                        }}
                                      >
                                        detalle
                                      </button>
                                    </div>

                                    {extras > 0 && (
                                      <div
                                        style={{
                                          fontSize: "10.5px",
                                          color: VERDE,
                                          fontWeight: "700",
                                          marginTop: "2px"
                                        }}
                                      >
                                        +{minutosATexto(extras)}
                                      </div>
                                    )}

                                    {dia.observaciones && (
                                      <div style={{ fontSize: "11px", marginTop: "2px" }}>
                                        📝
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                              <td style={celda}>
                                <div>
                                  <span style={chip(VERDE, "#e8f5e9")}>
                                    {r.asistencias} asist.
                                  </span>
                                </div>
                                <div>
                                  <span style={chip(ROJO, "#fdeaec")}>
                                    {r.faltas} faltas
                                  </span>
                                </div>
                                {r.extras > 0 && (
                                  <div>
                                    <span style={chip("#8a6d00", "#fff6d8")}>
                                      +{minutosATexto(r.extras)}
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td style={celda}>
                                <DeleteButton
                                  size="sm"
                                  title="Eliminar colaborador"
                                  onConfirm={() => eliminarColaborador(c.id)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </>
          )}

        </div>

      </div>

      {/* DETALLE */}
      {detalle && (
        <div
          onClick={() => setDetalle(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "32px",
              width: "100%",
              maxWidth: "470px",
              maxHeight: "90vh",
              overflowY: "auto",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,.3)"
            }}
          >
            <h3 style={{ marginBottom: "4px" }}>{detalle.colaborador.nombre}</h3>
            <p style={{ color: "#999", marginBottom: "24px", fontSize: "14px" }}>
              {DIAS[detalle.indiceDia]} {formatoCorto(fechasSemana[detalle.indiceDia])}
              {detalle.indiceDia === DIA_DESCANSO && " · día de descanso"}
            </p>

            {(() => {
              const dia = obtenerDia(detalle.colaborador.id, detalle.indiceDia);
              const extras = extrasDelDia(dia, detalle.indiceDia);
              const descanso = detalle.indiceDia === DIA_DESCANSO;

              return (
                <>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "22px" }}>
                    {[
                      { valor: "A", texto: descanso ? "Trabajó" : "Asistió", color: VERDE },
                      { valor: "F", texto: "Falta", color: ROJO },
                      { valor: "", texto: "Sin marcar", color: "#aaa" }
                    ].map((op) => (
                      <button
                        key={op.valor}
                        onClick={() =>
                          actualizarDia(detalle.colaborador.id, detalle.indiceDia, {
                            estado: op.valor
                          })
                        }
                        style={{
                          flex: 1,
                          padding: "12px",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                          background: dia.estado === op.valor ? op.color : "#f2f2f2",
                          color: dia.estado === op.valor ? "#fff" : "#888"
                        }}
                      >
                        {op.texto}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: "600", fontSize: "13px", color: "#777" }}>
                        Entrada
                      </label>
                      <input
                        type="time"
                        value={dia.entrada}
                        onChange={(e) =>
                          actualizarDia(detalle.colaborador.id, detalle.indiceDia, {
                            entrada: e.target.value
                          })
                        }
                        style={{ ...input, marginTop: "6px" }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: "600", fontSize: "13px", color: "#777" }}>
                        Salida
                      </label>
                      <input
                        type="time"
                        value={dia.salida}
                        onChange={(e) =>
                          actualizarDia(detalle.colaborador.id, detalle.indiceDia, {
                            salida: e.target.value
                          })
                        }
                        style={{ ...input, marginTop: "6px" }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      background: extras > 0 ? "#e8f5e9" : "#f7f7f7",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "20px",
                      fontSize: "13px",
                      color: extras > 0 ? VERDE : "#999",
                      fontWeight: extras > 0 ? "600" : "400"
                    }}
                  >
                    {extras > 0
                      ? `Horas extras: ${minutosATexto(extras)}`
                      : descanso
                      ? "Domingo de descanso. Si trabajó, todo el tiempo cuenta como extra."
                      : "Sin horas extras"}
                  </div>

                  <label
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#777",
                      display: "block",
                      textAlign: "left"
                    }}
                  >
                    Observaciones
                  </label>
                  <textarea
                    placeholder="Horas extras, permisos, retardos, notas del día..."
                    value={dia.observaciones}
                    onChange={(e) =>
                      actualizarDia(detalle.colaborador.id, detalle.indiceDia, {
                        observaciones: e.target.value
                      })
                    }
                    style={{
                      ...input,
                      marginTop: "6px",
                      minHeight: "95px",
                      resize: "vertical",
                      textAlign: "left"
                    }}
                  />

                  <button
                    onClick={() => setDetalle(null)}
                    style={{
                      marginTop: "22px",
                      width: "100%",
                      background: VINO,
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "15px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "15px"
                    }}
                  >
                    Listo
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </Layout>
  );
}

export default Asistencias;