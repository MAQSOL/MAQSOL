import { useState } from "react";
import { descargarExcelBonito, nombreArchivoFecha } from "../../utils/exportExcel";
import { DIAS, DIA_DESCANSO, extrasDelDia, formatoCorto, lunesDeClave, minutosATexto, numeroDeSemana } from "../../utils/semanas";

const VINO = "var(--acento)";
const VERDE = "#2e7d32";
const ROJO = "#b00020";
const LETRAS = ["L", "M", "M", "J", "V", "S", "D"];

const pct = (a, f) => (a + f ? Math.round((a / (a + f)) * 100) : null);

/** Lo de una persona en una semana: estado por día, asistencias, faltas, extras y notas. */
function resumenSemana(datos = {}) {
  let asistencias = 0, faltas = 0, extras = 0;
  const estados = DIAS.map((_, i) => {
    const d = datos[i] || {};
    if (d.estado === "A") asistencias++;
    if (d.estado === "F" && i !== DIA_DESCANSO) faltas++;
    extras += extrasDelDia(d, i);
    return d.estado || "";
  });
  const notas = [datos.obs, ...DIAS.map((n, i) => (datos[i]?.observaciones ? `${n.slice(0, 3)}: ${datos[i].observaciones}` : ""))]
    .filter(Boolean)
    .join(" · ");
  const capturada = estados.some(Boolean) || !!notas;
  return { estados, asistencias, faltas, extras, notas, capturada };
}

/**
 * Historial completo de asistencias: todas las semanas guardadas, de todos los años,
 * filtrable por colaborador y por año, con resumen y descarga a Excel.
 */
export default function HistorialAsistencias({ colaboradores, registros, onAbrirSemana }) {
  const [quien, setQuien] = useState("todos");
  const [anio, setAnio] = useState("todos");

  // semanas guardadas, de la más reciente a la más vieja
  const semanas = Object.entries(registros || {})
    .map(([clave, datos]) => ({ clave, lunes: lunesDeClave(clave), datos: datos || {} }))
    .filter((s) => s.lunes)
    .sort((a, b) => b.lunes - a.lunes);

  const anios = [...new Set(semanas.map((s) => s.lunes.getFullYear()))].sort((a, b) => b - a);

  // colaboradores (también los dados de baja) + los que se borraron pero tienen asistencias guardadas
  const conDatos = new Set(semanas.flatMap((s) => Object.keys(s.datos)));
  const personas = [
    ...colaboradores,
    ...[...conDatos]
      .filter((id) => !colaboradores.some((c) => c.id === id))
      .map((id) => ({ id, nombre: "Colaborador eliminado", puesto: "", eliminado: true }))
  ];
  const persona = (id) => personas.find((p) => p.id === id);

  // renglones: una persona en una semana (solo las que tienen algo capturado)
  const filas = [];
  semanas.forEach((s) => {
    if (anio !== "todos" && s.lunes.getFullYear() !== Number(anio)) return;
    personas.forEach((p) => {
      if (quien !== "todos" && p.id !== quien) return;
      const r = resumenSemana(s.datos[p.id]);
      if (r.capturada) filas.push({ ...r, semana: s, persona: p });
    });
  });

  const sumar = (lista) =>
    lista.reduce((t, f) => ({ asistencias: t.asistencias + f.asistencias, faltas: t.faltas + f.faltas, extras: t.extras + f.extras }), { asistencias: 0, faltas: 0, extras: 0 });

  const total = sumar(filas);
  const semanasConCaptura = new Set(filas.map((f) => f.semana.clave)).size;

  const porAnio = [...new Set(filas.map((f) => f.semana.lunes.getFullYear()))].map((a) => {
    const deEse = filas.filter((f) => f.semana.lunes.getFullYear() === a);
    return { anio: a, semanas: new Set(deEse.map((f) => f.semana.clave)).size, ...sumar(deEse) };
  });

  const porPersona = personas
    .map((p) => {
      const deEl = filas.filter((f) => f.persona.id === p.id);
      return { persona: p, semanas: deEl.length, ...sumar(deEl) };
    })
    .filter((x) => x.semanas > 0);

  const rangoTexto = (lunes) => {
    const dom = new Date(lunes);
    dom.setDate(dom.getDate() + 6);
    return `Del ${formatoCorto(lunes)} al ${formatoCorto(dom)}`;
  };

  const descargarExcel = () => {
    if (!filas.length) return alert("No hay asistencias capturadas con esos filtros.");
    const nombre = quien === "todos" ? "Todos los colaboradores" : persona(quien)?.nombre || "";
    descargarExcelBonito({
      titulo: "Historial de Asistencias",
      subtitulo: `${nombre} · ${anio === "todos" ? "Todos los años" : anio} · ${total.asistencias} asistencias, ${total.faltas} faltas`,
      columnas: ["Año", "Semana", "Fechas", "Colaborador", "Puesto", ...DIAS.map((d) => d.slice(0, 3)), "Asistencias", "Faltas", "% asistencia", "Horas extra", "Observaciones"],
      filas: filas.map((f) => [
        f.semana.lunes.getFullYear(),
        numeroDeSemana(f.semana.lunes),
        rangoTexto(f.semana.lunes),
        f.persona.nombre,
        f.persona.puesto || "",
        ...f.estados.map((e) => (e === "A" ? "A" : e === "F" ? "F" : "")),
        f.asistencias,
        f.faltas,
        pct(f.asistencias, f.faltas) === null ? "" : pct(f.asistencias, f.faltas) + "%",
        f.extras ? minutosATexto(f.extras) : "",
        f.notas
      ]),
      nombreArchivo: nombreArchivoFecha("HISTORIAL-ASISTENCIAS")
    });
  };

  // ---------------------------------------------------------------- estilos
  const select = { padding: "11px 14px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "inherit", background: "#fff", minWidth: "220px" };
  const th = { padding: "12px 10px", background: VINO, color: "#fff", fontSize: "12.5px", fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" };
  const td = { padding: "10px", borderBottom: "1px solid #eee", textAlign: "center", fontSize: "13.5px" };
  const cuadro = (e, i) => ({
    width: "18px", height: "18px", borderRadius: "4px", display: "inline-block",
    background: e === "A" ? VERDE : e === "F" ? ROJO : i === DIA_DESCANSO ? "#e4e4e4" : "#f0f0f0"
  });
  const dato = (titulo, valor, color = "#222") => (
    <div style={{ textAlign: "center", minWidth: "120px" }}>
      <div style={{ fontSize: "28px", fontWeight: 700, color }}>{valor}</div>
      <div style={{ fontSize: "12px", color: "#888", fontWeight: 600, letterSpacing: ".4px" }}>{titulo}</div>
    </div>
  );
  const porcentaje = (a, f) => (pct(a, f) === null ? "—" : pct(a, f) + "%");

  return (
    <>
      <div className="panel">
        <h3 style={{ textAlign: "center", marginBottom: "6px" }}>Historial de asistencias</h3>
        <p style={{ textAlign: "center", color: "#999", fontSize: "14px", marginBottom: "18px" }}>
          Todas las semanas capturadas, de todos los años
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          <select style={select} value={quien} onChange={(e) => setQuien(e.target.value)}>
            <option value="todos">Todos los colaboradores</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}{p.baja ? " (de baja)" : ""}
              </option>
            ))}
          </select>
          <select style={{ ...select, minWidth: "160px" }} value={anio} onChange={(e) => setAnio(e.target.value)}>
            <option value="todos">Todos los años</option>
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            onClick={descargarExcel}
            style={{ padding: "11px 22px", border: "none", borderRadius: "10px", background: VERDE, color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
          >
            Excel del historial
          </button>
        </div>

        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center", marginTop: "24px" }}>
          {dato("SEMANAS CON CAPTURA", semanasConCaptura)}
          {dato("ASISTENCIAS", total.asistencias, VERDE)}
          {dato("FALTAS", total.faltas, ROJO)}
          {dato("% ASISTENCIA", porcentaje(total.asistencias, total.faltas), VINO)}
          {dato("HORAS EXTRA", total.extras ? minutosATexto(total.extras) : "0")}
        </div>
      </div>

      {filas.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", color: "#999", padding: "50px 20px" }}>
          No hay asistencias capturadas con esos filtros.
        </div>
      ) : (
        <>
          {(anio === "todos" && porAnio.length > 1) || (quien === "todos" && porPersona.length > 1) ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: "20px" }}>
              {anio === "todos" && porAnio.length > 1 && (
                <div className="panel" style={{ padding: 0, overflow: "hidden", minHeight: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={{ ...th, textAlign: "left", paddingLeft: "18px" }}>AÑO</th><th style={th}>SEMANAS</th><th style={th}>ASIST.</th><th style={th}>FALTAS</th><th style={th}>%</th><th style={th}>EXTRAS</th></tr></thead>
                    <tbody>
                      {porAnio.map((a) => (
                        <tr key={a.anio}>
                          <td style={{ ...td, textAlign: "left", paddingLeft: "18px", fontWeight: 700 }}>{a.anio}</td>
                          <td style={td}>{a.semanas}</td>
                          <td style={{ ...td, color: VERDE, fontWeight: 700 }}>{a.asistencias}</td>
                          <td style={{ ...td, color: ROJO, fontWeight: 700 }}>{a.faltas}</td>
                          <td style={td}>{porcentaje(a.asistencias, a.faltas)}</td>
                          <td style={td}>{a.extras ? minutosATexto(a.extras) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {quien === "todos" && porPersona.length > 1 && (
                <div className="panel" style={{ padding: 0, overflow: "hidden", minHeight: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={{ ...th, textAlign: "left", paddingLeft: "18px" }}>COLABORADOR</th><th style={th}>SEMANAS</th><th style={th}>ASIST.</th><th style={th}>FALTAS</th><th style={th}>%</th><th style={th}>EXTRAS</th></tr></thead>
                    <tbody>
                      {porPersona.map((x) => (
                        <tr key={x.persona.id} style={{ cursor: "pointer" }} title="Ver solo a esta persona" onClick={() => setQuien(x.persona.id)}>
                          <td style={{ ...td, textAlign: "left", paddingLeft: "18px", fontWeight: 700, color: x.persona.eliminado ? "#999" : "#222" }}>
                            {x.persona.nombre}
                            {x.persona.baja && <span style={{ marginLeft: 6, fontSize: 10, color: ROJO }}>DE BAJA</span>}
                          </td>
                          <td style={td}>{x.semanas}</td>
                          <td style={{ ...td, color: VERDE, fontWeight: 700 }}>{x.asistencias}</td>
                          <td style={{ ...td, color: ROJO, fontWeight: 700 }}>{x.faltas}</td>
                          <td style={td}>{porcentaje(x.asistencias, x.faltas)}</td>
                          <td style={td}>{x.extras ? minutosATexto(x.extras) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          <div className="panel" style={{ padding: 0, overflowX: "auto", minHeight: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: "left", paddingLeft: "18px" }}>SEMANA</th>
                  {quien === "todos" && <th style={{ ...th, textAlign: "left" }}>COLABORADOR</th>}
                  <th style={th}>
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                      {LETRAS.map((l, i) => <span key={i} style={{ width: "18px" }}>{l}</span>)}
                    </div>
                  </th>
                  <th style={th}>ASIST.</th>
                  <th style={th}>FALTAS</th>
                  <th style={th}>EXTRAS</th>
                  <th style={{ ...th, textAlign: "left" }}>OBSERVACIONES</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, idx) => {
                  const a = f.semana.lunes.getFullYear();
                  // con "todos los años", cada año arranca con su renglón separador
                  const separador = anio === "todos" && (idx === 0 || filas[idx - 1].semana.lunes.getFullYear() !== a);
                  return [
                    separador && (
                      <tr key={"anio-" + a}>
                        <td colSpan={quien === "todos" ? 7 : 6} style={{ padding: "10px 18px", background: "#f6f6f6", fontWeight: 800, color: "#555", letterSpacing: ".5px" }}>{a}</td>
                      </tr>
                    ),
                    <tr key={f.semana.clave + f.persona.id}>
                      <td style={{ ...td, textAlign: "left", paddingLeft: "18px", whiteSpace: "nowrap" }}>
                        <strong>Semana {numeroDeSemana(f.semana.lunes)}</strong>
                        <div style={{ fontSize: "12px", color: "#999" }}>{rangoTexto(f.semana.lunes)}</div>
                        <button
                          onClick={() => onAbrirSemana(f.semana.lunes)}
                          style={{ marginTop: "3px", background: "transparent", border: "none", padding: 0, color: VINO, fontSize: "11.5px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                        >
                          Abrir semana
                        </button>
                      </td>
                      {quien === "todos" && (
                        <td style={{ ...td, textAlign: "left", fontWeight: 600, color: f.persona.eliminado ? "#999" : "#222" }}>{f.persona.nombre}</td>
                      )}
                      <td style={td}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          {f.estados.map((e, i) => (
                            <span key={i} style={cuadro(e, i)} title={`${DIAS[i]}: ${e === "A" ? "Asistió" : e === "F" ? "Faltó" : "Sin captura"}`} />
                          ))}
                        </div>
                      </td>
                      <td style={{ ...td, color: VERDE, fontWeight: 700 }}>{f.asistencias}</td>
                      <td style={{ ...td, color: f.faltas ? ROJO : "#999", fontWeight: 700 }}>{f.faltas}</td>
                      <td style={td}>{f.extras ? minutosATexto(f.extras) : "—"}</td>
                      <td style={{ ...td, textAlign: "left", fontSize: "12.5px", color: "#666", maxWidth: "320px" }}>{f.notas || "—"}</td>
                    </tr>
                  ];
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
