import { useState } from "react";
import { S, hoyISO } from "../pages/Administracion/estilosAdmin";
import CampoFecha from "./CampoFecha";
import { CARTA_NUEVA, abrirCartaResponsiva } from "../utils/cartaResponsiva";

// Generador de carta responsiva de equipo para operadores (Documentos de Personal).
export default function CartaResponsivaModal({ personas, persona, onClose }) {
  const [f, setF] = useState(() => ({
    ...CARTA_NUEVA,
    fecha: hoyISO(),
    ...(persona
      ? { personaId: persona.id, nombre: persona.nombre || "", curp: persona.curp || "", ine: persona.ine || "" }
      : {}),
  }));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

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

  const faltaDato = !f.nombre.trim() || !f.curp.trim() || !f.ine.trim() || !f.equipo.trim();

  return (
    <div style={S.modalBg} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
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
          <div><label style={S.label}>LLAVES ENTREGADAS</label><input style={S.input} inputMode="numeric" value={f.llaves} onChange={set("llaves")} /></div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={S.label}>QUIÉN ENTREGA POR MAQSOL (nombre para la firma)</label>
          <input style={S.input} value={f.entrega} onChange={set("entrega")} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button style={S.btnGris} onClick={onClose}>Cancelar</button>
          <button style={{ ...S.btn, opacity: faltaDato ? 0.5 : 1 }} disabled={faltaDato} onClick={() => abrirCartaResponsiva(f)}>
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
