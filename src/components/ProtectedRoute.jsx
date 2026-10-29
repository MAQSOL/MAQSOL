import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import CargandoMaq from "./CargandoMaq";

function ProtectedRoute({ children }) {

  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {

    Promise.all([
      supabase.auth.getSession(),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]).then(([{ data }]) => {
      setSesion(data.session);
      setCargando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSesion(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f4" }}>
        <CargandoMaq texto="Iniciando sistema…" />
      </div>
    );
  }

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;