import jsPDF from "jspdf";

const AZUL = [29, 92, 143];

const f = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? "" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/** Ficha técnica del equipo para el cliente (solo datos públicos, sin costos). */
export function descargarFichaEquipoPDF(eq, logoUrl) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, H = 279, M = 16, ancho = W - M * 2;
  let y = 0;

  const cabecera = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text("MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", M, 11);
    doc.setFont("helvetica", "normal");
    doc.text("Ficha técnica del equipo", M, 15);
    if (logoUrl) {
      try { doc.addImage(logoUrl, "PNG", W - M - 22, 4, 22, 11); } catch { /* sin logo */ }
    }
    doc.setDrawColor(...AZUL);
    doc.setLineWidth(0.5);
    doc.line(M, 18, W - M, 18);
    y = 25;
  };
  const nueva = () => { doc.addPage(); cabecera(); };
  const asegura = (alto) => { if (y + alto > H - 14) nueva(); };

  cabecera();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(20, 20, 20);
  doc.text(eq.tipo || "Equipo", M, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(`${eq.marca || ""} ${eq.modelo || ""}`.trim() + (eq.serie ? `  ·  Serie ${eq.serie}` : ""), M, y + 11.5);
  y += 18;

  let anchoFoto = 0;
  if (eq.fotoUrl) {
    try {
      const formato = /^data:image\/png/.test(eq.fotoUrl) ? "PNG" : "JPEG";
      doc.addImage(eq.fotoUrl, formato, W - M - 62, y, 62, 46);
      anchoFoto = 66;
    } catch { /* sin foto */ }
  }

  const datos = [
    ["Año", eq.anio], ["Motor", eq.motor], ["Capacidad", eq.capacidad], ["Combustible", eq.combustible],
    ["Horómetro actual", eq.horometro ? `${eq.horometro}` : ""], ["Próximo mantenimiento", f(eq.proximoMantto)]
  ].filter(([, v]) => v);

  doc.setFontSize(10);
  datos.forEach(([k, v], i) => {
    const yy = y + 4 + i * 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...AZUL);
    doc.text(k.toUpperCase(), M, yy - 3);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(String(v), M, yy + 1.5, { maxWidth: ancho - anchoFoto });
  });
  y += Math.max(datos.length * 8, eq.fotoUrl ? 48 : 0) + 8;

  doc.setFillColor(...AZUL);
  doc.rect(M, y, ancho, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("HISTORIAL DE MANTENIMIENTOS", M + 2, y + 4.8);
  y += 10;

  const lista = eq.mantenimientos || [];
  if (!lista.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text("Aún no hay mantenimientos registrados.", M, y + 3);
    y += 8;
  }

  lista.forEach((m) => {
    const desc = doc.splitTextToSize(m.descripcion || "Sin descripción", ancho - 4);
    const alto = 12 + desc.length * 4.2;
    asegura(alto);
    doc.setDrawColor(215);
    doc.setLineWidth(0.2);
    doc.line(M, y - 1, W - M, y - 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(`${f(m.fecha) || "Sin fecha"}  ·  ${m.tipoMantto || ""}${m.horometro ? `  ·  ${m.horometro} h` : ""}`, M, y + 4);
    if (m.realizadoPor) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Realizó: ${m.realizadoPor}`, W - M, y + 4, { align: "right" });
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    doc.text(desc, M, y + 9);
    y += alto;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-MX")} desde el código QR del equipo.`, M, H - 8);

  doc.save(`FICHA-${(eq.serie || eq.tipo || "EQUIPO").toString().replace(/\s+/g, "-").toUpperCase()}.pdf`);
}
