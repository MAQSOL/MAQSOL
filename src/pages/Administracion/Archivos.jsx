import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../supabaseClient";
import { S } from "./estilosAdmin";
import DeleteButton from "../../components/DeleteButton";

const BUCKET = "archivos";

const CATEGORIAS = [
  { key: "ordenes",      label: "Órdenes de Compra"  },
  { key: "contratos",    label: "Contratos"           },
  { key: "cotizaciones", label: "Cotizaciones"        },
  { key: "horas",        label: "Reporte de Horas"   },
  { key: "diesel",       label: "Diesel"              },
  { key: "otros",        label: "Otros"               },
];

function CatIcon({ k, color = "currentColor" }) {
  const s = { width: 17, height: 17, display: "inline-block", verticalAlign: "middle", flexShrink: 0 };
  if (k === "ordenes") return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="13" height="20" rx="1"/><path d="M9 2H5a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1h4"/><path d="M13 7h5M13 11h5M13 15h3"/>
    </svg>
  );
  if (k === "contratos") return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/><path d="M16 17l2-2 2 2"/>
    </svg>
  );
  if (k === "cotizaciones") return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/><path d="M18 2l4 4-9 9H9v-4z"/>
    </svg>
  );
  if (k === "horas") return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  if (k === "diesel") return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14"/><path d="M17 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/><line x1="3" y1="22" x2="21" y2="22"/><line x1="7" y1="10" x2="13" y2="10"/>
    </svg>
  );
  return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

const EXT_PDF   = ["pdf"];
const EXT_IMG   = ["jpg", "jpeg", "png", "webp", "gif"];
const EXT_EXCEL = ["xlsx", "xls", "csv"];
const EXT_WORD  = ["doc", "docx"];

function ext(nombre) { return nombre.split(".").pop().toLowerCase(); }
function esPdf(n)    { return EXT_PDF.includes(ext(n)); }
function esImg(n)    { return EXT_IMG.includes(ext(n)); }

function icono(nombre) {
  const e = ext(nombre);
  if (EXT_PDF.includes(e))   return "📕";
  if (EXT_EXCEL.includes(e)) return "📊";
  if (EXT_WORD.includes(e))  return "📝";
  if (EXT_IMG.includes(e))   return "🖼️";
  return "📎";
}

function formatBytes(b) {
  if (!b) return "";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

function formatFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

// Strip the timestamp prefix added on upload (e.g. "1745000000_contrato.pdf" → "contrato.pdf")
function nombreLimpio(nombre) {
  return nombre.replace(/^\d{10,}_/, "").replace(/_/g, " ");
}

export default function Archivos() {
  const [catActiva, setCatActiva]   = useState("ordenes");
  const [archivos, setArchivos]     = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [subiendo, setSubiendo]     = useState(false);
  const [arrastrar, setArrastrar]   = useState(false);
  const [busqueda, setBusqueda]     = useState("");
  const [conteos, setConteos]       = useState({});
  const [visor, setVisor]           = useState(null); // { url, nombre }
  const fileRef = useRef();

  const cargar = useCallback(async (cat) => {
    setCargando(true);
    const { data } = await supabase.storage.from(BUCKET).list(cat, {
      limit: 500,
      sortBy: { column: "created_at", order: "desc" },
    });
    setCargando(false);
    setArchivos((data || []).filter(f => !f.name.startsWith(".")));
  }, []);

  useEffect(() => { cargar(catActiva); }, [catActiva, cargar]);

  useEffect(() => {
    CATEGORIAS.forEach(({ key }) => {
      supabase.storage.from(BUCKET).list(key, { limit: 500 }).then(({ data }) => {
        if (data) {
          const n = data.filter(f => !f.name.startsWith(".")).length;
          setConteos(prev => ({ ...prev, [key]: n }));
        }
      });
    });
  }, []);

  async function subir(files) {
    if (!files?.length) return;
    setSubiendo(true);
    for (const file of files) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${catActiva}/${Date.now()}_${safe}`;
      await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    }
    setSubiendo(false);
    setConteos(prev => ({ ...prev, [catActiva]: (prev[catActiva] || 0) + files.length }));
    cargar(catActiva);
  }

  async function signedUrl(archivo) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${catActiva}/${archivo.name}`, 3600);
    return data?.signedUrl ?? null;
  }

  async function ver(archivo) {
    const url = await signedUrl(archivo);
    if (!url) return;
    if (esPdf(archivo.name) || esImg(archivo.name)) {
      setVisor({ url, nombre: archivo.name });
    } else {
      window.open(url, "_blank");
    }
  }

  async function descargar(archivo) {
    const url = await signedUrl(archivo);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreLimpio(archivo.name);
    a.click();
  }

  async function eliminar(archivo) {
    await supabase.storage.from(BUCKET).remove([`${catActiva}/${archivo.name}`]);
    setArchivos(prev => prev.filter(f => f.name !== archivo.name));
    setConteos(prev => ({ ...prev, [catActiva]: Math.max(0, (prev[catActiva] || 1) - 1) }));
  }

  const filtrados = archivos.filter(f =>
    nombreLimpio(f.name).toLowerCase().includes(busqueda.toLowerCase())
  );

  // Drag & drop handlers
  const onDragOver  = (e) => { e.preventDefault(); setArrastrar(true); };
  const onDragLeave = ()  => setArrastrar(false);
  const onDrop      = (e) => { e.preventDefault(); setArrastrar(false); subir(Array.from(e.dataTransfer.files)); };

  const catInfo = CATEGORIAS.find(c => c.key === catActiva);

  return (
    <Layout>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div>
          <h1 style={S.h1}>Archivos y Documentos</h1>
          <p style={S.sub}>Explorador de documentos por categoría · PDFs, Excel, Word</p>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* ─── Category sidebar ─── */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            {CATEGORIAS.map(cat => {
              const activa = catActiva === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => { setCatActiva(cat.key); setBusqueda(""); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "11px 14px",
                    background: activa ? "#111" : "#fff",
                    color: activa ? "#fff" : "#222",
                    border: "2px solid #111",
                    borderLeft: activa ? "8px solid var(--acento)" : "2px solid #111",
                    cursor: "pointer",
                    fontWeight: activa ? 800 : 600,
                    fontSize: 13,
                    fontFamily: "'Montserrat', sans-serif",
                    textAlign: "left",
                    transition: "border-left .12s",
                  }}
                >
                  <span style={{display:"flex",alignItems:"center",gap:8}}><CatIcon k={cat.key} color={activa?"#fff":"#444"}/>{cat.label}</span>
                  {!!conteos[cat.key] && (
                    <span style={{
                      background: activa ? "var(--acento)" : "#eee",
                      color: activa ? "#fff" : "#666",
                      fontSize: 11, fontWeight: 700,
                      padding: "1px 7px", borderRadius: 0, flexShrink: 0,
                    }}>
                      {conteos[cat.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── Main panel ─── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder={`Buscar en ${catInfo?.label}…`}
                style={{
                  flex: 1, minWidth: 180,
                  padding: "10px 14px",
                  border: "2px solid #111",
                  borderRadius: 0,
                  fontSize: 14, fontFamily: "inherit",
                }}
              />
              <button
                className="btn-sys"
                style={S.btn}
                onClick={() => fileRef.current?.click()}
                disabled={subiendo}
              >
                {subiendo ? "Subiendo…" : "⬆ Subir archivo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png,.webp"
                style={{ display: "none" }}
                onChange={e => { subir(Array.from(e.target.files)); e.target.value = ""; }}
              />
            </div>

            {/* Drop zone hint when dragging */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              style={{
                border: arrastrar ? "3px dashed var(--acento)" : "3px dashed transparent",
                borderRadius: 0,
                background: arrastrar ? "rgba(143,29,44,.06)" : "transparent",
                minHeight: 8,
                transition: ".15s",
              }}
            />

            {/* Files grid */}
            {cargando ? (
              <p style={{ color: "#888", margin: 0 }}>Cargando archivos…</p>
            ) : filtrados.length === 0 ? (
              <div
                style={{ ...S.card, textAlign: "center", padding: "52px 24px", color: "#bbb" }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>📂</div>
                <p style={{ margin: 0, fontWeight: 700, color: "#999" }}>
                  {busqueda ? "Sin resultados" : "No hay archivos aquí"}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#bbb" }}>
                  Sube un archivo o arrastra y suelta aquí
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                  gap: 14,
                }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                {filtrados.map(archivo => (
                  <FileCard
                    key={archivo.name}
                    archivo={archivo}
                    onVer={() => ver(archivo)}
                    onDescargar={e => { e.stopPropagation(); descargar(archivo); }}
                    onEliminar={() => eliminar(archivo)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── PDF / Image viewer modal ─── */}
      {visor && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.72)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
          onClick={() => setVisor(null)}
        >
          <div
            style={{
              background: "#fff",
              border: "3px solid #111",
              boxShadow: "8px 8px 0 #111",
              width: "100%", maxWidth: 960,
              maxHeight: "92vh",
              display: "flex", flexDirection: "column",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 18px",
              borderBottom: "2px solid #111",
              background: "#111", color: "#fff",
              gap: 12,
            }}>
              <span style={{
                fontWeight: 700, fontSize: 14,
                fontFamily: "'Montserrat', sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {icono(visor.nombre)}&nbsp; {nombreLimpio(visor.nombre)}
              </span>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <a
                  href={visor.url}
                  download={nombreLimpio(visor.nombre)}
                  style={{ color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                  onClick={e => e.stopPropagation()}
                >⬇ Descargar</a>
                <button
                  onClick={() => setVisor(null)}
                  style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}
                >✕</button>
              </div>
            </div>
            {/* Viewer body */}
            {esImg(visor.nombre) ? (
              <img src={visor.url} alt={visor.nombre} style={{ width: "100%", maxHeight: "82vh", objectFit: "contain" }} />
            ) : (
              <iframe
                src={visor.url}
                title={visor.nombre}
                style={{ flex: 1, border: "none", minHeight: "78vh" }}
              />
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

function FileCard({ archivo, onVer, onDescargar, onEliminar }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onVer}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        border: "2px solid #111",
        boxShadow: hover ? "2px 2px 0 #111" : "5px 5px 0 #111",
        padding: "16px 14px 12px",
        display: "flex", flexDirection: "column", gap: 8,
        cursor: "pointer",
        transform: hover ? "translate(-2px,-2px)" : "none",
        transition: "box-shadow .12s, transform .12s",
      }}
    >
      <div style={{ fontSize: 38, lineHeight: 1 }}>{icono(archivo.name)}</div>
      <div style={{
        fontWeight: 700, fontSize: 12.5,
        wordBreak: "break-word", lineHeight: 1.35,
        color: "#111",
        maxHeight: 52, overflow: "hidden",
      }}>
        {nombreLimpio(archivo.name)}
      </div>
      <div style={{ fontSize: 11, color: "#999", marginTop: "auto" }}>
        {formatBytes(archivo.metadata?.size)}{archivo.metadata?.size ? " · " : ""}{formatFecha(archivo.created_at)}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }} onClick={e => e.stopPropagation()}>
        <button
          className="btn-sys"
          style={{ flex: 1, padding: "5px 8px", fontWeight: 700, fontSize: 11, fontFamily: "inherit" }}
          onClick={onDescargar}
        >
          ⬇ Bajar
        </button>
        <DeleteButton size="sm" title="Eliminar archivo" onConfirm={onEliminar} />
      </div>
    </div>
  );
}
