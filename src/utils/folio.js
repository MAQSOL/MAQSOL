/** Largo máximo del nombre del cliente dentro del folio. */
export const LARGO_NOMBRE_FOLIO = 6;

/** Consecutivo con 2 dígitos (03, 12) y 3 solo cuando hace falta (100+). */
export const consecutivo = (n) => String(parseInt(n, 10) || 0).padStart(2, "0");

/** Modelo del equipo para el folio: GS-2632 -> GS2632 (completo, sin guiones ni espacios). */
export const modeloParaFolio = (m) =>
  String(m || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");

/**
 * Folio de checklist como se muestra: consecutivo a 2 dígitos, cliente a 6 letras y modelo completo.
 * CH-003-JOSUESAAVEDRA-GS2632-102026 -> CH-03-JOSUES-GS2632-102026
 * Sirve también para los folios viejos (sin modelo). Un folio a mano que no siga el formato se deja tal cual.
 */
export function folioVisible(folio) {
  const f = String(folio || "");
  const m = /^CH-(\d+)-([^-]+)(?:-([^-]+))?-(\d{6})$/i.exec(f);
  if (!m) return f;
  return ["CH", consecutivo(m[1]), m[2].slice(0, LARGO_NOMBRE_FOLIO), m[3], m[4]].filter(Boolean).join("-");
}
