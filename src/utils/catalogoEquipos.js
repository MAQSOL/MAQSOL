// Catálogos de arranque para llenar rápido el checklist. Lo que se capture a mano
// se aprende solo: las opciones también salen de los equipos y checklists ya guardados.

export const TIPOS_EQUIPO = [
  "Manipulador telescópico",
  "Plataforma de tijera",
  "Plataforma articulada",
  "Plataforma telescópica",
  "Minicargador",
  "Retroexcavadora",
  "Montacargas",
  "Cargador frontal",
  "Excavadora",
  "Torre de iluminación",
  "Generador",
  "Compresor"
];

// tipo -> marca -> modelos
export const CATALOGO_EQUIPOS = {
  "Manipulador telescópico": {
    Genie: ["636", "844", "1056", "1256"],
    Dieci: ["Icarus 40.17", "Pegasus 40.17", "Apollo 25.6"],
    Manitou: ["MT 625", "MT 1030", "MT 1840"],
    Haulotte: ["HTL 3010", "HTL 4014"],
    JCB: ["525-60", "535-95", "540-140"],
    Caterpillar: ["TH255C", "TH407C"]
  },
  "Plataforma de tijera": {
    Genie: ["GS-1930", "GS-2046", "GS-2646", "GS-3246", "GS-4047"],
    JLG: ["1930ES", "2030ES", "2646ES", "3246ES", "4045R"],
    Zoomlion: ["ZS0607DC", "ZS0808DC", "ZS1012DC", "ZS1212DC"]
  },
  "Plataforma articulada": {
    Genie: ["Z-45/25", "Z-60/34", "Z-62/40"],
    JLG: ["450AJ", "600AJ", "800AJ"],
    Haulotte: ["HA 15 IP", "HA 16 PX"],
    Zoomlion: []
  },
  "Plataforma telescópica": {
    Genie: ["S-40", "S-60", "S-65", "S-85"],
    JLG: ["460SJ", "600S", "660SJ", "860SJ"]
  },
  Retroexcavadora: {
    Caterpillar: ["416F", "420F", "420F2", "430F2"],
    "John Deere": ["310L", "310SL", "410L"],
    Case: ["580N", "580 Super N"],
    JCB: ["3CX", "4CX"],
    Terex: ["TLB840"]
  },
  Minicargador: {
    Bobcat: ["S510", "S570", "S650", "S750"],
    Caterpillar: ["236D3", "246D3", "262D3"],
    Case: ["SR175", "SR210", "SV280"]
  },
  Montacargas: {
    Toyota: [],
    Hyster: [],
    Yale: [],
    Clark: [],
    Caterpillar: []
  },
  "Cargador frontal": { Caterpillar: [], "John Deere": [], Case: [] },
  Excavadora: { Caterpillar: [], "John Deere": [], Komatsu: [], Case: [] },
  "Torre de iluminación": {},
  Generador: {},
  Compresor: {}
};

export const ACCESORIOS = ["Canastilla", "Horquillas", "Jib", "Plumín", "Gancho", "Cucharón", "Pala", "Martillo hidráulico", "Pinzas"];

export const UBICACIONES_BASE = [
  "Patio MAQSOL",
  "Taller",
  "En tránsito",
  "Cancún",
  "Playa del Carmen",
  "Puerto Morelos",
  "Tulum",
  "Cozumel",
  "Bacalar",
  "Chetumal",
  "Mérida"
];

/** Une listas sin repetir (ignora mayúsculas y acentos) y conserva la primera forma escrita. */
export function unir(...listas) {
  const visto = new Set();
  const salida = [];
  listas.flat().forEach((t) => {
    const x = String(t == null ? "" : t).trim();
    if (!x) return;
    const k = x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (visto.has(k)) return;
    visto.add(k);
    salida.push(x);
  });
  return salida;
}

export function marcasDe(tipo) {
  if (tipo && CATALOGO_EQUIPOS[tipo]) return Object.keys(CATALOGO_EQUIPOS[tipo]);
  return unir(Object.values(CATALOGO_EQUIPOS).flatMap((m) => Object.keys(m)));
}

export function modelosDe(tipo, marca) {
  const m = String(marca || "").toLowerCase();
  const tipos = tipo && CATALOGO_EQUIPOS[tipo] ? [tipo] : Object.keys(CATALOGO_EQUIPOS);
  return unir(
    tipos.flatMap((t) =>
      Object.entries(CATALOGO_EQUIPOS[t])
        .filter(([marcaCat]) => !m || marcaCat.toLowerCase() === m)
        .flatMap(([, modelos]) => modelos)
    )
  );
}
