import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { guardarSubnombre, leerSubnombre } from "../utils/actividad";
import { comprimirImagen, extensionDe } from "../utils/imagenes";

/*
 * CHAT INTERNO (esquina inferior derecha, en todas las páginas con sesión).
 * Canales: "general" (todo el equipo), "soporte:<uid>" (esa persona con Soporte = quien
 * tenga perfiles.soporte) y "dm:<uid>:<uid>" (entre dos). Pestaña "Actividad": lo que
 * va pasando en el sistema, en vivo. Todo con Supabase Realtime (bloque 14 del esquema).
 */

const BUCKET = "chat-adjuntos";
const nombreDe = (p) => (p ? p.nombre_completo || p.apodo || (p.correo || "").split("@")[0] || "Usuario" : "Usuario");
const iniciales = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("");
const canalDM = (a, b) => "dm:" + [a, b].sort().join(":");
const ms = (iso) => Date.parse(iso || "") || 0;

function haceCuanto(iso, ahora) {
  const s = Math.max(0, Math.round((ahora - ms(iso)) / 1000));
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

const leerLeidos = () => {
  try { return JSON.parse(localStorage.getItem("chat_leidos") || "{}"); } catch { return {}; }
};

function Avatar({ nombre, foto, size = 34, color = "var(--acento)" }) {
  if (foto) return <img src={foto} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {iniciales(nombre)}
    </span>
  );
}

/** Imagen o archivo adjunto: el bucket es privado, se ve con un enlace firmado de 1 hora. */
function Adjunto({ adj }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let vivo = true;
    supabase.storage.from(BUCKET).createSignedUrl(adj.path, 3600).then(({ data }) => { if (vivo) setUrl(data?.signedUrl || null); });
    return () => { vivo = false; };
  }, [adj.path]);
  if (adj.tipo === "imagen") {
    return url ? (
      <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={adj.nombre} style={{ maxWidth: "100%", maxHeight: 190, borderRadius: 8, display: "block", marginTop: 4 }} /></a>
    ) : <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Cargando imagen…</div>;
  }
  return (
    <a href={url || undefined} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 12.5, fontWeight: 700, color: "inherit", textDecoration: "underline" }}>
      Archivo: {adj.nombre}
    </a>
  );
}

export default function ChatFlotante() {
  const { session, profile } = useAuth();
  const uid = session?.user?.id;
  const { pathname } = useLocation();

  const [abierto, setAbierto] = useState(false);
  const [pestana, setPestana] = useState("chats");   // chats | actividad
  const [canal, setCanal] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [leidos, setLeidos] = useState(leerLeidos);
  const [texto, setTexto] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [subnombre, setSubnombre] = useState(leerSubnombre);
  const [editandoSub, setEditandoSub] = useState(false);
  const [borradorSub, setBorradorSub] = useState("");
  const [sinTablas, setSinTablas] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const listaRef = useRef(null);
  const archivoRef = useRef(null);

  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    supabase.from("perfiles").select("id, nombre_completo, apodo, puesto, telefono, correo, foto_url, soporte").then(({ data }) => { if (vivo && data) setPerfiles(data); });
    supabase.from("chat_mensajes").select("*").order("creado", { ascending: false }).limit(400).then(({ data, error }) => {
      if (!vivo) return;
      if (error) setSinTablas(true);
      else setMensajes((data || []).reverse());
    });
    supabase.from("actividad").select("*").order("creado", { ascending: false }).limit(80).then(({ data }) => { if (vivo && data) setActividad(data); });
    const ch = supabase
      .channel("chat-actividad-" + uid)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_mensajes" }, (p) =>
        setMensajes((lista) => (lista.some((m) => m.id === p.new.id) ? lista : [...lista, p.new])))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_mensajes" }, (p) =>
        setMensajes((lista) => lista.filter((m) => m.id !== p.old.id)))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "actividad" }, (p) =>
        setActividad((lista) => (lista.some((a) => a.id === p.new.id) ? lista : [p.new, ...lista].slice(0, 150))))
      .subscribe();
    const reloj = setInterval(() => setAhora(Date.now()), 30000);
    return () => { vivo = false; supabase.removeChannel(ch); clearInterval(reloj); };
  }, [uid]);

  // al llegar mensajes a la conversación abierta, bajar hasta el último
  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [mensajes.length, canal, abierto]);

  if (!uid || pathname.startsWith("/login") || pathname.startsWith("/e/") || pathname.startsWith("/fotos/")) return null;

  const yo = perfiles.find((p) => p.id === uid) || profile;
  const soySoporte = !!yo?.soporte;
  const miNombre = nombreDe(yo) || (session.user.email || "").split("@")[0];
  // en una cuenta compartida, "mío" es lo que mandó esta cuenta CON este subnombre
  const esMio = (m) => m.autor === uid && (m.subnombre || "") === (subnombre || "");

  const marcarLeido = (c) => {
    const nuevo = { ...leidos, [c]: new Date().toISOString() };
    setLeidos(nuevo);
    try { localStorage.setItem("chat_leidos", JSON.stringify(nuevo)); } catch { /* sin almacenamiento */ }
  };
  const ultimoDe = (c) => {
    for (let i = mensajes.length - 1; i >= 0; i--) if (mensajes[i].canal === c) return mensajes[i];
    return null;
  };
  const noLeidos = (c) =>
    abierto && canal === c ? 0 : mensajes.filter((m) => m.canal === c && !esMio(m) && ms(m.creado) > ms(leidos[c])).length;

  const conversaciones = [{ id: "general", titulo: "General", sub: "Todo el equipo", tipo: "general" }];
  if (soySoporte) {
    [...new Set(mensajes.filter((m) => m.canal.startsWith("soporte:")).map((m) => m.canal))].forEach((c) => {
      const p = perfiles.find((x) => "soporte:" + x.id === c);
      conversaciones.push({ id: c, titulo: "Soporte · " + nombreDe(p), sub: p?.puesto || "Pidió soporte", tipo: "soporte", persona: p });
    });
  } else {
    conversaciones.push({ id: "soporte:" + uid, titulo: "Soporte", sub: "Dudas o problemas del sistema", tipo: "soporte", persona: perfiles.find((p) => p.soporte) });
  }
  perfiles
    .filter((p) => p.id !== uid)
    .map((p) => ({ id: canalDM(uid, p.id), titulo: nombreDe(p), sub: p.puesto || p.correo || "", tipo: "dm", persona: p }))
    .sort((a, b) => ms(ultimoDe(b.id)?.creado) - ms(ultimoDe(a.id)?.creado) || a.titulo.localeCompare(b.titulo))
    .forEach((c) => conversaciones.push(c));

  const totalNoLeidos = conversaciones.reduce((t, c) => t + noLeidos(c.id), 0);
  const activa = conversaciones.find((c) => c.id === canal);
  const mensajesCanal = mensajes.filter((m) => m.canal === canal);

  const abrirConversacion = (c) => { setCanal(c); marcarLeido(c); };
  const volver = () => { if (canal) marcarLeido(canal); setCanal(null); setArchivos([]); };

  async function enviar() {
    const t = texto.trim();
    if ((!t && !archivos.length) || enviando || !canal) return;
    setEnviando(true);
    try {
      const adjuntos = [];
      for (const f of archivos) {
        const imagen = f.type.startsWith("image/") && !/gif/i.test(f.type);
        const blob = imagen ? await comprimirImagen(f, 1600, 0.82) : f;
        const ext = imagen ? "jpg" : extensionDe(f.name);
        const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: imagen ? "image/jpeg" : f.type || "application/octet-stream" });
        if (error) throw error;
        adjuntos.push({ path, nombre: f.name, tipo: f.type.startsWith("image/") ? "imagen" : "archivo" });
      }
      const { data, error } = await supabase
        .from("chat_mensajes")
        .insert({ canal, autor: uid, autor_nombre: miNombre, subnombre: subnombre || null, texto: t || null, adjuntos })
        .select()
        .single();
      if (error) throw error;
      setMensajes((lista) => (lista.some((m) => m.id === data.id) ? lista : [...lista, data]));
      setTexto("");
      setArchivos([]);
      marcarLeido(canal);
    } catch (e) {
      alert("No se pudo enviar: " + (e.message || e));
    }
    setEnviando(false);
  }

  const guardarSub = () => {
    guardarSubnombre(borradorSub);
    setSubnombre(borradorSub.trim());
    setEditandoSub(false);
  };

  // ---------------------------------------------------------------- estilos
  const panel = {
    position: "fixed", right: 20, bottom: 88, width: "min(370px, calc(100vw - 24px))", height: "min(560px, calc(100vh - 110px))",
    background: "#fff", borderRadius: 14, boxShadow: "0 18px 50px rgba(0,0,0,.25)", zIndex: 950, display: "flex", flexDirection: "column", overflow: "hidden"
  };
  const tabBtn = (on) => ({ background: on ? "rgba(255,255,255,.22)" : "transparent", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, padding: "6px 12px", borderRadius: 20, cursor: "pointer" });
  const fila = { display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f1f1f1", cursor: "pointer", background: "#fff", border: "none", width: "100%", textAlign: "left", font: "inherit" };

  return (
    <>
      <button
        onClick={() => setAbierto((v) => !v)}
        title="Chat del equipo"
        aria-label="Abrir chat del equipo"
        style={{ position: "fixed", right: 20, bottom: 20, width: 56, height: 56, borderRadius: "50%", border: "none", background: "var(--acento)", color: "#fff", boxShadow: "0 8px 22px rgba(0,0,0,.28)", cursor: "pointer", zIndex: 950, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M21 11.5a8.5 8.5 0 0 1-11.87 7.8L3 21l1.7-6.13A8.5 8.5 0 1 1 21 11.5Z" />}
        </svg>
        {!abierto && totalNoLeidos > 0 && (
          <span style={{ position: "absolute", top: -2, right: -2, minWidth: 20, height: 20, padding: "0 5px", borderRadius: 10, background: "#d6001c", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px #fff" }}>
            {totalNoLeidos > 99 ? "99+" : totalNoLeidos}
          </span>
        )}
      </button>

      {abierto && (
        <div style={panel} role="dialog" aria-label="Chat del equipo">
          {/* encabezado */}
          <div style={{ background: "var(--acento)", color: "#fff", padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            {canal && pestana === "chats" ? (
              <>
                <button onClick={volver} aria-label="Volver" style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>←</button>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activa?.titulo}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.85 }}>{activa?.sub}</div>
                </div>
              </>
            ) : (
              <>
                <strong style={{ fontSize: 15, marginRight: "auto" }}>Chat del equipo</strong>
                <button style={tabBtn(pestana === "chats")} onClick={() => setPestana("chats")}>Chats</button>
                <button style={tabBtn(pestana === "actividad")} onClick={() => setPestana("actividad")}>Actividad</button>
              </>
            )}
          </div>

          {sinTablas ? (
            <div style={{ padding: 20, color: "#777", fontSize: 14 }}>El chat aún no está activado: falta correr el bloque 14 del esquema en Supabase.</div>
          ) : pestana === "actividad" ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ padding: "10px 14px", fontSize: 11.5, color: "#999", fontWeight: 700, letterSpacing: 0.4, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1f8b4c", display: "inline-block" }} /> EN VIVO
              </div>
              {actividad.length === 0 ? (
                <div style={{ padding: "0 14px", color: "#999", fontSize: 13.5 }}>Todavía no hay movimientos registrados.</div>
              ) : actividad.map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 10, padding: "9px 14px", borderBottom: "1px solid #f4f4f4" }}>
                  <Avatar nombre={a.autor_nombre} size={30} color="#5b6b7c" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.35 }}>{a.descripcion}</div>
                    <div style={{ fontSize: 11.5, color: "#999", marginTop: 2 }}>{haceCuanto(a.creado, ahora)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : !canal ? (
            <>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {conversaciones.map((c) => {
                  const ult = ultimoDe(c.id);
                  const n = noLeidos(c.id);
                  return (
                    <button key={c.id} style={fila} onClick={() => abrirConversacion(c.id)}>
                      <Avatar nombre={c.tipo === "general" ? "G" : c.tipo === "soporte" && !soySoporte ? "S" : c.titulo.replace("Soporte · ", "")} foto={c.tipo === "dm" ? c.persona?.foto_url : null} color={c.tipo === "general" ? "#2f3b48" : c.tipo === "soporte" ? "#d6001c" : "var(--acento)"} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                          <strong style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.titulo}</strong>
                          {ult && <span style={{ fontSize: 11, color: "#aaa", flexShrink: 0 }}>{haceCuanto(ult.creado, ahora)}</span>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                          <span style={{ fontSize: 12.5, color: n ? "#222" : "#888", fontWeight: n ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ult ? `${esMio(ult) ? "Tú: " : ""}${ult.texto || (ult.adjuntos?.length ? "Envió un adjunto" : "")}` : c.sub}
                          </span>
                          {n > 0 && <span style={{ background: "#d6001c", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 800, padding: "1px 7px", flexShrink: 0 }}>{n}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ borderTop: "1px solid #eee", padding: "9px 14px", fontSize: 12.5, color: "#666" }}>
                {editandoSub ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input autoFocus value={borradorSub} onChange={(e) => setBorradorSub(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guardarSub()} placeholder="Ej. Kevin (auxiliar)" style={{ flex: 1, padding: "7px 9px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }} />
                    <button onClick={guardarSub} style={{ background: "var(--acento)", color: "#fff", border: "none", borderRadius: 8, padding: "0 12px", fontWeight: 700, cursor: "pointer" }}>Listo</button>
                  </div>
                ) : (
                  <>
                    Apareces como <strong>{subnombre || miNombre}</strong>
                    {subnombre && <span style={{ color: "#999" }}> ({miNombre})</span>} ·{" "}
                    <button onClick={() => { setBorradorSub(subnombre); setEditandoSub(true); }} style={{ background: "none", border: "none", color: "var(--acento)", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12.5 }}>
                      {subnombre ? "cambiar" : "ponerte un subnombre"}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {(activa?.tipo === "dm" || activa?.tipo === "soporte") && activa.persona && (
                <div style={{ padding: "8px 14px", background: "#f7f9fb", borderBottom: "1px solid #eef1f4", fontSize: 12.5, color: "#555", display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
                  <span><strong>{nombreDe(activa.persona)}</strong>{activa.persona.puesto ? ` · ${activa.persona.puesto}` : ""}</span>
                  {activa.persona.correo && <a href={`mailto:${activa.persona.correo}`} style={{ color: "var(--acento)" }}>{activa.persona.correo}</a>}
                  {activa.persona.telefono && <a href={`tel:${activa.persona.telefono.replace(/[^\d+]/g, "")}`} style={{ color: "var(--acento)" }}>{activa.persona.telefono}</a>}
                </div>
              )}
              <div ref={listaRef} style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", background: "#fafbfc" }}>
                {mensajesCanal.length === 0 && (
                  <div style={{ color: "#999", fontSize: 13.5, textAlign: "center", marginTop: 30 }}>
                    {activa?.tipo === "soporte" && !soySoporte ? "Escribe tu duda o el problema; Soporte te contesta aquí." : "Aún no hay mensajes. Escribe el primero."}
                  </div>
                )}
                {mensajesCanal.map((m, i) => {
                  const mio = esMio(m);
                  const quien = m.subnombre ? `${m.subnombre} · ${m.autor_nombre || ""}` : m.autor_nombre || "Usuario";
                  const mismoAnterior = i > 0 && mensajesCanal[i - 1].autor === m.autor && (mensajesCanal[i - 1].subnombre || "") === (m.subnombre || "");
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mio ? "flex-end" : "flex-start", marginTop: mismoAnterior ? 3 : 10 }}>
                      {!mio && !mismoAnterior && activa?.tipo !== "dm" && <div style={{ fontSize: 11.5, color: "#888", margin: "0 0 2px 4px" }}>{quien}</div>}
                      <div style={{ maxWidth: "82%", background: mio ? "var(--acento)" : "#fff", color: mio ? "#fff" : "#222", border: mio ? "none" : "1px solid #e9ecef", borderRadius: 12, padding: "7px 10px", fontSize: 13.5, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {m.texto}
                        {(m.adjuntos || []).map((a) => <Adjunto key={a.path} adj={a} />)}
                        <div style={{ fontSize: 10.5, opacity: 0.65, textAlign: "right", marginTop: 2 }}>
                          {new Date(m.creado).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {archivos.length > 0 && (
                <div style={{ padding: "6px 12px", borderTop: "1px solid #eee", fontSize: 12, color: "#555", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {archivos.map((f, i) => (
                    <span key={i} style={{ background: "#eef3f8", borderRadius: 12, padding: "2px 8px" }}>
                      {f.name} <button onClick={() => setArchivos((l) => l.filter((_, k) => k !== i))} aria-label="Quitar" style={{ border: "none", background: "none", cursor: "pointer", color: "#999" }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid #eee", alignItems: "flex-end" }}>
                <input ref={archivoRef} type="file" multiple accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" style={{ display: "none" }}
                  onChange={(e) => { setArchivos((l) => [...l, ...Array.from(e.target.files || [])].slice(0, 6)); e.target.value = ""; }} />
                <button onClick={() => archivoRef.current?.click()} title="Adjuntar imágenes o archivos" aria-label="Adjuntar"
                  style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #e0e0e0", background: "#fff", color: "#666", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21.4 11.1-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8" /></svg>
                </button>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Escribe un mensaje…"
                  rows={1}
                  style={{ flex: 1, resize: "none", maxHeight: 110, padding: "9px 11px", border: "1px solid #e0e0e0", borderRadius: 10, fontSize: 13.5, fontFamily: "inherit" }}
                />
                <button onClick={enviar} disabled={enviando} title="Enviar" aria-label="Enviar"
                  style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: "var(--acento)", color: "#fff", cursor: "pointer", flexShrink: 0, opacity: enviando ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
