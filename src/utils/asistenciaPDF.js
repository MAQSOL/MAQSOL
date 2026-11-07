import jsPDF from "jspdf";
import { encabezadoJsPDF, ROJO_RGB } from "./pdfFormato";

/*
 * Lista de asistencia semanal como PDF descargable (sin ventana de impresión).
 * Mismo diseño que la versión anterior: tarjetas en dos columnas, una por colaborador.
 *
 * tarjetas: [{ nombre, puesto, dias: [{ dia, fecha, estado: "A"|"F"|"", descanso }], obs }]
 * Con descargar:false no lo baja y devuelve el PDF en base64 (para adjuntarlo a un correo).
 */

const VINO      = [143, 29, 44];
const VINO_TEN  = [249, 240, 241];
const BORDE     = [224, 224, 224];
const GRIS_DIA  = [227, 227, 227];
const VERDE_BG  = [223, 240, 216];
const VERDE_TX  = [26, 127, 55];
const ROJO_BG   = [253, 232, 232];
const ROJO_TX   = [198, 40, 40];
const DOM_BG    = [238, 242, 247];
const DOM_TX    = [74, 111, 165];
const TEXTO     = [68, 68, 68];

export function descargarAsistenciaPDF({ titulo = "Lista de Asistencia", subtitulo = "", mes = "", semana = "", tarjetas = [], nombreArchivo = "ASISTENCIAS", descargar = true }) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, M = 12, ancho = W - M * 2;
  const LIMITE = 252, PIE_Y = 263;
  const GAP_X = 6, GAP_Y = 6;
  const colW = (ancho - GAP_X) / 2;
  // anchos de columna dentro de cada tarjeta: nombre | día | fecha | asistencia
  const cw = [0.27, 0.21, 0.26, 0.26].map((f) => f * colW);
  const H_ENC = 7, H_DIA = 5.4;

  let y = encabezadoJsPDF(doc, {
    titulo,
    lineas: [subtitulo, "Generado: " + new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })],
    x: M, ancho, y: 10, altoLogo: 13, separacion: 6, color: ROJO_RGB,
  });

  // Ajusta el tamaño de letra para que quepa en el ancho dado
  const cabe = (txt, w, sz, min = 4.8) => {
    doc.setFontSize(sz);
    while (doc.getTextWidth(txt) > w && sz > min) { sz -= 0.2; doc.setFontSize(sz); }
    return sz;
  };

  const celda = (x, yy, w, h, fondo) => {
    doc.setFillColor(...fondo);
    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.15);
    doc.rect(x, yy, w, h, "FD");
  };

  const textoCentro = (txt, x, yy, w, h, { color = TEXTO, bold = false, sz = 7.5 } = {}) => {
    doc.setFont("courier", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    cabe(txt, w - 2, sz);
    doc.text(txt, x + w / 2, yy + h / 2 + 1.1, { align: "center" });
  };

  // Calcula el alto del renglón de observaciones antes de dibujar
  const lineasObs = (obs) => {
    doc.setFont("courier", "normal");
    doc.setFontSize(6.8);
    return obs ? doc.splitTextToSize(obs, cw[1] + cw[2] + cw[3] - 3) : [];
  };

  const altoTarjeta = (t) => H_ENC + H_DIA * t.dias.length + Math.max(7, lineasObs(t.obs).length * 3 + 3);

  const dibujarTarjeta = (t, x, y0) => {
    let yy = y0;
    // Encabezado vino
    const enc = [mes, "ASISTENCIAS SEMANA:", String(semana), "ASISTENCIA"];
    let xx = x;
    enc.forEach((txt, i) => {
      doc.setFillColor(...VINO);
      doc.rect(xx, yy, cw[i], H_ENC, "F");
      textoCentro(txt, xx, yy, cw[i], H_ENC, { color: [255, 255, 255], bold: true, sz: i === 0 ? 8 : 6.6 });
      xx += cw[i];
    });
    yy += H_ENC;

    // Días
    const yDias = yy;
    t.dias.forEach((d) => {
      let cx = x + cw[0];
      const dom = d.descanso;
      celda(cx, yy, cw[1], H_DIA, dom ? DOM_BG : GRIS_DIA);
      textoCentro(d.dia, cx, yy, cw[1], H_DIA, { color: dom ? DOM_TX : TEXTO, sz: 7 });
      cx += cw[1];
      celda(cx, yy, cw[2], H_DIA, dom ? DOM_BG : [255, 255, 255]);
      textoCentro(d.fecha, cx, yy, cw[2], H_DIA, { color: dom ? DOM_TX : [85, 85, 85], sz: 7 });
      cx += cw[2];
      let bg = [255, 255, 255], tx = TEXTO, txt = "";
      if (dom) { bg = DOM_BG; tx = DOM_TX; txt = "Descanso"; }
      else if (d.estado === "A") { bg = VERDE_BG; tx = VERDE_TX; txt = "A"; }
      else if (d.estado === "F") { bg = ROJO_BG; tx = ROJO_TX; txt = "F"; }
      celda(cx, yy, cw[3], H_DIA, bg);
      if (txt) textoCentro(txt, cx, yy, cw[3], H_DIA, { color: tx, bold: true, sz: dom ? 7 : 8 });
      yy += H_DIA;
    });

    // Nombre (celda alta a la izquierda)
    const hDias = H_DIA * t.dias.length;
    celda(x, yDias, cw[0], hDias, VINO_TEN);
    doc.setFont("courier", "bold");
    doc.setTextColor(17, 17, 17);
    doc.setFontSize(7);
    const lineasNombre = [
      ...doc.splitTextToSize(String(t.nombre || ""), cw[0] - 3),
      ...(t.puesto ? doc.splitTextToSize(`(${String(t.puesto).toUpperCase()})`, cw[0] - 3) : []),
    ].slice(0, 6);
    const yN = yDias + hDias / 2 - ((lineasNombre.length - 1) * 3) / 2 + 1;
    lineasNombre.forEach((ln, i) => doc.text(ln, x + cw[0] / 2, yN + i * 3, { align: "center" }));
    doc.setDrawColor(...VINO);
    doc.setLineWidth(0.6);
    doc.line(x + cw[0], yDias, x + cw[0], yDias + hDias);

    // Observaciones
    const lo = lineasObs(t.obs);
    const hObs = Math.max(7, lo.length * 3 + 3);
    celda(x, yy, cw[0], hObs, VINO_TEN);
    textoCentro("Observaciones:", x, yy, cw[0], hObs, { color: [17, 17, 17], bold: true, sz: 6.6 });
    const wTxt = cw[1] + cw[2] + cw[3];
    celda(x + cw[0], yy, wTxt, hObs, [255, 255, 255]);
    doc.setDrawColor(...VINO);
    doc.setLineWidth(0.6);
    doc.line(x + cw[0], yy, x + cw[0], yy + hObs);
    if (lo.length) {
      doc.setFont("courier", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...TEXTO);
      const y1 = yy + hObs / 2 - ((lo.length - 1) * 3) / 2 + 1;
      lo.forEach((ln, i) => doc.text(ln, x + cw[0] + wTxt / 2, y1 + i * 3, { align: "center" }));
    }
    // Marco exterior
    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.25);
    doc.rect(x, y0, colW, yy + hObs - y0, "S");
  };

  // Acomodo en dos columnas, fila por fila (cada fila toma el alto de su tarjeta más alta)
  for (let i = 0; i < tarjetas.length; i += 2) {
    const par = tarjetas.slice(i, i + 2);
    const h = Math.max(...par.map(altoTarjeta));
    if (y + h > LIMITE) { doc.addPage(); y = 14; }
    par.forEach((t, k) => dibujarTarjeta(t, M + k * (colW + GAP_X), y));
    y += h + GAP_Y;
  }
  if (!tarjetas.length) {
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...TEXTO);
    doc.text("Sin colaboradores registrados.", M, y + 6);
  }

  // Pie en cada hoja, con margen inferior
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...ROJO_RGB);
    doc.setLineWidth(0.6);
    doc.line(M, PIE_Y, M + ancho, PIE_Y);
    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text("Generado desde MAQSISTEM", M, PIE_Y + 4.5);
    doc.text(`Hoja ${p} de ${total}`, M + ancho, PIE_Y + 4.5, { align: "right" });
  }

  if (!descargar) return doc.output("datauristring").split(",")[1]; // base64 para adjuntar
  doc.save(nombreArchivo + ".pdf");
  return null;
}
