import { AZUL, AZUL_TENUE, ROJO, abrirDocPDF, cssDoc, encabezadoDoc, esc, pieDoc } from "./pdfFormato";

/*
 * ORDEN DE COMPRA — mismo contenido que el Excel "OC-101-…" de MAQSOL, con el
 * diseño de MAQSISTEM (azul minimalista, rojo solo en folio y total).
 * La vista previa de la página y el PDF salen del MISMO html (htmlOrden).
 */

export const EMPRESA_OC = {
  razonSocial: "MAQUINARIA SOPORTE Y LOGISTICA SA DE CV",
  nombre: "Maquinaria Soporte y Logística S.A. de C.V.",
  giro: "Venta y renta de maquinaria y equipos para la industria y la construcción · Grúas industriales",
  domicilio: "Calle Paseo del Real, SM 313, MZA 103, Lote 14, C.P. 77533, Cancún, Quintana Roo, México",
  rfc: "MSL181010L67",
  telefonos: "998 215 2665 · 998 215 7262"
};

export const USOS_CFDI = ["G01: Adquisición de mercancías", "G03: Gastos en general", "I04: Equipo de cómputo", "I08: Otra maquinaria y equipo", "P01: Por definir"];
export const FORMAS_PAGO = ["Transferencia de fondos", "Cheque nominativo", "Efectivo", "Tarjeta de crédito", "Tarjeta de débito", "Por definir"];
export const METODOS_PAGO = ["PUE: Pago en una sola exhibición", "PPD: Pago en parcialidades o diferido"];
export const VIAS_EMBARQUE = ["Terrestre", "Paquetería", "Recoge en sucursal", "Aérea", "Marítima"];
export const ESTADOS_OC = ["Pendiente", "Recibida", "Cancelada"];

export const PARTIDA_NUEVA = { cantidad: "", numeroParte: "", serie: "", descripcion: "", precio: "" };

export const ORDEN_NUEVA = {
  folio: "",
  fecha: "",
  estado: "Pendiente",
  viaEmbarque: "Terrestre",
  solicito: "",
  cotizacion: "",
  proveedor: "",
  proveedorContacto: "",
  proveedorTelefono: "",
  proveedorCorreo: "",
  proveedorRfc: "",
  proveedorDomicilio: "",
  usoCfdi: "G03: Gastos en general",
  formaPago: "Transferencia de fondos",
  metodoPago: "PUE: Pago en una sola exhibición",
  partidas: [{ ...PARTIDA_NUEVA }],
  descuento: "",
  flete: "",
  conIva: true,
  observaciones: "",
  condicion: "Contado",
  diasCredito: "",
  moneda: "MXN",
  autoriza: "LIC. FRANCISCO TORRES MORALES",
  puestoAutoriza: "Gerente de Operaciones"
};

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
};

export const importePartida = (p) => num(p.cantidad) * num(p.precio);

/** Igual que el Excel: suma → descuento → importe → flete → subtotal → IVA 16 % → total. */
export function calcularTotales(o) {
  const suma = (o.partidas || []).reduce((t, p) => t + importePartida(p), 0);
  const descuento = num(o.descuento);
  const importe = suma - descuento;
  const flete = num(o.flete);
  const subtotal = importe + flete;
  const iva = o.conIva ? subtotal * 0.16 : 0;
  return { suma, descuento, importe, flete, subtotal, iva, total: subtotal + iva };
}

export const dineroOC = (n, moneda = "MXN") =>
  Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: moneda === "USD" ? "USD" : "MXN" });

export const folioOC = (o) => (o.folio ? "OC-" + String(o.folio).padStart(3, "0") : "OC-(al guardar)");

const fechaMX = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—");

/** Nombre del archivo, como los del Excel: OC-101-SEGAMAC-102024 */
export function nombreArchivoOC(o) {
  const prov = String(o.proveedor || "PROVEEDOR").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const f = o.fecha ? new Date(o.fecha + "T00:00:00") : new Date();
  return `${folioOC(o)}-${prov}-${String(f.getMonth() + 1).padStart(2, "0")}${f.getFullYear()}`;
}

const CSS_OC = `
  .meta{display:flex;gap:28px;flex-wrap:wrap;margin:0 0 18px}
  .meta div{font-size:10px;color:#888;letter-spacing:.5px;text-transform:uppercase}
  .meta b{display:block;font-size:14px;color:#222;letter-spacing:0;text-transform:none;margin-top:2px}
  .meta .folio b{color:${ROJO};font-size:20px}
  .partes{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:6px}
  .parte h2{margin:0 0 6px}
  .fila{display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #eee;font-size:11.5px}
  .fila span{color:#888;min-width:92px;font-size:10.5px;text-transform:uppercase;letter-spacing:.3px;padding-top:1px}
  .chips{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}
  .chip{background:${AZUL_TENUE};color:#33475b;border-radius:14px;padding:4px 11px;font-size:10.5px}
  .chip b{color:${AZUL}}
  .abajo{display:grid;grid-template-columns:1fr 290px;gap:22px;margin-top:16px;align-items:start}
  .obs{border-left:3px solid ${AZUL};background:#f6f9fc;padding:10px 12px;font-size:11.5px;white-space:pre-wrap;min-height:54px}
  .obs small{display:block;color:#888;font-size:10px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px}
  table.tot td{padding:5px 8px;font-size:12px}
  table.tot tbody tr:nth-child(even) td{background:none}
  table.tot td.r{font-variant-numeric:tabular-nums}
  table.tot tr.gran td{border-top:2px solid ${ROJO};border-bottom:none;font-size:14px;font-weight:700;color:${ROJO};padding-top:8px}
  .cond{margin-top:12px;font-size:11.5px;color:#555}
  .cond b{color:#222}
  .firma{margin:46px 0 0 auto;width:280px;text-align:center}
  .firma .linea{border-top:1px solid #333;padding-top:6px;font-weight:700;font-size:12px}
  .firma small{display:block;color:#777;font-size:11px}
  .firma .et{color:${ROJO};font-size:10px;letter-spacing:1px;font-weight:700;margin-bottom:4px}
  td.num{font-variant-numeric:tabular-nums}`;

/** Cuerpo del documento (sin <html>), para el PDF y para la vista previa. */
function cuerpoOrden(o) {
  const t = calcularTotales(o);
  const m = o.moneda || "MXN";
  const d = (n) => esc(dineroOC(n, m));
  const fila = (etq, val) => (val ? `<div class="fila"><span>${etq}</span><div>${esc(val)}</div></div>` : "");
  const partidas = (o.partidas || []).filter((p) => p.descripcion || p.numeroParte || p.cantidad);
  const filasPartidas = partidas.length
    ? partidas.map((p, i) => `<tr><td class="c">${i + 1}</td><td class="c num">${esc(p.cantidad)}</td><td>${esc(p.numeroParte)}</td><td>${esc(p.serie)}</td><td>${esc(p.descripcion)}</td><td class="r num">${p.precio !== "" ? d(num(p.precio)) : "—"}</td><td class="r b num">${d(importePartida(p))}</td></tr>`).join("")
    : `<tr><td colspan="7" class="c" style="color:#999">Sin partidas</td></tr>`;
  const credito = o.condicion === "Crédito" ? `Crédito${o.diasCredito ? ` a <b>${esc(o.diasCredito)} días</b>` : ""}` : "<b>Contado</b>";

  return `${encabezadoDoc("Orden de Compra", [EMPRESA_OC.nombre, EMPRESA_OC.giro, EMPRESA_OC.domicilio, `Tel. ${EMPRESA_OC.telefonos} · R.F.C. ${EMPRESA_OC.rfc}`])}
    <div class="meta">
      <div class="folio">Folio<b>${esc(folioOC(o))}</b></div>
      <div>Fecha<b>${esc(fechaMX(o.fecha))}</b></div>
      <div>Vía de embarque<b>${esc(o.viaEmbarque || "—")}</b></div>
      <div>Moneda<b>${esc(m)}</b></div>
      ${o.cotizacion ? `<div>Cotización<b>${esc(o.cotizacion)}</b></div>` : ""}
    </div>
    <div class="partes">
      <div class="parte"><h2>Facturar a</h2>
        ${fila("Razón social", EMPRESA_OC.razonSocial)}${fila("R.F.C.", EMPRESA_OC.rfc)}${fila("Domicilio", EMPRESA_OC.domicilio)}${fila("Solicitó", o.solicito)}
      </div>
      <div class="parte"><h2>Proveedor</h2>
        ${fila("Proveedor", o.proveedor || "—")}${fila("Atención", o.proveedorContacto)}${fila("Teléfono", o.proveedorTelefono)}${fila("Correo", o.proveedorCorreo)}${fila("R.F.C.", o.proveedorRfc)}${fila("Domicilio", o.proveedorDomicilio)}
      </div>
    </div>
    <div class="chips">
      <span class="chip">Uso del CFDI: <b>${esc(o.usoCfdi || "—")}</b></span>
      <span class="chip">Forma de pago: <b>${esc(o.formaPago || "—")}</b></span>
      <span class="chip">Método de pago: <b>${esc(o.metodoPago || "—")}</b></span>
    </div>
    <h2>Partidas</h2>
    <table><thead><tr><th class="c" style="width:34px">#</th><th class="c" style="width:52px">Cant.</th><th>No. de parte</th><th>No. de serie</th><th>Descripción</th><th class="r">P. unitario</th><th class="r">Importe</th></tr></thead>
      <tbody>${filasPartidas}</tbody></table>
    <div class="abajo">
      <div>
        <div class="obs"><small>Observaciones</small>${esc(o.observaciones || "—")}</div>
        <div class="cond">Condiciones: ${credito} · Moneda <b>${esc(m)}</b></div>
      </div>
      <table class="tot"><tbody>
        <tr><td>Suma subtotal</td><td class="r">${d(t.suma)}</td></tr>
        ${t.descuento ? `<tr><td>Descuento</td><td class="r">−${d(t.descuento)}</td></tr><tr><td>Importe</td><td class="r">${d(t.importe)}</td></tr>` : ""}
        ${t.flete ? `<tr><td>Flete</td><td class="r">${d(t.flete)}</td></tr>` : ""}
        ${t.descuento || t.flete ? `<tr><td>Subtotal</td><td class="r">${d(t.subtotal)}</td></tr>` : ""}
        <tr><td>${o.conIva ? "I.V.A. 16 %" : "I.V.A."}</td><td class="r">${o.conIva ? d(t.iva) : "No aplica"}</td></tr>
        <tr class="gran"><td>Importe total</td><td class="r">${d(t.total)}</td></tr>
      </tbody></table>
    </div>
    <div class="firma">
      <div class="et">AUTORIZÓ</div>
      <div class="linea">${esc(o.autoriza || "")}</div>
      <small>${esc(o.puestoAutoriza || "")}</small>
    </div>
    ${pieDoc(folioOC(o))}`;
}

/** Documento completo para la vista previa (iframe), sin lanzar la impresión. */
export function htmlOrden(o) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${cssDoc({ extra: CSS_OC })}</style></head><body>${cuerpoOrden(o)}</body></html>`;
}

/** Abre la ventana de impresión → "Guardar como PDF". */
export function abrirOrdenPDF(o) {
  abrirDocPDF({ nombre: nombreArchivoOC(o), cuerpo: cuerpoOrden(o), css: CSS_OC });
}
