/*
 * Tipografías retro de las cotizaciones (Renta y Venta) para jsPDF:
 *  - "space": Space Mono (COTIZACIÓN y encabezados de tabla)
 *  - "plex":  IBM Plex Mono (texto y datos)
 *  - "rubik": Rubik Mono One (el título MAQSOL)
 * Los .ttf (licencia OFL) se cargan aparte, solo al generar el PDF, para no
 * hacer más pesada la página.
 */
let cache = null;

async function cargar() {
  if (!cache) {
    cache = Promise.all([
      import("../assets/fonts/SpaceMono-Regular.ttf?inline"),
      import("../assets/fonts/SpaceMono-Bold.ttf?inline"),
      import("../assets/fonts/IBMPlexMono-Regular.ttf?inline"),
      import("../assets/fonts/IBMPlexMono-SemiBold.ttf?inline"),
      import("../assets/fonts/RubikMonoOne-Regular.ttf?inline"),
    ]).then((ms) => ms.map((m) => String(m.default).split(",")[1]));
    cache.catch(() => { cache = null; });
  }
  return cache;
}

/** Registra las fuentes en el documento. Si fallan, el PDF sale en Courier. */
export async function registrarFuentesPDF(doc) {
  try {
    const [sr, sb, pr, pb, rk] = await cargar();
    const add = (archivo, datos, nombre, estilo) => {
      doc.addFileToVFS(archivo, datos);
      doc.addFont(archivo, nombre, estilo);
    };
    add("SpaceMono-Regular.ttf", sr, "space", "normal");
    add("SpaceMono-Bold.ttf", sb, "space", "bold");
    add("IBMPlexMono-Regular.ttf", pr, "plex", "normal");
    add("IBMPlexMono-SemiBold.ttf", pb, "plex", "bold");
    add("RubikMonoOne-Regular.ttf", rk, "rubik", "normal");
    return true;
  } catch (e) {
    console.warn("No se cargaron las fuentes del PDF, se usa Courier", e);
    const setFont = doc.setFont.bind(doc);
    doc.setFont = (nombre, estilo) => setFont(nombre === "space" || nombre === "plex" || nombre === "rubik" ? "courier" : nombre, estilo);
    return false;
  }
}
