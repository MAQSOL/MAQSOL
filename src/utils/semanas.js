// Semanas y asistencias: lo comparten la vista semanal de Asistencias y el Historial,
// para que los dos calculen exactamente igual (faltas, horas extra, número de semana).

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DIA_DESCANSO = 6;

export const lunesDeLaSemana = (fecha) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
};

export const numeroDeSemana = (fecha) => {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const primerJueves = new Date(d.getFullYear(), 0, 4);
  primerJueves.setDate(
    primerJueves.getDate() + 3 - ((primerJueves.getDay() + 6) % 7)
  );
  return 1 + Math.round((d - primerJueves) / (7 * 24 * 60 * 60 * 1000));
};

export const formatoCorto = (f) =>
  f.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" });

export const aMinutos = (hora) => {
  if (!hora) return null;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const minutosATexto = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

/** Minutos extra de un día: lo que pase de las 18:00; el domingo (descanso) cuenta todo lo trabajado. */
export const extrasDelDia = (dia, indice) => {
  if (dia.estado !== "A") return 0;

  const entrada = aMinutos(dia.entrada);
  const salida = aMinutos(dia.salida);
  if (salida === null) return 0;

  if (indice === DIA_DESCANSO) {
    if (entrada === null) return 0;
    const trabajado = salida - entrada;
    return trabajado > 0 ? trabajado : 0;
  }

  const jornada = aMinutos("18:00");
  return salida > jornada ? salida - jornada : 0;
};

/**
 * "2026-S41" -> lunes de esa semana. La clave la arma la vista semanal con el año
 * calendario del LUNES y el número de semana ISO, así que en fin/inicio de año la
 * semana ISO puede ser del año vecino: se prueba con los tres.
 */
export function lunesDeClave(clave) {
  const m = /^(\d{4})-S(\d{1,2})$/.exec(clave || "");
  if (!m) return null;
  const anio = Number(m[1]);
  const semana = Number(m[2]);
  for (const anioIso of [anio, anio + 1, anio - 1]) {
    const lunes = lunesDeLaSemana(new Date(anioIso, 0, 4));
    lunes.setDate(lunes.getDate() + (semana - 1) * 7);
    if (lunes.getFullYear() === anio && numeroDeSemana(lunes) === semana) return lunes;
  }
  return null;
}
