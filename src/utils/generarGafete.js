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
  html,body{background:#e8e8e8;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',Arial,Helvetica,sans-serif;}
  .wrap{display:flex;gap:32px;flex-wrap:wrap;justify-content:center;padding:32px;}

  /* Tarjeta 85.6mm × 54mm ~324×204px */
  .card{width:340px;height:214px;background:#fff;border-radius:0;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.22);display:flex;flex-direction:column;position:relative;}

  /* Header: franja roja + logo blanco */
  .card-top{background:#8F1D2C;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
  .card-top img{height:30px;width:auto;filter:brightness(0) invert(1);}
  .card-top .empresa{color:#fff;font-size:14px;font-weight:900;letter-spacing:.6px;line-height:1.15;font-family:'Segoe UI',Arial,sans-serif;}
  .card-top .sub{color:rgba(255,255,255,.65);font-size:8.5px;font-weight:600;letter-spacing:1.2px;margin-top:2px;text-transform:uppercase;}

  /* Cuerpo */
  .card-body{flex:1;padding:12px 14px;display:flex;align-items:center;gap:14;background:#fff;}

  /* Foto */
  .foto-wrap{flex-shrink:0;cursor:pointer;position:relative;}
  .foto{width:72px;height:72px;background:#f5f5f5;border:2px solid #ddd;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
  .foto img{width:100%;height:100%;object-fit:cover;}
  .foto-hint{position:absolute;bottom:0;left:0;right:0;background:rgba(143,29,44,.82);color:#fff;font-size:8px;font-weight:700;text-align:center;padding:3px 0;letter-spacing:.4px;pointer-events:none;}
  .foto-wrap:hover .foto{border-color:#8F1D2C;}

  /* Info */
  .info{flex:1;min-width:0;padding-left:4px;}
  .nombre{font-size:15px;font-weight:900;color:#111;line-height:1.2;word-break:break-word;font-family:'Segoe UI',Arial,sans-serif;}
  .puesto{font-size:10px;color:#8F1D2C;font-weight:800;margin-top:4px;text-transform:uppercase;letter-spacing:.6px;}
  .divider{width:32px;height:2px;background:#8F1D2C;margin:6px 0;}
  .datos{display:flex;flex-direction:column;gap:3px;}
  .dato{font-size:10px;color:#555;display:flex;gap:5px;align-items:center;}
  .dato b{color:#222;min-width:28px;font-weight:700;}

  /* Sangre badge */
  .sangre-badge{position:absolute;top:8px;right:10px;background:#fff;color:#8F1D2C;font-size:10px;font-weight:900;border:2px solid #8F1D2C;border-radius:0;padding:1px 7px;letter-spacing:.5px;}

  /* Franja inferior */
  .card-bottom{height:5px;background:linear-gradient(90deg,#8F1D2C 0%,#111 100%);flex-shrink:0;}

  /* Input oculto */
  #foto-input{display:none;}

  /* Panel de controles */
  .controls{display:flex;gap:12px;align-items:center;margin-top:20px;}
  .btn-print{background:#8F1D2C;color:#fff;border:none;padding:10px 28px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:.3px;font-family:'Segoe UI',Arial,sans-serif;}
  .btn-print:hover{background:#6d1520;}
  .btn-foto{background:#111;color:#fff;border:none;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;}
  .btn-foto:hover{background:#333;}
  .hint{font-size:11px;color:#888;margin-top:6px;}

  @media print{
    html,body{background:#fff;min-height:auto;}
    .wrap{padding:0;}
    .controls,.hint{display:none!important;}
    .card{box-shadow:none;border:1px solid #ccc;}
    .foto-hint{display:none!important;}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card" id="card">
    ${sangre ? `<div class="sangre-badge">${sangre}</div>` : ''}
    <div class="card-top">
      ${logoUrl ? `<img src="${logoUrl}" alt="MAQSOL"/>` : ''}
      <div>
        <div class="empresa">MAQSISTEM</div>
        <div class="sub">Sistema Integral</div>
      </div>
    </div>
    <div class="card-body">
      <div class="foto-wrap" onclick="document.getElementById('foto-input').click()" title="Clic para agregar foto">
        <div class="foto" id="foto-box">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <div class="foto-hint">+ FOTO</div>
        </div>
      </div>
      <div class="info">
        <div class="nombre">${nombre}</div>
        <div class="puesto">${puesto}</div>
        <div class="divider"></div>
        <div class="datos">
          ${tel ? `<div class="dato"><b>Tel</b>${tel}</div>` : ''}
          ${folio ? `<div class="dato"><b>ID</b><span style="font-family:monospace;font-size:9px">${folio}</span></div>` : ''}
        </div>
      </div>
    </div>
    <div class="card-bottom"></div>
  </div>
</div>

<input type="file" id="foto-input" accept="image/*" capture="user"/>

<div class="controls">
  <button class="btn-foto" onclick="document.getElementById('foto-input').click()">📷 Agregar foto</button>
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir gafete</button>
</div>
<p class="hint">Haz clic en la foto o en "Agregar foto" para subir una imagen del colaborador</p>

<script>
  document.getElementById('foto-input').addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      const box = document.getElementById('foto-box');
      box.innerHTML = '<img src="' + ev.target.result + '" alt="foto"/>';
    };
    reader.readAsDataURL(file);
  });
</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const w    = window.open(url, '_blank', 'noopener')
  if (w) setTimeout(() => URL.revokeObjectURL(url), 60000)
}
