import { useState } from "react";

const estiloTarjeta = {
  borderBottom: "1px solid #ddd",
  paddingBottom: "12px",
  marginBottom: "12px"
};

function Tarjeta({ cotizacion, onCargar, mostrarAutor }) {
  return (
    <div style={estiloTarjeta}>
      <strong>{cotizacion.folio}</strong>
      <p style={{ margin: "2px 0" }}>{cotizacion.cliente}</p>
      <small style={{ color: "#888" }}>
        {cotizacion.fecha}
        {mostrarAutor && cotizacion._autor ? ` · ${cotizacion._autor}` : ""}
      </small>
      <br />
      <button className="btn-panel" onClick={() => onCargar(cotizacion)}>
        Ver / Editar
      </button>
    </div>
  );
}

export default function ListaCotizaciones({ cotizaciones, onCargar, mostrarAutor = false }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const recientes = cotizaciones.slice(0, 5);

  const q = busqueda.trim().toLowerCase();
  const filtradas = cotizaciones
    .filter((c) => !q || `${c.folio} ${c.cliente} ${c.fecha} ${c._autor || ""}`.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => String(b.folio || "").localeCompare(String(a.folio || ""), "es", { numeric: true }));

  if (cotizaciones.length === 0) return <p>No hay cotizaciones guardadas.</p>;

  return (
    <>
      {recientes.map((c) => (
        <Tarjeta key={c.id} cotizacion={c} onCargar={onCargar} mostrarAutor={mostrarAutor} />
      ))}

      {cotizaciones.length > 5 && (
        <button
          type="button"
          className="btn-panel"
          style={{ width: "100%", textAlign: "center", border: "none", cursor: "pointer" }}
          onClick={() => setAbierto(true)}
        >
          Ver más ({cotizaciones.length})
        </button>
      )}

      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 1300,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "30px",
            overflowY: "auto"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "820px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0 }}>Todas las cotizaciones ({filtradas.length})</h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                style={{ background: "#f1f1f1", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontSize: "15px" }}
              >
                ✕
              </button>
            </div>

            <input
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por folio, cliente o fecha…"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "16px" }}
            />

            {filtradas.length === 0 ? (
              <p style={{ color: "#999" }}>Sin resultados.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "12px" }}>
                {filtradas.map((c) => (
                  <div
                    key={c.id}
                    style={{ border: "1px solid #e6e6e6", borderRadius: "10px", padding: "12px 14px" }}
                  >
                    <strong style={{ color: "var(--acento)" }}>{c.folio}</strong>
                    <div style={{ fontSize: "14px", margin: "3px 0" }}>{c.cliente}</div>
                    <small style={{ color: "#888", display: "block", marginBottom: "8px" }}>
                      {c.fecha}
                      {mostrarAutor && c._autor ? ` · ${c._autor}` : ""}
                    </small>
                    <button
                      type="button"
                      className="btn-panel"
                      style={{ margin: 0, border: "none", cursor: "pointer" }}
                      onClick={() => {
                        setAbierto(false);
                        onCargar(c);
                      }}
                    >
                      Ver / Editar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
