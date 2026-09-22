import React, { useState } from "react";
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
  const [mostrarOlvide, setMostrarOlvide] = useState(false);
  const navigate = useNavigate();

  const iniciarSesion = async (e) => {

    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password,
    });

    if (error) {
      setCargando(false);
      setError("Correo o contraseña incorrectos");
      return;
    }

    navigate("/");
  };

  const enviarRecuperacion = async () => {
    setError("");
    setMensaje("");

    if (!correo) {
      setError("Escribe tu correo arriba primero");
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(correo);
    setCargando(false);

    if (error) {
      setError("No se pudo enviar el correo de recuperación");
      return;
    }

    setMensaje("Te enviamos un correo con instrucciones para recuperar tu contraseña");
    setMostrarOlvide(false);
  };

  const cardStyle = {
    background: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "380px",
    minHeight: "360px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5"
      }}
    >
      <style>{`
        @keyframes girar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner-grande {
          width: 56px;
          height: 56px;
          border: 5px solid #eee;
          border-top-color: var(--acento);
          border-radius: 50%;
          animation: girar 0.8s linear infinite;
        }
      `}</style>

      {cargando ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div className="spinner-grande"></div>
            <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Entrando...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={iniciarSesion} style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <img src={logo} alt="MAQSISTEM" style={{ width: "120px" }} />
          </div>

          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
            Iniciar sesión
          </h2>

          <input
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

          <div style={{ position: "relative", marginBottom: "6px" }}>
            <input
              type={mostrarPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                paddingRight: "44px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div style={{ textAlign: "right", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={() => setMostrarOlvide(!mostrarOlvide)}
              style={{
                background: "none",
                border: "none",
                color: "var(--acento)",
                fontSize: "13px",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline"
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {mostrarOlvide && (
            <div style={{ marginBottom: "12px", background: "#f9f9f9", padding: "12px", borderRadius: "8px" }}>
              <p style={{ fontSize: "13px", marginTop: 0, marginBottom: "8px", color: "#555" }}>
                Escribe tu correo arriba y presiona el botón:
              </p>
              <button
                type="button"
                onClick={enviarRecuperacion}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid var(--acento)",
                  background: "white",
                  color: "var(--acento)",
                  fontWeight: "bold",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Enviar correo de recuperación
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: "#b00020", fontSize: "14px", marginBottom: "12px" }}>
              {error}
            </p>
          )}

          {mensaje && (
            <p style={{ color: "#2e7d32", fontSize: "14px", marginBottom: "12px" }}>
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "var(--acento)",
              color: "white",
              fontWeight: "bold",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            Entrar
          </button>
        </form>
      )}
    </div>
  );
}

export default Login;