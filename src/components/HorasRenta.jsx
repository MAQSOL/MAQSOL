import { useState } from "react";
import { S } from "../pages/Administracion/estilosAdmin";
import { HORARIO, TIPOS, fmtHoras, diaTexto, horasDeRango, bitacoraDe, totalesDe, descargarHorasPDF } from "../utils/horasRenta";

/* Ventana del reporte de horas de una renta (la lógica y el PDF están en utils/horasRenta.js) */
/** Ventana con la bitácora diaria de horas de la renta */
export function ModalHorasRenta({ alquiler, onGuardar, onCerrar }) {
  const [editando, setEditando] = useState(null); // fecha que se está editando
  const [f, setF] = useState(null);
  const [error, setError] = useState("");
  const filas = bitacoraDe(alquiler);
  const t = totalesDe(filas);

  const abrir = (fila) => {
    const e = (alquiler.horasDias || {})[fila.fecha];
    setEditando(fila.fecha);
    setError("");
    setF({ tipo: e?.tipo || "normal", desde: e?.desde || HORARIO.desde, hasta: e?.hasta || "13:00", comida: e?.comida ?? false, nota: e?.nota || "" });
  };
  const guardarDia = () => {
    const ex = { ...(alquiler.horasDias || {}) };
    if (f.tipo === "normal") delete ex[editando];
    else {
      if (f.tipo === "falla" && horasDeRango(f.desde, f.hasta, false) <= 0) return setError("Pon de qué hora a qué hora trabajó la máquina.");
      ex[editando] = f.tipo === "falla"
        ? { tipo: "falla", desde: f.desde, hasta: f.hasta, comida: !!f.comida, nota: f.nota.trim() }
        : { tipo: f.tipo, nota: f.nota.trim() };
    }
    onGuardar(ex);
    setEditando(null);
  };

  const chip = (tipo) => ({ display: "inline-block", fontSize: 11.5, fontWeight: 800, padding: "3px 9px", color: TIPOS[tipo].color, background: TIPOS[tipo].fondo, whiteSpace: "nowrap" });
  const btnChico = { padding: "5px 10px", fontSize: 12, fontWeight: 700, border: "2px solid #111", background: "#fff", cursor: "pointer" };

  return (
    <div style={S.modalBg} onClick={onCerrar}>
      <div style={{ ...S.modal, maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 4px" }}>Reporte de horas</h2>
            <p style={{ color: "#777", margin: 0, fontSize: 14 }}>
              {[alquiler.tipo, alquiler.marca, alquiler.modelo].filter(Boolean).join(" ")}{alquiler.serie ? " · Serie " + alquiler.serie : ""} · {alquiler.cliente}
              {alquiler.operadorRenta && <><br />Operador: <b style={{ color: "#0a9b45" }}>{alquiler.operadorRenta}</b></>}
            </p>
          </div>
          <button className="btn-sys btn-pdf" style={S.btn} onClick={() => descargarHorasPDF(alquiler)}>Descargar PDF</button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0 6px" }}>
          {[["DÍAS", t.dias], ["HORAS TRABAJADAS", fmtHoras(t.horas)], ["FALTAS (DÍAS A DEVOLVER)", t.faltas], ["DÍAS CON FALLA", t.fallas]].map(([k, v]) => (
            <div key={k} style={{ border: "2px solid #111", padding: "8px 14px", minWidth: 120 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: "#888" }}>{k}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.startsWith("FALTAS") && v ? "#a32020" : "#111" }}>{v}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "#777", margin: "0 0 12px" }}>Cada día cuenta solo como 9 h trabajadas + 1 h de comida ({HORARIO.desde} a {HORARIO.hasta}). Toca <b>Cambiar</b> en un día si el operador faltó, la máquina falló o no se trabajó.</p>

        <div style={{ maxHeight: "48vh", overflowY: "auto", border: "2px solid #111" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}><tr>
              <th style={S.th}>DÍA</th><th style={S.th}>ESTADO</th><th style={{ ...S.th, textAlign: "center" }}>HORARIO</th><th style={{ ...S.th, textAlign: "center" }}>HORAS</th><th style={S.th}>OBSERVACIONES</th><th style={{ ...S.th, width: 90 }}></th>
            </tr></thead>
            <tbody>
              {filas.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#999", padding: 30 }}>La renta todavía no empieza.</td></tr>}
              {[...filas].reverse().map((fila) => (
                editando === fila.fecha ? (
                  <tr key={fila.fecha}><td colSpan={6} style={{ ...S.td, background: "#fffbe6" }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>{diaTexto(fila.fecha)}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                      {Object.entries(TIPOS).map(([k, T]) => (
                        <button key={k} type="button" onClick={() => { setF({ ...f, tipo: k }); setError(""); }}
                          style={{ ...btnChico, background: f.tipo === k ? T.color : "#fff", color: f.tipo === k ? "#fff" : T.color, borderColor: T.color }}>{T.etiqueta}</button>
                      ))}
                    </div>
                    {f.tipo === "falla" && (
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 10 }}>
                        <div><label style={S.label}>TRABAJÓ DESDE</label><input type="time" style={{ ...S.input, width: 130 }} value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></div>
                        <div><label style={S.label}>HASTA</label><input type="time" style={{ ...S.input, width: 130 }} value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></div>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, paddingBottom: 12 }}><input type="checkbox" checked={!!f.comida} onChange={(e) => setF({ ...f, comida: e.target.checked })} /> Tomó 1 h de comida</label>
                        <div style={{ paddingBottom: 12, fontWeight: 800 }}>= {fmtHoras(horasDeRango(f.desde, f.hasta, f.comida))} h</div>
                      </div>
                    )}
                    {f.tipo !== "normal" && (
                      <div style={{ marginBottom: 10 }}>
                        <label style={S.label}>{f.tipo === "falta" ? "¿POR QUÉ FALTÓ? (EL DÍA SE DEVUELVE AL CLIENTE)" : f.tipo === "falla" ? "¿QUÉ FALLÓ?" : "¿POR QUÉ NO SE TRABAJÓ?"}</label>
                        <input style={S.input} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} placeholder={f.tipo === "falta" ? "Ej. enfermedad" : f.tipo === "falla" ? "Ej. se botó la manguera hidráulica" : "Ej. domingo, lluvia"} />
                      </div>
                    )}
                    {error && <p style={{ color: "#c62828", fontSize: 13, margin: "0 0 8px" }}>{error}</p>}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="button" style={btnChico} onClick={() => setEditando(null)}>Cancelar</button>
                      <button type="button" style={{ ...btnChico, background: "#111", color: "#fff" }} onClick={guardarDia}>Guardar día</button>
                    </div>
                  </td></tr>
                ) : (
                  <tr key={fila.fecha}>
                    <td style={{ ...S.td, whiteSpace: "nowrap", fontWeight: 700 }}>{diaTexto(fila.fecha)}</td>
                    <td style={S.td}><span style={chip(fila.tipo)}>{TIPOS[fila.tipo].etiqueta}</span></td>
                    <td style={{ ...S.td, textAlign: "center", whiteSpace: "nowrap", fontSize: 13 }}>{fila.desde && fila.hasta ? `${fila.desde} – ${fila.hasta}` : "—"}{fila.comida ? <div style={{ fontSize: 11, color: "#888" }}>1 h comida</div> : null}</td>
                    <td style={{ ...S.td, textAlign: "center", fontWeight: 800 }}>{fmtHoras(fila.horas)}</td>
                    <td style={{ ...S.td, fontSize: 13, color: fila.tipo === "falta" ? "#a32020" : "#444" }}>{fila.tipo === "falta" ? "Día a devolver" + (fila.nota ? " · " + fila.nota : "") : fila.nota || ""}</td>
                    <td style={{ ...S.td, textAlign: "right" }}><button type="button" style={btnChico} onClick={() => abrir(fila)}>Cambiar</button></td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="btn-sys" style={S.btnGris} onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

