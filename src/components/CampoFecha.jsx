import { useEffect, useRef, useState } from "react";

/*
 * Campo de fecha que siempre se escribe y se ve como día/mes/año (13/10/2026),
 * sin depender del idioma del navegador. Recibe y devuelve la fecha en formato
 * ISO (AAAA-MM-DD), igual que <input type="date">, así que se puede usar en su lugar.
 *
 * El botón 📅 abre un calendario propio (no el del navegador): el selector nativo
 * no abría en algunos navegadores.
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

const pad = (n) => String(n).padStart(2, "0");
const isoDe = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const hoyIso = () => { const h = new Date(); return isoDe(h.getFullYear(), h.getMonth(), h.getDate()); };
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const ALTO = 318, ANCHO = 268;

// posición fija junto al campo (así no la recorta un modal con scroll); se voltea hacia arriba si no cabe
function posicionJunto(el) {
  const r = el.getBoundingClientRect();
  const arriba = r.bottom + ALTO + 8 > window.innerHeight && r.top > ALTO + 8;
  return {
    top: arriba ? r.top - ALTO - 6 : r.bottom + 6,
    left: Math.max(8, Math.min(r.right - ANCHO, window.innerWidth - ANCHO - 8)),
  };
}

function Calendario({ valor, min, max, ancla, pos, onElegir, onCerrar }) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(valor || "") ? valor : hoyIso();
  const [vista, setVista] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 });
  const caja = useRef(null);
  const cerrar = useRef(onCerrar);
  useEffect(() => { cerrar.current = onCerrar; });

  useEffect(() => {
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target) && !ancla.contains(e.target)) cerrar.current(); };
    const tecla = (e) => { if (e.key === "Escape") cerrar.current(); };
    const mover = (e) => { if (!caja.current || !caja.current.contains(e.target)) cerrar.current(); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    document.addEventListener("keydown", tecla);
    window.addEventListener("resize", mover);
    window.addEventListener("scroll", mover, true);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("resize", mover);
      window.removeEventListener("scroll", mover, true);
    };
  }, [ancla]);

  const primero = (new Date(vista.y, vista.m, 1).getDay() + 6) % 7; // lunes = 0
  const diasMes = new Date(vista.y, vista.m + 1, 0).getDate();
  const celdas = [...Array(primero).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];
  const cambiarMes = (d) => setVista((v) => { const f = new Date(v.y, v.m + d, 1); return { y: f.getFullYear(), m: f.getMonth() }; });
  const hoy = hoyIso();
  const fueraDeRango = (iso) => (min && iso < min) || (max && iso > max);
  const flecha = { width: 32, height: 32, border: "2px solid #111", background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 800, lineHeight: 1, padding: 0 };

  return (
    <div ref={caja} role="dialog" aria-label="Calendario"
      style={{ position: "fixed", ...pos, width: ANCHO, zIndex: 10000, background: "#fff", border: "2px solid #111", boxShadow: "5px 5px 0 #111", padding: 10, fontFamily: "inherit", color: "#111" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button type="button" style={flecha} onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button>
        <strong style={{ fontSize: 14 }}>{MESES[vista.m]} {vista.y}</strong>
        <button type="button" style={flecha} onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, textAlign: "center" }}>
        {DIAS.map((d, i) => <div key={i} style={{ fontSize: 11, fontWeight: 800, color: "#888", padding: "2px 0" }}>{d}</div>)}
        {celdas.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoDe(vista.y, vista.m, d);
          const sel = iso === valor, esHoy = iso === hoy, off = fueraDeRango(iso);
          return (
            <button key={i} type="button" disabled={off} onClick={() => onElegir(iso)}
              style={{ height: 32, border: sel ? "2px solid #111" : esHoy ? "2px solid #8F1D2C" : "1px solid #eee", background: sel ? "#111" : "#fff", color: sel ? "#fff" : off ? "#ccc" : "#111", fontWeight: sel || esHoy ? 800 : 500, fontSize: 13, cursor: off ? "not-allowed" : "pointer", padding: 0 }}>
              {d}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 6 }}>
        <button type="button" onClick={() => onElegir("")} style={{ border: "none", background: "transparent", color: "#888", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>Borrar</button>
        <button type="button" disabled={fueraDeRango(hoy)} onClick={() => onElegir(hoy)} style={{ border: "2px solid #111", background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 800, padding: "4px 12px" }}>Hoy</button>
      </div>
    </div>
  );
}

export default function CampoFecha({ value, onChange, style, className, disabled, min, max, required, autoFocus, id, name, onBlur, title }) {
  const [texto, setTexto] = useState(null); // null = mostrar el valor guardado
  const [abierto, setAbierto] = useState(null); // null o la posición del calendario
  const contenedor = useRef(null);
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

  const alternar = () => {
    if (disabled || !contenedor.current) return;
    setAbierto((a) => (a ? null : posicionJunto(contenedor.current)));
  };

  return (
    <div ref={contenedor} style={{ position: "relative", width: style?.width ?? "100%", flex: style?.flex, minWidth: 0, maxWidth: style?.maxWidth }}>
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
        // Se abre al presionar (no al soltar): el estilo global button:active mueve el botón
        // y el clic se soltaba encima del campo, así que el calendario nunca abría.
        onMouseDown={(e) => { e.preventDefault(); alternar(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); } }}
        disabled={disabled}
        title="Elegir en el calendario"
        aria-label="Elegir en el calendario"
        aria-expanded={!!abierto}
        style={{
          // centrado sin transform (button:active pone su propio transform con !important)
          position: "absolute", right: 4, top: 0, bottom: 0, margin: "auto 0", width: 32, height: 32,
          border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", fontSize: 17, lineHeight: 1, padding: 0
        }}
      >
        📅
      </button>
      {abierto && (
        <Calendario
          valor={value || ""}
          min={min}
          max={max}
          ancla={contenedor.current}
          pos={abierto}
          onElegir={(iso) => { setTexto(null); emitir(iso); setAbierto(null); }}
          onCerrar={() => setAbierto(null)}
        />
      )}
    </div>
  );
}
