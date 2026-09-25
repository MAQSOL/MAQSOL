import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import { nuevoToken, urlEquipo, qrDataUrl, descargarPNG, descargarEtiquetaQR } from "../utils/qrEquipo";

const btn = { border: "none", borderRadius: 6, padding: "10px 16px", fontWeight: 700, cursor: "pointer", fontSize: 14 };

export default function QrEquipoModal({ equipo, onGuardarToken, onCerrar }) {
  const [token, setToken] = useState(equipo.qrToken || "");
  const [imagen, setImagen] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const url = token ? urlEquipo(token) : "";

  useEffect(() => {
    if (!url) return;
    let vivo = true;
    qrDataUrl(url).then((d) => {
      if (vivo) setImagen({ url, d });
    });
    return () => {
      vivo = false;
    };
  }, [url]);

  const listo = imagen && imagen.url === url ? imagen.d : "";

  async function generar(regenerar) {
    if (
      regenerar &&
      !window.confirm("Se creará un QR nuevo y el que ya está pegado en la máquina dejará de funcionar. ¿Continuar?")
    )
      return;
    setTrabajando(true);
    const t = nuevoToken();
    const ok = await onGuardarToken(t);
    if (ok !== false) setToken(t);
    setTrabajando(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", url);
    }
  }

  const logoUrl = () => new URL(logo, window.location.href).href;

  return (
    <div
      onClick={onCerrar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 30, overflowY: "auto" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 26, width: "100%", maxWidth: 460, textAlign: "center" }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 4px" }}>Código QR del equipo</h2>
        <p style={{ color: "#777", fontSize: 13.5, margin: "0 0 16px" }}>
          {equipo.tipo} {equipo.marca} {equipo.modelo} · Serie {equipo.serie || "s/n"}
        </p>

        {!token ? (
          <>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 18 }}>
              Este equipo todavía no tiene código. Al generarlo, quien lo escanee podrá ver su información (como cliente) o registrar
              mantenimientos (como mecánico con sesión iniciada).
            </p>
            <button style={{ ...btn, background: "var(--acento)", color: "#fff", opacity: trabajando ? 0.6 : 1 }} disabled={trabajando} onClick={() => generar(false)}>
              {trabajando ? "Generando…" : "Generar código QR"}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              {listo ? (
                <img src={listo} alt="Código QR" style={{ width: 260, height: 260 }} />
              ) : (
                <div style={{ width: 260, height: 260, background: "#f3f3f3", borderRadius: 8 }} />
              )}
            </div>
            <p style={{ fontSize: 11.5, color: "#999", wordBreak: "break-all", margin: "0 0 16px" }}>{url}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              <button style={{ ...btn, background: "var(--acento)", color: "#fff" }} disabled={!listo} onClick={() => descargarEtiquetaQR(equipo, listo, url, logoUrl())}>
                Etiqueta para imprimir (PDF)
              </button>
              <button style={{ ...btn, background: "#e9e9e9", color: "#333" }} disabled={!listo} onClick={() => descargarPNG(listo, `QR-${equipo.serie || "equipo"}`)}>
                Descargar PNG
              </button>
              <button style={{ ...btn, background: "#e9e9e9", color: "#333" }} onClick={copiar}>
                {copiado ? "¡Copiado!" : "Copiar enlace"}
              </button>
            </div>

            <button
              style={{ ...btn, background: "transparent", color: "#c62828", fontWeight: 600, fontSize: 13 }}
              disabled={trabajando}
              onClick={() => generar(true)}
            >
              Generar uno nuevo (invalida el anterior)
            </button>
          </>
        )}

        <div style={{ marginTop: 14 }}>
          <button style={{ ...btn, background: "#e9e9e9", color: "#333" }} onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
