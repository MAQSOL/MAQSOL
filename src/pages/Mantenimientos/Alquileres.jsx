import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import { supabase } from "../../supabaseClient";
import { useListaCompartida, useSharedTable } from "../../hooks/useSharedTable";
import { descargarExcelBonito, nombreArchivoFecha } from "../../utils/exportExcel";
import { S, fFecha, hoyISO } from "../Administracion/estilosAdmin";

const BUCKET = "alquileres";
const MAX_PDF_MB = 15;

const NUEVO = {
  id: "",
  fechaInicio: "",
  fechaFin: "",
  clienteId: "",
  cliente: "",
  contactoCliente: "",
  telefonoCliente: "",
  obra: "",
  direccionObra: "",
  encargadoObra: "",
  telefonoObra: "",
  equipoId: "",
  tipo: "",
  marca: "",
  modelo: "",
  serie: "",
  horometroEntrega: "",
  notas: "",
  fotos: [],
  checklist: null,
  finalizado: false,
  fechaFinalizado: ""
};

const dias = (f) => {
  if (!f) return null;
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return Math.round((new Date(f + "T00:00:00") - h) / 86400000);
};

function estadoDe(a) {
  if (a.finalizado) return "Finalizado";
  const d = dias(a.fechaFin);
  if (d === null) return "Activo";
  if (d < 0) return "Vencido";
  if (d <= 3) return "Por vencer";
  return "Activo";
}

const COLORES_ESTADO = {
  Activo: { bg: "#e8f5e9", c: "#2e7d32" },
  "Por vencer": { bg: "#fff3e0", c: "#c98a00" },
  Vencido: { bg: "#fce4ec", c: "#c62828" },
  Finalizado: { bg: "#eeeeee", c: "#666" }
};

function Badge({ estado }) {
  const s = COLORES_ESTADO[estado];
  return (
    <span style={{ background: s.bg, color: s.c, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      {estado}
    </span>
  );
}

function comprimirImagen(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (Math.max(w, h) > max) {
        const r = max / Math.max(w, h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", 0.82);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("La imagen no es válida (usa JPG o PNG)"));
    };
    img.src = url;
  });
}

const rutaUnica = (id, carpeta, ext) => `${id}/${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

export default function Alquileres() {
  const [alquileres, guardarAlquileres] = useListaCompartida("alquileres");
  const { registros: clientes } = useSharedTable("clientes");
  const { registros: internos } = useSharedTable("equipos_internos");
  const { registros: externos } = useSharedTable("equipos_externos");

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO);
  const [busqueda, setBusqueda] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [nuevasFotos, setNuevasFotos] = useState([]);
  const [quitarPaths, setQuitarPaths] = useState([]);
  const [nuevoPdf, setNuevoPdf] = useState(null);
  const [urls, setUrls] = useState({});

  const catalogo = [
    ...internos.map((e) => ({ ...e, origen: "propio" })),
    ...externos.filter((e) => e.estado !== "Devuelto").map((e) => ({ ...e, origen: "externo" }))
  ];

  const pathsNecesarios = [
    ...alquileres.flatMap((a) => [a.fotos?.[0]?.path, a.checklist?.path]),
    ...(modal ? [...(form.fotos || []).map((f) => f.path), form.checklist?.path] : [])
  ].filter(Boolean);
  const llavePaths = [...new Set(pathsNecesarios)].sort().join("|");

  useEffect(() => {
    const faltan = llavePaths.split("|").filter((p) => p && !urls[p]);
    if (!faltan.length) return;
    let vivo = true;
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(faltan, 3600)
      .then(({ data }) => {
        if (!vivo || !data) return;
        setUrls((u) => {
          const n = { ...u };
          data.forEach((d) => {
            if (d.signedUrl) n[d.path] = d.signedUrl;
          });
          return n;
        });
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llavePaths]);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const resetArchivos = () => {
    nuevasFotos.forEach((f) => URL.revokeObjectURL(f.preview));
    setNuevasFotos([]);
    setQuitarPaths([]);
    setNuevoPdf(null);
  };

  const abrirNuevo = () => {
    resetArchivos();
    setForm({ ...NUEVO, id: "AL-" + Date.now(), fechaInicio: hoyISO() });
    setModal(true);
  };
  const abrirEditar = (a) => {
    resetArchivos();
    setForm({ ...NUEVO, ...a, fotos: a.fotos || [] });
    setModal(true);
  };
  const cerrar = () => {
    resetArchivos();
    setModal(false);
  };

  const elegirCliente = (id) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      clienteId: id,
      cliente: c ? c.cliente || "" : f.cliente,
      contactoCliente: c ? c.contacto || "" : f.contactoCliente,
      telefonoCliente: c ? c.telefono || "" : f.telefonoCliente,
      direccionObra: c && !f.direccionObra ? c.ubicacion || "" : f.direccionObra
    }));
  };

  const elegirEquipo = (idx) => {
    const e = catalogo[idx];
    if (!e) return;
    setForm((f) => ({
      ...f,
      equipoId: e.id,
      tipo: e.tipo || "",
      marca: e.marca || "",
      modelo: e.modelo || "",
      serie: e.serie || "",
      horometroEntrega: f.horometroEntrega || e.horometro || ""
    }));
  };

  const agregarFotos = (archivos) => {
    const validas = Array.from(archivos).filter((f) => f.type.startsWith("image/"));
    if (validas.length !== archivos.length) alert("Solo se aceptan imágenes (JPG o PNG); se omitieron los otros archivos.");
    setNuevasFotos((prev) => [
      ...prev,
      ...validas.map((file) => ({ id: Math.random().toString(36).slice(2), file, preview: URL.createObjectURL(file) }))
    ]);
  };

  const quitarFotoNueva = (id) =>
    setNuevasFotos((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });

  const quitarFotoGuardada = (path) => {
    setForm((f) => ({ ...f, fotos: f.fotos.filter((x) => x.path !== path) }));
    setQuitarPaths((q) => [...q, path]);
  };

  const elegirPdf = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") return alert("El checklist debe ser un archivo PDF.");
    if (file.size > MAX_PDF_MB * 1024 * 1024) return alert(`El PDF pesa más de ${MAX_PDF_MB} MB.`);
    setNuevoPdf(file);
  };

  const quitarChecklist = () => {
    if (nuevoPdf) return setNuevoPdf(null);
    if (form.checklist?.path) setQuitarPaths((q) => [...q, form.checklist.path]);
    set("checklist", null);
  };

  const validar = () => {
    if (!form.cliente.trim()) return alert("Falta el cliente."), false;
    if (!form.tipo.trim() && !form.modelo.trim()) return alert("Falta el equipo (elige uno o captura tipo/modelo)."), false;
    if (!form.fechaInicio || !form.fechaFin) return alert("Indica cuándo empieza y cuándo termina el periodo."), false;
    if (form.fechaFin < form.fechaInicio) return alert("La fecha de fin no puede ser antes del inicio."), false;
    return true;
  };

  const guardarForm = async () => {
    if (!validar()) return;
    setGuardando(true);
    const subidos = [];
    try {
      const fotos = [...form.fotos];
      for (const nf of nuevasFotos) {
        const blob = await comprimirImagen(nf.file);
        const path = rutaUnica(form.id, "fotos", "jpg");
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        subidos.push(path);
        fotos.push({ path, nombre: nf.file.name });
      }

      let checklist = form.checklist;
      if (nuevoPdf) {
        if (checklist?.path) quitarPaths.push(checklist.path);
        const path = rutaUnica(form.id, "checklist", "pdf");
        const { error } = await supabase.storage.from(BUCKET).upload(path, nuevoPdf, { contentType: "application/pdf" });
        if (error) throw error;
        subidos.push(path);
        checklist = { path, nombre: nuevoPdf.name };
      }

      const registro = { ...form, fotos, checklist };
      const existe = alquileres.some((a) => a.id === form.id);
      await guardarAlquileres(existe ? alquileres.map((a) => (a.id === form.id ? registro : a)) : [...alquileres, registro]);

      if (quitarPaths.length) await supabase.storage.from(BUCKET).remove(quitarPaths);
      resetArchivos();
      setModal(false);
    } catch (e) {
      if (subidos.length) await supabase.storage.from(BUCKET).remove(subidos);
      alert("No se pudo guardar: " + (e.message || e));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (a) => {
    const paths = [...(a.fotos || []).map((f) => f.path), a.checklist?.path].filter(Boolean);
    await guardarAlquileres(alquileres.filter((x) => x.id !== a.id));
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  };

  const finalizar = (a) =>
    guardarAlquileres(
      alquileres.map((x) =>
        x.id === a.id ? { ...x, finalizado: !x.finalizado, fechaFinalizado: x.finalizado ? "" : hoyISO() } : x
      )
    );

  const filtrados = alquileres
    .filter((a) => {
      const t = `${a.tipo} ${a.marca} ${a.modelo} ${a.serie} ${a.cliente} ${a.obra}`.toLowerCase();
      return t.includes(busqueda.toLowerCase()) && (!fEstado || estadoDe(a) === fEstado);
    })
    .sort((a, b) => (a.fechaFin || "").localeCompare(b.fechaFin || ""));

  const activos = alquileres.filter((a) => !a.finalizado).length;

  const exportar = () =>
    descargarExcelBonito({
      titulo: "Alquileres de Equipos",
      subtitulo: `${filtrados.length} registros`,
      columnas: ["Equipo", "Marca", "Modelo", "Serie", "Cliente", "Obra", "Dirección de obra", "Inicio", "Fin", "Estado", "Fotos", "Checklist"],
      filas: filtrados.map((a) => [a.tipo, a.marca, a.modelo, a.serie, a.cliente, a.obra, a.direccionObra, fFecha(a.fechaInicio), fFecha(a.fechaFin), estadoDe(a), (a.fotos || []).length, a.checklist ? "Sí" : "No"]),
      nombreArchivo: nombreArchivoFecha("ALQUILERES")
    });

  const enModal = registros_en_modal(form, nuevasFotos);

  return (
    <Layout>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Alquileres Activos</h1>
            <p style={S.sub}>Equipos que están en renta con clientes · {activos} activos de {alquileres.length} registrados</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
            <button style={S.btnGris} onClick={exportar}>Descargar lista</button>
            <button style={S.btn} onClick={abrirNuevo}>+ Registrar equipo en renta</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, alignItems: "end" }}>
            <div>
              <label style={S.label}>BUSCAR</label>
              <input style={S.input} placeholder="Equipo, cliente u obra" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>ESTADO</label>
              <select style={S.input} value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
                <option value="">Todos</option>
                <option>Activo</option>
                <option>Por vencer</option>
                <option>Vencido</option>
                <option>Finalizado</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={S.th}>FOTO</th><th style={S.th}>EQUIPO</th><th style={S.th}>CLIENTE</th><th style={S.th}>OBRA</th>
                <th style={S.th}>PERIODO</th><th style={S.th}>ESTADO</th><th style={S.th}>CHECKLIST</th><th style={{ ...S.th, width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                  No hay equipos en renta registrados. Usa "+ Registrar equipo en renta".
                </td></tr>
              ) : filtrados.map((a) => {
                const d = dias(a.fechaFin);
                const foto = a.fotos?.[0]?.path ? urls[a.fotos[0].path] : null;
                return (
                  <tr key={a.id}>
                    <td style={S.td}>
                      {foto ? (
                        <img src={foto} alt="" onClick={() => abrirEditar(a)} style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, cursor: "pointer" }} />
                      ) : (
                        <span style={{ color: "#bbb" }}>—</span>
                      )}
                      {(a.fotos || []).length > 1 && <div style={{ fontSize: 11, color: "#888" }}>+{a.fotos.length - 1} más</div>}
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, cursor: "pointer" }} onClick={() => abrirEditar(a)}>
                      {a.tipo}
                      <div style={{ fontWeight: 400, color: "#777", fontSize: 12 }}>{a.marca} {a.modelo}{a.serie ? ` · Serie ${a.serie}` : ""}</div>
                    </td>
                    <td style={S.td}>{a.cliente}</td>
                    <td style={S.td}>
                      {a.obra || "—"}
                      {a.direccionObra && <div style={{ color: "#999", fontSize: 12 }}>{a.direccionObra}</div>}
                    </td>
                    <td style={S.td}>
                      {fFecha(a.fechaInicio)} → {fFecha(a.fechaFin)}
                      {!a.finalizado && d !== null && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: d < 0 ? "#c62828" : d <= 3 ? "#c98a00" : "#1f8b4c" }}>
                          {d < 0 ? `Vencido hace ${Math.abs(d)} d` : d === 0 ? "Vence hoy" : `Faltan ${d} d`}
                        </div>
                      )}
                    </td>
                    <td style={S.td}><Badge estado={estadoDe(a)} /></td>
                    <td style={S.td}>
                      {a.checklist?.path && urls[a.checklist.path] ? (
                        <a href={urls[a.checklist.path]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--acento)", fontWeight: 700 }}>Ver PDF</a>
                      ) : a.checklist ? "…" : <span style={{ color: "#bbb" }}>Sin checklist</span>}
                    </td>
                    <td style={{ ...S.td, textAlign: "center", whiteSpace: "nowrap" }}>
                      <button style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13 }} onClick={() => finalizar(a)} title={a.finalizado ? "Reabrir alquiler" : "Marcar como terminado / devuelto"}>
                        {a.finalizado ? "Reabrir" : "✓ Terminar"}
                      </button>
                      <span style={{ marginLeft: 6, display: "inline-block" }}>
                        <DeleteButton size="sm" title="Eliminar alquiler" onConfirm={() => eliminar(a)} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={S.modalBg} onClick={() => !guardando && cerrar()}>
          <div style={{ ...S.modal, maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              {alquileres.some((a) => a.id === form.id) ? "Editar alquiler" : "Registrar equipo en renta"}
            </h2>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 18px" }}>Periodo, cliente, obra, equipo, fotos y checklist en PDF.</p>

            <h3 style={S.h3}>Periodo de renta</h3>
            <div style={S.grid2}>
              <div><label style={S.label}>INICIA</label><input type="date" style={S.input} value={form.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)} /></div>
              <div><label style={S.label}>TERMINA</label><input type="date" style={S.input} value={form.fechaFin} onChange={(e) => set("fechaFin", e.target.value)} /></div>
            </div>

            <h3 style={S.h3}>Cliente</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>ELEGIR DE GESTIÓN DE CLIENTES</label>
              <select style={S.input} value={form.clienteId} onChange={(e) => elegirCliente(e.target.value)}>
                <option value="">— Escribir manualmente —</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
              </select>
            </div>
            <div style={S.grid3}>
              <div><label style={S.label}>CLIENTE</label><input style={S.input} value={form.cliente} onChange={(e) => set("cliente", e.target.value)} /></div>
              <div><label style={S.label}>CONTACTO</label><input style={S.input} value={form.contactoCliente} onChange={(e) => set("contactoCliente", e.target.value)} /></div>
              <div><label style={S.label}>TELÉFONO</label><input style={S.input} value={form.telefonoCliente} onChange={(e) => set("telefonoCliente", e.target.value)} /></div>
            </div>

            <h3 style={S.h3}>Información de la obra</h3>
            <div style={S.grid2}>
              <div><label style={S.label}>NOMBRE DE LA OBRA</label><input style={S.input} value={form.obra} onChange={(e) => set("obra", e.target.value)} /></div>
              <div><label style={S.label}>DIRECCIÓN / UBICACIÓN</label><input style={S.input} value={form.direccionObra} onChange={(e) => set("direccionObra", e.target.value)} /></div>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>ENCARGADO O RESIDENTE DE OBRA</label><input style={S.input} value={form.encargadoObra} onChange={(e) => set("encargadoObra", e.target.value)} /></div>
              <div><label style={S.label}>TELÉFONO DE OBRA</label><input style={S.input} value={form.telefonoObra} onChange={(e) => set("telefonoObra", e.target.value)} /></div>
            </div>

            <h3 style={S.h3}>Equipo</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>TOMAR DE EQUIPOS REGISTRADOS (propios y subarrendados)</label>
              <select style={S.input} value="" onChange={(e) => elegirEquipo(e.target.value)}>
                <option value="">— Elegir o llenar a mano —</option>
                {catalogo.map((q, k) => (
                  <option key={k} value={k}>{`${q.tipo || ""} ${q.marca || ""} ${q.modelo || ""} · ${q.serie || "s/n"} (${q.origen})`}</option>
                ))}
              </select>
            </div>
            <div style={S.grid3}>
              <div><label style={S.label}>TIPO DE EQUIPO</label><input style={S.input} value={form.tipo} onChange={(e) => set("tipo", e.target.value)} /></div>
              <div><label style={S.label}>MARCA</label><input style={S.input} value={form.marca} onChange={(e) => set("marca", e.target.value)} /></div>
              <div><label style={S.label}>MODELO</label><input style={S.input} value={form.modelo} onChange={(e) => set("modelo", e.target.value)} /></div>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>SERIE</label><input style={S.input} value={form.serie} onChange={(e) => set("serie", e.target.value)} /></div>
              <div><label style={S.label}>HORÓMETRO AL ENTREGAR</label><input style={S.input} value={form.horometroEntrega} onChange={(e) => set("horometroEntrega", e.target.value)} /></div>
            </div>

            <h3 style={S.h3}>Fotos del equipo</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              {form.fotos.map((f) => (
                <div key={f.path} style={{ position: "relative" }}>
                  {urls[f.path] ? (
                    <a href={urls[f.path]} target="_blank" rel="noopener noreferrer">
                      <img src={urls[f.path]} alt={f.nombre} style={{ width: 110, height: 82, objectFit: "cover", borderRadius: 8, display: "block" }} />
                    </a>
                  ) : (
                    <div style={{ width: 110, height: 82, background: "#f0f0f0", borderRadius: 8 }} />
                  )}
                  <button type="button" onClick={() => quitarFotoGuardada(f.path)} style={btnX}>✕</button>
                </div>
              ))}
              {nuevasFotos.map((f) => (
                <div key={f.id} style={{ position: "relative" }}>
                  <img src={f.preview} alt="" style={{ width: 110, height: 82, objectFit: "cover", borderRadius: 8, display: "block", outline: "2px dashed var(--acento)" }} />
                  <button type="button" onClick={() => quitarFotoNueva(f.id)} style={btnX}>✕</button>
                </div>
              ))}
              {enModal === 0 && <span style={{ color: "#aaa", fontSize: 13, alignSelf: "center" }}>Aún no hay fotos.</span>}
            </div>
            <label style={{ ...S.btnGris, display: "inline-block", marginBottom: 6 }}>
              + Agregar fotos
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { agregarFotos(e.target.files); e.target.value = ""; }} />
            </label>
            <p style={{ color: "#999", fontSize: 12, margin: "0 0 16px" }}>Las fotos se reducen automáticamente. Se suben al guardar.</p>

            <h3 style={S.h3}>Checklist (PDF)</h3>
            <div style={{ marginBottom: 16 }}>
              {nuevoPdf ? (
                <p style={{ margin: "0 0 8px" }}>📄 {nuevoPdf.name} <span style={{ color: "#999" }}>(se sube al guardar)</span></p>
              ) : form.checklist ? (
                <p style={{ margin: "0 0 8px" }}>
                  📄 {form.checklist.nombre}{" "}
                  {urls[form.checklist.path] && (
                    <a href={urls[form.checklist.path]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--acento)", fontWeight: 700 }}>Ver</a>
                  )}
                </p>
              ) : (
                <p style={{ margin: "0 0 8px", color: "#aaa", fontSize: 13 }}>Aún no hay checklist.</p>
              )}
              <label style={{ ...S.btnGris, display: "inline-block", marginRight: 8 }}>
                {form.checklist || nuevoPdf ? "Reemplazar PDF" : "+ Subir checklist en PDF"}
                <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { elegirPdf(e.target.files[0]); e.target.value = ""; }} />
              </label>
              {(form.checklist || nuevoPdf) && (
                <button type="button" style={{ ...S.btnGris, color: "#c62828" }} onClick={quitarChecklist}>Quitar</button>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>NOTAS</label>
              <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button style={S.btnGris} onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button style={{ ...S.btn, opacity: guardando ? 0.6 : 1 }} onClick={guardarForm} disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const btnX = {
  position: "absolute",
  top: -6,
  right: -6,
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "none",
  background: "#c62828",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
  lineHeight: 1
};

function registros_en_modal(form, nuevas) {
  return (form.fotos || []).length + nuevas.length;
}
