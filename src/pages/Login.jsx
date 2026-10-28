import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import logo from "../assets/logo.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');

  .mq-login-bg {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f4f4f4;
    font-family: 'Montserrat', sans-serif;
    position: relative;
  }

  /* wrapper */
  .mq-wrapper {
    --acc: #8F1D2C;
    --acc2: #c0392b;
    --shadow: #111;
    --sub: #888;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .mq-logo-wrap {
    margin-bottom: 24px;
    text-align: center;
  }
  .mq-logo-wrap img {
    width: 120px;
  }
  .mq-logo-wrap .mq-sys-label {
    display: block;
    font-family: 'Rajdhani', sans-serif;
    font-size: 11px;
    letter-spacing: 6px;
    color: var(--acc);
    text-transform: uppercase;
    margin-top: 6px;
    font-weight: 700;
  }

  /* ---- toggle tabs + card ---- */
  .mq-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 22px;
    border: 2px solid #111;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 3px 3px 0 #111;
  }
  .mq-tab {
    flex: 1;
    padding: 7px 18px;
    border: none;
    background: #f4f4f4;
    color: #888;
    font-family: 'Rajdhani', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
    transition: background .2s, color .2s;
  }
  .mq-tab + .mq-tab { border-left: 2px solid #111; }
  .mq-tab.active {
    background: var(--acc);
    color: #fff;
  }

  /* flip card */
  .mq-flip-outer {
    perspective: 1000px;
    width: 340px;
    height: 340px;
  }
  .mq-flip-inner {
    width: 100%;
    height: 100%;
    position: relative;
    text-align: center;
    transition: transform 0.75s cubic-bezier(0.4,0.2,0.2,1);
    transform-style: preserve-3d;
  }
  .mq-flip-inner.flipped { transform: rotateY(180deg); }

  .mq-flip-front, .mq-flip-back {
    padding: 32px 28px;
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    background: #fff;
    border-radius: 4px;
    border: 3px solid #111;
    box-shadow: 8px 8px 0 #111;
  }
  .mq-flip-back { transform: rotateY(180deg); }

  .mq-card-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
    text-align: center;
    color: var(--acc);
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .mq-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .mq-input {
    width: 100%;
    box-sizing: border-box;
    height: 42px;
    border-radius: 4px;
    border: 2px solid #222;
    background-color: #fff;
    box-shadow: 2px 2px 0 #111;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
    color: #111;
    padding: 5px 12px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .mq-input::placeholder { color: #aaa; }
  .mq-input:focus {
    border-color: var(--acc);
    box-shadow: 3px 3px 0 var(--acc);
  }

  .mq-input-wrap { position: relative; width: 100%; }
  .mq-eye {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: #aaa;
    display: flex;
    align-items: center;
  }
  .mq-eye:hover { color: var(--acc); }

  .mq-btn {
    width: 100%;
    height: 42px;
    border-radius: 4px;
    border: 2px solid #111;
    background-color: var(--acc);
    box-shadow: 4px 4px 0 #111;
    font-family: 'Rajdhani', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #fff;
    cursor: pointer;
    text-transform: uppercase;
    transition: box-shadow 0.1s, transform 0.1s;
    margin-top: 6px;
  }
  .mq-btn:active {
    box-shadow: 0 0 0 #111;
    transform: translate(4px, 4px);
  }
  .mq-btn:hover { background-color: var(--acc2); }

  .mq-error { color: #e53935; font-size: 12px; margin-top: -4px; }
  .mq-ok    { color: #1f8b4c; font-size: 12px; margin-top: -4px; }

  .mq-spinner {
    width: 36px; height: 36px;
    border: 3px solid #eee;
    border-top-color: var(--acc);
    border-radius: 50%;
    animation: mq-spin 0.7s linear infinite;
    margin: 0 auto 12px;
  }
  @keyframes mq-spin { to { transform: rotate(360deg); } }
`;

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
    if (error) { setError("// ACCESO DENEGADO — credenciales incorrectas"); return; }
    navigate("/");
  };

  const enviarRecuperacion = async (e) => {
    e.preventDefault();
    setError(""); setMensaje("");
    if (!correo) { setError("// Escribe tu correo en el campo de arriba"); return; }
    setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(correo);
    setCargando(false);
    if (error) { setError("// No se pudo enviar el correo"); return; }
    setMensaje("// Correo enviado — revisa tu bandeja");
  };

  return (
    <div className="mq-login-bg">
      <style>{CSS}</style>

      <div className="mq-wrapper">
        <div className="mq-logo-wrap">
          <img src={logo} alt="MAQSISTEM" />
          <span className="mq-sys-label">Sistema Integral</span>
        </div>

        <div>
          <div className="mq-tabs">
            <button type="button" className={`mq-tab${modo === "acceder" ? " active" : ""}`} onClick={() => { setModo("acceder"); setError(""); setMensaje(""); }}>Acceder</button>
            <button type="button" className={`mq-tab${modo === "recuperar" ? " active" : ""}`} onClick={() => { setModo("recuperar"); setError(""); setMensaje(""); }}>Recuperar</button>
          </div>

          <div className="mq-flip-outer">
            <div className={`mq-flip-inner${modo === "recuperar" ? " flipped" : ""}`}>
              {/* FRENTE — Login */}
              <div className="mq-flip-front">
                <div className="mq-card-title">Acceder</div>
                <form className="mq-form" onSubmit={iniciarSesion}>
                  <input
                    className="mq-input"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                  <div className="mq-input-wrap">
                    <input
                      className="mq-input"
                      type={mostrarPassword ? "text" : "password"}
                      placeholder="contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: 38 }}
                    />
                    <button type="button" className="mq-eye" onClick={() => setMostrarPassword(!mostrarPassword)}>
                      {mostrarPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {error && <p className="mq-error">{error}</p>}
                  {mensaje && <p className="mq-ok">{mensaje}</p>}
                  {cargando ? (
                    <div style={{ padding: "8px 0" }}><div className="mq-spinner" /></div>
                  ) : (
                    <button type="submit" className="mq-btn">Iniciar sesión</button>
                  )}
                </form>
              </div>

              {/* REVERSO — Recuperar */}
              <div className="mq-flip-back">
                <div className="mq-card-title">Recuperar</div>
                <form className="mq-form" onSubmit={enviarRecuperacion}>
                  <p style={{ color: "#666", fontSize: 12, margin: "0 0 8px", letterSpacing: 1 }}>
                    Escribe tu correo y te enviamos un enlace para restablecer tu contraseña.
                  </p>
                  <input
                    className="mq-input"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                  {error && <p className="mq-error">{error}</p>}
                  {mensaje && <p className="mq-ok">{mensaje}</p>}
                  {cargando ? (
                    <div style={{ padding: "8px 0" }}><div className="mq-spinner" /></div>
                  ) : (
                    <button type="submit" className="mq-btn">Enviar enlace</button>
                  )}
                </form>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
