import { fFecha } from "../pages/Administracion/estilosAdmin";
import { abrirDocPDF, encabezadoDoc, pieDoc, esc, hoyMX } from "./pdfFormato";

/*
 * Estado de cuenta de una renta (Rentas Activas).
 * Periodos = los anteriores guardados en cada renovación (renovaciones[].anterior) + el actual.
 * Un periodo está pagado si hay un pago en alquiler.pagos con el mismo inicio y fin.
 * Además: alquiler.observacionesPago = [{ id, fecha, texto }] (ej. pago de daños sin cotización)
 *         alquiler.liquidado = { fecha, nota } → "el cliente ya no debe nada".
 */

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const fecha = (iso) => new Date(iso + "T00:00:00");
const diasEntre = (a, b) => Math.round((fecha(b) - fecha(a)) / 86400000) + 1;

// semana ISO (lunes a domingo)
export function semanaISO(iso) {
  const d = fecha(iso);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const enero4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - enero4) / 86400000 - 3 + ((enero4.getDay() + 6) % 7)) / 7);
}

/** cómo se cobra el periodo: por mes, por semana o por fechas */
function tipoPeriodo(p) {
  const n = p.fechaInicio && p.fechaFin ? diasEntre(p.fechaInicio, p.fechaFin) : 0;
  if (p.plan === "28d" || n >= 25) return "mes";
  if (p.plan === "6d" || p.plan === "14d" || (n >= 5 && n <= 15)) return "semana";
  return "fechas";
}

/** nombre del periodo: "Octubre 2026", "Semana 45", "Semanas 45–46" o las fechas */
export function nombrePeriodo(p, corto = false) {
  if (!p.fechaInicio) return "Periodo";
  const t = tipoPeriodo(p);
  const d = fecha(p.fechaInicio);
  if (t === "mes") return corto ? MES_CORTO[d.getMonth()] : `${MESES[d.getMonth()]} ${d.getFullYear()}`;
  if (t === "semana") {
    const a = semanaISO(p.fechaInicio), b = p.fechaFin ? semanaISO(p.fechaFin) : a;
    if (corto) return "Sem " + a + (b !== a ? "–" + b : "");
    return (b !== a ? "Semanas " + a + "–" + b : "Semana " + a);
  }
  return corto ? fFecha(p.fechaInicio).slice(0, 5) : `${fFecha(p.fechaInicio)} – ${fFecha(p.fechaFin)}`;
}

const mismoPeriodo = (pago, p) => pago.periodoInicio === p.fechaInicio && pago.periodoFin === p.fechaFin;

/** todos los periodos de la renta, del más viejo al actual, con su pago (si hay) */
export function periodosDe(a) {
  const anteriores = (a.renovaciones || []).map((r) => r.anterior).filter((p) => p && p.fechaInicio);
  const lista = [...anteriores, { fechaInicio: a.fechaInicio, fechaFin: a.fechaFin, plan: a.plan, actual: true }]
    .filter((p) => p.fechaInicio)
    .sort((x, y) => x.fechaInicio.localeCompare(y.fechaInicio));
  return lista.map((p) => ({ ...p, pago: (a.pagos || []).find((pg) => mismoPeriodo(pg, p)) || null }));
}

export const pendientesDe = (a) => periodosDe(a).filter((p) => !p.pago).length;

/** PDF del estado de cuenta de la máquina (también se guarda en Archivos > Estados de cuenta) */
export function descargarEstadoCuentaPDF(a) {
  const periodos = periodosDe(a);
  const obs = [...(a.observacionesPago || [])].sort((x, y) => String(x.fecha).localeCompare(String(y.fecha)));
  const equipo = [a.tipo, a.marca, a.modelo].filter(Boolean).join(" ");
  const pend = periodos.filter((p) => !p.pago);
  const filas = periodos.map((p) => `<tr>
      <td class="b">${esc(nombrePeriodo(p))}${p.actual ? ' <span class="m">(actual)</span>' : ""}</td>
      <td>${esc(fFecha(p.fechaInicio))} – ${esc(fFecha(p.fechaFin))}</td>
      <td><b style="color:${p.pago ? "#1b6e3d" : "#a32020"}">${p.pago ? "Pagado" : "Pendiente"}</b></td>
      <td>${p.pago ? esc(fFecha(p.pago.fecha)) : "—"}</td>
    </tr>`).join("");
  const filasObs = obs.map((o) => `<tr><td>${esc(fFecha(o.fecha))}</td><td>${esc(o.texto)}</td></tr>`).join("");
  const cierre = a.liquidado
    ? `<div style="margin-top:16px;padding:10px 14px;border:2px solid #1b6e3d;color:#1b6e3d;font-weight:700">${esc(a.cliente || "El cliente")} ya no debe nada · liquidado el ${esc(fFecha(a.liquidado.fecha))}${a.liquidado.nota ? " · " + esc(a.liquidado.nota) : ""}</div>`
    : pend.length
      ? `<div style="margin-top:16px;padding:10px 14px;border:2px solid #a32020;color:#a32020;font-weight:700">Periodos pendientes de pago: ${pend.length} (${esc(pend.map((p) => nombrePeriodo(p)).join(", "))})</div>`
      : `<div style="margin-top:16px;padding:10px 14px;border:2px solid #1b6e3d;color:#1b6e3d;font-weight:700">Todos los periodos están pagados</div>`;
  const nombre = "Estado de cuenta " + (a.serie || equipo || a.id) + " " + (a.cliente || "");
  abrirDocPDF({
    nombre,
    hoja: "vertical",
    archivar: { categoria: "estados", nombre: nombre + ".pdf" },
    cuerpo: `${encabezadoDoc("Estado de Cuenta", [
      equipo + (a.serie ? " — Serie: " + a.serie : ""),
      "Cliente: " + (a.cliente || "—") + (a.obra ? " · Obra: " + a.obra : ""),
      "Renta desde el " + fFecha(periodos[0]?.fechaInicio) + (a.finalizado ? " · terminada" + (a.fechaFinalizado ? " el " + fFecha(a.fechaFinalizado) : "") : ""),
      "Generado: " + hoyMX(),
    ])}
      <h2>Pagos por periodo</h2>
      <table><thead><tr><th>Periodo</th><th>Fechas</th><th>Estado</th><th>Fecha de pago</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="4" class="c">Sin periodos.</td></tr>'}</tbody></table>
      ${obs.length ? `<h2>Observaciones</h2><table><thead><tr><th style="width:110px">Fecha</th><th>Observación</th></tr></thead><tbody>${filasObs}</tbody></table>` : ""}
      ${cierre}
      ${pieDoc()}`,
  });
}
