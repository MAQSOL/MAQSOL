import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import logo from "../assets/logo.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@600;700&display=swap');

  .mq-login-bg {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #0a0a0a;
    background-image:
      linear-gradient(rgba(143,29,44,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(143,29,44,0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    font-family: 'Share Tech Mono', 'Courier New', monospace;
    position: relative;
    overflow: hidden;
  }

  .mq-login-bg::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.18) 2px,
      rgba(0,0,0,0.18) 4px
    );
    pointer-events: none;
    z-index: 0;
  }

  /* wrapper */
  .mq-wrapper {
    --acc: #8F1D2C;
    --acc2: #c0392b;
    --bg: #111;
    --bg2: #1a1a1a;
    --border: #8F1D2C;
    --shadow: #5a0f1a;
    --text: #e8e8e8;
    --sub: #888;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .mq-logo-wrap {
    margin-bottom: 20px;
    text-align: center;
  }
  .mq-logo-wrap img {
    width: 100px;
    filter: brightness(0) invert(1);
    opacity: 0.9;
  }
  .mq-logo-wrap .mq-sys-label {
    display: block;
    font-family: 'Rajdhani', sans-serif;
    font-size: 11px;
    letter-spacing: 6px;
    color: var(--acc);
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* switch */
  .mq-switch {
    transform: translateY(0);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 30px;
    width: 50px;
    height: 20px;
    margin-bottom: 28px;
  }

  .mq-card-side::before {
    position: absolute;
    content: 'ACCEDER';
    left: -80px;
    top: 0;
    width: 110px;
    text-decoration: underline;
    color: var(--acc);
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 2px;
  }
  .mq-card-side::after {
    position: absolute;
    content: 'RECUPERAR';
    left: 60px;
    top: 0;
    width: 120px;
    text-decoration: none;
    color: var(--sub);
    font-size: 12px;
    letter-spacing: 2px;
  }

  .mq-toggle { opacity: 0; width: 0; height: 0; }

  .mq-slider {
    box-sizing: border-box;
    border-radius: 4px;
    border: 2px solid var(--acc);
    box-shadow: 3px 3px var(--shadow);
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--bg2);
    transition: 0.3s;
  }
  .mq-slider:before {
    box-sizing: border-box;
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    border: 2px solid var(--acc);
    border-radius: 4px;
    left: -2px;
    bottom: 2px;
    background-color: var(--acc);
    box-shadow: 0 3px 0 var(--shadow);
    transition: 0.3s;
  }
  .mq-toggle:checked + .mq-slider { background-color: var(--bg2); }
  .mq-toggle:checked + .mq-slider:before { transform: translateX(30px); }
  .mq-toggle:checked ~ .mq-card-side::before { text-decoration: none; color: var(--sub); }
  .mq-toggle:checked ~ .mq-card-side::after { text-decoration: underline; color: var(--acc); }

  /* flip card */
  .mq-flip-inner {
    width: 320px;
    height: 360px;
    position: relative;
    background-color: transparent;
    perspective: 1000px;
    text-align: center;
    transition: transform 0.8s cubic-bezier(0.4,0.2,0.2,1);
    transform-style: preserve-3d;
  }
  .mq-toggle:checked ~ .mq-flip-inner { transform: rotateY(180deg); }
  .mq-toggle:checked ~ .mq-flip-front { box-shadow: none; }

  .mq-flip-front, .mq-flip-back {
    padding: 28px 24px;
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    background: var(--bg2);
    gap: 0;
    border-radius: 4px;
    border: 2px solid var(--border);
    box-shadow: 6px 6px 0 var(--shadow);
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
    border: 2px solid #333;
    background-color: #0d0d0d;
    box-shadow: 3px 3px 0 #000;
    font-family: 'Share Tech Mono', monospace;
    font-size: 14px;
    color: var(--text);
    padding: 5px 12px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .mq-input::placeholder { color: #555; }
  .mq-input:focus {
    border-color: var(--acc);
    box-shadow: 3px 3px 0 var(--shadow);
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
    color: #555;
    display: flex;
    align-items: center;
  }
  .mq-eye:hover { color: var(--acc); }

  .mq-btn {
    width: 100%;
    height: 42px;
    border-radius: 4px;
    border: 2px solid var(--acc);
    background-color: var(--acc);
    box-shadow: 4px 4px 0 var(--shadow);
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
    box-shadow: 0 0 0 var(--shadow);
    transform: translate(4px, 4px);
  }
  .mq-btn:hover { background-color: var(--acc2); }

  .mq-btn-ghost {
    background: transparent;
    border: 2px solid #333;
    box-shadow: 3px 3px 0 #000;
    color: var(--sub);
    width: 100%;
    height: 38px;
    border-radius: 4px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
    transition: border-color 0.2s, color 0.2s;
  }
  .mq-btn-ghost:hover { border-color: var(--acc); color: var(--acc); }

  .mq-error { color: #e53935; font-size: 12px; margin-top: -4px; letter-spacing: 1px; }
  .mq-ok    { color: #43a047; font-size: 12px; margin-top: -4px; letter-spacing: 1px; }

  .mq-corner {
    position: fixed;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: rgba(143,29,44,0.3);
    letter-spacing: 2px;
    pointer-events: none;
  }
  .mq-corner.tl { top: 16px; left: 20px; }
  .mq-corner.br { bottom: 16px; right: 20px; }

  .mq-spinner {
    width: 40px; height: 40px;
    border: 3px solid #333;
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

      <span className="mq-corner tl">MAQSISTEM // v2.0</span>
      <span className="mq-corner br">SISTEMA INTEGRAL // ACCESO RESTRINGIDO</span>

      <div className="mq-wrapper">
        <div className="mq-logo-wrap">
          <img src={logo} alt="MAQSISTEM" />
          <span className="mq-sys-label">Sistema Integral</span>
        </div>

        <div className="card-switch" style={{ position: "relative" }}>
          <label className="mq-switch">
            <input type="checkbox" className="mq-toggle" />
            <span className="mq-slider"></span>
            <span className="mq-card-side"></span>

            <div className="mq-flip-inner">
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
          </label>
        </div>
      </div>
    </div>
  );
}

export default Login;
