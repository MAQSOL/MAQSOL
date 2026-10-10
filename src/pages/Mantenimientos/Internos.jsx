import { useRef, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import { descargarExcelBonito, nombreArchivoFecha } from '../../utils/exportExcel'
import { abrirDocPDF, encabezadoDoc, pieDoc, hoyMX, esc } from '../../utils/pdfFormato'
import DeleteButton from '../../components/DeleteButton'
import { useSharedTable, useCatalogo } from '../../hooks/useSharedTable'
import QrEquipoModal from '../../components/QrEquipoModal'
import { conHoras } from '../../utils/horometro'
import CampoDiferido from '../../components/CampoDiferido'

const VINO = 'var(--acento)'
const KEY_EQUIPOS = 'equiposInternos'
const KEY_OPERADORES = 'operadoresMaqsol'
const KEY_TIPOS = 'tiposEquipoInterno'
const KEY_UBICACIONES = 'ubicacionesMaqsol'

const TIPOS_INICIALES = ['Manipulador telescópico','Montacargas','Plataforma de tijera','Plataforma articulada','Minicargador','Retroexcavadora','Torre de iluminación','Generador']

const TIPOS_FILTRO = ['Aceite','Aire primario','Aire secundario','Aire de cabina','Aire acondicionado','Aire (tercer filtro)','Combustible','Hidráulico','Otro']
// filtros guardados antes como 'Aire' (sin especificar) siguen apareciendo en su lista hasta que se cambien
// clase del filtro para agruparlos en la ficha (los recién agregados, sin tipo, van arriba)
const CLASES_FILTRO = ['Sin tipo','Aire','Aceite','Combustible','Hidráulico','Otro']
const claseFiltro = (tipo) => !tipo ? 'Sin tipo' : /^aire/i.test(tipo) ? 'Aire' : (['Aceite','Combustible','Hidráulico'].includes(tipo) ? tipo : 'Otro')
// orden: por clase, luego por tipo (primario, secundario, cabina...), y si empatan, como se capturaron
const ordenarFiltros = (lista) => (lista||[]).map((f,i)=>({f,i})).sort((a,b)=>
  CLASES_FILTRO.indexOf(claseFiltro(a.f.tipo))-CLASES_FILTRO.indexOf(claseFiltro(b.f.tipo)) ||
  TIPOS_FILTRO.indexOf(a.f.tipo)-TIPOS_FILTRO.indexOf(b.f.tipo) || a.i-b.i).map(x=>x.f)
// marcas más usadas; "Otra" deja escribir cualquier otra
const MARCAS_FILTRO = ['Donaldson','Fleetguard','Baldwin','MANN-FILTER','WIX','Caterpillar (Cat)','John Deere','Genie original']
function MarcaFiltro({valor,onGuardar}){
  const[otra,setOtra]=useState(!!valor&&!MARCAS_FILTRO.includes(valor))
  return(<div style={{display:'grid',gap:6}}>
    <select style={S.inputSm} value={otra?'__otra__':(valor||'')} onChange={ev=>{const v=ev.target.value;if(v==='__otra__'){setOtra(true);return}setOtra(false);onGuardar(v)}}>
      <option value="">Elige marca…</option>
      {MARCAS_FILTRO.map(m=><option key={m} value={m}>{m}</option>)}
      <option value="__otra__">Otra marca…</option>
    </select>
    {otra&&<CampoDiferido style={S.inputSm} valor={MARCAS_FILTRO.includes(valor)?'':valor} placeholder="Escribe la marca" onGuardar={onGuardar}/>}
  </div>)
}
const tiposFiltroCon = (actual) => (actual && !TIPOS_FILTRO.includes(actual) ? [actual, ...TIPOS_FILTRO] : TIPOS_FILTRO)
// botón chico para poner N/A (horómetro descompuesto, maquinaria sin placas)
const botonNA = {border:'1px solid #ddd',background:'#fafafa',color:'#666',borderRadius:4,padding:'0 6px',fontSize:10.5,fontWeight:700,cursor:'pointer',lineHeight:'16px'}

const EQUIPO_NUEVO = {
  id:'',tipo:'',marca:'',modelo:'',serie:'',horometro:'',operador:'',ubicacion:'',
  proximoMantto:'',anio:'',motor:'',capacidad:'',alturaMaxima:'',combustible:'',placas:'',notas:'',fotoUrl:'',
  filtros:[],suministros:[],pendientes:[],mantenimientos:[]
}

const MANTTO_NUEVO = {
  mid:'',tipoMantto:'Preventivo',fecha:'',horometro:'',proximoMantto:'',descripcion:'',
  filtrosUsados:[],aceiteDetalle:'',grasaDetalle:'',realizadoPor:'',autorizadoPor:'',
  lugarRealizado:'',pdfUrl:'',costo:'',extras:[]
}

const UBICACIONES_INICIALES = ['Patio MAQSOL','Cancún','Playa del Carmen','Tulum','Mérida','Chetumal','Cozumel','Taller','En tránsito']

const S = {
  page:{padding:'24px 28px',fontFamily:'inherit',color:'#222',flex:1,overflowY:'auto'},
  h1:{fontSize:30,fontWeight:800,margin:0,letterSpacing:0.5},
  h2:{fontSize:20,fontWeight:800,marginTop:0},
  sub:{color:'#777',margin:'4px 0 0',fontSize:14},
card:{background:'#fff',border:'1px solid #e6e6e6',borderRadius:10,padding:24,marginBottom:28,boxShadow:'0 1px 3px rgba(0,0,0,.05)'},  btn:{background:VINO,color:'#fff',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  btnSm:{background:VINO,color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:700,cursor:'pointer',fontSize:13},
  btnGris:{background:'#e9e9e9',color:'#333',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  btnGrisSm:{background:'#e9e9e9',color:'#333',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:700,cursor:'pointer',fontSize:13},
  btnVerde:{background:'#1f8b4c',color:'#fff',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  input:{width:'100%',padding:'11px 12px',border:'1px solid #d8d8d8',borderRadius:6,fontSize:14,boxSizing:'border-box',background:'#fff'},
  inputSm:{width:'100%',padding:'8px 10px',border:'1px solid #e0e0e0',borderRadius:5,fontSize:14,boxSizing:'border-box',background:'#fff'},
  label:{fontSize:12,fontWeight:700,color:'#666',marginBottom:5,display:'block'},
  th:{textAlign:'left',padding:'12px 10px',fontSize:12,letterSpacing:0.5,color:'#fff',background:'#222',fontWeight:700,whiteSpace:'nowrap'},
  td:{padding:'11px 10px',borderBottom:'1px solid #eee',fontSize:14},
  equis:{background:'transparent',border:'none',color:'#c62828',fontSize:18,fontWeight:700,cursor:'pointer',lineHeight:1,padding:'2px 6px',borderRadius:4},
  modalBg:{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:30,overflowY:'auto',zIndex:999},
  modal:{background:'#fff',borderRadius:10,padding:26,width:'100%',maxWidth:920},
  grid2:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:14},
  grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:14},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:14},
  check:{display:'flex',alignItems:'center',gap:8,fontSize:14,cursor:'pointer',padding:'4px 0'}
}

function diasPara(f){if(!f)return null;const h=new Date();h.setHours(0,0,0,0);return Math.round((new Date(f+'T00:00:00')-h)/86400000)}
function fFecha(f){return f?new Date(f+'T00:00:00').toLocaleDateString('es-MX'):'—'}
function uid(){return 'x'+Date.now()+Math.random().toString(36).slice(2,6)}

function comprimirImagen(file,maxAncho=800){
  return new Promise((resolve)=>{
    const reader=new FileReader()
    reader.onload=(ev)=>{
      const img=new Image()
      img.onload=()=>{
        const canvas=document.createElement('canvas')
        let w=img.width,h=img.height
        if(w>maxAncho){h=Math.round(h*(maxAncho/w));w=maxAncho}
        canvas.width=w;canvas.height=h
        canvas.getContext('2d').drawImage(img,0,0,w,h)
        resolve(canvas.toDataURL('image/jpeg',0.7))
      }
      img.src=ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

function Semaforo({fecha}){
  const d=diasPara(fecha)
  if(d===null)return <span style={{color:'#999'}}>Sin fecha</span>
  let color='#1f8b4c',texto='Faltan '+d+' d'
  if(d<0){color='#c62828';texto='Vencido '+Math.abs(d)+' d'} else if(d<=15){color='#c98a00'}
  return(<span style={{display:'inline-flex',alignItems:'center',gap:7}}><span style={{width:9,height:9,borderRadius:'50%',background:color,display:'inline-block'}}/><span>{fFecha(fecha)}</span><span style={{color,fontSize:12,fontWeight:700}}>({texto})</span></span>)
}

function ultimoMantto(eq){
  const l=Array.isArray(eq.mantenimientos)?eq.mantenimientos:[]
  if(!l.length)return null
  return l.slice().sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''))[0]
}
function BadgeMantto({tipo}){
  if(!tipo)return <span style={{color:'#bbb'}}>—</span>
  const prev=tipo==='Preventivo'
  return <span style={{background:prev?'#e8f5e9':'#fce4ec',color:prev?'#2e7d32':'#c62828',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{tipo}</span>
}

// observaciones del equipo: antes era un solo texto (notas); ahora es una lista con fecha.
// La nota vieja aparece como la primera de la lista y se migra en cuanto se toca algo.
const notasDe=(a)=>(a.notasLista&&a.notasLista.length)?a.notasLista:(a.notas?[{id:'nota-anterior',texto:a.notas,fecha:''}]:[])

function NotasEquipo({lista,onCambiar}){
  const[nueva,setNueva]=useState('')
  const[editando,setEditando]=useState(null)   // {id, texto}
  const hoy=()=>new Date().toISOString().slice(0,10)
  const agregar=()=>{const t=nueva.trim();if(!t)return;onCambiar([{id:uid(),texto:t,fecha:hoy()},...lista]);setNueva('')}
  const guardarEdicion=()=>{const t=editando.texto.trim();if(!t)return;onCambiar(lista.map(n=>n.id===editando.id?{...n,texto:t,editada:hoy()}:n));setEditando(null)}
  const chico={...S.btnGris,padding:'6px 12px',fontSize:13}
  return(<>
    <h2 style={S.h2}>Notas y observaciones del equipo</h2>
    <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:6}}>
      <textarea style={{...S.input,minHeight:60,resize:'vertical',flex:1}} value={nueva} placeholder="Nueva observación de la máquina..." onChange={ev=>setNueva(ev.target.value)} onKeyDown={ev=>{if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey))agregar()}}/>
      <button style={S.btn} onClick={agregar}>Agregar</button>
    </div>
    {lista.length===0?<div style={{color:'#999',fontSize:14}}>Sin observaciones.</div>:lista.map(n=>(
      <div key={n.id} style={{borderTop:'1px solid #eee',padding:'10px 0',display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,color:'#999',marginBottom:3}}>{n.fecha?fFecha(n.fecha):'Nota anterior'}{n.editada?' · editada '+fFecha(n.editada):''}</div>
          {editando&&editando.id===n.id?(<>
            <textarea autoFocus style={{...S.input,minHeight:60,resize:'vertical'}} value={editando.texto} onChange={ev=>setEditando({...editando,texto:ev.target.value})}/>
            <div style={{display:'flex',gap:8,marginTop:6}}><button style={{...S.btn,padding:'6px 14px',fontSize:13}} onClick={guardarEdicion}>Guardar</button><button style={chico} onClick={()=>setEditando(null)}>Cancelar</button></div>
          </>):<div style={{whiteSpace:'pre-wrap',fontSize:14.5}}>{n.texto}</div>}
        </div>
        {!(editando&&editando.id===n.id)&&<div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
          <button style={chico} onClick={()=>setEditando({id:n.id,texto:n.texto})}>Editar</button>
          <DeleteButton size="sm" title="Eliminar observación" onConfirm={()=>onCambiar(lista.filter(x=>x.id!==n.id))}/>
        </div>}
      </div>
    ))}
  </>)
}

// dato de la ficha (etiqueta + valor); fuera del render para que React no lo recree en cada pintada
function Dato({etiqueta,valor}){return(<div style={{marginBottom:14}}><div style={S.label}>{etiqueta}</div><div style={{fontSize:15}}>{valor||<span style={{color:'#bbb'}}>—</span>}</div></div>)}

// migrar filtros viejos (strings) al formato nuevo (array)
function migrarEquipo(eq){
  if(eq.filtros && Array.isArray(eq.filtros)) return eq
  const filtros=[]
  const viejos=[['filtroAceite','Aceite'],['filtroAire','Aire'],['filtroCombustible','Combustible'],['filtroHidraulico','Hidráulico'],['filtroOtros','Otro']]
  viejos.forEach(([key,tipo])=>{ if(eq[key]) filtros.push({id:uid(),tipo,marca:'',parte:eq[key]}) })
  const copia={...eq,filtros,suministros:eq.suministros||[],pendientes:eq.pendientes||[]}
  viejos.forEach(([key])=>delete copia[key])
  // migrar mantenimientos al nuevo formato de filtrosUsados
  if(copia.mantenimientos){
    copia.mantenimientos=copia.mantenimientos.map(m=>{
      if(m.filtrosUsados) return m
      const fu=[]
      if(m.filtrosAceite) fu.push('Aceite')
      if(m.filtrosAire) fu.push('Aire')
      if(m.filtroCombustible) fu.push('Combustible')
      if(m.filtroHidraulico) fu.push('Hidráulico')
      if(m.filtroOtros) fu.push('Otro')
      return {...m,filtrosUsados:fu}
    })
  }
  return copia
}

export default function EquiposInternos(){
  const{registros:equiposRaw,loading:cargandoEquipos,guardar:guardarEquipoRow,eliminar:eliminarEquipoRow}=useSharedTable('equipos_internos')
  const equipos=equiposRaw.map(migrarEquipo)
  const{valores:operadores,agregar:agregarOperadorCat}=useCatalogo('operadores')
  const{valores:tiposRaw,agregar:agregarTipoCat,quitar:quitarTipoCat}=useCatalogo('tipos_equipo')
  const tipos=tiposRaw.length?tiposRaw:TIPOS_INICIALES
  const{valores:ubicacionesRaw,agregar:agregarUbicacionCat}=useCatalogo('ubicaciones')
  const ubicaciones=ubicacionesRaw.length?ubicacionesRaw:UBICACIONES_INICIALES
  const[vista,setVista]=useState('lista')
  const[activoId,setActivoId]=useState(null)
  const[modal,setModal]=useState(false)
  const[modalQr,setModalQr]=useState(false)
  const[form,setForm]=useState(EQUIPO_NUEVO)
  const[modoNuevoOperador,setModoNuevoOperador]=useState(false)
  const[nuevoOperador,setNuevoOperador]=useState('')
  const[modoNuevaUbicacion,setModoNuevaUbicacion]=useState(false)
  const[nuevaUbicacion,setNuevaUbicacion]=useState('')
  const[modoNuevoTipoForm,setModoNuevoTipoForm]=useState(false)
  const[nuevoTipoForm,setNuevoTipoForm]=useState('')
  const[modoNuevoTipoFiltro,setModoNuevoTipoFiltro]=useState(false)
  const[nuevoTipoFiltro,setNuevoTipoFiltro]=useState('')
  const[busqueda,setBusqueda]=useState('')
  const[fTipo,setFTipo]=useState('')
  const[modalMantto,setModalMantto]=useState(false)
  const[mForm,setMForm]=useState(MANTTO_NUEVO)
  const[verMantto,setVerMantto]=useState(null)
  const[filtroTipoM,setFiltroTipoM]=useState('')
  const[filtroDesde,setFiltroDesde]=useState('')
  const[filtroHasta,setFiltroHasta]=useState('')

  // Mientras hay guardados en camino, cada cambio nuevo parte de lo ÚLTIMO que se mandó
  // (no de lo que había en pantalla), para que dos cambios seguidos no se pisen.
  const ultimoEnviado=useRef({})
  const enVuelo=useRef(0)
  async function guardarRapido(id,datos){
    ultimoEnviado.current[id]=datos;enVuelo.current++
    try{await guardarEquipoRow(id,datos)}finally{enVuelo.current--;if(enVuelo.current===0)ultimoEnviado.current={}}
  }
  function actual(){return ultimoEnviado.current[activoId]||getActivo()}
  function actualizarCampo(c,v){const a=actual();if(!a)return;guardarRapido(a.id,{...a,[c]:v})}
  function actualizarCampos(cambios){const a=actual();if(!a)return;guardarRapido(a.id,{...a,...cambios})}
  function getActivo(){return equipos.find(e=>e.id===activoId)}

  // --- equipo CRUD ---
  function abrirNuevo(){setForm({...EQUIPO_NUEVO,id:'EQ-'+Date.now()});setModoNuevoOperador(false);setModoNuevoTipoForm(false);setModoNuevaUbicacion(false);setNuevoOperador('');setNuevoTipoForm('');setModal(true)}
  function abrirEditar(eq){setForm({...EQUIPO_NUEVO,...eq});setModoNuevoOperador(false);setModoNuevoTipoForm(false);setModoNuevaUbicacion(false);setModal(true)}
  async function guardarForm(){
    if(!form.tipo.trim()){alert('Selecciona el tipo de equipo.');return}
    const existe=equipos.some(e=>e.id===form.id)
    const merged=existe?{...equipos.find(e=>e.id===form.id),...form}:form
    const ok=await guardarEquipoRow(form.id,merged)
    if(!ok)return
    setModal(false)
    if(!existe){setActivoId(form.id);setVista('ficha')}
  }
  async function eliminarEquipo(eq){
    await eliminarEquipoRow(eq.id);setVista('lista')
  }
  function agregarOperador(){const n=nuevoOperador.trim();if(!n)return;agregarOperadorCat(n);setForm({...form,operador:n});setNuevoOperador('');setModoNuevoOperador(false)}
  function agregarUbicacion(){const n=nuevaUbicacion.trim();if(!n)return;agregarUbicacionCat(n);setForm({...form,ubicacion:n});setNuevaUbicacion('');setModoNuevaUbicacion(false)}
  function cambiarUbicacion(v){if(v==='__nueva__'){setModoNuevaUbicacion(true);return};setModoNuevaUbicacion(false);setForm({...form,ubicacion:v})}
  function cambiarOperador(v){if(v==='__nuevo__'){setModoNuevoOperador(true);return};setModoNuevoOperador(false);setForm({...form,operador:v})}
  function agregarTipoDesdeForm(){const n=nuevoTipoForm.trim();if(!n)return;agregarTipoCat(n);setForm({...form,tipo:n});setNuevoTipoForm('');setModoNuevoTipoForm(false)}
  function cambiarTipoForm(v){if(v==='__nuevo__'){setModoNuevoTipoForm(true);return};setModoNuevoTipoForm(false);setForm({...form,tipo:v})}
  function agregarTipoDesdeFiltro(){const n=nuevoTipoFiltro.trim();if(!n)return;agregarTipoCat(n);setFTipo(n);setNuevoTipoFiltro('');setModoNuevoTipoFiltro(false)}
  function eliminarTipo(){
    if(!fTipo)return;const u=equipos.filter(e=>e.tipo===fTipo).length
    if(u>0){alert('No se puede quitar "'+fTipo+'" porque hay '+u+' equipo(s) usándolo.');return}
    if(!confirm('¿Quitar "'+fTipo+'"?'))return;quitarTipoCat(fTipo);setFTipo('')
  }

  // --- filtros multi-marca ---
  function agregarFiltro(){const a=actual();if(!a)return;actualizarCampo('filtros',[...(a.filtros||[]),{id:uid(),tipo:'',marca:'',parte:''}])}
  function editarFiltro(fid,campo,valor){const a=actual();if(!a)return;actualizarCampo('filtros',(a.filtros||[]).map(f=>f.id===fid?{...f,[campo]:valor}:f))}
  function quitarFiltro(fid){const a=actual();if(!a)return;actualizarCampo('filtros',(a.filtros||[]).filter(f=>f.id!==fid))}

  // --- suministros ---
  function agregarSuministro(){const a=actual();if(!a)return;actualizarCampo('suministros',[...(a.suministros||[]),{id:uid(),nombre:'',cantidad:'',especificacion:''}])}
  function editarSuministro(sid,campo,valor){const a=actual();if(!a)return;actualizarCampo('suministros',(a.suministros||[]).map(s=>s.id===sid?{...s,[campo]:valor}:s))}
  function quitarSuministro(sid){const a=actual();if(!a)return;actualizarCampo('suministros',(a.suministros||[]).filter(s=>s.id!==sid))}

  // --- pendientes ---
  function agregarPendiente(){const a=actual();if(!a)return;const txt=prompt('Escribe el pendiente:');if(!txt||!txt.trim())return;actualizarCampo('pendientes',[...(a.pendientes||[]),{id:uid(),texto:txt.trim(),hecho:false}])}
  function togglePendiente(pid){const a=actual();if(!a)return;actualizarCampo('pendientes',(a.pendientes||[]).map(p=>p.id===pid?{...p,hecho:!p.hecho}:p))}
  function quitarPendiente(pid){const a=actual();if(!a)return;actualizarCampo('pendientes',(a.pendientes||[]).filter(p=>p.id!==pid))}

  // --- mantenimientos ---
  function abrirNuevoMantto(){setMForm({...MANTTO_NUEVO,mid:'M-'+Date.now(),fecha:new Date().toISOString().slice(0,10),filtrosUsados:[]});setModalMantto(true)}
  function guardarMantto(){
    if(!mForm.fecha&&!mForm.horometro){alert('Llena al menos la fecha o el horómetro.');return}
    const eq=getActivo();if(!eq)return
    const manttos=Array.isArray(eq.mantenimientos)?eq.mantenimientos:[]
    const existe=manttos.some(m=>m.mid===mForm.mid)
    const nuevos=existe?manttos.map(m=>m.mid===mForm.mid?mForm:m):[...manttos,mForm]
    const updates={mantenimientos:nuevos}
    if(mForm.proximoMantto)updates.proximoMantto=mForm.proximoMantto
    guardarEquipoRow(eq.id,{...eq,...updates});setModalMantto(false)
  }
  function editarMantto(m){setMForm({...MANTTO_NUEVO,...m,filtrosUsados:m.filtrosUsados||[]});setModalMantto(true)}
  function eliminarMantto(mid){
    const eq=getActivo();if(!eq)return
    guardarEquipoRow(eq.id,{...eq,mantenimientos:(eq.mantenimientos||[]).filter(m=>m.mid!==mid)});setVerMantto(null)
  }
  function toggleFiltroMantto(fid){
    const lista=mForm.filtrosUsados||[]
    setMForm({...mForm,filtrosUsados:lista.includes(fid)?lista.filter(x=>x!==fid):[...lista,fid]})
  }
  function agregarExtra(){setMForm({...mForm,extras:[...mForm.extras,{nombre:'',valor:''}]})}
  function editarExtra(i,c,v){const cp=[...mForm.extras];cp[i]={...cp[i],[c]:v};setMForm({...mForm,extras:cp})}
  function quitarExtra(i){setMForm({...mForm,extras:mForm.extras.filter((_,idx)=>idx!==i)})}

  function manttosFiltrados(eq){
    return(Array.isArray(eq.mantenimientos)?eq.mantenimientos:[]).filter(m=>{
      if(filtroTipoM&&m.tipoMantto!==filtroTipoM)return false
      if(filtroDesde&&m.fecha<filtroDesde)return false
      if(filtroHasta&&m.fecha>filtroHasta)return false
      return true
    }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''))
  }

  function descargarExcel(eq){
    const l=manttosFiltrados(eq)
    const columnas=['Fecha','Horómetro','Tipo','Descripción','Realizado por','Autorizado por','Lugar','Costo','Próx. Mantto']
    const filas=l.map(m=>[fFecha(m.fecha),m.horometro,m.tipoMantto,m.descripcion,m.realizadoPor,m.autorizadoPor,m.lugarRealizado,m.costo?'$'+m.costo:'',fFecha(m.proximoMantto)])
    descargarExcelBonito({
      titulo:'Historial de Mantenimientos',
      subtitulo:[eq.tipo,eq.marca,eq.modelo].filter(Boolean).join(' ')+(eq.serie?' \u00B7 Serie '+eq.serie:''),
      columnas,filas,
      nombreArchivo:nombreArchivoFecha('MANTTO-'+(eq.serie||eq.tipo||'EQUIPO').toString().toUpperCase().replace(/[^A-Z0-9]/g,''))
    })
  }
  function descargarPDF(eq){
    const l=manttosFiltrados(eq)
    const filas=l.map(m=>`<tr><td>${fFecha(m.fecha)}</td><td class="r">${esc(m.horometro||'—')}</td><td>${esc(m.tipoMantto)}</td><td>${esc(m.descripcion||'')}</td><td>${esc(m.realizadoPor||'')}</td><td>${esc(m.autorizadoPor||'')}</td><td>${esc(m.lugarRealizado||'')}</td><td class="r b">${m.costo?'$'+esc(m.costo):''}</td></tr>`).join('')
    abrirDocPDF({
      nombre:'Historial '+(eq.serie||eq.tipo||''),
      cuerpo:`${encabezadoDoc('Historial de Mantenimientos',[`${eq.tipo||''} ${eq.marca||''} ${eq.modelo||''}`.trim()+' — Serie: '+(eq.serie||'s/n'),'Generado: '+hoyMX()])}
      <table><thead><tr><th>Fecha</th><th class="r">Hrm</th><th>Tipo</th><th>Descripción</th><th>Realizó</th><th>Autorizó</th><th>Lugar</th><th class="r">Costo</th></tr></thead>
      <tbody>${filas||'<tr><td colspan="8" class="c">Sin mantenimientos registrados.</td></tr>'}</tbody></table>
      ${pieDoc()}`
    })
  }

  const filtrados=equipos.filter(e=>{
    const t=(e.tipo+' '+e.marca+' '+e.modelo+' '+e.serie).toLowerCase()
    return t.includes(busqueda.toLowerCase())&&(!fTipo||e.tipo===fTipo)
  })
  function exportarLista(){
    const columnas=['Equipo','Marca','Modelo','Serie','Horómetro','Operador','Ubicación','Próx. Mantto']
    const filas=filtrados.map(e=>[e.tipo,e.marca,e.modelo,e.serie,conHoras(e.horometro),e.operador||'Sin operador',e.ubicacion,fFecha(e.proximoMantto)])
    descargarExcelBonito({
      titulo:'Equipos Internos',
      subtitulo:'Maquinaria propiedad de MAQSOL \u00B7 '+filtrados.length+' equipos',
      columnas,filas,
      nombreArchivo:nombreArchivoFecha('EQ-INTERNOS')
    })
  }

  const activo=equipos.find(e=>e.id===activoId)

  const modalEquipo=modal&&(<div style={S.modalBg} onClick={()=>setModal(false)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
        <h2 style={{fontSize:22,fontWeight:800,margin:0}}>{equipos.some(e=>e.id===form.id)?'Editar datos generales':'Nuevo equipo'}</h2>
        <p style={{color:'#888',fontSize:13,margin:'4px 0 18px'}}>Datos básicos. Filtros, suministros, pendientes y mantto se capturan en la ficha.</p>
        <div style={S.grid3}>
          <div><label style={S.label}>TIPO DE EQUIPO</label>
            {modoNuevoTipoForm?(<div style={{display:'flex',gap:8}}><input style={S.input} autoFocus placeholder="Ej. Excavadora" value={nuevoTipoForm} onChange={ev=>setNuevoTipoForm(ev.target.value)}/><button style={S.btnVerde} onClick={agregarTipoDesdeForm}>Guardar</button><button style={S.btnGris} onClick={()=>setModoNuevoTipoForm(false)}>✕</button></div>)
            :(<select style={S.input} value={form.tipo} onChange={ev=>cambiarTipoForm(ev.target.value)}><option value="">Selecciona un tipo</option>{tipos.map(t=><option key={t}>{t}</option>)}<option value="__nuevo__">+ Agregar tipo nuevo</option></select>)}
          </div>
          <div><label style={S.label}>MARCA</label><input style={S.input} value={form.marca} onChange={ev=>setForm({...form,marca:ev.target.value})}/></div>
          <div><label style={S.label}>MODELO</label><input style={S.input} value={form.modelo} onChange={ev=>setForm({...form,modelo:ev.target.value})}/></div>
        </div>
        <div style={S.grid4}>
          <div><label style={S.label}>SERIE</label><input style={S.input} value={form.serie} onChange={ev=>setForm({...form,serie:ev.target.value})}/></div>
          <div><label style={S.label}>AÑO</label><input style={S.input} value={form.anio} onChange={ev=>setForm({...form,anio:ev.target.value})}/></div>
          <div><label style={{...S.label,display:'flex',justifyContent:'space-between',alignItems:'center'}}>HORÓMETRO<button type="button" style={botonNA} title="El horómetro no sirve" onClick={()=>setForm(f=>({...f,horometro:'N/A'}))}>N/A</button></label><input style={S.input} value={form.horometro} onChange={ev=>setForm({...form,horometro:ev.target.value})} placeholder="Ej. 3450 o N/A"/></div>
          <div><label style={S.label}>PRÓXIMO MANTTO</label><input type="date" style={S.input} value={form.proximoMantto} onChange={ev=>setForm({...form,proximoMantto:ev.target.value})}/></div>
        </div>
        <div style={S.grid3}>
          <div><label style={S.label}>OPERADOR</label>
            {modoNuevoOperador?(<div style={{display:'flex',gap:8}}><input style={S.input} autoFocus placeholder="Nombre" value={nuevoOperador} onChange={ev=>setNuevoOperador(ev.target.value)}/><button style={S.btnVerde} onClick={agregarOperador}>Guardar</button><button style={S.btnGris} onClick={()=>setModoNuevoOperador(false)}>✕</button></div>)
            :(<select style={S.input} value={form.operador} onChange={ev=>cambiarOperador(ev.target.value)}><option value="">Sin operador</option>{operadores.map(o=><option key={o}>{o}</option>)}<option value="__nuevo__">+ Agregar operador</option></select>)}
          </div>
          <div><label style={S.label}>UBICACIÓN</label>
            {modoNuevaUbicacion?(<div style={{display:'flex',gap:8}}><input style={S.input} autoFocus placeholder="Ej. Bacalar" value={nuevaUbicacion} onChange={ev=>setNuevaUbicacion(ev.target.value)}/><button style={S.btnVerde} onClick={agregarUbicacion}>Guardar</button><button style={S.btnGris} onClick={()=>setModoNuevaUbicacion(false)}>✕</button></div>)
            :(<select style={S.input} value={form.ubicacion} onChange={ev=>cambiarUbicacion(ev.target.value)}><option value="">Selecciona</option>{ubicaciones.map(u=><option key={u}>{u}</option>)}<option value="__nueva__">+ Agregar ubicación nueva</option></select>)}
          </div>
          <div><label style={{...S.label,display:'flex',justifyContent:'space-between',alignItems:'center'}}>PLACAS O NÚMERO ECONÓMICO<button type="button" style={botonNA} title="Maquinaria sin placas" onClick={()=>setForm(f=>({...f,placas:'N/A'}))}>N/A</button></label><input style={S.input} value={form.placas} onChange={ev=>setForm({...form,placas:ev.target.value})} placeholder="Placas, No. económico o N/A"/></div>
        </div>
        <div style={{...S.grid4,marginBottom:22}}>
          <div><label style={S.label}>MOTOR</label><input style={S.input} value={form.motor} onChange={ev=>setForm({...form,motor:ev.target.value})}/></div>
          <div><label style={S.label}>CAPACIDAD DE CARGA</label><input style={S.input} value={form.capacidad} onChange={ev=>setForm({...form,capacidad:ev.target.value})} placeholder="Ej. 4,000 kg"/></div>
          <div><label style={S.label}>ALTURA MÁX. DE TRABAJO</label><input style={S.input} value={form.alturaMaxima||''} onChange={ev=>setForm({...form,alturaMaxima:ev.target.value})} placeholder="Ej. 17 m"/></div>
          <div><label style={S.label}>COMBUSTIBLE</label><input style={S.input} value={form.combustible} onChange={ev=>setForm({...form,combustible:ev.target.value})} placeholder="Diésel / Gasolina"/></div>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:10}}><button style={S.btnGris} onClick={()=>setModal(false)}>Cancelar</button><button style={S.btn} onClick={guardarForm}>Guardar y abrir ficha</button></div>
      </div></div>)

  // ========================= FICHA =========================
  if(vista==='ficha'&&activo){
    const mFiltrados=manttosFiltrados(activo)
    const filtrosPorTipo={}
    ;(activo.filtros||[]).forEach(f=>{if(!filtrosPorTipo[f.tipo])filtrosPorTipo[f.tipo]=[];filtrosPorTipo[f.tipo].push(f)})

    return(
      <div style={{display:'flex',minHeight:'100vh'}}><Sidebar/><div style={S.page}>

        {modalQr&&<QrEquipoModal equipo={activo} onGuardarToken={t=>guardarEquipoRow(activo.id,{...activo,qrToken:t})} onCerrar={()=>setModalQr(false)}/>}
        {modalEquipo}

        {/* ENCABEZADO + FOTO */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,gap:20}}>
          <div style={{flex:1}}>
            <h1 style={S.h1}>{activo.tipo||'Equipo'}</h1>
            <p style={S.sub}>{activo.marca} {activo.modelo} · Serie {activo.serie||'s/n'}</p>
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button style={S.btnGris} onClick={()=>setVista('lista')}>← Regresar a la lista</button>
              <button style={S.btn} onClick={()=>abrirEditar(activo)}>Editar datos generales</button>
              <button style={S.btnGris} onClick={()=>setModalQr(true)}>Generar código QR</button>
            </div>
          </div>
   <div style={{flexShrink:0,textAlign:'center'}}>
            {activo.fotoUrl?(
              <div style={{width:220,height:160,borderRadius:10,overflow:'hidden',background:'#fff',border:'1px solid #e6e6e6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                <img src={activo.fotoUrl} alt={activo.tipo} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>
              </div>
            ):(
              <div style={{width:220,height:160,borderRadius:10,background:'#f5f5f5',border:'2px dashed #ccc',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8,color:'#aaa',fontSize:13}}>Sin foto</div>
            )}
            <div style={{display:'flex',gap:6,justifyContent:'center'}}>
              <label style={{...S.btnSm,cursor:'pointer',display:'inline-block'}}>
                Subir foto
                <input type="file" accept="image/*" style={{display:'none'}} onChange={async(ev)=>{
                  const file=ev.target.files[0];if(!file)return
                  const base64=await comprimirImagen(file)
                  actualizarCampo('fotoUrl',base64)
                  ev.target.value=''
                }}/>
              </label>
              {activo.fotoUrl&&<button style={{...S.btnGrisSm,color:'#c62828'}} onClick={()=>actualizarCampo('fotoUrl','')}>Quitar</button>}
            </div>
          </div>
        </div>

        {/* INFORMACIÓN GENERAL */}
        <div style={S.card}>
          <h2 style={{...S.h2,marginBottom:18}}>Información General</h2>
          <div style={S.grid4}>
            <Dato etiqueta="TIPO DE EQUIPO" valor={activo.tipo}/><Dato etiqueta="MARCA" valor={activo.marca}/><Dato etiqueta="MODELO" valor={activo.modelo}/><Dato etiqueta="SERIE" valor={activo.serie}/>
            <Dato etiqueta="AÑO" valor={activo.anio}/><Dato etiqueta="HORÓMETRO" valor={conHoras(activo.horometro)}/><Dato etiqueta="OPERADOR" valor={activo.operador||'Sin operador'}/><Dato etiqueta="UBICACIÓN" valor={activo.ubicacion}/>
            <Dato etiqueta="MOTOR" valor={activo.motor}/><Dato etiqueta="CAPACIDAD DE CARGA" valor={activo.capacidad}/><Dato etiqueta="ALTURA MÁX. DE TRABAJO" valor={activo.alturaMaxima}/><Dato etiqueta="COMBUSTIBLE" valor={activo.combustible}/>
            <Dato etiqueta="PLACAS O NO. ECONÓMICO" valor={activo.placas}/>
          </div>
          <div style={{marginTop:6}}><div style={S.label}>PRÓXIMO MANTENIMIENTO</div><div style={{fontSize:15}}><Semaforo fecha={activo.proximoMantto}/></div></div>
        </div>

        {/* FILTROS MULTI-MARCA */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div><h2 style={S.h2}>Filtros de la Máquina</h2><p style={{color:'#777',fontSize:13,margin:'-4px 0 0'}}>Puedes agregar varias marcas por tipo de filtro.</p></div>
            <button style={S.btnSm} onClick={agregarFiltro}>+ Agregar filtro</button>
          </div>
          {(!activo.filtros||activo.filtros.length===0)?<p style={{color:'#999',fontSize:14}}>No hay filtros registrados. Usa el botón de arriba para agregar.</p>:(
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th style={{...S.th,width:150}}>TIPO</th><th style={{...S.th,width:200}}>MARCA</th><th style={S.th}>NÚMERO DE PARTE</th><th style={{...S.th,width:80,textAlign:'center'}}>COPIAR</th><th style={{...S.th,width:50}}></th></tr></thead>
              <tbody>{ordenarFiltros(activo.filtros).map((f,i,lista)=>{
                const clase=claseFiltro(f.tipo)
                const inicioGrupo=i===0||claseFiltro(lista[i-1].tipo)!==clase
                return[inicioGrupo&&(
                <tr key={'clase-'+clase}><td colSpan={5} style={{padding:'12px 12px 6px',fontSize:12,fontWeight:800,letterSpacing:.6,color:clase==='Sin tipo'?'#c98a00':'var(--acento)',background:'#fafafa',borderBottom:'1px solid #eee'}}>
                  {clase==='Sin tipo'?'SIN TIPO · elige de qué es el filtro':clase.toUpperCase()} · {lista.filter(x=>claseFiltro(x.tipo)===clase).length}
                </td></tr>),
                <tr key={f.id}>
                  <td style={S.td}><select style={S.inputSm} value={f.tipo} onChange={ev=>editarFiltro(f.id,'tipo',ev.target.value)}>{!f.tipo&&<option value="">Elige tipo…</option>}{tiposFiltroCon(f.tipo).map(t=><option key={t}>{t}</option>)}</select></td>
                  <td style={S.td}><MarcaFiltro valor={f.marca} onGuardar={v=>editarFiltro(f.id,'marca',v)}/></td>
                  <td style={S.td}><CampoDiferido style={S.inputSm} valor={f.parte} placeholder="Número de parte" onGuardar={v=>editarFiltro(f.id,'parte',v)}/></td>
                  <td style={{...S.td,textAlign:'center'}}><button style={S.btnGrisSm} onClick={()=>{if(f.parte){navigator.clipboard.writeText(f.parte);alert('Copiado: '+f.parte)}}}>Copiar</button></td>
                  <td style={{...S.td,textAlign:'center'}}><DeleteButton size="sm" title="Quitar filtro" onConfirm={()=>quitarFiltro(f.id)}/></td>
                </tr>]})}</tbody>
            </table>
          )}
        </div>

        {/* SUMINISTROS */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div><h2 style={S.h2}>Suministros del Equipo</h2><p style={{color:'#777',fontSize:13,margin:'-4px 0 0'}}>Capacidades y especificaciones de lo que lleva la máquina.</p></div>
            <button style={S.btnSm} onClick={agregarSuministro}>+ Agregar suministro</button>
          </div>
          {(!activo.suministros||activo.suministros.length===0)?<p style={{color:'#999',fontSize:14}}>No hay suministros registrados.</p>:(
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th style={S.th}>SUMINISTRO</th><th style={{...S.th,width:200}}>CANTIDAD</th><th style={{...S.th,width:250}}>ESPECIFICACIÓN</th><th style={{...S.th,width:50}}></th></tr></thead>
              <tbody>{(activo.suministros||[]).map(s=>(
                <tr key={s.id}>
                  <td style={S.td}><CampoDiferido style={S.inputSm} valor={s.nombre} placeholder="Ej. Aceite de motor" onGuardar={v=>editarSuministro(s.id,'nombre',v)}/></td>
                  <td style={S.td}><CampoDiferido style={S.inputSm} valor={s.cantidad} placeholder="Ej. 10-11 litros" onGuardar={v=>editarSuministro(s.id,'cantidad',v)}/></td>
                  <td style={S.td}><CampoDiferido style={S.inputSm} valor={s.especificacion} placeholder="Ej. 15W-40" onGuardar={v=>editarSuministro(s.id,'especificacion',v)}/></td>
                  <td style={{...S.td,textAlign:'center'}}><DeleteButton size="sm" title="Quitar suministro" onConfirm={()=>quitarSuministro(s.id)}/></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        {/* FOTOGRAFÍA */}
        <div style={S.card}>
<h2 style={S.h2}>Fotografía del Equipo</h2>
          <div style={{display:'flex',gap:14,alignItems:'end',marginBottom:14}}>
            <div style={{flex:1}}>
              <label style={S.label}>LIGA DE LA FOTO (o usa el botón de cargar)</label>
              <input style={S.input} value={activo.fotoUrl||''} placeholder="Pega aquí la liga de una imagen con fondo blanco" onChange={ev=>actualizarCampo('fotoUrl',ev.target.value)}/>
            </div>
            <div>
              <label style={S.label}>CARGAR FOTO</label>
              <label style={{...S.btn,display:'inline-block',cursor:'pointer',textAlign:'center'}}>
                Subir imagen
                <input type="file" accept="image/*" style={{display:'none'}} onChange={async(ev)=>{
                  const file=ev.target.files[0];if(!file)return
                  const base64=await comprimirImagen(file)
                  actualizarCampo('fotoUrl',base64)
                  ev.target.value=''
                }}/>
              </label>
            </div>
          </div>
          {activo.fotoUrl?<img src={activo.fotoUrl} alt="Equipo" style={{maxWidth:'100%',maxHeight:300,borderRadius:8,display:'block',objectFit:'contain',background:'#fff',border:'1px solid #eee',padding:8}}/>:<p style={{color:'#888',fontSize:13,marginBottom:0}}>La galería de fotos y vista 360° se activan con Supabase.</p>}
        </div>

        {/* NOTAS */}
        <div style={S.card}>
          <NotasEquipo lista={notasDe(activo)} onCambiar={nueva=>actualizarCampos({notasLista:nueva,notas:''})}/>
        </div>

        {/* PENDIENTES */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <h2 style={S.h2}>Pendientes del Equipo</h2>
            <button style={S.btnSm} onClick={agregarPendiente}>+ Agregar pendiente</button>
          </div>
          {(!activo.pendientes||activo.pendientes.length===0)?<p style={{color:'#999',fontSize:14}}>No hay pendientes.</p>:(
            <div>{(activo.pendientes||[]).map(p=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
                <input type="checkbox" checked={p.hecho} onChange={()=>togglePendiente(p.id)} style={{width:18,height:18,cursor:'pointer'}}/>
                <span style={{flex:1,fontSize:14,textDecoration:p.hecho?'line-through':'none',color:p.hecho?'#999':'#222'}}>{p.texto}</span>
                <DeleteButton size="sm" title="Quitar pendiente" onConfirm={()=>quitarPendiente(p.id)}/>
              </div>
            ))}</div>
          )}
        </div>

        {/* HISTORIAL DE MANTENIMIENTOS */}
        <div style={S.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <h2 style={{...S.h2,margin:0}}>Historial de Mantenimientos</h2>
            <button style={S.btn} onClick={abrirNuevoMantto}>+ Agregar mantenimiento</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto auto',gap:10,alignItems:'end',marginBottom:14}}>
            <div><label style={S.label}>TIPO</label><select style={S.input} value={filtroTipoM} onChange={ev=>setFiltroTipoM(ev.target.value)}><option value="">Todos</option><option>Preventivo</option><option>Correctivo</option></select></div>
            <div><label style={S.label}>DESDE</label><input type="date" style={S.input} value={filtroDesde} onChange={ev=>setFiltroDesde(ev.target.value)}/></div>
            <div><label style={S.label}>HASTA</label><input type="date" style={S.input} value={filtroHasta} onChange={ev=>setFiltroHasta(ev.target.value)}/></div>
            <button style={S.btnGris} onClick={()=>descargarExcel(activo)}>Excel</button>
            <button style={S.btnGris} onClick={()=>descargarPDF(activo)}>PDF</button>
          </div>
          {mFiltrados.length===0?<p style={{color:'#999',textAlign:'center',padding:20}}>No hay mantenimientos registrados.</p>:(
            <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
              <thead><tr><th style={S.th}>FECHA</th><th style={S.th}>HORÓMETRO</th><th style={S.th}>TIPO</th><th style={S.th}>DESCRIPCIÓN</th><th style={S.th}>REALIZÓ</th><th style={S.th}>COSTO</th><th style={{...S.th,width:50}}></th></tr></thead>
              <tbody>{mFiltrados.map(m=>(
                <tr key={m.mid} style={{cursor:'pointer'}} onClick={()=>setVerMantto(m)} onMouseOver={ev=>ev.currentTarget.style.background='#faf5f6'} onMouseOut={ev=>ev.currentTarget.style.background='transparent'}>
                  <td style={S.td}>{fFecha(m.fecha)}</td><td style={S.td}>{m.horometro||'—'}</td>
                  <td style={S.td}><span style={{background:m.tipoMantto==='Preventivo'?'#e8f5e9':'#fce4ec',color:m.tipoMantto==='Preventivo'?'#2e7d32':'#c62828',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{m.tipoMantto}</span></td>
                  <td style={S.td}>{(m.descripcion||'').slice(0,50)}{(m.descripcion||'').length>50?'...':''}</td>
                  <td style={S.td}>{m.realizadoPor||'—'}</td><td style={S.td}>{m.costo?'$'+m.costo:'—'}</td>
                  <td style={{...S.td,textAlign:'center'}} onClick={ev=>ev.stopPropagation()}><DeleteButton size="sm" title="Eliminar mantenimiento" onConfirm={()=>eliminarMantto(m.mid)}/></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>

        {/* DETALLE MANTTO */}
        {verMantto&&(<div style={S.modalBg} onClick={()=>setVerMantto(null)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h2 style={{...S.h2,margin:0}}>Detalle del Mantenimiento</h2>
            <div style={{display:'flex',gap:8}}><button style={S.btn} onClick={()=>{editarMantto(verMantto);setVerMantto(null)}}>Editar</button><button style={S.btnGris} onClick={()=>setVerMantto(null)}>Cerrar</button></div>
          </div>
          <hr style={{border:'none',borderTop:'1px solid #eee',margin:'14px 0'}}/>
          <div style={S.grid3}>
            <div><div style={S.label}>TIPO</div><div>{verMantto.tipoMantto}</div></div>
            <div><div style={S.label}>FECHA</div><div>{fFecha(verMantto.fecha)}</div></div>
            <div><div style={S.label}>HORÓMETRO</div><div>{verMantto.horometro||'—'}</div></div>
            <div><div style={S.label}>PRÓX. MANTTO</div><div>{fFecha(verMantto.proximoMantto)}</div></div>
            <div><div style={S.label}>REALIZADO POR</div><div>{verMantto.realizadoPor||'—'}</div></div>
            <div><div style={S.label}>AUTORIZADO POR</div><div>{verMantto.autorizadoPor||'—'}</div></div>
            <div><div style={S.label}>LUGAR</div><div>{verMantto.lugarRealizado||'—'}</div></div>
            <div><div style={S.label}>COSTO</div><div>{verMantto.costo?'$'+verMantto.costo:'—'}</div></div>
          </div>
          <div style={{margin:'10px 0'}}><div style={S.label}>DESCRIPCIÓN</div><div style={{whiteSpace:'pre-wrap'}}>{verMantto.descripcion||'—'}</div></div>
          <div style={{margin:'10px 0'}}><div style={S.label}>FILTROS UTILIZADOS</div>
            {(verMantto.filtrosUsados||[]).length===0?<div style={{color:'#999'}}>Ninguno</div>:
              <div>{(verMantto.filtrosUsados||[]).map(fid=>{const f=(activo.filtros||[]).find(x=>x.id===fid);return f?<div key={fid} style={{fontSize:14,padding:'2px 0'}}>{f.tipo} — {f.marca} — {f.parte}</div>:<div key={fid} style={{color:'#999',fontSize:13}}>Filtro eliminado</div>})}</div>
            }
          </div>
          <div style={S.grid2}><div><div style={S.label}>ACEITE</div><div>{verMantto.aceiteDetalle||'—'}</div></div><div><div style={S.label}>GRASA</div><div>{verMantto.grasaDetalle||'—'}</div></div></div>
          {verMantto.pdfUrl&&<div style={{margin:'10px 0'}}><div style={S.label}>REPORTE PDF</div><a href={verMantto.pdfUrl} target="_blank" rel="noreferrer" style={{color:VINO,fontWeight:700}}>Abrir reporte firmado</a></div>}
          {verMantto.extras&&verMantto.extras.length>0&&<div style={{margin:'10px 0'}}><div style={S.label}>DATOS ADICIONALES</div>{verMantto.extras.map((ex,i)=><div key={i}><strong>{ex.nombre}:</strong> {ex.valor}</div>)}</div>}
        </div></div>)}

        <div style={{textAlign:'right',marginBottom:40,display:'flex',justifyContent:'flex-end',alignItems:'center',gap:10}}>
          <span style={{color:'#c62828',fontSize:13,fontWeight:600}}>Eliminar este equipo</span>
          <DeleteButton title="Eliminar este equipo" onConfirm={()=>eliminarEquipo(activo)}/>
        </div>

        {/* MODAL NUEVO/EDITAR MANTTO */}
        {modalMantto&&(<div style={S.modalBg} onClick={()=>setModalMantto(false)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
          <h2 style={{fontSize:22,fontWeight:800,margin:'0 0 6px'}}>{(activo.mantenimientos||[]).some(m=>m.mid===mForm.mid)?'Editar mantenimiento':'Nuevo mantenimiento'}</h2>
          <p style={{color:'#888',fontSize:13,margin:'0 0 18px'}}>{activo.tipo} {activo.marca} {activo.modelo}</p>
          <div style={S.grid4}>
            <div><label style={S.label}>TIPO DE MANTTO</label><select style={S.input} value={mForm.tipoMantto} onChange={ev=>setMForm({...mForm,tipoMantto:ev.target.value})}><option>Preventivo</option><option>Correctivo</option></select></div>
            <div><label style={S.label}>FECHA</label><input type="date" style={S.input} value={mForm.fecha} onChange={ev=>setMForm({...mForm,fecha:ev.target.value})}/></div>
            <div><label style={S.label}>HORÓMETRO O FECHA</label><input style={S.input} value={mForm.horometro} onChange={ev=>setMForm({...mForm,horometro:ev.target.value})} placeholder="Ej. 3450 hrs"/></div>
            <div><label style={S.label}>PRÓX. MANTENIMIENTO</label><input type="date" style={S.input} value={mForm.proximoMantto} onChange={ev=>setMForm({...mForm,proximoMantto:ev.target.value})}/></div>
          </div>
          <div style={{marginBottom:14}}><label style={S.label}>DESCRIPCIÓN DE TRABAJOS</label><textarea style={{...S.input,minHeight:70,resize:'vertical'}} value={mForm.descripcion} onChange={ev=>setMForm({...mForm,descripcion:ev.target.value})} placeholder="Detalla los trabajos realizados..."/></div>

          {/* FILTROS DESDE LA LISTA DEL EQUIPO */}
          {(activo.filtros||[]).length>0&&(
            <div style={{marginBottom:14}}>
              <label style={S.label}>FILTROS UTILIZADOS (de la lista del equipo)</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:4}}>
                {ordenarFiltros(activo.filtros).map(f=>(
                  <label key={f.id} style={S.check}>
                    <input type="checkbox" checked={(mForm.filtrosUsados||[]).includes(f.id)} onChange={()=>toggleFiltroMantto(f.id)}/>
                    <span>{f.tipo||'Sin tipo'} — <strong>{f.marca}</strong> — {f.parte}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={S.grid2}>
            <div><label style={S.label}>ACEITE (tipo y cantidad)</label><input style={S.input} value={mForm.aceiteDetalle} onChange={ev=>setMForm({...mForm,aceiteDetalle:ev.target.value})} placeholder="Ej. 15W-40, 12 litros"/></div>
            <div><label style={S.label}>GRASA (detalle)</label><input style={S.input} value={mForm.grasaDetalle} onChange={ev=>setMForm({...mForm,grasaDetalle:ev.target.value})} placeholder="Ej. Grasa EP2"/></div>
          </div>
          <div style={S.grid3}>
            <div><label style={S.label}>REALIZADO POR</label><input style={S.input} value={mForm.realizadoPor} onChange={ev=>setMForm({...mForm,realizadoPor:ev.target.value})}/></div>
            <div><label style={S.label}>AUTORIZADO POR</label><input style={S.input} value={mForm.autorizadoPor} onChange={ev=>setMForm({...mForm,autorizadoPor:ev.target.value})}/></div>
            <div><label style={S.label}>LUGAR</label><input style={S.input} value={mForm.lugarRealizado} onChange={ev=>setMForm({...mForm,lugarRealizado:ev.target.value})} placeholder="Ej. Taller MAQSOL"/></div>
          </div>
          <div style={S.grid2}>
            <div><label style={S.label}>COSTO</label><input style={S.input} value={mForm.costo} onChange={ev=>setMForm({...mForm,costo:ev.target.value})} placeholder="Ej. 8500"/></div>
            <div><label style={S.label}>LIGA DEL REPORTE PDF FIRMADO</label><input style={S.input} value={mForm.pdfUrl} onChange={ev=>setMForm({...mForm,pdfUrl:ev.target.value})} placeholder="Liga de OneDrive o Drive"/></div>
          </div>
          <div style={{marginBottom:14,marginTop:6}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><label style={{...S.label,margin:0}}>DATOS ADICIONALES</label><button style={S.btnGrisSm} onClick={agregarExtra}>+ Agregar dato</button></div>
            {mForm.extras.map((ex,i)=>(<div key={i} style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}><input style={{...S.input,width:'40%'}} placeholder="Nombre" value={ex.nombre} onChange={ev=>editarExtra(i,'nombre',ev.target.value)}/><input style={S.input} placeholder="Valor" value={ex.valor} onChange={ev=>editarExtra(i,'valor',ev.target.value)}/><DeleteButton size="sm" title="Quitar dato" onConfirm={()=>quitarExtra(i)}/></div>))}
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:10}}><button style={S.btnGris} onClick={()=>setModalMantto(false)}>Cancelar</button><button style={S.btn} onClick={guardarMantto}>Guardar mantenimiento</button></div>
        </div></div>)}

      </div></div>
    )
  }

  // ========================= LISTA =========================
  return(
    <div style={{display:'flex',minHeight:'100vh'}}><Sidebar/><div style={S.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h1 style={S.h1}>Equipos Internos</h1><p style={S.sub}>Maquinaria propiedad de MAQSOL · {equipos.length} equipos registrados</p></div>
        <div style={{display:'flex',gap:10}}><button style={S.btnGris} onClick={exportarLista}>Descargar lista</button><button style={S.btn} onClick={abrirNuevo}>+ Agregar equipo</button></div>
      </div>
      <div style={S.card}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1.4fr',gap:18,alignItems:'start'}}>
          <div><label style={S.label}>BUSCAR</label><input style={S.input} placeholder="Equipo, marca, modelo o serie" value={busqueda} onChange={ev=>setBusqueda(ev.target.value)}/></div>
          <div>
            <label style={S.label}>TIPO DE EQUIPO</label>
            {modoNuevoTipoFiltro?(<div style={{display:'flex',gap:8}}><input style={S.input} autoFocus placeholder="Ej. Excavadora" value={nuevoTipoFiltro} onChange={ev=>setNuevoTipoFiltro(ev.target.value)}/><button style={S.btnVerde} onClick={agregarTipoDesdeFiltro}>Guardar</button><button style={S.btnGris} onClick={()=>setModoNuevoTipoFiltro(false)}>✕</button></div>):(
              <div style={{display:'flex',gap:8}}><select style={S.input} value={fTipo} onChange={ev=>setFTipo(ev.target.value)}><option value="">Todos los tipos</option>{tipos.map(t=><option key={t}>{t}</option>)}</select><button style={{...S.btnGris,whiteSpace:'nowrap'}} onClick={()=>setModoNuevoTipoFiltro(true)}>+ Tipo</button></div>
            )}
            {fTipo&&!modoNuevoTipoFiltro?<button onClick={eliminarTipo} style={{background:'none',border:'none',color:'#c62828',fontSize:12,cursor:'pointer',padding:'6px 0 0',textDecoration:'underline'}}>Quitar "{fTipo}"</button>:null}
          </div>
        </div>
      </div>
      <div style={{...S.card,padding:0,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:950}}>
          <thead><tr><th style={S.th}>EQUIPO</th><th style={S.th}>MARCA</th><th style={S.th}>MODELO</th><th style={S.th}>SERIE</th><th style={S.th}>HORÓMETRO</th><th style={S.th}>OPERADOR</th><th style={S.th}>UBICACIÓN</th><th style={S.th}>TIPO MANTTO</th><th style={S.th}>PRÓX. MANTTO</th><th style={{...S.th,width:50,textAlign:'center'}}></th></tr></thead>
          <tbody>
            {filtrados.length===0?<tr><td style={{...S.td,textAlign:'center',color:'#999',padding:40}} colSpan={10}>No hay equipos. Usa "+ Agregar equipo".</td></tr>
            :filtrados.map(e=>(<tr key={e.id} style={{cursor:'pointer'}} onClick={()=>{setActivoId(e.id);setVista('ficha')}} onMouseOver={ev=>ev.currentTarget.style.background='#faf5f6'} onMouseOut={ev=>ev.currentTarget.style.background='transparent'}>
              <td style={{...S.td,fontWeight:700}}>{e.tipo}</td><td style={S.td}>{e.marca}</td><td style={S.td}>{e.modelo}</td><td style={S.td}>{e.serie}</td>
              <td style={S.td}>{conHoras(e.horometro)||'—'}</td><td style={S.td}>{e.operador||<span style={{color:'#c98a00',fontWeight:700}}>Sin operador</span>}</td>
              <td style={S.td}>{e.ubicacion}</td><td style={S.td}><BadgeMantto tipo={ultimoMantto(e)?.tipoMantto}/></td><td style={S.td}><Semaforo fecha={e.proximoMantto}/></td>
              <td style={{...S.td,textAlign:'center'}} onClick={ev=>ev.stopPropagation()}><DeleteButton size="sm" title="Eliminar equipo" onConfirm={()=>eliminarEquipo(e)}/></td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {/* MODAL ALTA/EDICIÓN EQUIPO */}
      {modalEquipo}

    </div></div>
  )
}
