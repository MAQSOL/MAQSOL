import Layout from "../../components/Layout";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import DeleteButton from "../../components/DeleteButton";
import NipGate from "../../components/NipGate";
import { useSharedTable } from "../../hooks/useSharedTable";
import { useAuth } from "../../contexts/AuthContext";

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

    const ok = await guardar(String(Date.now()), nuevoCliente);
    if (!ok) return;

    setCliente("");
    setRfc("");
    setContacto("");
    setContactoObra("");
    setCorreo("");
    setTelefono("");
    setUbicacion("");
    setEquipo("");
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

            {(
              <div className="panel" style={{ padding: "28px 32px" }}>
                <h3 style={{ fontSize: "19px" }}>Agregar Cliente</h3>

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
                    Guardar Cliente
                  </button>
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
                clientes.map((c) => (
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
                    </div>

                    {(
                      <DeleteButton
                        title="Eliminar cliente"
                        onConfirm={() => eliminarCliente(c.id)}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Layout>
    </NipGate>
  );
}

export default GestionClientes;
