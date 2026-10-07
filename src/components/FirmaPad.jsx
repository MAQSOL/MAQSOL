import { useEffect, useRef, useState } from "react";

/**
 * Cuadro para firmar con el dedo (o mouse/stylus). Devuelve la firma como imagen PNG
 * transparente con trazo negro, lista para imprimirse en el documento.
 */
export default function FirmaPad({ titulo, subtitulo, onGuardar, onCancelar }) {
  const lienzo = useRef(null);
  const dibujando = useRef(false);
  const [hayTrazo, setHayTrazo] = useState(false);

  useEffect(() => {
    const c = lienzo.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const ancho = c.clientWidth;
    const alto = c.clientHeight;
    c.width = Math.round(ancho * ratio);
    c.height = Math.round(alto * ratio);
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
  }, []);

  const punto = (e) => {
    const r = lienzo.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function empezar(e) {
    e.preventDefault();
    lienzo.current.setPointerCapture?.(e.pointerId);
    dibujando.current = true;
    const { x, y } = punto(e);
    const ctx = lienzo.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();
    setHayTrazo(true);
  }
  function mover(e) {
    if (!dibujando.current) return;
    e.preventDefault();
    const { x, y } = punto(e);
    const ctx = lienzo.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function terminar() {
    dibujando.current = false;
  }
  function limpiar() {
    const c = lienzo.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setHayTrazo(false);
  }
  function guardar() {
    if (!hayTrazo) return alert("Dibuja la firma antes de guardar.");
    const c = lienzo.current;
    const ctx = c.getContext("2d");
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const margen = 8;
    minX = Math.max(0, minX - margen);
    minY = Math.max(0, minY - margen);
    maxX = Math.min(width, maxX + margen);
    maxY = Math.min(height, maxY + margen);
    const recorte = document.createElement("canvas");
    recorte.width = maxX - minX;
    recorte.height = maxY - minY;
    recorte.getContext("2d").drawImage(c, minX, minY, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height);
    onGuardar(recorte.toDataURL("image/png"));
  }

  return (
    <div
      onClick={onCancelar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 20, width: "100%", maxWidth: 680, boxShadow: "0 12px 40px rgba(0,0,0,.3)" }}>
        <h3 style={{ margin: "0 0 2px" }}>{titulo}</h3>
        {subtitulo && <p style={{ margin: "0 0 12px", color: "#777", fontSize: 13.5 }}>{subtitulo}</p>}
        <div style={{ position: "relative", border: "2px dashed #b9c0c7", borderRadius: 10, background: "#fcfcfd" }}>
          <canvas
            ref={lienzo}
            onPointerDown={empezar}
            onPointerMove={mover}
            onPointerUp={terminar}
            onPointerCancel={terminar}
            onPointerLeave={terminar}
            style={{ width: "100%", height: 260, display: "block", touchAction: "none", cursor: "crosshair" }}
          />
          {!hayTrazo && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#b0b6bd", fontSize: 15, pointerEvents: "none" }}>
              Firma aquí con el dedo
            </div>
          )}
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 46, borderTop: "1px solid #d5d9dd", pointerEvents: "none" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" onClick={limpiar} style={{ border: "none", background: "#eee", borderRadius: 8, padding: "12px 18px", fontWeight: 700, cursor: "pointer" }}>
            Limpiar
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onCancelar} style={{ border: "none", background: "#eee", borderRadius: 8, padding: "12px 18px", fontWeight: 700, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="button" onClick={guardar} style={{ border: "none", background: "var(--acento)", color: "#fff", borderRadius: 8, padding: "12px 24px", fontWeight: 800, cursor: "pointer" }}>
              Guardar firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
