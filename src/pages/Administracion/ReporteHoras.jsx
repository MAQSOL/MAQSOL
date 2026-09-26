import Layout from "../../components/Layout";
import { useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import logo from "../../assets/logo.png";
import { useListaCompartida, useSharedTable } from "../../hooks/useSharedTable";
import { descargarExcelBonito, nombreArchivoFecha } from "../../utils/exportExcel";
import { S, fFecha, hoyISO, esc } from "./estilosAdmin";

const NUEVO = {
  id: "", fecha: "", equipoId: "", equipoLabel: "", cliente: "", operador: "",
  horometroInicial: "", horometroFinal: "", horas: "", notas: ""
};

const etiquetaEquipo = (e, origen) =>
  `${e.tipo || "Equipo"} ${e.marca || ""} ${e.modelo || ""}${e.serie ? " · Serie " + e.serie : ""} (${origen})`.replace(/\s+/g, " ").trim();

const num = (v) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v));
const fmtHoras = (h) => (Math.round(h * 10) / 10).toLocaleString("es-MX") + " h";

export default function ReporteHoras() {
  const [registros, guardarRegistros] = useListaCompartida("horas_maquina");
  const { registros: internos } = useSharedTable("equipos_internos");
  const { registros: externos } = useSharedTable("equipos_externos");
  const { registros: clientes } = useSharedTable("clientes");

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO);
  const [fEquipo, setFEquipo] = useState("");
  const [fCliente, setFCliente] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const equipos = [
    ...externos.filter((e) => e.estado !== "Devuelto").map((e) => ({ id: e.id, label: etiquetaEquipo(e, "externo"), cliente: e.cliente || "" })),
    ...internos.map((e) => ({ id: e.id, label: etiquetaEquipo(e, "propio"), cliente: "" }))
  ];

  const abrirNuevo = () => {
    setForm({ ...NUEVO, id: "H-" + Date.now(), fecha: hoyISO() });
    setModal(true);
  };
  const abrirEditar = (r) => {
    setForm({ ...NUEVO, ...r });
    setModal(true);
  };

  const cambiarEquipo = (id) => {
    const eq = equipos.find((e) => e.id === id);
    setForm({ ...form, equipoId: id, equipoLabel: eq ? eq.label : "", cliente: form.cliente || eq?.cliente || "" });
  };

  const cambiarHorometro = (campo, valor) => {
    const nuevo = { ...form, [campo]: valor };
    if (nuevo.horometroInicial !== "" && nuevo.horometroFinal !== "") {
      const diff = num(nuevo.horometroFinal) - num(nuevo.horometroInicial);
      nuevo.horas = diff >= 0 ? String(Math.round(diff * 10) / 10) : "";
    }
    setForm(nuevo);
  };

  const guardarForm = () => {
    if (!form.fecha) return alert("Indica la fecha.");
    if (!form.equipoId) return alert("Selecciona la máquina.");
    if (form.horas === "" || num(form.horas) <= 0) return alert("Captura las horas trabajadas (o el horómetro inicial y final).");
    const existe = registros.some((r) => r.id === form.id);
    guardarRegistros(existe ? registros.map((r) => (r.id === form.id ? { ...r, ...form } : r)) : [...registros, form]);
    setModal(false);
  };

  const eliminar = (r) => guardarRegistros(registros.filter((x) => x.id !== r.id));

  const filtrados = registros
    .filter((r) => (!fEquipo || r.equipoId === fEquipo) && (!fCliente || r.cliente === fCliente) && (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta))
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

  const totalHoras = filtrados.reduce((s, r) => s + num(r.horas), 0);

  const porEquipo = Object.values(
    filtrados.reduce((acc, r) => {
      const k = r.equipoId;
      acc[k] = acc[k] || { label: r.equipoLabel, cliente: r.cliente, horas: 0, dias: 0 };
      acc[k].horas += num(r.horas);
      acc[k].dias += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.horas - a.horas);

  const clientesEnRegistros = [...new Set(registros.map((r) => r.cliente).filter(Boolean))].sort();
  const equiposEnRegistros = [...new Map(registros.map((r) => [r.equipoId, r.equipoLabel])).entries()];

  const periodoTexto =
    desde || hasta ? `${desde ? fFecha(desde) : "inicio"} al ${hasta ? fFecha(hasta) : "hoy"}` : "Todo el historial";

  const exportarExcel = () =>
    descargarExcelBonito({
      titulo: "Reporte de Horas de Maquinaria",
      subtitulo: `Periodo: ${periodoTexto} · Total: ${fmtHoras(totalHoras)}`,
      columnas: ["Fecha", "Máquina", "Cliente", "Operador", "Horómetro inicial", "Horómetro final", "Horas trabajadas", "Notas"],
      filas: filtrados.map((r) => [fFecha(r.fecha), r.equipoLabel, r.cliente, r.operador, r.horometroInicial, r.horometroFinal, r.horas, r.notas || ""]),
      nombreArchivo: nombreArchivoFecha("REPORTE-HORAS")
    });

  const imprimirReporte = () => {
    if (filtrados.length === 0) return alert("No hay registros para el reporte con esos filtros.");
    const w = window.open("", "_blank");
    if (!w) return alert("El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.");
    const logoUrl = new URL(logo, window.location.href).href;
    const filasResumen = porEquipo
      .map((e) => `<tr><td>${esc(e.label)}</td><td>${esc(e.cliente || "—")}</td><td style="text-align:center">${e.dias}</td><td style="text-align:right"><b>${fmtHoras(e.horas)}</b></td></tr>`)
      .join("");
    const filasDetalle = filtrados
      .map((r) => `<tr><td>${fFecha(r.fecha)}</td><td>${esc(r.equipoLabel)}</td><td>${esc(r.cliente || "—")}</td><td>${esc(r.operador || "—")}</td><td style="text-align:right">${esc(r.horometroInicial || "—")}</td><td style="text-align:right">${esc(r.horometroFinal || "—")}</td><td style="text-align:right"><b>${fmtHoras(num(r.horas))}</b></td></tr>`)
      .join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Reporte de horas</title>
      <style>
        @page{size:auto;margin:0}
        body{font-family:Arial,sans-serif;color:#222;margin:0;padding:12mm 12mm;font-size:12px}
        .top{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1d5c8f;padding-bottom:12px;margin-bottom:18px}
        .top img{height:60px} h1{font-size:20px;margin:0;color:#1d5c8f} p{margin:3px 0;color:#555}
        h2{font-size:14px;margin:22px 0 8px;color:#1d5c8f}
        table{width:100%;border-collapse:collapse} th{background:#1d5c8f;color:#fff;text-align:left;padding:7px;font-size:11px}
        td{padding:6px 7px;border-bottom:1px solid #ddd} tr:nth-child(even) td{background:#f6f9fc}
        .total{margin-top:16px;text-align:right;font-size:15px}
        @media print{body{padding:10mm 9mm}}
      </style></head><body>
      <div class="top"><div><h1>Reporte de Horas de Maquinaria</h1><p>Periodo: ${esc(periodoTexto)}</p>
      ${fCliente ? `<p>Cliente: ${esc(fCliente)}</p>` : ""}<p>Generado: ${new Date().toLocaleDateString("es-MX")}</p></div>
      <img src="${logoUrl}" alt="MAQSOL"></div>
      <h2>Resumen por máquina</h2>
      <table><thead><tr><th>Máquina</th><th>Cliente</th><th style="text-align:center">Registros</th><th style="text-align:right">Horas</th></tr></thead><tbody>${filasResumen}</tbody></table>
      <div class="total">Total de horas: <b>${fmtHoras(totalHoras)}</b></div>
      <h2>Detalle</h2>
      <table><thead><tr><th>Fecha</th><th>Máquina</th><th>Cliente</th><th>Operador</th><th style="text-align:right">Horóm. inicial</th><th style="text-align:right">Horóm. final</th><th style="text-align:right">Horas</th></tr></thead><tbody>${filasDetalle}</tbody></table>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Reporte de Horas</h1>
            <p style={S.sub}>Horas trabajadas por cada máquina rentada · {registros.length} registros</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
            <button style={S.btnGris} onClick={exportarExcel}>Descargar Excel</button>
            <button style={S.btnVerde} onClick={imprimirReporte}>Generar reporte (PDF)</button>
            <button style={S.btn} onClick={abrirNuevo}>+ Registrar horas</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, alignItems: "end" }}>
            <div>
              <label style={S.label}>MÁQUINA</label>
              <select style={S.input} value={fEquipo} onChange={(e) => setFEquipo(e.target.value)}>
                <option value="">Todas</option>
                {equiposEnRegistros.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>CLIENTE</label>
              <select style={S.input} value={fCliente} onChange={(e) => setFCliente(e.target.value)}>
                <option value="">Todos</option>
                {clientesEnRegistros.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>DESDE</label>
              <input type="date" style={S.input} value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>HASTA</label>
              <input type="date" style={S.input} value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
        </div>

        {porEquipo.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ ...S.card, marginBottom: 0, background: "var(--acento)", color: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>TOTAL DEL PERIODO</div>
              <div style={{ fontSize: 34, fontWeight: 800 }}>{fmtHoras(totalHoras)}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{filtrados.length} registros · {porEquipo.length} máquinas</div>
            </div>
            {porEquipo.map((e) => (
              <div key={e.label} style={{ ...S.card, marginBottom: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{e.label}</div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{e.cliente || "Sin cliente"}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--acento)" }}>{fmtHoras(e.horas)}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{e.dias} registros</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...S.card, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 950 }}>
            <thead>
              <tr>
                <th style={S.th}>FECHA</th><th style={S.th}>MÁQUINA</th><th style={S.th}>CLIENTE</th><th style={S.th}>OPERADOR</th>
                <th style={S.th}>HORÓM. INICIAL</th><th style={S.th}>HORÓM. FINAL</th><th style={S.th}>HORAS</th><th style={{ ...S.th, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                  No hay horas registradas. Usa "+ Registrar horas".
                </td></tr>
              ) : filtrados.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...S.td, cursor: "pointer" }} onClick={() => abrirEditar(r)}>{fFecha(r.fecha)}</td>
                  <td style={{ ...S.td, fontWeight: 700, cursor: "pointer" }} onClick={() => abrirEditar(r)}>{r.equipoLabel}</td>
                  <td style={S.td}>{r.cliente || "—"}</td>
                  <td style={S.td}>{r.operador || "—"}</td>
                  <td style={S.td}>{r.horometroInicial || "—"}</td>
                  <td style={S.td}>{r.horometroFinal || "—"}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{fmtHoras(num(r.horas))}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    <DeleteButton size="sm" title="Eliminar registro" onConfirm={() => eliminar(r)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={S.modalBg} onClick={() => setModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              {registros.some((r) => r.id === form.id) ? "Editar registro de horas" : "Registrar horas de trabajo"}
            </h2>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>MÁQUINA</label>
                <select style={S.input} value={form.equipoId} onChange={(e) => cambiarEquipo(e.target.value)}>
                  <option value="">Selecciona la máquina</option>
                  {equipos.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>FECHA</label>
                <input type="date" style={S.input} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
            </div>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>CLIENTE</label>
                <input style={S.input} list="lista-clientes-horas" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Selecciona o escribe" />
                <datalist id="lista-clientes-horas">
                  {clientes.map((c) => <option key={c.id} value={c.cliente} />)}
                </datalist>
              </div>
              <div>
                <label style={S.label}>OPERADOR</label>
                <input style={S.input} value={form.operador} onChange={(e) => setForm({ ...form, operador: e.target.value })} />
              </div>
            </div>
            <div style={S.grid3}>
              <div>
                <label style={S.label}>HORÓMETRO INICIAL</label>
                <input type="number" style={S.input} value={form.horometroInicial} onChange={(e) => cambiarHorometro("horometroInicial", e.target.value)} />
              </div>
              <div>
                <label style={S.label}>HORÓMETRO FINAL</label>
                <input type="number" style={S.input} value={form.horometroFinal} onChange={(e) => cambiarHorometro("horometroFinal", e.target.value)} />
              </div>
              <div>
                <label style={S.label}>HORAS TRABAJADAS</label>
                <input type="number" step="0.1" style={S.input} value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} placeholder="Se calcula solo" />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>NOTAS</label>
              <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button style={S.btnGris} onClick={() => setModal(false)}>Cancelar</button>
              <button style={S.btn} onClick={guardarForm}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
