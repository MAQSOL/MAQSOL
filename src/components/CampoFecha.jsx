import { useRef, useState } from "react";

/*
 * Campo de fecha que siempre se escribe y se ve como día/mes/año (13/10/2026),
 * sin depender del idioma del navegador. Recibe y devuelve la fecha en formato
 * ISO (AAAA-MM-DD), igual que <input type="date">, así que se puede usar en su lugar.
 */

const aTexto = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

const aIso = (txt) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(txt);
  if (!m) return null;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const f = new Date(y, mo - 1, d);
  if (f.getFullYear() !== y || f.getMonth() !== mo - 1 || f.getDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
};

// 13102026 -> 13/10/2026 mientras se escribe
const mascara = (txt) => {
  const d = txt.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, 2) + "/" + d.slice(2);
  return d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
};

export default function CampoFecha({ value, onChange, style, className, disabled, min, max, required, autoFocus, id, name, onBlur, title }) {
  const [texto, setTexto] = useState(null); // null = mostrar el valor guardado
  const picker = useRef(null);
  const mostrado = texto !== null ? texto : aTexto(value);

  const emitir = (iso) => {
    if (onChange) onChange({ target: { value: iso, name }, currentTarget: { value: iso, name } });
  };

  const escribir = (e) => {
    const t = mascara(e.target.value);
    setTexto(t);
    if (t === "") emitir("");
    else {
      const iso = aIso(t);
      if (iso) emitir(iso);
    }
  };

  const abrirCalendario = () => {
    const el = picker.current;
    if (!el || disabled) return;
    try {
      if (el.showPicker) el.showPicker();
      else el.focus();
    } catch {
      el.focus();
    }
  };

  return (
    <div style={{ position: "relative", width: style?.width ?? "100%", flex: style?.flex, minWidth: 0, maxWidth: style?.maxWidth }}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        id={id}
        name={name}
        title={title}
        className={className}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        value={mostrado}
        onChange={escribir}
        onBlur={(e) => {
          setTexto(null);
          if (onBlur) onBlur(e);
        }}
        style={{ ...(style || {}), width: "100%", maxWidth: "none", boxSizing: "border-box", paddingRight: 40 }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={abrirCalendario}
        disabled={disabled}
        title="Elegir en el calendario"
        aria-label="Elegir en el calendario"
        style={{
          position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 32, height: 32,
          border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", fontSize: 17, lineHeight: 1, padding: 0
        }}
      >
        📅
      </button>
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value || ""}
        min={min}
        max={max}
        onChange={(e) => {
          setTexto(null);
          emitir(e.target.value);
        }}
        style={{ position: "absolute", right: 0, bottom: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none", border: 0, padding: 0 }}
      />
    </div>
  );
}
