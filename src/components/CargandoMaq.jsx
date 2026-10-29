import "./CargandoMaq.css";

export default function CargandoMaq({ texto = "Cargando…" }) {
  return (
    <div className="cmaq-loader">
      <div className="loader">
        <div className="cup">
          <div className="cup-handle"></div>
          <div className="smoke one"></div>
          <div className="smoke two"></div>
          <div className="smoke three"></div>
        </div>
        <div className="load">..........................</div>
      </div>
      {texto && <p className="cmaq-texto">{texto}</p>}
    </div>
  );
}
