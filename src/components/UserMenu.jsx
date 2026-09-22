import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth, PALETA_COLORES } from "../contexts/AuthContext";

function nombreDeUsuario(profile, user) {
  if (profile?.apodo) return profile.apodo;
  if (profile?.nombre_completo) return profile.nombre_completo;
  const local = (user?.email || "").split("@")[0] || "";
  if (!local) return "";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function comprimirImagen(file, maxAncho = 240) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width,
          h = img.height;
        if (w > maxAncho) {
          h = Math.round(h * (maxAncho / w));
          w = maxAncho;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const estiloDropdown = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 8px)",
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
  padding: "14px",
  width: "280px",
  zIndex: 50
};

const estiloItem = {
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  borderRadius: "8px",
  padding: "10px 8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  color: "#333"
};

export default function UserMenu() {
  const { user, profile, isAdmin, actualizarPerfil } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState(null); // null | 'foto' | 'apodo' | 'config'
  const [apodo, setApodo] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [msgPass, setMsgPass] = useState("");
  const [telefono, setTelefono] = useState(profile?.telefono || "");
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileRef = useRef(null);

  if (!user) return null;

  const nombreMostrado = nombreDeUsuario(profile, user);

  function toggleMenu() {
    setAbierto((v) => !v);
    setVista(null);
    setMsgPass("");
    setTelefono(profile?.telefono || "");
  }

  async function guardarTelefono() {
    setGuardandoTelefono(true);
    await actualizarPerfil({ telefono: telefono.trim() });
    setGuardandoTelefono(false);
  }

  async function onArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoFoto(true);
    const base64 = await comprimirImagen(file);
    await actualizarPerfil({ foto_url: base64 });
    setSubiendoFoto(false);
  }

  function abrirApodo() {
    setApodo(profile?.apodo || "");
    setVista("apodo");
  }

  async function guardarApodo() {
    if (!apodo.trim()) return;
    const ok = await actualizarPerfil({ apodo: apodo.trim() });
    if (ok) setVista(null);
  }

  async function cambiarPassword() {
    setMsgPass("");
    if (pass1.length < 6) {
      setMsgPass("Mínimo 6 caracteres.");
      return;
    }
    if (pass1 !== pass2) {
      setMsgPass("Las contraseñas no coinciden.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pass1 });
    if (error) {
      setMsgPass(error.message);
      return;
    }
    setMsgPass("Contraseña actualizada ✓");
    setPass1("");
    setPass2("");
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={toggleMenu}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "40px",
          padding: "6px 16px 6px 6px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)"
        }}
      >
        {profile?.foto_url ? (
          <img
            src={profile.foto_url}
            alt=""
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              objectFit: "cover"
            }}
          />
        ) : (
          <span
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "var(--acento)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "15px"
            }}
          >
            {(nombreMostrado || "?").charAt(0).toUpperCase()}
          </span>
        )}
        <span style={{ textAlign: "left" }}>
          <strong style={{ display: "block", fontSize: "14px" }}>
            ¡Hola, {nombreMostrado}!
          </strong>
          <small style={{ color: "#999" }}>{isAdmin ? "Administrador" : "Usuario"}</small>
        </span>
      </button>

      {abierto && vista === null && (
        <div style={estiloDropdown}>
          <div
            style={{
              fontSize: "12.5px",
              color: "#999",
              marginBottom: "8px",
              wordBreak: "break-all"
            }}
          >
            {user.email}
          </div>
          <button style={estiloItem} onClick={() => setVista("foto")}>
            🖼 Foto de perfil
          </button>
          <button style={estiloItem} onClick={abrirApodo}>
            ✎ Editar apodo
          </button>
          <button style={estiloItem} onClick={() => setVista("config")}>
            ⚙ Configuración
          </button>
          <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #eee" }} />
          <button
            style={{ ...estiloItem, color: "#b00020" }}
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {abierto && vista === "foto" && (
        <div style={estiloDropdown}>
          <button style={{ ...estiloItem, fontWeight: 400, color: "#999", padding: "0 0 10px" }} onClick={() => setVista(null)}>
            ← Volver
          </button>
          <h4 style={{ margin: "0 0 10px" }}>Foto de perfil</h4>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            {profile?.foto_url ? (
              <img
                src={profile.foto_url}
                alt=""
                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "var(--acento)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "30px"
                }}
              >
                {(nombreMostrado || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onArchivo}
          />
          <button
            style={{
              width: "100%",
              background: "var(--acento)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px",
              fontWeight: "700",
              cursor: "pointer"
            }}
            disabled={subiendoFoto}
            onClick={() => fileRef.current?.click()}
          >
            {subiendoFoto ? "Subiendo…" : "Subir foto"}
          </button>
          {profile?.foto_url && (
            <button
              style={{ ...estiloItem, color: "#b00020", textAlign: "center", marginTop: "6px" }}
              onClick={() => actualizarPerfil({ foto_url: null })}
            >
              Quitar foto
            </button>
          )}
        </div>
      )}

      {abierto && vista === "apodo" && (
        <div style={estiloDropdown}>
          <button style={{ ...estiloItem, fontWeight: 400, color: "#999", padding: "0 0 10px" }} onClick={() => setVista(null)}>
            ← Volver
          </button>
          <h4 style={{ margin: "0 0 10px" }}>Editar apodo</h4>
          <input
            autoFocus
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            placeholder="¿Cómo quieres que te saluden?"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              marginBottom: "10px"
            }}
          />
          <button
            style={{
              width: "100%",
              background: "var(--acento)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px",
              fontWeight: "700",
              cursor: "pointer"
            }}
            onClick={guardarApodo}
          >
            Guardar
          </button>
        </div>
      )}

      {abierto && vista === "config" && (
        <div style={estiloDropdown}>
          <button style={{ ...estiloItem, fontWeight: 400, color: "#999", padding: "0 0 10px" }} onClick={() => setVista(null)}>
            ← Volver
          </button>
          <h4 style={{ margin: "0 0 4px" }}>Configuración</h4>

          <div style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>CORREO</div>
          <div style={{ fontSize: "13.5px", marginBottom: "12px", wordBreak: "break-all" }}>
            {user.email}
          </div>

          <div style={{ fontSize: "12px", color: "#999" }}>TELÉFONO (aparece en tus cotizaciones)</div>
          <div style={{ display: "flex", gap: "6px", margin: "6px 0 14px" }}>
            <input
              type="tel"
              placeholder="+52 998 000 0000"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: "8px",
                border: "1px solid #ddd"
              }}
            />
            <button
              onClick={guardarTelefono}
              disabled={guardandoTelefono}
              style={{
                background: "var(--acento)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0 14px",
                fontWeight: "700",
                cursor: guardandoTelefono ? "default" : "pointer",
                opacity: guardandoTelefono ? 0.6 : 1
              }}
            >
              Guardar
            </button>
          </div>

          <div style={{ fontSize: "12px", color: "#999" }}>CAMBIAR CONTRASEÑA</div>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              margin: "6px 0"
            }}
          />
          <input
            type="password"
            placeholder="Repetir contraseña"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              marginBottom: "6px"
            }}
          />
          {msgPass && (
            <div style={{ fontSize: "12px", color: msgPass.includes("✓") ? "#1f8b4c" : "#b00020", marginBottom: "6px" }}>
              {msgPass}
            </div>
          )}
          <button
            style={{
              width: "100%",
              background: "#f5f5f5",
              color: "#333",
              border: "none",
              borderRadius: "8px",
              padding: "9px",
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "14px"
            }}
            onClick={cambiarPassword}
          >
            Actualizar contraseña
          </button>

          <div style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>COLOR DEL SISTEMA</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {PALETA_COLORES.map((c) => (
              <button
                key={c.clave}
                title={c.nombre}
                onClick={() => actualizarPerfil({ color_acento: c.clave })}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: c.valor,
                  border:
                    profile?.color_acento === c.clave ||
                    (!profile?.color_acento && c.clave === "azul")
                      ? "3px solid #333"
                      : "3px solid transparent",
                  cursor: "pointer"
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
