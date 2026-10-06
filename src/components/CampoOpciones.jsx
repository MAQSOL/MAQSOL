import { useState } from "react";

const base = {
  width: "100%",
  padding: "10px 11px",
  border: "1px solid #d8d8d8",
  borderRadius: 6,
  fontSize: 13.5,
  boxSizing: "border-box",
  background: "#fff"
};

const OTRO = "__otro__";

/**
 * Lista desplegable con opción "Otro (escribir)": si lo que necesitas no está en la lista,
 * eliges Otro y lo capturas a mano. El valor actual siempre aparece como opción.
 */
export default function CampoOpciones({ opciones, valor, onChange, disabled, vacio = "Selecciona", placeholder = "Escribe aquí", textoOtro = "Otro (escribir)" }) {
  const [manual, setManual] = useState(false);

  if (manual) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <input autoFocus style={base} value={valor || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
        <button
          type="button"
          title="Volver a la lista"
          onClick={() => {
            setManual(false);
            if (!opciones.includes(valor)) onChange("");
          }}
          style={{ border: "none", background: "#e9e9e9", borderRadius: 6, padding: "0 12px", cursor: "pointer", fontWeight: 700 }}
        >
          ↩
        </button>
      </div>
    );
  }

  const lista = valor && !opciones.includes(valor) ? [...opciones, valor] : opciones;

  return (
    <select
      style={{ ...base, color: valor ? "#222" : "#777" }}
      value={valor || ""}
      disabled={disabled}
      onChange={(e) => {
        if (e.target.value === OTRO) {
          setManual(true);
          onChange("");
        } else onChange(e.target.value);
      }}
    >
      <option value="">{vacio}</option>
      {lista.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
      <option value={OTRO}>+ {textoOtro}</option>
    </select>
  );
}
