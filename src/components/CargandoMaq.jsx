import "./CargandoMaq.css";

export default function CargandoMaq({ texto = "Cargando…" }) {
  return (
    <div className="cmaq-loader">
      <div className="cmaq-wrapper">

        {/* Poste de luz que pasa */}
        <svg className="cmaq-lamppost" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="0" width="4" height="70" fill="#555" rx="2"/>
          <rect x="8" y="0" width="22" height="4" fill="#555" rx="2"/>
          <rect x="28" y="0" width="4" height="10" fill="#aaa" rx="1"/>
        </svg>

        {/* Telehandler — lado derecho */}
        <svg className="cmaq-machine" viewBox="-5 -8 215 103" xmlns="http://www.w3.org/2000/svg" overflow="visible">

          {/* Chasis principal */}
          <rect x="18" y="36" width="122" height="24" rx="3" fill="#1d5c8f" stroke="#0d3a5e" strokeWidth="1.5"/>

          {/* Contrapeso trasero */}
          <rect x="8" y="44" width="14" height="14" rx="2" fill="#164878" stroke="#0d3a5e" strokeWidth="1.5"/>

          {/* Cabina del operador */}
          <rect x="122" y="15" width="32" height="45" rx="3" fill="#2a6eb0" stroke="#0d3a5e" strokeWidth="1.5"/>

          {/* Ventana delantera cabina */}
          <rect x="126" y="19" width="22" height="24" rx="2" fill="#b8dff5" opacity="0.9"/>
          <line x1="137" y1="19" x2="137" y2="43" stroke="#7abde8" strokeWidth="1" opacity="0.5"/>

          {/* Techo cabina */}
          <rect x="120" y="12" width="36" height="6" rx="2" fill="#164878" stroke="#0d3a5e" strokeWidth="1"/>

          {/* Luz delantera */}
          <rect x="150" y="43" width="6" height="5" rx="1" fill="#f5e642" opacity="0.95"/>

          {/* Detalle lateral chasis */}
          <rect x="26" y="50" width="18" height="7" rx="2" fill="#2a6eb0" opacity="0.5"/>
          <rect x="50" y="50" width="14" height="7" rx="2" fill="#2a6eb0" opacity="0.3"/>

          {/* Brazo telescópico — rotado -15° desde pivote (65, 36) */}
          <g transform="rotate(-15, 65, 36)">
            {/* Sección base del brazo */}
            <rect x="38" y="29" width="86" height="13" rx="3" fill="#1a4f80" stroke="#0d3a5e" strokeWidth="1.5"/>
            {/* Sección extensión */}
            <rect x="118" y="31" width="65" height="9" rx="2.5" fill="#2062a0" stroke="#0d3a5e" strokeWidth="1.2"/>
            {/* Carro portahorquillas */}
            <rect x="179" y="25" width="6" height="22" rx="1.5" fill="#0d3a5e"/>
            {/* Horquillas */}
            <rect x="183" y="26" width="18" height="3.5" rx="1" fill="#1a4f80" stroke="#0d3a5e" strokeWidth="0.8"/>
            <rect x="183" y="34" width="18" height="3.5" rx="1" fill="#1a4f80" stroke="#0d3a5e" strokeWidth="0.8"/>
          </g>

          {/* Rueda trasera */}
          <circle cx="34" cy="73" r="14" fill="#1a1a1a" stroke="#0d3a5e" strokeWidth="2"/>
          <circle cx="34" cy="73" r="8" fill="#1d5c8f"/>
          <circle cx="34" cy="73" r="3.5" fill="#0d3a5e"/>
          <line x1="34" y1="64" x2="34" y2="82" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="25" y1="73" x2="43" y2="73" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="28" y1="67" x2="40" y2="79" stroke="#0d3a5e" strokeWidth="1"/>
          <line x1="28" y1="79" x2="40" y2="67" stroke="#0d3a5e" strokeWidth="1"/>

          {/* Rueda delantera */}
          <circle cx="133" cy="73" r="14" fill="#1a1a1a" stroke="#0d3a5e" strokeWidth="2"/>
          <circle cx="133" cy="73" r="8" fill="#1d5c8f"/>
          <circle cx="133" cy="73" r="3.5" fill="#0d3a5e"/>
          <line x1="133" y1="64" x2="133" y2="82" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="124" y1="73" x2="142" y2="73" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="127" y1="67" x2="139" y2="79" stroke="#0d3a5e" strokeWidth="1"/>
          <line x1="127" y1="79" x2="139" y2="67" stroke="#0d3a5e" strokeWidth="1"/>

        </svg>

        {/* Carretera */}
        <div className="cmaq-road"></div>
      </div>

      {texto && <p className="cmaq-texto">{texto}</p>}
    </div>
  );
}
