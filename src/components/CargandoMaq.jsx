import "./CargandoMaq.css";

export default function CargandoMaq({ texto = "Cargando…" }) {
  return (
    <div className="cmaq-loader">
      <div className="cmaq-wrapper">

        {/* Poste de luz que pasa */}
        <svg className="cmaq-lamppost" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="0" width="4" height="70" fill="#2a5298" rx="2"/>
          <rect x="8" y="0" width="22" height="4" fill="#2a5298" rx="2"/>
          <rect x="28" y="0" width="4" height="12" fill="#f5c518" rx="1"/>
        </svg>

        {/* Telehandler SVG en azul */}
        <svg className="cmaq-machine" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">

          {/* Cuerpo principal */}
          <rect x="28" y="32" width="72" height="34" rx="4" fill="#1d5c8f" stroke="#0d3a5e" strokeWidth="1.5"/>

          {/* Cabina */}
          <rect x="72" y="18" width="28" height="28" rx="4" fill="#2a6eb0" stroke="#0d3a5e" strokeWidth="1.5"/>
          {/* Vidrio cabina */}
          <rect x="76" y="22" width="18" height="16" rx="2" fill="#a8d4f5" opacity="0.85"/>
          {/* Detalle cabina */}
          <line x1="85" y1="22" x2="85" y2="38" stroke="#7abde8" strokeWidth="1" opacity="0.5"/>

          {/* Brazo telescópico (base) */}
          <rect x="30" y="24" width="56" height="10" rx="3"
            fill="#1a4f80" stroke="#0d3a5e" strokeWidth="1.5"
            transform="rotate(-20 58 29)"/>

          {/* Brazo telescópico (extensión) */}
          <rect x="60" y="10" width="50" height="8" rx="2.5"
            fill="#2062a0" stroke="#0d3a5e" strokeWidth="1.2"
            transform="rotate(-20 85 14)"/>

          {/* Horquillas */}
          <rect x="134" y="8" width="22" height="3" rx="1" fill="#1a4f80" stroke="#0d3a5e" strokeWidth="1"/>
          <rect x="134" y="14" width="22" height="3" rx="1" fill="#1a4f80" stroke="#0d3a5e" strokeWidth="1"/>
          {/* Soporte horquillas */}
          <rect x="132" y="7" width="5" height="13" rx="1.5" fill="#0d3a5e"/>

          {/* Contrapeso trasero */}
          <rect x="20" y="38" width="14" height="20" rx="3" fill="#164878" stroke="#0d3a5e" strokeWidth="1.5"/>

          {/* Detalles decorativos cuerpo */}
          <rect x="34" y="52" width="14" height="8" rx="2" fill="#2a6eb0" opacity="0.6"/>
          <rect x="52" y="52" width="10" height="8" rx="2" fill="#2a6eb0" opacity="0.4"/>

          {/* Luces delanteras */}
          <rect x="97" y="36" width="5" height="4" rx="1" fill="#f5c518" opacity="0.9"/>

          {/* Rueda trasera */}
          <circle cx="42" cy="68" r="12" fill="#1a1a2e" stroke="#0d3a5e" strokeWidth="2"/>
          <circle cx="42" cy="68" r="7" fill="#1d5c8f"/>
          <circle cx="42" cy="68" r="3" fill="#0d3a5e"/>
          {/* Rayos rueda trasera */}
          <line x1="42" y1="61" x2="42" y2="75" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="35" y1="68" x2="49" y2="68" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="37" y1="63" x2="47" y2="73" stroke="#0d3a5e" strokeWidth="1"/>
          <line x1="37" y1="73" x2="47" y2="63" stroke="#0d3a5e" strokeWidth="1"/>

          {/* Rueda delantera */}
          <circle cx="90" cy="68" r="12" fill="#1a1a2e" stroke="#0d3a5e" strokeWidth="2"/>
          <circle cx="90" cy="68" r="7" fill="#1d5c8f"/>
          <circle cx="90" cy="68" r="3" fill="#0d3a5e"/>
          {/* Rayos rueda delantera */}
          <line x1="90" y1="61" x2="90" y2="75" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="83" y1="68" x2="97" y2="68" stroke="#0d3a5e" strokeWidth="1.5"/>
          <line x1="85" y1="63" x2="95" y2="73" stroke="#0d3a5e" strokeWidth="1"/>
          <line x1="85" y1="73" x2="95" y2="63" stroke="#0d3a5e" strokeWidth="1"/>

        </svg>

        {/* Carretera */}
        <div className="cmaq-road"></div>
      </div>

      {texto && <p className="cmaq-texto">{texto}</p>}
    </div>
  );
}
