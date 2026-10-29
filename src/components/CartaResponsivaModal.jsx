import { useState } from "react";
import { S, hoyISO } from "../pages/Administracion/estilosAdmin";
import CampoFecha from "./CampoFecha";
import FirmaPad from "./FirmaPad";
import { CARTA_NUEVA, descargarCartaResponsiva } from "../utils/cartaResponsiva";

// Generador de carta responsiva de equipo para operadores (Documentos de Personal).
// onSubirEscaneo(personaId, file) guarda el PDF/foto firmado en el expediente del empleado.
export default function CartaResponsivaModal({ personas, persona, onClose, onSubirEscaneo, onAbrirArchivo }) {
  const [f, setF] = useState(() => ({
    ...CARTA_NUEVA,
    fecha: hoyISO(),
    ...(persona
      ? { personaId: persona.id, nombre: persona.nombre || "", curp: persona.curp || "", ine: persona.ine || "" }
      : {}),
  }));
  const [firmando, setFirmando] = useState(null); // "firmaOperador" | "firmaEntrega"
  const [subiendo, setSubiendo] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  // lista viva del empleado (para ver los escaneos ya subidos)
  const actual = personas.find((p) => p.id === f.personaId);
  const escaneos = actual?.documentos?.responsiva || [];

  function elegirPersona(e) {
    const p = personas.find((x) => x.id === e.target.value);
    setF((x) => ({
      ...x,
      personaId: e.target.value,
      nombre: p ? p.nombre || "" : x.nombre,
      curp: p ? p.curp || "" : x.curp,
      ine: p ? p.ine || "" : x.ine,
    }));
  }

  async function subir(ev) {
    const archivo = ev.target.files?.[0];
    ev.target.value = "";
    if (!archivo || !f.personaId) return;
    setSubiendo(true);
    await onSubirEscaneo(f.personaId, archivo);
    setSubiendo(false);
  }

  const faltaDato = !f.nombre.trim() || !f.curp.trim() || !f.ine.trim() || !f.equipo.trim();

  const cajaFirma = (k, titulo) => (
    <div key={k} style={{ border: "1px solid #e3e6ea", borderRadius: 0, padding: 10, textAlign: "center" }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--acento)" }}>{titulo}</div>
      <div style={{ height: 64, margin: "6px 0", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafbfc", border: "1px dashed #d5d9dd", borderRadius: 0 }}>
        {f[k] ? <img src={f[k]} alt="Firma" style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <span style={{ color: "#bbb", fontSize: 12 }}>Sin firma (se deja en blanco)</span>}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        <button type="button" className="btn-sys" style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13 }} onClick={() => setFirmando(k)}>{f[k] ? "Volver a firmar" : "✍ Firmar en pantalla"}</button>
        {f[k] && <button type="button" className="btn-sys" style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13 }} onClick={() => setF((x) => ({ ...x, [k]: "" }))}>Quitar</button>}
      </div>
    </div>
  );

  return (
    <div style={S.modalBg} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Carta responsiva de equipo</h2>
        <p style={{ ...S.sub, marginBottom: 14 }}>
          Para el operador que recibe un equipo con llave: se compromete a cuidarlo y acepta el descuento por daños de
          mala operación. El desgaste por tiempo y uso no se cobra.
        </p>

        <label style={S.label}>EMPLEADO (llena nombre, CURP e INE)</label>
        <select style={{ ...S.input, marginBottom: 10 }} value={f.personaId} onChange={elegirPersona}>
          <option value="">— Elegir o escribir abajo —</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}{p.puesto ? " · " + p.puesto : ""}</option>
          ))}
        </select>

        <div style={S.grid3}>
          <div><label style={S.label}>NOMBRE</label><input style={S.input} value={f.nombre} onChange={set("nombre")} /></div>
          <div><label style={S.label}>CURP</label><input style={S.input} value={f.curp} onChange={set("curp")} /></div>
          <div><label style={S.label}>NÚMERO DE INE</label><input style={S.input} value={f.ine} onChange={set("ine")} /></div>
        </div>

        <div style={{ ...S.grid3, marginTop: 10 }}>
          <div><label style={S.label}>CARGO</label><input style={S.input} value={f.cargo} onChange={set("cargo")} /></div>
          <div><label style={S.label}>FECHA</label><CampoFecha style={S.input} value={f.fecha} onChange={set("fecha")} /></div>
          <div><label style={S.label}>LUGAR</label><input style={S.input} value={f.lugar} onChange={set("lugar")} /></div>
        </div>

        <h3 style={{ ...S.h3, margin: "16px 0 8px" }}>Equipo que se entrega</h3>
        <div style={S.grid3}>
          <div><label style={S.label}>EQUIPO</label><input style={S.input} placeholder="Ej. Plataforma de tijera" value={f.equipo} onChange={set("equipo")} /></div>
          <div><label style={S.label}>MARCA</label><input style={S.input} value={f.marca} onChange={set("marca")} /></div>
          <div><label style={S.label}>MODELO</label><input style={S.input} value={f.modelo} onChange={set("modelo")} /></div>
        </div>
        <div style={{ ...S.grid3, marginTop: 10 }}>
          <div><label style={S.label}>SERIE</label><input style={S.input} value={f.serie} onChange={set("serie")} /></div>
          <div><label style={S.label}>HORÓMETRO</label><input style={S.input} value={f.horometro} onChange={set("horometro")} /></div>
          <div>
            <label style={S.label}>LLAVES ENTREGADAS</label>
            <select style={S.input} value={f.llaves} onChange={set("llaves")}>
              <option value="0">Sin llaves</option>
              <option value="1">Una llave</option>
              <option value="2">Dos llaves</option>
            </select>
          </div>
        </div>
        <p style={{ color: "#888", fontSize: 12.5, margin: "10px 0 0" }}>
          Los daños que ya tenga el equipo no se capturan aquí: el PDF trae renglones para que el operador los escriba a mano.
        </p>

        <div style={{ marginTop: 10 }}>
          <label style={S.label}>QUIÉN ENTREGA POR MAQSOL (nombre para la firma)</label>
          <input style={S.input} value={f.entrega} onChange={set("entrega")} />
        </div>

        <h3 style={{ ...S.h3, margin: "16px 0 8px" }}>Firmas en pantalla (opcional)</h3>
        <div style={S.grid2}>
          {cajaFirma("firmaOperador", "OPERADOR QUE RECIBE")}
          {cajaFirma("firmaEntrega", "ENTREGA POR MAQSOL")}
        </div>

        <h3 style={{ ...S.h3, margin: "16px 0 8px" }}>Carta ya firmada (escaneo)</h3>
        {!f.personaId ? (
          <p style={{ color: "#888", fontSize: 13, margin: 0 }}>Elige un empleado de la lista para guardar el escaneo en su expediente.</p>
        ) : (
          <div>
            <label style={{ ...S.btnGris, display: "inline-block", cursor: subiendo ? "wait" : "pointer", opacity: subiendo ? 0.6 : 1 }}>
              {subiendo ? "Subiendo…" : "+ Subir carta firmada (PDF o foto)"}
              <input type="file" accept="application/pdf,image/*" onChange={subir} disabled={subiendo} style={{ display: "none" }} />
            </label>
            {escaneos.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {escaneos.map((a) => (
                  <button key={a.path} type="button" onClick={() => onAbrirArchivo(a)} style={{ background: "none", border: "none", textAlign: "left", color: "var(--acento)", cursor: "pointer", fontSize: 13, padding: 0 }}>
                    📎 {a.nombre} · {a.fecha}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button className="btn-sys" style={S.btnGris} onClick={onClose}>Cerrar</button>
          <button className="btn-sys btn-pdf" style={{ ...S.btn, opacity: faltaDato ? 0.5 : 1 }} disabled={faltaDato} onClick={() => descargarCartaResponsiva(f)}>
            Descargar PDF
          </button>
        </div>
      </div>

      {firmando && (
        <FirmaPad
          titulo={"Firma · " + (firmando === "firmaOperador" ? "Operador que recibe" : "Entrega por MAQSOL")}
          subtitulo="Firma con el dedo dentro del recuadro"
          onGuardar={(d) => { setF((x) => ({ ...x, [firmando]: d })); setFirmando(null); }}
          onCancelar={() => setFirmando(null)}
        />
      )}
    </div>
  );
}
