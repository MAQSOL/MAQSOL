import { useState, useEffect } from 'react'

const VINO = 'var(--acento)'
const KEY_EQUIPOS = 'equiposInternos'
const KEY_OPERADORES = 'operadoresMaqsol'
const KEY_TIPOS = 'tiposEquipoInterno'

const TIPOS_INICIALES = [
  'Manipulador telescópico',
  'Montacargas',
  'Plataforma de tijera',
  'Plataforma articulada',
  'Minicargador',
  'Retroexcavadora',
  'Torre de iluminación',
  'Generador'
]

const EQUIPO_NUEVO = {
  id: '',
  tipo: '',
  marca: '',
  modelo: '',
  serie: '',
  horometro: '',
  operador: '',
  ubicacion: '',
  proximoMantto: '',
  anio: '',
  motor: '',
  capacidad: '',
  combustible: '',
  placas: '',
  notas: '',
  fotoUrl: '',
  filtroAceite: '',
  filtroAire: '',
  filtroCombustible: '',
  filtroHidraulico: '',
  filtroOtros: '',
  mantenimientos: []
}

const UBICACIONES = [
  'Patio MAQSOL',
  'Cancún',
  'Playa del Carmen',
  'Tulum',
  'Mérida',
  'Chetumal',
  'Cozumel',
  'Taller',
  'En tránsito'
]

// ---------- estilos ----------
const S = {
  page: { padding: '24px 28px', fontFamily: 'inherit', color: '#222' },
  h1: { fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: 0.5 },
  sub: { color: '#777', margin: '4px 0 0', fontSize: 14 },
  card: {
    background: '#fff',
    border: '1px solid #e6e6e6',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,.05)'
  },
  btn: {
    background: VINO,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14
  },
  btnGris: {
    background: '#e9e9e9',
    color: '#333',
    border: 'none',
    borderRadius: 6,
    padding: '10px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14
  },
  btnVerde: {
    background: '#1f8b4c',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14
  },
  input: {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #d8d8d8',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
    background: '#fff'
  },
  inputTabla: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 5,
    fontSize: 14,
    boxSizing: 'border-box',
    background: '#fff'
  },
  label: { fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5, display: 'block' },
  th: {
    textAlign: 'left',
    padding: '12px 10px',
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#fff',
    background: '#222',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  td: { padding: '11px 10px', borderBottom: '1px solid #eee', fontSize: 14 },
  equis: {
    background: 'transparent',
    border: 'none',
    color: '#c62828',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    lineHeight: 1,
    padding: '2px 6px',
    borderRadius: 4
  },
  modalBg: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.45)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 30,
    overflowY: 'auto',
    zIndex: 999
  },
  modal: {
    background: '#fff',
    borderRadius: 10,
    padding: 26,
    width: '100%',
    maxWidth: 900
  },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }
}

// ---------- helpers ----------
function diasPara(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const objetivo = new Date(fecha + 'T00:00:00')
  return Math.round((objetivo - hoy) / 86400000)
}

function Semaforo({ fecha }) {
  const d = diasPara(fecha)
  if (d === null) return <span style={{ color: '#999' }}>Sin fecha</span>
  let color = '#1f8b4c'
  let texto = 'Faltan ' + d + ' d'
  if (d < 0) {
    color = '#c62828'
    texto = 'Vencido ' + Math.abs(d) + ' d'
  } else if (d <= 15) {
    color = '#c98a00'
  }
  const f = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX')
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span>{f}</span>
      <span style={{ color, fontSize: 12, fontWeight: 700 }}>({texto})</span>
    </span>
  )
}

export default function EquiposInternos() {
  const [equipos, setEquipos] = useState([])
  const [operadores, setOperadores] = useState([])
  const [tipos, setTipos] = useState([])
  const [vista, setVista] = useState('lista')
  const [activoId, setActivoId] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EQUIPO_NUEVO)
  const [modoNuevoOperador, setModoNuevoOperador] = useState(false)
  const [nuevoOperador, setNuevoOperador] = useState('')
  const [modoNuevoTipoForm, setModoNuevoTipoForm] = useState(false)
  const [nuevoTipoForm, setNuevoTipoForm] = useState('')
  const [modoNuevoTipoFiltro, setModoNuevoTipoFiltro] = useState(false)
  const [nuevoTipoFiltro, setNuevoTipoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [fTipo, setFTipo] = useState('')

  useEffect(() => {
    try {
      const e = JSON.parse(localStorage.getItem(KEY_EQUIPOS) || '[]')
      const o = JSON.parse(localStorage.getItem(KEY_OPERADORES) || '[]')
      const t = JSON.parse(localStorage.getItem(KEY_TIPOS) || 'null')
      setEquipos(Array.isArray(e) ? e : [])
      setOperadores(Array.isArray(o) ? o : [])
      if (Array.isArray(t) && t.length) {
        setTipos(t)
      } else {
        setTipos(TIPOS_INICIALES)
        localStorage.setItem(KEY_TIPOS, JSON.stringify(TIPOS_INICIALES))
      }
    } catch {
      setEquipos([])
      setOperadores([])
      setTipos(TIPOS_INICIALES)
    }
  }, [])

  function guardarEquipos(lista) {
    setEquipos(lista)
    localStorage.setItem(KEY_EQUIPOS, JSON.stringify(lista))
  }

  function guardarOperadores(lista) {
    setOperadores(lista)
    localStorage.setItem(KEY_OPERADORES, JSON.stringify(lista))
  }

  function guardarTipos(lista) {
    setTipos(lista)
    localStorage.setItem(KEY_TIPOS, JSON.stringify(lista))
  }

  // guarda un campo suelto del equipo abierto en la ficha
  function actualizarCampo(campo, valor) {
    guardarEquipos(equipos.map((e) => (e.id === activoId ? { ...e, [campo]: valor } : e)))
  }

  function abrirNuevo() {
    setForm({ ...EQUIPO_NUEVO, id: 'EQ-' + Date.now() })
    setModoNuevoOperador(false)
    setModoNuevoTipoForm(false)
    setNuevoOperador('')
    setNuevoTipoForm('')
    setModal(true)
  }

  function abrirEditar(eq) {
    setForm({ ...EQUIPO_NUEVO, ...eq })
    setModoNuevoOperador(false)
    setModoNuevoTipoForm(false)
    setModal(true)
  }

  function guardarForm() {
    if (!form.tipo.trim()) {
      alert('Selecciona el tipo de equipo.')
      return
    }
    const existe = equipos.some((e) => e.id === form.id)
    const lista = existe ? equipos.map((e) => (e.id === form.id ? { ...e, ...form } : e)) : [...equipos, form]
    guardarEquipos(lista)
    setModal(false)
    // al dar de alta uno nuevo, se abre su ficha para capturar lo demás
    if (!existe) {
      setActivoId(form.id)
      setVista('ficha')
    }
  }

  function eliminarEquipo(eq) {
    const nombre = [eq.tipo, eq.marca, eq.modelo].filter(Boolean).join(' ')
    if (!confirm('¿Quitar "' + nombre + '" de la lista de equipos internos?\n\nEsta acción no se puede deshacer.')) return
    guardarEquipos(equipos.filter((e) => e.id !== eq.id))
    setVista('lista')
  }

  function agregarOperador() {
    const nombre = nuevoOperador.trim()
    if (!nombre) return
    if (!operadores.includes(nombre)) guardarOperadores([...operadores, nombre].sort())
    setForm({ ...form, operador: nombre })
    setNuevoOperador('')
    setModoNuevoOperador(false)
  }

  function cambiarOperador(valor) {
    if (valor === '__nuevo__') {
      setModoNuevoOperador(true)
      return
    }
    setModoNuevoOperador(false)
    setForm({ ...form, operador: valor })
  }

  function agregarTipoDesdeForm() {
    const nombre = nuevoTipoForm.trim()
    if (!nombre) return
    if (!tipos.includes(nombre)) guardarTipos([...tipos, nombre].sort())
    setForm({ ...form, tipo: nombre })
    setNuevoTipoForm('')
    setModoNuevoTipoForm(false)
  }

  function cambiarTipoForm(valor) {
    if (valor === '__nuevo__') {
      setModoNuevoTipoForm(true)
      return
    }
    setModoNuevoTipoForm(false)
    setForm({ ...form, tipo: valor })
  }

  function agregarTipoDesdeFiltro() {
    const nombre = nuevoTipoFiltro.trim()
    if (!nombre) return
    if (!tipos.includes(nombre)) guardarTipos([...tipos, nombre].sort())
    setFTipo(nombre)
    setNuevoTipoFiltro('')
    setModoNuevoTipoFiltro(false)
  }

  function eliminarTipo() {
    if (!fTipo) return
    const enUso = equipos.filter((e) => e.tipo === fTipo).length
    if (enUso > 0) {
      alert('No se puede quitar "' + fTipo + '" porque hay ' + enUso + ' equipo(s) usando ese tipo.')
      return
    }
    if (!confirm('¿Quitar "' + fTipo + '" de la lista de tipos de equipo?')) return
    guardarTipos(tipos.filter((t) => t !== fTipo))
    setFTipo('')
  }

  const filtrados = equipos.filter((e) => {
    const texto = (e.tipo + ' ' + e.marca + ' ' + e.modelo + ' ' + e.serie).toLowerCase()
    const okBusqueda = texto.includes(busqueda.toLowerCase())
    const okTipo = !fTipo || e.tipo === fTipo
    return okBusqueda && okTipo
  })

  function exportarLista() {
    const encabezados = ['Equipo', 'Marca', 'Modelo', 'Serie', 'Horómetro', 'Operador', 'Ubicación', 'Próx. Mantto']
    const filas = filtrados.map((e) => [
      e.tipo,
      e.marca,
      e.modelo,
      e.serie,
      e.horometro,
      e.operador || 'Sin operador',
      e.ubicacion,
      e.proximoMantto
    ])
    const csv = [encabezados, ...filas]
      .map((f) => f.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'Equipos-Internos-MAQSOL.csv'
    a.click()
  }

  const activo = equipos.find((e) => e.id === activoId)

  // ================= FICHA =================
  if (vista === 'ficha' && activo) {
    const Dato = ({ etiqueta, valor }) => (
      <div style={{ marginBottom: 12 }}>
        <div style={S.label}>{etiqueta}</div>
        <div style={{ fontSize: 15 }}>{valor || <span style={{ color: '#bbb' }}>—</span>}</div>
      </div>
    )
    const filtrosFicha = [
      ['Filtro de aceite', 'filtroAceite'],
      ['Filtro de aire', 'filtroAire'],
      ['Filtro de combustible', 'filtroCombustible'],
      ['Filtro hidráulico', 'filtroHidraulico'],
      ['Otros', 'filtroOtros']
    ]
    return (
      <div style={S.page}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={S.h1}>{activo.tipo || 'Equipo'}</h1>
            <p style={S.sub}>
              {activo.marca} {activo.modelo} · Serie {activo.serie || 's/n'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={S.btnGris} onClick={() => setVista('lista')}>
              ← Regresar a la lista
            </button>
            <button style={S.btn} onClick={() => abrirEditar(activo)}>
              Editar datos generales
            </button>
          </div>
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 0 }}>Información General</h2>
          <div style={S.grid4}>
            <Dato etiqueta="TIPO DE EQUIPO" valor={activo.tipo} />
            <Dato etiqueta="MARCA" valor={activo.marca} />
            <Dato etiqueta="MODELO" valor={activo.modelo} />
            <Dato etiqueta="SERIE" valor={activo.serie} />
            <Dato etiqueta="AÑO" valor={activo.anio} />
            <Dato etiqueta="HORÓMETRO" valor={activo.horometro ? activo.horometro + ' hrs' : ''} />
            <Dato etiqueta="OPERADOR" valor={activo.operador || 'Sin operador'} />
            <Dato etiqueta="UBICACIÓN" valor={activo.ubicacion} />
            <Dato etiqueta="MOTOR" valor={activo.motor} />
            <Dato etiqueta="CAPACIDAD" valor={activo.capacidad} />
            <Dato etiqueta="COMBUSTIBLE" valor={activo.combustible} />
            <Dato etiqueta="PLACAS" valor={activo.placas} />
          </div>
          <div style={S.label}>PRÓXIMO MANTENIMIENTO</div>
          <div style={{ fontSize: 15 }}>
            <Semaforo fecha={activo.proximoMantto} />
          </div>
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 0 }}>Filtros de la Máquina</h2>
          <p style={{ color: '#777', fontSize: 13, marginTop: -6 }}>
            Escribe aquí los números de parte. Se guardan solos al escribir.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: 260 }}>FILTRO</th>
                <th style={S.th}>NÚMERO DE PARTE</th>
                <th style={{ ...S.th, width: 90, textAlign: 'center' }}>COPIAR</th>
              </tr>
            </thead>
            <tbody>
              {filtrosFicha.map(([nombre, campo]) => (
                <tr key={campo}>
                  <td style={{ ...S.td, fontWeight: 700 }}>{nombre}</td>
                  <td style={S.td}>
                    <input
                      style={S.inputTabla}
                      value={activo[campo] || ''}
                      placeholder="Número de parte"
                      onChange={(ev) => actualizarCampo(campo, ev.target.value)}
                    />
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button
                      style={{ ...S.btnGris, padding: '6px 12px', fontSize: 12 }}
                      onClick={() => {
                        if (activo[campo]) {
                          navigator.clipboard.writeText(activo[campo])
                          alert('Copiado: ' + activo[campo])
                        }
                      }}
                    >
                      Copiar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 0 }}>Fotografías</h2>
          <label style={S.label}>LIGA DE LA FOTO</label>
          <input
            style={S.input}
            value={activo.fotoUrl || ''}
            placeholder="Pega aquí la liga de una imagen"
            onChange={(ev) => actualizarCampo('fotoUrl', ev.target.value)}
          />
          {activo.fotoUrl ? (
            <img
              src={activo.fotoUrl}
              alt="Equipo"
              style={{ maxWidth: '100%', borderRadius: 8, marginTop: 14, display: 'block' }}
            />
          ) : (
            <p style={{ color: '#888', fontSize: 13, marginBottom: 0 }}>
              La galería de varias fotos y la vista 360° se activan cuando el sistema pase a Supabase.
            </p>
          )}
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 0 }}>Notas del Equipo</h2>
          <textarea
            style={{ ...S.input, minHeight: 90, resize: 'vertical' }}
            value={activo.notas || ''}
            placeholder="Detalles, pendientes, observaciones de la máquina..."
            onChange={(ev) => actualizarCampo('notas', ev.target.value)}
          />
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 0 }}>Historial de Mantenimientos</h2>
          <p style={{ color: '#888', fontSize: 14 }}>
            Esta sección es la siguiente parte del módulo: tabla de mantenimientos con filtros y descarga en Excel y PDF.
          </p>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 40 }}>
          <button
            style={{ ...S.btnGris, background: '#fdecec', color: '#c62828' }}
            onClick={() => eliminarEquipo(activo)}
          >
            Eliminar este equipo
          </button>
        </div>
      </div>
    )
  }

  // ================= LISTA =================
  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={S.h1}>Equipos Internos</h1>
          <p style={S.sub}>Maquinaria propiedad de MAQSOL · {equipos.length} equipos registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={S.btnGris} onClick={exportarLista}>
            Descargar lista
          </button>
          <button style={S.btn} onClick={abrirNuevo}>
            + Agregar equipo
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr', gap: 18, alignItems: 'start' }}>
          <div>
            <label style={S.label}>BUSCAR</label>
            <input
              style={S.input}
              placeholder="Equipo, marca, modelo o serie"
              value={busqueda}
              onChange={(ev) => setBusqueda(ev.target.value)}
            />
          </div>
          <div>
            <label style={S.label}>TIPO DE EQUIPO</label>
            {modoNuevoTipoFiltro ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={S.input}
                  autoFocus
                  placeholder="Ej. Excavadora, Rotomartillo"
                  value={nuevoTipoFiltro}
                  onChange={(ev) => setNuevoTipoFiltro(ev.target.value)}
                />
                <button style={S.btnVerde} onClick={agregarTipoDesdeFiltro}>
                  Guardar
                </button>
                <button style={S.btnGris} onClick={() => setModoNuevoTipoFiltro(false)}>
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <select style={S.input} value={fTipo} onChange={(ev) => setFTipo(ev.target.value)}>
                  <option value="">Todos los tipos</option>
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  style={{ ...S.btnGris, whiteSpace: 'nowrap' }}
                  onClick={() => setModoNuevoTipoFiltro(true)}
                  title="Dar de alta un tipo de equipo nuevo"
                >
                  + Tipo
                </button>
              </div>
            )}
            {fTipo && !modoNuevoTipoFiltro ? (
              <button
                onClick={eliminarTipo}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c62828',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '6px 0 0',
                  textDecoration: 'underline'
                }}
              >
                Quitar "{fTipo}" de la lista de tipos
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
          <thead>
            <tr>
              <th style={S.th}>EQUIPO</th>
              <th style={S.th}>MARCA</th>
              <th style={S.th}>MODELO</th>
              <th style={S.th}>SERIE</th>
              <th style={S.th}>HORÓMETRO</th>
              <th style={S.th}>OPERADOR</th>
              <th style={S.th}>UBICACIÓN</th>
              <th style={S.th}>PRÓX. MANTTO</th>
              <th style={{ ...S.th, width: 50, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td style={{ ...S.td, textAlign: 'center', color: '#999', padding: 40 }} colSpan={9}>
                  No hay equipos que mostrar. Usa el botón "+ Agregar equipo" para dar de alta la primera máquina.
                </td>
              </tr>
            ) : (
              filtrados.map((e) => (
                <tr
                  key={e.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActivoId(e.id)
                    setVista('ficha')
                  }}
                  onMouseOver={(ev) => (ev.currentTarget.style.background = '#faf5f6')}
                  onMouseOut={(ev) => (ev.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...S.td, fontWeight: 700 }}>{e.tipo}</td>
                  <td style={S.td}>{e.marca}</td>
                  <td style={S.td}>{e.modelo}</td>
                  <td style={S.td}>{e.serie}</td>
                  <td style={S.td}>{e.horometro ? e.horometro + ' hrs' : '—'}</td>
                  <td style={S.td}>
                    {e.operador || <span style={{ color: '#c98a00', fontWeight: 700 }}>Sin operador</span>}
                  </td>
                  <td style={S.td}>{e.ubicacion}</td>
                  <td style={S.td}>
                    <Semaforo fecha={e.proximoMantto} />
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button
                      style={S.equis}
                      title="Quitar este equipo de la lista"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        eliminarEquipo(e)
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ============ VENTANA DE ALTA / EDICIÓN (solo datos generales) ============ */}
      {modal && (
        <div style={S.modalBg} onClick={() => setModal(false)}>
          <div style={S.modal} onClick={(ev) => ev.stopPropagation()}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              {equipos.some((e) => e.id === form.id) ? 'Editar datos generales' : 'Nuevo equipo'}
            </h2>
            <p style={{ color: '#888', fontSize: 13, margin: '4px 0 18px' }}>
              Datos básicos. Los filtros, la foto, las notas y el historial se capturan en la ficha del equipo.
            </p>

            <div style={S.grid3}>
              <div>
                <label style={S.label}>TIPO DE EQUIPO</label>
                {modoNuevoTipoForm ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={S.input}
                      autoFocus
                      placeholder="Ej. Excavadora"
                      value={nuevoTipoForm}
                      onChange={(ev) => setNuevoTipoForm(ev.target.value)}
                    />
                    <button style={S.btnVerde} onClick={agregarTipoDesdeForm}>
                      Guardar
                    </button>
                    <button style={S.btnGris} onClick={() => setModoNuevoTipoForm(false)}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <select style={S.input} value={form.tipo} onChange={(ev) => cambiarTipoForm(ev.target.value)}>
                    <option value="">Selecciona un tipo</option>
                    {tipos.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__nuevo__">+ Agregar tipo nuevo</option>
                  </select>
                )}
              </div>
              <div>
                <label style={S.label}>MARCA</label>
                <input
                  style={S.input}
                  value={form.marca}
                  onChange={(ev) => setForm({ ...form, marca: ev.target.value })}
                />
              </div>
              <div>
                <label style={S.label}>MODELO</label>
                <input
                  style={S.input}
                  value={form.modelo}
                  onChange={(ev) => setForm({ ...form, modelo: ev.target.value })}
                />
              </div>
            </div>

            <div style={S.grid4}>
              <div>
                <label style={S.label}>SERIE</label>
                <input
                  style={S.input}
                  value={form.serie}
                  onChange={(ev) => setForm({ ...form, serie: ev.target.value })}
                />
              </div>
              <div>
                <label style={S.label}>AÑO</label>
                <input
                  style={S.input}
                  value={form.anio}
                  onChange={(ev) => setForm({ ...form, anio: ev.target.value })}
                />
              </div>
              <div>
                <label style={S.label}>HORÓMETRO</label>
                <input
                  style={S.input}
                  value={form.horometro}
                  onChange={(ev) => setForm({ ...form, horometro: ev.target.value })}
                  placeholder="Ej. 3450"
                />
              </div>
              <div>
                <label style={S.label}>PRÓXIMO MANTENIMIENTO</label>
                <input
                  type="date"
                  style={S.input}
                  value={form.proximoMantto}
                  onChange={(ev) => setForm({ ...form, proximoMantto: ev.target.value })}
                />
              </div>
            </div>

            <div style={S.grid3}>
              <div>
                <label style={S.label}>OPERADOR</label>
                {modoNuevoOperador ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={S.input}
                      autoFocus
                      placeholder="Nombre del operador"
                      value={nuevoOperador}
                      onChange={(ev) => setNuevoOperador(ev.target.value)}
                    />
                    <button style={S.btnVerde} onClick={agregarOperador}>
                      Guardar
                    </button>
                    <button style={S.btnGris} onClick={() => setModoNuevoOperador(false)}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <select style={S.input} value={form.operador} onChange={(ev) => cambiarOperador(ev.target.value)}>
                    <option value="">Sin operador</option>
                    {operadores.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                    <option value="__nuevo__">+ Agregar operador nuevo</option>
                  </select>
                )}
              </div>
              <div>
                <label style={S.label}>UBICACIÓN</label>
                <select
                  style={S.input}
                  value={form.ubicacion}
                  onChange={(ev) => setForm({ ...form, ubicacion: ev.target.value })}
                >
                  <option value="">Selecciona una ubicación</option>
                  {UBICACIONES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>PLACAS</label>
                <input
                  style={S.input}
                  value={form.placas}
                  onChange={(ev) => setForm({ ...form, placas: ev.target.value })}
                />
              </div>
            </div>

            <div style={{ ...S.grid3, marginBottom: 22 }}>
              <div>
                <label style={S.label}>MOTOR</label>
                <input
                  style={S.input}
                  value={form.motor}
                  onChange={(ev) => setForm({ ...form, motor: ev.target.value })}
                />
              </div>
              <div>
                <label style={S.label}>CAPACIDAD</label>
                <input
                  style={S.input}
                  value={form.capacidad}
                  onChange={(ev) => setForm({ ...form, capacidad: ev.target.value })}
                  placeholder="Ej. 4,000 kg / 17 m"
                />
              </div>
              <div>
                <label style={S.label}>COMBUSTIBLE</label>
                <input
                  style={S.input}
                  value={form.combustible}
                  onChange={(ev) => setForm({ ...form, combustible: ev.target.value })}
                  placeholder="Diésel / Gasolina"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button style={S.btnGris} onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button style={S.btn} onClick={guardarForm}>
                Guardar y abrir ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}