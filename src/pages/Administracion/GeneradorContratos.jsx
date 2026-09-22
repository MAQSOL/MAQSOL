import Layout from "../../components/Layout";
import { useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import logo from "../../assets/logo.png";
import { useListaCompartida, useSharedTable } from "../../hooks/useSharedTable";
import { construirDocumento, descargarContratoPDF } from "../../utils/contratoArrendamiento";
import { S, fFecha, hoyISO } from "./estilosAdmin";

const EQUIPO_FILA = { descripcion: "", marca: "", modelo: "", serie: "", motor: "", valorUSD: "", importeRenta: "" };

const NUEVO = {
  id: "",
  folio: "",
  fechaContrato: "",
  representanteMaqsol: "Lic. Francisco Torres Morales",
  clienteId: "",
  razonSocial: "",
  rfc: "",
  domicilio: "",
  telefono: "",
  representante: "",
  curpRepresentante: "",
  equipos: [{ ...EQUIPO_FILA }],
  periodo: "Un mes 28 días o 200 horas, lo que ocurra primero",
  fechaInicio: "",
  fechaFin: "",
  obra: "",
  ciudadObra: "",
  traslado: "",
  pagareMonto: "",
  pagareVence: "",
  avalNombre: "",
  avalCurp: "",
  avalIne: "",
  depositarioNombre: "",
  depositarioRepresentante: "",
  depositarioDomicilio: "",
  depositarioIne: "",
  depositarioCurp: "",
  adicionales: ""
};

function Campo({ etiqueta, children }) {
  return (
    <div>
      <label style={S.label}>{etiqueta}</label>
      {children}
    </div>
  );
}

function Vista({ bloques }) {
  const pagina = { background: "#fff", fontSize: 12, lineHeight: 1.5, color: "#222" };
  return (
    <div style={pagina}>
      {bloques.map((b, i) => {
        if (b.t === "salto") return <hr key={i} style={{ margin: "22px 0", border: "none", borderTop: "2px dashed #ccc" }} />;
        if (b.t === "title") return <h3 key={i} style={{ textAlign: "center", fontSize: 15, margin: "6px 0 10px" }}>{b.text}</h3>;
        if (b.t === "center") return <p key={i} style={{ textAlign: "center", color: "#777", margin: "0 0 8px" }}>{b.text}</p>;
        if (b.t === "h") return <h4 key={i} style={{ textAlign: "center", margin: "12px 0 8px" }}>{b.text}</h4>;
        if (b.t === "p") return <p key={i} style={{ margin: "0 0 8px", fontWeight: b.bold ? 700 : 400, textAlign: "justify" }}>{b.text}</p>;
        if (b.t === "box") return (
          <div key={i} style={{ border: "1px solid #ccc", marginBottom: 10 }}>
            <div style={{ background: "#1d5c8f", color: "#fff", fontWeight: 700, padding: "4px 8px", fontSize: 11 }}>{b.titulo}</div>
            {b.filas.map(([e, val], k) => (
              <div key={k} style={{ display: "flex", gap: 8, padding: "3px 8px" }}>
                <span style={{ fontWeight: 700, minWidth: 150, fontSize: 11 }}>{e}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        );
        if (b.t === "grid") return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${b.cols.length},1fr)`, border: "1px solid #ccc", marginBottom: 10 }}>
            {b.cols.map((c, k) => (
              <div key={k} style={{ borderRight: k < b.cols.length - 1 ? "1px solid #ccc" : "none" }}>
                <div style={{ background: "#1d5c8f", color: "#fff", fontWeight: 700, padding: "4px 6px", fontSize: 10.5, textAlign: "center" }}>{c.titulo}</div>
                <div style={{ padding: "6px" }}>{c.texto}</div>
              </div>
            ))}
          </div>
        );
        if (b.t === "linea") return <div key={i} style={{ textAlign: "right", margin: "26px 0 12px" }}><span style={{ display: "inline-block", width: 220, borderTop: "1px solid #444", textAlign: "center", fontSize: 11 }}>{b.text}</span></div>;
        if (b.t === "firmas") return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, margin: "36px 0 10px", textAlign: "center", fontSize: 11 }}>
            {[b.izq, b.der].map((col, k) => (
              <div key={k} style={{ borderTop: "1px solid #444", paddingTop: 6 }}>
                {col.map((l, n) => <div key={n} style={{ fontWeight: n === 0 ? 700 : 400 }}>{l}</div>)}
              </div>
            ))}
          </div>
        );
        return null;
      })}
    </div>
  );
}

export default function GeneradorContratos() {
  const [contratos, guardarContratos] = useListaCompartida("contratos");
  const { registros: clientes } = useSharedTable("clientes");
  const { registros: internos } = useSharedTable("equipos_internos");
  const { registros: externos } = useSharedTable("equipos_externos");

  const [form, setForm] = useState(() => ({ ...NUEVO, id: "CT-" + Date.now(), fechaContrato: hoyISO() }));

  const catalogoEquipos = [
    ...internos.map((e) => ({ ...e, origen: "propio" })),
    ...externos.filter((e) => e.estado !== "Devuelto").map((e) => ({ ...e, origen: "externo" }))
  ];

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const siguienteFolio = () => {
    const n = contratos.reduce((max, c) => {
      const m = /CON-(\d+)/.exec(c.folio || "");
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const f = new Date();
    return `CON-${String(n + 1).padStart(3, "0")}-${String(f.getMonth() + 1).padStart(2, "0")}${f.getFullYear()}`;
  };

  const elegirCliente = (id) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      clienteId: id,
      razonSocial: c ? c.cliente || "" : f.razonSocial,
      rfc: c ? c.rfc || "" : f.rfc,
      domicilio: c ? c.ubicacion || "" : f.domicilio,
      representante: c ? c.contacto || "" : f.representante,
      telefono: c ? c.telefono || "" : f.telefono
    }));
  };

  const cambiarEquipo = (i, campo, valor) =>
    setForm((f) => ({ ...f, equipos: f.equipos.map((e, k) => (k === i ? { ...e, [campo]: valor } : e)) }));

  const elegirEquipoCatalogo = (i, idx) => {
    const eq = catalogoEquipos[idx];
    if (!eq) return;
    setForm((f) => ({
      ...f,
      equipos: f.equipos.map((e, k) =>
        k === i ? { ...e, descripcion: eq.tipo || "", marca: eq.marca || "", modelo: eq.modelo || "", serie: eq.serie || "", motor: eq.motor || "" } : e
      )
    }));
  };

  const validar = () => {
    if (!form.razonSocial.trim()) { alert("Falta la arrendataria (cliente)."); return false; }
    if (!form.equipos.some((e) => e.descripcion || e.modelo)) { alert("Agrega al menos un equipo."); return false; }
    if (!form.fechaInicio || !form.fechaFin) { alert("Indica la fecha de inicio y de fin de la vigencia."); return false; }
    return true;
  };

  const conFolio = () => (form.folio ? form : { ...form, folio: siguienteFolio() });

  const guardar = async () => {
    if (!validar()) return;
    const datos = conFolio();
    const existe = contratos.some((c) => c.id === datos.id);
    await guardarContratos(existe ? contratos.map((c) => (c.id === datos.id ? datos : c)) : [...contratos, datos]);
    setForm(datos);
    alert("Contrato guardado en el historial: " + datos.folio);
  };

  const descargar = () => {
    if (!validar()) return;
    const datos = conFolio();
    if (!form.folio) setForm(datos);
    const logoUrl = new URL(logo, window.location.href).href;
    descargarContratoPDF(construirDocumento(datos), datos.folio, logoUrl);
  };

  const nuevo = () => setForm({ ...NUEVO, id: "CT-" + Date.now(), fechaContrato: hoyISO() });

  const inp = (campo, extra = {}) => (
    <input style={S.input} value={form[campo]} onChange={(e) => set(campo, e.target.value)} {...extra} />
  );

  return (
    <Layout>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={S.h1}>Generador de Contratos de Arrendamiento</h1>
            <p style={S.sub}>Llena los datos y se acomodan solos en el machote: contrato, pagaré y carta de depositario</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/" className="btn-panel" style={{ margin: 0 }}>← Dashboard</Link>
            <button style={S.btnGris} onClick={nuevo}>Nuevo contrato</button>
            <button style={S.btnGris} onClick={guardar}>Guardar en historial</button>
            <button style={S.btn} onClick={descargar}>Descargar PDF</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, alignItems: "start" }}>
          <div>
            <div style={S.card}>
              <h3 style={S.h3}>Datos generales</h3>
              <div style={S.grid2}>
                <Campo etiqueta="FOLIO">{inp("folio", { placeholder: "Se asigna al guardar" })}</Campo>
                <Campo etiqueta="FECHA DE FIRMA">{inp("fechaContrato", { type: "date" })}</Campo>
              </div>
              <Campo etiqueta="REPRESENTANTE LEGAL DE MAQSOL">{inp("representanteMaqsol")}</Campo>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>La Arrendataria (cliente)</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>ELEGIR DE GESTIÓN DE CLIENTES</label>
                <select style={S.input} value={form.clienteId} onChange={(e) => elegirCliente(e.target.value)}>
                  <option value="">— Escribir manualmente —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.cliente}</option>)}
                </select>
              </div>
              <div style={S.grid2}>
                <Campo etiqueta="NOMBRE / RAZÓN SOCIAL">{inp("razonSocial")}</Campo>
                <Campo etiqueta="R.F.C.">{inp("rfc")}</Campo>
              </div>
              <div style={S.grid2}>
                <Campo etiqueta="REPRESENTANTE LEGAL">{inp("representante")}</Campo>
                <Campo etiqueta="CURP DEL REPRESENTANTE">{inp("curpRepresentante")}</Campo>
              </div>
              <div style={S.grid2}>
                <Campo etiqueta="DOMICILIO">{inp("domicilio")}</Campo>
                <Campo etiqueta="TELÉFONO">{inp("telefono")}</Campo>
              </div>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Equipo arrendado</h3>
              {form.equipos.map((e, i) => (
                <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={S.label}>TOMAR DE EQUIPOS REGISTRADOS</label>
                    <select style={S.input} value="" onChange={(ev) => elegirEquipoCatalogo(i, ev.target.value)}>
                      <option value="">— Elegir o llenar a mano —</option>
                      {catalogoEquipos.map((q, k) => (
                        <option key={k} value={k}>{`${q.tipo || ""} ${q.marca || ""} ${q.modelo || ""} · ${q.serie || "s/n"} (${q.origen})`}</option>
                      ))}
                    </select>
                  </div>
                  <div style={S.grid2}>
                    <Campo etiqueta="DESCRIPCIÓN DEL EQUIPO"><input style={S.input} value={e.descripcion} onChange={(ev) => cambiarEquipo(i, "descripcion", ev.target.value)} /></Campo>
                    <Campo etiqueta="MARCA"><input style={S.input} value={e.marca} onChange={(ev) => cambiarEquipo(i, "marca", ev.target.value)} /></Campo>
                  </div>
                  <div style={S.grid3}>
                    <Campo etiqueta="MODELO"><input style={S.input} value={e.modelo} onChange={(ev) => cambiarEquipo(i, "modelo", ev.target.value)} /></Campo>
                    <Campo etiqueta="SERIE"><input style={S.input} value={e.serie} onChange={(ev) => cambiarEquipo(i, "serie", ev.target.value)} /></Campo>
                    <Campo etiqueta="MOTOR"><input style={S.input} value={e.motor} onChange={(ev) => cambiarEquipo(i, "motor", ev.target.value)} /></Campo>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 14, alignItems: "end" }}>
                    <Campo etiqueta="VALOR DE RECUPERACIÓN (USD)"><input type="number" style={S.input} value={e.valorUSD} onChange={(ev) => cambiarEquipo(i, "valorUSD", ev.target.value)} /></Campo>
                    <Campo etiqueta="IMPORTE DE LA RENTA (MXN + IVA)"><input type="number" style={S.input} value={e.importeRenta} onChange={(ev) => cambiarEquipo(i, "importeRenta", ev.target.value)} /></Campo>
                    {form.equipos.length > 1 && (
                      <button style={{ ...S.btnGris, padding: "10px 12px" }} onClick={() => setForm((f) => ({ ...f, equipos: f.equipos.filter((_, k) => k !== i) }))}>✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button style={S.btnGris} onClick={() => setForm((f) => ({ ...f, equipos: [...f.equipos, { ...EQUIPO_FILA }] }))}>+ Agregar otro equipo</button>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Renta y lugar de operación</h3>
              <div style={{ marginBottom: 14 }}><Campo etiqueta="PERIODO DE RENTA">{inp("periodo")}</Campo></div>
              <div style={S.grid3}>
                <Campo etiqueta="VIGENCIA: DEL">{inp("fechaInicio", { type: "date" })}</Campo>
                <Campo etiqueta="AL">{inp("fechaFin", { type: "date" })}</Campo>
                <Campo etiqueta="TRASLADO CON RETORNO (MXN + IVA)">{inp("traslado", { type: "number" })}</Campo>
              </div>
              <div style={S.grid2}>
                <Campo etiqueta="OBRA / LUGAR DE OPERACIÓN">{inp("obra")}</Campo>
                <Campo etiqueta="CERCA DE LA CIUDAD DE">{inp("ciudadObra")}</Campo>
              </div>
              <Campo etiqueta="CLÁUSULA ADICIONAL (opcional, se agrega como la 21)">
                <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={form.adicionales} onChange={(e) => set("adicionales", e.target.value)} />
              </Campo>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Pagaré y aval</h3>
              <div style={S.grid2}>
                <Campo etiqueta="MONTO DEL PAGARÉ (USD)">{inp("pagareMonto", { type: "number" })}</Campo>
                <Campo etiqueta="FECHA DE VENCIMIENTO">{inp("pagareVence", { type: "date" })}</Campo>
              </div>
              <div style={S.grid3}>
                <Campo etiqueta="NOMBRE DEL AVAL">{inp("avalNombre")}</Campo>
                <Campo etiqueta="CURP DEL AVAL">{inp("avalCurp")}</Campo>
                <Campo etiqueta="INE DEL AVAL">{inp("avalIne")}</Campo>
              </div>
            </div>

            <div style={S.card}>
              <h3 style={S.h3}>Carta de depositario</h3>
              <p style={{ color: "#888", fontSize: 12.5, margin: "0 0 12px" }}>Si los dejas vacíos se usan los datos de la arrendataria.</p>
              <div style={S.grid2}>
                <Campo etiqueta="DEPOSITARIO (NOMBRE)">{inp("depositarioNombre")}</Campo>
                <Campo etiqueta="REPRESENTANTE LEGAL">{inp("depositarioRepresentante")}</Campo>
              </div>
              <div style={{ marginBottom: 14 }}><Campo etiqueta="DOMICILIO">{inp("depositarioDomicilio")}</Campo></div>
              <div style={S.grid2}>
                <Campo etiqueta="INE">{inp("depositarioIne")}</Campo>
                <Campo etiqueta="CURP">{inp("depositarioCurp")}</Campo>
              </div>
            </div>
          </div>

          <div style={{ position: "sticky", top: 16 }}>
            <div style={{ ...S.card, maxHeight: "74vh", overflowY: "auto" }}>
              <h3 style={S.h3}>Vista previa del contrato</h3>
              <Vista bloques={construirDocumento(form)} />
            </div>

            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", fontWeight: 800 }}>Historial de contratos</div>
              {contratos.length === 0 ? (
                <p style={{ padding: "0 18px 16px", color: "#999", margin: 0 }}>Aún no hay contratos guardados.</p>
              ) : contratos.slice().reverse().map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderTop: "1px solid #eee" }}>
                  <div style={{ cursor: "pointer" }} onClick={() => setForm({ ...NUEVO, ...c })}>
                    <strong>{c.folio}</strong>
                    <div style={{ fontSize: 12, color: "#777" }}>{c.razonSocial} · {fFecha(c.fechaInicio)} al {fFecha(c.fechaFin)}</div>
                  </div>
                  <DeleteButton size="sm" title="Eliminar contrato" onConfirm={() => guardarContratos(contratos.filter((x) => x.id !== c.id))} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
