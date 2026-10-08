import Layout from "../../components/Layout";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import { useListaCompartida } from "../../hooks/useSharedTable";
import { usePerfiles } from "../../hooks/usePerfiles";
import { useAuth } from "../../contexts/AuthContext";
import { S, fFecha, hoyISO } from "../Administracion/estilosAdmin";

const COLUMNAS = [
  { clave: "pendiente", titulo: "Pendiente", color: "#8a6d00", fondo: "#fff8e1" },
  { clave: "progreso", titulo: "En progreso", color: "#1565c0", fondo: "#e8f1fb" },
  { clave: "hecho", titulo: "Hecho", color: "#1f8b4c", fondo: "#e8f5e9" }
];

const PRIORIDADES = {
  alta: { texto: "Alta", color: "#c62828", fondo: "#fdeaec" },
  media: { texto: "Media", color: "#c98a00", fondo: "#fff3d9" },
  baja: { texto: "Baja", color: "#666", fondo: "#f0f0f0" }
};

const NUEVA = { id: "", titulo: "", descripcion: "", estado: "pendiente", prioridad: "media", asignadoId: "", asignadoNombre: "", fechaLimite: "", comentarios: [] };

const diasPara = (f) => {
  if (!f) return null;
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return Math.round((new Date(f + "T00:00:00") - h) / 86400000);
};

function nombreDe(perfiles, id) {
  return perfiles.find((p) => p.id === id)?.nombre || "Sin asignar";
}

function TarjetaTarea({ t, perfiles, onAbrir, onMover }) {
  const idx = COLUMNAS.findIndex((c) => c.clave === t.estado);
  const anterior = COLUMNAS[idx - 1];
  const siguiente = COLUMNAS[idx + 1];
  const d = diasPara(t.fechaLimite);
  const prio = PRIORIDADES[t.prioridad] || PRIORIDADES.media;
  const vencida = t.estado !== "hecho" && d !== null && d < 0;
  return (
    <div
      onClick={() => onAbrir(t)}
      style={{
        background: "#fff",
        border: "1px solid #e6e6e6",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 10,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,.04)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <strong style={{ fontSize: 14, lineHeight: 1.3 }}>{t.titulo}</strong>
        <span style={{ background: prio.fondo, color: prio.color, fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
          {prio.texto}
        </span>
      </div>
      {t.descripcion && (
        <p style={{ fontSize: 12.5, color: "#777", margin: "6px 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {t.descripcion}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 12 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "#f3f3f3",
            padding: "3px 9px",
            borderRadius: 20,
            fontWeight: 600,
            color: "#444"
          }}
        >
          {t.asignadoId ? nombreDe(perfiles, t.asignadoId) : t.asignadoNombre || "Sin asignar"}
        </span>
        {t.fechaLimite && (
          <span style={{ color: vencida ? "#c62828" : "#999", fontWeight: vencida ? 700 : 500 }}>
            {vencida ? `Venció ${fFecha(t.fechaLimite)}` : fFecha(t.fechaLimite)}
          </span>
        )}
      </div>
      {t.comentarios?.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "#999" }}>💬 {t.comentarios.length} avance(s)</div>
      )}
      {(anterior || siguiente) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
          {anterior ? (
            <button
              onClick={(e) => { e.stopPropagation(); onMover(t, anterior.clave); }}
              style={{ background: "none", border: "none", color: "#999", fontSize: 11.5, cursor: "pointer", padding: 0 }}
            >
              ← {anterior.titulo}
            </button>
          ) : <span />}
          {siguiente && (
            <button
              onClick={(e) => { e.stopPropagation(); onMover(t, siguiente.clave); }}
              style={{ background: "none", border: "none", color: "var(--acento)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              {siguiente.titulo} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Tareas() {
  const [tareas, guardarTareas] = useListaCompartida("tareas");
  const { perfiles } = usePerfiles();
  const { profile, session } = useAuth();

  const [modal, setModal] = useState(null); // tarea en edición, o null
  const [form, setForm] = useState(NUEVA);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [soloMias, setSoloMias] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const miNombre = profile?.apodo || profile?.nombre_completo || session?.user?.email || "";

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tareas.filter((t) => {
      if (soloMias && t.asignadoId !== session?.user?.id) return false;
      if (q && !`${t.titulo} ${t.descripcion}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tareas, soloMias, busqueda, session]);

  const porColumna = (clave) =>
    filtradas.filter((t) => t.estado === clave).sort((a, b) => (a.fechaLimite || "9999").localeCompare(b.fechaLimite || "9999"));

  const abrirNueva = () => {
    setForm({ ...NUEVA, id: "T-" + Date.now(), fechaLimite: "" });
    setNuevoComentario("");
    setModal("nueva");
  };
  const abrirTarea = (t) => {
    setForm({ ...NUEVA, ...t, comentarios: t.comentarios || [] });
    setNuevoComentario("");
    setModal("editar");
  };
  const cerrar = () => setModal(null);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const guardar = () => {
    if (!form.titulo.trim()) return alert("Escribe el título de la tarea.");
    const existe = tareas.some((t) => t.id === form.id);
    const registro = {
      ...form,
      asignadoId: form.asignadoId === "__otro__" ? "" : form.asignadoId,
      asignadoNombre: form.asignadoId && form.asignadoId !== "__otro__" ? "" : (form.asignadoNombre || "").trim()
    };
    guardarTareas(existe ? tareas.map((t) => (t.id === form.id ? registro : t)) : [...tareas, registro]);
    setModal(null);
  };

  const cambiarEstado = (t, estado) => guardarTareas(tareas.map((x) => (x.id === t.id ? { ...x, estado } : x)));

  const eliminar = (t) => {
    guardarTareas(tareas.filter((x) => x.id !== t.id));
    setModal(null);
  };

  const agregarComentario = () => {
    if (!nuevoComentario.trim()) return;
    const comentario = { id: "C-" + Date.now(), texto: nuevoComentario.trim(), autor: miNombre, fecha: new Date().toISOString() };
    const nuevos = [...(form.comentarios || []), comentario];
    setForm((f) => ({ ...f, comentarios: nuevos }));
    setNuevoComentario("");
    const existe = tareas.some((t) => t.id === form.id);
    const actualizada = { ...form, comentarios: nuevos };
    if (existe) guardarTareas(tareas.map((t) => (t.id === form.id ? actualizada : t)));
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Tareas</h1>
            <p style={S.sub}>Asigna actividades al equipo y da seguimiento a los avances · {tareas.length} tareas</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
            <button style={S.btn} onClick={abrirNueva}>+ Nueva tarea</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: "flex", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={S.label}>BUSCAR</label>
              <input style={S.input} placeholder="Título o descripción" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", paddingBottom: 11, cursor: "pointer" }}>
              <input type="checkbox" checked={soloMias} onChange={(e) => setSoloMias(e.target.checked)} /> Solo mis tareas
            </label>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {COLUMNAS.map((col) => {
            const lista = porColumna(col.clave);
            return (
              <div key={col.clave} style={{ background: col.fondo, borderRadius: 12, padding: 14, minHeight: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <strong style={{ color: col.color, fontSize: 13.5, letterSpacing: 0.3 }}>{col.titulo.toUpperCase()}</strong>
                  <span style={{ background: "#fff", color: col.color, fontSize: 12, fontWeight: 800, padding: "1px 9px", borderRadius: 10 }}>{lista.length}</span>
                </div>
                {lista.length === 0 ? (
                  <p style={{ color: "#999", fontSize: 12.5, textAlign: "center", padding: "20px 0" }}>Sin tareas aquí.</p>
                ) : (
                  lista.map((t) => <TarjetaTarea key={t.id} t={t} perfiles={perfiles} onAbrir={abrirTarea} onMover={cambiarEstado} />)
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div style={S.modalBg} onClick={cerrar}>
          <div style={{ ...S.modal, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 16px" }}>
              {modal === "nueva" ? "Nueva tarea" : "Editar tarea"}
            </h2>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>TÍTULO</label>
              <input style={S.input} autoFocus value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej. Revisar cotización de Hotel Ejemplo" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>DESCRIPCIÓN</label>
              <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
            </div>

            <div style={S.grid3}>
              <div>
                <label style={S.label}>ASIGNAR A</label>
                <select
                  style={S.input}
                  value={form.asignadoId === "__otro__" || (!form.asignadoId && form.asignadoNombre) ? "__otro__" : form.asignadoId}
                  onChange={(e) => setForm((f) => ({ ...f, asignadoId: e.target.value, asignadoNombre: e.target.value === "__otro__" ? f.asignadoNombre || "" : "" }))}
                >
                  <option value="">— Sin asignar —</option>
                  {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  <option value="__otro__">✎ Otra persona (escribir nombre)</option>
                </select>
                {(form.asignadoId === "__otro__" || (!form.asignadoId && form.asignadoNombre)) && (
                  <input
                    style={{ ...S.input, marginTop: 8 }}
                    autoFocus
                    placeholder="Ej. nombre del practicante"
                    value={form.asignadoNombre || ""}
                    onChange={(e) => set("asignadoNombre", e.target.value)}
                  />
                )}
              </div>
              <div>
                <label style={S.label}>PRIORIDAD</label>
                <select style={S.input} value={form.prioridad} onChange={(e) => set("prioridad", e.target.value)}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label style={S.label}>FECHA LÍMITE</label>
                <input type="date" style={S.input} value={form.fechaLimite} onChange={(e) => set("fechaLimite", e.target.value)} min={hoyISO()} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>ESTADO</label>
              <div style={{ display: "flex", gap: 8 }}>
                {COLUMNAS.map((col) => (
                  <button
                    key={col.clave}
                    type="button"
                    onClick={() => set("estado", col.clave)}
                    style={{
                      flex: 1,
                      padding: "9px 8px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: form.estado === col.clave ? `2px solid ${col.color}` : "1px solid #d8d8d8",
                      background: form.estado === col.clave ? col.fondo : "#fff",
                      color: form.estado === col.clave ? col.color : "#555"
                    }}
                  >
                    {col.titulo}
                  </button>
                ))}
              </div>
            </div>

            {modal === "editar" && (
              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>AVANCES / REPORTE DE LO QUE SE HIZO</label>
                <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
                  {(form.comentarios || []).length === 0 ? (
                    <p style={{ color: "#999", fontSize: 12.5 }}>Aún no hay avances registrados.</p>
                  ) : (
                    [...(form.comentarios || [])].reverse().map((c) => (
                      <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "8px 0" }}>
                        <div style={{ fontSize: 12.5, color: "#333" }}>{c.texto}</div>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                          {c.autor} · {new Date(c.fecha).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={S.input}
                    placeholder="Escribe qué avanzaste hoy…"
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && agregarComentario()}
                  />
                  <button style={{ ...S.btnGris, whiteSpace: "nowrap" }} onClick={agregarComentario}>Agregar</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              {modal === "editar" ? (
                <DeleteButton title="Eliminar tarea" onConfirm={() => eliminar(form)} />
              ) : (
                <span />
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button style={S.btnGris} onClick={cerrar}>Cancelar</button>
                <button style={S.btn} onClick={guardar}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
