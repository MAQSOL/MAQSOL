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
  // Salto de página si no cabe el siguiente bloque
  // Hoja carta = 279.4 mm. El contenido termina en LIMITE y el pie va fijo abajo
  // con margen, para que nada quede pegado al borde inferior.
  const LIMITE = 250;
  const PIE_Y  = 262;
  const asegura = (alto) => {
    if (y + alto > LIMITE) {
      doc.addPage();
      // Encabezado corto en hojas siguientes
      y = 12;
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRIS);
      doc.text("FICHA DE INGRESO" + (p.nombre ? "  ·  " + String(p.nombre).toUpperCase() : ""), M, y + 3);
      doc.setDrawColor(...VINO);
      doc.setLineWidth(0.5);
      doc.line(M, y + 5.5, M + ancho, y + 5.5);
      y += 10;
    }
  };

  // Franja de sección
  const seccion = (titulo) => {
    asegura(6 + 2 + 11.5);
    doc.setFillColor(...NEGRO);
    doc.rect(M, y, ancho, 6, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, M + 3, y + 4);
    y += 6 + 2;
  };

  // Dibuja N campos en la misma fila. Cada campo: { label, val, w } w sumando 1.
  const ROW_H = 8.5;
  const GAP   = 4;
  const campos = (lista) => {
    asegura(ROW_H + 3);
    const totalW = ancho - GAP * (lista.length - 1);
    let x = M;
    lista.forEach(({ label = "", val = "", w = 1 }) => {
      const fw = totalW * w;
      const txt = String(val == null ? "" : val).trim();

      // etiqueta
      doc.setFont("courier", "bold");
      doc.setFontSize(6.2);
      doc.setTextColor(...GRIS);
      doc.text(label.toUpperCase(), x, y + 3.2);

      // valor
      if (txt) {
        doc.setFont("courier", "normal");
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
  par("Licencia de conducir", p.licencia, "Vigencia licencia", fFecha(p.licenciaVence));
  const hijos = (p.hijos || []).filter(h => h && h.nombre);
  const nHijos = hijos.length || p.numHijos || "";
  const edad = edadDe(p.fechaNacimiento);
  par("Número de hijos", String(nHijos || "0"), "Edad", edad ? edad + " años" : "");
  par("Alergias", p.alergias, "Condiciones médicas", p.condicionesMedicas);

  seccion("DATOS ECONÓMICOS");
  par("Crédito INFONAVIT", p.infonavit, "No. de crédito INFONAVIT", p.infonavitNumero);
  par("Crédito FONACOT",   p.fonacot,   "No. de crédito FONACOT",   p.fonacotNumero);
  par("Banco (nómina)", p.banco, "Cuenta", p.cuenta);
  par("CLABE interbancaria", p.clabe, "Tarjeta", p.tarjeta);

  seccion("HISTORIAL LABORAL");
  par("Último empleo", p.ultimoEmpleo, "Puesto desempeñado", p.ultimoPuesto);

  // La sección del empleo va completa (no se parte entre hojas)
  asegura(8 + 4 * (ROW_H + 3));
  seccion("DATOS DEL EMPLEO");
  const sueldo = p.sueldoBase ? (isNaN(Number(p.sueldoBase)) ? p.sueldoBase : "$" + Number(p.sueldoBase).toLocaleString("es-MX")) : "";
  par("Puesto / cargo", p.puesto, "Sueldo base", sueldo);
  par("Tipo de nómina", p.tipoNomina || "", "Horario de trabajo", p.horario);
  par("Sábados", p.horarioSabado, "Hora de comida", p.horarioComida);
  full("Lugar de trabajo", p.lugarTrabajo);

  const contacto = (n, par_, tel) => campos([
    { label: "Nombre y apellidos", val: n, w: 0.45 },
    { label: "Parentesco", val: par_, w: 0.25 },
    { label: "Teléfono", val: tel, w: 0.30 },
  ]);
  seccion("CONTACTO DE EMERGENCIA");
  contacto(p.emergenciaNombre, p.emergenciaParentesco, p.emergenciaTelefono);
  if (p.emergencia2Nombre && !p.sinContacto2) {
    contacto(p.emergencia2Nombre, p.emergencia2Parentesco, p.emergencia2Telefono);
  }

  seccion("FAMILIA");
  par(p.familiarParentesco || "Cónyuge / pareja", p.conyugeNombre, "Teléfono", p.conyugeTelefono);
  par("Beneficiario", p.beneficiarioNombre, "Parentesco", p.beneficiarioParentesco);
  par("Teléfono del beneficiario", p.beneficiarioTelefono, "Correo del beneficiario", p.beneficiarioCorreo);
  full("Dirección del beneficiario", p.beneficiarioDireccion);
  hijos.forEach((h, i) => {
    const e = edadDe(h.fechaNacimiento);
    const nac = fFecha(h.fechaNacimiento);
    par(`Hijo(a) ${i + 1}`, h.nombre, "Fecha de nacimiento / edad", nac ? nac + (e ? `  (${e} años)` : "") : "");
  });

  if (p.notas) {
    seccion("OBSERVACIONES");
    // Área de texto multilínea (todas las líneas, con salto de página)
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...NEGRO);
    const lineas = doc.splitTextToSize(String(p.notas), ancho - 2);
    lineas.forEach((ln) => {
      asegura(4.5);
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...NEGRO);
      doc.text(ln, M, y + 4);
      y += 4.5;
    });
    y += 5;
  }

  // ── Firmas ──────────────────────────────────────────────────────────────────
  asegura(8 + 20 + 10);
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
  y += 20; // espacio para firmar
  fxs.forEach((fx, i) => {
    doc.setDrawColor(...LINEA);
    doc.setLineWidth(0.3);
    doc.line(fx, y, fx + fw4, y);
    doc.setFont("courier", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRIS);
    doc.text(labels4[i], fx + fw4 / 2, y + 3.5, { align: "center" });
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...NEGRO);
    doc.text(vals4[i], fx + fw4 / 2, y + 7.5, { align: "center" });
  });
  y += 12;

  // ── Pie fijo en cada hoja, con margen inferior ─────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...VINO);
    doc.setLineWidth(0.7);
    doc.line(M, PIE_Y, M + ancho, PIE_Y);
    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRIS);
    doc.text("Documento confidencial generado desde MAQSISTEM", M, PIE_Y + 4.5);
    doc.text(`Hoja ${i} de ${total}`, M + ancho, PIE_Y + 4.5, { align: "right" });
  }

  doc.save(nombreArchivo + ".pdf");
}
