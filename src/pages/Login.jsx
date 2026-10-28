import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import logo from "../assets/logo.png";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modo, setModo] = useState("acceder"); // "acceder" | "recuperar"
  const navigate = useNavigate();

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError(""); setMensaje("");
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password });
    setCargando(false);
    if (error) { setError("Correo o contraseña incorrectos"); return; }
    navigate("/");
  };

  const enviarRecuperacion = async (e) => {
    e.preventDefault();
    setError(""); setMensaje("");
    if (!correo) { setError("Escribe tu correo primero"); return; }
    setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(correo);
    setCargando(false);
    if (error) { setError("No se pudo enviar el correo"); return; }
    setMensaje("Correo enviado — revisa tu bandeja");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f4f4f4",
      fontFamily: "'Montserrat', sans-serif"
    }}>
      <div style={{
        background: "#fff",
        border: "3px solid #111",
        borderRadius: 4,
        boxShadow: "8px 8px 0 #111",
        padding: "40px 36px",
        width: "100%",
        maxWidth: 360
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={logo} alt="MAQSISTEM" style={{ width: 110, display: "block", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 5, color: "#8F1D2C", textTransform: "uppercase", margin: 0 }}>
            Sistema Integral
          </p>
        </div>

        {/* Título */}
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 22px", textAlign: "center", letterSpacing: 1 }}>
          {modo === "acceder" ? "Iniciar sesión" : "Recuperar contraseña"}
        </h2>

        {modo === "acceder" ? (
          <form onSubmit={iniciarSesion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#444", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
                CORREO
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@empresa.com"
                required
                style={{
                  width: "100%", padding: "11px 12px", border: "2px solid #222",
                  borderRadius: 4, fontSize: 14, boxSizing: "border-box",
                  fontFamily: "inherit", outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#444", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
                CONTRASEÑA
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%", padding: "11px 40px 11px 12px", border: "2px solid #222",
                    borderRadius: 4, fontSize: 14, boxSizing: "border-box",
                    fontFamily: "inherit", outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#888", padding: 0,
                    display: "flex", alignItems: "center"
                  }}
                >
                  {mostrarPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p style={{ color: "#c62828", fontSize: 13, margin: 0 }}>{error}</p>}
            {mensaje && <p style={{ color: "#1f8b4c", fontSize: 13, margin: 0 }}>{mensaje}</p>}

            <button
              type="submit"
              disabled={cargando}
              style={{
                background: "#8F1D2C", color: "#fff", border: "2px solid #111",
                borderRadius: 4, padding: "12px", fontWeight: 700, fontSize: 15,
                cursor: cargando ? "default" : "pointer", letterSpacing: 1,
                boxShadow: "4px 4px 0 #111", fontFamily: "inherit",
                marginTop: 4, opacity: cargando ? 0.7 : 1,
                transition: "box-shadow .1s, transform .1s"
              }}
            >
              {cargando ? "Verificando…" : "Iniciar sesión"}
            </button>

            <button
              type="button"
              onClick={() => { setModo("recuperar"); setError(""); setMensaje(""); }}
              style={{
                background: "none", border: "none", color: "#888", fontSize: 12,
                cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", padding: 0
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={enviarRecuperacion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
              Escribe tu correo y te enviamos un enlace para restablecer tu contraseña.
            </p>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#444", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
                CORREO
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@empresa.com"
                required
                style={{
                  width: "100%", padding: "11px 12px", border: "2px solid #222",
                  borderRadius: 4, fontSize: 14, boxSizing: "border-box",
                  fontFamily: "inherit", outline: "none"
                }}
              />
            </div>

            {error && <p style={{ color: "#c62828", fontSize: 13, margin: 0 }}>{error}</p>}
            {mensaje && <p style={{ color: "#1f8b4c", fontSize: 13, margin: 0 }}>{mensaje}</p>}

            <button
              type="submit"
              disabled={cargando}
              style={{
                background: "#8F1D2C", color: "#fff", border: "2px solid #111",
                borderRadius: 4, padding: "12px", fontWeight: 700, fontSize: 15,
                cursor: cargando ? "default" : "pointer", letterSpacing: 1,
                boxShadow: "4px 4px 0 #111", fontFamily: "inherit",
                marginTop: 4, opacity: cargando ? 0.7 : 1
              }}
            >
              {cargando ? "Enviando…" : "Enviar enlace"}
            </button>

            <button
              type="button"
              onClick={() => { setModo("acceder"); setError(""); setMensaje(""); }}
              style={{
                background: "none", border: "none", color: "#888", fontSize: 12,
                cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", padding: 0
              }}
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
