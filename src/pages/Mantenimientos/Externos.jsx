import { useState } from 'react'
import { useListaCompartida, useListaCatalogo } from '../../hooks/useSharedTable'
import Sidebar from '../../components/Sidebar'
import DeleteButton from '../../components/DeleteButton'
import { descargarExcelBonito, nombreArchivoFecha } from '../../utils/exportExcel'

const VINO = 'var(--acento)'
const KEY_EXTERNOS = 'equiposExternos'
const KEY_PROVEEDORES = 'proveedoresExternos'
const KEY_TIPOS = 'tiposEquipoInterno' // mismo catálogo de tipos que Equipos Internos

const TIPOS_INICIALES = ['Manipulador telescópico','Montacargas','Plataforma de tijera','Plataforma articulada','Minicargador','Retroexcavadora','Torre de iluminación','Generador']

const PERIODOS = ['Diario','Semanal','Mensual','Total del proyecto']

const EQUIPO_NUEVO = {
  id:'',tipo:'',marca:'',modelo:'',serie:'',
  proveedor:'',contactoProveedor:'',telProveedor:'',
  cliente:'',ubicacion:'',
  fechaInicio:'',fechaFinEstimada:'',fechaDevolucion:'',
  costoProveedor:'',periodoCosto:'Diario',precioCliente:'',
  estado:'Rentado',notas:'',
  ultimoMantto:'',proximoMantto:'',realizadoPor:'',linkReporte:''
}

const S = {
  page:{padding:'24px 28px',fontFamily:'inherit',color:'#222',flex:1,overflowY:'auto'},
  h1:{fontSize:30,fontWeight:800,margin:0,letterSpacing:0.5},
  h2:{fontSize:20,fontWeight:800,marginTop:0},
  sub:{color:'#777',margin:'4px 0 0',fontSize:14},
  card:{background:'#fff',border:'1px solid #e6e6e6',borderRadius:10,padding:24,marginBottom:28,boxShadow:'0 1px 3px rgba(0,0,0,.05)'},
  btn:{background:VINO,color:'#fff',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  btnSm:{background:VINO,color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:700,cursor:'pointer',fontSize:13},
  btnGris:{background:'#e9e9e9',color:'#333',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  btnGrisSm:{background:'#e9e9e9',color:'#333',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:700,cursor:'pointer',fontSize:13},
  btnVerde:{background:'#1f8b4c',color:'#fff',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  input:{width:'100%',padding:'11px 12px',border:'1px solid #d8d8d8',borderRadius:6,fontSize:14,boxSizing:'border-box',background:'#fff'},
  label:{fontSize:12,fontWeight:700,color:'#666',marginBottom:5,display:'block'},
  th:{textAlign:'left',padding:'12px 10px',fontSize:12,letterSpacing:0.5,color:'#fff',background:'#222',fontWeight:700,whiteSpace:'nowrap'},
  td:{padding:'11px 10px',borderBottom:'1px solid #eee',fontSize:14},
  equis:{background:'transparent',border:'none',color:'#c62828',fontSize:18,fontWeight:700,cursor:'pointer',lineHeight:1,padding:'2px 6px',borderRadius:4},
  modalBg:{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:30,overflowY:'auto',zIndex:999},
  modal:{background:'#fff',borderRadius:10,padding:26,width:'100%',maxWidth:820},
  grid2:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:14},
  grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:14},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:14},
}

function uid(){return 'x'+Date.now()+Math.random().toString(36).slice(2,6)}
function fFecha(f){return f?new Date(f+'T00:00:00').toLocaleDateString('es-MX'):'—'}
function diasPara(f){if(!f)return null;const h=new Date();h.setHours(0,0,0,0);return Math.round((new Date(f+'T00:00:00')-h)/86400000)}

function SemaforoMantto({fecha}){
  const d=diasPara(fecha)
  if(d===null)return <span style={{color:'#999'}}>Sin fecha</span>
  let color='#1f8b4c',texto='Faltan '+d+' d'
  if(d<0){color='#c62828';texto='Vencido '+Math.abs(d)+' d'} else if(d<=15){color='#c98a00'}
  return(<span style={{display:'inline-flex',alignItems:'center',gap:7}}><span style={{width:9,height:9,borderRadius:'50%',background:color,display:'inline-block'}}/><span>{fFecha(fecha)}</span><span style={{color,fontSize:12,fontWeight:700}}>({texto})</span></span>)
}

function linkSeguro(u){
  const t=(u||'').trim()
  if(!t)return ''
  return /^https?:\/\//i.test(t)?t:'https://'+t
}

function BadgeEstado({estado}){
  const map={
    'Rentado':{bg:'#e3f2fd',c:'#1565c0'},
    'Reservado':{bg:'#fff3e0',c:'#c98a00'},
    'Devuelto':{bg:'#eeeeee',c:'#666'}
  }
  const s=map[estado]||map['Rentado']
  return <span style={{background:s.bg,color:s.c,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{estado}</span>
}

function SemaforoFin({fecha,estado}){
  if(estado==='Devuelto')return <span style={{color:'#999'}}>—</span>
  const d=diasPara(fecha)
  if(d===null)return <span style={{color:'#999'}}>Sin fecha</span>
  let color='#1f8b4c',texto='Faltan '+d+' d'
  if(d<0){color='#c62828';texto='Vencido '+Math.abs(d)+' d'} else if(d<=3){color='#c98a00'}
  return(<span style={{display:'inline-flex',alignItems:'center',gap:7}}><span style={{width:9,height:9,borderRadius:'50%',background:color,display:'inline-block'}}/><span>{fFecha(fecha)}</span><span style={{color,fontSize:12,fontWeight:700}}>({texto})</span></span>)
}

export default function EquiposExternos(){
  const[equipos,guardarEquipos]=useListaCompartida('equipos_externos')
  const[proveedores,guardarProveedores]=useListaCatalogo('proveedores')
  const[tipos,guardarTipos]=useListaCatalogo('tipos_equipo',TIPOS_INICIALES)
  const[modal,setModal]=useState(false)
  const[form,setForm]=useState(EQUIPO_NUEVO)
  const[modoNuevoProveedor,setModoNuevoProveedor]=useState(false)
  const[nuevoProveedor,setNuevoProveedor]=useState('')
  const[modoNuevoTipoForm,setModoNuevoTipoForm]=useState(false)
  const[nuevoTipoForm,setNuevoTipoForm]=useState('')
  const[busqueda,setBusqueda]=useState('')
  const[fEstado,setFEstado]=useState('')
  const[fProveedor,setFProveedor]=useState('')

  function abrirNuevo(){setForm({...EQUIPO_NUEVO,id:'EXT-'+Date.now(),fechaInicio:new Date().toISOString().slice(0,10)});setModoNuevoProveedor(false);setModoNuevoTipoForm(false);setModal(true)}
  function abrirEditar(eq){setForm({...EQUIPO_NUEVO,...eq});setModoNuevoProveedor(false);setModoNuevoTipoForm(false);setModal(true)}
  function guardarForm(){
    if(!form.tipo.trim()){alert('Selecciona el tipo de equipo.');return}
    if(!form.proveedor.trim()){alert('Indica de qué proveedor se subarrienda el equipo.');return}
    const existe=equipos.some(e=>e.id===form.id)
    const lista=existe?equipos.map(e=>e.id===form.id?{...e,...form}:e):[...equipos,form]
    guardarEquipos(lista);setModal(false)
  }
  function eliminarEquipo(eq){
    guardarEquipos(equipos.filter(e=>e.id!==eq.id))
  }
  function marcarDevuelto(eq){
    guardarEquipos(equipos.map(e=>e.id===eq.id?{...e,estado:'Devuelto',fechaDevolucion:new Date().toISOString().slice(0,10)}:e))
  }
  function agregarProveedor(){const n=nuevoProveedor.trim();if(!n)return;if(!proveedores.includes(n))guardarProveedores([...proveedores,n].sort());setForm({...form,proveedor:n});setNuevoProveedor('');setModoNuevoProveedor(false)}
  function cambiarProveedor(v){if(v==='__nuevo__'){setModoNuevoProveedor(true);return};setModoNuevoProveedor(false);setForm({...form,proveedor:v})}
  function agregarTipoDesdeForm(){const n=nuevoTipoForm.trim();if(!n)return;if(!tipos.includes(n))guardarTipos([...tipos,n].sort());setForm({...form,tipo:n});setNuevoTipoForm('');setModoNuevoTipoForm(false)}
  function cambiarTipoForm(v){if(v==='__nuevo__'){setModoNuevoTipoForm(true);return};setModoNuevoTipoForm(false);setForm({...form,tipo:v})}

  const filtrados=equipos.filter(e=>{
    const t=(e.tipo+' '+e.marca+' '+e.modelo+' '+e.serie+' '+e.cliente+' '+e.proveedor).toLowerCase()
    return t.includes(busqueda.toLowerCase())&&(!fEstado||e.estado===fEstado)&&(!fProveedor||e.proveedor===fProveedor)
  })

  function exportarLista(){
    const columnas=['Equipo','Marca','Modelo','Serie','Proveedor','Cliente','Estado','Fecha inicio','Fecha fin estimada','Último mantto','Próximo mantto','Realizado por','Reporte fotográfico']
    const filas=filtrados.map(e=>[e.tipo,e.marca,e.modelo,e.serie,e.proveedor,e.cliente,e.estado,fFecha(e.fechaInicio),fFecha(e.fechaFinEstimada),fFecha(e.ultimoMantto),fFecha(e.proximoMantto),e.realizadoPor||'',linkSeguro(e.linkReporte)])
    descargarExcelBonito({
      titulo:'Equipos Externos',
      subtitulo:'Maquinaria subarrendada de terceros · '+filtrados.length+' registros',
      columnas,filas,
      nombreArchivo:nombreArchivoFecha('EQ-EXTERNOS')
    })
  }

  const activos=equipos.filter(e=>e.estado!=='Devuelto').length

  return(
    <div style={{display:'flex',minHeight:'100vh'}}><Sidebar/><div style={S.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h1 style={S.h1}>Equipos Externos</h1><p style={S.sub}>Maquinaria que subarrendamos de terceros para clientes · {activos} activos de {equipos.length} registrados</p></div>
        <div style={{display:'flex',gap:10}}><button style={S.btnGris} onClick={exportarLista}>Descargar lista</button><button style={S.btn} onClick={abrirNuevo}>+ Agregar equipo subarrendado</button></div>
      </div>

      <div style={S.card}>
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr',gap:18,alignItems:'end'}}>
          <div><label style={S.label}>BUSCAR</label><input style={S.input} placeholder="Equipo, marca, modelo, cliente o proveedor" value={busqueda} onChange={ev=>setBusqueda(ev.target.value)}/></div>
          <div><label style={S.label}>ESTADO</label><select style={S.input} value={fEstado} onChange={ev=>setFEstado(ev.target.value)}><option value="">Todos</option><option>Rentado</option><option>Reservado</option><option>Devuelto</option></select></div>
          <div><label style={S.label}>PROVEEDOR</label><select style={S.input} value={fProveedor} onChange={ev=>setFProveedor(ev.target.value)}><option value="">Todos</option>{proveedores.map(p=><option key={p}>{p}</option>)}</select></div>
        </div>
      </div>

      <div style={{...S.card,padding:0,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1350}}>
          <thead><tr>
            <th style={S.th}>EQUIPO</th><th style={S.th}>MARCA / MODELO</th><th style={S.th}>PROVEEDOR</th><th style={S.th}>CLIENTE</th>
            <th style={S.th}>ESTADO</th><th style={S.th}>INICIO</th><th style={S.th}>FIN ESTIMADO</th>
            <th style={S.th}>ÚLTIMO MANTTO</th><th style={S.th}>PRÓXIMO MANTTO</th><th style={S.th}>REALIZÓ</th><th style={S.th}>REPORTE</th>
<th style={{...S.th,width:90,textAlign:'center'}}></th>
          </tr></thead>
          <tbody>
            {filtrados.length===0?<tr><td style={{...S.td,textAlign:'center',color:'#999',padding:40}} colSpan={12}>No hay equipos subarrendados registrados. Usa "+ Agregar equipo subarrendado".</td></tr>
            :filtrados.map(e=>(<tr key={e.id} onMouseOver={ev=>ev.currentTarget.style.background='#faf5f6'} onMouseOut={ev=>ev.currentTarget.style.background='transparent'}>
              <td style={{...S.td,fontWeight:700,cursor:'pointer'}} onClick={()=>abrirEditar(e)}>{e.tipo}</td>
              <td style={S.td}>{e.marca} {e.modelo}{e.serie?<div style={{color:'#999',fontSize:12}}>Serie: {e.serie}</div>:null}</td>
              <td style={S.td}>{e.proveedor}{e.telProveedor?<div style={{color:'#999',fontSize:12}}>{e.telProveedor}</div>:null}</td>
              <td style={S.td}>{e.cliente||<span style={{color:'#bbb'}}>—</span>}</td>
              <td style={S.td}><BadgeEstado estado={e.estado}/></td>
              <td style={S.td}>{fFecha(e.fechaInicio)}</td>
              <td style={S.td}><SemaforoFin fecha={e.fechaFinEstimada} estado={e.estado}/></td>
              <td style={S.td}>{fFecha(e.ultimoMantto)}</td>
              <td style={S.td}>{e.estado==='Devuelto'?<span style={{color:'#999'}}>—</span>:<SemaforoMantto fecha={e.proximoMantto}/>}</td>
              <td style={S.td}>{e.realizadoPor||<span style={{color:'#bbb'}}>—</span>}</td>
              <td style={S.td}>{e.linkReporte?<a href={linkSeguro(e.linkReporte)} target="_blank" rel="noopener noreferrer" style={{color:VINO,fontWeight:700}} onClick={ev=>ev.stopPropagation()}>Ver reporte</a>:<span style={{color:'#bbb'}}>—</span>}</td>
              <td style={{...S.td,textAlign:'center',whiteSpace:'nowrap'}}>
                {e.estado!=='Devuelto'&&<button style={S.btnGrisSm} onClick={()=>marcarDevuelto(e)} title="Marcar como devuelto al proveedor">✓ Devolver</button>}
                <span style={{marginLeft:6,display:'inline-block'}}><DeleteButton size="sm" title="Eliminar equipo" onConfirm={()=>eliminarEquipo(e)}/></span>
              </td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {/* MODAL ALTA/EDICIÓN */}
      {modal&&(<div style={S.modalBg} onClick={()=>setModal(false)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
        <h2 style={{fontSize:22,fontWeight:800,margin:0}}>{equipos.some(e=>e.id===form.id)?'Editar equipo subarrendado':'Nuevo equipo subarrendado'}</h2>
        <p style={{color:'#888',fontSize:13,margin:'4px 0 18px'}}>Maquinaria que no es de MAQSOL, rentada a un tercero para cubrir a un cliente.</p>

        <div style={S.grid3}>
          <div><label style={S.label}>TIPO DE EQUIPO</label>
            {modoNuevoTipoForm?(<div style={{display:'flex',gap:8}}><input style={S.input} autoFocus placeholder="Ej. Excavadora" value={nuevoTipoForm} onChange={ev=>setNuevoTipoForm(ev.target.value)}/><button style={S.btnVerde} onClick={agregarTipoDesdeForm}>Guardar</button><button style={S.btnGris} onClick={()=>setModoNuevoTipoForm(false)}>✕</button></div>)
            :(<select style={S.input} value={form.tipo} onChange={ev=>cambiarTipoForm(ev.target.value)}><option value="">Selecciona un tipo</option>{tipos.map(t=><option key={t}>{t}</option>)}<option value="__nuevo__">+ Agregar tipo nuevo</option></select>)}
          </div>
          <div><label style={S.label}>MARCA</label><input style={S.input} value={form.marca} onChange={ev=>setForm({...form,marca:ev.target.value})}/></div>
          <div><label style={S.label}>MODELO</label><input style={S.input} value={form.modelo} onChange={ev=>setForm({...form,modelo:ev.target.value})}/></div>
        </div>

        <div style={S.grid3}>
          <div><label style={S.label}>SERIE</label><input style={S.input} value={form.serie} onChange={ev=>setForm({...form,serie:ev.target.value})}/></div>
          <div><label style={S.label}>UBICACIÓN / OBRA</label><input style={S.input} value={form.ubicacion} onChange={ev=>setForm({...form,ubicacion:ev.target.value})}/></div>
          <div><label style={S.label}>ESTADO</label><select style={S.input} value={form.estado} onChange={ev=>setForm({...form,estado:ev.target.value})}><option>Reservado</option><option>Rentado</option><option>Devuelto</option></select></div>
        </div>

        <h3 style={{fontSize:15,fontWeight:800,margin:'8px 0 10px',color:VINO}}>Proveedor (de quién lo subarrendamos)</h3>
        <div style={S.grid3}>
          <div><label style={S.label}>PROVEEDOR</label>
            {modoNuevoProveedor?(<div style={{display:'flex',gap:8}}><input style={S.input} autoFocus placeholder="Nombre de la empresa" value={nuevoProveedor} onChange={ev=>setNuevoProveedor(ev.target.value)}/><button style={S.btnVerde} onClick={agregarProveedor}>Guardar</button><button style={S.btnGris} onClick={()=>setModoNuevoProveedor(false)}>✕</button></div>)
            :(<select style={S.input} value={form.proveedor} onChange={ev=>cambiarProveedor(ev.target.value)}><option value="">Selecciona un proveedor</option>{proveedores.map(p=><option key={p}>{p}</option>)}<option value="__nuevo__">+ Agregar proveedor</option></select>)}
          </div>
          <div><label style={S.label}>CONTACTO</label><input style={S.input} value={form.contactoProveedor} onChange={ev=>setForm({...form,contactoProveedor:ev.target.value})}/></div>
          <div><label style={S.label}>TELÉFONO</label><input style={S.input} value={form.telProveedor} onChange={ev=>setForm({...form,telProveedor:ev.target.value})}/></div>
        </div>

        <h3 style={{fontSize:15,fontWeight:800,margin:'8px 0 10px',color:VINO}}>Cliente y fechas</h3>
        <div style={S.grid3}>
          <div><label style={S.label}>CLIENTE ASIGNADO</label><input style={S.input} value={form.cliente} onChange={ev=>setForm({...form,cliente:ev.target.value})} placeholder="A quién se le renta"/></div>
          <div><label style={S.label}>FECHA INICIO</label><input type="date" style={S.input} value={form.fechaInicio} onChange={ev=>setForm({...form,fechaInicio:ev.target.value})}/></div>
          <div><label style={S.label}>FECHA FIN ESTIMADA</label><input type="date" style={S.input} value={form.fechaFinEstimada} onChange={ev=>setForm({...form,fechaFinEstimada:ev.target.value})}/></div>
        </div>

        <h3 style={{fontSize:15,fontWeight:800,margin:'8px 0 10px',color:VINO}}>Mantenimiento</h3>
        <div style={S.grid3}>
          <div><label style={S.label}>ÚLTIMO MANTTO</label><input type="date" style={S.input} value={form.ultimoMantto} onChange={ev=>setForm({...form,ultimoMantto:ev.target.value})}/></div>
          <div><label style={S.label}>PRÓXIMO MANTTO</label><input type="date" style={S.input} value={form.proximoMantto} onChange={ev=>setForm({...form,proximoMantto:ev.target.value})}/></div>
          <div><label style={S.label}>REALIZADO POR</label><input style={S.input} value={form.realizadoPor} onChange={ev=>setForm({...form,realizadoPor:ev.target.value})} placeholder="Técnico o empresa que lo hizo"/></div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={S.label}>LINK DEL REPORTE FOTOGRÁFICO (nube)</label>
          <div style={{display:'flex',gap:8}}>
            <input style={S.input} value={form.linkReporte} onChange={ev=>setForm({...form,linkReporte:ev.target.value})} placeholder="Pega aquí el enlace de OneDrive, Drive, etc."/>
            {form.linkReporte.trim()&&<a href={linkSeguro(form.linkReporte)} target="_blank" rel="noopener noreferrer" style={{...S.btnGris,textDecoration:'none',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center'}}>Abrir</a>}
          </div>
        </div>

        <h3 style={{fontSize:15,fontWeight:800,margin:'8px 0 10px',color:VINO}}>Costos</h3>
        <div style={S.grid3}>
          <div><label style={S.label}>COSTO AL PROVEEDOR</label><input style={S.input} value={form.costoProveedor} onChange={ev=>setForm({...form,costoProveedor:ev.target.value})} placeholder="Ej. 2500"/></div>
          <div><label style={S.label}>PERIODO DEL COSTO</label><select style={S.input} value={form.periodoCosto} onChange={ev=>setForm({...form,periodoCosto:ev.target.value})}>{PERIODOS.map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label style={S.label}>PRECIO AL CLIENTE (opcional)</label><input style={S.input} value={form.precioCliente} onChange={ev=>setForm({...form,precioCliente:ev.target.value})} placeholder="Para ver el margen"/></div>
        </div>

        <div style={{marginBottom:20}}><label style={S.label}>NOTAS</label><textarea style={{...S.input,minHeight:70,resize:'vertical'}} value={form.notas} onChange={ev=>setForm({...form,notas:ev.target.value})}/></div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:10}}><button style={S.btnGris} onClick={()=>setModal(false)}>Cancelar</button><button style={S.btn} onClick={guardarForm}>Guardar</button></div>
      </div></div>)}

    </div></div>
  )
}
