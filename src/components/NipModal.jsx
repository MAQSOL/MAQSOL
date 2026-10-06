import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import OtpInput from "./OtpInput";

/** Pide el NIP (mismo de Gestión de Clientes) antes de permitir una acción sensible. */
export default function NipModal({ mensaje = "Escribe el NIP para continuar.", claveConfig = "nip_clientes", onCorrecto, onCancelar }) {
  const [nip, setNip] = useState("");
  const [nipReal, setNipReal] = useState(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let vivo = true;
    supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", claveConfig)
      .maybeSingle()
      .then(({ data }) => {
        if (vivo) setNipReal(data?.valor ?? "102018");
      });
    return () => {
      vivo = false;
    };
  }, [claveConfig]);

  function validar(codigo) {
    if (nipReal === null) return;
    if (codigo === nipReal) {
      setStatus("success");
      setTimeout(onCorrecto, 300);
    } else {
      setStatus("error");
      setTimeout(() => {
        setStatus("idle");
        setNip("");
      }, 500);
    }
  }

  return (
    <div
      onClick={onCancelar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, padding: 32, width: "100%", maxWidth: 360, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.25)" }}
      >
        <h3 style={{ margin: "0 0 6px" }}>Acceso restringido</h3>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>{mensaje}</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <OtpInput length={6} value={nip} status={status} autoFocus onChange={setNip} onComplete={validar} />
        </div>
        {status === "error" && <p style={{ color: "#b00020", fontSize: 13, margin: "0 0 10px" }}>NIP incorrecto</p>}
        {status === "success" && <p style={{ color: "#1f8b4c", fontSize: 13, margin: "0 0 10px" }}>✓ Correcto</p>}
        <button
          type="button"
          onClick={onCancelar}
          style={{ border: "none", background: "#eee", borderRadius: 8, padding: "9px 20px", fontWeight: 700, cursor: "pointer" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
