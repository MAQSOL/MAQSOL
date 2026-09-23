import Layout from "../../components/Layout";import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

import logo from "../../assets/logo.png";
import logoNuevo from "../../assets/logo-maqsol-nuevo.jpeg";
import margen from "../../assets/margen.png";
import "./Ventas.css";
import DeleteButton from "../../components/DeleteButton";
import { useCotizaciones } from "../../hooks/useCotizaciones";
import { useSharedTable } from "../../hooks/useSharedTable";
import { useCodigosFolio } from "../../hooks/useCodigosFolio";
import { useAuth } from "../../contexts/AuthContext";
import ListaCotizaciones from "../../components/ListaCotizaciones";

const CLAUSULA_ESTANDAR = `1.0 PLAZO DE ENTREGA Y CONDICIONES

1.1 El plazo de entrega es 24-36 horas después de salir de nuestras instalaciones.
1.2 Cualquier movimiento extra debe avisarse 4 horas antes, ya que cualquier flete en falso por falta de aviso, se cobrará al cliente.

2. ALCANCE DE LA COTIZACIÓN:

2.1 Estos precios no incluyen el 16% de I.V.A. el cual se agregará a la factura correspondiente.

2.2 Hemos considerado que el lugar donde se realizará el trabajo está libre de obstáculos tales como cables de energía o de teléfonos, registros, cisternas, banquetas, etc. que impidan la realización del trabajo, en caso de utilizar la vía pública será por cuenta y riesgo del cliente, obligándose en su caso, a liberar de toda responsabilidad civil, penal y de cualquier otro tipo al operador y a nuestro equipo.

2.3 El importe incluye: Operación, combustible, traslados y seguro del equipo.

2.4 Este presupuesto está sujeto a que se confirme, por lo que agradecemos se nos avise con la mayor anticipación posible, para programar el equipo y se cumplan con los tiempos comprometidos.

2.5 Si el equipo no labora por causas ajenas a Maquinaria Soporte y Logística, S.A. de C.V. se considera tiempo efectivo. Esto incluye de manera enunciativa más no limitativa inclemencias del tiempo, huelgas, disturbios, paros o inactividad por causas imputables al cliente, etc.

2.6 No se incluyen permisos especiales que requieran las autoridades locales, estatales o federales para efecto de trabajos en la vía pública.

2.7 El equipo se usará dentro de los límites que marca su capacidad y bajo las condiciones que marca el fabricante, habrá trabajos que quedarán a criterio del operador el poder o no realizarlos, cuando se estime que los trabajos ponen en riesgo a terceros, al equipo o a la propia unidad.

2.8 El costo por el traslado del equipo varía de acuerdo con el origen y destino o ubicación de la obra.

2.9 En caso de descompostura del equipo, el tiempo de paro se repondrá al cliente con tiempo de trabajo de la misma unidad únicamente.

2.10 El equipo es para uso en obra y cualquier cambio o uso fuera de la obra, el cliente corre con los gastos extras como combustible, viáticos del operador, permisos de las autoridades Municipales, Estatales o Federales y seguros.

3. RESPONSABILIDAD DEL CLIENTE:

3.1 Aceptación por escrito de esta cotización.

3.2 Tramitar los accesos, permisos de trabajo, permisos por cierre de calles o avenidas, la salida del equipo de la obra o instalaciones al término de la renta, y en su caso el pago de cuotas sindicales y/o contraprestaciones.

3.3 Realizar las adecuaciones necesarias al acceso y lugar de trabajo.

3.4 Garantizar la integridad de nuestro equipo, así como del personal técnico y operativo.

3.5 Proporcionar un área de resguardo con vigilancia fuera del horario de trabajo.

3.6 Pagar oportunamente el importe de la renta y de los traslados y en caso de generarse tiempos extraordinarios pagarlos en el momento de presentar la factura correspondiente.

3.7 El equipo se utilizará dentro de los límites que marca su capacidad y de acuerdo con el uso para lo que fue fabricado y bajo las especificaciones técnicas que marca el fabricante.

3.8 Los daños que se llegaran a originar por el peso del equipo ya sea por hundimiento o ruptura del pavimento o piso, corren por cuenta del cliente, Maquinaria Soporte y Logística, SA de CV, no se hace responsable de reparar o pagar ningún tipo de daño originado por este concepto.

4. CARGOS EXTRAS Y PENALIZACIONES

Maquinaria Soporte y Logística, podrá hacer cargos extras durante la operación del equipo, en caso de:

4.1 Atención a fallas de emergencia por casos adjudicados a mala operación por negligencia por parte del cliente. Daños a equipos o accesorios complementarios que forman parte de la maquinaria.

4.2 Pérdida de accesorios (torreta, extintor, faros, espejos, periféricos, accesorios, etc.) sustraídos al interior de la obra y daños ocasionados por vandalismo al equipo que se encuentra a resguardo en la obra.

4.3 Pérdida o robo del equipo en posesión del cliente.

5. CONDICIONES COMERCIALES:

5.1 Forma de pago: 100% por anticipado, en caso de continuidad en la renta, el pago se deberá realizar previo al inicio del periodo que corre.

5.2 La entrega está sujeta a disponibilidad en el momento de la confirmación

5.3 Precios sujetos a cambio sin previo aviso, los cuales podrán variar de acuerdo con las condiciones del mercado y por la variación de la paridad del dólar con el peso mexicano.

5.4 Vigencia de la cotización: 10 días naturales contando a partir de la fecha de presentación.

5.5 Tiempo de entrega: Conforme a lo estipulado en el punto 1.1 de este documento, considerando que al momento de la confirmación y de recibido el pago de la renta y la orden de compra correspondiente, se estipulará la fecha y hora de entrega del equipo en obra.

5.6 La disponibilidad del equipo está sujeta a previos compromisos y se deberá verificar antes de realizar cualquier pago para confirmar y darle una fecha de entrega.

6. Maquinaria Soporte y Logística, no se hace responsable de pagar a la arrendataria ni de indemnizar a terceros por daños o averías ocasionados por el trabajo de la máquina, ya que esta queda a cargo y bajo supervisión del personal autorizado por el cliente, quien es el directo responsable de dar órdenes e instrucciones al operador para realizar los trabajos.

7. La renta del equipo es responsabilidad del cliente, por lo tanto, el proveedor no tiene que ver en el caso de que con el equipo solicitado en renta no se puedan ejecutar los trabajos requeridos por el cliente ya que previamente se le proporcionó las especificaciones y características del equipo, medidas, capacidades, alcances y condiciones a tomar en consideración.

En caso de aceptar nuestra oferta favor de efectuar depósito bancario o transferencia a nombre de Maquinaria Soporte y Logística, S.A. de C.V., en nuestra cuenta, previa confirmación de la disponibilidad del equipo y enviar el comprobante de transferencia o depósito bancario, al correo facturacion@maqsol.com.mx`;

function Rentas() {

  const { registros: cotizaciones, guardar: guardarCotizacionDB } = useCotizaciones("renta");
  const { registros: clientesGuardados } = useSharedTable("clientes");
  const { codigos, miCodigo, nombrePorCodigo, telefonoPorCodigo } = useCodigosFolio();
  const { isAdmin } = useAuth();

  // ==========================
  // DATOS CLIENTE
  // ==========================

const [folio, setFolio] = useState("");
const [usuarios, setUsuarios] = useState(() => {
  const guardados = JSON.parse(localStorage.getItem("usuariosFolio"));
  return guardados && guardados.length > 0
    ? guardados
    : ["CAB", "FTM", "FDT"];
});

const [codigoUsuario, setCodigoUsuario] = useState("CAB");

useEffect(() => {
  if (codigos.length) setUsuarios((prev) => [...new Set([...codigos, ...prev])]);
}, [codigos.join(",")]);

useEffect(() => {
  if (miCodigo) setCodigoUsuario(miCodigo);
}, [miCodigo]);

const datosVendedor = {
  CAB: { nombre: "Lic. Alejandro Balam", telefono: "+52 998 215 7262" },
  FTM: { nombre: "Lic. Francisco Torres", telefono: "+52 998 842 1332" },
  FDT: { nombre: "Ing. Damian Torres", telefono: "+52 998 351 7457" }
};
const [numeroFolio, setNumeroFolio] = useState("");

useEffect(() => {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  setFolio(`${codigoUsuario}-R${numeroFolio}-${mes}${anio}`);
}, [codigoUsuario, numeroFolio]);

const agregarUsuario = () => {
  const nuevo = window.prompt(
    "Escribe las 3 letras del nuevo usuario (ejemplo: CAB):"
  );

  if (!nuevo) return;

  const codigo = nuevo.trim().toUpperCase();

  if (codigo.length !== 3) {
    alert("El código debe tener exactamente 3 letras");
    return;
  }

  if (usuarios.includes(codigo)) {
    alert("Ese código ya existe, se seleccionó");
    setCodigoUsuario(codigo);
    return;
  }

  const nuevosUsuarios = [...usuarios, codigo];

  setUsuarios(nuevosUsuarios);
  localStorage.setItem(
    "usuariosFolio",
    JSON.stringify(nuevosUsuarios)
  );
  setCodigoUsuario(codigo);
};
const [cliente, setCliente] = useState("");
const [clienteOtro, setClienteOtro] = useState("");
const navigate = useNavigate();
  const [atencion, setAtencion] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [ubicacionOtro, setUbicacionOtro] = useState("");

// ==========================
// DATOS EQUIPO
// ==========================

const [marca, setMarca] = useState("");
const [modelo, setModelo] = useState("");
const [tipoEquipo, setTipoEquipo] = useState("");
const [tipoEquipoOtro, setTipoEquipoOtro] = useState("");
const [marcaOtro, setMarcaOtro] = useState("");
const [modeloOtro, setModeloOtro] = useState("");

const marcasPorTipo = {
  "Plataforma tipo tijera": ["Genie", "Zoomlion", "JLG"],
  "Plataforma tipo articulada": ["Genie", "Zoomlion", "JLG"],
  "Manipulador telescopico": ["Genie", "Dieci", "Haulotte", "Caterpillar", "Manitou", "JCB"],
  "Retroexcavadora": ["Terex", "Caterpillar", "John Deere", "JCB", "Manitou", "Case"]
};

const modelosPorMarca = {
  "Manipulador telescopico": {
    "Genie": ["GTH-1056", "GTH-844", "GTH-1256", "GTH-5519"],
    "Dieci": ["ICARUS-4017"],
    "Haulotte": ["HTL-4017"]
  },
  "Plataforma tipo tijera": {
    "Genie": ["GS1930", "GS2632", "GS3246", "GS4055", "GS3232", "GS3369 DC", "GS3390 RT", "GS4046", "GS4069", "GS4069 RT"],
    "Zoomlion": ["ZS0607 AC-LI", "ZS0808AC-LI", "ZS0812AC-LI", "ZS1012AC-LI", "ZS1212AC-LI", "ZS1218ERT", "ZS1414AC-LI"]
  },
  "Plataforma tipo articulada": {
    "Genie": ["Z-45", "Z-62", "Z-30/22", "Z-33"],
    "JLG": ["450AJ", "600AJ", "800AJ"],
    "Zoomlion": ["ZA14J", "ZA14J-LI", "ZA20J"]
  }
};
const [rentas, setRentas] = useState([
  {
    descripcion: "",
    periodo: "",
    importe: "",
  }
]);

const [traslados, setTraslados] = useState([
  {
    descripcion: "",
    importe: ""
  }
]);

const [descuento, setDescuento] = useState(0);
  // ==========================
  // OBSERVACIONES
  // ==========================

  const [observaciones, setObservaciones] = useState("");
  const [clausulas, setClausulas] = useState("");

  // ==========================
  // COTIZACIONES
  // ==========================

  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  // ==========================
  // GUARDAR
  // ==========================

  const guardarCotizacion = async () => {

    if (!folio || !cliente) {
      alert("Debe capturar Folio y Cliente");
      return;
    }

const nuevaCotizacion = {
  id: editandoId || String(Date.now()),
  folio,
  cliente,
  atencion,
  correo,
  telefono,
  ubicacion,

marca: marca === "Otro" ? marcaOtro : marca,
modelo: modelo === "Otro" ? modeloOtro : modelo,
tipoEquipo: tipoEquipo === "Otro" ? tipoEquipoOtro : tipoEquipo,

rentas,
traslados,
descuento,

observaciones,
clausulas,

fecha: new Date().toLocaleDateString()
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

// FRANJA NEGRA DE ACENTO
doc.setFillColor(20, 20, 20);
doc.rect(0, 23, 19, 12, "F");

// LOGO
doc.addImage(
  logoNuevo,
  "JPEG",
  20,
  12,
  31,
  31
);

// NOMBRE Y DESCRIPCIÓN DE EMPRESA
doc.setFont("helvetica", "bold");
doc.setFontSize(23);
doc.setTextColor(0, 0, 0);
doc.text("MAQSOL", 54, 23);

doc.setFont("helvetica", "normal");
doc.setFontSize(9);
doc.setTextColor(100, 100, 100);
doc.text(
  "Soluciones prácticas y eficientes en la renta y venta",
  54,
  30
);
doc.text(
  "de maquinaria pesada para la industria y la construcción",
  54,
  35
);

doc.setTextColor(0, 0, 0);

// TÍTULO COTIZACIÓN
doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("COTIZACIÓN", 190, 15, { align: "right" });

doc.addImage(
  margen,
  "PNG",
  15,
  275,
  187,
  12
);

doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.setTextColor(0, 0, 0);
doc.text("www.maqsol.com.mx", 105, 283, { align: "center" });

  let y = 60;

const verificarPagina = () => {

  if (y >= 260) {

    doc.addPage();

    y = 20;
  }

};

// FOLIO Y FECHA

doc.setFont("helvetica", "normal");
doc.setFontSize(9);

doc.text(
  `Folio: ${folio}`,
  190,
  23,
  { align: "right" }
);

doc.text(
  `Fecha: ${new Date().toLocaleDateString("es-MX")}`,
  190,
  28,
  { align: "right" }
);

// TABLA CLIENTE Y EQUIPO

const dibujarTablaDatos = (columnas, anchos, valores, xInicio, yInicio) => {

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

    x += anchos[i];

  });

  return yInicio + 6 + altoFila;

};

let yBloques = 55;

yBloques = dibujarTablaDatos(
  ["CLIENTE", "CONTACTO", "TELEFONO", "CORREO"],
  [50, 40, 35, 45],
  [cliente === "Otro" ? clienteOtro : cliente, atencion, telefono, correo],
  20,
  yBloques
) + 4;

yBloques = dibujarTablaDatos(
  ["EQUIPO", "MARCA", "MODELO", "OBRA"],
  [45, 40, 40, 45],
  [tipoEquipo, marca, modelo, ubicacion === "Otro" ? ubicacionOtro : ubicacion],
  20,
  yBloques
) + 8;

// ==========================
// RENTA DEL EQUIPO
// ==========================

const yRentas = yBloques;

doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text("1.0 RENTA DEL EQUIPO", 20, yRentas + 3);

doc.setFillColor(128, 0, 32);
doc.setTextColor(255, 255, 255);
doc.rect(20, yRentas + 6, 95, 8, "F");
doc.rect(115, yRentas + 6, 45, 8, "F");
doc.rect(160, yRentas + 6, 30, 8, "F");

doc.setFont("helvetica", "bold");
doc.text("DESCRIPCION", 67, yRentas + 11, { align: "center" });
doc.text("PERIODO", 137, yRentas + 11, { align: "center" });
doc.text("IMPORTE", 175, yRentas + 11, { align: "center" });

doc.setTextColor(0, 0, 0);
doc.setFont("helvetica", "normal");

let yFilaRenta = yRentas + 14;

rentas.forEach((renta, index) => {

  const periodoTexto = renta.periodo === "Otro" ? (renta.periodoOtro || "") : renta.periodo;
  const descLineas = doc.splitTextToSize(renta.descripcion || "", 91);
  const perLineas = doc.splitTextToSize(periodoTexto || "", 41);
  const maxLineas = Math.max(descLineas.length, perLineas.length, 1);
  const altoFila = Math.max(maxLineas * 4 + 3, 8);

  if (index % 2 === 0) {
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yFilaRenta, 95, altoFila, "F");
    doc.rect(115, yFilaRenta, 45, altoFila, "F");
    doc.rect(160, yFilaRenta, 30, altoFila, "F");
  }

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.1);
  doc.rect(20, yFilaRenta, 95, altoFila);
  doc.rect(115, yFilaRenta, 45, altoFila);
  doc.rect(160, yFilaRenta, 30, altoFila);

  doc.text(descLineas, 22, yFilaRenta + 5);
  doc.text(perLineas, 117, yFilaRenta + 5);
doc.text(
    `$ ${Number(renta.importe || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    188,
    yFilaRenta + 5,
    { align: "right" }
  );

  yFilaRenta += altoFila;

});

let yAfterRentas = yFilaRenta + 8;

// ==========================
// TRASLADOS
// ==========================

const hayTraslados = traslados.some(
  t => (t.descripcion || "").trim() !== "" || Number(t.importe || 0) > 0
);

let yAfterTraslados = yAfterRentas;

if (hayTraslados) {

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
doc.text("1.1 TRASLADOS", 20, yAfterRentas + 3);

  doc.setFillColor(128, 0, 32);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, yAfterRentas + 6, 140, 8, "F");
  doc.rect(160, yAfterRentas + 6, 30, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPCION", 90, yAfterRentas + 11, { align: "center" });
  doc.text("IMPORTE", 175, yAfterRentas + 11, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  let yFilaTraslado = yAfterRentas + 14;

  traslados.forEach((traslado, index) => {

    const descLineas = doc.splitTextToSize(traslado.descripcion || "", 136);
    const altoFila = Math.max(descLineas.length * 4 + 3, 8);

    if (index % 2 === 0) {
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yFilaTraslado, 140, altoFila, "F");
      doc.rect(160, yFilaTraslado, 30, altoFila, "F");
    }

    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.1);
    doc.rect(20, yFilaTraslado, 140, altoFila);
    doc.rect(160, yFilaTraslado, 30, altoFila);

    doc.text(descLineas, 22, yFilaTraslado + 5);
 doc.text(
      `$ ${Number(traslado.importe || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      188,
      yFilaTraslado + 5,
      { align: "right" }
    );

    yFilaTraslado += altoFila;

  });

  yAfterTraslados = yFilaTraslado + 8;

}

// ==========================
// RESUMEN FINANCIERO Y OBSERVACIONES
// ==========================

doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("OBSERVACIONES", 20, yAfterTraslados);

doc.setFont("helvetica", "normal");
doc.setFontSize(8.5);

const observacionesTexto = doc.splitTextToSize(observaciones, 100);

doc.text(observacionesTexto, 20, yAfterTraslados + 8);

const finObservaciones = yAfterTraslados + 10 + (observacionesTexto.length * 5);

doc.setFont("helvetica", "normal");
doc.setFontSize(9);

doc.text("Subtotal:", 140, yAfterTraslados);
doc.text(
  `$ ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  186,
  yAfterTraslados,
  { align: "right" }
);

doc.text("Descuento:", 140, yAfterTraslados + 7);
doc.text(
  `$ ${Number(descuento || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  186,
  yAfterTraslados + 7,
  { align: "right" }
);

doc.text("Subtotal Neto:", 140, yAfterTraslados + 14);
doc.text(
  `$ ${subtotalNeto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  186,
  yAfterTraslados + 14,
  { align: "right" }
);

doc.text("IVA 16%:", 140, yAfterTraslados + 21);
doc.text(
  `$ ${iva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  186,
  yAfterTraslados + 21,
  { align: "right" }
);

doc.setFillColor(128, 0, 32);
doc.rect(129, yAfterTraslados + 26, 61, 10, "F");
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(11);

doc.text("TOTAL:", 134, yAfterTraslados + 33);
doc.text(
  `$ ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  187,
  yAfterTraslados + 33,
  { align: "right" }
);

doc.setTextColor(0, 0, 0);
doc.setFontSize(10);

const finResumen = yAfterTraslados + 44;

// TERMINOS Y CONDICIONES

y = Math.max(finObservaciones, finResumen) + 2;

if (y > 240) {
  doc.addPage();
  y = 20;
}

doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("TERMINOS Y CONDICIONES", 20, y);

doc.setFont("helvetica", "normal");
doc.setFontSize(8.5);

const clausulasTexto = doc.splitTextToSize(clausulas, 165);

let yClausulas = y + 10;

clausulasTexto.forEach((linea) => {

 if (yClausulas > 270) {
    doc.addPage();
    yClausulas = 20;
  }

  doc.text(linea, 20, yClausulas);

  yClausulas += linea.trim() === "" ? 1.5 : 5;

});

// ==========================
// PIE DE PAGINA (fijo, pegado al fondo)
// ==========================

const altoPie = 55;
const pageHeight = doc.internal.pageSize.getHeight();
let yPie = pageHeight - altoPie;

if (yClausulas + 10 > yPie) {
  doc.addPage();
  yPie = pageHeight - altoPie;
}

doc.setFillColor(20, 20, 20);
doc.rect(15, yPie, 180, altoPie, "F");

doc.setDrawColor(90, 90, 90);
doc.setLineWidth(0.2);
doc.line(72, yPie + 8, 72, yPie + altoPie - 8);
doc.line(135, yPie + 8, 135, yPie + altoPie - 8);

doc.setTextColor(255, 255, 255);

// Columna 1: Firma
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("Atentamente", 22, yPie + 11);

doc.setDrawColor(255, 255, 255);
doc.setLineWidth(0.3);
doc.line(22, yPie + 23, 60, yPie + 23);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text(datosVendedor[codigoUsuario]?.nombre || nombrePorCodigo[codigoUsuario] || "Lic. Alejandro Balam", 22, yPie + 30);
doc.text(datosVendedor[codigoUsuario]?.telefono || telefonoPorCodigo[codigoUsuario] || "+52 998 215 7262", 22, yPie + 36);
doc.text("Área Comercial", 22, yPie + 42);

// Columna 2: Cuentas Bancarias MXN
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("Cuenta en MXN:", 78, yPie + 11);

doc.setFont("helvetica", "normal");
doc.setFontSize(8.5);
doc.text("BANCOMER Pesos - Suc. 1781", 78, yPie + 19);
doc.text("Cuenta: 0112453290", 78, yPie + 25);
doc.text("CLABE:", 78, yPie + 31);
doc.text("012691001124532902", 78, yPie + 36);

// Columna 3: Cuentas Bancarias USD
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("Cuenta en USD:", 141, yPie + 11);

doc.setFont("helvetica", "normal");
doc.setFontSize(8.5);
doc.text("BANCOMER Dólares - Suc. 1781", 141, yPie + 19);
doc.text("Cuenta: 0113448126", 141, yPie + 25);
doc.text("CLABE:", 141, yPie + 31);
doc.text("012691001134481263", 141, yPie + 36);

doc.setTextColor(0, 0, 0);

doc.save(`${folio}.pdf`);

};

  const cargarCotizacion = (cotizacion) => {

    setEditandoId(cotizacion.id);
    setFolio(cotizacion.folio);
    setCliente(cotizacion.cliente);
    setAtencion(cotizacion.atencion);
    setCorreo(cotizacion.correo);
    setTelefono(cotizacion.telefono);
    setUbicacion(cotizacion.ubicacion);

    setMarca(cotizacion.marca);
    setModelo(cotizacion.modelo);
    setTipoEquipo(cotizacion.tipoEquipo);
    setRentas(
  cotizacion.rentas || [
    {
      descripcion: "",
      periodo: "",
      importe: ""
    }
  ]
);

setTraslados(
  cotizacion.traslados || [
    {
      descripcion: "",
      importe: ""
    }
  ]
);

setDescuento(cotizacion.descuento || 0);

setObservaciones(cotizacion.observaciones);
    setClausulas(cotizacion.clausulas);
  };

  const agregarClausulaEstandar = () => {
    setClausulas((prev) =>
      prev && prev.trim() !== ""
        ? `${prev}\n\n${CLAUSULA_ESTANDAR}`
        : CLAUSULA_ESTANDAR
    );
  };

  // ==========================
  // LIMPIAR
  // ==========================

  const limpiarFormulario = () => {

    setEditandoId(null);
    setFolio("");
    setCliente("");
    setAtencion("");
    setCorreo("");
    setTelefono("");
    setUbicacion("");

    setMarca("");
    setModelo("");
    setTipoEquipo("");

    setObservaciones("");
    setClausulas("");
  };

  const agregarRenta = () => {
  setRentas([
    ...rentas,
    {
      descripcion: "",
      periodo: "",
      importe: ""
    }
  ]);
};

const actualizarRenta = (
  index,
  campo,
  valor
) => {
  const nuevas = [...rentas];

  nuevas[index][campo] = valor;

  setRentas(nuevas);
};

const eliminarRenta = (index) => {

  const nuevas = rentas.filter(
    (_, i) => i !== index
  );

  setRentas(nuevas);

};

const agregarTraslado = () => {
  setTraslados([
    ...traslados,
    {
      descripcion: "",
      importe: ""
    }
  ]);
};

const actualizarTraslado = (
  index,
  campo,
  valor
) => {
  const nuevos = [...traslados];

  nuevos[index][campo] = valor;

  setTraslados(nuevos);
};

const eliminarTraslado = (index) => {

  const nuevos = traslados.filter(
    (_, i) => i !== index
  );

  setTraslados(nuevos);

};

const subtotalRentas = rentas.reduce(
  (acc, item) =>
    acc + (parseFloat(item.importe) || 0),
  0
);

const subtotalTraslados = traslados.reduce(
  (acc, item) =>
    acc + (parseFloat(item.importe) || 0),
  0
);

const subtotal =
  subtotalRentas + subtotalTraslados;

const subtotalNeto =
  subtotal - (parseFloat(descuento) || 0);

const iva = subtotalNeto * 0.16;

const total = subtotalNeto + iva;

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
            src={logo}
            alt="MAQSISTEM"
            style={{
              width: "70px"
            }}
          />

          <div>
            <h2>Cotización de Renta</h2>

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

<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

  <div style={{ display: "flex", gap: "6px" }}>

    <select
      translate="no"
      className="notranslate"
      value={codigoUsuario}
      onChange={(e) => {
        if (e.target.value === "__nuevo__") {
          agregarUsuario();
        } else {
          setCodigoUsuario(e.target.value);
        }
      }}
      style={{
        flex: "1",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        background: "white",
        fontSize: "14px",
        cursor: "pointer",
        appearance: "none"
      }}
    >
      {usuarios.map((u) => (
        <option key={u} value={u} translate="no">
          {u}
        </option>
      ))}
      <option value="__nuevo__">+ Agregar nuevo</option>
    </select>

    <input
      placeholder="Núm."
      value={numeroFolio}
      onChange={(e) => setNumeroFolio(e.target.value)}
      style={{
        width: "110px",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #ccc"
      }}
    />

  </div>

  <small style={{ color: "#666" }}>
    Folio: {folio}
  </small>

</div>

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
    <option value="Otro">Otro </option>
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
          placeholder="Atención"
          value={atencion}
          onChange={(e) =>
            setAtencion(e.target.value)
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

<div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>

  <select
    translate="no"
    className="notranslate"
    value={ubicacion}
    onChange={(e) => setUbicacion(e.target.value)}
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
    <option style={{ backgroundColor: "#c0c0c0" }} value="">Selecciona una ubicación</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Cancún zona norte">Cancún zona norte</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Cancún zona sur">Cancún zona sur</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Cancún zona centro">Cancún zona centro</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Cancún zona hotelera">Cancún zona hotelera</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Playa del Carmen zona centro">Playa del Carmen zona centro</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Playa del Carmen zona metropolitana">Playa del Carmen zona metropolitana</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Carretera federal Cancún - Playa del Carmen">Carretera federal Cancún - Playa del Carmen</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Carretera federal Playa del Carmen - Tulum">Carretera federal Playa del Carmen - Tulum</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Tulum centro">Tulum centro</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Tulum zona metropolitana">Tulum zona metropolitana</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Bahía Petempich">Bahía Petempich</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Puerto Aventuras">Puerto Aventuras</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Playacar">Playacar</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Puerto Morelos">Puerto Morelos</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Leona Vicario pueblo">Leona Vicario pueblo</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Mérida, Yucatán">Mérida, Yucatán</option>
    <option style={{ backgroundColor: "#c0c0c0" }} value="Otro">Otro</option>
  </select>

  {ubicacion === "Otro" && (
    <input
      placeholder="Escribe la ubicación"
      value={ubicacionOtro}
      onChange={(e) => setUbicacionOtro(e.target.value)}
    />
  )}

</div>

      </div>

    </div>

    <div className="panel">

      <h3>Datos del Equipo</h3>

      <div className="form-grid">
{marcasPorTipo[tipoEquipo] ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <select
              translate="no"
              className="notranslate"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
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
              <option style={{ backgroundColor: "#c0c0c0" }} value="">Selecciona una marca</option>
              {marcasPorTipo[tipoEquipo].map((m) => (
                <option style={{ backgroundColor: "#c0c0c0" }} key={m} value={m}>{m}</option>
              ))}
              <option style={{ backgroundColor: "#c0c0c0" }} value="Otro">Otro</option>
            </select>

            {marca === "Otro" && (
              <input
                placeholder="Escribe la marca"
                value={marcaOtro}
                onChange={(e) => setMarcaOtro(e.target.value)}
              />
            )}
          </div>
        ) : (
          <input
            placeholder="Marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          />
        )}

{modelosPorMarca[tipoEquipo]?.[marca] ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <select
              translate="no"
              className="notranslate"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
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
              <option style={{ backgroundColor: "#c0c0c0" }} value="">Selecciona un modelo</option>
              {modelosPorMarca[tipoEquipo][marca].map((m) => (
                <option style={{ backgroundColor: "#c0c0c0" }} key={m} value={m}>{m}</option>
              ))}
              <option style={{ backgroundColor: "#c0c0c0" }} value="Otro">Otro</option>
            </select>

            {modelo === "Otro" && (
              <input
                placeholder="Escribe el modelo"
                value={modeloOtro}
                onChange={(e) => setModeloOtro(e.target.value)}
              />
            )}
          </div>
        ) : (
          <input
            placeholder="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>

          <select
            translate="no"
            className="notranslate"
            value={tipoEquipo}
            onChange={(e) => setTipoEquipo(e.target.value)}
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
            <option style={{ backgroundColor: "#c0c0c0" }} value="">Selecciona un tipo</option>
            <option style={{ backgroundColor: "#c0c0c0" }} value="Manipulador telescopico">Manipulador telescopico</option>
            <option style={{ backgroundColor: "#c0c0c0" }} value="Plataforma tipo tijera">Plataforma tipo tijera</option>
            <option style={{ backgroundColor: "#c0c0c0" }} value="Plataforma tipo articulada">Plataforma tipo articulada</option>
            <option style={{ backgroundColor: "#c0c0c0" }} value="Retroexcavadora">Retroexcavadora</option>
            <option style={{ backgroundColor: "#c0c0c0" }} value="Minicargador">Minicargador</option>
            <option style={{ backgroundColor: "#c0c0c0" }} value="Excavadora">Excavadora</option>
            <option style={{ backgroundColor: "#c0c0c0" }} value="Otro">Otro</option>
          </select>

          {tipoEquipo === "Otro" && (
            <input
              placeholder="Escribe el tipo de equipo"
              value={tipoEquipoOtro}
              onChange={(e) => setTipoEquipoOtro(e.target.value)}
            />
          )}

        </div>
      </div>
      </div>

<div className="panel">

  <h3>Rentas</h3>

<button
  type="button"
  className="btn-guardar"
  onClick={agregarRenta}
>
  + Agregar Renta
</button>

<div style={{ marginTop: "15px" }}>

  {rentas.map((renta, index) => (

<div
  key={index}
  className="form-grid"
  style={{
    gridTemplateColumns: "2fr 1fr 1fr 45px",
    alignItems: "start",
    marginBottom: "10px"
  }}
>

      <textarea
        placeholder="Descripción"
        value={renta.descripcion}
        onChange={(e) =>
          actualizarRenta(
            index,
            "descripcion",
            e.target.value
          )
        }
      />

<div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>

        <select
          translate="no"
          className="notranslate"
          value={renta.periodo}
          onChange={(e) =>
            actualizarRenta(
              index,
              "periodo",
              e.target.value
            )
          }
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
          <option style={{ backgroundColor: "#c0c0c0" }} value="">Selecciona un período</option>
          <option style={{ backgroundColor: "#c0c0c0" }} value="1 día en jornada laboral de 8 horas">1 día en jornada laboral de 8 horas</option>
          <option style={{ backgroundColor: "#c0c0c0" }} value="6 días o 50 horas">6 días o 50 horas</option>
          <option style={{ backgroundColor: "#c0c0c0" }} value="14 días o 100 horas">14 días o 100 horas</option>
          <option style={{ backgroundColor: "#c0c0c0" }} value="28 días o 200 horas">28 días o 200 horas</option>
          <option style={{ backgroundColor: "#c0c0c0" }} value="Otro">Otro</option>
        </select>

        {renta.periodo === "Otro" && (
          <input
            placeholder="Escribe el período"
            value={renta.periodoOtro || ""}
            onChange={(e) =>
              actualizarRenta(
                index,
                "periodoOtro",
                e.target.value
              )
            }
          />
        )}

      </div>

<input
  placeholder="Importe"
  value={renta.importe}
  onChange={(e) =>
    actualizarRenta(
      index,
      "importe",
      e.target.value
    )
  }
/>

<span style={{ alignSelf: "start", marginTop: "6px" }}>
  <DeleteButton title="Quitar renta" onConfirm={() => eliminarRenta(index)} />
</span>

    </div>

  ))}

</div>

</div>

<div className="panel">

  <h3>Traslados</h3>

  <button
    type="button"
    className="btn-guardar"
    onClick={agregarTraslado}
  >
    + Agregar Traslado
  </button>

  <div style={{ marginTop: "15px" }}>

    {traslados.map((traslado, index) => (

<div
  key={index}
  className="form-grid"
  style={{
    gridTemplateColumns: "3fr 1fr 45px",
    alignItems: "start",
    marginBottom: "10px"
  }}
>

        <textarea
          placeholder="Descripción"
          value={traslado.descripcion}
          onChange={(e) =>
            actualizarTraslado(
              index,
              "descripcion",
              e.target.value
            )
          }
        />

        <input
          placeholder="Importe"
          value={traslado.importe}
          onChange={(e) =>
            actualizarTraslado(
              index,
              "importe",
              e.target.value
            )
          }
        />

<span style={{ alignSelf: "start", marginTop: "6px" }}>
  <DeleteButton title="Quitar traslado" onConfirm={() => eliminarTraslado(index)} />
</span>

      </div>

    ))}

  </div>

</div>

<div className="panel">

  <h3>Resumen Financiero</h3>

<div className="form-grid">

  <div>
    <label>Descuento</label>
    <input 
      type="number"
      value={descuento}
      onChange={(e) =>
        setDescuento(e.target.value)
      }
    />
  </div>

  <div>
    <label>Subtotal Rentas</label>
    <input
      readOnly
      value={`$ ${subtotalRentas.toLocaleString("en-US")}`}
    />
  </div>

  <div>
    <label>Subtotal Traslados</label>
    <input
      readOnly
      value={`$ ${subtotalTraslados.toLocaleString("en-US")}`}
    />
  </div>

  <div>
    <label>Subtotal General</label>
    <input
      readOnly
      value={`$ ${subtotal.toLocaleString("en-US")}`}
    />
  </div>

  <div>
    <label>IVA 16%</label>
    <input
      readOnly
      value={`$ ${iva.toLocaleString("en-US")}`}
    />
  </div>

  <div>
    <label>Total</label>
    <input
      readOnly
      value={`$ ${total.toLocaleString("en-US")}`}
    />
  </div>

</div>

</div>

<div className="panel">

  <h3>Observaciones</h3>

      <textarea
        className="textarea-grande"
        placeholder="Agregar / incluir: plazo de entrega y condiciones de la entrega"
        value={observaciones}
        onChange={(e) =>
          setObservaciones(e.target.value)
        }
      />

    </div>

<div className="panel">

      <h3>Cláusulas</h3>

      <button
        type="button"
        className="btn-guardar"
        onClick={agregarClausulaEstandar}
        style={{ marginBottom: "10px" }}
      >
        + Agregar Cláusula Estándar
      </button>

      <textarea
        className="textarea-grande"
        placeholder="Revisa los puntos del 2—3 el importe incluye: operación, combustible, seguro del equipo y traslados, ya que puede variar dependiendo de la Renta y el tipo de equipo "
        value={clausulas}
        onChange={(e) =>
          setClausulas(e.target.value)
        }
      />

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
    <ListaCotizaciones
      cotizaciones={cotizaciones}
      onCargar={cargarCotizacion}
      mostrarAutor={isAdmin}
    />
  </div>

</div>
 )}

</div>

</Layout>

);
}

export default Rentas;