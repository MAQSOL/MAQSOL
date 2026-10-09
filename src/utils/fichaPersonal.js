import jsPDF from "jspdf";
import { AZUL_RGB, AZUL_TENUE_RGB, encabezadoJsPDF } from "./pdfFormato";

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
 * FICHA DE INGRESO - MAQSOL (hoja carta completa). Sin datos (persona = {}) sale
 * en blanco para llenarla a mano; con datos sale ya llenada.
 * Todas las filas se miden sobre una rejilla de 20 columnas para que queden alineadas.
 */
export function descargarFichaPDF(persona = {}, _logoUrl, nombreArchivo = "FICHA-INGRESO") {
  const p = persona || {};
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, M = 8, ancho = W - M * 2;
  const H0 = 6.3;
  let y = 7;

  doc.setLineWidth(0.25);
  doc.setDrawColor(150, 170, 190);

  const hoy = new Date();
  const hoyTxt = `${String(hoy.getDate()).padStart(2, "0")}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${hoy.getFullYear()}`;

  // texto ajustado a la celda: reduce la letra y, si no cabe, parte en dos renglones
  const escribe = (txt, x, yy, w, h, tam, negrita, gris) => {
    const t = String(txt == null ? "" : txt).trim();
    if (!t) return;
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    let size = tam;
    doc.setFontSize(size);
    while (doc.getTextWidth(t) > w - 3 && size > 6) {
      size -= 0.3;
      doc.setFontSize(size);
    }
    doc.setTextColor(gris ? 85 : 15);
    if (doc.getTextWidth(t) <= w - 3) {
      doc.text(t, x + w / 2, yy + h / 2 + size * 0.17, { align: "center" });
    } else {
      const lin = doc.splitTextToSize(t, w - 3).slice(0, 2);
      doc.setFontSize(6.4);
      lin.forEach((l, k) => doc.text(l, x + w / 2, yy + h / 2 - (lin.length - 1) * 1.7 + k * 3.4 + 0.9, { align: "center" }));
    }
  };

  // celdas: [texto, unidades de 20, "l" etiqueta | "v" valor]
  const fila = (celdas, alto = H0, x0 = M, anchoTotal = ancho, unidades = 20) => {
    let x = x0;
    celdas.forEach(([txt, u, tipo]) => {
      const w = (anchoTotal * u) / unidades;
      if (tipo === "l") {
        doc.setFillColor(...AZUL_TENUE_RGB);
        doc.rect(x, y, w, alto, "FD");
        escribe(txt, x, y, w, alto, 7, true, true);
      } else {
        doc.rect(x, y, w, alto);
        escribe(txt, x, y, w, alto, 9, false, false);
      }
      x += w;
    });
    y += alto;
  };

  const encabezado = (txt) => {
    doc.setFillColor(...AZUL_RGB);
    doc.rect(M, y, ancho, 7, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.6);
    doc.setTextColor(255, 255, 255);
    doc.text(txt, M + 3, y + 4.9);
    y += 7;
  };

  // ---- Encabezado del diseño único (título azul, logo a la derecha, línea azul) ----
  y = encabezadoJsPDF(doc, { titulo: "Ficha de Ingreso", lineas: ["MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", "Fecha: " + hoyTxt], x: M, ancho, y, altoLogo: 14, separacion: 3 });
  doc.setLineWidth(0.25);
  doc.setDrawColor(150, 170, 190);

  encabezado("DATOS PARA NUEVO INGRESO");
  fila([["NOMBRE DE LA EMPRESA", 4, "l"], ["MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", 10, "v"], ["FECHA", 2, "l"], [hoyTxt, 4, "v"]]);

  // ---- Datos del trabajador (rejilla fija: etiqueta 4 | valor 6 | etiqueta 4 | valor 6) ----
  const par = (e1, v1, e2, v2) => fila([[e1, 4, "l"], [v1, 6, "v"], [e2, 4, "l"], [v2, 6, "v"]]);
  const completa = (e1, v1) => fila([[e1, 4, "l"], [v1, 16, "v"]]);
  const nHijos = p.numHijos !== undefined && p.numHijos !== "" ? p.numHijos : p.hijos ? (p.hijos || []).filter((h) => h.nombre).length : "";

  encabezado("DATOS DEL TRABAJADOR");
  par("NOMBRE TRABAJADOR", p.nombre, "FECHA DE INGRESO", f(p.fechaIngreso));
  par("RFC", p.rfc, "CURP", p.curp);
  completa("DIRECCION", p.domicilio);
  par("CODIGO POSTAL", p.codigoPostal, "CORREO ELECTRONICO", p.correo);
  par("NUMERO DE IMSS", p.nss, "TELEFONO CELULAR", p.telefono);
  par("LUGAR DE NACIMIENTO", p.lugarNacimiento, "FECHA DE NACIMIENTO", f(p.fechaNacimiento));
  par("ESTADO CIVIL", p.estadoCivil, "TIPO DE SANGRE", p.tipoSangre);
  par("NUMERO DE HIJOS", String(nHijos), "GRADO ACADEMICO", p.escolaridad);
  par("TIENE CREDITO INFONAVIT", p.infonavit, "No. CREDITO INFONAVIT", p.infonavitNumero);
  par("TIENE CREDITO FONACOT", p.fonacot, "No. CREDITO FONACOT", p.fonacotNumero);
  par("ULTIMO EMPLEO", p.ultimoEmpleo, "PUESTO DESEMPEÑADO", p.ultimoPuesto);
  completa("PUESTO SOLICITADO", p.puesto);

  encabezado("CUENTA PARA NOMINA");
  par("BANCO", p.banco, "CUENTA", p.cuenta);
  par("CLAVE INTERBANCARIA", p.clabe, "TARJETA", p.tarjeta);

  // ---- Contacto en caso de emergencia ----
  encabezado("CONTACTO EN CASO DE EMERGENCIA");
  const contactos = [
    [p.emergenciaNombre, p.emergenciaParentesco, p.emergenciaTelefono, p.emergenciaCorreo],
    [p.emergencia2Nombre, p.emergencia2Parentesco, p.emergencia2Telefono, p.emergencia2Correo]
  ];
  contactos.forEach((c) => {
    par("NOMBRE Y APELLIDOS", c[0], "PARENTESCO", c[1]);
    par("TELEFONO", c[2], "CORREO ELECTRONICO", c[3]);
  });

  // ---- Datos del empleo ----
  encabezado("DATOS DEL EMPLEO");
  const sueldo = p.sueldoBase ? (isNaN(Number(p.sueldoBase)) ? p.sueldoBase : "$" + Number(p.sueldoBase).toLocaleString("es-MX")) : "";
  par("CARGO O PUESTO", p.puesto, "SUELDO BASE", sueldo);
  par("HORARIOS DE TRABAJO", p.horario, "SABADOS", p.horarioSabado);
  completa("COMIDA", p.horarioComida);
  completa("LUGAR DE TRABAJO", p.lugarTrabajo);
  {
    const alto = 13;
    const wL = (ancho * 4) / 20;
    doc.setFillColor(...AZUL_TENUE_RGB);
    doc.rect(M, y, wL, alto, "FD");
    escribe("OBSERVACIONES", M, y, wL, alto, 7, true, true);
    doc.rect(M + wL, y, ancho - wL, alto);
    if (p.notas) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.6);
      doc.setTextColor(15);
      doc.text(doc.splitTextToSize(String(p.notas), ancho - wL - 5).slice(0, 5), M + wL + 2.5, y + 5);
    }
    y += alto;
  }

  // ---- Firmas ----
  encabezado("FIRMAS");
  fila([["TRABAJADOR", 5, "l"], ["RECURSOS HUMANOS", 5, "l"], ["SUPERVISION", 5, "l"], ["VO. BO.", 5, "l"]], 6.5);
  fila([["", 5, "v"], ["", 5, "v"], ["", 5, "v"], ["", 5, "v"]], 24);
  fila([[(p.nombre || "").toUpperCase(), 5, "l"], ["LIC. ANABEL CERINO AVALOS", 5, "l"], ["CESAR ALEJANDRO BALAM MOGUEL", 5, "l"], ["LIC. FRANCISCO TORRES MORALES", 5, "l"]], 8);

  doc.setFillColor(...AZUL_RGB);
  doc.rect(M, y, ancho, 0.8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(140);
  doc.text("Documento generado desde MAQSISTEM · información confidencial", W / 2, y + 5.2, { align: "center" });

  doc.save(nombreArchivo + ".pdf");
}
