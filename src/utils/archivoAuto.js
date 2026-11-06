import { supabase } from "../supabaseClient";

const BUCKET = "archivos";

/** Copia un documento generado al explorador de Archivos (misma ruta = se reemplaza al regenerar). */
export async function guardarEnArchivos(categoria, nombre, blob) {
  if (!blob) return;
  const safe = String(nombre).replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${categoria}/${safe}`;
  const opts = { upsert: true, contentType: blob.type || "application/pdf" };
  let { error } = await supabase.storage.from(BUCKET).upload(path, blob, opts);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    ({ error } = await supabase.storage.from(BUCKET).upload(path, blob, opts));
  }
  if (error) console.warn("No se pudo copiar a Archivos:", error.message);
}
