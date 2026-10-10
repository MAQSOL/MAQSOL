import { IconoMas } from "../../components/Icons";
import Layout from "../../components/Layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import { useListaCompartida } from "../../hooks/useSharedTable";
import { useAuth } from "../../contexts/AuthContext";
import { S, fFecha, hoyISO } from "./estilosAdmin";
import {
  ORDEN_NUEVA, PARTIDA_NUEVA, USOS_CFDI, FORMAS_PAGO, METODOS_PAGO, VIAS_EMBARQUE, ESTADOS_OC,
  calcularTotales, importePartida, dineroOC, folioOC, htmlOrden, abrirOrdenPDF
} from "../../utils/ordenCompra";

const COLOR_ESTADO = {
  Pendiente: { c: "#c98a00", bg: "#fff3e0" },
  Recibida: { c: "#2e7d32", bg: "#e8f5e9" },
  Cancelada: { c: "#c62828", bg: "#fce4ec" }
};

function Campo({ etiqueta, children }) {
  return (
    <div>
      <label style={S.label}>{etiqueta}</label>
      {children}
    </div>
  );
}

/** El mismo html del PDF, en hoja carta escalada al ancho de la columna. */
function VistaPrevia({ orden }) {
  const caja = useRef(null);
  const [escala, setEscala] = useState(0.6);
  const [alto, setAlto] = useState(1056);
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setEscala(Math.min(1, e.contentRect.width / 816)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={caja} style={{ width: "100%", height: alto * escala, overflow: "hidden", border: "1px solid #eee", borderRadius: 8, background: "#fff" }}>
      <iframe
        title="Vista previa de la orden de compra"
        srcDoc={htmlOrden(orden)}
        onLoad={(e) => setAlto(Math.max(1056, e.currentTarget.contentDocument?.body?.scrollHeight || 0))}
        style={{ width: 816, height: alto, border: 0, transform: `scale(${escala})`, transformOrigin: "0 0", display: "block" }}
      />
    </div>
  );
}

export default function OrdenesCompra() {
  const [ordenes, guardarOrdenes] = useListaCompartida("ordenes_compra");
  const { profile } = useAuth();
  const miNombre = profile?.nombre_completo || profile?.apodo || "";

  const nueva = () => ({ ...ORDEN_NUEVA, partidas: [{ ...PARTIDA_NUEVA }], id: "OC-" + Date.now(), fecha: hoyISO() });
  const [form, setForm] = useState(nueva);
  const [busqueda, setBusqueda] = useState("");

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  // lo que se imprime: si no escribiste quién solicitó, va tu nombre de usuario
  const ordenFinal = (o) => ({ ...o, solicito: o.solicito || miNombre });

  const siguienteFolio = () => ordenes.reduce((max, o) => Math.max(max, parseInt(o.folio, 10) || 0), 0) + 1;

  // proveedores ya usados: al escribir uno conocido se llenan solos sus datos
  const proveedores = useMemo(() => {
    const m = new Map();
    [...ordenes]
      .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
      .forEach((o) => { if (o.proveedor) m.set(o.proveedor.trim().toUpperCase(), o); });
    return m;
  }, [ordenes]);

  const cambiarProveedor = (valor) =>
    setForm((f) => {
      const conocido = proveedores.get(valor.trim().toUpperCase());
      if (!conocido) return { ...f, proveedor: valor };
      const llenar = (c) => f[c] || conocido[c] || "";
      return {
        ...f,
        proveedor: valor,
        proveedorContacto: llenar("proveedorContacto"),
        proveedorTelefono: llenar("proveedorTelefono"),
        proveedorCorreo: llenar("proveedorCorreo"),
        proveedorRfc: llenar("proveedorRfc"),
        proveedorDomicilio: llenar("proveedorDomicilio")
      };
    });

  const cambiarPartida = (i, campo, valor) =>
    setForm((f) => ({ ...f, partidas: f.partidas.map((p, k) => (k === i ? { ...p, [campo]: valor } : p)) }));
  const agregarPartida = () => setForm((f) => ({ ...f, partidas: [...f.partidas, { ...PARTIDA_NUEVA }] }));
  const quitarPartida = (i) =>
    setForm((f) => ({ ...f, partidas: f.partidas.length > 1 ? f.partidas.filter((_, k) => k !== i) : [{ ...PARTIDA_NUEVA }] }));

  const validar = () => {
    if (!form.proveedor.trim()) { alert("Falta el proveedor."); return false; }
    if (!form.partidas.some((p) => p.descripcion.trim())) { alert("Agrega al menos una partida con descripción."); return false; }
    if (form.folio && ordenes.some((o) => o.id !== form.id && String(o.folio) === String(form.folio))) {
      alert(`Ya existe la orden ${folioOC(form)}. Cambia el folio o déjalo vacío para asignar el siguiente.`);
      return false;
    }
    return true;
  };

  const conFolio = () => ordenFinal(form.folio ? form : { ...form, folio: String(siguienteFolio()) });

  const guardarEnLista = (datos) => {
    const existe = ordenes.some((o) => o.id === datos.id);
    return guardarOrdenes(existe ? ordenes.map((o) => (o.id === datos.id ? datos : o)) : [...ordenes, datos]);
  };

  const guardar = async () => {
    if (!validar()) return;
    const datos = conFolio();
    setForm(datos);
    await guardarEnLista(datos);
    alert("Orden guardada: " + folioOC(datos));
  };

  // el PDF se abre ANTES de guardar: si se esperara a Supabase, el navegador podría bloquear la ventana
  const descargar = () => {
    if (!validar()) return;
    const datos = conFolio();
    abrirOrdenPDF(datos);
    setForm(datos);
    guardarEnLista(datos);
  };

  const duplicar = (o) =>
    setForm({ ...ORDEN_NUEVA, ...o, id: "OC-" + Date.now(), folio: "", fecha: hoyISO(), estado: "Pendiente", partidas: (o.partidas || []).map((p) => ({ ...p })) });

  const t = calcularTotales(form);
  const m = form.moneda;

  const inp = (campo, extra = {}) => (
    <input style={S.input} value={form[campo] ?? ""} onChange={(e) => set(campo, e.target.value)} {...extra} />
  );

  const filtradas = ordenes
    .filter((o) => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return [folioOC(o), o.proveedor, o.observaciones, ...(o.partidas || []).map((p) => p.descripcion + " " + p.numeroParte)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => (parseInt(b.folio, 10) || 0) - (parseInt(a.folio, 10) || 0));

  const celdaPartida = { ...S.input, padding: "8px 9px", fontSize: 13 };

  return (
    <Layout>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Órdenes de Compra</h1>
            <p style={S.sub}>Llena la orden y sale en PDF con el formato de MAQSOL; cada orden queda en el historial</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
            <button style={S.btnGris} onClick={() => setForm(nueva())}>Nueva orden</button>
            <button style={S.btnGris} onClick={guardar}>Guardar</button>
            <button style={S.btn} onClick={descargar}>Descargar PDF</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, alignItems: "start" }}>
          <div>
            <div style={S.card}>
              <h3 style={S.h3}>Datos de la orden</h3>
              <div style={S.grid3}>
                <Campo etiqueta="FOLIO">{inp("folio", { placeholder: `Automático: OC-${String(siguienteFolio()).padStart(3, "0")}`, inputMode: "numeric" })}</Campo>
                <Campo etiqueta="FECHA">{inp("fecha", { type: "date" })}</Campo>
                <Campo etiqueta="ESTADO">
                  <select style={S.input} value={form.estado} onChange={(e) => set("estado", e.target.value)}>
                    {ESTADOS_OC.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Campo>
              </div>
              <div style={S.grid3}>
                <Campo etiqueta="VÍA DE EMBARQUE">{inp("viaEmbarque", { list: "oc-vias" })}</Campo>
                <Campo etiqueta="SOLICITÓ">{inp("solicito", { placeholder: miNombre || "Nombre" })}</Campo>
                <Campo etiqueta="COTIZACIÓN (REFERENCIA)">{inp("cotizacion", { placeholder: "Opcional" })}</Campo>
              </div>
              <datalist id="oc-vias">{VIAS_EMBARQUE.map((x) => <option key={x} value={x} />)}</datalist>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Proveedor</h3>
              <div style={S.grid2}>
                <Campo etiqueta="PROVEEDOR">
                  <input style={S.input} value={form.proveedor} onChange={(e) => cambiarProveedor(e.target.value)} list="oc-proveedores" placeholder="Ej. SEGAMAC" />
                </Campo>
                <Campo etiqueta="ATENCIÓN (SOLICITADO A)">{inp("proveedorContacto")}</Campo>
              </div>
              <datalist id="oc-proveedores">{[...proveedores.values()].map((o) => <option key={o.proveedor} value={o.proveedor} />)}</datalist>
              <div style={S.grid3}>
                <Campo etiqueta="TELÉFONO">{inp("proveedorTelefono")}</Campo>
                <Campo etiqueta="CORREO">{inp("proveedorCorreo", { type: "email" })}</Campo>
                <Campo etiqueta="R.F.C.">{inp("proveedorRfc")}</Campo>
              </div>
              <Campo etiqueta="DOMICILIO">
                <textarea style={{ ...S.input, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={form.proveedorDomicilio} onChange={(e) => set("proveedorDomicilio", e.target.value)} />
              </Campo>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Facturación</h3>
              <div style={S.grid3}>
                <Campo etiqueta="USO DEL CFDI">{inp("usoCfdi", { list: "oc-cfdi" })}</Campo>
                <Campo etiqueta="FORMA DE PAGO">{inp("formaPago", { list: "oc-formas" })}</Campo>
                <Campo etiqueta="MÉTODO DE PAGO">
                  <select style={S.input} value={form.metodoPago} onChange={(e) => set("metodoPago", e.target.value)}>
                    {METODOS_PAGO.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Campo>
              </div>
              <datalist id="oc-cfdi">{USOS_CFDI.map((x) => <option key={x} value={x} />)}</datalist>
              <datalist id="oc-formas">{FORMAS_PAGO.map((x) => <option key={x} value={x} />)}</datalist>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Partidas</h3>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 2fr 100px 28px", gap: 6, fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>
                <span>CANT.</span><span>NO. DE PARTE</span><span>NO. DE SERIE</span><span>DESCRIPCIÓN</span><span>P. UNITARIO</span><span />
              </div>
              {form.partidas.map((p, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 2fr 100px 28px", gap: 6, alignItems: "center" }}>
                    <input style={celdaPartida} value={p.cantidad} onChange={(e) => cambiarPartida(i, "cantidad", e.target.value)} inputMode="decimal" />
                    <input style={celdaPartida} value={p.numeroParte} onChange={(e) => cambiarPartida(i, "numeroParte", e.target.value)} />
                    <input style={celdaPartida} value={p.serie} onChange={(e) => cambiarPartida(i, "serie", e.target.value)} />
                    <input style={celdaPartida} value={p.descripcion} onChange={(e) => cambiarPartida(i, "descripcion", e.target.value)} />
                    <input style={celdaPartida} value={p.precio} onChange={(e) => cambiarPartida(i, "precio", e.target.value)} inputMode="decimal" placeholder="0.00" />
                    <button onClick={() => quitarPartida(i)} title="Quitar partida" style={{ border: "none", background: "transparent", color: "#bbb", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                  {importePartida(p) > 0 && (
                    <div style={{ textAlign: "right", fontSize: 12, color: "#777", marginTop: 2, paddingRight: 34 }}>Importe: <b>{dineroOC(importePartida(p), m)}</b></div>
                  )}
                </div>
              ))}
              <button style={{ ...S.btnGris, padding: "8px 14px", fontSize: 13 }} onClick={agregarPartida}><IconoMas />Agregar partida</button>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Totales y condiciones</h3>
              <div style={S.grid3}>
                <Campo etiqueta="DESCUENTO ($)">{inp("descuento", { inputMode: "decimal", placeholder: "0.00" })}</Campo>
                <Campo etiqueta="FLETE ($)">{inp("flete", { inputMode: "decimal", placeholder: "0.00" })}</Campo>
                <Campo etiqueta="MONEDA">
                  <select style={S.input} value={form.moneda} onChange={(e) => set("moneda", e.target.value)}>
                    <option value="MXN">MXN (pesos)</option>
                    <option value="USD">USD (dólares)</option>
                  </select>
                </Campo>
              </div>
              <div style={S.grid3}>
                <Campo etiqueta="CONDICIÓN">
                  <select style={S.input} value={form.condicion} onChange={(e) => set("condicion", e.target.value)}>
                    <option>Contado</option>
                    <option>Crédito</option>
                  </select>
                </Campo>
                <Campo etiqueta="DÍAS DE CRÉDITO">{inp("diasCredito", { inputMode: "numeric", disabled: form.condicion !== "Crédito", placeholder: form.condicion === "Crédito" ? "Ej. 30" : "—" })}</Campo>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#444", marginTop: 20 }}>
                  <input type="checkbox" checked={form.conIva} onChange={(e) => set("conIva", e.target.checked)} /> Agregar I.V.A. 16 %
                </label>
              </div>
              <div style={{ background: "#f6f9fc", borderRadius: 8, padding: "12px 14px", fontSize: 14, display: "grid", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Suma subtotal</span><span>{dineroOC(t.suma, m)}</span></div>
                {t.descuento > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Descuento</span><span>−{dineroOC(t.descuento, m)}</span></div>}
                {t.flete > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Flete</span><span>{dineroOC(t.flete, m)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>I.V.A.</span><span>{form.conIva ? dineroOC(t.iva, m) : "No aplica"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, borderTop: "1px solid #dde5ee", paddingTop: 6, marginTop: 2 }}>
                  <span>Importe total</span><span style={{ color: "#d6001c" }}>{dineroOC(t.total, m)}</span>
                </div>
              </div>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Observaciones y autorización</h3>
              <Campo etiqueta="OBSERVACIONES">
                <textarea style={{ ...S.input, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} placeholder="Ej. Birlos para retroexcavadora Terex TLB830" />
              </Campo>
              <div style={{ ...S.grid2, marginTop: 14 }}>
                <Campo etiqueta="AUTORIZA">{inp("autoriza")}</Campo>
                <Campo etiqueta="PUESTO">{inp("puestoAutoriza")}</Campo>
              </div>
            </div>
          </div>

          <div style={{ position: "sticky", top: 16 }}>
            <div style={{ ...S.card, maxHeight: "78vh", overflowY: "auto" }}>
              <h3 style={S.h3}>Vista previa · {folioOC(form.folio ? form : { ...form, folio: String(siguienteFolio()) })}</h3>
              <VistaPrevia orden={ordenFinal(form.folio ? form : { ...form, folio: String(siguienteFolio()) })} />
            </div>

            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <strong>Historial de órdenes</strong>
                <input style={{ ...S.input, width: 220, padding: "8px 10px" }} placeholder="Buscar folio, proveedor, pieza…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              {filtradas.length === 0 ? (
                <p style={{ padding: "0 18px 16px", color: "#999", margin: 0 }}>{ordenes.length ? "Ninguna orden coincide con la búsqueda." : "Aún no hay órdenes guardadas."}</p>
              ) : filtradas.map((o) => {
                const est = COLOR_ESTADO[o.estado] || COLOR_ESTADO.Pendiente;
                return (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 18px", borderTop: "1px solid #eee", background: o.id === form.id ? "#f6f9fc" : "transparent" }}>
                    <div style={{ cursor: "pointer", minWidth: 0 }} onClick={() => setForm({ ...ORDEN_NUEVA, ...o })} title="Abrir para ver o editar">
                      <strong>{folioOC(o)}</strong>{" "}
                      <span style={{ background: est.bg, color: est.c, borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{o.estado || "Pendiente"}</span>
                      <div style={{ fontSize: 12, color: "#777", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {o.proveedor} · {fFecha(o.fecha)} · <b>{dineroOC(calcularTotales(o).total, o.moneda)}</b>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <button style={{ ...S.btnGris, padding: "6px 10px", fontSize: 12 }} onClick={() => abrirOrdenPDF({ ...ORDEN_NUEVA, ...o })}>PDF</button>
                      <button style={{ ...S.btnGris, padding: "6px 10px", fontSize: 12 }} onClick={() => duplicar(o)} title="Nueva orden con el mismo proveedor y partidas">Duplicar</button>
                      <DeleteButton size="sm" title="Eliminar orden" onConfirm={() => guardarOrdenes(ordenes.filter((x) => x.id !== o.id))} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
