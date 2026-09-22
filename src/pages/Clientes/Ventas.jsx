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

function Ventas() {

  const { registros: cotizaciones, guardar: guardarCotizacionDB } = useCotizaciones("venta");
  const { registros: clientesGuardados } = useSharedTable("clientes");
  const { codigos, miCodigo, nombrePorCodigo, telefonoPorCodigo } = useCodigosFolio();

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
  setFolio(`${codigoUsuario}-V${numeroFolio}-${mes}${anio}`);
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
  const [tipoEquipo, setTipoEquipo] = useState(""); const [tipoEquipoOtro, setTipoEquipoOtro] = useState("");
  const marcasPorTipo = {
  "Plataforma tipo tijera": ["Genie", "Zoomlion", "JLG"],
  "Plataforma tipo articulada": ["Genie", "Zoomlion", "JLG"],
  "Manipulador telescopico": ["Genie", "Dieci", "Haulotte", "Caterpillar", "Manitou", "JCB"],
  "Retroexcavadora": ["Terex", "Caterpillar", "John Deere", "JCB", "Manitou", "Case"]
};
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [datosTecnicos, setDatosTecnicos] = useState([
  {
    concepto: "",
    dato: ""
  }
]);

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
// ====================================
// DATOS TECNICOS
// ====================================

const agregarDatoTecnico = () => {
  setDatosTecnicos([
    ...datosTecnicos,
    {
      concepto: "",
      dato: ""
    }
  ]);
};

const eliminarDatoTecnico = (index) => {

  const nuevosDatos = [...datosTecnicos];

  nuevosDatos.splice(index, 1);

  setDatosTecnicos(nuevosDatos);

};

const actualizarDatoTecnico = (
  index,
  campo,
  valor
) => {
  const nuevosDatos = [...datosTecnicos];

  nuevosDatos[index][campo] = valor;

  setDatosTecnicos(nuevosDatos);
};
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
  cliente: clienteFinal,
  atencion,
  correo,
  telefono,
  ubicacion,

  marca,
  modelo,
  tipoEquipo,

  descripcion,

  datosTecnicos,
  precio,

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

const subtotal =
  Number(precio || 0);

const iva =
  subtotal * 0.16;

const total =
  subtotal + iva;

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
doc.setFontSize(9);
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

// DESCRIPCION

const yDesc = yBloques;

doc.setFillColor(0, 0, 0);
doc.rect(20, yDesc, 170, 7, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(255, 255, 255);
doc.text("DESCRIPCION", 23, yDesc + 5);

doc.setTextColor(0, 0, 0);
doc.setFont("helvetica", "normal");
doc.setFontSize(9);

const descripcionTexto =
doc.splitTextToSize(
  descripcion,
  161
);

doc.setDrawColor(210, 210, 210);
doc.setLineWidth(0.1);
doc.rect(20, yDesc + 7, 170, 25);

doc.text(
  descripcionTexto,
  24,
  yDesc + 13
);

const finDescripcion = yDesc + 32;

// DATOS TECNICOS

const yDT = finDescripcion + 6;

doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);

doc.text(
"DATOS TECNICOS",
20,
yDT + 3
);

doc.setFont("helvetica", "normal");

doc.setFillColor(128, 0, 32);
doc.setTextColor(255, 255, 255);

doc.rect(20, yDT + 6, 85, 8, "F");
doc.rect(105, yDT + 6, 85, 8, "F");

doc.setFont("helvetica", "bold");

doc.text("CONCEPTO", 62, yDT + 11, { align: "center" });
doc.text("DATO", 147, yDT + 11, { align: "center" });

doc.setTextColor(0, 0, 0);

doc.setFont("helvetica", "normal");

let yTecnicos = yDT + 14;

datosTecnicos.forEach((item, index) => {

 if (index % 2 === 0) {
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yTecnicos, 85, 8, "F");
    doc.rect(105, yTecnicos, 85, 8, "F");
  }

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.1);
  doc.rect(20, yTecnicos, 85, 8);
  doc.rect(105, yTecnicos, 85, 8);

doc.text(item.concepto || "", 25, yTecnicos + 5);
doc.text(item.dato || "", 110, yTecnicos + 5);

  yTecnicos += 8;

});

// ==========================
// RESUMEN ECONOMICO
// ==========================

doc.setFont("helvetica", "normal");
doc.setFontSize(9);

doc.text("Subtotal:", 150, yTecnicos + 8);
doc.text(
  `$ ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  186,
  yTecnicos + 8,
  { align: "right" }
);

doc.text("IVA 16%:", 150, yTecnicos + 15);
doc.text(
  `$ ${iva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  186,
  yTecnicos + 15,
  { align: "right" }
);

doc.setFillColor(128, 0, 32);
doc.rect(129, yTecnicos + 20, 61, 10, "F");
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(11);

doc.text("TOTAL:", 134, yTecnicos + 27);
doc.text(
  `$ ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  187,
  yTecnicos + 27,
  { align: "right" }
);

doc.setTextColor(0, 0, 0);
doc.setFontSize(10);

const finResumen = yTecnicos + 38;

// OBSERVACIONES

y = finResumen + 5;

verificarPagina();

doc.setFont("helvetica", "bold");

doc.text(
  "OBSERVACIONES / TIEMPO DE ENTREGA",
  20,
  y
);

doc.setFont("helvetica", "normal");

const observacionesTexto =
doc.splitTextToSize(
  observaciones,
  165
);

doc.text(
  observacionesTexto,
  20,
  y + 8
);

const finObservaciones =
  y + 10 +
  (observacionesTexto.length * 6);

// CLAUSULAS

y = finObservaciones + 2;

if (y > 150) {
  doc.addPage();
  y = 20;
}

doc.setFont("helvetica", "bold");

doc.text(
  "CLAUSULAS",
  20,
  y
);

doc.setFont("helvetica", "normal");

const clausulasTexto =
doc.splitTextToSize(
  clausulas,
  165
);

let yClausulas = y + 10;

clausulasTexto.forEach((linea) => {

if (yClausulas > 270) {

  doc.addPage();

  yClausulas = 20;
}

  doc.text(
    linea,
    20,
    yClausulas
  );

  yClausulas += 6;

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

  // ==========================
  // CARGAR
  // ==========================

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

setPrecio(cotizacion.precio || "");

setDescripcion(cotizacion.descripcion);

setDatosTecnicos(
  cotizacion.datosTecnicos || [
    {
      concepto: "",
      dato: ""
    }
  ]
);

setObservaciones(cotizacion.observaciones);
    setClausulas(cotizacion.clausulas);
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
    setPrecio("");
    setDescripcion("");

    setObservaciones("");
    setClausulas("");
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
            src={logo}
            alt="MAQSISTEM"
            style={{
                           width: "70px"
            }}
          />

          <div>
            <h2>Cotización de Venta</h2>
      
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
        padding: "20px 12px",
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
    </select>
  ) : (
    <input
      placeholder="Marca"
      value={marca}
      onChange={(e) => setMarca(e.target.value)}
    />
  )}

  <input
    placeholder="Modelo"
    value={modelo}
    onChange={(e) => setModelo(e.target.value)}
  />

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
      style={{
        padding: "20px 12px",
        borderRadius: "8px",
        border: "1px solid #ccc"
      }}
    />
  )}

</div>

</div>
</div>

<div className="panel">
  <h3>Datos Técnicos</h3>

{datosTecnicos.map((item, index) => (
  <div
    key={index}
    className="form-grid"
    style={{
      gridTemplateColumns: "1fr 1fr 45px",
      marginBottom: "10px"
    }}
  >
    <input
      placeholder="Concepto"
      value={item.concepto}
      onChange={(e) =>
        actualizarDatoTecnico(
          index,
          "concepto",
          e.target.value
        )
      }
    />

    <input
      placeholder="Dato"
      value={item.dato}
      onChange={(e) =>
        actualizarDatoTecnico(
          index,
          "dato",
          e.target.value
        )
      }
    />

    <DeleteButton
      size="sm"
      title="Quitar dato técnico"
      onConfirm={() => eliminarDatoTecnico(index)}
    />
  </div>
))}

  <button
    type="button"
    className="btn-guardar"
    onClick={agregarDatoTecnico}
  >
    + Agregar Dato Técnico
  </button>

</div>

<div className="panel">

  <h3>Resumen Económico</h3>

  <div className="form-grid">

    <div>
      <label>Precio de Venta</label>

      <input
        type="number"
        value={precio}
        onChange={(e) =>
          setPrecio(e.target.value)
        }
      />
    </div>

    <div>
      <label>IVA 16%</label>

      <input
        readOnly
        value={`$ ${(
          Number(precio || 0) * 0.16
        ).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`}
      />
    </div>

<div>
  <label>Total</label>

  <input
    readOnly
    value={`$ ${(
      Number(precio || 0) + Number(precio || 0) * 0.16
    ).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`}
  />
</div>

  </div>

</div>

<div className="panel">

  <h3>Descripción</h3>

  <textarea
    className="textarea-grande"
    placeholder="Descripción"
    value={descripcion}
    onChange={(e) =>
      setDescripcion(e.target.value)
    }
  />

</div>

<div className="panel">

      <h3>Observaciones</h3>

      <button
        type="button"
        className="btn-guardar"
onClick={() =>
          setObservaciones(
`1. Plazo de entrega:
Fecha de entrega: dependiendo del equipo, posterior a la confirmación y de recibido el pago por el equipo seleccionado, el equipo está sujeto a disponibilidad en el momento de la confirmación.`
          )
        }
        style={{ marginBottom: "10px" }}
      >
        + Agregar Observación Estándar
      </button>

      <textarea
        className="textarea-grande"
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
        onClick={() =>
          setClausulas(

`Lugar de entrega: L.A.B. sus instalaciones ubicadas en Cancún, Quintana roo fuera de esta demarcación se cotizará el precio de las maniobras y traslados correspondientes.
CONDICIONES COMERCIALES:
a) Vigencia de la cotización: 15 días naturales.
b) Forma de pago: Por transferencia electrónica de fondos, depósito bancario o cheque.
c) No se incluye seguro del equipo, ni gastos adicionales por maniobras o cualquier otro concepto.
d) Precios sujetos a cambio sin previo aviso.
e) Precios sujetos a disponibilidad
f) Equipo que se vende en el estado en que se encuentra.

En caso de aceptar nuestra oferta puede realizar el depósito bancario o transferencia a nombre de Maquinaria Soporte y Logística, S.A. de C.V., en nuestra cuenta, y confirmar el pago, enviando el comprobante del depósito o transferencia bancaria al correo facturación@maqsol.com.mx y ftorres@maqsol.com.mx`
          )
        }
        style={{ marginBottom: "10px" }}
      >
        + Agregar Cláusula Estándar
      </button>

      <textarea
        className="textarea-grande"
        value={clausulas}
        onChange={(e) =>
          setClausulas(e.target.value)
        }
      />

    </div>   <div className="panel">

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
  {listaCotizaciones.length === 0 ? (

    <p>
      No hay cotizaciones guardadas.
    </p>

  ) : (

    listaCotizaciones
      .slice(0, 5)
      .map((cotizacion) => (

        <div
          key={cotizacion.id}
          style={{
            borderBottom: "1px solid #ddd",
            paddingBottom: "12px",
            marginBottom: "12px"
          }}
        >

            <strong>
              {cotizacion.folio}
            </strong>

            <p>
              {cotizacion.cliente}
            </p>

            <small>
              {cotizacion.fecha}
            </small>

            <br />

            <button
              className="btn-panel"
              onClick={() =>
                cargarCotizacion(cotizacion)
              }
            >
              Ver / Editar
            </button>

          </div>

    ))

)}
  </div>

</div>
 )}

</div>

</Layout>

);
}

export default Ventas;