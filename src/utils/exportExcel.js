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
 * Genera y descarga un Excel (.xlsx real) con logo de MAQSOL, título, encabezado
 * de color, filas alternadas, filtros, columnas del ancho justo y encabezado fijo.
 */
export async function descargarExcelBonito({ titulo, subtitulo, columnas, filas, nombreArchivo }) {
  try {
    const ExcelJS = (await import('exceljs')).default
    const texto = v => (v === null || v === undefined ? '' : String(v))
    const n = columnas.length
    const FILA_ENC = 5

    const wb = new ExcelJS.Workbook()
    wb.creator = 'MAQSISTEM'
    wb.created = new Date()

    const nombreHoja = (titulo || 'Hoja1').replace(/[\\*?:[\]/]/g, ' ').trim().slice(0, 31) || 'Hoja1'
    const ws = wb.addWorksheet(nombreHoja, {
      views: [{ showGridLines: false, state: 'frozen', ySplit: FILA_ENC }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 1, printTitlesRow: `${FILA_ENC}:${FILA_ENC}` }
    })

    ws.columns = columnas.map((c, i) => {
      const max = Math.max(texto(c).length, ...filas.map(f => texto(f[i]).length))
      return { width: Math.min(48, Math.max(11, max + 3)) }
    })

    const conLogo = n >= 3
    const colTitulo = conLogo ? 2 : 1

    ws.getRow(1).height = 32
    ws.getRow(2).height = 18
    ws.getRow(3).height = 8
    ws.getRow(4).height = 6

    ws.mergeCells(1, colTitulo, 1, n)
    const celdaTitulo = ws.getCell(1, colTitulo)
    celdaTitulo.value = titulo || ''
    celdaTitulo.font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FF' + VINO.slice(1).toUpperCase() } }
    celdaTitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

    if (subtitulo) {
      ws.mergeCells(2, colTitulo, 2, n)
      const celdaSub = ws.getCell(2, colTitulo)
      celdaSub.value = subtitulo
      celdaSub.font = { name: 'Calibri', size: 11, color: { argb: 'FF666666' } }
      celdaSub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    }

    if (conLogo) {
      try {
        const id = wb.addImage({ base64: LOGO_MAQSOL_BASE64, extension: 'jpeg' })
        ws.addImage(id, { tl: { col: 0.08, row: 0.08 }, ext: { width: 70, height: 75 } })
      } catch { /* si el logo falla, el archivo sale igual */ }
    }

    const linea = { style: 'thin', color: { argb: 'FFD0D7DE' } }
    const bordes = { top: linea, left: linea, bottom: linea, right: linea }

    const encabezado = ws.getRow(FILA_ENC)
    encabezado.height = 26
    columnas.forEach((c, i) => {
      const cell = encabezado.getCell(i + 1)
      cell.value = c
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + VINO.slice(1).toUpperCase() } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = { top: linea, left: linea, bottom: linea, right: linea }
    })

    filas.forEach((fila, r) => {
      const row = ws.getRow(FILA_ENC + 1 + r)
      const esTotal = fila.some(v => texto(v).trim().toUpperCase() === 'TOTAL')
      row.height = 21
      columnas.forEach((_, i) => {
        const cell = row.getCell(i + 1)
        const v = fila[i]
        cell.value = v === null || v === undefined || v === '' ? null : v
        cell.font = { name: 'Calibri', size: 11, bold: esTotal, color: { argb: 'FF222222' } }
        cell.alignment = { vertical: 'middle', horizontal: typeof v === 'number' ? 'right' : 'left', wrapText: true, indent: typeof v === 'number' ? 0 : 1 }
        cell.border = esTotal ? { ...bordes, top: { style: 'medium', color: { argb: 'FF' + VINO.slice(1).toUpperCase() } } } : bordes
        if (esTotal) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE8F3' } }
        else if (r % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F7FB' } }
      })
    })

    ws.autoFilter = { from: { row: FILA_ENC, column: 1 }, to: { row: FILA_ENC, column: n } }

    const filaPie = FILA_ENC + filas.length + 2
    ws.mergeCells(filaPie, 1, filaPie, n)
    const pie = ws.getCell(filaPie, 1)
    pie.value = `Generado el ${new Date().toLocaleDateString('es-MX')} · MAQSISTEM · Maquinaria Soporte y Logística`
    pie.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF888888' } }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo + '.xlsx'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } catch (e) {
    alert('No se pudo generar el Excel: ' + (e.message || e))
  }
}
