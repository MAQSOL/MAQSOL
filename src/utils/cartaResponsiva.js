// Carta responsiva de resguardo de equipo para operadores de maquinaria.
// Mismo estilo que el resto de los PDF del sistema (rojo y negro, ver pdfFormato.js).
import { abrirDocPDF, encabezadoDoc, pieDoc, esc, EMPRESA } from "./pdfFormato";

export const CARTA_NUEVA = {
  personaId: "",
  nombre: "",
  curp: "",
  ine: "",
  cargo: "Operador de maquinaria",
  equipo: "",
  marca: "",
  modelo: "",
  serie: "",
  horometro: "",
  llaves: "1",
  fecha: "",
  lugar: "Cancún, Quintana Roo",
  entrega: "",
};

const fechaLarga = (iso) => {
  const d = iso ? new Date(iso + "T00:00:00") : new Date();
  if (isNaN(d)) return "";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
};

const palabrasLlaves = (n) => {
  const v = parseInt(n, 10);
  if (!v) return "la llave";
  const letras = { 1: "una", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco" }[v] || String(v);
  return v === 1 ? "la llave del equipo (" + letras + ")" : "las llaves del equipo (" + letras + ")";
};

const CSS = `
  .doc{font-size:12.5px;line-height:1.55;color:#222}
  .doc h2.titulo{text-align:center;font-size:17px;letter-spacing:1px;margin:6px 0 14px;color:#111}
  .doc .lugar{text-align:right;margin-bottom:12px}
  .doc p{margin:0 0 10px;text-align:justify}
  .doc table.datos{margin:6px 0 14px}
  .doc table.datos td{border:1px solid #d9d9d9;padding:6px 9px}
  .doc table.datos td.k{background:#f2f2f2;font-weight:700;width:26%;font-size:11px;letter-spacing:.4px;text-transform:uppercase}
  .doc ol{margin:0 0 12px;padding-left:20px}
  .doc ol li{margin-bottom:9px;text-align:justify}
  .doc .ok{border-left:3px solid #d6001c;background:#fafafa;padding:8px 12px;margin:0 0 14px}
  .firmas{display:grid;grid-template-columns:1fr 1fr;gap:46px;margin-top:64px}
  .firma{text-align:center;font-size:11.5px}
  .firma .linea{border-top:1.5px solid #111;padding-top:6px;min-height:44px}
  .firma small{display:block;color:#666;font-size:10px;margin-top:2px}
`;

export function abrirCartaResponsiva(d) {
  const nombre = (d.nombre || "").trim() || "________________________________";
  const curp = (d.curp || "").trim().toUpperCase() || "__________________";
  const ine = (d.ine || "").trim() || "__________________";
  const equipo = [d.equipo, d.marca, d.modelo].filter(Boolean).join(" ") || "________________";
  const llaves = palabrasLlaves(d.llaves);
  const fila = (k, v) => `<tr><td class="k">${k}</td><td>${esc(v || "—")}</td></tr>`;

  const cuerpo = `
    ${encabezadoDoc("Carta responsiva de equipo", [EMPRESA, "Resguardo de maquinaria a operador"])}
    <div class="doc">
      <h2 class="titulo">CARTA RESPONSIVA</h2>
      <div class="lugar">${esc(d.lugar || "")}, a ${esc(fechaLarga(d.fecha))}.</div>

      <p>Yo, <b>${esc(nombre)}</b>, con CURP <b>${esc(curp)}</b> y credencial para votar (INE) número
      <b>${esc(ine)}</b>, con cargo de <b>${esc(d.cargo || "Operador de maquinaria")}</b> en
      <b>${esc(EMPRESA)}</b> (en adelante, MAQSOL), hago constar y me comprometo a lo siguiente:</p>

      <table class="datos">
        ${fila("Equipo", equipo)}
        ${fila("Serie", d.serie)}
        ${fila("Horómetro al recibir", d.horometro)}
        ${fila("Llaves entregadas", String(d.llaves || "1"))}
      </table>

      <ol>
        <li>Recibo de MAQSOL el equipo descrito, junto con ${esc(llaves)}, <b>en buenas condiciones de funcionamiento y presentación</b>, a mi entera satisfacción.</li>
        <li>Me obligo a <b>cuidar el equipo y su llave</b>, a operarlo conforme a las indicaciones de MAQSOL y a las instrucciones del fabricante, únicamente para el trabajo que se me asigne, y a no prestarlo ni permitir que lo opere una persona no autorizada.</li>
        <li>En caso de <b>pérdida de la llave, robo o daños ocasionados por mala operación, negligencia, descuido o uso indebido</b>, autorizo a MAQSOL a descontar de mi nómina el costo de la reparación o reposición correspondiente, en los términos y con los límites que permite la ley.</li>
        <li>Los daños o desgaste <b>originados por el paso del tiempo, el uso normal o la vida útil del equipo</b> no me serán cobrados.</li>
        <li>Me comprometo a <b>reportar de inmediato</b> a MAQSOL cualquier falla, golpe, fuga, accidente o anomalía que detecte en el equipo.</li>
        <li>Devolveré el equipo y su llave a MAQSOL cuando se me solicite o al concluir el trabajo asignado.</li>
      </ol>

      <div class="ok">Leído y conforme, firmo de enterado de las obligaciones anteriores.</div>

      <div class="firmas">
        <div class="firma"><div class="linea">${esc(nombre)}</div>Operador que recibe<small>CURP: ${esc(curp)} · INE: ${esc(ine)}</small></div>
        <div class="firma"><div class="linea">${esc(d.entrega || "")}</div>Entrega por MAQSOL<small>${esc(EMPRESA)}</small></div>
      </div>
    </div>
    ${pieDoc("Carta responsiva")}`;

  const archivo = "CARTA-RESPONSIVA-" + (d.nombre || "OPERADOR").toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  abrirDocPDF({ nombre: archivo, cuerpo, hoja: "vertical", css: CSS });
}
