import { useState } from "react";
import { S } from "../pages/Administracion/estilosAdmin";
import { supabase } from "../supabaseClient";
import { descargarFichaPDF } from "../utils/fichaPersonal";

const MAX_EXTRA_MB = 2;
const CORREO_JEFE = "abalam@maqsol.com.mx"; // destinatario sugerido (se puede cambiar al enviar)
const aBase64 = (file) =>
  new Promise((ok, err) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1]);
    r.onerror = err;
    r.readAsDataURL(file);
  });

// Redacta y envía por correo la ficha de ingreso (PDF adjunto) sin imprimirla.
export default function EnviarFichaModal({ persona, logo, onClose }) {
  const nombre = (persona?.nombre || "EMPLEADO").trim();
  const archivo = "FICHA-" + nombre.replace(/\s+/g, "-").toUpperCase();
  const [para, setPara] = useState(() => { try { return localStorage.getItem("ficha_correo_jefe") || CORREO_JEFE; } catch { return CORREO_JEFE; } });
  const [asunto, setAsunto] = useState(`Ficha de ingreso – ${nombre}`);
  const [mensaje, setMensaje] = useState(`Buen día,\n\nAdjunto la ficha de ingreso de ${nombre} para su revisión y firma.\n\nSaludos.`);
  const [extras, setExtras] = useState([]);
  const [estado, setEstado] = useState(null); // null | "enviando" | "ok" | texto de error

  function agregar(ev) {
    const nuevos = Array.from(ev.target.files || []);
    ev.target.value = "";
    const total = [...extras, ...nuevos];
    if (total.reduce((s, f) => s + f.size, 0) > MAX_EXTRA_MB * 1024 * 1024) {
      setEstado(`Los adjuntos extra no pueden pasar de ${MAX_EXTRA_MB} MB en total.`);
      return;
    }
    setEstado(null);
    setExtras(total);
  }

  async function enviar() {
    setEstado("enviando");
    try {
      const pdfB64 = descargarFichaPDF(persona, logo, archivo, { devolver: true });
      const adjuntos = [{ filename: archivo + ".pdf", content: pdfB64 }];
      for (const f of extras) adjuntos.push({ filename: f.name, content: await aBase64(f) });
      const { data } = await supabase.auth.getSession();
      const r = await fetch("/api/enviar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data?.session?.access_token || ""}` },
        body: JSON.stringify({ to: para.trim(), subject: asunto, text: mensaje, attachments: adjuntos }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo enviar el correo.");
      try { localStorage.setItem("ficha_correo_jefe", para.trim()); } catch { /* sin almacenamiento */ }
      setEstado("ok");
    } catch (e) {
      setEstado(e.message || "No se pudo enviar el correo.");
    }
  }

  const enviando = estado === "enviando";
  const error = estado && estado !== "ok" && !enviando ? estado : null;

  return (
    <div style={S.modalBg} onClick={enviando ? undefined : onClose}>
      <div style={{ ...S.modal, maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>Enviar ficha por correo</h2>

        {estado === "ok" ? (
          <>
            <p style={{ color: "#1f8b4c", fontWeight: 700, fontSize: 15 }}>✓ Correo enviado a {para.trim()}</p>
            <div style={{ textAlign: "right", marginTop: 18 }}>
              <button className="btn-sys" style={S.btn} onClick={onClose}>Cerrar</button>
            </div>
          </>
        ) : (
          <>
            <label style={S.label}>PARA</label>
            <input style={{ ...S.input, marginBottom: 14 }} type="email" placeholder="correo@ejemplo.com" value={para} onChange={(e) => setPara(e.target.value)} />

            <label style={S.label}>ASUNTO</label>
            <input style={{ ...S.input, marginBottom: 14 }} value={asunto} onChange={(e) => setAsunto(e.target.value)} />

            <label style={S.label}>MENSAJE</label>
            <textarea style={{ ...S.input, minHeight: 130, resize: "vertical", marginBottom: 14 }} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />

            <label style={S.label}>ADJUNTOS</label>
            <div style={{ border: "2px solid #e3e6ea", padding: "10px 12px", marginBottom: 8, fontSize: 14 }}>
              📎 {archivo}.pdf <span style={{ color: "#888" }}>(ficha, se adjunta automáticamente)</span>
            </div>
            {extras.map((f, i) => (
              <div key={i} style={{ border: "2px solid #e3e6ea", padding: "10px 12px", marginBottom: 8, fontSize: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>📎 {f.name}</span>
                <button type="button" className="btn-sys" style={{ ...S.btnGris, padding: "2px 10px", fontSize: 12 }} onClick={() => setExtras(extras.filter((_, j) => j !== i))}>Quitar</button>
              </div>
            ))}
            <label className="btn-sys" style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13, display: "inline-block", cursor: "pointer", marginBottom: 6 }}>
              + Adjuntar otro archivo
              <input type="file" multiple style={{ display: "none" }} onChange={agregar} />
            </label>

            {error && <p style={{ color: "#c62828", fontWeight: 700, fontSize: 13.5, margin: "10px 0 0" }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button className="btn-sys" style={S.btnGris} onClick={onClose} disabled={enviando}>Cancelar</button>
              <button className="btn-sys" style={{ ...S.btn, opacity: enviando || !para.trim() ? 0.6 : 1 }} onClick={enviar} disabled={enviando || !para.trim()}>
                {enviando ? "Enviando…" : "Enviar correo"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
