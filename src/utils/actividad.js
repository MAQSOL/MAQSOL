import { supabase } from "../supabaseClient";
import { folioVisible } from "./folio";

/*
 * ACTIVIDAD EN VIVO: "Francisco agregó la máquina…", "Kevin registró una carga de diésel…".
 * Se registra sola desde los guardados compartidos (useSharedTable / useListaCompartida /
 * cotizaciones / asistencias); el chat la muestra en su pestaña "Actividad".
 */

let autor = null;   // { uid, nombre } — lo fija AuthContext al cargar el perfil
export const fijarAutorActividad = (a) => { autor = a; };

/** Nombre que la persona se pone en el chat (cuentas compartidas, p. ej. auxiliares con el correo de contacto). */
export const leerSubnombre = () => {
  try { return localStorage.getItem("chat_subnombre") || ""; } catch { return ""; }
};
export const guardarSubnombre = (v) => {
  try { localStorage.setItem("chat_subnombre", v.trim()); } catch { /* sin almacenamiento */ }
};
/** Quién hizo algo: el subnombre si lo puso, si no el nombre de la cuenta. */
export const quienSoy = () => leerSubnombre() || autor?.nombre || "Alguien";

const unir = (...p) => p.filter(Boolean).join(" ");

const OBJETO = {
  equipos_internos: (d) => `la máquina ${unir(d.tipo, d.marca, d.modelo) || "sin nombre"}`,
  equipos_externos: (d) => `el equipo subarrendado ${unir(d.tipo, d.marca, d.modelo) || "sin nombre"}`,
  diesel_cargas: (d) => `una carga de diésel${d.litros ? ` de ${d.litros} L` : ""}${d.maquina ? ` a ${d.maquina}` : ""}`,
  fletes: (d) => `el flete ${d.folio || ""}`.trim(),
  checklists: (d) => `el checklist ${folioVisible(d.folio)}${d.tipo ? ` (${d.tipo})` : ""}`,
  clientes: (d) => `al cliente ${d.cliente || ""}`.trim(),
  tareas: (d) => `la tarea "${d.titulo || d.descripcion || ""}"`,
  pendientes: (d) => `el pendiente "${d.texto || ""}"`,
  alquileres: (d) => `la renta de ${d.equipoLabel || d.equipo || d.tipo || "un equipo"}${d.cliente ? ` a ${d.cliente}` : ""}`,
  contratos: (d) => `el contrato ${d.folio || ""}`.trim(),
  ordenes_compra: (d) => `la orden de compra${d.folio ? " OC-" + String(d.folio).padStart(3, "0") : ""}${d.proveedor ? ` a ${d.proveedor}` : ""}`,
  horas_maquina: (d) => `horas de ${d.equipoLabel || "una máquina"}`,
  lista_precios: (d) => `el precio de ${d.concepto || "un concepto"}`,
  colaboradores: (d) => `al colaborador ${d.nombre || ""}`.trim(),
  personal: () => "un expediente de personal",
  personal_externo: (d) => `al practicante ${d.nombre || ""}`.trim(),
  asistencias: (d) => `la asistencia${d.semana ? ` de la semana ${d.semana}` : ""}`,
  cotizaciones: (d) => `una cotización${d.tipo ? ` de ${d.tipo}` : ""}${d.folio ? ` ${d.folio}` : ""}${d.cliente ? ` para ${d.cliente}` : ""}`
};
const VERBO_AGREGAR = { diesel_cargas: "registró", fletes: "registró", checklists: "registró", horas_maquina: "registró", ordenes_compra: "creó", tareas: "creó", contratos: "guardó", cotizaciones: "hizo", asistencias: "capturó" };
const VERBO = { agregar: "agregó", editar: "actualizó", eliminar: "eliminó" };
const IGNORAR = new Set(["catalogos", "configuracion", "chat_mensajes", "actividad", "perfiles"]);

// las ediciones seguidas del mismo registro (ej. ir llenando una ficha) se cuentan una vez cada 2 min
const recientes = new Map();

/** accion: "agregar" | "editar" | "eliminar". No truena nunca: si la tabla aún no existe, se ignora. */
export function registrarActividad(tabla, accion, datos = {}, id = "") {
  if (!autor || IGNORAR.has(tabla)) return;
  const clave = `${tabla}|${id}|${accion}`;
  const ahora = Date.now();
  if (accion !== "agregar" && ahora - (recientes.get(clave) || 0) < 120000) return;
  recientes.set(clave, ahora);
  const verbo = accion === "agregar" ? VERBO_AGREGAR[tabla] || VERBO.agregar : VERBO[accion] || accion;
  const objeto = (OBJETO[tabla] || (() => `un registro de ${tabla.replace(/_/g, " ")}`))(datos || {});
  supabase
    .from("actividad")
    .insert({ autor: autor.uid, autor_nombre: quienSoy(), tabla, accion, descripcion: `${quienSoy()} ${verbo} ${objeto}` })
    .then(() => {}, () => {});
}
