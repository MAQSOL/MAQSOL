import Layout from "../../components/Layout";
import { useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import logo from "../../assets/logo.png";
import { useListaCompartida, useSharedTable } from "../../hooks/useSharedTable";
import { descargarExcelBonito, nombreArchivoSemana, numeroSemanaISO } from "../../utils/exportExcel";
import { S, fFecha, hoyISO, dinero, esc } from "./estilosAdmin";

const NUEVO = {
  id: "", fecha: "", equipoId: "", maquina: "", serie: "", obra: "",
  operador: "", litros: "", precioLitro: "", total: 0, notas: ""
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
  const { registros: internos } = useSharedTable("equipos_internos");
  const { registros: externos } = useSharedTable("equipos_externos");
  const { registros: alquileres } = useSharedTable("alquileres");

  const [lunes, setLunes] = useState(() => lunesDe(new Date()));
  const [verTodo, setVerTodo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [fMaquina, setFMaquina] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO);

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
  const precioProm = totalLitros ? totalImporte / totalLitros : 0;

  const porMaquina = Object.values(
    filtradas.reduce((acc, c) => {
      const k = c.maquina + "|" + c.serie;
      acc[k] = acc[k] || { maquina: c.maquina, serie: c.serie, cargas: 0, litros: 0, importe: 0 };
      acc[k].cargas += 1;
      acc[k].litros += num(c.litros);
      acc[k].importe += num(c.total);
      return acc;
    }, {})
  ).sort((a, b) => b.litros - a.litros);
  const maxLitros = Math.max(1, ...porMaquina.map((m) => m.litros));

  const maquinasConCargas = [...new Set(cargas.map((c) => c.maquina))].sort();

  const exportarExcel = () => {
    if (!filtradas.length) return alert("No hay cargas en este periodo.");
    descargarExcelBonito({
      titulo: "Cargas de Diesel",
      subtitulo: `${etiquetaPeriodo} · ${litrosTxt(totalLitros)} · ${dinero(totalImporte)}`,
      columnas: ["Fecha", "Máquina", "Serie", "Obra", "Operador", "Litros", "Precio por litro", "Total"],
      filas: [
        ...filtradas.map((c) => [fFecha(c.fecha), c.maquina, c.serie, c.obra, c.operador, num(c.litros), dinero(c.precioLitro), dinero(c.total)]),
        ["", "", "", "", "TOTAL", Math.round(totalLitros * 10) / 10, dinero(precioProm), dinero(totalImporte)]
      ],
      nombreArchivo: nombreArchivoSemana("DIESEL", lunes)
    });
  };

  const generarPDF = () => {
    if (!filtradas.length) return alert("No hay cargas en este periodo.");
    const w = window.open("", "_blank");
    if (!w) return alert("El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.");
    const logoUrl = new URL(logo, window.location.href).href;
    const resumen = porMaquina
      .map((m) => `<tr><td>${esc(m.maquina)}</td><td>${esc(m.serie || "—")}</td><td style="text-align:center">${m.cargas}</td><td style="text-align:right">${litrosTxt(m.litros)}</td><td style="text-align:right"><b>${dinero(m.importe)}</b></td></tr>`)
      .join("");
    const detalle = filtradas
      .slice()
      .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
      .map((c) => `<tr><td>${fFecha(c.fecha)}</td><td>${esc(c.maquina)}</td><td>${esc(c.serie || "—")}</td><td>${esc(c.obra || "—")}</td><td>${esc(c.operador || "—")}</td><td style="text-align:right">${litrosTxt(num(c.litros))}</td><td style="text-align:right">${dinero(c.precioLitro)}</td><td style="text-align:right"><b>${dinero(c.total)}</b></td></tr>`)
      .join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Cargas de diesel</title>
      <style>
        body{font-family:Arial,sans-serif;color:#222;margin:28px;font-size:12px}
        .top{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1d5c8f;padding-bottom:12px;margin-bottom:16px}
        .top img{height:58px} h1{font-size:20px;margin:0;color:#1d5c8f} p{margin:3px 0;color:#555}
        h2{font-size:14px;margin:20px 0 8px;color:#1d5c8f}
        table{width:100%;border-collapse:collapse} th{background:#1d5c8f;color:#fff;text-align:left;padding:7px;font-size:11px}
        td{padding:6px 7px;border-bottom:1px solid #ddd} tr:nth-child(even) td{background:#f6f9fc}
        .tot{display:flex;gap:30px;justify-content:flex-end;margin-top:14px;font-size:14px}
        @media print{body{margin:12px}}
      </style></head><body>
      <div class="top"><div><h1>Cargas de Diesel</h1><p>${esc(etiquetaPeriodo)}</p><p>Generado: ${new Date().toLocaleDateString("es-MX")}</p></div><img src="${logoUrl}" alt="MAQSOL"></div>
      <h2>Resumen por máquina</h2>
      <table><thead><tr><th>Máquina</th><th>Serie</th><th style="text-align:center">Cargas</th><th style="text-align:right">Litros</th><th style="text-align:right">Importe</th></tr></thead><tbody>${resumen}</tbody></table>
      <div class="tot"><span>Litros: <b>${litrosTxt(totalLitros)}</b></span><span>Precio prom.: <b>${dinero(precioProm)}</b></span><span>Total: <b>${dinero(totalImporte)}</b></span></div>
      <h2>Detalle de cargas</h2>
      <table><thead><tr><th>Fecha</th><th>Máquina</th><th>Serie</th><th>Obra</th><th>Operador</th><th style="text-align:right">Litros</th><th style="text-align:right">Precio/L</th><th style="text-align:right">Total</th></tr></thead><tbody>${detalle}</tbody></table>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1350, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Cargas de Diesel</h1>
            <p style={S.sub}>Registro semanal de combustible por máquina, obra y operador</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
            <button style={S.btnGris} onClick={exportarExcel}>Descargar Excel</button>
            <button style={S.btnVerde} onClick={generarPDF}>Generar PDF</button>
            <button style={S.btn} onClick={abrirNuevo}>+ Registrar carga</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button style={{ ...S.btnGris, padding: "8px 14px" }} disabled={verTodo} onClick={() => cambiarSemana(-1)}>← Anterior</button>
            <strong style={{ minWidth: 260, textAlign: "center" }}>{etiquetaPeriodo}</strong>
            <button style={{ ...S.btnGris, padding: "8px 14px" }} disabled={verTodo} onClick={() => cambiarSemana(1)}>Siguiente →</button>
            <button style={{ ...S.btnGris, padding: "8px 14px" }} disabled={verTodo} onClick={() => setLunes(lunesDe(new Date()))}>Esta semana</button>
            <label style={{ marginLeft: "auto", fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={verTodo} onChange={(e) => setVerTodo(e.target.checked)} /> Ver todo el historial
            </label>
          </div>
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
                <div style={{ background: "#eee", borderRadius: 6, height: 14, overflow: "hidden" }}>
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
                <th style={S.th}>OPERADOR</th><th style={S.th}>LITROS</th><th style={S.th}>PRECIO/L</th><th style={S.th}>TOTAL</th><th style={{ ...S.th, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={9} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                  No hay cargas en este periodo. Usa "+ Registrar carga".
                </td></tr>
              ) : filtradas.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...S.td, cursor: "pointer" }} onClick={() => abrirEditar(c)}>{fFecha(c.fecha)}</td>
                  <td style={{ ...S.td, fontWeight: 700, cursor: "pointer" }} onClick={() => abrirEditar(c)}>{c.maquina}</td>
                  <td style={S.td}>{c.serie || "—"}</td>
                  <td style={S.td}>{c.obra || "—"}</td>
                  <td style={S.td}>{c.operador || "—"}</td>
                  <td style={S.td}>{litrosTxt(num(c.litros))}</td>
                  <td style={S.td}>{dinero(c.precioLitro)}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{dinero(c.total)}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>
                    <DeleteButton size="sm" title="Eliminar carga" onConfirm={() => guardarCargas(cargas.filter((x) => x.id !== c.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={S.modalBg} onClick={() => setModal(false)}>
          <div style={{ ...S.modal, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              {cargas.some((c) => c.id === form.id) ? "Editar carga de diesel" : "Registrar carga de diesel"}
            </h2>

            <div style={S.grid2}>
              <div><label style={S.label}>FECHA</label><input type="date" style={S.input} value={form.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
              <div>
                <label style={S.label}>TOMAR DE EQUIPOS REGISTRADOS</label>
                <select style={S.input} value="" onChange={(e) => elegirMaquina(e.target.value)}>
                  <option value="">— Elegir o escribir abajo —</option>
                  {catalogo.map((m, k) => <option key={k} value={k}>{`${m.label} · ${m.serie || "s/n"} (${m.origen})`}</option>)}
                </select>
              </div>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>MÁQUINA</label><input style={S.input} value={form.maquina} onChange={(e) => set("maquina", e.target.value)} placeholder="Ej. Manipulador Genie GTH-844" /></div>
              <div><label style={S.label}>SERIE</label><input style={S.input} value={form.serie} onChange={(e) => set("serie", e.target.value)} /></div>
            </div>
            <div style={S.grid2}>
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
            </div>
            <div style={S.grid3}>
              <div><label style={S.label}>LITROS</label><input type="number" min="0" step="0.1" style={S.input} value={form.litros} onChange={(e) => set("litros", e.target.value)} /></div>
              <div><label style={S.label}>PRECIO POR LITRO</label><input type="number" min="0" step="0.01" style={S.input} value={form.precioLitro} onChange={(e) => set("precioLitro", e.target.value)} /></div>
              <div>
                <label style={S.label}>TOTAL</label>
                <div style={{ ...S.input, background: "#f5f5f5", fontWeight: 800 }}>{dinero(totalForm)}</div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>NOTAS</label>
              <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
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
