import jsPDF from "jspdf";

const AZUL = [29, 92, 143];

const f = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export function edadDe(iso) {
  if (!iso) return "";
  const n = new Date(iso + "T00:00:00");
  const h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e -= 1;
  return e >= 0 && e < 120 ? String(e) : "";
}

/**
 * Ficha de datos del empleado. Sin datos (persona = {}) sale en blanco, para
 * que el empleado la llene a mano; con datos sale ya llenada.
 */
export function descargarFichaPDF(persona = {}, logoUrl, nombreArchivo = "FICHA-EMPLEADO") {
  const p = persona || {};
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, H = 279, M = 16, ancho = W - M * 2;
  let y = 0;

  const cabecera = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text("MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", M, 11);
    doc.setFont("helvetica", "normal");
    doc.text("Recursos Humanos · Ficha de datos del empleado", M, 15);
    if (logoUrl) {
      try { doc.addImage(logoUrl, "PNG", W - M - 22, 4, 22, 11); } catch { /* sin logo */ }
    }
    doc.setDrawColor(...AZUL);
    doc.setLineWidth(0.5);
    doc.line(M, 18, W - M, 18);
    y = 24;
  };
  const nueva = () => { doc.addPage(); cabecera(); };
  const asegura = (alto) => { if (y + alto > H - 14) nueva(); };

  const seccion = (titulo) => {
    asegura(16);
    doc.setFillColor(...AZUL);
    doc.rect(M, y, ancho, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, M + 2, y + 4.5);
    y += 9;
  };

  // fila de campos: cada campo = [etiqueta, valor, ancho relativo]
  const fila = (campos) => {
    const total = campos.reduce((s, c) => s + (c[2] || 1), 0);
    const partes = campos.map((c) => {
      const w = (ancho * (c[2] || 1)) / total;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const lineas = c[1] ? doc.splitTextToSize(String(c[1]), w - 3).slice(0, 2) : [];
      return { w, etiqueta: c[0], lineas };
    });
    const nLineas = Math.max(1, ...partes.map((x) => x.lineas.length));
    const alto = 9.5 + (nLineas - 1) * 4;
    asegura(alto + 1);
    let x = M;
    partes.forEach((c) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(120, 120, 120);
      doc.text(c.etiqueta.toUpperCase(), x + 1, y + 2.6);
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      c.lineas.forEach((ln, i) => doc.text(ln, x + 1, y + 7 + i * 4));
      doc.setDrawColor(170);
      doc.setLineWidth(0.2);
      doc.line(x + 0.5, y + alto - 1, x + c.w - 2, y + alto - 1);
      x += c.w;
    });
    y += alto + 1.5;
  };

  cabecera();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(20, 20, 20);
  doc.text("FICHA DE DATOS DEL EMPLEADO", W / 2, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Llena con letra clara. La información es confidencial y se usa solo para tu expediente laboral.", W / 2, y + 9.5, { align: "center" });
  y += 15;

  seccion("DATOS PERSONALES");
  fila([["Nombre completo", p.nombre, 3], ["Puesto", p.puesto, 2]]);
  fila([["Fecha de nacimiento", f(p.fechaNacimiento)], ["Edad", edadDe(p.fechaNacimiento), 0.5], ["Lugar de nacimiento", p.lugarNacimiento, 1.5], ["Estado civil", p.estadoCivil]]);
  fila([["CURP", p.curp, 1.4], ["RFC", p.rfc], ["No. Seguro Social (IMSS)", p.nss]]);
  fila([["INE (clave o número)", p.ine], ["Licencia de conducir (no. y vigencia)", p.licencia], ["Escolaridad", p.escolaridad]]);
  fila([["Domicilio completo", p.domicilio]]);
  fila([["Teléfono", p.telefono], ["Correo electrónico", p.correo, 1.6], ["Fecha de ingreso", f(p.fechaIngreso)]]);

  seccion("SALUD");
  fila([["Tipo de sangre", p.tipoSangre, 0.7], ["Alergias", p.alergias, 2]]);
  fila([["Padecimientos o medicamentos que debamos conocer", p.condicionesMedicas]]);

  seccion("FAMILIA");
  fila([["Nombre del cónyuge / pareja", p.conyugeNombre, 2], ["Teléfono del cónyuge", p.conyugeTelefono]]);
  const hijos = (p.hijos || []).filter((h) => h.nombre);
  const tieneHijos = p.hijos ? (hijos.length ? `Sí (${hijos.length})` : "No") : "";
  fila([["¿Tiene hijos?", tieneHijos, 0.7]]);
  const filasHijos = Math.max(3, hijos.length);
  for (let i = 0; i < filasHijos; i++) {
    fila([[`Hijo(a) ${i + 1} · nombre`, hijos[i]?.nombre, 2], ["Fecha de nacimiento", f(hijos[i]?.fechaNacimiento)]]);
  }
  fila([["Beneficiario (en caso de fallecimiento)", p.beneficiarioNombre, 2], ["Parentesco", p.beneficiarioParentesco], ["Teléfono", p.beneficiarioTelefono]]);

  seccion("CONTACTO DE EMERGENCIA (aparte del cónyuge)");
  fila([["Nombre", p.emergenciaNombre, 2], ["Parentesco", p.emergenciaParentesco], ["Teléfono", p.emergenciaTelefono]]);

  seccion("ÚLTIMOS DOS EMPLEOS");
  const empleos = p.empleos || [];
  [0, 1].forEach((i) => {
    const e = empleos[i] || {};
    asegura(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...AZUL);
    doc.text(i === 0 ? "Empleo más reciente" : "Empleo anterior", M + 1, y + 2);
    y += 3.5;
    fila([["Empresa", e.empresa, 2], ["Puesto", e.puesto, 1.4]]);
    fila([["Desde", f(e.desde), 0.9], ["Hasta", f(e.hasta), 0.9], ["Duración", e.duracion, 0.9], ["Tel. de referencia", e.telefono]]);
    fila([["Motivo de renuncia o salida", e.motivo]]);
  });

  asegura(48);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  const decl = doc.splitTextToSize(
    "Declaro bajo protesta de decir verdad que los datos anotados son ciertos y autorizo a la empresa a verificarlos. Me comprometo a informar cualquier cambio en mis datos.",
    ancho
  );
  doc.text(decl, M, y);
  y += decl.length * 4 + 16;
  doc.setDrawColor(60);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 75, y);
  doc.line(W - M - 60, y, W - M, y);
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text("Firma del empleado", M + 37.5, y + 4.5, { align: "center" });
  doc.text("Fecha", W - M - 30, y + 4.5, { align: "center" });
  if (p.nombre) doc.text(p.nombre, M + 37.5, y + 9, { align: "center", maxWidth: 74 });

  doc.save(nombreArchivo + ".pdf");
}

