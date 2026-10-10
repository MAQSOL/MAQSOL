/**
 * Horómetro para mostrar: "3450" -> "3450 hrs". Si no es un número (p. ej. "N/A"
 * porque el horómetro no sirve, o ya trae "hrs") se muestra tal cual.
 */
export function conHoras(h, sufijo = "hrs") {
  const t = String(h ?? "").trim();
  if (!t) return "";
  return /^\d[\d.,\s]*$/.test(t) ? `${t} ${sufijo}` : t;
}

/** true si el horómetro trae un número (no "N/A"). */
export const esHorometroNumerico = (h) => /^\d/.test(String(h ?? "").trim());
