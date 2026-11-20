import { fFecha } from "../pages/Administracion/estilosAdmin";
import { abrirDocPDF, encabezadoDoc, pieDoc, esc, hoyMX } from "../utils/pdfFormato";

/*
 * Reporte de horas de una renta (vive en Rentas Activas y en Recepción).
 * Cada día desde el inicio de la renta hasta hoy (o hasta el fin) cuenta solo como
 * 9 h trabajadas + 1 h de comida. Solo se guardan las excepciones, en alquiler.horasDias:
 *   { "AAAA-MM-DD": { tipo: "falta" | "falla" | "descanso", desde, hasta, comida, nota } }
 *  - falta:    el operador no fue → 0 h, día a devolver al cliente
 *  - falla:    la máquina falló → horas de "desde" a "hasta" (menos comida si se marcó)
 *  - descanso: no se trabajó (domingo, lluvia, el cliente no ocupó…) → 0 h
 */

export const HORARIO = { desde: "08:00", hasta: "18:00", comida: true }; // 9 h + 1 h de comida
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const TIPOS = {
  normal: { etiqueta: "Normal", color: "#1b6e3d", fondo: "#e8f5e9" },
  falla: { etiqueta: "Falla de máquina", color: "#8a6100", fondo: "#fff4c2" },
  falta: { etiqueta: "Falta del operador", color: "#a32020", fondo: "#fdecec" },
  descanso: { etiqueta: "No se trabajó", color: "#555", fondo: "#eee" },
};

const pad = (n) => String(n).padStart(2, "0");
const isoDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoyIso = () => isoDe(new Date());
const minutos = (h) => { const m = /^(\d{1,2}):(\d{2})$/.exec(h || ""); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
export const fmtHoras = (n) => (Math.round(n * 100) / 100).toLocaleString("es-MX", { maximumFractionDigits: 2 });

/** horas trabajadas de un rango, quitando 1 h si se marcó comida */
export function horasDeRango(desde, hasta, comida) {
  const a = minutos(desde), b = minutos(hasta);
  if (a === null || b === null || b <= a) return 0;
  return Math.max(0, (b - a) / 60 - (comida ? 1 : 0));
}

/** días de la renta: desde el inicio original hasta hoy, sin pasarse del fin (ni del día en que se terminó) */
export function diasDeRenta(a) {
  const ini = a.inicioOriginal || a.fechaInicio;
  if (!ini) return [];
  let fin = hoyIso();
  if (a.fechaFin && a.fechaFin < fin) fin = a.fechaFin;
  if (a.finalizado && a.fechaFinalizado && a.fechaFinalizado < fin) fin = a.fechaFinalizado;
  const out = [];
  const d = new Date(ini + "T00:00:00");
  const tope = new Date(fin + "T00:00:00");
  for (let i = 0; d <= tope && i < 800; i++) { out.push(isoDe(d)); d.setDate(d.getDate() + 1); }
  return out;
}

/** cada día con su estado y horas */
export function bitacoraDe(a) {
  const ex = a.horasDias || {};
  return diasDeRenta(a).map((fecha) => {
    const e = ex[fecha];
    const tipo = e?.tipo || "normal";
    let desde = HORARIO.desde, hasta = HORARIO.hasta, comida = HORARIO.comida;
    if (tipo === "falla") { desde = e.desde || ""; hasta = e.hasta || ""; comida = !!e.comida; }
    const horas = tipo === "normal" ? horasDeRango(desde, hasta, comida) : tipo === "falla" ? horasDeRango(desde, hasta, comida) : 0;
    return { fecha, tipo, desde: tipo === "normal" || tipo === "falla" ? desde : "", hasta: tipo === "normal" || tipo === "falla" ? hasta : "", comida: (tipo === "normal" || tipo === "falla") && comida, horas, nota: e?.nota || "" };
  });
}

export function totalesDe(filas) {
  const normal = horasDeRango(HORARIO.desde, HORARIO.hasta, HORARIO.comida);
  return {
    dias: filas.length,
    horas: filas.reduce((s, f) => s + f.horas, 0),
    faltas: filas.filter((f) => f.tipo === "falta").length,
    fallas: filas.filter((f) => f.tipo === "falla").length,
    horasPerdidas: filas.filter((f) => f.tipo === "falla").reduce((s, f) => s + Math.max(0, normal - f.horas), 0),
    descansos: filas.filter((f) => f.tipo === "descanso").length,
  };
}

export const diaTexto = (iso) => { const d = new Date(iso + "T00:00:00"); return DIAS_SEMANA[d.getDay()] + " " + fFecha(iso); };

/** PDF del reporte de horas de la renta */
export function descargarHorasPDF(a) {
  const filas = bitacoraDe(a);
  const t = totalesDe(filas);
  const equipo = [a.tipo, a.marca, a.modelo].filter(Boolean).join(" ");
  const cuerpoFilas = filas.map((f) => {
    const T = TIPOS[f.tipo];
    return `<tr>
      <td>${esc(diaTexto(f.fecha))}</td>
      <td><b style="color:${T.color}">${esc(T.etiqueta)}</b></td>
      <td class="c">${f.desde && f.hasta ? esc(f.desde + " – " + f.hasta) : "—"}</td>
      <td class="c">${f.comida ? "1 h" : "—"}</td>
      <td class="r b">${fmtHoras(f.horas)}</td>
      <td>${esc(f.tipo === "falta" ? "Día a devolver al cliente" + (f.nota ? " · " + f.nota : "") : f.nota)}</td>
    </tr>`;
  }).join("");
  abrirDocPDF({
    nombre: "Horas " + (a.serie || equipo || "") + " " + (a.cliente || ""),
    hoja: "vertical",
    cuerpo: `${encabezadoDoc("Reporte de Horas", [
      equipo + (a.serie ? " — Serie: " + a.serie : ""),
      "Cliente: " + (a.cliente || "—") + (a.obra ? " · Obra: " + a.obra : ""),
      (a.operadorRenta ? "Operador: " + a.operadorRenta + " · " : "") + "Del " + fFecha(filas[0]?.fecha) + " al " + fFecha(filas[filas.length - 1]?.fecha),
      "Generado: " + hoyMX(),
    ])}
      <table><thead><tr><th>Día</th><th>Estado</th><th class="c">Horario</th><th class="c">Comida</th><th class="r">Horas</th><th>Observaciones</th></tr></thead>
      <tbody>${cuerpoFilas || '<tr><td colspan="6" class="c">La renta todavía no tiene días.</td></tr>'}</tbody></table>
      <div class="tot">
        <span>Días: <b>${t.dias}</b></span>
        <span>Horas trabajadas: <b>${fmtHoras(t.horas)}</b></span>
        <span>Faltas del operador (días a devolver): <b>${t.faltas}</b></span>
        <span>Días con falla: <b>${t.fallas}</b>${t.fallas ? " (" + fmtHoras(t.horasPerdidas) + " h perdidas)" : ""}</span>
        ${t.descansos ? `<span>No se trabajó: <b>${t.descansos}</b></span>` : ""}
      </div>
      <p class="m" style="margin-top:10px">Jornada normal: ${HORARIO.desde} a ${HORARIO.hasta} con 1 h de comida = 9 h trabajadas por día.</p>
      ${pieDoc()}`,
  });
}

