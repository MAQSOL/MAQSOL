import jsPDF from "jspdf";

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
 * FICHA DE INGRESO (formato de MAQSOL, una hoja carta). Sin datos (persona = {})
 * sale en blanco para llenarla a mano; con datos sale ya llenada.
 */
export function descargarFichaPDF(persona = {}, logoUrl, nombreArchivo = "FICHA-INGRESO") {
  const p = persona || {};
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const W = 216, M = 12, ancho = W - M * 2;
  const H0 = 6.6;
  let y = 10;

  doc.setLineWidth(0.25);
  doc.setDrawColor(40, 40, 40);

  const hoy = new Date();
  const hoyTxt = `${String(hoy.getDate()).padStart(2, "0")}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${hoy.getFullYear()}`;

  // texto ajustado a la celda: reduce la letra y, si no cabe, parte en dos renglones
  const escribe = (txt, x, yy, w, h, tam, negrita, gris) => {
    const t = String(txt == null ? "" : txt).trim();
    if (!t) return;
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    let size = tam;
    doc.setFontSize(size);
    while (doc.getTextWidth(t) > w - 2.4 && size > 6) {
      size -= 0.4;
      doc.setFontSize(size);
    }
    doc.setTextColor(gris ? 70 : 15);
    if (doc.getTextWidth(t) <= w - 2.4) {
      doc.text(t, x + w / 2, yy + h / 2 + size * 0.17, { align: "center" });
    } else {
      const lin = doc.splitTextToSize(t, w - 2.4).slice(0, 2);
      doc.setFontSize(6.2);
      lin.forEach((l, k) => doc.text(l, x + w / 2, yy + h / 2 - (lin.length - 1) * 1.6 + k * 3.2 + 1, { align: "center" }));
    }
  };

  // celdas: ["texto", ancho relativo, "l" etiqueta | "v" valor]
  const fila = (celdas, alto = H0, x0 = M, anchoTotal = ancho) => {
    const total = celdas.reduce((a, c) => a + c[1], 0);
    let x = x0;
    celdas.forEach(([txt, rel, tipo]) => {
      const w = (anchoTotal * rel) / total;
      if (tipo === "l") {
        doc.setFillColor(222, 222, 222);
        doc.rect(x, y, w, alto, "FD");
        escribe(txt, x, y, w, alto, 6.8, false, true);
      } else {
        doc.rect(x, y, w, alto);
        escribe(txt, x, y, w, alto, 8.4, false, false);
      }
      x += w;
    });
    y += alto;
  };

  const encabezado = (txt) => {
    doc.setFillColor(205, 205, 205);
    doc.rect(M, y, ancho, 6.6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.6);
    doc.setTextColor(15);
    doc.text(txt, W / 2, y + 4.6, { align: "center" });
    y += 6.6;
  };

  // ---- Título ----
  doc.rect(M, y, ancho, 11);
  if (logoUrl) {
    try { doc.addImage(logoUrl, "PNG", M + 2, y + 1, 18, 9); } catch { /* sin logo */ }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15);
  doc.text("FICHA DE INGRESO", W / 2, y + 7.6, { align: "center" });
  y += 11;
  encabezado("DATOS PARA NUEVO INGRESO");
  fila([["NOMBRE DE LA EMPRESA", 2.2, "l"], ["MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", 4.8, "v"], ["FECHA", 1, "l"], [hoyTxt, 1.6, "v"]]);

  // ---- Datos del trabajador ----
  encabezado("DATOS DEL TRABAJADOR");
  fila([["NOMBRE TRABAJADOR", 2.2, "l"], [p.nombre, 4.6, "v"], ["FECHA DE INGRESO", 1.8, "l"], [f(p.fechaIngreso), 1.4, "v"]]);
  fila([["REGISTRO FEDERAL DE CAUSANTES", 2.2, "l"], [p.rfc, 2.5, "v"], ["CURP", 0.8, "l"], [p.curp, 3.2, "v"]]);
  fila([["DIRECCION", 2.2, "l"], [p.domicilio, 8.5, "v"]]);
  fila([["TIENE CREDITO INFONAVIT", 2.2, "l"], [p.infonavit, 1.4, "v"], ["NUMERO DE CREDITO", 1.8, "l"], [p.infonavitNumero, 1.5, "v"], ["COD. POSTAL", 1.1, "l"], [p.codigoPostal, 1, "v"]]);
  fila([["NUMERO DE IMSS", 2.2, "l"], [p.nss, 2.6, "v"], ["CORREO ELECTRONICO", 1.8, "l"], [p.correo, 3.2, "v"]]);
  fila([["LUGAR DE NACIMIENTO", 2.2, "l"], [p.lugarNacimiento, 2.6, "v"], ["FECHA DE NACIMIENTO", 1.8, "l"], [f(p.fechaNacimiento), 3.2, "v"]]);
  fila([["TELEFONO CELULAR", 2.2, "l"], [p.telefono, 2.6, "v"], ["PUESTO SOLICITADO", 1.8, "l"], [p.puesto, 3.2, "v"]]);
  fila([["TIENE CREDITO FONACOT", 2.2, "l"], [p.fonacot, 1.4, "v"], ["No. CREDITO", 1.2, "l"], [p.fonacotNumero, 1.5, "v"], ["GRADO ACADEMICO", 1.6, "l"], [p.escolaridad, 1.6, "v"]]);
  const nHijos = p.numHijos !== undefined && p.numHijos !== "" ? p.numHijos : p.hijos ? (p.hijos || []).filter((h) => h.nombre).length : "";
  fila([["TIPO DE SANGRE", 2.2, "l"], [p.tipoSangre, 1.4, "v"], ["ESTADO CIVIL", 1.2, "l"], [p.estadoCivil, 1.5, "v"], ["NUMERO DE HIJOS", 1.6, "l"], [String(nHijos), 1.6, "v"]]);
  fila([["ULTIMO EMPLEO", 2.2, "l"], [p.ultimoEmpleo, 3.4, "v"], ["PUESTO DESEMPEÑADO", 1.8, "l"], [p.ultimoPuesto, 2.8, "v"]]);

  // Cuenta para nómina (celda combinada de 2 renglones)
  {
    const wL = (ancho * 2.2) / 10.2;
    doc.setFillColor(222, 222, 222);
    doc.rect(M, y, wL, H0 * 2, "FD");
    escribe("CUENTA PARA NOMINA", M, y, wL, H0 * 2, 6.8, false, true);
    const xr = M + wL;
    const wr = ancho - wL;
    fila([["BANCO", 1.2, "l"], [p.banco, 3, "v"], ["CUENTA", 1.2, "l"], [p.cuenta, 2.6, "v"]], H0, xr, wr);
    fila([["CLAVE INTERBANCARIA", 1.2, "l"], [p.clabe, 3, "v"], ["TARJETA", 1.2, "l"], [p.tarjeta, 2.6, "v"]], H0, xr, wr);
  }

  // ---- Contacto en caso de emergencia ----
  encabezado("CONTACTO EN CASO DE EMERGENCIA");
  const contactos = [
    [p.emergenciaNombre, p.emergenciaParentesco, p.emergenciaTelefono, p.emergenciaCorreo],
    [p.emergencia2Nombre, p.emergencia2Parentesco, p.emergencia2Telefono, p.emergencia2Correo]
  ];
  contactos.forEach((c) => {
    fila([["NOMBRE Y APELLIDOS", 2.2, "l"], [c[0], 3.4, "v"], ["PARENTESCO", 1.6, "l"], [c[1], 2.4, "v"]]);
    fila([["TELEFONO", 2.2, "l"], [c[2], 2.8, "v"], ["CORREO ELECTRONICO", 1.8, "l"], [c[3], 3.4, "v"]]);
  });

  // ---- Datos del empleo ----
  encabezado("DATOS DEL EMPLEO");
  fila([["CARGO O PUESTO", 2.2, "l"], [p.puesto, 4, "v"], ["SUELDO BASE", 1.6, "l"], [p.sueldoBase ? (isNaN(Number(p.sueldoBase)) ? p.sueldoBase : "$" + Number(p.sueldoBase).toLocaleString("es-MX")) : "", 2.4, "v"]]);
  fila([["HORARIOS DE TRABAJO", 2.2, "l"], [p.horario, 2.6, "v"], ["SABADOS", 1.1, "l"], [p.horarioSabado, 1.9, "v"], ["COMIDA", 1, "l"], [p.horarioComida, 1.9, "v"]]);
  fila([["LUGAR DE TRABAJO", 2.2, "l"], [p.lugarTrabajo, 8.5, "v"]]);
  {
    const alto = 18;
    const wL = (ancho * 2.2) / 10.7;
    doc.setFillColor(222, 222, 222);
    doc.rect(M, y, wL, alto, "FD");
    escribe("OBSERVACIONES", M, y, wL, alto, 6.8, false, true);
    doc.rect(M + wL, y, ancho - wL, alto);
    if (p.notas) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15);
      doc.text(doc.splitTextToSize(String(p.notas), ancho - wL - 4).slice(0, 5), M + wL + 2, y + 4.5);
    }
    y += alto;
  }

  // ---- Firmas ----
  doc.setFillColor(205, 205, 205);
  fila([["TRABAJADOR", 1, "l"], ["RECURSOS HUMANOS", 1, "l"], ["SUPERVISION", 1, "l"], ["VO. BO.", 1, "l"]], 6);
  fila([["", 1, "v"], ["", 1, "v"], ["", 1, "v"], ["", 1, "v"]], 30);
  fila([[(p.nombre || "").toUpperCase(), 1, "l"], ["LIC. ANABEL CERINO AVALOS", 1, "l"], ["CESAR ALEJANDRO BALAM MOGUEL", 1, "l"], ["LIC. FRANCISCO TORRES MORALES", 1, "l"]], 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(150);
  doc.text("Documento generado desde MAQSISTEM · información confidencial", W / 2, y + 5, { align: "center" });

  doc.save(nombreArchivo + ".pdf");
}
