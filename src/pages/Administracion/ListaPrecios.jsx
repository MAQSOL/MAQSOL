import Layout from "../../components/Layout";
import { useState } from "react";
import { Link } from "react-router-dom";
import NipGate from "../../components/NipGate";
import DeleteButton from "../../components/DeleteButton";
import { useListaCompartida } from "../../hooks/useSharedTable";
import { descargarExcelBonito, nombreArchivoFecha } from "../../utils/exportExcel";
import { S, dinero } from "./estilosAdmin";

const CATEGORIAS = ["Renta", "Venta", "Refacciones", "Servicio", "Flete", "Otro"];
const UNIDADES = ["Día", "Semana", "Mes", "Hora", "Pieza", "Servicio", "Viaje", "Total del proyecto"];

const NUEVO = { id: "", concepto: "", categoria: "Renta", unidad: "Día", precio: "", notas: "" };

export default function ListaPrecios() {
  const [precios, guardarPrecios] = useListaCompartida("lista_precios");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO);
  const [busqueda, setBusqueda] = useState("");
  const [fCategoria, setFCategoria] = useState("");

  const abrirNuevo = () => {
    setForm({ ...NUEVO, id: "PR-" + Date.now() });
    setModal(true);
  };
  const abrirEditar = (p) => {
    setForm({ ...NUEVO, ...p });
    setModal(true);
  };
  const guardarForm = () => {
    if (!form.concepto.trim()) {
      alert("Escribe el concepto (equipo, servicio o refacción).");
      return;
    }
    const existe = precios.some((p) => p.id === form.id);
    guardarPrecios(existe ? precios.map((p) => (p.id === form.id ? { ...p, ...form } : p)) : [...precios, form]);
    setModal(false);
  };
  const eliminar = (p) => guardarPrecios(precios.filter((x) => x.id !== p.id));

  const filtrados = precios
    .filter((p) => {
      const t = (p.concepto + " " + p.notas + " " + p.categoria).toLowerCase();
      return t.includes(busqueda.toLowerCase()) && (!fCategoria || p.categoria === fCategoria);
    })
    .sort((a, b) => (a.categoria + a.concepto).localeCompare(b.categoria + b.concepto));

  const exportar = () =>
    descargarExcelBonito({
      titulo: "Lista de Precios",
      subtitulo: "MAQSOL · " + filtrados.length + " conceptos",
      columnas: ["Categoría", "Concepto", "Unidad", "Precio (sin IVA)", "Notas"],
      filas: filtrados.map((p) => [p.categoria, p.concepto, p.unidad, dinero(p.precio), p.notas || ""]),
      nombreArchivo: nombreArchivoFecha("LISTA-PRECIOS")
    });

  return (
    <NipGate claveConfig="nip_precios" mensaje="Escribe el NIP para ver la lista de precios.">
      <Layout>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
            <div>
              <h1 style={S.h1}>Lista de Precios</h1>
              <p style={S.sub}>Precios de renta, venta, refacciones y servicios · {precios.length} conceptos · precios sin IVA</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
              <button style={S.btnGris} onClick={exportar}>Descargar lista</button>
              <button style={S.btn} onClick={abrirNuevo}>+ Agregar precio</button>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, alignItems: "end" }}>
              <div>
                <label style={S.label}>BUSCAR</label>
                <input style={S.input} placeholder="Concepto, categoría o nota" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>CATEGORÍA</label>
                <select style={S.input} value={fCategoria} onChange={(e) => setFCategoria(e.target.value)}>
                  <option value="">Todas</option>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...S.card, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={S.th}>CATEGORÍA</th><th style={S.th}>CONCEPTO</th><th style={S.th}>UNIDAD</th>
                  <th style={S.th}>PRECIO</th><th style={S.th}>NOTAS</th><th style={{ ...S.th, width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                    No hay precios registrados. Usa "+ Agregar precio".
                  </td></tr>
                ) : filtrados.map((p) => (
                  <tr key={p.id}>
                    <td style={S.td}>{p.categoria}</td>
                    <td style={{ ...S.td, fontWeight: 700, cursor: "pointer" }} onClick={() => abrirEditar(p)}>{p.concepto}</td>
                    <td style={S.td}>{p.unidad}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{dinero(p.precio)}</td>
                    <td style={{ ...S.td, color: "#777" }}>{p.notas}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <DeleteButton size="sm" title="Eliminar precio" onConfirm={() => eliminar(p)} />
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
                {precios.some((p) => p.id === form.id) ? "Editar precio" : "Nuevo precio"}
              </h2>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>CONCEPTO</label>
                <input style={S.input} autoFocus value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Ej. Manipulador telescópico 4 ton" />
              </div>
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>CATEGORÍA</label>
                  <select style={S.input} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                    {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>UNIDAD</label>
                  <select style={S.input} value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
                    {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>PRECIO (SIN IVA)</label>
                  <input style={S.input} type="number" min="0" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>NOTAS</label>
                <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button style={S.btnGris} onClick={() => setModal(false)}>Cancelar</button>
                <button style={S.btn} onClick={guardarForm}>Guardar</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </NipGate>
  );
}
