import Layout from "../../components/Layout";import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

import logoMaqsol from "../../assets/maqsolrefacciones.png";
import margen from "../../assets/margen.png";
import "./Ventas.css";
import DeleteButton from "../../components/DeleteButton";
import { useCotizaciones } from "../../hooks/useCotizaciones";
import { useSharedTable } from "../../hooks/useSharedTable";

function Refacciones() {

// ==========================
// DATOS CLIENTE
// ==========================

const [cliente, setCliente] = useState("");
const [clienteOtro, setClienteOtro] = useState("");
const [historialAbierto, setHistorialAbierto] = useState(false);
const [editandoId, setEditandoId] = useState(null);
const navigate = useNavigate();
const { registros: clientesGuardados } = useSharedTable("clientes");
const { registros: cotizaciones, guardar: guardarCotizacionDB } = useCotizaciones("refaccion");

const [contacto, setContacto] = useState("");
const [telefono, setTelefono] = useState("");
const [correo, setCorreo] = useState("");
const [ubicacion, setUbicacion] = useState("");
const [ordenCompra, setOrdenCompra] = useState("");

// ==========================
// DATOS EQUIPO
// ==========================

const [tipoEquipo, setTipoEquipo] = useState("");
const [modelo, setModelo] = useState("");
const [serie, setSerie] = useState("");

// ==========================
// DATOS COTIZACION
// ==========================

const [folio, setFolio] = useState("");
const [numeroFolio, setNumeroFolio] = useState("");

useEffect(() => {
  const f = new Date();
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const anio = f.getFullYear();
  setFolio(`COT-S${numeroFolio}-${mes}${anio}`);
}, [numeroFolio]);

const [fecha, setFecha] = useState(
  new Date().toLocaleDateString("es-MX")
);

const [vigencia, setVigencia] =
  useState("15 días");

const [condiciones, setCondiciones] =
  useState("Contado");

const [vendedor, setVendedor] =
  useState("");
const [vendedorOtro, setVendedorOtro] = useState("");

// ==========================
// REFACCIONES
// ==========================

const [refacciones, setRefacciones] = useState([
  {
    cantidad: 1,
    referencia: "",
    descripcion: "",
    tiempoEntrega: "",
    usoEn: "",
    precioUnitario: "",
    total: ""
  }
]);

const agregarRefaccion = () => {

  setRefacciones([
    ...refacciones,
    {
      cantidad: 1,
      referencia: "",
      descripcion: "",
      tiempoEntrega: "",
      usoEn: "",
      precioUnitario: "",
      total: ""
    }
  ]);

};

const actualizarRefaccion = (
  index,
  campo,
  valor
) => {

  const nuevas = [...refacciones];

  nuevas[index][campo] = valor;

  if (
    campo === "cantidad" ||
    campo === "precioUnitario"
  ) {

    nuevas[index].total =
      (
        Number(nuevas[index].cantidad || 0) *
        Number(nuevas[index].precioUnitario || 0)
      ).toFixed(2);

  }

  setRefacciones(nuevas);

};

const eliminarRefaccion = (index) => {

  const nuevas =
    refacciones.filter(
      (_, i) => i !== index
    );

  setRefacciones(nuevas);

};

// ==========================
// OBSERVACIONES
// ==========================

const [observaciones, setObservaciones] = useState("");
const [usoMaterial, setUsoMaterial] =
  useState("Mantenimiento Preventivo");

  // ==========================
  // COTIZACIONES
  // ==========================


  // ==========================
  // GUARDAR
  // ==========================

  const guardarCotizacion = async () => {

const clienteFinal = cliente === "Otro" ? clienteOtro : cliente;

    if (!folio || !clienteFinal) {
      alert("Debe capturar Folio y Cliente");
      return;
    }

const nuevaCotizacion = {
  id: editandoId || String(Date.now()),

  folio,
  numeroFolio,
  fecha,
  vigencia,
  condiciones,
  vendedor: vendedor === "Otro" ? vendedorOtro : vendedor,

  cliente: clienteFinal,
  contacto,
  telefono,
  correo,
  ubicacion,
  ordenCompra,

  tipoEquipo,
  modelo,
  serie,

  refacciones,

  usoMaterial,
  observaciones
};

    const { id, ...datosCotizacion } = nuevaCotizacion;
    const ok = await guardarCotizacionDB(id, datosCotizacion);

    if (ok) {
      setEditandoId(id);
      alert(editandoId ? "Cotización actualizada correctamente" : "Cotización guardada correctamente");
    }
  };

  // ==========================
  // PDF
  // ==========================

const generarPDF = () => {

  const doc = new jsPDF();

doc.addImage(
  logoMaqsol,
  "PNG",
  12,
  5,
  80,
  30
);

// DATOS EMPRESA

doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);

doc.text(
  "Fracc. Valle Real, Paseo del Real Lote 14, C.P. 77533, Cancún, México",
  12,
  36
);

doc.text(
  "Tel: +52 998 215 7262",
  12,
  40
);

doc.setTextColor(0, 0, 0);

// ==========================
// CAJA FOLIO / FECHA / VIGENCIA / VENDEDOR
// ==========================

const boxX = 158;
const boxW = 40;
let boxY = 5;

const dibujarCampoCaja = (etiqueta, valor) => {

  doc.setFillColor(128, 0, 32);
  doc.rect(boxX, boxY, boxW, 3.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(255, 255, 255);
  doc.text(etiqueta, boxX + boxW / 2, boxY + 2.2, { align: "center" });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(boxX, boxY + 3.2, boxW, 4.4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);
  doc.text(String(valor || ""), boxX + boxW / 2, boxY + 6.2, { align: "center" });

  boxY += 7.6;

};

dibujarCampoCaja("FOLIO", folio);
dibujarCampoCaja("FECHA", fecha);
dibujarCampoCaja("VIGENCIA", vigencia);
dibujarCampoCaja("VENDEDOR", vendedor === "Otro" ? vendedorOtro : vendedor);

doc.setTextColor(0, 0, 0);

// ==========================
// TABLAS DE DATOS (EQUIPO Y CLIENTE)
// ==========================

const dibujarTablaDatos = (columnas, anchos, valores, xInicio, yInicio, espacio = 3) => {

  const lineasPorCelda = valores.map((val, i) =>
    doc.splitTextToSize(String(val || ""), anchos[i] - 4)
  );

  const maxLineas = Math.max(...lineasPorCelda.map((l) => l.length), 1);
  const altoFila = Math.max(maxLineas * 4 + 3, 8);

  let x = xInicio;

  columnas.forEach((col, i) => {

    doc.setFillColor(0, 0, 0);
    doc.rect(x, yInicio, anchos[i], 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(col, x + anchos[i] / 2, yInicio + 4, { align: "center" });
doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.1);
    doc.rect(x, yInicio + 6, anchos[i], altoFila);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(lineasPorCelda[i], x + 2, yInicio + 6 + 4);

    x += anchos[i] + espacio;

  });

  return yInicio + 6 + altoFila;

};

let yBloques = 44;

yBloques = dibujarTablaDatos(
  ["EQUIPO", "MARCA", "SERIE"],
  [44, 44, 44],
  [tipoEquipo, modelo, serie],
  12,
  yBloques,
  0
) + 4;
yBloques = dibujarTablaDatos(
  ["CLIENTE", "CONTACTO", "TELEFONO", "CORREO", "UBICACION"],
  [42, 34, 30, 46, 34],
  [cliente === "Otro" ? clienteOtro : cliente, contacto, telefono, correo, ubicacion],
  12,
  yBloques,
  0
) + 8;
// ==========================
// TABLA DE REFACCIONES
// ==========================

let yTabla = yBloques;

const colX = {
  cantidad: 12,
  parte: 26,
  descripcion: 56,
  entrega: 112,
  uso: 136,
  precio: 158,
  total: 182
};

const anchoTabla = {
  cantidad: 14,
  parte: 30,
  descripcion: 56,
  entrega: 24,
  uso: 22,
  precio: 24,
  total: 16
};

const dibujarEncabezadoTabla = () => {

  doc.setFillColor(128, 0, 32);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.rect(colX.cantidad, yTabla, anchoTabla.cantidad, 8, "F");
  doc.rect(colX.parte, yTabla, anchoTabla.parte, 8, "F");
  doc.rect(colX.descripcion, yTabla, anchoTabla.descripcion, 8, "F");
  doc.rect(colX.entrega, yTabla, anchoTabla.entrega, 8, "F");
  doc.rect(colX.uso, yTabla, anchoTabla.uso, 8, "F");
  doc.rect(colX.precio, yTabla, anchoTabla.precio, 8, "F");
  doc.rect(colX.total, yTabla, anchoTabla.total, 8, "F");

  doc.text("CANT.", colX.cantidad + anchoTabla.cantidad / 2, yTabla + 5, { align: "center" });
  doc.text("N. PARTE", colX.parte + anchoTabla.parte / 2, yTabla + 5, { align: "center" });
  doc.text("DESCRIPCION", colX.descripcion + anchoTabla.descripcion / 2, yTabla + 5, { align: "center" });
  doc.text("ENTREGA", colX.entrega + anchoTabla.entrega / 2, yTabla + 5, { align: "center" });
  doc.text("USO EN", colX.uso + anchoTabla.uso / 2, yTabla + 5, { align: "center" });
  doc.text("P. UNIT.", colX.precio + anchoTabla.precio / 2, yTabla + 5, { align: "center" });
  doc.text("TOTAL", colX.total + anchoTabla.total / 2, yTabla + 5, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  yTabla += 8;

};

dibujarEncabezadoTabla();

refacciones.forEach((item) => {

  const descripcionLineas = doc.splitTextToSize(item.descripcion || "", anchoTabla.descripcion - 4);
  const lineHeight = 4.2;
  const altoFila = Math.max(descripcionLineas.length * lineHeight + 4, 8);

  if (yTabla + altoFila > 270) {

    doc.addPage();

    doc.addImage(margen, "PNG", 12, 275, 186, 12);

    yTabla = 20;

    dibujarEncabezadoTabla();

  }

  doc.rect(colX.cantidad, yTabla, anchoTabla.cantidad, altoFila);
  doc.rect(colX.parte, yTabla, anchoTabla.parte, altoFila);
  doc.rect(colX.descripcion, yTabla, anchoTabla.descripcion, altoFila);
  doc.rect(colX.entrega, yTabla, anchoTabla.entrega, altoFila);
  doc.rect(colX.uso, yTabla, anchoTabla.uso, altoFila);
  doc.rect(colX.precio, yTabla, anchoTabla.precio, altoFila);
  doc.rect(colX.total, yTabla, anchoTabla.total, altoFila);

  doc.setFontSize(8);

  doc.text(String(item.cantidad || ""), colX.cantidad + anchoTabla.cantidad / 2, yTabla + 5, { align: "center" });
  doc.text(String(item.referencia || ""), colX.parte + anchoTabla.parte / 2, yTabla + 5, { align: "center" });
  doc.text(descripcionLineas, colX.descripcion + 2, yTabla + 5, { lineHeightFactor: 1.35 });
  doc.text(String(item.tiempoEntrega || ""), colX.entrega + anchoTabla.entrega / 2, yTabla + 5, { align: "center" });
  doc.text(String(item.usoEn || ""), colX.uso + anchoTabla.uso / 2, yTabla + 5, { align: "center" });
  doc.text(
    `$${Number(item.precioUnitario || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    colX.precio + anchoTabla.precio - 2,
    yTabla + 5,
    { align: "right" }
  );
  doc.text(
    `$${Number(item.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    colX.total + anchoTabla.total - 2,
    yTabla + 5,
    { align: "right" }
  );

  yTabla += altoFila;

});

let yAbajo = yTabla + 6;

const saltarSiNecesario = (altura) => {

  if (yAbajo + altura > 270) {

    doc.addPage();

    doc.addImage(margen, "PNG", 12, 275, 186, 12);

    yAbajo = 20;

  }

};

// ==========================
// OBSERVACIONES
// ==========================

saltarSiNecesario(20);

doc.setFont("helvetica", "normal");
doc.setFontSize(9);

const observacionesTexto =
doc.splitTextToSize(
  observaciones,
  178
);

const altoObs = Math.max(observacionesTexto.length * 5 + 6, 16);

doc.setFillColor(0, 0, 0);
doc.rect(12, yAbajo, 186, 6, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(7);
doc.setTextColor(255, 255, 255);
doc.text("OBSERVACIONES", 14, yAbajo + 4);

doc.setDrawColor(210, 210, 210);
doc.setLineWidth(0.1);
doc.rect(12, yAbajo + 6, 186, altoObs);

doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);

doc.text(
  observacionesTexto,
  16,
  yAbajo + 6 + 6
);

doc.setFontSize(10);

yAbajo = yAbajo + 6 + altoObs + 1;

// ==========================
// MATERIAL PARA USO EN / FORMA DE PAGO
// ==========================

const dibujarOpciones = (titulo, opciones, seleccionado, xInicio, yInicio, anchoTotal) => {

  doc.setFillColor(0, 0, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.rect(xInicio, yInicio, anchoTotal, 6, "F");
  doc.text(titulo, xInicio + 2, yInicio + 4);

doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.15);
  doc.rect(xInicio, yInicio + 6, anchoTotal, 8);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const anchoOpcion = anchoTotal / opciones.length;
  let x = xInicio;

  opciones.forEach((op) => {

const cajaX = x + 3;
    const cajaY = yInicio + 6 + 2;
doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.15);
    doc.rect(cajaX, cajaY, 4, 4); 

const opNormalizado = op.replace("Mant.", "Mantenimiento");

    if (opNormalizado === seleccionado || op === seleccionado) {
      doc.setFont("helvetica", "bold");
      doc.text("X", cajaX + 2, cajaY + 3.2, { align: "center" });
      doc.setFont("helvetica", "normal");
    }

    doc.text(op, cajaX + 6, cajaY + 3.2);

    x += anchoOpcion;

  });

  return yInicio + 6 + 8;

};

saltarSiNecesario(20);

const anchoMaterial = 116;
const anchoPago = 66;
const espacioEntre = 4;

const yMaterial = dibujarOpciones(
  "MATERIAL PARA USO EN:",
  ["Mant. Preventivo", "Mant. Correctivo", "Venta", "Garantía"],
  usoMaterial,
  12,
  yAbajo + 2,
  anchoMaterial
);

const yPago = dibujarOpciones(
  "FORMA DE PAGO:",
  ["Contado", "Crédito"],
  condiciones,
  12 + anchoMaterial + espacioEntre,
  yAbajo + 2,
  anchoPago
);

yAbajo = Math.max(yMaterial, yPago);

// ==========================
// CANTIDAD EN LETRA Y RESUMEN
// ==========================

saltarSiNecesario(30);

const yResumen = yAbajo + 3;

doc.setDrawColor(190, 190, 190);
doc.setLineWidth(0.1);
    doc.rect(12, yResumen, 130, 16);

doc.setFont("helvetica", "bold");
doc.setFontSize(8);
doc.text("CANTIDAD EN LETRA:", 14, yResumen + 5);

doc.setFont("helvetica", "normal");
doc.setFontSize(8);

const letraTexto = total > 0 ? `(${totalEnLetras()})` : "";
const letraLineas = doc.splitTextToSize(letraTexto, 125);
doc.text(letraLineas, 14, yResumen + 10);

doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);

doc.setDrawColor(190, 190, 190);
doc.setLineWidth(0.15);
doc.rect(142, yResumen, 30, 8);
doc.rect(172, yResumen, 26, 8);
doc.text("SUB-TOTAL", 144, yResumen + 5.5);
doc.text(
  `$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  196,
  yResumen + 5.5,
  { align: "right" }
);

doc.rect(142, yResumen + 8, 30, 8);
doc.rect(172, yResumen + 8, 26, 8);
doc.text("16% IVA", 144, yResumen + 13.5);
doc.text(
  `$${iva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  196,
  yResumen + 13.5,
  { align: "right" }
);

doc.setFillColor(128, 0, 32);
doc.rect(142, yResumen + 16, 30, 8, "F");
doc.rect(172, yResumen + 16, 26, 8);
doc.setTextColor(255, 255, 255);
doc.text("TOTAL MXN", 144, yResumen + 21.5);
doc.setTextColor(0, 0, 0);
doc.text(
  `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  196,
  yResumen + 21.5,
  { align: "right" }
);

yAbajo = yResumen + 24;

// ==========================
// CUENTAS BANCARIAS
// ==========================

saltarSiNecesario(35);

const yCuentas = yAbajo;

doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.text("CUENTAS BANCARIAS", 12, yCuentas);

doc.setDrawColor(190, 190, 190);
doc.setLineWidth(0.15);

doc.setFillColor(128, 0, 32);
doc.setTextColor(255, 255, 255);

const yEncabezado = yCuentas + 3;

doc.rect(12, yEncabezado, 30, 6, "F");
doc.rect(42, yEncabezado, 26, 6, "F");
doc.rect(68, yEncabezado, 26, 6, "F");
doc.rect(94, yEncabezado, 38, 6, "F");
doc.rect(132, yEncabezado, 66, 6, "F");

doc.setFontSize(8);
doc.text("BANCO", 20, yEncabezado + 4);
doc.text("MONEDA", 46, yEncabezado + 4);
doc.text("SUCURSAL", 69, yEncabezado + 4);
doc.text("CUENTA", 104, yEncabezado + 4);
doc.text("CLABE", 154, yEncabezado + 4);

doc.setTextColor(0, 0, 0);
doc.setFont("helvetica", "normal");

const yFila1 = yEncabezado + 6;

doc.rect(12, yFila1, 30, 6);
doc.rect(42, yFila1, 26, 6);
doc.rect(68, yFila1, 26, 6);
doc.rect(94, yFila1, 38, 6);
doc.rect(132, yFila1, 66, 6);

doc.text("BANCOMER", 16, yFila1 + 4);
doc.text("PESOS", 47, yFila1 + 4);
doc.text("1781", 75, yFila1 + 4);
doc.text("0112453290", 101, yFila1 + 4);
doc.text("012691001124532902", 142, yFila1 + 4);

const yFila2 = yFila1 + 6;

doc.rect(12, yFila2, 30, 6);
doc.rect(42, yFila2, 26, 6);
doc.rect(68, yFila2, 26, 6);
doc.rect(94, yFila2, 38, 6);
doc.rect(132, yFila2, 66, 6);

doc.text("BANCOMER", 16, yFila2 + 4);
doc.text("DOLARES", 47, yFila2 + 4);
doc.text("1781", 75, yFila2 + 4);
doc.text("0113448126", 101, yFila2 + 4);
doc.text("012691001134481263", 142, yFila2 + 4);

yAbajo = yFila2 + 15;

// ==========================
// CLÁUSULAS
// ==========================

saltarSiNecesario(30);

doc.setFont("helvetica", "bold");
doc.setFontSize(7);
doc.setTextColor(0, 0, 0);
doc.text("CONDICIONES DEL SERVICIO:", 12, yAbajo);

doc.setFont("helvetica", "normal");
doc.setFontSize(7);

const clausulas = [
  "1. La responsabilidad de MAQSISTEM se limita estrictamente al servicio o refacción descrito en la presente cotización; no se otorga garantía sobre fallas ajenas al alcance de dicho servicio, ni sobre daños derivados de un uso inadecuado del equipo o falta de mantenimiento por parte del cliente.",
  "2. Las refacciones eléctricas y/o electrónicas no cuentan con garantía, debido a que su falla puede originarse por causas ajenas a la pieza misma (variaciones de voltaje, corto circuito, humedad, mal uso, entre otras), salvo defecto de fabricación comprobable al momento de la entrega.",
  "3. Consulte con su asesor de ventas sobre nuestros criterios de aceptación para devolución de refacciones."
];

let yClausulaActual = yAbajo + 4;

clausulas.forEach((texto) => {
  const lineas = doc.splitTextToSize(texto, 186);
  doc.text(lineas, 12, yClausulaActual, { lineHeightFactor: 1.3 });
  yClausulaActual += lineas.length * 3.2 + 2;
});

yAbajo = yClausulaActual + 2;

// ==========================
// FIRMA
// ==========================

doc.save(`Cotizacion_${folio}.pdf`);

};

const cargarCotizacion = (cotizacion) => {
  setEditandoId(cotizacion.id);

  setFolio(cotizacion.folio);
  setNumeroFolio(cotizacion.numeroFolio || "");
  setFecha(cotizacion.fecha || new Date().toLocaleDateString("es-MX"));
  setVigencia(cotizacion.vigencia || "15 días");
  setCondiciones(cotizacion.condiciones || "Contado");
  setVendedor(cotizacion.vendedor || "");

  setCliente(cotizacion.cliente || "");
  setContacto(cotizacion.contacto || "");
  setTelefono(cotizacion.telefono || "");
  setCorreo(cotizacion.correo || "");
  setUbicacion(cotizacion.ubicacion || "");
  setOrdenCompra(cotizacion.ordenCompra || "");

  setTipoEquipo(cotizacion.tipoEquipo || "");
  setModelo(cotizacion.modelo || "");
  setSerie(cotizacion.serie || "");

  setRefacciones(
    cotizacion.refacciones && cotizacion.refacciones.length
      ? cotizacion.refacciones
      : [{ cantidad: 1, referencia: "", descripcion: "", tiempoEntrega: "", usoEn: "", precioUnitario: "", total: "" }]
  );

  setUsoMaterial(cotizacion.usoMaterial || "Mantenimiento Preventivo");
  setObservaciones(cotizacion.observaciones || "");
};

const limpiarFormulario = () => {

  setEditandoId(null);
  setFolio("");
  setNumeroFolio("");
  setVendedor("");

  setCliente("");
  setContacto("");
  setTelefono("");
  setCorreo("");
  setUbicacion("");
  setOrdenCompra("");

  setTipoEquipo("");
  setModelo("");
  setSerie("");

  setRefacciones([
    {
      cantidad: 1,
      referencia: "",
      descripcion: "",
      tiempoEntrega: "",
      usoEn: "",
      precioUnitario: "",
      total: ""
    }
  ]);

  setUsoMaterial(
    "Mantenimiento Preventivo"
  );

  setObservaciones("");
};

const subtotal = parseFloat(refacciones.reduce(
  (acc, item) => acc + parseFloat(item.total || 0),
  0
).toFixed(2));

const iva = parseFloat((subtotal * 0.16).toFixed(2));
const total = parseFloat((subtotal + iva).toFixed(2));

const numeroALetras = (numero) => {
  const unidades = ["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE"];
  const decenas = ["","DIEZ","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const especiales = ["ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISÉIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const centenas = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS","SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  if (numero === 0) return "CERO";
  if (numero === 100) return "CIEN";
  if (numero === 1000) return "MIL";
  let resultado = "";
  if (numero >= 1000) {
    const miles = Math.floor(numero / 1000);
    resultado += (miles === 1 ? "MIL" : numeroALetras(miles) + " MIL");
    numero = numero % 1000;
    if (numero > 0) resultado += " ";
  }
  if (numero >= 100) {
    resultado += centenas[Math.floor(numero / 100)];
    numero = numero % 100;
    if (numero > 0) resultado += " ";
  }
  if (numero >= 11 && numero <= 19) {
    resultado += especiales[numero - 11];
    return resultado;
  }
  if (numero >= 10) {
    resultado += decenas[Math.floor(numero / 10)];
    numero = numero % 10;
    if (numero > 0) resultado += " Y ";
  }
  if (numero > 0) resultado += unidades[numero];
  return resultado;
};

const totalEnLetras = () => {
  const entero = Math.floor(total);
  const centavos = Math.round((total - entero) * 100);
  return `${numeroALetras(entero)} PESOS ${centavos.toString().padStart(2,"0")}/100 M.N.`;
};

const listaCotizaciones = cotizaciones;

return (
  <Layout>

    <div className={"ventas-layout" + (historialAbierto ? "" : " historial-oculto")}>

  <div className="ventas-container">

    <div className="panel">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px"
          }}
        >
          <img
            src={logoMaqsol}
            alt="MAQSISTEM"
            style={{
              width: "70px"
            }}
          />

          <div>
            <h2>Cotización de Refacciones y Servicio</h2>
 
          </div>
        </div>

        <Link
          to="/"
          className="btn-panel"
        >
          ← Dashboard
        </Link>

      </div>

    </div>

    <div className="panel">

      <h3>Datos del Cliente</h3>

      <div className="form-grid">

<div style={{ display: "flex", gap: "6px", width: "100%" }}>

  <select
    translate="no"
    className="notranslate"
    value={cliente}
    onChange={(e) => {
      if (e.target.value === "__agregar__") {
        navigate("/clientes");
      } else {
        setCliente(e.target.value);
      }
    }}
    style={{
      flex: "1",
      boxSizing: "border-box",
      height: "60px",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      background: "white",
      fontSize: "14px",
      cursor: "pointer",
      appearance: "none"
    }}
  >
    <option value="">Selecciona un cliente</option>
    {clientesGuardados.map((c) => (
      <option key={c.id} value={c.cliente}>{c.cliente}</option>
    ))}
    <option value="Otro">Otro</option>
    <option value="__agregar__">+ Agregar Cliente</option>
  </select>

  <Link
    to="/clientes"
    style={{
      background: "#2e7d32",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      height: "60px",
      boxSizing: "border-box",
      padding: "0 18px",
      fontWeight: "bold",
      fontSize: "20px",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap"
    }}
  >
    +
  </Link>

</div>

{cliente === "Otro" && (
  <input
    placeholder="Escribe el nombre del cliente"
    value={clienteOtro}
    onChange={(e) => setClienteOtro(e.target.value)}
  />
)}

        <input
       placeholder="Contacto"
value={contacto}
onChange={(e) =>
  setContacto(e.target.value)
}
        />

        <input
          placeholder="Correo"
          value={correo}
          onChange={(e) =>
            setCorreo(e.target.value)
          }
        />

        <input
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) =>
            setTelefono(e.target.value)
          }
        />

        <input
          placeholder="Ubicación"
          value={ubicacion}
          onChange={(e) =>
            setUbicacion(e.target.value)
          }
        />

      </div>

    </div>

    <div className="panel">

      <h3>Datos del Equipo</h3>

     <div className="form-grid">

<input
  placeholder="Tipo de Equipo"
  value={tipoEquipo}
  onChange={(e) => setTipoEquipo(e.target.value)}
/>

<input
  placeholder="Modelo"
  value={modelo}
  onChange={(e) => setModelo(e.target.value)}
/>

<input
  placeholder="Serie"
  value={serie}
  onChange={(e) => setSerie(e.target.value)}
/>

</div>
</div>

<div className="panel">

  <h3>Datos de Cotización</h3>

  <div className="form-grid">
<div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>

  <input
    placeholder="Número de folio (ej. 100)"
    value={numeroFolio}
    onChange={(e) =>
      setNumeroFolio(e.target.value)
    }
  />

  <small style={{ color: "#666" }}>
    Folio: {folio}
  </small>

</div>

<select
  value={vigencia}
  onChange={(e) => setVigencia(e.target.value)}
  style={{
    width: "100%",
    boxSizing: "border-box",
    alignSelf: "start",
    padding: "21px 16px",
    fontSize: "15px",
    fontWeight: "600",
    color: "black",
    backgroundColor: "#c0c0c0",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "40px"
  }}
>
  <option style={{ backgroundColor: "#c0c0c0" }}>10 días</option>
  <option style={{ backgroundColor: "#c0c0c0" }}>15 días</option>
</select>

<select
  value={condiciones}
  onChange={(e) => setCondiciones(e.target.value)}
  style={{
    width: "100%",
    boxSizing: "border-box",
    alignSelf: "start",
    padding: "21px 16px",
    fontSize: "15px",
    fontWeight: "600",
    color: "black",
    backgroundColor: "#c0c0c0",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "40px"
  }}
>
  <option style={{ backgroundColor: "#c0c0c0" }}>Contado</option>
  <option style={{ backgroundColor: "#c0c0c0" }}>Crédito</option>
</select>

<div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", minWidth: 0 }}>

  <select
    translate="no"
    className="notranslate"
    value={vendedor}
    onChange={(e) => setVendedor(e.target.value)}
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "21px 16px",
      fontSize: "15px",
      fontWeight: "600",
      color: "black",
      backgroundColor: "#c0c0c0",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 14px center",
      paddingRight: "40px"
    }}
  >
    <option style={{ backgroundColor: "#c0c0c0" }} value="">Selecciona un vendedor</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Lic. Francisco Torres">Lic. Francisco Torres</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Ing. Damian Torres">Ing. Damian Torres</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Lic. Alejandro Balam">Lic. Alejandro Balam</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Otro">Otro</option>
  </select>

  {vendedor === "Otro" && (
    <input
      placeholder="Escribe el nombre del vendedor"
      value={vendedorOtro}
      onChange={(e) => setVendedorOtro(e.target.value)}
    />
  )}

</div>
  </div>

</div>

<div className="panel">

  <h3>Refacciones</h3>

  {refacciones.map((item, index) => (

    <div
      key={index}
      style={{
        border: "1px solid #ddd",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "15px"
      }}
    >

      <h4>
        Partida {index + 1}
      </h4>

      <div className="form-grid">

        <input
          type="number"
          placeholder="Cantidad"
          value={item.cantidad}
          onChange={(e) =>
            actualizarRefaccion(
              index,
              "cantidad",
              e.target.value
            )
          }
        />

        <input
          placeholder="N. Parte"
          value={item.referencia}
          onChange={(e) =>
            actualizarRefaccion(
              index,
              "referencia",
              e.target.value
            )
          }
        />

        <input
          placeholder="Descripción"
          value={item.descripcion}
          onChange={(e) =>
            actualizarRefaccion(
              index,
              "descripcion",
              e.target.value
            )
          }
        />

        <input
          placeholder="Tiempo de Entrega"
          value={item.tiempoEntrega}
          onChange={(e) =>
            actualizarRefaccion(
              index,
              "tiempoEntrega",
              e.target.value
            )
          }
        />

        <input
          placeholder="Uso en"
          value={item.usoEn}
          onChange={(e) =>
            actualizarRefaccion(
              index,
              "usoEn",
              e.target.value
            )
          }
        />

        <input
          type="number"
          placeholder="Precio Unitario"
          value={item.precioUnitario}
          onChange={(e) =>
            actualizarRefaccion(
              index,
              "precioUnitario",
              e.target.value
            )
          }
        />

        <input
          readOnly
          placeholder="Total"
          value={item.total}
        />

      </div>

<DeleteButton title="Quitar refacción" onConfirm={() => eliminarRefaccion(index)} />

    </div>

  ))}

  <button
    type="button"
    className="btn-guardar"
    onClick={agregarRefaccion}
  >
    + Agregar Refacción
  </button>

</div>

<div className="panel">

  <h3>Uso del Material</h3>

<select
  value={usoMaterial}
  onChange={(e) => setUsoMaterial(e.target.value)}
  style={{
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    fontWeight: "600",
    color: "black",
    backgroundColor: "#c0c0c0",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "40px"
  }}
>
  <option style={{ backgroundColor: "#c0c0c0" }}>Mantenimiento Preventivo</option>
  <option style={{ backgroundColor: "#c0c0c0" }}>Mantenimiento Correctivo</option>
  <option style={{ backgroundColor: "#c0c0c0" }}>Venta</option>
  <option style={{ backgroundColor: "#c0c0c0" }}>Garantía</option>
</select>

</div>

<div className="panel">

  <h3>Observaciones</h3>

  <textarea
    className="textarea-grande"
    value={observaciones}
    onChange={(e) =>
      setObservaciones(e.target.value)
    }
  />

</div>

<div className="panel">

  <h3>Resumen de Cotización</h3>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between"
    }}
  >

    <div>

      <strong>
        Cantidad con letra
      </strong>

 <p style={{ fontSize: "12px", maxWidth: "400px" }}>
  {total > 0 ? totalEnLetras() : "Pendiente"}
</p>

    </div>

    <div>

<p>{`Subtotal: $${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
<p>{`IVA: $${iva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
<p>{`Total: $${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
    </div>

  </div>

</div>

   <div className="panel">

      <div className="acciones-panel">

        <button
          className="btn-guardar"
          onClick={guardarCotizacion}
        >
          Guardar
        </button>

        <button
          className="btn-pdf"
          onClick={generarPDF}
        > 
          PDF
        </button>

        <button
          className="btn-limpiar"
          onClick={limpiarFormulario}
        >
          Limpiar
        </button>

      </div>

    </div>

  </div>

 {!historialAbierto && (
   <button
     type="button"
     className="historial-mostrar-btn"
     onClick={() => setHistorialAbierto(true)}
     title="Mostrar últimas cotizaciones"
   >
     ☰ Cotizaciones
   </button>
 )}

 {historialAbierto && (
 <div className="seguimiento-panel">

  <h3 className="historial-header">
     Últimas Cotizaciones
    <button
      type="button"
      className="historial-cerrar"
      onClick={() => setHistorialAbierto(false)}
      title="Ocultar y agrandar el espacio de la cotización"
    >
      ✕
    </button>
  </h3>

  <div className="historial-contenido">
 {
  listaCotizaciones.length === 0 ? (
    <p>No hay cotizaciones guardadas.</p>
  ) : (
    listaCotizaciones.slice(0, 5).map((cotizacion) => (
      <div
        key={cotizacion.id}
        style={{
          borderBottom: "1px solid #ddd",
          paddingBottom: "12px",
          marginBottom: "12px"
        }}
      >
        <strong>{cotizacion.folio}</strong>
        <p>{cotizacion.cliente}</p>
        <small>{cotizacion.fecha}</small>

        <br />

        <button
          className="btn-panel"
          onClick={() => cargarCotizacion(cotizacion)}
        >
          Ver / Editar
        </button>
      </div>
    ))
  )
}
  </div>

</div>
 )}

</div>

</Layout>

);
}

export default Refacciones;