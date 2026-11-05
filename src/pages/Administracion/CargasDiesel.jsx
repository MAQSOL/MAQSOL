import Layout from "../../components/Layout";
import { useState } from "react";
import DeleteButton from "../../components/DeleteButton";
import { abrirDocPDF, encabezadoDoc, pieDoc, hoyMX } from "../../utils/pdfFormato";
import { useListaCompartida, useSharedTable } from "../../hooks/useSharedTable";
import { descargarExcelBonito, nombreArchivoSemana, numeroSemanaISO } from "../../utils/exportExcel";
import { S, fFecha, hoyISO, dinero, esc } from "./estilosAdmin";
import { IconoMas } from "../../components/Icons";
import CampoFecha from "../../components/CampoFecha";

const NUEVO = {
  id: "", fecha: "", equipoId: "", maquina: "", serie: "", obra: "",
  operador: "", recibeTicket: "", litros: "", precioLitro: "", total: 0, importeConIva: "", notas: ""
};

const NUEVO_M = {
  id: "", fecha: "", vehiculo: "", placas: "", destino: "",
  conductor: "", recibeTicket: "", litros: "", precioLitro: "", total: 0, importeConIva: "", notas: ""
};

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const lunesDe = (fecha) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
};

const num = (v) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v));
const litrosTxt = (n) => (Math.round(n * 10) / 10).toLocaleString("es-MX") + " L";
const redondear = (n) => Math.round(n * 100) / 100;

export default function CargasDiesel() {
  const [cargas, guardarCargas] = useListaCompartida("diesel_cargas");
  const [cargasM, guardarCargasM] = useListaCompartida("magna_cargas");
  const { registros: internos } = useSharedTable("equipos_internos");
  const { registros: externos } = useSharedTable("equipos_externos");
  const { registros: alquileres } = useSharedTable("alquileres");

  const [lunes, setLunes] = useState(() => lunesDe(new Date()));
  const [verTodo, setVerTodo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [fMaquina, setFMaquina] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO);

  // — Magna —
  const [busquedaM, setBusquedaM] = useState("");
  const [fVehiculoM, setFVehiculoM] = useState("");
  const [modalM, setModalM] = useState(false);
  const [formM, setFormM] = useState(NUEVO_M);
  const [tab, setTab] = useState("diesel");

  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  const desde = iso(lunes);
  const hasta = iso(domingo);
  const semana = numeroSemanaISO(lunes);
  const etiquetaPeriodo = verTodo
    ? "Todo el historial"
    : `Semana ${semana} · ${lunes.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })} al ${domingo.toLocaleDateString("es-MX")}`;

  const cambiarSemana = (delta) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + delta * 7);
    setLunes(d);
  };

  const catalogo = [
    ...internos.map((e) => ({ id: e.id, label: `${e.tipo || ""} ${e.marca || ""} ${e.modelo || ""}`.trim(), serie: e.serie || "", origen: "propio" })),
    ...externos.filter((e) => e.estado !== "Devuelto").map((e) => ({ id: e.id, label: `${e.tipo || ""} ${e.marca || ""} ${e.modelo || ""}`.trim(), serie: e.serie || "", origen: "externo" }))
  ];

  const obras = [...new Set([...alquileres.map((a) => a.obra), ...cargas.map((c) => c.obra)].filter(Boolean))].sort();
  const operadores = [...new Set(cargas.map((c) => c.operador).filter(Boolean))].sort();
  const ultimoPrecio = [...cargas].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))[0]?.precioLitro || "";

  // Magna: catálogos y lógica
  const destinosM = [...new Set(cargasM.map((c) => c.destino).filter(Boolean))].sort();
  const conductoresM = [...new Set(cargasM.map((c) => c.conductor).filter(Boolean))].sort();
  const ultimoPrecioM = [...cargasM].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))[0]?.precioLitro || "";
  const vehiculosConCargasM = [...new Set(cargasM.map((c) => c.vehiculo))].sort();

  const setM = (campo, valor) => setFormM((f) => ({ ...f, [campo]: valor }));
  const totalFormM = redondear(num(formM.litros) * num(formM.precioLitro));

  const abrirNuevoM = () => {
    setFormM({ ...NUEVO_M, id: "MG-" + Date.now(), fecha: hoyISO(), precioLitro: ultimoPrecioM });
    setModalM(true);
  };
  const abrirEditarM = (c) => { setFormM({ ...NUEVO_M, ...c }); setModalM(true); };

  const guardarFormM = () => {
    if (!formM.fecha) return alert("Indica la fecha de la carga.");
    if (!formM.vehiculo.trim()) return alert("Indica el vehículo.");
    if (num(formM.litros) <= 0) return alert("Captura cuántos litros se cargaron.");
    if (num(formM.precioLitro) <= 0) return alert("Captura el precio por litro.");
    const registro = { ...formM, total: totalFormM };
    const existe = cargasM.some((c) => c.id === formM.id);
    guardarCargasM(existe ? cargasM.map((c) => (c.id === formM.id ? registro : c)) : [...cargasM, registro]);
    setModalM(false);
  };

  const filtradasM = cargasM
    .filter((c) => verTodo || (c.fecha >= desde && c.fecha <= hasta))
    .filter((c) => !fVehiculoM || c.vehiculo === fVehiculoM)
    .filter((c) => `${c.vehiculo} ${c.placas} ${c.destino} ${c.conductor}`.toLowerCase().includes(busquedaM.toLowerCase()))
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const totalLitrosM = filtradasM.reduce((s, c) => s + num(c.litros), 0);
  const totalImporteM = filtradasM.reduce((s, c) => s + num(c.total), 0);
  const totalConIvaM = filtradasM.reduce((s, c) => s + num(c.importeConIva), 0);
  const precioPromM = totalLitrosM ? totalImporteM / totalLitrosM : 0;

  const porVehiculo = Object.values(
    filtradasM.reduce((acc, c) => {
      const k = c.vehiculo + "|" + c.placas;
      acc[k] = acc[k] || { vehiculo: c.vehiculo, placas: c.placas, cargas: 0, litros: 0, importe: 0 };
      acc[k].cargas += 1;
      acc[k].litros += num(c.litros);
      acc[k].importe += num(c.total);
      return acc;
    }, {})
  ).sort((a, b) => b.litros - a.litros);
  const maxLitrosM = Math.max(1, ...porVehiculo.map((v) => v.litros));

  const abrirNuevo = () => {
    setForm({ ...NUEVO, id: "D-" + Date.now(), fecha: hoyISO(), precioLitro: ultimoPrecio });
    setModal(true);
  };
  const abrirEditar = (c) => {
    setForm({ ...NUEVO, ...c });
    setModal(true);
  };

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const elegirMaquina = (idx) => {
    const m = catalogo[idx];
    if (!m) return;
    setForm((f) => ({ ...f, equipoId: m.id, maquina: m.label, serie: m.serie }));
  };

  const totalForm = redondear(num(form.litros) * num(form.precioLitro));

  const guardarForm = () => {
    if (!form.fecha) return alert("Indica la fecha de la carga.");
    if (!form.maquina.trim()) return alert("Indica a qué máquina se le cargó.");
    if (num(form.litros) <= 0) return alert("Captura cuántos litros se cargaron.");
    if (num(form.precioLitro) <= 0) return alert("Captura el precio por litro.");
    const registro = { ...form, total: totalForm };
    const existe = cargas.some((c) => c.id === form.id);
    guardarCargas(existe ? cargas.map((c) => (c.id === form.id ? registro : c)) : [...cargas, registro]);
    setModal(false);
  };

  const filtradas = cargas
    .filter((c) => verTodo || (c.fecha >= desde && c.fecha <= hasta))
    .filter((c) => !fMaquina || c.maquina === fMaquina)
    .filter((c) => `${c.maquina} ${c.serie} ${c.obra} ${c.operador}`.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const totalLitros = filtradas.reduce((s, c) => s + num(c.litros), 0);
  const totalImporte = filtradas.reduce((s, c) => s + num(c.total), 0);
  const totalConIva = filtradas.reduce((s, c) => s + num(c.importeConIva), 0);
  const precioProm = totalLitros ? totalImporte / totalLitros : 0;

  const porMaquina = Object.values(
    filtradas.reduce((acc, c) => {
      const k = c.maquina + "|" + c.serie;
      acc[k] = acc[k] || { maquina: c.maquina, serie: c.serie, cargas: 0, litros: 0, importe: 0, conIva: 0 };
      acc[k].cargas += 1;
      acc[k].litros += num(c.litros);
      acc[k].importe += num(c.total);
      acc[k].conIva += num(c.importeConIva);
      return acc;
    }, {})
  ).sort((a, b) => b.litros - a.litros);
  const maxLitros = Math.max(1, ...porMaquina.map((m) => m.litros));

  const maquinasConCargas = [...new Set(cargas.map((c) => c.maquina))].sort();

  const exportarExcel = () => {
    if (!filtradas.length) return alert("No hay cargas en este periodo.");
    const detalleOrdenado = filtradas.slice().sort((x, y) => (x.fecha || "").localeCompare(y.fecha || ""));
    descargarExcelBonito({
      titulo: "Cargas de Combustible",
      subtitulo: `${etiquetaPeriodo} · ${filtradas.length} cargas · ${litrosTxt(totalLitros)} · Sin impuestos ${dinero(totalImporte)} · Con impuestos ${dinero(totalConIva)}`,
      columnas: ["Fecha", "Máquina", "Serie", "Obra", "Operador", "Recibe ticket", "Litros", "Precio por litro (sin imp.)", "Total sin impuestos", "Importe con impuestos"],
      formatos: [null, null, null, null, null, null, "litros", "moneda", "moneda", "moneda"],
      filas: [
        ...detalleOrdenado.map((c) => [fFecha(c.fecha), c.maquina, c.serie, c.obra, c.operador, c.recibeTicket||"", num(c.litros), num(c.precioLitro), num(c.total), c.importeConIva ? num(c.importeConIva) : null]),
        ["", "", "", "", "TOTAL", "", redondear(totalLitros), redondear(precioProm), redondear(totalImporte), redondear(totalConIva)]
      ],
      tema: { enc: "3A3A3A", titulo: "8F1D2C", zebra: "F5F5F5", total: "E4E4E4", acento: "8F1D2C", logo: "nuevo" },
      hojasExtra: [{
        titulo: "Resumen por máquina",
        subtitulo: etiquetaPeriodo,
        columnas: ["Máquina", "Serie", "Cargas", "Litros", "Importe sin impuestos", "Importe con impuestos"],
        formatos: [null, null, "entero", "litros", "moneda", "moneda"],
        filas: [
          ...porMaquina.map((m) => [m.maquina, m.serie || "", m.cargas, redondear(m.litros), redondear(m.importe), m.conIva ? redondear(m.conIva) : null]),
          ["", "TOTAL", filtradas.length, redondear(totalLitros), redondear(totalImporte), redondear(totalConIva)]
        ]
      }],
      nombreArchivo: nombreArchivoSemana("DIESEL", lunes)
    });
  };

  const generarPDF = () => {
    if (!filtradas.length) return alert("No hay cargas en este periodo.");
    const resumen = porMaquina
      .map((m) => `<tr><td>${esc(m.maquina)}</td><td>${esc(m.serie || "—")}</td><td class="c">${m.cargas}</td><td class="r">${litrosTxt(m.litros)}</td><td class="r b">${dinero(m.importe)}</td><td class="r b">${m.conIva ? dinero(m.conIva) : "—"}</td></tr>`)
      .join("");
    const detalle = filtradas
      .slice()
      .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
      .map((c) => `<tr><td>${fFecha(c.fecha)}</td><td>${esc(c.maquina)}</td><td>${esc(c.serie || "—")}</td><td>${esc(c.obra || "—")}</td><td>${esc(c.operador || "—")}</td><td>${esc(c.recibeTicket || "—")}</td><td class="r">${litrosTxt(num(c.litros))}</td><td class="r">${dinero(c.precioLitro)}</td><td class="r b">${dinero(c.total)}</td><td class="r b">${c.importeConIva ? dinero(c.importeConIva) : "—"}</td></tr>`)
      .join("");
    abrirDocPDF({
      nombre: "Cargas de diesel",
      cuerpo: `${encabezadoDoc("Cargas de Combustible", [etiquetaPeriodo, "Generado: " + hoyMX()])}
      <h2>Resumen por máquina</h2>
      <table><thead><tr><th>Máquina</th><th>Serie</th><th class="c">Cargas</th><th class="r">Litros</th><th class="r">Importe</th><th class="r">Con impuestos</th></tr></thead><tbody>${resumen}</tbody></table>
      <div class="tot"><span>Litros: <b>${litrosTxt(totalLitros)}</b></span><span>Precio prom.: <b>${dinero(precioProm)}</b></span><span>Total sin impuestos: <b>${dinero(totalImporte)}</b></span><span>Total con impuestos: <b>${dinero(totalConIva)}</b></span></div>
      <h2>Detalle de cargas</h2>
      <table><thead><tr><th>Fecha</th><th>Máquina</th><th>Serie</th><th>Obra</th><th>Operador</th><th>Recibe ticket</th><th class="r">Litros</th><th class="r">Precio/L</th><th class="r">Total sin imp.</th><th class="r">Con impuestos</th></tr></thead><tbody>${detalle}</tbody></table>
      ${pieDoc("Los importes con impuestos son los capturados manualmente")}`
    });
  };

  return (
    <Layout>
      <div style={{ width: "100%" }}>

        {/* Selector de semana compartido */}
        <div style={{ ...S.card, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-sys" style={{ ...S.btnGris, padding: "8px 14px" }} disabled={verTodo} onClick={() => cambiarSemana(-1)}>← Anterior</button>
            <strong style={{ minWidth: 260, textAlign: "center" }}>{etiquetaPeriodo}</strong>
            <button className="btn-sys" style={{ ...S.btnGris, padding: "8px 14px" }} disabled={verTodo} onClick={() => cambiarSemana(1)}>Siguiente →</button>
            <button className="btn-sys" style={{ ...S.btnGris, padding: "8px 14px" }} disabled={verTodo} onClick={() => setLunes(lunesDe(new Date()))}>Esta semana</button>
            <label className="chk-sys" style={{ marginLeft: "auto", fontSize: 13 }}>
              <input type="checkbox" checked={verTodo} onChange={(e) => setVerTodo(e.target.checked)} />
              <span className="checkmark"></span>
              Ver todo el historial
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "3px solid #111", marginBottom: 28 }}>
          {[["diesel","Cargas de Diesel"],["magna","Cargas de Magna"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 28px", fontWeight: 800, fontFamily: "'Montserrat',sans-serif", fontSize: 14, border: "none", borderBottom: tab===t ? "3px solid var(--acento)" : "3px solid transparent", borderRadius: 0, marginBottom: -3, background: "transparent", color: tab===t ? "var(--acento)" : "#777", cursor: "pointer" }}>{label}</button>
          ))}
        </div>

        {tab === "magna" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Cargas de Magna</h1>
            <p style={S.sub}>Registro de gasolina por vehículo, destino y conductor</p>
          </div>
          <button className="btn-sys" style={S.btn} onClick={abrirNuevoM}><IconoMas />Registrar carga</button>
        </div>

        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div>
              <label style={S.label}>BUSCAR</label>
              <input style={S.input} placeholder="Vehículo, placas, destino o conductor" value={busquedaM} onChange={(e) => setBusquedaM(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>VEHÍCULO</label>
              <select style={S.input} value={fVehiculoM} onChange={(e) => setFVehiculoM(e.target.value)}>
                <option value="">Todos</option>
                {vehiculosConCargasM.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ ...S.card, marginBottom: 0, background: "var(--acento)", color: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>LITROS CARGADOS</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{litrosTxt(totalLitrosM)}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{filtradasM.length} cargas</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>GASTO TOTAL</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{dinero(totalImporteM)}</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>PRECIO PROMEDIO / LITRO</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{totalLitrosM ? dinero(precioPromM) : "—"}</div>
          </div>
        </div>

        {porVehiculo.length > 0 && (
          <div style={S.card}>
            <h3 style={{ ...S.h3, marginTop: 0 }}>Consumo por vehículo</h3>
            {porVehiculo.map((v) => (
              <div key={v.vehiculo + v.placas} style={{ display: "grid", gridTemplateColumns: "minmax(180px,1.2fr) 3fr 150px", gap: 14, alignItems: "center", padding: "6px 0" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{v.vehiculo}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{v.placas ? `Placas ${v.placas} · ` : ""}{v.cargas} cargas</div>
                </div>
                <div style={{ background: "#eee", borderRadius: 0, height: 14, overflow: "hidden" }}>
                  <div style={{ width: `${(v.litros / maxLitrosM) * 100}%`, height: "100%", background: "var(--acento)" }} />
                </div>
                <div style={{ textAlign: "right", fontSize: 13 }}>
                  <strong>{litrosTxt(v.litros)}</strong>
                  <div style={{ color: "#777" }}>{dinero(v.importe)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...S.card, padding: 0, overflowX: "auto", marginBottom: 48 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={S.th}>FECHA</th><th style={S.th}>VEHÍCULO</th><th style={S.th}>PLACAS</th>
                <th style={S.th}>DESTINO</th><th style={S.th}>CONDUCTOR</th><th style={S.th}>RECIBE TICKET</th><th style={S.th}>LITROS</th>
                <th style={S.th}>PRECIO/L</th><th style={S.th}>TOTAL SIN IMP.</th><th style={S.th}>CON IMP.</th><th style={{ ...S.th, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtradasM.length === 0 ? (
                <tr><td colSpan={11} style={{ ...S.td, textAlign: "center", color: "#999", padding: 32 }}>No hay cargas en este periodo. Usa "Registrar carga".</td></tr>
              ) : filtradasM.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...S.td, cursor: "pointer" }} onClick={() => abrirEditarM(c)}>{fFecha(c.fecha)}</td>
                  <td style={{ ...S.td, fontWeight: 700, cursor: "pointer" }} onClick={() => abrirEditarM(c)}>{c.vehiculo}</td>
                  <td style={S.td}>{c.placas || "—"}</td>
                  <td style={S.td}>{c.destino || "—"}</td>
                  <td style={S.td}>{c.conductor || "—"}</td>
                  <td style={S.td}>{c.recibeTicket || "—"}</td>
                  <td style={S.td}>{litrosTxt(num(c.litros))}</td>
                  <td style={S.td}>{dinero(c.precioLitro)}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{dinero(c.total)}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{c.importeConIva ? dinero(c.importeConIva) : "—"}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    <DeleteButton size="sm" title="Eliminar carga" onConfirm={() => guardarCargasM(cargasM.filter((x) => x.id !== c.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        </>}

        {tab === "diesel" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Cargas de Combustible</h1>
            <p style={S.sub}>Registro semanal de combustible por máquina, obra y operador</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-sys btn-excel" style={S.btnGris} onClick={exportarExcel}>Descargar Excel</button>
            <button className="btn-sys btn-pdf" style={S.btnVerde} onClick={generarPDF}>Generar PDF</button>
            <button className="btn-sys" style={S.btn} onClick={abrirNuevo}><IconoMas />Registrar carga</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div>
              <label style={S.label}>BUSCAR</label>
              <input style={S.input} placeholder="Máquina, serie, obra u operador" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>MÁQUINA</label>
              <select style={S.input} value={fMaquina} onChange={(e) => setFMaquina(e.target.value)}>
                <option value="">Todas</option>
                {maquinasConCargas.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ ...S.card, marginBottom: 0, background: "var(--acento)", color: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>LITROS CARGADOS</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{litrosTxt(totalLitros)}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{filtradas.length} cargas</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>GASTO TOTAL</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{dinero(totalImporte)}</div>
          </div>
          <div style={{ ...S.card, marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>PRECIO PROMEDIO / LITRO</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{totalLitros ? dinero(precioProm) : "—"}</div>
          </div>
        </div>

        {porMaquina.length > 0 && (
          <div style={S.card}>
            <h3 style={{ ...S.h3, marginTop: 0 }}>Consumo por máquina</h3>
            {porMaquina.map((m) => (
              <div key={m.maquina + m.serie} style={{ display: "grid", gridTemplateColumns: "minmax(180px,1.2fr) 3fr 150px", gap: 14, alignItems: "center", padding: "6px 0" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.maquina}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{m.serie ? `Serie ${m.serie} · ` : ""}{m.cargas} cargas</div>
                </div>
                <div style={{ background: "#eee", borderRadius: 0, height: 14, overflow: "hidden" }}>
                  <div style={{ width: `${(m.litros / maxLitros) * 100}%`, height: "100%", background: "var(--acento)" }} />
                </div>
                <div style={{ textAlign: "right", fontSize: 13 }}>
                  <strong>{litrosTxt(m.litros)}</strong>
                  <div style={{ color: "#777" }}>{dinero(m.importe)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...S.card, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={S.th}>FECHA</th><th style={S.th}>MÁQUINA</th><th style={S.th}>SERIE</th><th style={S.th}>OBRA</th>
                <th style={S.th}>OPERADOR</th><th style={S.th}>RECIBE TICKET</th><th style={S.th}>LITROS</th><th style={S.th}>PRECIO/L</th><th style={S.th}>TOTAL SIN IMP.</th><th style={S.th}>CON IMPUESTOS</th><th style={{ ...S.th, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={11} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                  No hay cargas en este periodo. Usa "Registrar carga".
                </td></tr>
              ) : filtradas.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...S.td, cursor: "pointer" }} onClick={() => abrirEditar(c)}>{fFecha(c.fecha)}</td>
                  <td style={{ ...S.td, fontWeight: 700, cursor: "pointer" }} onClick={() => abrirEditar(c)}>{c.maquina}</td>
                  <td style={S.td}>{c.serie || "—"}</td>
                  <td style={S.td}>{c.obra || "—"}</td>
                  <td style={S.td}>{c.operador || "—"}</td>
                  <td style={S.td}>{c.recibeTicket || "—"}</td>
                  <td style={S.td}>{litrosTxt(num(c.litros))}</td>
                  <td style={S.td}>{dinero(c.precioLitro)}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{dinero(c.total)}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{c.importeConIva ? dinero(c.importeConIva) : "—"}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    <DeleteButton size="sm" title="Eliminar carga" onConfirm={() => guardarCargas(cargas.filter((x) => x.id !== c.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>}
      </div>

      {modal && (
        <div style={S.modalBg} onClick={() => setModal(false)}>
          <div style={{ ...S.modal, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              {cargas.some((c) => c.id === form.id) ? "Editar carga de diesel" : "Registrar carga de diesel"}
            </h2>

            <div style={S.grid2}>
              <div><label style={S.label}>FECHA</label><CampoFecha  style={S.input} value={form.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
              <div>
                <label style={S.label}>TOMAR DE EQUIPOS REGISTRADOS</label>
                <select style={S.input} value="" onChange={(e) => elegirMaquina(e.target.value)}>
                  <option value="">— Elegir o escribir abajo —</option>
                  {catalogo.filter((m) => m.origen === "propio").length > 0 && (
                    <optgroup label="Equipos MAQSOL (propios)">
                      {catalogo.filter((m) => m.origen === "propio").map((m) => {
                        const idx = catalogo.indexOf(m);
                        return <option key={idx} value={idx}>{`${m.label} · ${m.serie || "s/n"}`}</option>;
                      })}
                    </optgroup>
                  )}
                  {catalogo.filter((m) => m.origen === "externo").length > 0 && (
                    <optgroup label="Equipos subarrendados (de terceros)">
                      {catalogo.filter((m) => m.origen === "externo").map((m) => {
                        const idx = catalogo.indexOf(m);
                        const eq = externos.find((e) => e.id === m.id);
                        return <option key={idx} value={idx}>{`${m.label} · ${m.serie || "s/n"}${eq?.proveedor ? ` · ${eq.proveedor}` : ""}`}</option>;
                      })}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>MÁQUINA</label><input style={S.input} value={form.maquina} onChange={(e) => set("maquina", e.target.value)} placeholder="Ej. Manipulador Genie GTH-844" /></div>
              <div><label style={S.label}>SERIE</label><input style={S.input} value={form.serie} onChange={(e) => set("serie", e.target.value)} /></div>
            </div>
            <div style={S.grid3}>
              <div>
                <label style={S.label}>OBRA</label>
                <input style={S.input} list="obras-diesel" value={form.obra} onChange={(e) => set("obra", e.target.value)} />
                <datalist id="obras-diesel">{obras.map((o) => <option key={o} value={o} />)}</datalist>
              </div>
              <div>
                <label style={S.label}>OPERADOR</label>
                <input style={S.input} list="operadores-diesel" value={form.operador} onChange={(e) => set("operador", e.target.value)} />
                <datalist id="operadores-diesel">{operadores.map((o) => <option key={o} value={o} />)}</datalist>
              </div>
              <div><label style={S.label}>A QUIÉN SE LE DIO EL TICKET</label><input style={S.input} value={form.recibeTicket} onChange={(e) => set("recibeTicket", e.target.value)} /></div>
            </div>
            <div style={S.grid3}>
              <div><label style={S.label}>LITROS</label><input type="number" min="0" step="0.1" style={S.input} value={form.litros} onChange={(e) => set("litros", e.target.value)} /></div>
              <div><label style={S.label}>PRECIO POR LITRO (SIN IMPUESTOS)</label><input type="number" min="0" step="0.01" style={S.input} value={form.precioLitro} onChange={(e) => set("precioLitro", e.target.value)} /></div>
              <div>
                <label style={S.label}>TOTAL (SIN IMPUESTOS)</label>
                <div style={{ ...S.input, background: "#f5f5f5", fontWeight: 800 }}>{dinero(totalForm)}</div>
              </div>
            </div>
            <div style={{ ...S.grid2, marginBottom: 14 }}>
              <div>
                <label style={S.label}>IMPORTE CON IMPUESTOS (LO CAPTURAS TÚ)</label>
                <input type="number" min="0" step="0.01" style={S.input} value={form.importeConIva || ""} onChange={(e) => set("importeConIva", e.target.value)} placeholder="Según el ticket o factura" />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>NOTAS</label>
              <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn-sys" style={S.btnGris} onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-sys" style={S.btn} onClick={guardarForm}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Magna */}
      {modalM && (
        <div style={S.modalBg} onClick={() => setModalM(false)}>
          <div style={{ ...S.modal, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              {cargasM.some((c) => c.id === formM.id) ? "Editar carga de magna" : "Registrar carga de magna"}
            </h2>
            <div style={S.grid2}>
              <div><label style={S.label}>FECHA</label><CampoFecha style={S.input} value={formM.fecha} onChange={(e) => setM("fecha", e.target.value)} /></div>
              <div><label style={S.label}>VEHÍCULO</label><input style={S.input} value={formM.vehiculo} onChange={(e) => setM("vehiculo", e.target.value)} placeholder="Ej. Camioneta Ram 1500" /></div>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>PLACAS</label><input style={S.input} value={formM.placas} onChange={(e) => setM("placas", e.target.value)} placeholder="Ej. ABC-123-D" /></div>
              <div>
                <label style={S.label}>DESTINO / OBRA</label>
                <input style={S.input} list="destinos-magna" value={formM.destino} onChange={(e) => setM("destino", e.target.value)} />
                <datalist id="destinos-magna">{destinosM.map((d) => <option key={d} value={d} />)}</datalist>
              </div>
            </div>
            <div style={{ ...S.grid2, marginBottom: 14 }}>
              <div>
                <label style={S.label}>CONDUCTOR</label>
                <input style={S.input} list="conductores-magna" value={formM.conductor} onChange={(e) => setM("conductor", e.target.value)} />
                <datalist id="conductores-magna">{conductoresM.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div><label style={S.label}>A QUIÉN SE LE DIO EL TICKET</label><input style={S.input} value={formM.recibeTicket} onChange={(e) => setM("recibeTicket", e.target.value)} /></div>
            </div>
            <div style={S.grid3}>
              <div><label style={S.label}>LITROS</label><input type="number" min="0" step="0.1" style={S.input} value={formM.litros} onChange={(e) => setM("litros", e.target.value)} /></div>
              <div><label style={S.label}>PRECIO POR LITRO (SIN IMPUESTOS)</label><input type="number" min="0" step="0.01" style={S.input} value={formM.precioLitro} onChange={(e) => setM("precioLitro", e.target.value)} /></div>
              <div>
                <label style={S.label}>TOTAL (SIN IMPUESTOS)</label>
                <div style={{ ...S.input, background: "#f5f5f5", fontWeight: 800 }}>{dinero(totalFormM)}</div>
              </div>
            </div>
            <div style={{ ...S.grid2, marginBottom: 14 }}>
              <div>
                <label style={S.label}>IMPORTE CON IMPUESTOS (LO CAPTURAS TÚ)</label>
                <input type="number" min="0" step="0.01" style={S.input} value={formM.importeConIva || ""} onChange={(e) => setM("importeConIva", e.target.value)} placeholder="Según el ticket o factura" />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>NOTAS</label>
              <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={formM.notas} onChange={(e) => setM("notas", e.target.value)} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn-sys" style={S.btnGris} onClick={() => setModalM(false)}>Cancelar</button>
              <button className="btn-sys" style={S.btn} onClick={guardarFormM}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
