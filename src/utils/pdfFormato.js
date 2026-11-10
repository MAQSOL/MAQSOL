import { LOGO_MAQSOL_TRANSPARENTE, LOGO_MAQSOL_TRANSPARENTE_RELACION } from "./logoMaqsolTransparente";

/*
 * DISEÑO ÚNICO de los PDF de MAQSISTEM — el de "Cargas de Diesel" (minimalista):
 * título azul a la izquierda con sus datos en gris, logo a la derecha, línea azul
 * debajo, subtítulos de sección en azul y tablas con encabezado azul y renglones
 * alternados. Lo usan TODOS los PDF menos las cotizaciones (Venta / Renta /
 * Refacciones), que conservan su diseño comercial a propósito.
 */
// Colores del sistema: NEGRO (encabezados de tabla, rótulos) y ROJO MAQSOL (líneas, títulos de sección, folio).
// Los nombres AZUL_* se conservan para no tocar a quienes los importan.
export const AZUL = "#1a1a1a";
export const AZUL_RGB = [26, 26, 26];
export const AZUL_TENUE = "#f2f2f2";      // celdas de etiqueta en formatos
export const AZUL_TENUE_RGB = [242, 242, 242];
export const ROJO = "#8F1D2C";            // rojo vino MAQSOL (mismo de las asistencias)
export const ROJO_RGB = [143, 29, 44];
export const EMPRESA = "MAQUINARIA SOPORTE Y LOGÍSTICA SA DE CV";

export const esc = (t) =>
  String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const hoyMX = () => new Date().toLocaleDateString("es-MX");

// ---------------------------------------------------------------- PDF como página impresa

/** Solo el encabezado (para formatos con CSS propio, como el checklist). */
export const CSS_ENCABEZADO = `
    .top{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:3px solid ${ROJO};padding-bottom:12px;margin-bottom:16px}
    .top img{height:58px}
    .top .der{display:flex;align-items:center;gap:20px}
    .top .folio-top{text-align:right;border-right:1px solid #ddd;padding-right:20px}
    .top .folio-top small{display:block;font-size:10px;letter-spacing:1px;color:#888;text-transform:uppercase}
    .top .folio-top b{display:block;font-size:24px;color:${ROJO};margin-top:2px}
    .top h1{font-size:20px;margin:0;color:#111}
    .top p{margin:3px 0;color:#555}`;

/** CSS base. hoja: "auto" (el usuario elige al imprimir) o "horizontal" (carta apaisada). */
export function cssDoc({ hoja = "auto", extra = "" } = {}) {
  return `
    @page{size:${hoja === "horizontal" ? "letter landscape" : hoja === "vertical" ? "letter portrait" : "auto"};margin:10mm 9mm 16mm}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{font-family:'Roboto Mono','Courier New',monospace;color:#222;margin:0;padding:12mm 12mm;font-size:11.5px}
    ${CSS_ENCABEZADO}
    h1{font-family:'Space Mono',monospace!important}
    h2{font-size:13px;margin:18px 0 7px;color:${ROJO};font-family:'Space Mono',monospace;letter-spacing:.3px}
    table{width:100%;border-collapse:collapse}
    thead{display:table-header-group}
    th{background:${AZUL};color:#fff;text-align:left;padding:7px 6px;font-size:10.5px;font-family:'Space Mono',monospace;letter-spacing:.3px}
    td{padding:5px 7px;border-bottom:1px solid #e8e8e8;font-family:'Roboto Mono',monospace}
    tbody tr:nth-child(even) td{background:#f8f8f8}
    tr{page-break-inside:avoid}
    .c{text-align:center}.r{text-align:right}.b{font-weight:700}
    .m{font-size:10px;color:#777;margin-top:1px;font-family:'Roboto Mono',monospace}
    .tot{display:flex;gap:30px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px;font-size:13px}
    .pie{margin-top:14px;font-size:9px;color:#aaa;text-align:center;font-family:'Roboto Mono',monospace;letter-spacing:.3px}
    @media print{
      body{padding:0}
      /* al imprimir, el pie se dibuja en el margen inferior de cada hoja (@page @bottom-center) */
      .pie{display:none}
    }
    ${extra}`;
}

/** Encabezado: título y renglones de datos a la izquierda, folio (opcional) y logo a la derecha, línea azul. */
export function encabezadoDoc(titulo, lineas = [], { folio = "" } = {}) {
  const ps = lineas.filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join("");
  const f = folio ? `<div class="folio-top"><small>Folio</small><b>${esc(folio)}</b></div>` : "";
  return `<div class="top"><div><h1>${esc(titulo)}</h1>${ps}</div><div class="der">${f}<img src="${LOGO_MAQSOL_TRANSPARENTE}" alt="MAQSOL"></div></div>`;
}

/** Pie discreto: en pantalla al final; al imprimir, hasta abajo de cada hoja. */
export const pieDoc = (texto = "") => {
  const t = "Documento generado desde MAQSISTEM" + (texto ? " · " + texto : "");
  // texto seguro para una cadena CSS
  const css = t.replace(/[\\"]/g, (c) => "\\" + c).replace(/[\r\n<>]/g, " ");
  return `<style>@page{@bottom-center{content:"${css}";font-family:'Roboto Mono',monospace;font-size:8px;color:#aaa;letter-spacing:.3px;vertical-align:middle}}</style><div class="pie">${esc(t)}</div>`;
};

/**
 * Abre la ventana y lanza imprimir ("Guardar como PDF"). `nombre` es el título de
 * la ventana, que el navegador propone como nombre del archivo.
 */
export function abrirDocPDF({ nombre, cuerpo, hoja = "auto", css = "" }) {
  abrirHtmlImprimible(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(nombre)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>${cssDoc({ hoja, extra: css })}</style></head><body>${cuerpo}
    <script>document.fonts.ready.then(function(){window.print()});</script></body></html>`);
}

/**
 * Abre un HTML completo en pestaña nueva como archivo propio (URL blob) en vez de
 * escribirlo en una ventana "about:blank". Así Chrome sí toma el <title> como
 * nombre propuesto al "Guardar como PDF".
 */
export function abrirHtmlImprimible(html) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    alert("El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.");
    return null;
  }
  // se libera después; la pestaña ya cargó su copia
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return w;
}

// ---------------------------------------------------------------- mismo diseño en jsPDF

/**
 * Encabezado del diseño dibujado con jsPDF (medidas en mm). Devuelve la y donde
 * sigue el contenido, ya debajo de la línea azul.
 */
export function encabezadoJsPDF(doc, { titulo, lineas = [], x, ancho, y = 10, altoLogo = 15, separacion = 5, color = ROJO_RGB }) {
  const ls = lineas.filter(Boolean).map(String);
  const wLogo = altoLogo * LOGO_MAQSOL_TRANSPARENTE_RELACION;
  try { doc.addImage(LOGO_MAQSOL_TRANSPARENTE, "PNG", x + ancho - wLogo, y, wLogo, altoLogo); } catch { /* sin logo */ }
  doc.setFont("courier", "bold");
  doc.setFontSize(17);
  doc.setTextColor(17, 17, 17);
  doc.text(titulo, x, y + 6);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(85, 85, 85);
  ls.forEach((l, i) => doc.text(l, x, y + 11.5 + i * 4.4, { maxWidth: ancho - wLogo - 6 }));
  const yl = y + Math.max(altoLogo, 8.5 + ls.length * 4.4) + 2.5;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(x, yl, x + ancho, yl);
  doc.setLineWidth(0.2);
  doc.setTextColor(20, 20, 20);
  return yl + separacion;
}

/** Subtítulo de sección en rojo (como "Resumen por máquina"). Devuelve la y siguiente. */
export function seccionJsPDF(doc, texto, x, y, color = ROJO_RGB) {
  doc.setFont("courier", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...color);
  doc.text(texto, x, y + 4);
  doc.setTextColor(20, 20, 20);
  return y + 8;
}
