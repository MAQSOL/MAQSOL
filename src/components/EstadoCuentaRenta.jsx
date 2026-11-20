import { useState } from "react";
import { S, fFecha, hoyISO } from "../pages/Administracion/estilosAdmin";
import CampoFecha from "./CampoFecha";
import { periodosDe, nombrePeriodo, descargarEstadoCuentaPDF } from "../utils/estadoCuenta";

/*
 * Ventana "Estado de cuenta" de una renta: pagos por periodo (mes / semana),
 * observaciones (ej. pagó daños sin cotización) y "el cliente ya no debe nada".
 * onGuardar(cambios) recibe solo los campos que cambian: pagos, observacionesPago o liquidado.
 */
export function ModalEstadoCuenta({ alquiler, onGuardar, onCerrar }) {
  const periodos = periodosDe(alquiler).slice().reverse(); // el más reciente arriba
  const pendientes = periodos.filter((p) => !p.pago);
  const [fechas, setFechas] = useState({}); // fecha de pago elegida por periodo
  const [obs, setObs] = useState({ fecha: hoyISO(), texto: "" });
  const [notaLiq, setNotaLiq] = useState("");
  const obsLista = [...(alquiler.observacionesPago || [])].sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)));

  const clave = (p) => p.fechaInicio + "_" + p.fechaFin;
  const marcarPagado = (p) => {
    const f = fechas[clave(p)] || hoyISO();
    const nuevo = { id: "PG-" + Date.now(), fecha: f, periodoInicio: p.fechaInicio, periodoFin: p.fechaFin, registrado: hoyISO() };
    onGuardar({ pagos: [...(alquiler.pagos || []), nuevo] });
  };
  const quitarPago = (p) => {
    if (!window.confirm(`¿Quitar el pago de ${nombrePeriodo(p)}? Quedará como pendiente.`)) return;
    onGuardar({ pagos: (alquiler.pagos || []).filter((x) => x.id !== p.pago.id) });
  };
  const agregarObs = () => {
    if (!obs.texto.trim()) return;
    onGuardar({ observacionesPago: [...(alquiler.observacionesPago || []), { id: "OB-" + Date.now(), fecha: obs.fecha || hoyISO(), texto: obs.texto.trim() }] });
    setObs({ fecha: hoyISO(), texto: "" });
  };
  const quitarObs = (o) => {
    if (!window.confirm("¿Quitar esta observación?")) return;
    onGuardar({ observacionesPago: (alquiler.observacionesPago || []).filter((x) => x.id !== o.id) });
  };
  const liquidar = () => {
    if (pendientes.length && !window.confirm(`Hay ${pendientes.length} periodo(s) sin pagar. ¿Marcar de todos modos que el cliente ya no debe nada?`)) return;
    onGuardar({ liquidado: { fecha: hoyISO(), nota: notaLiq.trim() } });
  };

  const chip = (ok) => ({ display: "inline-block", fontSize: 11.5, fontWeight: 800, padding: "3px 9px", whiteSpace: "nowrap", color: ok ? "#1b6e3d" : "#a32020", background: ok ? "#e8f5e9" : "#fdecec" });
  const btnChico = { padding: "6px 11px", fontSize: 12, fontWeight: 700, border: "2px solid #111", background: "#fff", cursor: "pointer", whiteSpace: "nowrap" };

  return (
    <div style={S.modalBg} onClick={onCerrar}>
      <div style={{ ...S.modal, maxWidth: 820 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 4px" }}>Estado de cuenta</h2>
            <p style={{ color: "#777", margin: 0, fontSize: 14 }}>
              {[alquiler.tipo, alquiler.marca, alquiler.modelo].filter(Boolean).join(" ")}{alquiler.serie ? " · Serie " + alquiler.serie : ""}
              <br />Cliente: <b style={{ color: "#111" }}>{alquiler.cliente || "—"}</b>{alquiler.obra ? " · " + alquiler.obra : ""}
            </p>
          </div>
          <button className="btn-sys btn-pdf" style={S.btn} onClick={() => descargarEstadoCuentaPDF(alquiler)}>Descargar estado de cuenta</button>
        </div>

        {/* resumen */}
        <div style={{ margin: "16px 0", padding: "12px 14px", fontWeight: 700, border: "2px solid " + (alquiler.liquidado || !pendientes.length ? "#1f8b4c" : "#c62828"), background: alquiler.liquidado || !pendientes.length ? "#eaf7ef" : "#fdecec", color: alquiler.liquidado || !pendientes.length ? "#1b6e3d" : "#a32020" }}>
          {alquiler.liquidado
            ? <>✓ {alquiler.cliente || "El cliente"} ya no debe nada · liquidado el {fFecha(alquiler.liquidado.fecha)}{alquiler.liquidado.nota ? " · " + alquiler.liquidado.nota : ""}</>
            : pendientes.length
              ? <>{pendientes.length} periodo(s) sin pagar: {pendientes.slice().reverse().map((p) => nombrePeriodo(p)).join(", ")}</>
              : <>✓ Todos los periodos están pagados</>}
        </div>

        {/* pagos por periodo */}
        <label style={S.label}>PAGOS POR PERIODO</label>
        <div style={{ border: "2px solid #111", marginBottom: 18, maxHeight: "34vh", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {periodos.map((p) => (
                <tr key={clave(p)}>
                  <td style={{ ...S.td, fontWeight: 800 }}>
                    {nombrePeriodo(p)}{p.actual && <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}> · actual</span>}
                    <div style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{fFecha(p.fechaInicio)} – {fFecha(p.fechaFin)}</div>
                  </td>
                  <td style={S.td}><span style={chip(!!p.pago)}>{p.pago ? "Pagado" : "Pendiente"}</span></td>
                  <td style={{ ...S.td, textAlign: "right" }}>
                    {p.pago ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13 }}>Pagó el <b>{fFecha(p.pago.fecha)}</b></span>
                        <button type="button" style={btnChico} onClick={() => quitarPago(p)}>Quitar</button>
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 150 }}><CampoFecha style={{ ...S.input, padding: "7px 10px" }} value={fechas[clave(p)] || hoyISO()} onChange={(e) => setFechas({ ...fechas, [clave(p)]: e.target.value })} /></span>
                        <button type="button" className="btn-sys btn-verde" style={{ ...btnChico, background: "#1f8b4c", color: "#fff" }} onClick={() => marcarPagado(p)}>✓ Pagó</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* observaciones */}
        <label style={S.label}>OBSERVACIONES (EJ. PAGÓ DAÑOS SIN COTIZACIÓN)</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ width: 160 }}><CampoFecha style={S.input} value={obs.fecha} onChange={(e) => setObs({ ...obs, fecha: e.target.value })} /></span>
          <input style={{ ...S.input, flex: 1, minWidth: 220 }} value={obs.texto} onChange={(e) => setObs({ ...obs, texto: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") agregarObs(); }} placeholder="Ej. pagó $3,000 por daño en la canastilla" />
          <button type="button" className="btn-sys" style={S.btnGris} onClick={agregarObs}>Agregar</button>
        </div>
        {obsLista.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            {obsLista.map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #eee", fontSize: 13.5 }}>
                <span><b>{fFecha(o.fecha)}</b> · {o.texto}</span>
                <button type="button" style={btnChico} onClick={() => quitarObs(o)}>Quitar</button>
              </div>
            ))}
          </div>
        )}

        {/* liquidación */}
        <label style={S.label}>CIERRE DE CUENTA</label>
        {alquiler.liquidado ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: "#1b6e3d" }}>✓ {alquiler.cliente || "El cliente"} ya no debe nada ({fFecha(alquiler.liquidado.fecha)})</span>
            <button type="button" style={btnChico} onClick={() => window.confirm("¿Quitar la marca de liquidado?") && onGuardar({ liquidado: null })}>Deshacer</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <input style={{ ...S.input, flex: 1, minWidth: 220 }} value={notaLiq} onChange={(e) => setNotaLiq(e.target.value)} placeholder="Nota (opcional), ej. se cortó la renta, liquidó todo" />
            <button type="button" className="btn-sys btn-verde" style={{ ...S.btn, background: "#1f8b4c", color: "#fff" }} onClick={liquidar}>✓ El cliente ya no debe nada</button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="btn-sys" style={S.btnGris} onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
