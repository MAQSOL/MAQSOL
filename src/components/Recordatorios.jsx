import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { RECORDATORIOS, VENTANA_MIN } from "../utils/recordatorios";
import logo from "../assets/logo.png";

const hoyClave = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const minutosDe = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } };

const soportaNotif = () => typeof window !== "undefined" && "Notification" in window;

/** Recordatorios que tocan ahora y aún no se mostraron hoy (los marca como mostrados). */
function pendientesAhora() {
  const ahora = new Date();
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  const hoy = hoyClave(ahora);
  return RECORDATORIOS.filter((r) => {
    if (!r.dias.includes(ahora.getDay())) return false;
    const ini = minutosDe(r.hora);
    if (min < ini || min > ini + VENTANA_MIN) return false;
    const clave = `rec:${r.id}:${hoy}`;
    if (leer(clave)) return false;
    escribir(clave, "1");
    return true;
  });
}

export default function Recordatorios() {
  const { session } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState([]);
  const [pedirPermiso, setPedirPermiso] = useState(false);
  const uid = session?.user?.id;

  useEffect(() => {
    if (!uid) return;
    if (soportaNotif() && Notification.permission === "default" && leer("rec:permiso-no") !== hoyClave()) setPedirPermiso(true);

    const revisar = () => {
      const nuevos = pendientesAhora();
      if (!nuevos.length) return;
      nuevos.forEach((r) => {
        if (soportaNotif() && Notification.permission === "granted") {
          const n = new Notification(r.titulo, { body: r.cuerpo, icon: logo, tag: r.id });
          n.onclick = () => { window.focus(); navigate(r.url); n.close(); };
        }
      });
      setAvisos((a) => [...nuevos.map((r) => ({ ...r, cuando: Date.now() })), ...a]);
    };
    revisar();
    const t = setInterval(revisar, 30000);
    return () => clearInterval(t);
  }, [uid, navigate]);

  if (!uid || pathname.startsWith("/login") || pathname.startsWith("/e/") || pathname.startsWith("/fotos/")) return null;
  if (!avisos.length && !pedirPermiso) return null;

  const quitar = (id) => setAvisos((a) => a.filter((x) => x.id !== id));

  const activar = async () => {
    setPedirPermiso(false);
    const p = await Notification.requestPermission();
    if (p === "granted") new Notification("Recordatorios activados", { body: "Te avisaremos de asistencias y bitácoras.", icon: logo, tag: "rec-activados" });
  };

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 960, display: "flex", flexDirection: "column", gap: 10, width: 340, maxWidth: "calc(100vw - 32px)" }}>
      {pedirPermiso && (
        <div style={tarjeta}>
          <Campana />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={titulo}>Activa los recordatorios</div>
            <div style={cuerpo}>Recibe avisos de asistencias y bitácoras aunque estés en otra pestaña.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn-sys btn-pdf" style={boton} onClick={activar}>Activar</button>
              <button className="btn-sys" style={boton} onClick={() => { setPedirPermiso(false); escribir("rec:permiso-no", hoyClave()); }}>Ahora no</button>
            </div>
          </div>
        </div>
      )}
      {avisos.map((r) => (
        <div key={r.id} style={{ ...tarjeta, cursor: "pointer" }} onClick={() => { quitar(r.id); navigate(r.url); }} title="Abrir">
          <Campana />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={titulo}>{r.titulo}</div>
            <div style={cuerpo}>{r.cuerpo}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>MAQSISTEM · {r.hora} h</div>
          </div>
          <button aria-label="Cerrar" onClick={(e) => { e.stopPropagation(); quitar(r.id); }} style={cerrar}>✕</button>
        </div>
      ))}
    </div>
  );
}

function Campana() {
  return (
    <div style={{ width: 36, height: 36, flexShrink: 0, background: "var(--acento)", display: "grid", placeItems: "center" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </div>
  );
}

const tarjeta = { display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "2px solid #111", boxShadow: "5px 5px 0 #111", padding: "12px 12px 12px 12px", fontFamily: "'Montserrat', sans-serif", animation: "rec-entra .35s cubic-bezier(.22,1,.36,1)" };
const titulo = { fontWeight: 800, fontSize: 14, color: "#111" };
const cuerpo = { fontSize: 13, color: "#555", marginTop: 2, lineHeight: 1.35 };
const boton = { padding: "6px 12px", fontSize: 12, fontWeight: 700, fontFamily: "inherit" };
const cerrar = { border: "none", background: "none", color: "#888", fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1 };
