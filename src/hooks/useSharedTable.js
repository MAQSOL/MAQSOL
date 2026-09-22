import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * Tabla compartida en Supabase con forma { id, data jsonb, updated_at }.
 * Todos los usuarios logueados leen; escribir queda controlado por las
 * políticas RLS de cada tabla (normalmente: solo admin).
 *
 * Devuelve `registros` ya "aplanados" (id + ...data) para que el resto
 * del código de cada página, que ya trabajaba con arreglos de objetos
 * planos guardados en localStorage, cambie lo menos posible.
 */
export function useSharedTable(tabla) {
  const [rowsRaw, setRowsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(tabla)
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) setError(error);
    else {
      setError(null);
      setRowsRaw(data || []);
    }
    setLoading(false);
  }, [tabla]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  async function guardar(id, datos) {
    const { error } = await supabase
      .from(tabla)
      .upsert({ id, data: datos, updated_at: new Date().toISOString() });
    if (error) {
      alert("No se pudo guardar (" + tabla + "): " + error.message);
      return false;
    }
    await recargar();
    return true;
  }

  async function eliminar(id) {
    const { error } = await supabase.from(tabla).delete().eq("id", id);
    if (error) {
      alert("No se pudo eliminar (" + tabla + "): " + error.message);
      return false;
    }
    await recargar();
    return true;
  }

  const registros = rowsRaw.map((r) => ({ id: r.id, ...(r.data || {}) }));

  return { registros, rowsRaw, loading, error, guardar, eliminar, recargar };
}

/**
 * Igual que un arreglo de useState, pero persistido en Supabase.
 * `guardarLista(nuevaLista)` compara contra lo actual y hace upsert/delete de la diferencia.
 */
export function useListaCompartida(tabla) {
  const { registros, loading, error, recargar } = useSharedTable(tabla);
  const [lista, setLista] = useState([]);

  useEffect(() => {
    setLista(registros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(registros)]);

  async function guardarLista(nueva) {
    const previa = lista;
    setLista(nueva);
    const idsNuevos = new Set(nueva.map((x) => String(x.id)));
    const borrar = previa.filter((x) => !idsNuevos.has(String(x.id))).map((x) => String(x.id));
    const previasPorId = new Map(previa.map((x) => [String(x.id), JSON.stringify(x)]));
    const cambiadas = nueva
      .filter((x) => previasPorId.get(String(x.id)) !== JSON.stringify(x))
      .map((x) => {
        const { id, ...resto } = x;
        return { id: String(id), data: resto, updated_at: new Date().toISOString() };
      });

    if (cambiadas.length) {
      const { error } = await supabase.from(tabla).upsert(cambiadas);
      if (error) alert("No se pudo guardar (" + tabla + "): " + error.message);
    }
    if (borrar.length) {
      const { error } = await supabase.from(tabla).delete().in("id", borrar);
      if (error) alert("No se pudo eliminar (" + tabla + "): " + error.message);
    }
    await recargar();
  }

  return [lista, guardarLista, loading, error];
}

/** Catálogo como arreglo de textos (ej. tipos, proveedores), persistido en Supabase. */
export function useListaCatalogo(tipo, inicial = []) {
  const [lista, setLista] = useState(inicial);
  const [loading, setLoading] = useState(true);

  const recargar = useCallback(async () => {
    const { data, error } = await supabase
      .from("catalogos")
      .select("valor")
      .eq("tipo", tipo)
      .order("valor", { ascending: true });
    if (!error) {
      const valores = (data || []).map((r) => r.valor);
      if (valores.length === 0 && inicial.length) {
        await supabase.from("catalogos").upsert(inicial.map((valor) => ({ tipo, valor })));
        setLista(inicial);
      } else {
        setLista(valores);
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  async function guardarLista(nueva) {
    const previa = lista;
    setLista(nueva);
    const nuevos = nueva.filter((v) => !previa.includes(v));
    const quitados = previa.filter((v) => !nueva.includes(v));
    if (nuevos.length) {
      const { error } = await supabase
        .from("catalogos")
        .upsert(nuevos.map((valor) => ({ tipo, valor })));
      if (error) alert("No se pudo guardar el catálogo: " + error.message);
    }
    if (quitados.length) {
      const { error } = await supabase
        .from("catalogos")
        .delete()
        .eq("tipo", tipo)
        .in("valor", quitados);
      if (error) alert("No se pudo quitar del catálogo: " + error.message);
    }
  }

  return [lista, guardarLista, loading];
}

/** Catálogos compartidos (operadores, ubicaciones, tipos de equipo, etc.) */
export function useCatalogo(tipo) {
  const [valores, setValores] = useState([]);
  const [loading, setLoading] = useState(true);

  const recargar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("catalogos")
      .select("valor")
      .eq("tipo", tipo)
      .order("valor", { ascending: true });
    if (!error) setValores((data || []).map((r) => r.valor));
    setLoading(false);
  }, [tipo]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  async function agregar(valor) {
    const v = (valor || "").trim();
    if (!v) return false;
    const { error } = await supabase
      .from("catalogos")
      .upsert({ tipo, valor: v });
    if (error) {
      alert("No se pudo agregar: " + error.message);
      return false;
    }
    await recargar();
    return true;
  }

  async function quitar(valor) {
    const { error } = await supabase
      .from("catalogos")
      .delete()
      .eq("tipo", tipo)
      .eq("valor", valor);
    if (error) {
      alert("No se pudo quitar: " + error.message);
      return false;
    }
    await recargar();
    return true;
  }

  return { valores, loading, agregar, quitar, recargar };
}
