import Layout from "../../components/Layout";
import { useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import NipGate from "../../components/NipGate";
import { useSharedTable } from "../../hooks/useSharedTable";
import ExpedienteCliente from "../../components/ExpedienteCliente";
import { estadoExpediente } from "../../utils/expediente";

const inputGrande = {
  height: "54px",
  padding: "14px 16px",
  fontSize: "15px"
};

function GestionClientes() {
  const { registros: clientes, loading, guardar, eliminar } = useSharedTable("clientes");

  const [cliente, setCliente] = useState("");
  const [rfc, setRfc] = useState("");
  const [contacto, setContacto] = useState("");
  const [contactoObra, setContactoObra] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [equipo, setEquipo] = useState("");
  const [expedienteDe, setExpedienteDe] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const incompletos = clientes.filter((c) => c.incompleto);

  const limpiarForm = () => {
    setCliente(""); setRfc(""); setContacto(""); setContactoObra(""); setCorreo(""); setTelefono(""); setUbicacion(""); setEquipo("");
    setEditandoId(null);
  };
  const editarCliente = (c) => {
    setCliente(c.cliente || ""); setRfc(c.rfc || ""); setContacto(c.contacto || ""); setContactoObra(c.contactoObra || "");
    setCorreo(c.correo || ""); setTelefono(c.telefono || ""); setUbicacion(c.ubicacion || ""); setEquipo(c.equipo || "");
    setEditandoId(c.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // "No quiero rellenarlo": deja de pedir que se completen sus datos
  const noRellenar = (c) => {
    const { id, ...datos } = c;
    guardar(id, { ...datos, incompleto: false });
  };

  const guardarCliente = async () => {
    if (!cliente) {
      alert("Debe capturar el nombre del cliente");
      return;
    }

    const nuevoCliente = {
      cliente,
      rfc,
      contacto,
      contactoObra,
      correo,
      telefono,
      ubicacion,
      equipo
    };

    let ok;
    if (editandoId) {
      // al editar se conserva lo demás (expediente, documentos) y ya no cuenta como incompleto
      const previo = { ...(clientes.find((c) => c.id === editandoId) || {}) };
      delete previo.id;
      ok = await guardar(editandoId, { ...previo, ...nuevoCliente, incompleto: false });
    } else {
      ok = await guardar(String(Date.now()), nuevoCliente);
    }
    if (!ok) return;
    limpiarForm();
  };

  const eliminarCliente = (id) => eliminar(id);

  return (
    <NipGate>
      <Layout>
        <div
          style={{
            display: "block",
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 20px",
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            <div className="panel" style={{ padding: "28px 32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px"
                }}
              >
                <div>
                  <h2 style={{ fontSize: "26px" }}>Gestión de Clientes</h2>
                  <p>Sistema MAQSISTEM · información compartida con todo el equipo</p>
                </div>

                <Link to="/" className="btn-panel">
                  ← Dashboard
                </Link>
              </div>
            </div>

            {incompletos.length > 0 && (
              <div style={{ background: "#fff8e1", border: "1px solid #f3d27a", color: "#7a5a00", borderRadius: 10, padding: "12px 16px", fontSize: 14 }}>
                <strong>Favor de terminar de rellenar los datos de tus clientes.</strong> {incompletos.length === 1 ? "1 cliente tiene" : `${incompletos.length} clientes tienen`} datos incompletos (se dieron de alta desde Alquileres). Usa <em>Completar</em> o <em>No quiero rellenarlo</em> en la lista.
              </div>
            )}

            {(
              <div className="panel" style={{ padding: "28px 32px" }}>
                <h3 style={{ fontSize: "19px" }}>{editandoId ? "Editar cliente" : "Agregar Cliente"}</h3>

                <div className="form-grid" style={{ gap: "18px" }}>
                  <input
                    style={inputGrande}
                    placeholder="Cliente"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                  />
                  <input
                    style={inputGrande}
                    placeholder="RFC"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                  />
                  <input
                    style={inputGrande}
                    placeholder="Contacto"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                  />
                  <input
                    style={inputGrande}
                    placeholder="Contacto de Obra"
                    value={contactoObra}
                    onChange={(e) => setContactoObra(e.target.value)}
                  />
                  <input
                    style={inputGrande}
                    placeholder="Correo"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                  <input
                    style={inputGrande}
                    placeholder="Teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                  <input
                    style={inputGrande}
                    placeholder="Ubicación"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                  />
                  <input
                    style={inputGrande}
                    placeholder="Equipo Renta/Cotizado"
                    value={equipo}
                    onChange={(e) => setEquipo(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    className="btn-guardar"
                    style={{ padding: "14px 28px", fontSize: "15px" }}
                    onClick={guardarCliente}
                  >
                    {editandoId ? "Guardar cambios" : "Guardar Cliente"}
                  </button>
                  {editandoId && (
                    <button type="button" className="btn-panel" style={{ margin: "0 0 0 10px", border: "none", cursor: "pointer" }} onClick={limpiarForm}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="panel" style={{ padding: "28px 32px" }}>
              <h3 style={{ fontSize: "19px" }}>Clientes Guardados</h3>

              {loading ? (
                <p>Cargando…</p>
              ) : clientes.length === 0 ? (
                <p>No hay clientes guardados.</p>
              ) : (
                clientes.map((c) => {
                  const ex = estadoExpediente(c);
                  const chip = (color, fondo) => ({ background: fondo, color, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" });
                  return (
                  <div
                    key={c.id}
                    style={{
                      borderBottom: "1px solid #ddd",
                      paddingBottom: "12px",
                      marginBottom: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong>{c.cliente}</strong>
                      <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                        {c.contacto} · {c.correo} · {c.telefono}
                      </p>
                      <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                        {c.ubicacion}
                      </p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                        {c.incompleto && <span style={chip("#7a5a00", "#fff3c4")}>Datos incompletos</span>}
                        <span style={ex.contrato ? chip("#1b7a3f", "#e1f3e7") : chip("#b3202f", "#fbe0e4")}>{ex.contrato ? "Contrato firmado" : "Contrato sin firmar"}</span>
                        <span style={!ex.tipo ? chip("#666", "#eee") : ex.entregados === ex.total ? chip("#1b7a3f", "#e1f3e7") : chip("#a8730a", "#fdf0d4")}>
                          {!ex.tipo ? "Falta indicar persona física o moral" : `${ex.tipo === "moral" ? "Persona moral" : "Persona física"} · documentos ${ex.entregados}/${ex.total}${ex.noAplican ? ` (${ex.noAplican} no aplica${ex.noAplican === 1 ? "" : "n"})` : ""}`}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {c.incompleto && (
                        <button type="button" onClick={() => noRellenar(c)} style={{ background: "none", border: "none", color: "#7a5a00", fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                          No quiero rellenarlo
                        </button>
                      )}
                      <button type="button" className="btn-panel" style={{ margin: 0, border: "none", cursor: "pointer", background: c.incompleto ? "#c98a00" : undefined }} onClick={() => editarCliente(c)}>
                        {c.incompleto ? "Completar" : "Editar"}
                      </button>
                      <button type="button" className="btn-panel" style={{ margin: 0, border: "none", cursor: "pointer" }} onClick={() => setExpedienteDe(c.cliente)}>
                        Expediente
                      </button>
                      <DeleteButton
                        title="Eliminar cliente"
                        onConfirm={() => eliminarCliente(c.id)}
                      />
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {expedienteDe && (
          <ExpedienteCliente nombreCliente={expedienteDe} clientes={clientes} onGuardar={guardar} onCerrar={() => setExpedienteDe(null)} />
        )}
      </Layout>
    </NipGate>
  );
}

export default GestionClientes;
