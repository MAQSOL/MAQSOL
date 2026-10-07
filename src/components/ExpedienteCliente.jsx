import { useState } from "react";
import { REQUISITOS, NOMBRE_TIPO, buscarCliente } from "../utils/expediente";

const caja = { border: "1px solid #e6e6e6", borderRadius: 10, padding: 14, marginBottom: 14 };
const boton = { border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 };

/** Expediente del cliente: tipo de persona, contrato firmado y documentos entregados. */
export default function ExpedienteCliente({ nombreCliente, clientes, onGuardar, onCerrar }) {
  const existente = buscarCliente(clientes, nombreCliente);
  const [id] = useState(() => existente?.id || "");
  const [datos, setDatos] = useState(() => ({
    tipoPersona: existente?.tipoPersona || "",
    contratoFirmado: !!existente?.contratoFirmado,
    contratoFecha: existente?.contratoFecha || "",
    docsEntregados: { ...(existente?.docsEntregados || {}) }
  }));
  const [guardando, setGuardando] = useState(false);

  const lista = datos.tipoPersona ? REQUISITOS[datos.tipoPersona] : [];
  const hechos = lista.filter((d) => datos.docsEntregados[d.k]).length;
  const pct = lista.length ? Math.round((hechos / lista.length) * 100) : 0;

  const set = (campo, valor) => setDatos((d) => ({ ...d, [campo]: valor }));
  const alternarDoc = (k) => setDatos((d) => ({ ...d, docsEntregados: { ...d.docsEntregados, [k]: !d.docsEntregados[k] } }));
  const marcarTodos = () => setDatos((d) => ({ ...d, docsEntregados: Object.fromEntries(lista.map((x) => [x.k, true])) }));

  async function guardar() {
    setGuardando(true);
    const base = existente || { cliente: nombreCliente };
    const ok = await onGuardar(id || String(Date.now()), { ...base, ...datos });
    setGuardando(false);
    if (ok !== false) onCerrar();
  }

  return (
    <div
      onClick={onCerrar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1800, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, overflowY: "auto" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 600 }}>
        <h2 style={{ margin: "0 0 2px", fontSize: 21 }}>Expediente del cliente</h2>
        <p style={{ margin: "0 0 16px", color: "#777", fontSize: 14 }}>
          <strong>{nombreCliente}</strong>
          {!existente && " · aún no está en Gestión de Clientes; al guardar se crea su ficha."}
        </p>

        <div style={caja}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 8 }}>TIPO DE PERSONA</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["fisica", "moral"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("tipoPersona", t)}
                style={{
                  ...boton,
                  flex: 1,
                  background: datos.tipoPersona === t ? "var(--acento)" : "#f1f1f1",
                  color: datos.tipoPersona === t ? "#fff" : "#444"
                }}
              >
                {NOMBRE_TIPO[t]}
              </button>
            ))}
          </div>
        </div>

        <div style={caja}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 8 }}>CONTRATO</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 600 }}>
            <input type="checkbox" checked={datos.contratoFirmado} onChange={(e) => set("contratoFirmado", e.target.checked)} style={{ width: 18, height: 18 }} />
            El cliente ya firmó el contrato de arrendamiento
          </label>
          {datos.contratoFirmado && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>FECHA DE FIRMA</label>
              <input type="date" value={datos.contratoFecha} onChange={(e) => set("contratoFecha", e.target.value)} style={{ padding: "9px 11px", border: "1px solid #d8d8d8", borderRadius: 6 }} />
            </div>
          )}
        </div>

        <div style={caja}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>DOCUMENTACIÓN ENTREGADA</div>
            {lista.length > 0 && (
              <button type="button" onClick={marcarTodos} style={{ ...boton, padding: "5px 12px", fontSize: 12, background: "#eee", color: "#333" }}>
                Marcar todos
              </button>
            )}
          </div>
          {!datos.tipoPersona ? (
            <p style={{ color: "#999", margin: 0, fontSize: 14 }}>Elige primero si es persona física o moral para ver los documentos que le tocan.</p>
          ) : (
            <>
              <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                <div style={{ width: pct + "%", height: "100%", background: pct === 100 ? "#1f8b4c" : "var(--acento)" }} />
              </div>
              <div style={{ fontSize: 12, color: "#777", marginBottom: 8 }}>{hechos} de {lista.length} entregados</div>
              {lista.map((d) => (
                <label key={d.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid #f3f3f3", cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={!!datos.docsEntregados[d.k]} onChange={() => alternarDoc(d.k)} style={{ width: 17, height: 17 }} />
                  <span style={{ textDecoration: datos.docsEntregados[d.k] ? "none" : "none", color: datos.docsEntregados[d.k] ? "#1f8b4c" : "#333", fontWeight: datos.docsEntregados[d.k] ? 700 : 400 }}>{d.n}</span>
                </label>
              ))}
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" style={{ ...boton, background: "#e9e9e9", color: "#333" }} onClick={onCerrar}>Cancelar</button>
          <button type="button" style={{ ...boton, background: "var(--acento)", color: "#fff", opacity: guardando ? 0.6 : 1 }} disabled={guardando} onClick={guardar}>
            {guardando ? "Guardando…" : "Guardar expediente"}
          </button>
        </div>
      </div>
    </div>
  );
}
