import { LOGO_MAQSOL_TRANSPARENTE, LOGO_MAQSOL_TRANSPARENTE_RELACION } from "./logoMaqsolTransparente";

const ROJO = "#d6001c";
const NIVELES = [["electrica", "ELECTRICA", 2], ["1/4", "1/4", 1], ["1/2", "1/2", 1], ["3/4", "3/4", 1], ["full", "FULL", 1]];

const esc = (t) => String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fF = (f) => {
  if (!f) return "";
  const d = new Date(f + "T00:00:00");
  return isNaN(d) ? "" : d.toLocaleDateString("es-MX");
};
const titulo = (r) => `ENTREGA Y SALIDA DE EQUIPO · ${(r.tipo || "Salida").toUpperCase()}${r.ligadoA ? " · LIGADO A " + r.ligadoA : ""}`;

/** Documento HTML completo (una hoja carta horizontal) con el formato de Entrega y Salida de Equipo. */
export function htmlChecklist(r, cols) {
  const v = (t) => {
    const x = esc(t).trim();
    return x || "&nbsp;";
  };
  const td = (cls, span, html, extra = "") => `<td class="${cls}" colspan="${span}"${extra}>${html}</td>`;
  const L = (txt, span) => td("lbl", span, txt);
  const V = (txt, span) => td("val", span, v(txt));

  const nivel = (r.nivelCombustible || "").toLowerCase();
  const nivelCeldas = NIVELES.map(([k, txt, sp]) => td("opt" + (nivel === k ? " sel" : ""), sp, txt)).join("");

  const t1 = `
    <table class="t">
      <colgroup>${'<col style="width:4.1667%">'.repeat(24)}</colgroup>
      <tr style="height:11mm">
        <td class="logo" colspan="4" rowspan="8"><img src="${LOGO_MAQSOL_TRANSPARENTE}" alt=""/></td>
        <td class="titulo" colspan="16">MAQUINARIA SOPORTE Y LOGISTICA SA DE CV</td>
        <td class="folio" colspan="4" rowspan="4"><div class="fl">FOLIO</div><div class="fv">${v(r.folio)}</div></td>
      </tr>
      <tr style="height:5.2mm">${td("sub", 16, esc(titulo(r)))}</tr>
      <tr>${L("CLIENTE", 2)}${V(r.cliente, 14)}</tr>
      <tr>${L("FECHA", 2)}${V(fF(r.fecha), 4)}${L("HORA", 2)}${V(r.hora, 2)}${L("NÚMERO DE ORDEN DE COMPRA", 3)}${V(r.ordenCompra, 3)}</tr>
      <tr>${L("EQUIPO", 2)}${V(r.equipo, 5)}${L("NIVEL COMBUSTIBLE", 3)}${nivelCeldas}${L("HORÓMETRO", 2)}${V(r.horometro, 2)}</tr>
      <tr>${L("MARCA", 2)}${V(r.marca, 5)}${L("MODELO", 2)}${V(r.modelo, 4)}${L("SERIE", 2)}${V(r.serie, 5)}</tr>
      <tr>${L("ACCESORIO", 2)}${V(r.accesorio, 3)}${L("MARCA", 1)}${V(r.accMarca, 3)}${L("MODELO ACC.", 2)}${V(r.accModelo, 2)}${L("SERIE", 1)}${V(r.accSerie, 2)}${L("FLETE", 1)}${V(r.flete, 3)}</tr>
      <tr>${L("NOMBRE CONTACTO", 3)}${V(r.nombreContacto, 6)}${L("TELÉFONO", 2)}${V(r.telefono, 3)}${L("CORREO", 2)}${V(r.correo, 4)}</tr>
      <tr class="alto">${L("UBICACIÓN", 4)}${L("HORA EN QUE SE ENTREGA", 2)}${L("FECHA DE ENTREGA", 3)}${L("FECHA DE RETIRO", 3)}${L("HORA DE RETIRO", 2)}${L("HORÓMETRO RETIRO", 2)}${L("NOMBRE DE QUIEN ENTREGA EL EQUIPO", 4)}${L("NOMBRE DE QUIEN RECIBE EL EQUIPO", 4)}</tr>
      <tr class="alto">${V(r.ubicacion, 4)}${V(r.horaEntrega, 2)}${V(fF(r.fechaEntrega), 3)}${V(fF(r.fechaRetiro), 3)}${V(r.horaRetiro, 2)}${V(r.horometroRetiro, 2)}${V(r.quienEntrega, 4)}${V(r.quienRecibe, 4)}</tr>
    </table>`;

  const filas = [];
  for (let i = 0; i < 7; i++) {
    let tr = "<tr>";
    cols.forEach((col) => {
      const it = col[i];
      if (!it) {
        tr += '<td class="nom"></td><td class="mk"></td><td class="mk"></td><td class="mk"></td>';
        return;
      }
      const val = (r.items && r.items[it.n]) || "";
      const pct = it.pct && r.porcentajes && r.porcentajes[it.n] ? `<b class="pct">${esc(r.porcentajes[it.n])}%</b>` : "";
      tr += `<td class="nom"><div class="nm"><span>${esc(it.n)}</span>${pct}</div></td>`;
      if (it.siNo) {
        tr += `<td class="mk sn${val === "SI" ? " on si" : ""}">SI</td><td class="mk sn${val === "NO" ? " on no" : ""}">NO</td><td class="mk gris"></td>`;
      } else {
        tr += ["B", "R", "M"].map((k) => `<td class="mk m${k}${val === k ? " on" : ""}">${val === k ? "X" : ""}</td>`).join("");
      }
    });
    filas.push(tr + "</tr>");
  }
  const cabGrupo = '<td class="hn">CONCEPTO</td><td class="hb">B</td><td class="hr">R</td><td class="hm">M</td>';
  const t2 = `
    <table class="t chk">
      <colgroup>${'<col style="width:17.2%"><col style="width:2.6%"><col style="width:2.6%"><col style="width:2.6%">'.repeat(4)}</colgroup>
      <tr class="leg"><td colspan="16">CHECKLIST DE CONDICIÓN DEL EQUIPO &nbsp;—&nbsp; <b>B</b>: BUENO &nbsp; <b>R</b>: REGULAR &nbsp; <b>M</b>: MALO &nbsp;·&nbsp; la <b>X</b> marca el estado del componente</td></tr>
      <tr class="cabs">${cabGrupo.repeat(4)}</tr>
      ${filas.join("")}
    </table>`;

  const dfirma = (nombre) => (nombre ? `<span class="pn">${esc(nombre)}</span>` : '<span class="pn hint">Nombre y firma</span>');
  const t3 = `
    <table class="t">
      <colgroup>${'<col style="width:4.1667%">'.repeat(24)}</colgroup>
      <tr class="serv">${L("SERVICIO DE PRE-ENTREGA", 3)}${L("FECHA", 1)}${V(r.servPreNA ? "N/A" : fF(r.servPreEntregaFecha), 3)}${L("HORÓMETRO", 2)}${V(r.servPreNA ? "N/A" : r.servPreEntregaHorometro, 3)}${L("PRÓXIMO SERVICIO", 3)}${L("FECHA", 1)}${V(r.proxServNA ? "N/A" : fF(r.proximoServicioFecha), 3)}${L("HORÓMETRO", 2)}${V(r.proxServNA ? "N/A" : r.proximoServicioHorometro, 3)}</tr>
      <tr class="rep">${L("REPARACIONES POR DAÑOS A CONSIDERAR", 4)}${td("txt", 17, v(r.reparaciones))}${td("fe", 3, `<div class="fet">FIRMA DE ENTERADO Y CONFORMIDAD DE LA PERSONA ENCARGADA DEL EQUIPO</div>${r.firmaEnterado ? `<div class="fen">${esc(r.firmaEnterado)}</div>` : ""}`)}</tr>
      <tr class="obs">${L("OBSERVACIONES / USO EN OBRA", 4)}${td("txt", 20, v(r.observaciones))}</tr>
      <tr class="sh">${L("RECIBE EL EQUIPO", 5)}${L("ENTREGA / RETIRA EL EQUIPO", 5)}${L("RETIRA EL EQUIPO (CLIENTE)", 7)}${L("Vo. Bo.", 7)}</tr>
      <tr class="ss">${td("sc", 5, "CLIENTE: " + esc(r.cliente || ""))}${td("sc", 5, "MAQUINARIA SOPORTE Y LOGISTICA")}${td("sc", 7, "CLIENTE: " + esc(r.cliente || ""))}${td("sc", 7, "MAQUINARIA SOPORTE Y LOGISTICA SA DE CV")}</tr>
      <tr class="sf">${td("firmab", 5, "&nbsp;")}${td("firmab", 5, "&nbsp;")}${td("firmab", 7, "&nbsp;")}${td("firmab", 7, "&nbsp;")}</tr>
      <tr class="sp">${td("pie", 5, dfirma(r.recibeCliente || r.quienRecibe))}${td("pie", 5, dfirma(r.quienEntrega))}${td("pie", 7, dfirma(r.retiraCliente))}${td("pie", 7, '<span class="pn">LIC. FRANCISCO TORRES MORALES</span>')}</tr>
    </table>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Entrega y Salida ${esc(r.folio)}</title>
  <style>
    @page{size:letter landscape;margin:0;}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    html,body{margin:0;padding:0;background:#fff;}
    body{font-family:Arial,Helvetica,sans-serif;color:#111;}
    #probe{position:absolute;visibility:hidden;width:0;height:202mm;}
    #hoja{width:263mm;margin:7mm auto 0;}
    table.t{width:100%;table-layout:fixed;border-collapse:collapse;border:1.5px solid #000;margin-top:-1.5px;}
    table.t td{border:.6px solid #000;padding:1px 3px;vertical-align:middle;overflow:hidden;}
    .lbl{background:#d9d9d9;font-size:6.1px;font-weight:700;text-transform:uppercase;text-align:center;line-height:1.1;}
    .val{font-size:8.8px;font-weight:700;text-align:left;padding-left:5px;line-height:1.15;word-break:break-word;}
    tr{height:5.4mm;}
    tr.alto{height:8.4mm;}
    .logo{text-align:center;padding:1mm;}
    .logo img{max-width:100%;max-height:42mm;}
    .titulo{font-family:Cambria,"Times New Roman",Times,serif;font-weight:700;font-size:21px;color:${ROJO};text-align:center;letter-spacing:.2px;}
    .sub{font-size:7.4px;font-weight:700;text-align:center;letter-spacing:.4px;}
    .folio{background:#d9d9d9;text-align:center;}
    .folio .fl{font-family:Cambria,"Times New Roman",serif;font-size:14px;font-weight:700;}
    .folio .fv{font-size:11.5px;font-weight:700;margin-top:3px;color:#000;word-break:break-all;}
    .opt{font-size:6.8px;text-align:center;font-weight:700;}
    .opt.sel{background:#222;color:#fff;}
    table.chk{margin-top:-1.5px;}
    .leg td{background:#efefef;font-size:6.4px;letter-spacing:.3px;padding:2px 6px;height:4.2mm;}
    .cabs{height:4.6mm;}
    .cabs td{font-size:6.4px;font-weight:800;text-align:center;}
    .hn{background:#d9d9d9;}
    .hb{background:#92d050;}
    .hr{background:#ffff00;}
    .hm{background:#ff6b6b;}
    table.chk tr{height:5.5mm;}
    .nom{font-size:6.5px;text-transform:uppercase;line-height:1.1;padding:0 4px;}
    .nm{display:flex;justify-content:space-between;align-items:center;gap:4px;}
    .pct{font-size:7px;white-space:nowrap;}
    .mk{text-align:center;font-weight:800;font-size:9px;padding:0;}
    .mk.on.mB{background:#d9f0c2;}
    .mk.on.mR{background:#fff8bf;}
    .mk.on.mM{background:#ffd3d3;}
    .mk.sn{font-size:6.2px;color:#8a8a8a;font-weight:700;}
    .mk.sn.on.si{background:#d9f0c2;color:#111;}
    .mk.sn.on.no{background:#ffd3d3;color:#111;}
    .mk.gris{background:#efefef;}
    tr.serv{height:7.2mm;}
    tr.rep{height:18mm;}
    tr.obs{height:12mm;}
    .txt{font-size:8.6px;font-weight:400;white-space:pre-wrap;vertical-align:top;padding:3px 6px;line-height:1.3;}
    .fe{vertical-align:top;text-align:center;padding:2px 3px;}
    .fet{font-size:5.4px;font-weight:800;line-height:1.2;}
    .fen{font-size:7.4px;font-weight:700;margin-top:7mm;}
    tr.sh,tr.ss,tr.sp{height:5mm;}
    tr.sf{height:20mm;}
    .sc{font-size:6.6px;text-align:center;font-weight:700;}
    .firmab{background:#fff;}
    .pie{background:#d9d9d9;text-align:center;}
    .pn{font-size:7.2px;font-weight:700;}
    .pn.hint{color:#8a8a8a;font-weight:400;font-style:italic;}
    .rojo{height:1.1mm;background:#e30613;margin-top:0;}
    .pie-doc{margin-top:3px;text-align:center;font-size:6px;color:#999;letter-spacing:.4px;}
  </style></head>
  <body>
    <div id="probe"></div>
    <div id="hoja">
      ${t1}
      ${t2}
      ${t3}
      <div class="rojo"></div>
      <div class="pie-doc">Documento generado desde MAQSISTEM · ${esc(r.folio)}</div>
    </div>
    <script>
      window.onload=function(){
        var hoja=document.getElementById('hoja');
        var maximo=document.getElementById('probe').offsetHeight;
        var h=hoja.offsetHeight+26;
        if(h>maximo){hoja.style.zoom=(maximo/h).toFixed(3);}
        setTimeout(function(){window.print()},350);
      }
    </script>
  </body></html>`;
}

/** Abre la ventana de impresión con el formato (sin pie "about:blank"). */
export function abrirChecklistPDF(r, cols) {
  const ventana = window.open("", "_blank");
  if (!ventana) {
    alert("El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.");
    return;
  }
  ventana.document.write(htmlChecklist(r, cols));
  ventana.document.close();
}

/** Excel (.xlsx) con la misma estructura del formato: celdas combinadas, logo, B/R/M de colores y firmas. */
export async function descargarChecklistExcel(r, cols, nombreArchivo) {
  try {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "MAQSISTEM";
    const ws = wb.addWorksheet("Entrega y Salida", {
      views: [{ showGridLines: false }],
      pageSetup: {
        orientation: "landscape", paperSize: 1, fitToPage: true, fitToWidth: 1, fitToHeight: 1,
        horizontalCentered: true, margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      }
    });
    ws.columns = Array.from({ length: 24 }, () => ({ width: 6.2 }));

    const NEGRO = { style: "thin", color: { argb: "FF000000" } };
    const BORDE = { top: NEGRO, left: NEGRO, bottom: NEGRO, right: NEGRO };
    const GRIS = "FFD9D9D9";
    const rojoArgb = "FFD6001C";
    const txt = (t) => (t === null || t === undefined ? "" : String(t));

    const caja = (r1, c1, r2, c2, valor, est = {}) => {
      if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
      for (let rr = r1; rr <= r2; rr++) {
        for (let cc = c1; cc <= c2; cc++) {
          const cell = ws.getCell(rr, cc);
          cell.border = BORDE;
          if (est.fondo) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: est.fondo } };
        }
      }
      const m = ws.getCell(r1, c1);
      m.value = valor === "" || valor === undefined ? null : valor;
      m.font = { name: est.fuente || "Calibri", size: est.tam || 9, bold: !!est.negrita, italic: !!est.italica, color: { argb: est.color || "FF111111" } };
      m.alignment = { vertical: est.v || "middle", horizontal: est.h || "left", wrapText: true, indent: est.h === "left" || !est.h ? 1 : 0 };
    };
    const etq = (r1, c1, c2, t, r2) => caja(r1, c1, r2 || r1, c2, t, { fondo: GRIS, negrita: true, tam: 7, h: "center" });
    const val = (r1, c1, c2, t, est = {}) => caja(r1, c1, r1, c2, txt(t), { negrita: true, tam: 9.5, ...est });
    const fF = (f) => {
      if (!f) return "";
      const d = new Date(f + "T00:00:00");
      return isNaN(d) ? "" : d.toLocaleDateString("es-MX");
    };
    const alto = (fila, mm) => (ws.getRow(fila).height = Math.round(mm * 2.835));

    // ---- Encabezado ----
    caja(1, 1, 8, 4, "", {});
    caja(1, 5, 1, 20, "MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", { fuente: "Cambria", tam: 20, negrita: true, color: rojoArgb, h: "center" });
    caja(1, 21, 4, 24, {
      richText: [
        { text: "FOLIO\n", font: { name: "Cambria", size: 14, bold: true } },
        { text: txt(r.folio), font: { name: "Calibri", size: 12, bold: true } }
      ]
    }, { fondo: GRIS, h: "center" });
    caja(2, 5, 2, 20, `ENTREGA Y SALIDA DE EQUIPO · ${(r.tipo || "Salida").toUpperCase()}${r.ligadoA ? " · LIGADO A " + r.ligadoA : ""}`, { negrita: true, tam: 8, h: "center" });

    etq(3, 5, 6, "CLIENTE"); val(3, 7, 20, r.cliente);
    etq(4, 5, 6, "FECHA"); val(4, 7, 10, fF(r.fecha)); etq(4, 11, 12, "HORA"); val(4, 13, 14, r.hora); etq(4, 15, 17, "NÚMERO DE ORDEN DE COMPRA"); val(4, 18, 20, r.ordenCompra);

    etq(5, 5, 6, "EQUIPO"); val(5, 7, 11, r.equipo); etq(5, 12, 14, "NIVEL COMBUSTIBLE");
    const nivel = (r.nivelCombustible || "").toLowerCase();
    [["electrica", "ELECTRICA", 15, 16], ["1/4", "1/4", 17, 17], ["1/2", "1/2", 18, 18], ["3/4", "3/4", 19, 19], ["full", "FULL", 20, 20]].forEach(([k, t, c1, c2]) => {
      caja(5, c1, 5, c2, t, { tam: 8, negrita: true, h: "center", fondo: nivel === k ? "FF222222" : undefined, color: nivel === k ? "FFFFFFFF" : "FF111111" });
    });
    etq(5, 21, 22, "HORÓMETRO"); val(5, 23, 24, r.horometro);

    etq(6, 5, 6, "MARCA"); val(6, 7, 11, r.marca); etq(6, 12, 13, "MODELO"); val(6, 14, 17, r.modelo); etq(6, 18, 19, "SERIE"); val(6, 20, 24, r.serie);
    etq(7, 5, 6, "ACCESORIO"); val(7, 7, 9, r.accesorio); etq(7, 10, 10, "MARCA"); val(7, 11, 13, r.accMarca); etq(7, 14, 15, "MODELO ACC."); val(7, 16, 17, r.accModelo); etq(7, 18, 18, "SERIE"); val(7, 19, 20, r.accSerie); etq(7, 21, 21, "FLETE"); val(7, 22, 24, r.flete);
    etq(8, 5, 7, "NOMBRE CONTACTO"); val(8, 8, 13, r.nombreContacto); etq(8, 14, 15, "TELÉFONO"); val(8, 16, 18, r.telefono); etq(8, 19, 20, "CORREO"); val(8, 21, 24, r.correo);

    etq(9, 1, 4, "UBICACIÓN"); etq(9, 5, 6, "HORA EN QUE SE ENTREGA"); etq(9, 7, 9, "FECHA DE ENTREGA"); etq(9, 10, 12, "FECHA DE RETIRO");
    etq(9, 13, 14, "HORA DE RETIRO"); etq(9, 15, 16, "HORÓMETRO RETIRO"); etq(9, 17, 20, "NOMBRE DE QUIEN ENTREGA EL EQUIPO"); etq(9, 21, 24, "NOMBRE DE QUIEN RECIBE EL EQUIPO");
    val(10, 1, 4, r.ubicacion); val(10, 5, 6, r.horaEntrega); val(10, 7, 9, fF(r.fechaEntrega)); val(10, 10, 12, fF(r.fechaRetiro));
    val(10, 13, 14, r.horaRetiro); val(10, 15, 16, r.horometroRetiro); val(10, 17, 20, r.quienEntrega); val(10, 21, 24, r.quienRecibe);

    alto(1, 11); alto(2, 5.2); for (let i = 3; i <= 8; i++) alto(i, 5.6); alto(9, 8.5); alto(10, 8.5);

    // ---- Checklist ----
    caja(11, 1, 11, 24, "CHECKLIST DE CONDICIÓN DEL EQUIPO — B: BUENO   R: REGULAR   M: MALO   ·   la X marca el estado del componente", { fondo: "FFEFEFEF", tam: 8, negrita: true });
    alto(11, 4.6);
    for (let g = 0; g < 4; g++) {
      const c0 = 1 + g * 6;
      caja(12, c0, 12, c0 + 2, "CONCEPTO", { fondo: GRIS, negrita: true, tam: 7, h: "center" });
      caja(12, c0 + 3, 12, c0 + 3, "B", { fondo: "FF92D050", negrita: true, tam: 9, h: "center" });
      caja(12, c0 + 4, 12, c0 + 4, "R", { fondo: "FFFFFF00", negrita: true, tam: 9, h: "center" });
      caja(12, c0 + 5, 12, c0 + 5, "M", { fondo: "FFFF6B6B", negrita: true, tam: 9, h: "center" });
    }
    alto(12, 5);
    const tinte = { B: "FFD9F0C2", R: "FFFFF8BF", M: "FFFFD3D3" };
    for (let i = 0; i < 7; i++) {
      const fila = 13 + i;
      cols.forEach((col, g) => {
        const c0 = 1 + g * 6;
        const it = col[i];
        if (!it) {
          caja(fila, c0, fila, c0 + 2, "", {});
          [3, 4, 5].forEach((d) => caja(fila, c0 + d, fila, c0 + d, "", {}));
          return;
        }
        const v = (r.items && r.items[it.n]) || "";
        const pct = it.pct && r.porcentajes && r.porcentajes[it.n] ? `   ${r.porcentajes[it.n]}%` : "";
        caja(fila, c0, fila, c0 + 2, it.n + pct, { tam: 7.5, negrita: false });
        if (it.siNo) {
          caja(fila, c0 + 3, fila, c0 + 3, "SI", { tam: 7, h: "center", negrita: v === "SI", color: v === "SI" ? "FF111111" : "FF8A8A8A", fondo: v === "SI" ? tinte.B : undefined });
          caja(fila, c0 + 4, fila, c0 + 4, "NO", { tam: 7, h: "center", negrita: v === "NO", color: v === "NO" ? "FF111111" : "FF8A8A8A", fondo: v === "NO" ? tinte.M : undefined });
          caja(fila, c0 + 5, fila, c0 + 5, "", { fondo: "FFEFEFEF" });
        } else {
          ["B", "R", "M"].forEach((k, d) => caja(fila, c0 + 3 + d, fila, c0 + 3 + d, v === k ? "X" : "", { tam: 11, negrita: true, h: "center", fondo: v === k ? tinte[k] : undefined }));
        }
      });
      alto(fila, 5.9);
    }

    // ---- Servicios, reparaciones, observaciones y firmas ----
    etq(20, 1, 3, "SERVICIO DE PRE-ENTREGA"); etq(20, 4, 4, "FECHA"); val(20, 5, 7, r.servPreNA ? "N/A" : fF(r.servPreEntregaFecha)); etq(20, 8, 9, "HORÓMETRO"); val(20, 10, 12, r.servPreNA ? "N/A" : r.servPreEntregaHorometro);
    etq(20, 13, 15, "PRÓXIMO SERVICIO"); etq(20, 16, 16, "FECHA"); val(20, 17, 19, r.proxServNA ? "N/A" : fF(r.proximoServicioFecha)); etq(20, 20, 21, "HORÓMETRO"); val(20, 22, 24, r.proxServNA ? "N/A" : r.proximoServicioHorometro);
    alto(20, 7.2);

    etq(21, 1, 4, "REPARACIONES POR DAÑOS A CONSIDERAR");
    caja(21, 5, 21, 21, txt(r.reparaciones), { tam: 9, v: "top" });
    caja(21, 22, 21, 24, {
      richText: [
        { text: "FIRMA DE ENTERADO Y CONFORMIDAD DE LA PERSONA ENCARGADA DEL EQUIPO", font: { name: "Calibri", size: 6.5, bold: true } },
        { text: r.firmaEnterado ? "\n\n" + r.firmaEnterado : "", font: { name: "Calibri", size: 8.5, bold: true } }
      ]
    }, { h: "center", v: "top" });
    alto(21, 20);

    etq(22, 1, 4, "OBSERVACIONES / USO EN OBRA");
    caja(22, 5, 22, 24, txt(r.observaciones), { tam: 9, v: "top" });
    alto(22, 13);

    const bloques = [[1, 5, "RECIBE EL EQUIPO", "CLIENTE: " + txt(r.cliente), r.recibeCliente || r.quienRecibe],
      [6, 10, "ENTREGA / RETIRA EL EQUIPO", "MAQUINARIA SOPORTE Y LOGISTICA", r.quienEntrega],
      [11, 17, "RETIRA EL EQUIPO (CLIENTE)", "CLIENTE: " + txt(r.cliente), r.retiraCliente],
      [18, 24, "Vo. Bo.", "MAQUINARIA SOPORTE Y LOGISTICA SA DE CV", "LIC. FRANCISCO TORRES MORALES"]];
    bloques.forEach(([c1, c2, tit, sub, nombre]) => {
      etq(23, c1, c2, tit);
      caja(24, c1, 24, c2, sub, { tam: 7.5, negrita: true, h: "center" });
      caja(25, c1, 25, c2, "", {});
      caja(26, c1, 26, c2, nombre || "Nombre y firma", { fondo: GRIS, tam: 8.5, negrita: !!nombre, italica: !nombre, color: nombre ? "FF111111" : "FF8A8A8A", h: "center" });
    });
    alto(23, 5); alto(24, 5); alto(25, 22); alto(26, 5.5);

    for (let c = 1; c <= 24; c++) ws.getCell(27, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE30613" } };
    ws.getRow(27).height = 6;

    // ---- Logo (el nuevo de MAQSOL) ----
    try {
      const id = wb.addImage({ base64: LOGO_MAQSOL_TRANSPARENTE, extension: "png" });
      const altoPx = 168;
      ws.addImage(id, { tl: { col: 0.35, row: 0.2 }, ext: { width: Math.round(altoPx * LOGO_MAQSOL_TRANSPARENTE_RELACION), height: altoPx } });
    } catch { /* si el logo falla, el archivo sale igual */ }

    ws.pageSetup.printArea = "A1:X27";

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo + ".xlsx";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    alert("No se pudo generar el Excel: " + (e.message || e));
  }
}
