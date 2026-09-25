import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";
import { descargarFichaEquipoPDF } from "../utils/fichaEquipo";

const fFecha = (f) => {
  if (!f) return "";
  const d = new Date(f + "T00:00:00");
  return isNaN(d) ? "" : d.toLocaleDateString("es-MX");
};
const hoyISO = () => new Date().toISOString().slice(0, 10);

const pagina = { minHeight: "100vh", background: "#f4f6f9", padding: "18px 14px 40px", boxSizing: "border-box", fontFamily: "inherit" };
const tarjeta = { background: "#fff", borderRadius: 14, padding: 20, maxWidth: 640, margin: "0 auto 16px", boxShadow: "0 2px 10px rgba(0,0,0,.07)", boxSizing: "border-box" };
const etiqueta = { fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 0.4, marginBottom: 4, display: "block" };
const campo = { width: "100%", boxSizing: "border-box", padding: "14px 12px", border: "1px solid #d8d8d8", borderRadius: 10, fontSize: 16, background: "#fff" };
const botonGrande = { width: "100%", padding: "18px 16px", border: "none", borderRadius: 12, fontSize: 18, fontWeight: 800, cursor: "pointer" };

function Encabezado() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <img src={logo} alt="MAQSOL" style={{ height: 46 }} />
      <div>
        <div style={{ fontWeight: 800, letterSpacing: 2, fontSize: 15 }}>MAQSOL</div>
        <div style={{ fontSize: 12, color: "#777" }}>Maquinaria Soporte y Logística</div>
      </div>
    </div>
  );
}

function Historial({ lista, max }) {
  const ordenada = (lista || []).slice().sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const visibles = max ? ordenada.slice(0, max) : ordenada;
  if (!visibles.length) return <p style={{ color: "#999", margin: 0 }}>Aún no hay mantenimientos registrados.</p>;
  return visibles.map((m, i) => (
    <div key={m.mid || i} style={{ borderTop: i ? "1px solid #eee" : "none", padding: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong>{fFecha(m.fecha) || "Sin fecha"}</strong>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "2px 10px",
            borderRadius: 12,
            background: m.tipoMantto === "Preventivo" ? "#e8f5e9" : "#fce4ec",
            color: m.tipoMantto === "Preventivo" ? "#2e7d32" : "#c62828"
          }}
        >
          {m.tipoMantto}
        </span>
      </div>
      <div style={{ fontSize: 14.5, margin: "4px 0", whiteSpace: "pre-wrap" }}>{m.descripcion || "Sin descripción"}</div>
      <div style={{ fontSize: 12.5, color: "#888" }}>
        {m.horometro ? `${m.horometro} h` : ""}
        {m.horometro && m.realizadoPor ? " · " : ""}
        {m.realizadoPor ? `Realizó: ${m.realizadoPor}` : ""}
      </div>
    </div>
  ));
}

function DatosEquipo({ eq }) {
  const filas = [
    ["Año", eq.anio], ["Motor", eq.motor], ["Capacidad", eq.capacidad], ["Combustible", eq.combustible],
    ["Horómetro actual", eq.horometro], ["Próximo mantenimiento", fFecha(eq.proximoMantto)]
  ].filter(([, v]) => v);
  return (
    <>
      {eq.fotoUrl && <img src={eq.fotoUrl} alt={eq.tipo} style={{ width: "100%", maxHeight: 240, objectFit: "contain", background: "#fafafa", borderRadius: 10, marginBottom: 14 }} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
        {filas.map(([k, v]) => (
          <div key={k}>
            <span style={etiqueta}>{k.toUpperCase()}</span>
            <div style={{ fontSize: 16 }}>{v}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function LoginMecanico() {
  const [correo, setCorreo] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: pass });
    setCargando(false);
    if (error) setError("Correo o contraseña incorrectos");
  }

  return (
    <form onSubmit={entrar} style={tarjeta}>
      <h3 style={{ margin: "0 0 4px" }}>Inicia sesión</h3>
      <p style={{ color: "#777", fontSize: 14, margin: "0 0 16px" }}>Usa tu cuenta del portal para registrar el trabajo hecho.</p>
      <label style={etiqueta}>CORREO</label>
      <input style={{ ...campo, marginBottom: 12 }} type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
      <label style={etiqueta}>CONTRASEÑA</label>
      <input style={{ ...campo, marginBottom: 14 }} type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required />
      {error && <p style={{ color: "#c62828", margin: "0 0 12px", fontSize: 14 }}>{error}</p>}
      <button type="submit" disabled={cargando} style={{ ...botonGrande, background: "var(--acento)", color: "#fff", opacity: cargando ? 0.6 : 1 }}>
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

function PanelMecanico({ token }) {
  const { session, profile, cargando } = useAuth();
  const [fila, setFila] = useState(null);
  const [estado, setEstado] = useState("cargando"); // cargando | listo | noexiste
  const [form, setForm] = useState({ tipoMantto: "Preventivo", fecha: hoyISO(), horometro: "", descripcion: "", refacciones: "", proximoMantto: "", realizadoPor: "" });
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    const { data } = await supabase.from("equipos_internos").select("*").eq("data->>qrToken", token).maybeSingle();
    setFila(data || null);
    setEstado(data ? "listo" : "noexiste");
  }, [token]);

  useEffect(() => {
    if (!session) return;
    let vivo = true;
    supabase
      .from("equipos_internos")
      .select("*")
      .eq("data->>qrToken", token)
      .maybeSingle()
      .then(({ data }) => {
        if (!vivo) return;
        setFila(data || null);
        setEstado(data ? "listo" : "noexiste");
      });
    return () => {
      vivo = false;
    };
  }, [session, token]);

  const nombre = profile?.apodo || profile?.nombre_completo || session?.user?.email || "";
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function guardar(e) {
    e.preventDefault();
    if (!form.descripcion.trim()) return alert("Escribe qué trabajo se hizo.");
    setGuardando(true);
    setAviso("");
    try {
      const { data: actual, error: e1 } = await supabase.from("equipos_internos").select("*").eq("data->>qrToken", token).maybeSingle();
      if (e1 || !actual) throw new Error("No se encontró el equipo.");
      const datos = actual.data || {};
      const entrada = {
        mid: "M-" + Date.now(),
        tipoMantto: form.tipoMantto,
        fecha: form.fecha,
        horometro: form.horometro,
        proximoMantto: form.proximoMantto,
        descripcion: form.descripcion.trim(),
        filtrosUsados: [],
        aceiteDetalle: "",
        grasaDetalle: "",
        realizadoPor: (form.realizadoPor || nombre).trim(),
        autorizadoPor: "",
        lugarRealizado: datos.ubicacion || "",
        pdfUrl: "",
        costo: "",
        extras: form.refacciones.trim() ? [{ nombre: "Refacciones / materiales", valor: form.refacciones.trim() }] : [],
        registradoPorQR: true
      };
      const nuevos = { ...datos, mantenimientos: [...(datos.mantenimientos || []), entrada] };
      if (form.horometro) nuevos.horometro = /hrs/i.test(datos.horometro || "") ? `${form.horometro} hrs` : form.horometro;
      if (form.proximoMantto) nuevos.proximoMantto = form.proximoMantto;
      const { error: e2 } = await supabase.from("equipos_internos").upsert({ id: actual.id, data: nuevos, updated_at: new Date().toISOString() });
      if (e2) throw e2;
      setForm({ tipoMantto: "Preventivo", fecha: hoyISO(), horometro: "", descripcion: "", refacciones: "", proximoMantto: "", realizadoPor: "" });
      setAviso("✓ Registro guardado en el historial del equipo.");
      await cargar();
    } catch (err) {
      alert("No se pudo guardar: " + (err.message || err));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <div style={tarjeta}>Cargando…</div>;
  if (!session) return <LoginMecanico />;
  if (estado === "cargando") return <div style={tarjeta}>Cargando equipo…</div>;
  if (estado === "noexiste") return <div style={tarjeta}>No se encontró el equipo o no tienes permiso para verlo.</div>;

  const eq = fila.data || {};

  return (
    <>
      <div style={{ ...tarjeta, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 20px" }}>
        <span style={{ fontSize: 14 }}>Sesión: <strong>{nombre}</strong></span>
        <button onClick={() => supabase.auth.signOut()} style={{ border: "none", background: "#eee", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700 }}>
          Cerrar sesión
        </button>
      </div>

      <form onSubmit={guardar} style={tarjeta}>
        <h3 style={{ margin: "0 0 14px" }}>Registrar trabajo realizado</h3>

        <label style={etiqueta}>TIPO DE MANTENIMIENTO</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Preventivo", "Correctivo"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("tipoMantto", t)}
              style={{
                flex: 1,
                padding: "13px 8px",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                border: form.tipoMantto === t ? "2px solid var(--acento)" : "1px solid #d8d8d8",
                background: form.tipoMantto === t ? "var(--acento)" : "#fff",
                color: form.tipoMantto === t ? "#fff" : "#333"
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={etiqueta}>FECHA</label>
            <input style={campo} type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
          </div>
          <div>
            <label style={etiqueta}>HORÓMETRO ACTUAL</label>
            <input style={campo} inputMode="decimal" value={form.horometro} onChange={(e) => set("horometro", e.target.value)} placeholder={eq.horometro || ""} />
          </div>
        </div>

        <label style={etiqueta}>¿QUÉ SE HIZO?</label>
        <textarea style={{ ...campo, minHeight: 110, marginBottom: 14, resize: "vertical" }} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Ej. Cambio de aceite y filtros, revisión de mangueras…" required />

        <label style={etiqueta}>REFACCIONES O MATERIALES USADOS (opcional)</label>
        <input style={{ ...campo, marginBottom: 14 }} value={form.refacciones} onChange={(e) => set("refacciones", e.target.value)} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={etiqueta}>PRÓXIMO MANTTO (opcional)</label>
            <input style={campo} type="date" value={form.proximoMantto} onChange={(e) => set("proximoMantto", e.target.value)} />
          </div>
          <div>
            <label style={etiqueta}>REALIZÓ</label>
            <input style={campo} value={form.realizadoPor || nombre} onChange={(e) => set("realizadoPor", e.target.value)} />
          </div>
        </div>

        {aviso && <p style={{ color: "#1f8b4c", fontWeight: 700, margin: "0 0 12px" }}>{aviso}</p>}
        <button type="submit" disabled={guardando} style={{ ...botonGrande, background: "#1f8b4c", color: "#fff", opacity: guardando ? 0.6 : 1 }}>
          {guardando ? "Guardando…" : "Guardar registro"}
        </button>
      </form>

      <div style={tarjeta}>
        <h3 style={{ margin: "0 0 10px" }}>Últimos mantenimientos</h3>
        <Historial lista={eq.mantenimientos} max={6} />
      </div>
    </>
  );
}

export default function EquipoQR() {
  const { token } = useParams();
  const [publico, setPublico] = useState(undefined); // undefined = cargando, null = no existe
  const [fase, setFase] = useState("elegir"); // elegir | cliente | mecanico

  useEffect(() => {
    let vivo = true;
    supabase.rpc("equipo_publico", { p_token: token }).then(({ data, error }) => {
      if (vivo) setPublico(error ? null : data || null);
    });
    return () => {
      vivo = false;
    };
  }, [token]);

  if (publico === undefined) {
    return <div style={pagina}><Encabezado /><div style={tarjeta}>Cargando equipo…</div></div>;
  }

  if (publico === null) {
    return (
      <div style={pagina}>
        <Encabezado />
        <div style={tarjeta}>
          <h3 style={{ marginTop: 0 }}>Código no válido</h3>
          <p style={{ color: "#666", marginBottom: 0 }}>Este código QR no existe o fue reemplazado por uno nuevo. Pide una etiqueta actualizada a MAQSOL.</p>
        </div>
      </div>
    );
  }

  const titulo = `${publico.tipo || "Equipo"}`;
  const subtitulo = `${publico.marca || ""} ${publico.modelo || ""}`.trim() + (publico.serie ? ` · Serie ${publico.serie}` : "");

  return (
    <div style={pagina}>
      <Encabezado />

      <div style={tarjeta}>
        <h2 style={{ margin: "0 0 2px" }}>{titulo}</h2>
        <div style={{ color: "#777" }}>{subtitulo}</div>
      </div>

      {fase === "elegir" && (
        <div style={tarjeta}>
          <h3 style={{ margin: "0 0 14px", textAlign: "center" }}>¿Eres mecánico o cliente?</h3>
          <button style={{ ...botonGrande, background: "var(--acento)", color: "#fff", marginBottom: 12 }} onClick={() => setFase("cliente")}>
            Soy cliente
          </button>
          <button style={{ ...botonGrande, background: "#eef2f6", color: "#222" }} onClick={() => setFase("mecanico")}>
            Soy mecánico
          </button>
        </div>
      )}

      {fase === "cliente" && (
        <>
          <div style={tarjeta}>
            <DatosEquipo eq={publico} />
            <button style={{ ...botonGrande, background: "var(--acento)", color: "#fff", marginTop: 18, fontSize: 16 }} onClick={() => descargarFichaEquipoPDF(publico, new URL(logo, window.location.href).href)}>
              Descargar ficha en PDF
            </button>
          </div>
          <div style={tarjeta}>
            <h3 style={{ margin: "0 0 10px" }}>Historial de mantenimientos</h3>
            <Historial lista={publico.mantenimientos} />
          </div>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <button style={{ border: "none", background: "transparent", color: "#666", cursor: "pointer", fontSize: 15 }} onClick={() => setFase("elegir")}>← Volver</button>
          </div>
        </>
      )}

      {fase === "mecanico" && (
        <>
          <PanelMecanico token={token} />
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <button style={{ border: "none", background: "transparent", color: "#666", cursor: "pointer", fontSize: 15 }} onClick={() => setFase("elegir")}>← Volver</button>
          </div>
        </>
      )}
    </div>
  );
}
