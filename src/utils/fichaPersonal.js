import jsPDF from "jspdf";
import { ROJO_RGB, encabezadoJsPDF } from "./pdfFormato";

const fFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

export function edadDe(iso) {
  if (!iso) return "";
  const n = new Date(iso + "T00:00:00");
  const h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e -= 1;
  return e >= 0 && e < 120 ? String(e) : "";
}

export function descargarFichaPDF(persona = {}, _logoUrl, nombreArchivo = "FICHA-INGRESO") {
  const p = persona || {};
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, M = 12, ancho = W - M * 2;
  let y = 7;

  const NEGRO  = [17, 17, 17];
  const GRIS   = [130, 130, 130];
  const LINEA  = [210, 210, 210];
  const VINO   = ROJO_RGB;

  const hoy = new Date();
  const hoyTxt = `${String(hoy.getDate()).padStart(2,"0")}/${String(hoy.getMonth()+1).padStart(2,"0")}/${hoy.getFullYear()}`;

  // ── Encabezado ──────────────────────────────────────────────────────────────
  y = encabezadoJsPDF(doc, {
    titulo: "Ficha de Ingreso",
    lineas: ["MAQUINARIA SOPORTE Y LOGÍSTICA SA DE CV", "Fecha: " + hoyTxt],
    x: M, ancho, y, altoLogo: 13, separacion: 4
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  // Franja de sección
  const seccion = (titulo) => {
    doc.setFillColor(...NEGRO);
    doc.rect(M, y, ancho, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, M + 3, y + 4);
    y += 6 + 2;
  };

  // Dibuja N campos en la misma fila. Cada campo: { label, val, w } w sumando 1.
  const ROW_H = 8.5;
  const GAP   = 4;
  const campos = (lista) => {
    const totalW = ancho - GAP * (lista.length - 1);
    let x = M;
    lista.forEach(({ label = "", val = "", w = 1 }) => {
      const fw = totalW * w;
      const txt = String(val == null ? "" : val).trim();

      // etiqueta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.2);
      doc.setTextColor(...GRIS);
      doc.text(label.toUpperCase(), x, y + 3.2);

      // valor
      if (txt) {
        doc.setFont("helvetica", "normal");
        let sz = 9;
        doc.setFontSize(sz);
        while (doc.getTextWidth(txt) > fw - 1 && sz > 6.5) { sz -= 0.25; doc.setFontSize(sz); }
        doc.setTextColor(...NEGRO);
        doc.text(txt, x, y + ROW_H - 1.4);
      }

      // línea inferior
      doc.setDrawColor(...LINEA);
      doc.setLineWidth(0.22);
      doc.line(x, y + ROW_H, x + fw, y + ROW_H);

      x += fw + GAP;
    });
    y += ROW_H + 3;
  };

  // Atajos para patrones comunes
  const par  = (l1,v1,l2,v2,w1=0.5) => campos([{label:l1,val:v1,w:w1},{label:l2,val:v2,w:1-w1}]);
  const full = (label, val)          => campos([{label, val, w:1}]);

  // ── Contenido ───────────────────────────────────────────────────────────────
  seccion("DATOS DEL TRABAJADOR");
  full("Nombre completo", p.nombre);
  par("Puesto / cargo", p.puesto, "Fecha de ingreso", fFecha(p.fechaIngreso));
  par("RFC", p.rfc, "CURP", p.curp);
  par("NSS (IMSS)", p.nss, "INE / Clave electoral", p.ine);
  full("Domicilio", p.domicilio);
  par("Código postal", p.codigoPostal, "Correo electrónico", p.correo);
  par("Teléfono celular", p.telefono, "Fecha de nacimiento", fFecha(p.fechaNacimiento));
  par("Lugar de nacimiento", p.lugarNacimiento, "Tipo de sangre", p.tipoSangre);
  par("Estado civil", p.estadoCivil, "Escolaridad", p.escolaridad);
  par("Licencia de conducir", p.licencia, "Vigencia licencia", "");
  const nHijos = p.hijos ? p.hijos.filter(h => h.nombre).length : (p.numHijos || "");
  par("Número de hijos", String(nHijos || ""), "Alergias / padecimientos", p.alergias || p.condicionesMedicas || "");

  seccion("DATOS ECONÓMICOS");
  par("Crédito INFONAVIT", p.infonavit, "No. de crédito INFONAVIT", p.infonavitNumero);
  par("Crédito FONACOT",   p.fonacot,   "No. de crédito FONACOT",   p.fonacotNumero);
  par("Banco (nómina)", p.banco, "Cuenta", p.cuenta);
  par("CLABE interbancaria", p.clabe, "Tarjeta", p.tarjeta);

  seccion("HISTORIAL LABORAL");
  par("Último empleo", p.ultimoEmpleo, "Puesto desempeñado", p.ultimoPuesto);

  seccion("DATOS DEL EMPLEO");
  const sueldo = p.sueldoBase ? (isNaN(Number(p.sueldoBase)) ? p.sueldoBase : "$" + Number(p.sueldoBase).toLocaleString("es-MX")) : "";
  par("Puesto / cargo", p.puesto, "Sueldo base", sueldo);
  par("Horario de trabajo", p.horario, "Sábados", p.horarioSabado);
  par("Hora de comida", p.horarioComida, "Lugar de trabajo", p.lugarTrabajo);

  seccion("CONTACTO DE EMERGENCIA");
  par("Nombre y apellidos", p.emergenciaNombre, "Parentesco", p.emergenciaParentesco);
  par("Teléfono", p.emergenciaTelefono, "Correo electrónico", p.emergenciaCorreo);
  if (p.emergencia2Nombre) {
    par("Nombre y apellidos (2)", p.emergencia2Nombre, "Parentesco", p.emergencia2Parentesco);
    par("Teléfono", p.emergencia2Telefono, "Correo electrónico", p.emergencia2Correo);
  }

  seccion("FAMILIA");
  par("Cónyuge / pareja", p.conyugeNombre, "Teléfono del cónyuge", p.conyugeTelefono);
  par("Beneficiario", p.beneficiarioNombre, "Parentesco", p.beneficiarioParentesco);
  full("Teléfono del beneficiario", p.beneficiarioTelefono);

  if (p.notas) {
    seccion("OBSERVACIONES");
    // Área de texto multilínea
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...NEGRO);
    const lineas = doc.splitTextToSize(p.notas, ancho - 2);
    doc.text(lineas.slice(0, 4), M, y + 4);
    y += Math.min(lineas.length, 4) * 4.5 + 5;
  }

  // ── Firmas ──────────────────────────────────────────────────────────────────
  seccion("FIRMAS");
  const fw4 = (ancho - GAP * 3) / 4;
  const fxs = [M, M + fw4 + GAP, M + (fw4 + GAP) * 2, M + (fw4 + GAP) * 3];
  const labels4 = ["TRABAJADOR", "RECURSOS HUMANOS", "SUPERVISIÓN", "VO. BO."];
  const vals4   = [
    (p.nombre || "").toUpperCase(),
    "LIC. ANABEL CERINO",
    "C. ALEJANDRO BALAM",
    "LIC. FCO. TORRES"
  ];
  // Líneas de firma
  y += 14;
  fxs.forEach((fx, i) => {
    doc.setDrawColor(...LINEA);
    doc.setLineWidth(0.3);
    doc.line(fx, y, fx + fw4, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRIS);
    doc.text(labels4[i], fx + fw4 / 2, y + 3.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...NEGRO);
    doc.text(vals4[i], fx + fw4 / 2, y + 7.5, { align: "center" });
  });
  y += 12;

  // ── Pie ─────────────────────────────────────────────────────────────────────
  doc.setDrawColor(...VINO);
  doc.setLineWidth(0.7);
  doc.line(M, y, M + ancho, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRIS);
  doc.text("Documento confidencial generado desde MAQSISTEM", W / 2, y + 4, { align: "center" });

  doc.save(nombreArchivo + ".pdf");
}
