import { LOGO_MAQSOL_BASE64 } from './logoBase64'

const VINO = '#1d5c8f'

// número de semana ISO de una fecha
export function numeroSemanaISO(fecha = new Date()) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const primerJueves = new Date(d.getFullYear(), 0, 4)
  primerJueves.setDate(primerJueves.getDate() + 3 - ((primerJueves.getDay() + 6) % 7))
  return 1 + Math.round((d - primerJueves) / (7 * 24 * 60 * 60 * 1000))
}

// Ej. nombreArchivoSemana('B-FLETES') -> "B-FLETES-SEMANA36-062026"
export function nombreArchivoSemana(prefijo, fecha = new Date()) {
  const semana = numeroSemanaISO(fecha)
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${prefijo}-SEMANA${semana}-${mm}${fecha.getFullYear()}`
}

// Ej. nombreArchivoFecha('EQ-INTERNOS') -> "EQ-INTERNOS-14092026"
export function nombreArchivoFecha(prefijo, fecha = new Date()) {
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${prefijo}-${dd}${mm}${fecha.getFullYear()}`
}

/**
 * Genera y descarga un "Excel" (tabla HTML que Excel abre con formato) con
 * logo de MAQSOL, título, colores y bordes — en vez de un CSV plano.
 */
export function descargarExcelBonito({ titulo, subtitulo, columnas, filas, nombreArchivo }) {
  const encabezado = columnas.map(c => `<th>${c}</th>`).join('')
  const cuerpo = filas
    .map((fila, i) => {
      const celdas = fila
        .map(v => `<td>${String(v ?? '').replace(/</g, '&lt;')}</td>`)
        .join('')
      return `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#faf5f6'}">${celdas}</tr>`
    })
    .join('')

  const colspan = columnas.length

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>${(titulo || 'Hoja1').slice(0, 30)}</x:Name>
      <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        body{font-family:Calibri,Arial,sans-serif;}
        table{border-collapse:collapse;}
        td,th{border:1px solid #cfcfcf;padding:6px 10px;font-size:12px;}
        th{background:${VINO};color:#ffffff;font-weight:700;text-align:left;}
        .sinborde{border:none;}
        .titulo{font-size:18px;font-weight:700;color:${VINO};}
        .sub{font-size:11px;color:#666666;}
      </style>
    </head>
    <body>
      <table>
        <tr><td class="sinborde" colspan="${colspan}" style="padding:10px 0;">
          <img src="${LOGO_MAQSOL_BASE64}" height="55"/>
        </td></tr>
        <tr><td class="sinborde titulo" colspan="${colspan}">${titulo || ''}</td></tr>
        ${subtitulo ? `<tr><td class="sinborde sub" colspan="${colspan}">${subtitulo}</td></tr>` : ''}
        <tr><td class="sinborde" colspan="${colspan}" style="height:10px;"></td></tr>
        <tr>${encabezado}</tr>
        ${cuerpo}
      </table>
    </body></html>`

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nombreArchivo + '.xls'
  a.click()
}
