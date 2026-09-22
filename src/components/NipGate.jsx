import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import OtpInput from "./OtpInput";

const VINO = "var(--acento)";

/**
 * Pantalla de NIP que se cruza antes de mostrar los hijos.
 * El NIP correcto vive en la tabla `configuracion` (clave = claveConfig)
 * y solo un admin puede cambiarlo (política RLS). Una vez validado en
 * esta pestaña, se recuerda en sessionStorage (se vuelve a pedir al
 * cerrar el navegador).
 */
export default function NipGate({
  claveConfig = "nip_clientes",
  mensaje = "Escribe el NIP para ver la información de clientes.",
  children
}) {
  const [desbloqueado, setDesbloqueado] = useState(
    () => sessionStorage.getItem("nip_ok_" + claveConfig) === "1"
  );
  const [nip, setNip] = useState("");
  const [nipReal, setNipReal] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (desbloqueado) {
      setCargando(false);
      return;
    }
    supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", claveConfig)
      .maybeSingle()
      .then(({ data }) => {
        setNipReal(data?.valor ?? "102018");
        setCargando(false);
      });
  }, [claveConfig, desbloqueado]);

  function validar(codigo) {
    if (codigo === nipReal) {
      setStatus("success");
      sessionStorage.setItem("nip_ok_" + claveConfig, "1");
      setTimeout(() => setDesbloqueado(true), 350);
    } else {
      setStatus("error");
      setTimeout(() => {
        setStatus("idle");
        setNip("");
      }, 500);
    }
  }

  if (desbloqueado) return children;

  if (cargando) {
    return <p style={{ textAlign: "center", marginTop: "60px" }}>Cargando…</p>;
  }

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
      <div
        style={{
          background: "white",
          padding: "36px",
          borderRadius: "14px",
          boxShadow: "0 2px 16px rgba(0,0,0,.12)",
          width: "100%",
          maxWidth: "340px",
          textAlign: "center"
        }}
      >
        <h3 style={{ marginBottom: "6px" }}>Acceso restringido</h3>
        <p style={{ color: "#888", fontSize: "13px", marginBottom: "22px" }}>
          {mensaje}
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <OtpInput
            length={6}
            value={nip}
            status={status}
            autoFocus
            onChange={setNip}
            onComplete={validar}
          />
        </div>

        {status === "error" && (
          <p style={{ color: "#b00020", fontSize: "13px", margin: 0 }}>
            NIP incorrecto
          </p>
        )}
        {status === "success" && (
          <p style={{ color: "#1f8b4c", fontSize: "13px", margin: 0 }}>
            ✓ Correcto
          </p>
        )}
      </div>
    </div>
  );
}
