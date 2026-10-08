import jsPDF from "jspdf";
import { LOGO_MAQSOL_TRANSPARENTE, LOGO_MAQSOL_TRANSPARENTE_RELACION } from "./logoMaqsolTransparente";

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
  const H0 = 7.1;
  const ROJO = [143, 29, 44];
  let y = 9;

  doc.setLineWidth(0.25);
  doc.setDrawColor(70, 70, 70);

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
        doc.setFillColor(236, 236, 236);
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
    doc.setFillColor(58, 58, 58);
    doc.rect(M, y, ancho, 7, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.6);
    doc.setTextColor(255, 255, 255);
    doc.text(txt, W / 2, y + 4.9, { align: "center" });
    y += 7;
  };

  // ---- Título: logo + FICHA DE INGRESO - MAQSOL ----
  const altoTitulo = 20;
  doc.setFillColor(246, 246, 246);
  doc.rect(M, y, ancho, altoTitulo, "FD");
  const hLogo = 15;
  try { doc.addImage(LOGO_MAQSOL_TRANSPARENTE, "PNG", M + 4, y + (altoTitulo - hLogo) / 2, hLogo * LOGO_MAQSOL_TRANSPARENTE_RELACION, hLogo); } catch { /* sin logo */ }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(25, 25, 25);
  doc.text("FICHA DE INGRESO - MAQSOL", W / 2, y + 9.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(95, 95, 95);
  doc.text("MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", W / 2, y + 15, { align: "center" });
  // folio de la ficha a la derecha
  y += altoTitulo;
  doc.setFillColor(...ROJO);
  doc.rect(M, y, ancho, 1.4, "F");
  y += 1.4;

  encabezado("DATOS PARA NUEVO INGRESO");
  fila([["NOMBRE DE LA EMPRESA", 4, "l"], ["MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", 10, "v"], ["FECHA", 2, "l"], [hoyTxt, 4, "v"]]);

  // ---- Datos del trabajador ----
  encabezado("DATOS DEL TRABAJADOR");
  fila([["NOMBRE TRABAJADOR", 4, "l"], [p.nombre, 6, "v"], ["FECHA DE INGRESO", 4, "l"], [f(p.fechaIngreso), 6, "v"]]);
  fila([["REGISTRO FED. DE CAUSANTES", 4, "l"], [p.rfc, 6, "v"], ["CURP", 4, "l"], [p.curp, 6, "v"]]);
  fila([["DIRECCION", 4, "l"], [p.domicilio, 16, "v"]]);
  fila([["TIENE CREDITO INFONAVIT", 4, "l"], [p.infonavit, 3, "v"], ["NUMERO DE CREDITO", 4, "l"], [p.infonavitNumero, 3, "v"], ["COD. POSTAL", 3, "l"], [p.codigoPostal, 3, "v"]]);
  fila([["NUMERO DE IMSS", 4, "l"], [p.nss, 6, "v"], ["CORREO ELECTRONICO", 4, "l"], [p.correo, 6, "v"]]);
  fila([["LUGAR DE NACIMIENTO", 4, "l"], [p.lugarNacimiento, 6, "v"], ["FECHA DE NACIMIENTO", 4, "l"], [f(p.fechaNacimiento), 6, "v"]]);
  fila([["TELEFONO CELULAR", 4, "l"], [p.telefono, 6, "v"], ["PUESTO SOLICITADO", 4, "l"], [p.puesto, 6, "v"]]);
  fila([["TIENE CREDITO FONACOT", 4, "l"], [p.fonacot, 3, "v"], ["No. DE CREDITO", 4, "l"], [p.fonacotNumero, 3, "v"], ["GRADO ACADEMICO", 3, "l"], [p.escolaridad, 3, "v"]]);
  const nHijos = p.numHijos !== undefined && p.numHijos !== "" ? p.numHijos : p.hijos ? (p.hijos || []).filter((h) => h.nombre).length : "";
  fila([["TIPO DE SANGRE", 4, "l"], [p.tipoSangre, 3, "v"], ["ESTADO CIVIL", 4, "l"], [p.estadoCivil, 3, "v"], ["NUMERO DE HIJOS", 3, "l"], [String(nHijos), 3, "v"]]);
  fila([["ULTIMO EMPLEO", 4, "l"], [p.ultimoEmpleo, 6, "v"], ["PUESTO DESEMPEÑADO", 4, "l"], [p.ultimoPuesto, 6, "v"]]);

  // Cuenta para nómina (celda combinada de 2 renglones)
  {
    const wL = (ancho * 4) / 20;
    doc.setFillColor(236, 236, 236);
    doc.rect(M, y, wL, H0 * 2, "FD");
    escribe("CUENTA PARA NOMINA", M, y, wL, H0 * 2, 7, true, true);
    const xr = M + wL;
    const wr = ancho - wL;
    fila([["BANCO", 3, "l"], [p.banco, 7, "v"], ["CUENTA", 3, "l"], [p.cuenta, 3, "v"]], H0, xr, wr, 16);
    fila([["CLAVE INTERBANCARIA", 3, "l"], [p.clabe, 7, "v"], ["TARJETA", 3, "l"], [p.tarjeta, 3, "v"]], H0, xr, wr, 16);
  }

  // ---- Contacto en caso de emergencia ----
  encabezado("CONTACTO EN CASO DE EMERGENCIA");
  const contactos = [
    [p.emergenciaNombre, p.emergenciaParentesco, p.emergenciaTelefono, p.emergenciaCorreo],
    [p.emergencia2Nombre, p.emergencia2Parentesco, p.emergencia2Telefono, p.emergencia2Correo]
  ];
  contactos.forEach((c) => {
    fila([["NOMBRE Y APELLIDOS", 4, "l"], [c[0], 6, "v"], ["PARENTESCO", 4, "l"], [c[1], 6, "v"]]);
    fila([["TELEFONO", 4, "l"], [c[2], 6, "v"], ["CORREO ELECTRONICO", 4, "l"], [c[3], 6, "v"]]);
  });

  // ---- Datos del empleo ----
  encabezado("DATOS DEL EMPLEO");
  const sueldo = p.sueldoBase ? (isNaN(Number(p.sueldoBase)) ? p.sueldoBase : "$" + Number(p.sueldoBase).toLocaleString("es-MX")) : "";
  fila([["CARGO O PUESTO", 4, "l"], [p.puesto, 6, "v"], ["SUELDO BASE", 4, "l"], [sueldo, 6, "v"]]);
  fila([["HORARIOS DE TRABAJO", 4, "l"], [p.horario, 3, "v"], ["SABADOS", 4, "l"], [p.horarioSabado, 3, "v"], ["COMIDA", 3, "l"], [p.horarioComida, 3, "v"]]);
  fila([["LUGAR DE TRABAJO", 4, "l"], [p.lugarTrabajo, 16, "v"]]);
  {
    const alto = 21;
    const wL = (ancho * 4) / 20;
    doc.setFillColor(236, 236, 236);
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
  fila([["", 5, "v"], ["", 5, "v"], ["", 5, "v"], ["", 5, "v"]], 30);
  fila([[(p.nombre || "").toUpperCase(), 5, "l"], ["LIC. ANABEL CERINO AVALOS", 5, "l"], ["CESAR ALEJANDRO BALAM MOGUEL", 5, "l"], ["LIC. FRANCISCO TORRES MORALES", 5, "l"]], 8);

  doc.setFillColor(...ROJO);
  doc.rect(M, y, ancho, 1.2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(140);
  doc.text("Documento generado desde MAQSISTEM · información confidencial", W / 2, y + 5.2, { align: "center" });

  doc.save(nombreArchivo + ".pdf");
}
