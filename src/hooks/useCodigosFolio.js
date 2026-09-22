import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export function useCodigosFolio() {
  const { profile } = useAuth();
  const [perfiles, setPerfiles] = useState([]);

  useEffect(() => {
    supabase
      .from("perfiles")
      .select("nombre_completo, codigo_folio, telefono")
      .then(({ data }) => setPerfiles(data || []));
  }, []);

  const codigos = [...new Set(perfiles.map((p) => p.codigo_folio).filter(Boolean))];
  const nombrePorCodigo = Object.fromEntries(
    perfiles.filter((p) => p.codigo_folio).map((p) => [p.codigo_folio, p.nombre_completo])
  );
  const telefonoPorCodigo = Object.fromEntries(
    perfiles.filter((p) => p.codigo_folio && p.telefono).map((p) => [p.codigo_folio, p.telefono])
  );

  return { codigos, miCodigo: profile?.codigo_folio || null, nombrePorCodigo, telefonoPorCodigo };
}
