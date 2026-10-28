export function generarGafete(persona, logoUrl) {
  const nombre = persona.nombre || 'Sin nombre'
  const puesto = persona.puesto || 'Sin puesto'
  const sangre = persona.tipoSangre || ''
  const tel    = persona.telefono || ''
  const folio  = persona.id || ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Gafete – ${nombre}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{background:#f4f4f4;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,Helvetica,sans-serif;}
  .wrap{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;padding:24px;}
  /* tarjeta: 85.6mm × 54mm a 96ppi */
  .card{width:324px;height:204px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.18);display:flex;flex-direction:column;position:relative;page-break-inside:avoid;}
  .card-top{background:#1a1a1a;padding:12px 14px 10px;display:flex;align-items:center;gap:10;flex-shrink:0;}
  .card-top img{height:32px;width:auto;filter:brightness(0) invert(1);opacity:.9;}
  .card-top .empresa{color:#fff;font-size:13px;font-weight:800;letter-spacing:.5px;line-height:1.2;}
  .card-top .sub{color:rgba(255,255,255,.55);font-size:9px;font-weight:600;letter-spacing:.8px;margin-top:1px;}
  .card-body{flex:1;padding:10px 14px;display:flex;align-items:center;gap:12;}
  .foto{width:64px;height:64px;border-radius:8px;background:#f0f0f0;border:2px solid #e0e0e0;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:24px;}
  .info{flex:1;min-width:0;}
  .nombre{font-size:15px;font-weight:800;color:#111;line-height:1.2;white-space:normal;word-break:break-word;}
  .puesto{font-size:11px;color:#c0282e;font-weight:700;margin-top:3px;text-transform:uppercase;letter-spacing:.4px;}
  .datos{margin-top:8px;display:flex;flex-direction:column;gap:3px;}
  .dato{font-size:10px;color:#555;display:flex;gap:5px;align-items:center;}
  .dato b{color:#222;min-width:44px;}
  .card-bottom{background:#c0282e;height:6px;flex-shrink:0;}
  .sangre-badge{position:absolute;top:10px;right:10px;background:#c0282e;color:#fff;font-size:10px;font-weight:800;border-radius:4px;padding:2px 6px;letter-spacing:.5px;}
  @media print{
    html,body{background:#fff;min-height:auto;}
    .wrap{padding:0;gap:16px;}
    .card{box-shadow:none;border:1px solid #ddd;}
    .no-print{display:none!important;}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    ${sangre ? `<div class="sangre-badge">${sangre}</div>` : ''}
    <div class="card-top">
      ${logoUrl ? `<img src="${logoUrl}" alt="MAQSOL"/>` : ''}
      <div>
        <div class="empresa">MAQSISTEM</div>
        <div class="sub">SISTEMA INTEGRAL</div>
      </div>
    </div>
    <div class="card-body">
      <div class="foto">👤</div>
      <div class="info">
        <div class="nombre">${nombre}</div>
        <div class="puesto">${puesto}</div>
        <div class="datos">
          ${tel ? `<div class="dato"><b>Tel:</b> ${tel}</div>` : ''}
          ${folio ? `<div class="dato"><b>ID:</b> <span style="font-family:monospace;font-size:9px">${folio}</span></div>` : ''}
        </div>
      </div>
    </div>
    <div class="card-bottom"></div>
  </div>
</div>
<div class="no-print" style="text-align:center;padding:16px;">
  <button onclick="window.print()" style="background:#c0282e;color:#fff;border:none;border-radius:6px;padding:10px 24px;font-size:15px;font-weight:700;cursor:pointer;">Imprimir gafete</button>
</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const w    = window.open(url, '_blank', 'noopener')
  if (w) setTimeout(() => URL.revokeObjectURL(url), 60000)
}
