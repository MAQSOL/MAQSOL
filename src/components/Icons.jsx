// Íconos de línea simples (sin emojis), heredan color por currentColor.
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function IconoCampana(props) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function IconoPortapapeles(props) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="3" width="10" height="4" rx="1" />
      <path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

export function IconoBarras(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function IconoPersonas(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16.5 6.5a3 3 0 0 1 0 5.9" />
      <path d="M21 20c0-2.8-2-5.1-4.7-5.8" />
    </svg>
  );
}

export function IconoEquipo(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="9" width="13" height="8" rx="1" />
      <path d="M15 12h4l3 2.5V17h-7" />
      <circle cx="6.5" cy="18.5" r="1.6" />
      <circle cx="16.5" cy="18.5" r="1.6" />
    </svg>
  );
}

export function IconoClientes(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}

export function IconoLlaves(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l9 9M16 16l3-3M19 19l2-2" />
    </svg>
  );
}

export function IconoLlave(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.6 12.4 19 4l2 2-2 2 1.5 1.5L18 12l-2-2-3.6 3.6" />
    </svg>
  );
}
