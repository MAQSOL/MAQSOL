import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import logo from "../../assets/logo.png";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useListaCompartida } from "../../hooks/useSharedTable";
import { descargarFichaPDF, edadDe } from "../../utils/fichaPersonal";
import { S, fFecha, hoyISO } from "./estilosAdmin";

const BUCKET = "personal";
const MAX_MB = 15;

const DOCUMENTOS = [
  { clave: "acta", nombre: "Acta de nacimiento" },
  { clave: "curp", nombre: "CURP" },
  { clave: "ine", nombre: "INE (frente y vuelta)" },
  { clave: "rfc", nombre: "Constancia de situación fiscal (RFC)" },
  { clave: "nss", nombre: "Número de seguridad social (IMSS)" },
  { clave: "domicilio", nombre: "Comprobante de domicilio" },
  { clave: "estudios", nombre: "Comprobante de estudios" },
  { clave: "medico", nombre: "Certificado médico" },
  { clave: "antecedentes", nombre: "Carta de antecedentes no penales" },
  { clave: "ficha", nombre: "Ficha de datos personales firmada" },
  { clave: "contrato", nombre: "Contrato laboral firmado" },
  { clave: "licencia", nombre: "Licencia de conducir (operadores)", opcional: true },
  { clave: "recomendacion", nombre: "Cartas de recomendación", opcional: true },
  { clave: "fotos", nombre: "Fotografías tamaño infantil", opcional: true }
];

const ESTADOS_CIVILES = ["Soltero(a)", "Casado(a)", "Unión libre", "Divorciado(a)", "Viudo(a)"];
const SANGRE = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const EMPLEO = { empresa: "", puesto: "", desde: "", hasta: "", duracion: "", motivo: "", telefono: "" };

const NUEVO = {
  id: "", nombre: "", puesto: "", fechaIngreso: "", fechaNacimiento: "", lugarNacimiento: "", estadoCivil: "",
  tipoSangre: "", alergias: "", condicionesMedicas: "", curp: "", rfc: "", nss: "", ine: "", licencia: "",
  escolaridad: "", domicilio: "", telefono: "", correo: "",
  conyugeNombre: "", conyugeTelefono: "", hijos: [],
  beneficiarioNombre: "", beneficiarioParentesco: "", beneficiarioTelefono: "",
  emergenciaNombre: "", emergenciaParentesco: "", emergenciaTelefono: "",
  empleos: [{ ...EMPLEO }, { ...EMPLEO }],
  documentos: {}, noAplica: {}, notas: ""
};

const rutaUnica = (id, clave, nombre) => {
  const ext = (nombre.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${id}/${clave}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
};

function estadoDocs(persona, nuevos = {}, quitar = []) {
  const requeridos = DOCUMENTOS.filter((d) => !d.opcional && !persona.noAplica?.[d.clave]);
  const tiene = (clave) =>
    (persona.documentos?.[clave] || []).filter((a) => !quitar.includes(a.path)).length + (nuevos[clave] || []).length > 0;
  const faltan = requeridos.filter((d) => !tiene(d.clave));
  return { faltan, completos: requeridos.length - faltan.length, total: requeridos.length, tiene };
}

function Campo({ etiqueta, children }) {
  return (
    <div>
      <label style={S.label}>{etiqueta}</label>
      {children}
    </div>
  );
}

export default function PersonalNuevo() {
  const { isAdmin } = useAuth();
  const [personas, guardarPersonas] = useListaCompartida("personal");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(NUEVO);
  const [nuevos, setNuevos] = useState({});
  const [quitar, setQuitar] = useState([]);
  const [urls, setUrls] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const pathsModal = modal ? Object.values(form.documentos || {}).flat().map((a) => a.path) : [];
  const llave = [...new Set(pathsModal)].sort().join("|");

  useEffect(() => {
    const faltan = llave.split("|").filter((p) => p && !urls[p]);
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
  }, [llave]);

  const logoUrl = () => new URL(logo, window.location.href).href;

  const abrirNuevo = () => {
    setNuevos({});
    setQuitar([]);
    setForm({ ...NUEVO, id: "PN-" + Date.now(), fechaIngreso: hoyISO(), empleos: [{ ...EMPLEO }, { ...EMPLEO }] });
    setModal(true);
  };
  const abrirEditar = (p) => {
    setNuevos({});
    setQuitar([]);
    const empleos = [...(p.empleos || [])];
    while (empleos.length < 2) empleos.push({ ...EMPLEO });
    setForm({ ...NUEVO, ...p, empleos, hijos: p.hijos || [], documentos: p.documentos || {}, noAplica: p.noAplica || {} });
    setModal(true);
  };
  const cerrar = () => setModal(false);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const setEmpleo = (i, campo, valor) =>
    setForm((f) => ({ ...f, empleos: f.empleos.map((e, k) => (k === i ? { ...e, [campo]: valor } : e)) }));
  const setHijo = (i, campo, valor) =>
    setForm((f) => ({ ...f, hijos: f.hijos.map((h, k) => (k === i ? { ...h, [campo]: valor } : h)) }));

  const agregarArchivos = (clave, archivos) => {
    const lista = Array.from(archivos);
    const validos = lista.filter((a) => {
      if (!(a.type === "application/pdf" || a.type.startsWith("image/"))) {
        alert(`"${a.name}" no es PDF ni imagen; se omitió.`);
        return false;
      }
      if (a.size > MAX_MB * 1024 * 1024) {
        alert(`"${a.name}" pesa más de ${MAX_MB} MB; se omitió.`);
        return false;
      }
      return true;
    });
    setNuevos((n) => ({ ...n, [clave]: [...(n[clave] || []), ...validos.map((file) => ({ id: Math.random().toString(36).slice(2), file }))] }));
  };

  const quitarNuevo = (clave, id) => setNuevos((n) => ({ ...n, [clave]: (n[clave] || []).filter((x) => x.id !== id) }));
  const quitarGuardado = (clave, path) => {
    setForm((f) => ({ ...f, documentos: { ...f.documentos, [clave]: (f.documentos[clave] || []).filter((a) => a.path !== path) } }));
    setQuitar((q) => [...q, path]);
  };

  const guardarForm = async () => {
    if (!form.nombre.trim()) return alert("Escribe el nombre del empleado.");
    setGuardando(true);
    const subidos = [];
    try {
      const documentos = { ...form.documentos };
      for (const clave of Object.keys(nuevos)) {
        for (const nf of nuevos[clave]) {
          const path = rutaUnica(form.id, clave, nf.file.name);
          const { error } = await supabase.storage.from(BUCKET).upload(path, nf.file, { contentType: nf.file.type });
          if (error) throw error;
          subidos.push(path);
          documentos[clave] = [...(documentos[clave] || []), { path, nombre: nf.file.name, fecha: hoyISO() }];
        }
      }
      const registro = { ...form, documentos };
      const existe = personas.some((p) => p.id === form.id);
      await guardarPersonas(existe ? personas.map((p) => (p.id === form.id ? registro : p)) : [...personas, registro]);
      if (quitar.length) await supabase.storage.from(BUCKET).remove(quitar);
      setNuevos({});
      setQuitar([]);
      setModal(false);
    } catch (e) {
      if (subidos.length) await supabase.storage.from(BUCKET).remove(subidos);
      alert("No se pudo guardar: " + (e.message || e));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p) => {
    const paths = Object.values(p.documentos || {}).flat().map((a) => a.path);
    await guardarPersonas(personas.filter((x) => x.id !== p.id));
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  };

  const filtradas = personas
    .filter((p) => `${p.nombre} ${p.puesto} ${p.curp}`.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => (b.fechaIngreso || "").localeCompare(a.fechaIngreso || ""));

  if (!isAdmin) {
    return (
      <Layout>
        <div style={{ maxWidth: 700, margin: "60px auto", textAlign: "center" }}>
          <h1 style={S.h1}>Documentos de Personal</h1>
          <p style={S.sub}>Esta sección contiene información confidencial y solo está disponible para administradores.</p>
          <Link to="/" className="btn-panel">← Dashboard</Link>
        </div>
      </Layout>
    );
  }

  const estadoForm = estadoDocs(form, nuevos, quitar);

  return (
    <Layout>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Documentos de Personal Nuevo</h1>
            <p style={S.sub}>Expediente de cada empleado: datos, documentos recibidos y lo que falta · {personas.length} empleados</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
            <button style={S.btnGris} onClick={() => descargarFichaPDF({}, logoUrl(), "FICHA-EMPLEADO-EN-BLANCO")}>
              Ficha en blanco (para que la llene el empleado)
            </button>
            <button style={S.btn} onClick={abrirNuevo}>+ Nuevo empleado</button>
          </div>
        </div>

        <div style={S.card}>
          <label style={S.label}>BUSCAR</label>
          <input style={S.input} placeholder="Nombre, puesto o CURP" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <div style={{ ...S.card, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 950 }}>
            <thead>
              <tr>
                <th style={S.th}>EMPLEADO</th><th style={S.th}>INGRESO</th><th style={S.th}>DOCUMENTOS</th>
                <th style={S.th}>LO QUE FALTA</th><th style={{ ...S.th, width: 210 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                  No hay empleados registrados. Usa "+ Nuevo empleado".
                </td></tr>
              ) : filtradas.map((p) => {
                const e = estadoDocs(p);
                const pct = e.total ? Math.round((e.completos / e.total) * 100) : 100;
                return (
                  <tr key={p.id}>
                    <td style={{ ...S.td, cursor: "pointer" }} onClick={() => abrirEditar(p)}>
                      <strong>{p.nombre}</strong>
                      <div style={{ color: "#888", fontSize: 12 }}>{p.puesto || "Sin puesto"}</div>
                    </td>
                    <td style={S.td}>{fFecha(p.fechaIngreso)}</td>
                    <td style={S.td}>
                      <div style={{ width: 130, height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#1f8b4c" : "var(--acento)" }} />
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>{e.completos}/{e.total} · {pct}%</div>
                    </td>
                    <td style={{ ...S.td, fontSize: 13, color: e.faltan.length ? "#c62828" : "#1f8b4c" }}>
                      {e.faltan.length === 0
                        ? "✓ Expediente completo"
                        : e.faltan.slice(0, 3).map((d) => d.nombre).join(", ") + (e.faltan.length > 3 ? ` y ${e.faltan.length - 3} más` : "")}
                    </td>
                    <td style={{ ...S.td, whiteSpace: "nowrap", textAlign: "right" }}>
                      <button style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13 }} onClick={() => abrirEditar(p)}>Abrir</button>{" "}
                      <button style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13 }} onClick={() => descargarFichaPDF(p, logoUrl(), "FICHA-" + p.nombre.replace(/\s+/g, "-").toUpperCase())}>Ficha PDF</button>{" "}
                      <span style={{ display: "inline-block" }}>
                        <DeleteButton size="sm" title="Eliminar empleado y sus documentos" onConfirm={() => eliminar(p)} />
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
          <div style={{ ...S.modal, maxWidth: 960 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              {personas.some((p) => p.id === form.id) ? "Expediente del empleado" : "Nuevo empleado"}
            </h2>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>
              Captura lo que ya tengas; puedes volver a completarlo después.
            </p>

            <h3 style={S.h3}>Datos personales</h3>
            <div style={S.grid3}>
              <Campo etiqueta="NOMBRE COMPLETO"><input style={S.input} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} /></Campo>
              <Campo etiqueta="PUESTO"><input style={S.input} value={form.puesto} onChange={(e) => set("puesto", e.target.value)} /></Campo>
              <Campo etiqueta="FECHA DE INGRESO"><input type="date" style={S.input} value={form.fechaIngreso} onChange={(e) => set("fechaIngreso", e.target.value)} /></Campo>
            </div>
            <div style={S.grid3}>
              <Campo etiqueta={`FECHA DE NACIMIENTO${form.fechaNacimiento ? ` (${edadDe(form.fechaNacimiento)} años)` : ""}`}>
                <input type="date" style={S.input} value={form.fechaNacimiento} onChange={(e) => set("fechaNacimiento", e.target.value)} />
              </Campo>
              <Campo etiqueta="LUGAR DE NACIMIENTO"><input style={S.input} value={form.lugarNacimiento} onChange={(e) => set("lugarNacimiento", e.target.value)} /></Campo>
              <Campo etiqueta="ESTADO CIVIL">
                <select style={S.input} value={form.estadoCivil} onChange={(e) => set("estadoCivil", e.target.value)}>
                  <option value="">—</option>
                  {ESTADOS_CIVILES.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Campo>
            </div>
            <div style={S.grid3}>
              <Campo etiqueta="CURP"><input style={S.input} value={form.curp} onChange={(e) => set("curp", e.target.value.toUpperCase())} /></Campo>
              <Campo etiqueta="RFC"><input style={S.input} value={form.rfc} onChange={(e) => set("rfc", e.target.value.toUpperCase())} /></Campo>
              <Campo etiqueta="NO. SEGURO SOCIAL (IMSS)"><input style={S.input} value={form.nss} onChange={(e) => set("nss", e.target.value)} /></Campo>
            </div>
            <div style={S.grid3}>
              <Campo etiqueta="INE (CLAVE O NÚMERO)"><input style={S.input} value={form.ine} onChange={(e) => set("ine", e.target.value)} /></Campo>
              <Campo etiqueta="LICENCIA DE CONDUCIR (NO. Y VIGENCIA)"><input style={S.input} value={form.licencia} onChange={(e) => set("licencia", e.target.value)} /></Campo>
              <Campo etiqueta="ESCOLARIDAD"><input style={S.input} value={form.escolaridad} onChange={(e) => set("escolaridad", e.target.value)} /></Campo>
            </div>
            <div style={{ marginBottom: 14 }}>
              <Campo etiqueta="DOMICILIO"><input style={S.input} value={form.domicilio} onChange={(e) => set("domicilio", e.target.value)} /></Campo>
            </div>
            <div style={S.grid2}>
              <Campo etiqueta="TELÉFONO"><input style={S.input} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} /></Campo>
              <Campo etiqueta="CORREO"><input style={S.input} value={form.correo} onChange={(e) => set("correo", e.target.value)} /></Campo>
            </div>

            <h3 style={S.h3}>Salud</h3>
            <div style={S.grid3}>
              <Campo etiqueta="TIPO DE SANGRE">
                <select style={S.input} value={form.tipoSangre} onChange={(e) => set("tipoSangre", e.target.value)}>
                  <option value="">—</option>
                  {SANGRE.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="ALERGIAS"><input style={S.input} value={form.alergias} onChange={(e) => set("alergias", e.target.value)} placeholder="Ninguna, o especificar" /></Campo>
              <Campo etiqueta="PADECIMIENTOS / MEDICAMENTOS"><input style={S.input} value={form.condicionesMedicas} onChange={(e) => set("condicionesMedicas", e.target.value)} /></Campo>
            </div>

            <h3 style={S.h3}>Familia</h3>
            <div style={S.grid2}>
              <Campo etiqueta="NOMBRE DEL CÓNYUGE / PAREJA"><input style={S.input} value={form.conyugeNombre} onChange={(e) => set("conyugeNombre", e.target.value)} /></Campo>
              <Campo etiqueta="TELÉFONO DEL CÓNYUGE"><input style={S.input} value={form.conyugeTelefono} onChange={(e) => set("conyugeTelefono", e.target.value)} /></Campo>
            </div>
            <label style={S.label}>HIJOS ({form.hijos.length})</label>
            {form.hijos.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10, marginBottom: 8 }}>
                <input style={S.input} placeholder="Nombre del hijo(a)" value={h.nombre} onChange={(e) => setHijo(i, "nombre", e.target.value)} />
                <input type="date" style={S.input} value={h.fechaNacimiento || ""} onChange={(e) => setHijo(i, "fechaNacimiento", e.target.value)} />
                <button type="button" style={{ ...S.btnGris, padding: "8px 12px" }} onClick={() => setForm((f) => ({ ...f, hijos: f.hijos.filter((_, k) => k !== i) }))}>✕</button>
              </div>
            ))}
            <button type="button" style={{ ...S.btnGris, marginBottom: 14 }} onClick={() => setForm((f) => ({ ...f, hijos: [...f.hijos, { nombre: "", fechaNacimiento: "" }] }))}>+ Agregar hijo(a)</button>
            <div style={S.grid3}>
              <Campo etiqueta="BENEFICIARIO"><input style={S.input} value={form.beneficiarioNombre} onChange={(e) => set("beneficiarioNombre", e.target.value)} /></Campo>
              <Campo etiqueta="PARENTESCO"><input style={S.input} value={form.beneficiarioParentesco} onChange={(e) => set("beneficiarioParentesco", e.target.value)} /></Campo>
              <Campo etiqueta="TELÉFONO DEL BENEFICIARIO"><input style={S.input} value={form.beneficiarioTelefono} onChange={(e) => set("beneficiarioTelefono", e.target.value)} /></Campo>
            </div>

            <h3 style={S.h3}>Contacto de emergencia (aparte del cónyuge)</h3>
            <div style={S.grid3}>
              <Campo etiqueta="NOMBRE"><input style={S.input} value={form.emergenciaNombre} onChange={(e) => set("emergenciaNombre", e.target.value)} /></Campo>
              <Campo etiqueta="PARENTESCO"><input style={S.input} value={form.emergenciaParentesco} onChange={(e) => set("emergenciaParentesco", e.target.value)} /></Campo>
              <Campo etiqueta="TELÉFONO"><input style={S.input} value={form.emergenciaTelefono} onChange={(e) => set("emergenciaTelefono", e.target.value)} /></Campo>
            </div>

            <h3 style={S.h3}>Últimos dos empleos</h3>
            {form.empleos.slice(0, 2).map((emp, i) => (
              <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "var(--acento)" }}>{i === 0 ? "Empleo más reciente" : "Empleo anterior"}</div>
                <div style={S.grid3}>
                  <Campo etiqueta="EMPRESA"><input style={S.input} value={emp.empresa} onChange={(e) => setEmpleo(i, "empresa", e.target.value)} /></Campo>
                  <Campo etiqueta="PUESTO"><input style={S.input} value={emp.puesto} onChange={(e) => setEmpleo(i, "puesto", e.target.value)} /></Campo>
                  <Campo etiqueta="TELÉFONO DE REFERENCIA"><input style={S.input} value={emp.telefono} onChange={(e) => setEmpleo(i, "telefono", e.target.value)} /></Campo>
                </div>
                <div style={S.grid3}>
                  <Campo etiqueta="DESDE"><input type="date" style={S.input} value={emp.desde} onChange={(e) => setEmpleo(i, "desde", e.target.value)} /></Campo>
                  <Campo etiqueta="HASTA"><input type="date" style={S.input} value={emp.hasta} onChange={(e) => setEmpleo(i, "hasta", e.target.value)} /></Campo>
                  <Campo etiqueta="DURACIÓN"><input style={S.input} value={emp.duracion} onChange={(e) => setEmpleo(i, "duracion", e.target.value)} placeholder="Ej. 2 años 3 meses" /></Campo>
                </div>
                <Campo etiqueta="MOTIVO DE RENUNCIA O SALIDA"><input style={S.input} value={emp.motivo} onChange={(e) => setEmpleo(i, "motivo", e.target.value)} /></Campo>
              </div>
            ))}

            <h3 style={S.h3}>
              Documentos recibidos ·{" "}
              <span style={{ color: estadoForm.faltan.length ? "#c62828" : "#1f8b4c" }}>
                {estadoForm.faltan.length ? `faltan ${estadoForm.faltan.length}` : "expediente completo"}
              </span>
            </h3>
            <p style={{ color: "#999", fontSize: 12, margin: "0 0 10px" }}>PDF o foto, máximo {MAX_MB} MB por archivo. Se suben al guardar.</p>
            {DOCUMENTOS.map((d) => {
              const guardados = form.documentos[d.clave] || [];
              const pendientes = nuevos[d.clave] || [];
              const noAplica = !!form.noAplica?.[d.clave];
              const ok = estadoForm.tiene(d.clave);
              return (
                <div key={d.clave} style={{ display: "grid", gridTemplateColumns: "230px 1fr auto", gap: 12, alignItems: "center", padding: "8px 0", borderTop: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.nombre}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: noAplica ? "#888" : ok ? "#1f8b4c" : d.opcional ? "#999" : "#c62828" }}>
                      {noAplica ? "No aplica" : ok ? "✓ Recibido" : d.opcional ? "Opcional" : "Falta"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {guardados.map((a) => (
                      <span key={a.path} style={chip}>
                        {urls[a.path] ? <a href={urls[a.path]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--acento)", fontWeight: 700 }}>📄 {a.nombre}</a> : `📄 ${a.nombre}`}
                        <button type="button" onClick={() => quitarGuardado(d.clave, a.path)} style={chipX}>✕</button>
                      </span>
                    ))}
                    {pendientes.map((a) => (
                      <span key={a.id} style={{ ...chip, outline: "1px dashed var(--acento)" }}>
                        📄 {a.file.name}
                        <button type="button" onClick={() => quitarNuevo(d.clave, a.id)} style={chipX}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
                    <label style={{ ...S.btnGris, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>
                      + Subir
                      <input type="file" multiple accept="application/pdf,image/*" style={{ display: "none" }} onChange={(e) => { agregarArchivos(d.clave, e.target.files); e.target.value = ""; }} />
                    </label>
                    <label style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="checkbox" checked={noAplica} onChange={(e) => set("noAplica", { ...form.noAplica, [d.clave]: e.target.checked })} /> N/A
                    </label>
                  </div>
                </div>
              );
            })}

            <div style={{ margin: "16px 0 20px" }}>
              <label style={S.label}>NOTAS</label>
              <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <button style={S.btnGris} onClick={() => descargarFichaPDF(form, logoUrl(), "FICHA-" + (form.nombre || "EMPLEADO").replace(/\s+/g, "-").toUpperCase())}>
                Generar ficha PDF con estos datos
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={S.btnGris} onClick={cerrar} disabled={guardando}>Cancelar</button>
                <button style={{ ...S.btn, opacity: guardando ? 0.6 : 1 }} onClick={guardarForm} disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const chip = { background: "#f3f6f9", borderRadius: 14, padding: "3px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 };
const chipX = { border: "none", background: "transparent", color: "#c62828", cursor: "pointer", fontSize: 12, padding: 0 };
