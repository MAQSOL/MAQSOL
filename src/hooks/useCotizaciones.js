import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

/**
 * Cotizaciones por usuario: cada quien ve y administra las suyas;
 * el admin ve las de todos (controlado por RLS en la tabla).
 */
export function useCotizaciones(tipo) {
  const { user } = useAuth();
  const [rowsRaw, setRowsRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  const recargar = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cotizaciones")
      .select("*")
      .eq("tipo", tipo)
      .order("updated_at", { ascending: false });
    if (!error) setRowsRaw(data || []);
    setLoading(false);
  }, [tipo, user]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  async function guardar(id, datos) {
    if (!user) return false;
    const { error } = await supabase.from("cotizaciones").upsert({
      id,
      tipo,
      data: datos,
      created_by: user.id,
      created_by_email: user.email,
      updated_at: new Date().toISOString()
    });
    if (error) {
      alert("No se pudo guardar la cotización: " + error.message);
      return false;
    }
    await recargar();
    return true;
  }

  async function eliminar(id) {
    const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
    if (error) {
      alert("No se pudo eliminar: " + error.message);
      return false;
    }
    await recargar();
    return true;
  }

  const registros = rowsRaw.map((r) => ({
    id: r.id,
    ...(r.data || {}),
    _autor: r.created_by_email
  }));

  return { registros, loading, guardar, eliminar, recargar };
}
