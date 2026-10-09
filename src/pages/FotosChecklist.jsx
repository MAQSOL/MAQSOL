import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { folioVisible } from "../utils/folio";
import logo from "../assets/logo.png";

const BUCKET = "checklist-fotos";

export default function FotosChecklist() {
  const { token } = useParams();
  const [datos, setDatos] = useState(undefined); // undefined = cargando, null = no existe
  const [grande, setGrande] = useState(null);

  useEffect(() => {
    let vivo = true;
    supabase.rpc("checklist_fotos_publico", { p_token: token }).then(({ data, error }) => {
      if (vivo) setDatos(error ? null : data || null);
    });
    return () => {
      vivo = false;
    };
  }, [token]);

  const urlDe = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const pagina = { minHeight: "100vh", background: "#f4f6f9", padding: "18px 14px 40px", boxSizing: "border-box" };
  const tarjeta = { background: "#fff", borderRadius: 14, padding: 20, maxWidth: 900, margin: "0 auto 16px", boxShadow: "0 2px 10px rgba(0,0,0,.07)", boxSizing: "border-box" };

  const encabezado = (
    <div style={{ maxWidth: 900, margin: "0 auto 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <img src={logo} alt="MAQSOL" style={{ height: 46 }} />
      <div>
        <div style={{ fontWeight: 800, letterSpacing: 2, fontSize: 15 }}>MAQSOL</div>
        <div style={{ fontSize: 12, color: "#777" }}>Maquinaria Soporte y Logística</div>
      </div>
    </div>
  );

  if (datos === undefined) return <div style={pagina}>{encabezado}<div style={tarjeta}>Cargando fotos…</div></div>;

  if (datos === null) {
    return (
      <div style={pagina}>
        {encabezado}
        <div style={tarjeta}>
          <h3 style={{ marginTop: 0 }}>Enlace no válido</h3>
          <p style={{ color: "#666", marginBottom: 0 }}>Este enlace de fotos no existe o ya no está disponible. Pide uno nuevo a MAQSOL.</p>
        </div>
      </div>
    );
  }

  const fotos = datos.fotos || [];
  const titulo = [datos.equipo, datos.marca, datos.modelo].filter(Boolean).join(" ");

  return (
    <div style={pagina}>
      {encabezado}
      <div style={tarjeta}>
        <h2 style={{ margin: "0 0 2px" }}>Fotos del equipo</h2>
        <div style={{ color: "#555" }}>{titulo}{datos.serie ? ` · Serie ${datos.serie}` : ""}</div>
        <div style={{ color: "#999", fontSize: 13, marginTop: 4 }}>
          Folio {folioVisible(datos.folio)}{datos.fecha ? ` · ${new Date(datos.fecha + "T00:00:00").toLocaleDateString("es-MX")}` : ""} · {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
        </div>
      </div>

      <div style={{ ...tarjeta, padding: 14 }}>
        {fotos.length === 0 ? (
          <p style={{ color: "#999", margin: 8 }}>Todavía no hay fotos en este enlace.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }}>
            {fotos.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setGrande(f)}
                style={{ border: "none", padding: 0, borderRadius: 10, overflow: "hidden", cursor: "zoom-in", background: "#eee", aspectRatio: "4 / 3" }}
              >
                <img src={urlDe(f)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {grande && (
        <div
          onClick={() => setGrande(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, gap: 12 }}
        >
          <img src={urlDe(grande)} alt="" style={{ maxWidth: "100%", maxHeight: "82vh", objectFit: "contain", borderRadius: 8 }} />
          <div style={{ display: "flex", gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <a href={urlDe(grande)} target="_blank" rel="noopener noreferrer" download style={{ background: "#fff", borderRadius: 8, padding: "10px 18px", fontWeight: 700, color: "#222", textDecoration: "none" }}>
              Abrir / descargar
            </a>
            <button type="button" onClick={() => setGrande(null)} style={{ border: "none", background: "#444", color: "#fff", borderRadius: 8, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
