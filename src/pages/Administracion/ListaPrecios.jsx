import Layout from "../../components/Layout";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NipGate from "../../components/NipGate";
import DeleteButton from "../../components/DeleteButton";
import { useListaCompartida } from "../../hooks/useSharedTable";
import { descargarExcelBonito, nombreArchivoFecha } from "../../utils/exportExcel";
import { LISTA_MARZO_2026, GRUPOS_EQUIPO, NOTA_PRECIOS } from "../../utils/listaPreciosMarzo2026";
import { S, dinero } from "./estilosAdmin";
import { IconoMas } from "../../components/Icons";

// ---------- Otros conceptos (servicios, refacciones, fletes…): lo que ya existía ----------
const CATEGORIAS = ["Renta", "Venta", "Refacciones", "Servicio", "Flete", "Otro"];
const UNIDADES = ["Día", "Semana", "Mes", "Hora", "Pieza", "Servicio", "Viaje", "Total del proyecto"];
const NUEVO_OTRO = { id: "", concepto: "", categoria: "Servicio", unidad: "Servicio", precio: "", notas: "" };

// ---------- Equipos en renta ----------
const NUEVO_EQUIPO = {
  id: "", grupo: GRUPOS_EQUIPO[0], marca: "", modelo: "", tipo: "", alturaPlataforma: "", alturaMaxima: "", capacidad: "",
  semana: "", mes: "", semanaOperacion: "", mesOperacion: "", semanaOperacionCombustible: "", mesOperacionCombustible: "", notas: ""
};

const COLUMNAS_PRECIO = [
  ["semana", "SEMANA"],
  ["mes", "MES"],
  ["semanaOperacion", "SEMANA CON OPERACIÓN"],
  ["mesOperacion", "MES CON OPERACIÓN"],
  ["semanaOperacionCombustible", "SEMANA CON OPERACIÓN Y COMBUSTIBLE"],
  ["mesOperacionCombustible", "MES CON OPERACIÓN Y COMBUSTIBLE"]
];

const esEquipo = (p) => !!(p.grupo || p.marca || p.modelo);
const precioTxt = (v) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? null : dinero(v));
const num = (v) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? "" : Number(v));
const norm = (t) => String(t || "").toUpperCase().replace(/\s+/g, "");

function Campo({ etiqueta, children }) {
  return (
    <div>
      <label style={S.label}>{etiqueta}</label>
      {children}
    </div>
  );
}

export default function ListaPrecios() {
  const [precios, guardarPrecios] = useListaCompartida("lista_precios");
  const [pestana, setPestana] = useState("equipos");

  const equipos = useMemo(() => precios.filter(esEquipo), [precios]);
  const otros = useMemo(() => precios.filter((p) => !esEquipo(p)), [precios]);
  const guardarEquipos = (lista) => guardarPrecios([...otros, ...lista]);
  const guardarOtros = (lista) => guardarPrecios([...lista, ...equipos]);

  return (
    <NipGate claveConfig="nip_precios" mensaje="Escribe el NIP para ver la lista de precios.">
      <Layout>
        <div style={{ maxWidth: 1500, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button style={pestana === "equipos" ? S.btn : S.btnGris} onClick={() => setPestana("equipos")}>Equipos en renta ({equipos.length})</button>
            <button style={pestana === "otros" ? S.btn : S.btnGris} onClick={() => setPestana("otros")}>Otros conceptos ({otros.length})</button>
          </div>
          {pestana === "equipos"
            ? <EquiposRenta equipos={equipos} guardar={guardarEquipos} />
            : <OtrosConceptos lista={otros} guardar={guardarOtros} />}
        </div>
      </Layout>
    </NipGate>
  );
}

// =====================================================================================
function EquiposRenta({ equipos, guardar }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO_EQUIPO);
  const [busqueda, setBusqueda] = useState("");
  const [fGrupo, setFGrupo] = useState("");
  const [cerrados, setCerrados] = useState({});

  const grupos = useMemo(() => [...new Set([...GRUPOS_EQUIPO, ...equipos.map((e) => e.grupo).filter(Boolean)])], [equipos]);
  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const faltantes = LISTA_MARZO_2026.filter((n) => !equipos.some((e) => norm(e.marca) + norm(e.modelo) === norm(n.marca) + norm(n.modelo)));

  const importar = () => {
    if (!faltantes.length) return;
    if (!window.confirm(`Se agregarán ${faltantes.length} equipos de la lista de precios de marzo 2026. ¿Continuar?`)) return;
    guardar([...equipos, ...faltantes]);
  };

  const abrirNuevo = () => {
    setForm({ ...NUEVO_EQUIPO, id: "EQ-" + Date.now(), grupo: fGrupo || GRUPOS_EQUIPO[0] });
    setModal(true);
  };
  const abrirEditar = (e) => {
    setForm({ ...NUEVO_EQUIPO, ...e });
    setModal(true);
  };
  const guardarForm = () => {
    if (!form.modelo.trim()) return alert("Escribe el modelo del equipo.");
    const registro = { ...form };
    COLUMNAS_PRECIO.forEach(([k]) => { registro[k] = num(form[k]); });
    const existe = equipos.some((e) => e.id === form.id);
    guardar(existe ? equipos.map((e) => (e.id === form.id ? registro : e)) : [...equipos, registro]);
    setModal(false);
  };
  const eliminar = (e) => guardar(equipos.filter((x) => x.id !== e.id));

  const filtrados = equipos.filter((e) => {
    const t = [e.marca, e.modelo, e.tipo, e.grupo, e.notas, e.alturaMaxima, e.capacidad].join(" ").toLowerCase();
    return t.includes(busqueda.toLowerCase()) && (!fGrupo || e.grupo === fGrupo);
  });
  const porGrupo = grupos
    .map((g) => ({ grupo: g, filas: filtrados.filter((e) => e.grupo === g) }))
    .concat([{ grupo: "SIN GRUPO", filas: filtrados.filter((e) => !e.grupo || !grupos.includes(e.grupo)) }])
    .filter((g) => g.filas.length);

  const exportar = () =>
    descargarExcelBonito({
      titulo: "Lista de Precios de Equipos en Renta · MAQSOL",
      subtitulo: `${filtrados.length} equipos · precios sin IVA`,
      columnas: ["Grupo", "Marca", "Modelo", "Tipo", "Altura a nivel de plataforma", "Altura máxima", "Capacidad", "Semana", "Mes", "Semana con operación", "Mes con operación", "Semana con operación y combustible", "Mes con operación y combustible", "Notas"],
      formatos: [null, null, null, null, null, null, null, "moneda", "moneda", "moneda", "moneda", "moneda", "moneda", null],
      filas: filtrados.map((e) => [e.grupo, e.marca, e.modelo, e.tipo, e.alturaPlataforma, e.alturaMaxima, e.capacidad, ...COLUMNAS_PRECIO.map(([k]) => (num(e[k]) === "" ? "N/A" : num(e[k]))), e.notas || ""]),
      nombreArchivo: nombreArchivoFecha("LISTA-PRECIOS-EQUIPOS")
    });

  const celdaPrecio = (v) => {
    const t = precioTxt(v);
    return t ? <span style={{ fontWeight: 700 }}>{t}</span> : <span style={{ color: "#bbb" }}>N/A</span>;
  };
  const th = { ...S.th, fontSize: 11, whiteSpace: "normal", lineHeight: 1.25 };
  const td = { ...S.td, fontSize: 13, padding: "9px 8px" };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={S.h1}>Lista de Precios · Equipos en renta</h1>
          <p style={S.sub}>{equipos.length} equipos · precios sin IVA · edita cualquier dato con el botón "Editar"</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
          {faltantes.length > 0 && (
            <button style={S.btnVerde} onClick={importar}>Cargar lista marzo 2026 ({faltantes.length})</button>
          )}
          <button style={S.btnGris} onClick={exportar}>Descargar Excel</button>
          <button style={S.btn} onClick={abrirNuevo}><IconoMas />Agregar equipo</button>
        </div>
      </div>

      {equipos.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 34 }}>
          <p style={{ margin: "0 0 14px", color: "#555" }}>Todavía no hay equipos en la lista de precios.</p>
          <button style={S.btnVerde} onClick={importar}>Cargar la lista de precios de marzo 2026 ({LISTA_MARZO_2026.length} equipos)</button>
        </div>
      )}

      <div style={S.card}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr auto", gap: 18, alignItems: "end" }}>
          <div>
            <label style={S.label}>BUSCAR</label>
            <input style={S.input} placeholder="Marca, modelo, tipo, altura…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>GRUPO</label>
            <select style={S.input} value={fGrupo} onChange={(e) => setFGrupo(e.target.value)}>
              <option value="">Todos</option>
              {grupos.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnGris} onClick={() => setCerrados(Object.fromEntries([...grupos, "SIN GRUPO"].map((g) => [g, true])))}>Minimizar todo</button>
            <button style={S.btnGris} onClick={() => setCerrados({})}>Expandir todo</button>
          </div>
        </div>
      </div>

      {porGrupo.map(({ grupo, filas }) => (
        <div key={grupo} style={{ ...S.card, padding: 0, overflowX: "auto" }}>
          <div
            onClick={() => setCerrados((c) => ({ ...c, [grupo]: !c[grupo] }))}
            title={cerrados[grupo] ? "Expandir" : "Minimizar"}
            style={{ background: "#3a3a3a", color: "#fff", padding: "10px 14px", fontWeight: 800, letterSpacing: 0.6, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}
          >
            <span style={{ display: "inline-block", width: 14, transition: "transform .15s", transform: cerrados[grupo] ? "rotate(-90deg)" : "none" }}>▾</span>
            <span>{grupo} <span style={{ opacity: 0.7, fontWeight: 600 }}>· {filas.length}</span></span>
          </div>
          {!cerrados[grupo] && <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1380 }}>
            <thead>
              <tr>
                <th style={th}>MARCA</th><th style={th}>MODELO</th><th style={th}>TIPO</th>
                <th style={th}>ALTURA A NIVEL DE PLATAFORMA</th><th style={th}>ALTURA MÁXIMA</th><th style={th}>CAPACIDAD</th>
                {COLUMNAS_PRECIO.map(([k, t]) => <th key={k} style={{ ...th, textAlign: "right" }}>{t}</th>)}
                <th style={{ ...th, width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((e) => (
                <tr key={e.id}>
                  <td style={td}>{e.marca}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{e.modelo}</td>
                  <td style={td}>{e.tipo}</td>
                  <td style={td}>{e.alturaPlataforma}</td>
                  <td style={td}>{e.alturaMaxima}</td>
                  <td style={td}>{e.capacidad}</td>
                  {COLUMNAS_PRECIO.map(([k]) => <td key={k} style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>{celdaPrecio(e[k])}</td>)}
                  <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
                    <button style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13 }} onClick={() => abrirEditar(e)}>Editar</button>{" "}
                    <span style={{ display: "inline-block" }}><DeleteButton size="sm" title="Eliminar equipo" onConfirm={() => eliminar(e)} /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      ))}

      <p style={{ color: "#777", fontSize: 12.5, lineHeight: 1.5, margin: "4px 2px 20px" }}>{NOTA_PRECIOS}</p>

      {modal && (
        <div style={S.modalBg} onClick={() => setModal(false)}>
          <div style={{ ...S.modal, maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              {equipos.some((e) => e.id === form.id) ? "Editar equipo" : "Nuevo equipo"}
            </h2>
            <div style={S.grid3}>
              <Campo etiqueta="GRUPO">
                <select style={S.input} value={form.grupo} onChange={(e) => set("grupo", e.target.value)}>
                  {[...new Set([...grupos, form.grupo].filter(Boolean))].map((g) => <option key={g}>{g}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="MARCA"><input style={S.input} value={form.marca} onChange={(e) => set("marca", e.target.value.toUpperCase())} /></Campo>
              <Campo etiqueta="MODELO"><input style={S.input} autoFocus value={form.modelo} onChange={(e) => set("modelo", e.target.value)} /></Campo>
            </div>
            <div style={S.grid3}>
              <Campo etiqueta="TIPO (ELÉCTRICA, COMBUSTIÓN…)"><input style={S.input} value={form.tipo} onChange={(e) => set("tipo", e.target.value)} /></Campo>
              <Campo etiqueta="ALTURA A NIVEL DE PLATAFORMA"><input style={S.input} value={form.alturaPlataforma} onChange={(e) => set("alturaPlataforma", e.target.value)} placeholder="Ej. 9.60 m" /></Campo>
              <Campo etiqueta="ALTURA MÁXIMA"><input style={S.input} value={form.alturaMaxima} onChange={(e) => set("alturaMaxima", e.target.value)} placeholder="Ej. 11.60 m" /></Campo>
            </div>
            <div style={{ marginBottom: 14 }}>
              <Campo etiqueta="CAPACIDAD MÁXIMA"><input style={S.input} value={form.capacidad} onChange={(e) => set("capacidad", e.target.value)} placeholder="Ej. 227 kg" /></Campo>
            </div>
            <h3 style={{ ...S.h3, marginTop: 6 }}>Precios (sin IVA) · déjalos vacíos si no aplica</h3>
            <div style={S.grid3}>
              {COLUMNAS_PRECIO.map(([k, t]) => (
                <Campo key={k} etiqueta={t}>
                  <input style={S.input} type="number" min="0" step="0.01" value={form[k]} onChange={(e) => set(k, e.target.value)} />
                </Campo>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <Campo etiqueta="NOTAS">
                <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
              </Campo>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button style={S.btnGris} onClick={() => setModal(false)}>Cancelar</button>
              <button style={S.btn} onClick={guardarForm}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =====================================================================================
function OtrosConceptos({ lista, guardar }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO_OTRO);
  const [busqueda, setBusqueda] = useState("");
  const [fCategoria, setFCategoria] = useState("");

  const abrirNuevo = () => {
    setForm({ ...NUEVO_OTRO, id: "PR-" + Date.now() });
    setModal(true);
  };
  const abrirEditar = (p) => {
    setForm({ ...NUEVO_OTRO, ...p });
    setModal(true);
  };
  const guardarForm = () => {
    if (!form.concepto.trim()) return alert("Escribe el concepto (servicio, refacción, flete…).");
    const existe = lista.some((p) => p.id === form.id);
    guardar(existe ? lista.map((p) => (p.id === form.id ? { ...p, ...form } : p)) : [...lista, form]);
    setModal(false);
  };
  const eliminar = (p) => guardar(lista.filter((x) => x.id !== p.id));

  const filtrados = lista
    .filter((p) => {
      const t = (p.concepto + " " + p.notas + " " + p.categoria).toLowerCase();
      return t.includes(busqueda.toLowerCase()) && (!fCategoria || p.categoria === fCategoria);
    })
    .sort((a, b) => (a.categoria + a.concepto).localeCompare(b.categoria + b.concepto));

  const exportar = () =>
    descargarExcelBonito({
      titulo: "Lista de Precios · Otros conceptos",
      subtitulo: "MAQSOL · " + filtrados.length + " conceptos",
      columnas: ["Categoría", "Concepto", "Unidad", "Precio (sin IVA)", "Notas"],
      filas: filtrados.map((p) => [p.categoria, p.concepto, p.unidad, dinero(p.precio), p.notas || ""]),
      nombreArchivo: nombreArchivoFecha("LISTA-PRECIOS-OTROS")
    });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={S.h1}>Lista de Precios · Otros conceptos</h1>
          <p style={S.sub}>Servicios, refacciones, fletes y otros · {lista.length} conceptos · precios sin IVA</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
          <button style={S.btnGris} onClick={exportar}>Descargar lista</button>
          <button style={S.btn} onClick={abrirNuevo}><IconoMas />Agregar precio</button>
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
              <th style={S.th}>PRECIO</th><th style={S.th}>NOTAS</th><th style={{ ...S.th, width: 150 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                No hay otros conceptos registrados. Usa "Agregar precio".
              </td></tr>
            ) : filtrados.map((p) => (
              <tr key={p.id}>
                <td style={S.td}>{p.categoria}</td>
                <td style={{ ...S.td, fontWeight: 700 }}>{p.concepto}</td>
                <td style={S.td}>{p.unidad}</td>
                <td style={{ ...S.td, fontWeight: 700 }}>{dinero(p.precio)}</td>
                <td style={{ ...S.td, color: "#777" }}>{p.notas}</td>
                <td style={{ ...S.td, whiteSpace: "nowrap", textAlign: "right" }}>
                  <button style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13 }} onClick={() => abrirEditar(p)}>Editar</button>{" "}
                  <span style={{ display: "inline-block" }}><DeleteButton size="sm" title="Eliminar precio" onConfirm={() => eliminar(p)} /></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={S.modalBg} onClick={() => setModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              {lista.some((p) => p.id === form.id) ? "Editar precio" : "Nuevo precio"}
            </h2>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>CONCEPTO</label>
              <input style={S.input} autoFocus value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Ej. Flete local" />
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
    </>
  );
}
