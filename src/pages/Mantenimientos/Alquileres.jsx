import Layout from "../../components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import { supabase } from "../../supabaseClient";
import { useCatalogo, useListaCompartida, useSharedTable } from "../../hooks/useSharedTable";
import { TIPOS_EQUIPO } from "../../utils/catalogoEquipos";
import { buscarCliente } from "../../utils/expediente";
import { descargarExcelBonito, nombreArchivoFecha } from "../../utils/exportExcel";
import { S, fFecha, hoyISO } from "../Administracion/estilosAdmin";
import { IconoMas } from "../../components/Icons";

const BUCKET = "alquileres";
const MAX_PDF_MB = 15;

const PLANES = [
  { clave: "1d", dias: 1, horas: 8, etiqueta: "1 día", detalle: "8 horas" },
  { clave: "6d", dias: 6, horas: 50, etiqueta: "6 días", detalle: "50 horas" },
  { clave: "14d", dias: 14, horas: 100, etiqueta: "14 días", detalle: "100 horas" },
  { clave: "28d", dias: 28, horas: 200, etiqueta: "28 días", detalle: "200 horas" },
  { clave: "manual", etiqueta: "Manual", detalle: "elige la fecha" }
];

const isoDe = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// el día de inicio cuenta como día 1: 6 días desde el lunes terminan el sábado
const finDePlan = (inicio, dias) => {
  const d = new Date(inicio + "T00:00:00");
  d.setDate(d.getDate() + dias - 1);
  return isoDe(d);
};

const diasDe = (a) => {
  if (!a.fechaInicio || !a.fechaFin) return null;
  return Math.round((new Date(a.fechaFin + "T00:00:00") - new Date(a.fechaInicio + "T00:00:00")) / 86400000) + 1;
};

const NUEVO = {
  id: "",
  plan: "",
  horasIncluidas: "",
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

/** El cliente renovó: nuevo periodo (desde el día siguiente al fin actual, editable). */
function ModalRenovar({ alquiler, onGuardar, onCerrar }) {
  const siguiente = (() => {
    if (!alquiler.fechaFin) return hoyISO();
    const d = new Date(alquiler.fechaFin + "T00:00:00");
    d.setDate(d.getDate() + 1);
    return isoDe(d);
  })();
  const planInicial = PLANES.some((x) => x.clave === alquiler.plan && x.dias) ? alquiler.plan : "28d";
  const p0 = PLANES.find((x) => x.clave === planInicial);
  const [plan, setPlan] = useState(planInicial);
  const [inicio, setInicio] = useState(siguiente);
  const [fin, setFin] = useState(finDePlan(siguiente, p0.dias));
  const [horas, setHoras] = useState(String(p0.horas));
  const [nota, setNota] = useState("");

  const elegir = (clave) => {
    const x = PLANES.find((y) => y.clave === clave);
    setPlan(clave);
    if (x?.dias && inicio) { setFin(finDePlan(inicio, x.dias)); setHoras(String(x.horas)); }
  };
  const cambiarInicio = (v) => {
    setInicio(v);
    const x = PLANES.find((y) => y.clave === plan);
    if (x?.dias && v) setFin(finDePlan(v, x.dias));
  };
  const guardar = () => {
    if (!inicio || !fin) return alert("Indica cuándo empieza y cuándo termina la renovación.");
    if (fin < inicio) return alert("La fecha de fin no puede ser antes del inicio.");
    onGuardar({ fechaInicio: inicio, fechaFin: fin, plan, horasIncluidas: horas, nota: nota.trim() });
  };
  const n = diasDe({ fechaInicio: inicio, fechaFin: fin });

  return (
    <div style={S.modalBg} onClick={onCerrar}>
      <div style={{ ...S.modal, maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 4px" }}>Renovar renta</h2>
        <p style={{ color: "#777", margin: "0 0 16px", fontSize: 14 }}>
          {[alquiler.tipo, alquiler.marca, alquiler.modelo].filter(Boolean).join(" ")} · {alquiler.cliente}
          <br />Periodo actual: {fFecha(alquiler.fechaInicio)} → {fFecha(alquiler.fechaFin)}
        </p>
        <label style={S.label}>NUEVO PERIODO</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {PLANES.map((x) => {
            const on = plan === x.clave;
            return (
              <button key={x.clave} type="button" onClick={() => elegir(x.clave)}
                style={{ padding: "9px 14px", borderRadius: 8, border: on ? "2px solid var(--acento)" : "1px solid #d8d8d8", background: on ? "var(--acento)" : "#fff", color: on ? "#fff" : "#333", cursor: "pointer", textAlign: "left", lineHeight: 1.25 }}>
                <strong style={{ display: "block", fontSize: 14 }}>{x.etiqueta}</strong>
                <span style={{ fontSize: 11.5, opacity: 0.85 }}>{x.detalle}</span>
              </button>
            );
          })}
        </div>
        <div style={S.grid2}>
          <div><label style={S.label}>RENUEVA A PARTIR DE</label><input type="date" style={S.input} value={inicio} onChange={(e) => cambiarInicio(e.target.value)} /></div>
          <div><label style={S.label}>TERMINA</label><input type="date" style={S.input} value={fin} onChange={(e) => { setFin(e.target.value); setPlan("manual"); }} /></div>
        </div>
        <div style={S.grid2}>
          <div><label style={S.label}>HORAS INCLUIDAS</label><input style={S.input} value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ej. 200" /></div>
          <div><label style={S.label}>NOTA (OPCIONAL)</label><input style={S.input} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. mismo precio, pago por adelantado" /></div>
        </div>
        {n > 0 && <p style={{ margin: "-4px 0 14px", fontSize: 13, color: "#555" }}>{n} {n === 1 ? "día" : "días"}{horas ? ` · ${horas} horas incluidas` : ""}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button style={S.btnGris} onClick={onCerrar}>Cancelar</button>
          <button style={S.btn} onClick={guardar}>Guardar renovación</button>
        </div>
      </div>
    </div>
  );
}

export default function Alquileres() {
  const [alquileres, guardarAlquileres] = useListaCompartida("alquileres");
  const { registros: clientes, guardar: guardarCliente } = useSharedTable("clientes");
  const { registros: internos } = useSharedTable("equipos_internos");
  const { registros: externos, guardar: guardarExterno } = useSharedTable("equipos_externos");
  const { valores: tiposCatalogo } = useCatalogo("tipos_equipo");
  const tiposEquipo = tiposCatalogo.length ? tiposCatalogo : TIPOS_EQUIPO;
  const [tipoOtro, setTipoOtro] = useState(false);
  // altas automáticas (cliente / equipo escritos a mano) que quedaron con datos por completar
  const [altas, setAltas] = useState([]);

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

  const elegirPlan = (clave) =>
    setForm((f) => {
      const plan = PLANES.find((p) => p.clave === clave);
      if (!plan.dias) return { ...f, plan: "manual" };
      return {
        ...f,
        plan: clave,
        horasIncluidas: String(plan.horas),
        fechaFin: f.fechaInicio ? finDePlan(f.fechaInicio, plan.dias) : f.fechaFin
      };
    });

  const cambiarInicio = (valor) =>
    setForm((f) => {
      const plan = PLANES.find((p) => p.clave === f.plan);
      return { ...f, fechaInicio: valor, fechaFin: plan?.dias && valor ? finDePlan(valor, plan.dias) : f.fechaFin };
    });

  const cambiarFin = (valor) => setForm((f) => ({ ...f, fechaFin: valor, plan: "manual" }));

  const resetArchivos = () => {
    nuevasFotos.forEach((f) => URL.revokeObjectURL(f.preview));
    setNuevasFotos([]);
    setQuitarPaths([]);
    setNuevoPdf(null);
  };

  // "No quiero rellenarlo": quita la marca de incompleto en lo que se dio de alta
  const noRellenar = async () => {
    for (const a of altas) {
      if (a.tabla === "clientes") await guardarCliente(a.id, { ...a.datos, incompleto: false });
      else await guardarExterno(a.id, { ...a.datos, incompleto: false });
    }
    setAltas([]);
  };

  const abrirNuevo = () => {
    setTipoOtro(false);
    resetArchivos();
    setForm({ ...NUEVO, id: "AL-" + Date.now(), fechaInicio: hoyISO() });
    setModal(true);
  };
  const abrirEditar = (a) => {
    setTipoOtro(false);
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

      // cliente o equipo escritos a mano: se dan de alta solos (con datos por completar)
      let clienteId = form.clienteId;
      let equipoId = form.equipoId;
      const nuevasAltas = [];
      if (!clienteId && form.cliente.trim()) {
        const ya = buscarCliente(clientes, form.cliente);
        if (ya) clienteId = ya.id;
        else {
          const datos = {
            cliente: form.cliente.trim(), rfc: "", contacto: form.contactoCliente, contactoObra: form.encargadoObra, correo: "",
            telefono: form.telefonoCliente, ubicacion: form.direccionObra, equipo: [form.tipo, form.marca, form.modelo].filter(Boolean).join(" "),
            incompleto: true, origen: "Alquileres"
          };
          const id = String(Date.now());
          if (await guardarCliente(id, datos)) { clienteId = id; nuevasAltas.push({ tabla: "clientes", id, datos, nombre: datos.cliente }); }
        }
      }
      if (!equipoId && (form.tipo.trim() || form.modelo.trim())) {
        const serie = form.serie.trim().toLowerCase();
        const ya = serie ? catalogo.find((e) => (e.serie || "").trim().toLowerCase() === serie) : null;
        if (ya) equipoId = ya.id;
        else {
          const datos = {
            tipo: form.tipo.trim(), marca: form.marca, modelo: form.modelo, serie: form.serie,
            proveedor: "", contactoProveedor: "", telProveedor: "", cliente: form.cliente.trim(), ubicacion: form.direccionObra || form.obra,
            fechaInicio: form.fechaInicio, fechaFinEstimada: form.fechaFin, fechaDevolucion: "", estado: "Rentado", notas: "",
            incompleto: true, origen: "Alquileres"
          };
          const id = "EX-" + Date.now();
          if (await guardarExterno(id, datos)) { equipoId = id; nuevasAltas.push({ tabla: "equipos_externos", id, datos, nombre: [datos.tipo, datos.marca, datos.modelo].filter(Boolean).join(" ") }); }
        }
      }

      const registro = { ...form, clienteId, equipoId, fotos, checklist };
      const existe = alquileres.some((a) => a.id === form.id);
      await guardarAlquileres(existe ? alquileres.map((a) => (a.id === form.id ? registro : a)) : [...alquileres, registro]);

      if (quitarPaths.length) await supabase.storage.from(BUCKET).remove(quitarPaths);
      resetArchivos();
      setModal(false);
      if (nuevasAltas.length) setAltas(nuevasAltas);
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

  const [renovando, setRenovando] = useState(null);
  // el periodo anterior queda en el historial; la renta sigue con el nuevo periodo
  const renovar = (a, r) => {
    const anterior = { fechaInicio: a.fechaInicio, fechaFin: a.fechaFin, plan: a.plan, horasIncluidas: a.horasIncluidas };
    const renovaciones = [...(a.renovaciones || []), { ...r, anterior, registrado: hoyISO() }];
    guardarAlquileres(alquileres.map((x) => (x.id === a.id
      ? { ...x, inicioOriginal: x.inicioOriginal || x.fechaInicio, fechaInicio: r.fechaInicio, fechaFin: r.fechaFin, plan: r.plan, horasIncluidas: r.horasIncluidas, renovaciones, finalizado: false, fechaFinalizado: "" }
      : x)));
    setRenovando(null);
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
      columnas: ["Equipo", "Marca", "Modelo", "Serie", "Cliente", "Obra", "Dirección de obra", "Inicio", "Fin", "Estado", "Renovaciones", "Rentado desde", "Fotos", "Checklist"],
      filas: filtrados.map((a) => [a.tipo, a.marca, a.modelo, a.serie, a.cliente, a.obra, a.direccionObra, fFecha(a.fechaInicio), fFecha(a.fechaFin), estadoDe(a), (a.renovaciones || []).length, fFecha(a.inicioOriginal || a.fechaInicio), (a.fotos || []).length, a.checklist ? "Sí" : "No"]),
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
            <button style={S.btn} onClick={abrirNuevo}><IconoMas />Registrar equipo en renta</button>
          </div>
        </div>

        {altas.length > 0 && (
          <div style={{ background: "#fff8e1", border: "1px solid #f3d27a", color: "#7a5a00", borderRadius: 10, padding: "12px 16px", fontSize: 14, marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <strong>Favor de terminar de rellenar los datos.</strong>{" "}
              Se dio de alta {altas.map((a) => (a.tabla === "clientes" ? `el cliente "${a.nombre}" en Gestión de Clientes` : `el equipo "${a.nombre}" en Equipos Externos`)).join(" y ")} con datos incompletos.
            </div>
            {altas.some((a) => a.tabla === "clientes") && <Link to="/clientes" className="btn-panel" style={{ margin: 0 }}>Completar cliente</Link>}
            {altas.some((a) => a.tabla === "equipos_externos") && <Link to="/externos" className="btn-panel" style={{ margin: 0 }}>Completar equipo</Link>}
            <button style={S.btnGris} onClick={noRellenar}>No quiero rellenarlo</button>
            <button onClick={() => setAltas([])} aria-label="Cerrar aviso" style={{ border: "none", background: "none", cursor: "pointer", color: "#7a5a00", fontSize: 18 }}>✕</button>
          </div>
        )}

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
                <th style={S.th}>PERIODO</th><th style={S.th}>ESTADO</th><th style={S.th}>CHECKLIST</th><th style={{ ...S.th, width: 230 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#999", padding: 40 }}>
                  No hay equipos en renta registrados. Usa "Registrar equipo en renta".
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
                      {diasDe(a) > 0 && (
                        <div style={{ fontSize: 12, color: "#777" }}>
                          {diasDe(a)} {diasDe(a) === 1 ? "día" : "días"}{a.horasIncluidas ? ` · ${a.horasIncluidas} h` : ""}
                        </div>
                      )}
                      {(a.renovaciones || []).length > 0 && (
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--acento)" }}>
                          ↻ Renovó {a.renovaciones.length} {a.renovaciones.length === 1 ? "vez" : "veces"} · desde {fFecha(a.inicioOriginal)}
                        </div>
                      )}
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
                      {!a.finalizado && (
                        <button
                          style={{ ...(d !== null && d <= 3 ? S.btn : S.btnGris), padding: "6px 12px", fontSize: 13, marginRight: 6 }}
                          onClick={() => setRenovando(a)}
                          title="El cliente renovó: registrar el nuevo periodo"
                        >
                          ↻ Renovar
                        </button>
                      )}
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

      {renovando && <ModalRenovar alquiler={renovando} onGuardar={(r) => renovar(renovando, r)} onCerrar={() => setRenovando(null)} />}

      {modal && (
        <div style={S.modalBg} onClick={() => !guardando && cerrar()}>
          <div style={{ ...S.modal, maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              {alquileres.some((a) => a.id === form.id) ? "Editar alquiler" : "Registrar equipo en renta"}
            </h2>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 18px" }}>Periodo, cliente, obra, equipo, fotos y checklist en PDF.</p>

            <h3 style={S.h3}>Periodo de renta</h3>
            <label style={S.label}>PLAN (la fecha de fin se calcula sola)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {PLANES.map((p) => {
                const activo = form.plan === p.clave;
                return (
                  <button
                    key={p.clave}
                    type="button"
                    onClick={() => elegirPlan(p.clave)}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: activo ? "2px solid var(--acento)" : "1px solid #d8d8d8",
                      background: activo ? "var(--acento)" : "#fff",
                      color: activo ? "#fff" : "#333",
                      cursor: "pointer",
                      textAlign: "left",
                      lineHeight: 1.25
                    }}
                  >
                    <strong style={{ display: "block", fontSize: 14 }}>{p.etiqueta}</strong>
                    <span style={{ fontSize: 11.5, opacity: 0.85 }}>{p.detalle}</span>
                  </button>
                );
              })}
            </div>
            {(form.renovaciones || []).length > 0 && (
              <div style={{ background: "#f6f9fc", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 13, color: "#444" }}>
                <strong>Renovaciones</strong> · rentado desde {fFecha(form.inicioOriginal)}
                {form.renovaciones.map((r, i) => (
                  <div key={i} style={{ marginTop: 4 }}>
                    {i + 1}. {fFecha(r.fechaInicio)} → {fFecha(r.fechaFin)}{r.horasIncluidas ? ` · ${r.horasIncluidas} h` : ""}{r.nota ? ` · ${r.nota}` : ""}
                  </div>
                ))}
              </div>
            )}
            <div style={S.grid2}>
              <div><label style={S.label}>INICIA</label><input type="date" style={S.input} value={form.fechaInicio} onChange={(e) => cambiarInicio(e.target.value)} /></div>
              <div><label style={S.label}>TERMINA</label><input type="date" style={S.input} value={form.fechaFin} onChange={(e) => cambiarFin(e.target.value)} /></div>
            </div>
            {form.fechaInicio && form.fechaFin && diasDe(form) > 0 && (
              <p style={{ margin: "-4px 0 14px", fontSize: 13, color: "#555" }}>
                {diasDe(form)} {diasDe(form) === 1 ? "día" : "días"}
                {form.horasIncluidas ? ` · ${form.horasIncluidas} horas incluidas` : ""}
                {form.plan === "manual" && (
                  <>
                    {" · horas incluidas: "}
                    <input
                      type="number"
                      min="0"
                      value={form.horasIncluidas}
                      onChange={(e) => set("horasIncluidas", e.target.value)}
                      placeholder="opcional"
                      style={{ width: 90, padding: "4px 8px", border: "1px solid #d8d8d8", borderRadius: 6 }}
                    />
                  </>
                )}
              </p>
            )}

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
              <div>
                <label style={S.label}>TIPO DE EQUIPO</label>
                <select
                  style={S.input}
                  value={tipoOtro || (form.tipo && !tiposEquipo.includes(form.tipo)) ? "__otro__" : form.tipo}
                  onChange={(e) => { const v = e.target.value; if (v === "__otro__") { setTipoOtro(true); set("tipo", ""); } else { setTipoOtro(false); set("tipo", v); } }}
                >
                  <option value="">Selecciona el tipo…</option>
                  {tiposEquipo.map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="__otro__">Otro (escribir)</option>
                </select>
                {(tipoOtro || (form.tipo && !tiposEquipo.includes(form.tipo))) && (
                  <input style={{ ...S.input, marginTop: 6 }} autoFocus placeholder="Escribe el tipo de equipo" value={form.tipo} onChange={(e) => set("tipo", e.target.value)} />
                )}
              </div>
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
              <IconoMas />Agregar fotos
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
                {form.checklist || nuevoPdf ? "Reemplazar PDF" : <><IconoMas />Subir checklist en PDF</>}
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
