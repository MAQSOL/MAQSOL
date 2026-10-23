// Carta responsiva de resguardo de equipo para operadores de maquinaria.
// Se descarga directo como PDF (jsPDF) con el mismo estilo rojo y negro del sistema.
import { jsPDF } from "jspdf";
import { encabezadoJsPDF, seccionJsPDF, EMPRESA, ROJO_RGB } from "./pdfFormato";

export const CARTA_NUEVA = {
  personaId: "",
  nombre: "",
  curp: "",
  ine: "",
  cargo: "Operador de maquinaria",
  equipo: "",
  marca: "",
  modelo: "",
  serie: "",
  horometro: "",
  llaves: "1",
  fecha: "",
  lugar: "Cancún, Quintana Roo",
  entrega: "",
  firmaOperador: "",
  firmaEntrega: "",
};

const fechaLarga = (iso) => {
  const d = iso ? new Date(iso + "T00:00:00") : new Date();
  if (isNaN(d)) return "";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
};

const textoLlaves = (n) => (String(n) === "2" ? "Dos (2)" : "Una (1)");
const frase = (n) => (String(n) === "2" ? "las dos llaves del equipo" : "la llave del equipo");

export function descargarCartaResponsiva(d) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const x = 18;
  const ancho = W - x * 2;

  const nombre = (d.nombre || "").trim() || "________________________________";
  const curp = (d.curp || "").trim().toUpperCase() || "__________________";
  const ine = (d.ine || "").trim() || "__________________";

  let y = encabezadoJsPDF(doc, {
    titulo: "Carta responsiva de equipo",
    lineas: [EMPRESA, "Resguardo de maquinaria a operador"],
    x,
    ancho,
    y: 12,
  });

  const nueva = (alto) => {
    if (y + alto > H - 16) {
      doc.addPage();
      y = 18;
    }
  };

  const parrafo = (texto, { negrita = false, tam = 9.6, sep = 2.2, justificar = true } = {}) => {
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(tam);
    const lineas = doc.splitTextToSize(texto, ancho);
    const alto = lineas.length * (tam * 0.43) + sep;
    nueva(alto);
    doc.text(lineas, x, y + 3, { align: justificar ? "justify" : "left", maxWidth: ancho });
    y += alto;
  };

  // lugar y fecha
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.6);
  doc.text(`${d.lugar || ""}, a ${fechaLarga(d.fecha)}.`, x + ancho, y + 2, { align: "right" });
  y += 7;

  parrafo(
    `Yo, ${nombre}, con CURP ${curp} y credencial para votar (INE) número ${ine}, con cargo de ` +
      `${d.cargo || "Operador de maquinaria"} en ${EMPRESA} (en adelante, MAQSOL), hago constar y me comprometo a lo siguiente:`
  );

  // datos del equipo
  const filas = [
    ["EQUIPO", d.equipo || ""],
    ["MARCA", d.marca || ""],
    ["MODELO", d.modelo || ""],
    ["SERIE", d.serie || ""],
    ["HORÓMETRO AL RECIBIR", d.horometro || ""],
    ["LLAVES ENTREGADAS", textoLlaves(d.llaves)],
  ];
  const colK = 46;
  const hFila = 6.4;
  nueva(filas.length * hFila + 4);
  y += 1;
  filas.forEach(([k, v], i) => {
    const yy = y + i * hFila;
    doc.setFillColor(242, 242, 242);
    doc.rect(x, yy, colK, hFila, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, yy, colK, hFila);
    doc.rect(x + colK, yy, ancho - colK, hFila);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(k, x + 2, yy + 4.3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.6);
    doc.text(String(v), x + colK + 2.5, yy + 4.5);
  });
  y += filas.length * hFila + 4;

  const clausulas = [
    `Recibo de MAQSOL el equipo descrito, junto con ${frase(d.llaves)}, en buenas condiciones de funcionamiento y presentación, a mi entera satisfacción.`,
    "Me obligo a cuidar el equipo y su llave, a operarlo conforme a las indicaciones de MAQSOL y a las instrucciones del fabricante, únicamente para el trabajo que se me asigne, y a no prestarlo ni permitir que lo opere una persona no autorizada.",
    "En caso de pérdida de la llave, robo o daños ocasionados por mala operación, negligencia, descuido o uso indebido, autorizo a MAQSOL a descontar de mi nómina el costo de la reparación o reposición correspondiente, en los términos y con los límites que permite la ley.",
    "Los daños o desgaste originados por el paso del tiempo, el uso normal o la vida útil del equipo no me serán cobrados.",
    "Me comprometo a reportar de inmediato a MAQSOL cualquier falla, golpe, fuga, accidente o anomalía que detecte en el equipo.",
    "Devolveré el equipo y su llave a MAQSOL cuando se me solicite o al concluir el trabajo asignado.",
  ];
  clausulas.forEach((c, i) => parrafo(`${i + 1}.  ${c}`));

  // daños previos, a mano
  y += 1;
  nueva(40);
  y = seccionJsPDF(doc, "Daños o detalles que ya tiene el equipo al recibirlo (escribir a mano)", x, y);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.25);
  for (let i = 0; i < 4; i++) {
    doc.line(x, y + 6 + i * 7, x + ancho, y + 6 + i * 7);
  }
  doc.setLineWidth(0.2);
  y += 6 + 3 * 7 + 5;

  parrafo("Leído y conforme, firmo de enterado de las obligaciones anteriores.", { negrita: true, justificar: false, sep: 3 });

  // firmas
  nueva(46);
  const hCaja = 24;
  const anchoCaja = (ancho - 14) / 2;
  const yCaja = y + 4;
  const pon = (img, cx) => {
    if (!img) return;
    try {
      const props = doc.getImageProperties(img);
      const maxW = anchoCaja - 10;
      const maxH = hCaja - 4;
      const k = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * k;
      const h = props.height * k;
      doc.addImage(img, "PNG", cx + (anchoCaja - w) / 2, yCaja + (hCaja - h) / 2, w, h);
    } catch { /* firma inválida, se deja el espacio en blanco */ }
  };
  pon(d.firmaOperador, x);
  pon(d.firmaEntrega, x + anchoCaja + 14);

  [x, x + anchoCaja + 14].forEach((cx) => {
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.5);
    doc.line(cx, yCaja + hCaja, cx + anchoCaja, yCaja + hCaja);
  });
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(d.nombre ? d.nombre : "Nombre del operador", x + anchoCaja / 2, yCaja + hCaja + 4.5, { align: "center", maxWidth: anchoCaja });
  doc.text(d.entrega ? d.entrega : "Nombre de quien entrega", x + anchoCaja + 14 + anchoCaja / 2, yCaja + hCaja + 4.5, { align: "center", maxWidth: anchoCaja });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(95, 95, 95);
  doc.text("Operador que recibe", x + anchoCaja / 2, yCaja + hCaja + 8.5, { align: "center" });
  doc.text(`CURP: ${d.curp || "—"}  ·  INE: ${d.ine || "—"}`, x + anchoCaja / 2, yCaja + hCaja + 12, { align: "center", maxWidth: anchoCaja });
  doc.text("Entrega por MAQSOL", x + anchoCaja + 14 + anchoCaja / 2, yCaja + hCaja + 8.5, { align: "center" });

  // pie
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text("Documento generado desde MAQSISTEM · Carta responsiva", W / 2, H - 9, { align: "center" });
  doc.setDrawColor(...ROJO_RGB);

  const archivo = "CARTA-RESPONSIVA-" + (d.nombre || "OPERADOR").toUpperCase().replace(/[^A-Z0-9]+/g, "-") + ".pdf";
  doc.save(archivo);
}
