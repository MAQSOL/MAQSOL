import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

/** Lista de todas las cuentas reales del portal, para asignarles tareas. */
export function usePerfiles() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("perfiles")
      .select("id, nombre_completo, apodo, rol")
      .then(({ data }) => {
        setPerfiles(
          (data || [])
            .map((p) => ({ id: p.id, nombre: p.apodo || p.nombre_completo || "Sin nombre", rol: p.rol }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        );
        setLoading(false);
      });
  }, []);

  return { perfiles, loading };
}
