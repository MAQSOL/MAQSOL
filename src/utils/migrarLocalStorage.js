import { supabase } from "../supabaseClient";

/**
 * Botón de un solo uso: sube lo que ya estaba guardado en ESTE navegador
 * (localStorage) a la base de datos compartida, para no perder lo capturado
 * antes de la migración. Solo debe correrlo un admin, una vez.
 */
const TABLAS = [
  { key: "equiposInternos", tabla: "equipos_internos" },
  { key: "equiposExternos", tabla: "equipos_externos" },
  { key: "fletesMaqsol", tabla: "fletes" },
  { key: "checklistsEntregaSalida", tabla: "checklists" },
  { key: "colaboradoresMaqsol", tabla: "colaboradores" },
  { key: "clientesGuardados", tabla: "clientes" }
];

const CATALOGOS = [
  { key: "operadoresMaqsol", tipo: "operadores" },
  { key: "ubicacionesMaqsol", tipo: "ubicaciones" },
  { key: "tiposEquipoInterno", tipo: "tipos_equipo" },
  { key: "proveedoresExternos", tipo: "proveedores" },
  { key: "empresasFleteMaqsol", tipo: "empresas_flete" },
  { key: "unidadesFleteros", tipo: "unidades" }
];

export async function migrarLocalStorage(userEmail, userId) {
  const resumen = [];

  for (const { key, tabla } of TABLAS) {
    try {
      const lista = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(lista) || lista.length === 0) continue;
      const filas = lista
        .filter((x) => x && x.id)
        .map((x) => ({ id: String(x.id), data: x, updated_at: new Date().toISOString() }));
      if (filas.length === 0) continue;
      const { error } = await supabase.from(tabla).upsert(filas);
      resumen.push(`${tabla}: ${error ? "ERROR " + error.message : filas.length + " registros"}`);
    } catch (e) {
      resumen.push(`${tabla}: error leyendo localStorage (${e.message})`);
    }
  }

  for (const { key, tipo } of CATALOGOS) {
    try {
      const lista = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(lista) || lista.length === 0) continue;
      const filas = lista.filter(Boolean).map((valor) => ({ tipo, valor: String(valor) }));
      if (filas.length === 0) continue;
      const { error } = await supabase.from("catalogos").upsert(filas);
      resumen.push(`catálogo ${tipo}: ${error ? "ERROR " + error.message : filas.length + " valores"}`);
    } catch (e) {
      resumen.push(`catálogo ${tipo}: error (${e.message})`);
    }
  }

  // asistencias: objeto { "2026-S38": { colaboradorId: {...} } } -> una fila por semana
  try {
    const asistencias = JSON.parse(localStorage.getItem("asistenciasSemanales") || "{}");
    const claves = Object.keys(asistencias || {});
    if (claves.length) {
      const filas = claves.map((clave) => ({
        id: clave,
        data: asistencias[clave],
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from("asistencias").upsert(filas);
      resumen.push(`asistencias: ${error ? "ERROR " + error.message : filas.length + " semanas"}`);
    }
  } catch (e) {
    resumen.push("asistencias: error (" + e.message + ")");
  }

  // pendientes del dashboard
  try {
    const pendientes = JSON.parse(localStorage.getItem("pendientes") || "[]");
    if (Array.isArray(pendientes) && pendientes.length) {
      const filas = pendientes.map((p, i) => ({
        id: "p" + (p.id || Date.now() + i),
        data: p,
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from("pendientes").upsert(filas);
      resumen.push(`pendientes: ${error ? "ERROR " + error.message : filas.length + " registros"}`);
    }
  } catch (e) {
    resumen.push("pendientes: error (" + e.message + ")");
  }

  // cotizaciones (venta/renta/refaccion), con dueño = quien migra
  const COTIZACIONES = [
    { key: "cotizacionesVentas", tipo: "venta" },
    { key: "cotizacionesRentas", tipo: "renta" },
    { key: "cotizacionesRefacciones", tipo: "refaccion" }
  ];
  for (const { key, tipo } of COTIZACIONES) {
    try {
      const lista = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(lista) || lista.length === 0) continue;
      const filas = lista
        .filter((x) => x && x.id)
        .map((x) => ({
          id: "cot-" + tipo + "-" + x.id,
          tipo,
          data: x,
          created_by: userId,
          created_by_email: userEmail,
          updated_at: new Date().toISOString()
        }));
      if (filas.length === 0) continue;
      const { error } = await supabase.from("cotizaciones").upsert(filas);
      resumen.push(`cotizaciones (${tipo}): ${error ? "ERROR " + error.message : filas.length + " registros"}`);
    } catch (e) {
      resumen.push(`cotizaciones (${tipo}): error (${e.message})`);
    }
  }

  return resumen;
}
