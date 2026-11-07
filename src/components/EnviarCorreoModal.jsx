import { useState } from "react";
import { S } from "../pages/Administracion/estilosAdmin";
import { supabase } from "../supabaseClient";

// Modal genérico: envía por correo un PDF generado al momento (vía /api/enviar-correo).
// generarPDF() debe devolver el PDF en base64. claveCorreo guarda el último destinatario usado.
export default function EnviarCorreoModal({ titulo = "Enviar por correo", archivo, generarPDF, asuntoInicial = "", mensajeInicial = "", claveCorreo = "correo_ultimo", onClose }) {
  const [para, setPara] = useState(() => { try { return localStorage.getItem(claveCorreo) || ""; } catch { return ""; } });
  const [asunto, setAsunto] = useState(asuntoInicial);
  const [mensaje, setMensaje] = useState(mensajeInicial);
  const [estado, setEstado] = useState(null); // null | "enviando" | "ok" | texto de error

  async function enviar() {
    setEstado("enviando");
    try {
      const pdfB64 = await generarPDF();
      const { data } = await supabase.auth.getSession();
      const r = await fetch("/api/enviar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data?.session?.access_token || ""}` },
        body: JSON.stringify({ to: para.trim(), subject: asunto, text: mensaje, attachments: [{ filename: archivo + ".pdf", content: pdfB64 }] }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo enviar el correo.");
      try { localStorage.setItem(claveCorreo, para.trim()); } catch { /* sin almacenamiento */ }
      setEstado("ok");
    } catch (e) {
      setEstado(e.message || "No se pudo enviar el correo.");
    }
  }

  const enviando = estado === "enviando";
  const error = estado && estado !== "ok" && !enviando ? estado : null;

  return (
    <div style={S.modalBg} onClick={enviando ? undefined : onClose}>
      <div style={{ ...S.modal, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>{titulo}</h2>

        {estado === "ok" ? (
          <>
            <p style={{ color: "#1f8b4c", fontWeight: 700, fontSize: 15 }}>✓ Correo enviado a {para.trim()}</p>
            <div style={{ textAlign: "right", marginTop: 18 }}>
              <button className="btn-sys" style={S.btn} onClick={onClose}>Cerrar</button>
            </div>
          </>
        ) : (
          <>
            <label style={S.label}>PARA (puedes poner varios separados por coma)</label>
            <input style={{ ...S.input, marginBottom: 14 }} type="text" inputMode="email" placeholder="correo@ejemplo.com" value={para} onChange={(e) => setPara(e.target.value)} autoFocus />

            <label style={S.label}>ASUNTO</label>
            <input style={{ ...S.input, marginBottom: 14 }} value={asunto} onChange={(e) => setAsunto(e.target.value)} />

            <label style={S.label}>MENSAJE</label>
            <textarea style={{ ...S.input, minHeight: 110, resize: "vertical", marginBottom: 14 }} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />

            <label style={S.label}>ADJUNTO</label>
            <div style={{ border: "2px solid #e3e6ea", padding: "10px 12px", marginBottom: 8, fontSize: 14 }}>
              📎 {archivo}.pdf <span style={{ color: "#888" }}>(se genera y adjunta automáticamente)</span>
            </div>

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
