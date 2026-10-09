import { LOGO_MAQSOL_TRANSPARENTE, LOGO_MAQSOL_TRANSPARENTE_RELACION } from "./logoMaqsolTransparente";

/*
 * DISEÑO ÚNICO de los PDF de MAQSISTEM — el de "Cargas de Diesel" (minimalista):
 * título azul a la izquierda con sus datos en gris, logo a la derecha, línea azul
 * debajo, subtítulos de sección en azul y tablas con encabezado azul y renglones
 * alternados. Lo usan TODOS los PDF menos las cotizaciones (Venta / Renta /
 * Refacciones), que conservan su diseño comercial a propósito.
 */
export const AZUL = "#1d5c8f";
export const AZUL_RGB = [29, 92, 143];
export const AZUL_TENUE = "#eef3f8";      // celdas de etiqueta en formatos
export const AZUL_TENUE_RGB = [238, 243, 248];
export const EMPRESA = "MAQUINARIA SOPORTE Y LOGÍSTICA SA DE CV";

export const esc = (t) =>
  String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const hoyMX = () => new Date().toLocaleDateString("es-MX");

// ---------------------------------------------------------------- PDF como página impresa

/** Solo el encabezado (para formatos con CSS propio, como el checklist). */
export const CSS_ENCABEZADO = `
    .top{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:3px solid ${AZUL};padding-bottom:12px;margin-bottom:16px}
    .top img{height:58px}
    .top h1{font-size:20px;margin:0;color:${AZUL}}
    .top p{margin:3px 0;color:#555}`;

/** CSS base. hoja: "auto" (el usuario elige al imprimir) o "horizontal" (carta apaisada). */
export function cssDoc({ hoja = "auto", extra = "" } = {}) {
  return `
    @page{size:${hoja === "horizontal" ? "letter landscape" : "auto"};margin:0}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{font-family:Arial,sans-serif;color:#222;margin:0;padding:12mm 12mm;font-size:12px}
    ${CSS_ENCABEZADO}
    h2{font-size:14px;margin:20px 0 8px;color:${AZUL}}
    table{width:100%;border-collapse:collapse}
    thead{display:table-header-group}
    th{background:${AZUL};color:#fff;text-align:left;padding:7px;font-size:11px}
    td{padding:6px 7px;border-bottom:1px solid #ddd}
    tbody tr:nth-child(even) td{background:#f6f9fc}
    tr{page-break-inside:avoid}
    .c{text-align:center}.r{text-align:right}.b{font-weight:700}
    .m{font-size:10px;color:#777;margin-top:1px}
    .tot{display:flex;gap:30px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px;font-size:14px}
    .pie{margin-top:14px;font-size:9px;color:#999;text-align:center}
    @media print{body{padding:10mm 9mm}}
    ${extra}`;
}

/** Encabezado: título y renglones de datos a la izquierda, logo a la derecha, línea azul. */
export function encabezadoDoc(titulo, lineas = []) {
  const ps = lineas.filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join("");
  return `<div class="top"><div><h1>${esc(titulo)}</h1>${ps}</div><img src="${LOGO_MAQSOL_TRANSPARENTE}" alt="MAQSOL"></div>`;
}

/** Pie discreto al final del documento. */
export const pieDoc = (texto = "") => `<div class="pie">Documento generado desde MAQSISTEM${texto ? " · " + esc(texto) : ""}</div>`;

/**
 * Abre la ventana y lanza imprimir ("Guardar como PDF"). `nombre` es el título de
 * la ventana, que el navegador propone como nombre del archivo.
 */
export function abrirDocPDF({ nombre, cuerpo, hoja = "auto", css = "" }) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.");
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(nombre)}</title>
    <style>${cssDoc({ hoja, extra: css })}</style></head><body>${cuerpo}
    <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`);
  w.document.close();
}

// ---------------------------------------------------------------- mismo diseño en jsPDF

/**
 * Encabezado del diseño dibujado con jsPDF (medidas en mm). Devuelve la y donde
 * sigue el contenido, ya debajo de la línea azul.
 */
export function encabezadoJsPDF(doc, { titulo, lineas = [], x, ancho, y = 10, altoLogo = 15, separacion = 5 }) {
  const ls = lineas.filter(Boolean).map(String);
  const wLogo = altoLogo * LOGO_MAQSOL_TRANSPARENTE_RELACION;
  try { doc.addImage(LOGO_MAQSOL_TRANSPARENTE, "PNG", x + ancho - wLogo, y, wLogo, altoLogo); } catch { /* sin logo */ }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...AZUL_RGB);
  doc.text(titulo, x, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(85, 85, 85);
  ls.forEach((l, i) => doc.text(l, x, y + 11.5 + i * 4.4, { maxWidth: ancho - wLogo - 6 }));
  const yl = y + Math.max(altoLogo, 8.5 + ls.length * 4.4) + 2.5;
  doc.setDrawColor(...AZUL_RGB);
  doc.setLineWidth(0.8);
  doc.line(x, yl, x + ancho, yl);
  doc.setLineWidth(0.2);
  doc.setTextColor(20, 20, 20);
  return yl + separacion;
}

/** Subtítulo de sección en azul (como "Resumen por máquina"). Devuelve la y siguiente. */
export function seccionJsPDF(doc, texto, x, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...AZUL_RGB);
  doc.text(texto, x, y + 4);
  doc.setTextColor(20, 20, 20);
  return y + 8;
}
