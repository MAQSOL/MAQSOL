/** Largo máximo del nombre del cliente dentro del folio. */
export const LARGO_NOMBRE_FOLIO = 8;

/**
 * Folio de checklist como se muestra: el nombre del cliente a 8 letras máximo.
 * CH-002-ABRAHAMPEREZGAYTAN-102026 -> CH-002-ABRAHAMP-102026
 * Sirve también para los folios viejos ya guardados con el nombre completo.
 * Un folio escrito a mano que no siga el formato se deja tal cual.
 */
export function folioVisible(folio) {
  const f = String(folio || "");
  const m = /^(CH-\d+)-(.+)-(\d{6})$/i.exec(f);
  return m ? `${m[1]}-${m[2].slice(0, LARGO_NOMBRE_FOLIO)}-${m[3]}` : f;
}
