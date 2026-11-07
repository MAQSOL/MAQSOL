import jsPDF from "jspdf";
import { encabezadoJsPDF, ROJO_RGB } from "./pdfFormato";
import { conHoras } from "./horometro";

/*
 * Ficha completa del equipo (uso interno): información general, foto, filtros,
 * suministros, pendientes y los últimos 5 mantenimientos. Con fecha de generación.
 */

const NEGRO = [17, 17, 17];
const GRIS = [130, 130, 130];
const LINEA = [210, 210, 210];
const TENUE = [242, 242, 242];

const fFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  return isNaN(d) ? "" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const ORDEN_FILTROS = ["Aceite", "Aire primario", "Aire secundario", "Aire de cabina", "Aire acondicionado", "Aire (tercer filtro)", "Combustible", "Hidráulico", "Otro"];

export function descargarExpedienteEquipoPDF(eq = {}) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, M = 12, ancho = W - M * 2;
  const LIMITE = 252, PIE_Y = 263;
  const hoy = new Date();
  const hoyTxt = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
  const nombreEq = [eq.tipo, eq.marca, eq.modelo].filter(Boolean).join(" ") || "Equipo";

  let y = encabezadoJsPDF(doc, {
    titulo: "Ficha del Equipo",
    lineas: ["MAQUINARIA SOPORTE Y LOGÍSTICA SA DE CV", "Fecha: " + hoyTxt],
    x: M, ancho, y: 7, altoLogo: 13, separacion: 4,
  });

  const asegura = (alto) => {
    if (y + alto > LIMITE) {
      doc.addPage();
      y = 12;
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRIS);
      doc.text(`FICHA DEL EQUIPO  ·  ${nombreEq.toUpperCase()}${eq.serie ? "  ·  SERIE " + eq.serie : ""}`, M, y + 3);
      doc.setDrawColor(...ROJO_RGB);
      doc.setLineWidth(0.5);
      doc.line(M, y + 5.5, M + ancho, y + 5.5);
      y += 10;
    }
  };

  const seccion = (titulo, extra = 12) => {
    asegura(8 + extra);
    doc.setFillColor(...NEGRO);
    doc.rect(M, y, ancho, 6, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, M + 3, y + 4);
    y += 8;
  };

  const ROW_H = 8.5, GAP = 4;
  // Fila de campos etiqueta/valor dentro de un ancho dado (para dejar lugar a la foto)
  const campos = (lista, anchoUtil = ancho) => {
    asegura(ROW_H + 3);
    const totalW = anchoUtil - GAP * (lista.length - 1);
    let x = M;
    lista.forEach(({ label = "", val = "", w = 1 / lista.length }) => {
      const fw = totalW * w;
      const txt = String(val == null ? "" : val).trim();
      doc.setFont("courier", "bold");
      doc.setFontSize(6.4);
      doc.setTextColor(...GRIS);
      doc.text(label.toUpperCase(), x, y + 3.2);
      if (txt) {
        doc.setFont("courier", "normal");
        let sz = 9.5;
        doc.setFontSize(sz);
        while (doc.getTextWidth(txt) > fw - 1 && sz > 6.5) { sz -= 0.25; doc.setFontSize(sz); }
        doc.setTextColor(...NEGRO);
        doc.text(txt, x, y + ROW_H - 1.4);
      }
      doc.setDrawColor(...LINEA);
      doc.setLineWidth(0.22);
      doc.line(x, y + ROW_H, x + fw, y + ROW_H);
      x += fw + GAP;
    });
    y += ROW_H + 3;
  };

  // Tabla simple con encabezado gris y filas con línea inferior
  const tabla = (cols, filas, { vacio = "Sin registros." } = {}) => {
    const anchos = cols.map((c) => c.w * ancho);
    const encabezado = () => {
      asegura(7 + 7);
      let x = M;
      doc.setFillColor(...TENUE);
      doc.rect(M, y, ancho, 6.5, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      cols.forEach((c, i) => { doc.text(c.t.toUpperCase(), x + 1.5, y + 4.4); x += anchos[i]; });
      y += 6.5;
    };
    encabezado();
    if (!filas.length) {
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRIS);
      doc.text(vacio, M + 1.5, y + 5);
      y += 9;
      return;
    }
    filas.forEach((fila) => {
      doc.setFont("courier", "normal");
      doc.setFontSize(8.6);
      const lineas = fila.map((v, i) => doc.splitTextToSize(String(v ?? ""), anchos[i] - 3));
      const alto = Math.max(...lineas.map((l) => l.length)) * 3.8 + 3;
      if (y + alto > LIMITE) { asegura(alto + 20); encabezado(); }
      let x = M;
      lineas.forEach((l, i) => {
        doc.setFont("courier", cols[i].b ? "bold" : "normal");
        doc.setTextColor(...NEGRO);
        doc.text(l, x + 1.5, y + 4.2);
        x += anchos[i];
      });
      y += alto;
      doc.setDrawColor(...LINEA);
      doc.setLineWidth(0.2);
      doc.line(M, y, M + ancho, y);
    });
    y += 4;
  };

  // ── Título del equipo + foto ────────────────────────────────────────────────
  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...NEGRO);
  doc.text(eq.tipo || "Equipo", M, y + 5);
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${eq.marca || ""} ${eq.modelo || ""}`.trim() + (eq.serie ? `  ·  Serie ${eq.serie}` : ""), M, y + 10.5);
  y += 15;

  // Foto a la derecha de la información general
  const FOTO_W = 62, FOTO_H = 46;
  let anchoInfo = ancho;
  const yFoto = y;
  if (eq.fotoUrl && /^data:image\//.test(eq.fotoUrl)) {
    try {
      const props = doc.getImageProperties(eq.fotoUrl);
      const r = Math.min(FOTO_W / props.width, FOTO_H / props.height);
      const w = props.width * r, h = props.height * r;
      doc.setDrawColor(...LINEA);
      doc.setLineWidth(0.3);
      doc.rect(M + ancho - FOTO_W, yFoto, FOTO_W, FOTO_H, "S");
      doc.addImage(eq.fotoUrl, props.fileType || "JPEG", M + ancho - FOTO_W + (FOTO_W - w) / 2, yFoto + (FOTO_H - h) / 2, w, h);
      anchoInfo = ancho - FOTO_W - 6;
    } catch { /* sin foto */ }
  }

  seccionCorta("INFORMACIÓN GENERAL", anchoInfo);
  const info = [
    ["Tipo de equipo", eq.tipo], ["Marca", eq.marca],
    ["Modelo", eq.modelo], ["Serie", eq.serie],
    ["Año", eq.anio], ["Horómetro", conHoras(eq.horometro)],
    ["Operador", eq.operador || "Sin operador"], ["Ubicación", eq.ubicacion],
    ["Motor", eq.motor], ["Capacidad de carga", eq.capacidad],
    ["Altura máx. de trabajo", eq.alturaMaxima], ["Combustible", eq.combustible],
    ["Placas o no. económico", eq.placas], ["Próximo mantenimiento", fFecha(eq.proximoMantto) || "Sin fecha"],
  ];
  for (let i = 0; i < info.length; i += 2) {
    const usaFoto = y < yFoto + FOTO_H + 2;
    campos(info.slice(i, i + 2).map(([label, val]) => ({ label, val })), usaFoto ? anchoInfo : ancho);
  }
  y = Math.max(y, anchoInfo < ancho ? yFoto + FOTO_H + 4 : y);
  if (eq.notas) {
    campos([{ label: "Notas", val: eq.notas, w: 1 }]);
  }

  // Sección de ancho reducido (junto a la foto)
  function seccionCorta(titulo, w) {
    doc.setFillColor(...NEGRO);
    doc.rect(M, y, w, 6, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, M + 3, y + 4);
    y += 8;
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────
  seccion("FILTROS DE LA MÁQUINA", 20);
  const filtros = [...(eq.filtros || [])]
    .filter((f) => f && (f.tipo || f.marca || f.parte))
    .sort((a, b) => {
      const ia = ORDEN_FILTROS.indexOf(a.tipo), ib = ORDEN_FILTROS.indexOf(b.tipo);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  tabla(
    [{ t: "Tipo", w: 0.28, b: true }, { t: "Marca", w: 0.27 }, { t: "Número de parte", w: 0.45, b: true }],
    filtros.map((f) => [f.tipo || "Sin tipo", f.marca || "", f.parte || ""]),
    { vacio: "No hay filtros registrados." }
  );

  // ── Suministros ─────────────────────────────────────────────────────────────
  const suministros = (eq.suministros || []).filter((s) => s && (s.nombre || s.cantidad || s.especificacion));
  if (suministros.length) {
    seccion("SUMINISTROS", 20);
    tabla(
      [{ t: "Suministro", w: 0.35, b: true }, { t: "Cantidad", w: 0.2 }, { t: "Especificación", w: 0.45 }],
      suministros.map((s) => [s.nombre || "", s.cantidad || "", s.especificacion || ""])
    );
  }

  // ── Pendientes ──────────────────────────────────────────────────────────────
  const pendientes = (eq.pendientes || []).filter((p) => p && p.texto);
  if (pendientes.length) {
    seccion("PENDIENTES", 14);
    tabla(
      [{ t: "Estado", w: 0.18, b: true }, { t: "Pendiente", w: 0.82 }],
      pendientes.map((p) => [p.hecho ? "Hecho" : "Pendiente", p.texto])
    );
  }

  // ── Últimos 5 mantenimientos ────────────────────────────────────────────────
  const manttos = [...(Array.isArray(eq.mantenimientos) ? eq.mantenimientos : [])]
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))
    .slice(0, 5);
  seccion("ÚLTIMOS 5 MANTENIMIENTOS", 20);
  tabla(
    [
      { t: "Fecha", w: 0.12, b: true }, { t: "Horóm.", w: 0.1 }, { t: "Tipo", w: 0.13 },
      { t: "Descripción", w: 0.37 }, { t: "Realizó", w: 0.16 }, { t: "Costo", w: 0.12 },
    ],
    manttos.map((m) => [
      fFecha(m.fecha), m.horometro ? conHoras(m.horometro, "h") : "", m.tipoMantto || "",
      m.descripcion || "", m.realizadoPor || "",
      m.costo ? "$" + (isNaN(Number(m.costo)) ? m.costo : Number(m.costo).toLocaleString("es-MX")) : "",
    ]),
    { vacio: "No hay mantenimientos registrados." }
  );

  // ── Pie en cada hoja ────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...ROJO_RGB);
    doc.setLineWidth(0.6);
    doc.line(M, PIE_Y, M + ancho, PIE_Y);
    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRIS);
    doc.text(`Generado el ${hoyTxt} desde MAQSISTEM`, M, PIE_Y + 4.5);
    doc.text(`Hoja ${p} de ${total}`, M + ancho, PIE_Y + 4.5, { align: "right" });
  }

  doc.save(`FICHA-EQUIPO-${String(eq.serie || eq.tipo || "EQUIPO").replace(/[^\w-]+/g, "-").toUpperCase()}.pdf`);
}
