import { useState } from 'react'
import { useListaCompartida, useSharedTable } from '../../hooks/useSharedTable'
import CampoOpciones from '../../components/CampoOpciones'
import NipModal from '../../components/NipModal'
import { TIPOS_EQUIPO, ACCESORIOS, UBICACIONES_BASE, unir, marcasDe, modelosDe } from '../../utils/catalogoEquipos'
import Sidebar from '../../components/Sidebar'
import DeleteButton from '../../components/DeleteButton'
import { descargarExcelBonito, nombreArchivoFecha } from '../../utils/exportExcel'
import { abrirChecklistPDF, descargarChecklistExcel } from '../../utils/checklistForma'

const VINO = 'var(--acento)'

const NIVELES = ['Electrica','1/4','1/2','3/4','Full']

// columnas del checklist tal como en el formato original (4 columnas x 7 renglones)
const COL1 = ['ESTRUCTURA DE LA MAQUINA','COMPONENTES DEL MOTOR','RADIADOR','BRAZO TELESCOPICO','EXTENSIONES DEL BRAZO','CANASTILLA','BOTON DE PARO DE EMERGENCIA'].map(n=>({n}))
const COL2 = ['BATERIA','CAPO DEL MOTOR','MOTOR COMBUSTION INTERNA',
  {n:'LLANTA DELANTERA IZQUIERDA',pct:true},{n:'LLANTA TRASERA IZQUIERDA',pct:true},
  {n:'LLANTA DELANTERA DERECHA',pct:true},{n:'LLANTA TRASERA DERECHA',pct:true}
].map(x=>typeof x==='string'?{n:x}:x)
const COL3 = ['MARCHA AVANTE-REVERSA','ELEVACION DEL BRAZO','MOTOR AUXILIAR',
  {n:'NIVEL DEPOSITO HIDRAULICO',pct:true},{n:'NIVEL DE COMBUSTIBLE',pct:true},{n:'CAPO DEL COMPARTIMENTO HIDRAULICO',pct:true},
  {n:'LLAVES SWITCH DE IGNITION',siNo:true}
].map(x=>typeof x==='string'?{n:x}:x)
const COL4 = ['ALARMA DE REVERSA','BOTON DE PARO EMERGENCIA (JIB)','CADENA DE LA PLUMA','MANGUERAS Y CONEXIONES','TOMA DE CORRIENTE (CLAVIJA)','JIB','PANEL DE CONTROL AEREO'].map(n=>({n}))


const CHECKLIST_NUEVO = {
  id:'',folio:'',tipo:'Salida',ligadoA:'',
  cliente:'',fecha:'',hora:'',ordenCompra:'',
  equipo:'',nivelCombustible:'',horometro:'',marca:'',modelo:'',serie:'',
  accesorio:'',accMarca:'',accModelo:'',accSerie:'',flete:'',
  nombreContacto:'',telefono:'',correo:'',
  ubicacion:'',horaEntrega:'',fechaEntrega:'',fechaRetiro:'',horaRetiro:'',horometroRetiro:'',
  quienEntrega:'',quienRecibe:'',
  items:{},porcentajes:{},
  servPreEntregaFecha:'',servPreEntregaHorometro:'',proximoServicioFecha:'',proximoServicioHorometro:'',
  reparaciones:'',firmaEnterado:'',observaciones:'',
  recibeCliente:'',retiraCliente:'',
  accNA:false,servPreNA:false,proxServNA:false
}

const S = {
  page:{padding:'24px 28px',fontFamily:'inherit',color:'#222',flex:1,overflowY:'auto'},
  h1:{fontSize:30,fontWeight:800,margin:0,letterSpacing:0.5},
  sub:{color:'#777',margin:'4px 0 0',fontSize:14},
  card:{background:'#fff',border:'1px solid #e6e6e6',borderRadius:10,padding:24,marginBottom:28,boxShadow:'0 1px 3px rgba(0,0,0,.05)'},
  btn:{background:VINO,color:'#fff',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  btnSm:{background:VINO,color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:700,cursor:'pointer',fontSize:13},
  btnGris:{background:'#e9e9e9',color:'#333',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,cursor:'pointer',fontSize:14},
  btnGrisSm:{background:'#e9e9e9',color:'#333',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:700,cursor:'pointer',fontSize:13},
  input:{width:'100%',padding:'10px 11px',border:'1px solid #d8d8d8',borderRadius:6,fontSize:13.5,boxSizing:'border-box',background:'#fff'},
  label:{fontSize:11.5,fontWeight:700,color:'#666',marginBottom:4,display:'block'},
  th:{textAlign:'left',padding:'12px 10px',fontSize:12,letterSpacing:0.5,color:'#fff',background:'#222',fontWeight:700,whiteSpace:'nowrap'},
  td:{padding:'11px 10px',borderBottom:'1px solid #eee',fontSize:14},
  equis:{background:'transparent',border:'none',color:'#c62828',fontSize:18,fontWeight:700,cursor:'pointer',lineHeight:1,padding:'2px 6px',borderRadius:4},
  modalBg:{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:24,overflowY:'auto',zIndex:999},
  modal:{background:'#fff',borderRadius:10,padding:24,width:'100%',maxWidth:1080},
  grid2:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:12},
  grid3:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12},
  seccion:{fontSize:14,fontWeight:800,color:VINO,margin:'18px 0 8px',paddingTop:10,borderTop:'1px solid #eee'}
}

function uid(){return 'x'+Date.now()+Math.random().toString(36).slice(2,6)}
function hoyISO(){return new Date().toISOString().slice(0,10)}
function fFecha(f){return f?new Date(f+'T00:00:00').toLocaleDateString('es-MX'):'—'}

function BadgeTipo({tipo}){
  const salida=(tipo||'Salida')==='Salida'
  return <span translate="no" className="notranslate" style={{background:salida?'#e3f2fd':'#e8f5e9',color:salida?'#1565c0':'#2e7d32',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{tipo||'Salida'}</span>
}

function BotonEstado({activo,color,onClick,children}){
  return (
    <button type="button" translate="no" className="notranslate" onClick={onClick} style={{
      width:30,height:26,border:'1px solid #ccc',borderRadius:4,cursor:'pointer',fontWeight:800,fontSize:12,
      background:activo?color:'#fff',color:activo?'#fff':'#888'
    }}>{children}</button>
  )
}

function ColumnaChecklist({titulo,items,valores,porcentajes,onCambiar,onCambiarPct}){
  return (
    <div style={{border:'1px solid #e6e6e6',borderRadius:8,overflow:'hidden'}}>
      <div style={{background:'#222',color:'#fff',fontSize:11,fontWeight:700,padding:'7px 10px'}}>{titulo}</div>
      {items.map(it=>(
        <div key={it.n} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px',borderBottom:'1px solid #f0f0f0',fontSize:11.5}}>
          <div style={{flex:1}}>{it.n}</div>
          {it.pct&&<input value={porcentajes[it.n]||''} onChange={ev=>onCambiarPct(it.n,ev.target.value)} placeholder="%" style={{width:42,padding:'3px 4px',border:'1px solid #ddd',borderRadius:4,fontSize:11}}/>}
          {it.siNo?(
            <>
              <BotonEstado activo={valores[it.n]==='SI'} color="#1f8b4c" onClick={()=>onCambiar(it.n,'SI')}>SI</BotonEstado>
              <BotonEstado activo={valores[it.n]==='NO'} color="#c62828" onClick={()=>onCambiar(it.n,'NO')}>NO</BotonEstado>
            </>
          ):(
            <>
              <BotonEstado activo={valores[it.n]==='B'} color="#1f8b4c" onClick={()=>onCambiar(it.n,'B')}>B</BotonEstado>
              <BotonEstado activo={valores[it.n]==='R'} color="#c98a00" onClick={()=>onCambiar(it.n,'R')}>R</BotonEstado>
              <BotonEstado activo={valores[it.n]==='M'} color="#c62828" onClick={()=>onCambiar(it.n,'M')}>M</BotonEstado>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Recepcionequipos(){
  const[registros,guardarRegistros]=useListaCompartida('checklists')
  const[modal,setModal]=useState(false)
  const[form,setForm]=useState(CHECKLIST_NUEVO)
  const[busqueda,setBusqueda]=useState('')
  const[fCliente,setFCliente]=useState('')
  const[fTipo,setFTipo]=useState('')
  const[folioManual,setFolioManual]=useState(false)
  const[pideNip,setPideNip]=useState(false)
  const{registros:internos}=useSharedTable('equipos_internos')
  const{registros:externos}=useSharedTable('equipos_externos')
  const{registros:alquileres}=useSharedTable('alquileres')

  function limpiarNombre(s){
    return (s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z0-9]/g,'')
  }
  function mmAAAA(fechaISO){
    const f=fechaISO?new Date(fechaISO+'T00:00:00'):new Date()
    return String(f.getMonth()+1).padStart(2,'0')+f.getFullYear()
  }
  function construirFolio(seq,cliente,fecha){
    return 'CH-'+String(seq).padStart(3,'0')+'-'+(limpiarNombre(cliente)||'CLIENTE')+'-'+mmAAAA(fecha)
  }
  function siguienteSeq(){
    const n=registros.reduce((max,r)=>{
      const m=/^CH-(\d+)-/.exec(r.folio||'')
      return m?Math.max(max,parseInt(m[1],10)):max
    },0)
    return n+1
  }

  function abrirNuevo(){
    const seq=siguienteSeq()
    setFolioManual(false)
    setForm({...CHECKLIST_NUEVO,id:uid(),folioSeq:seq,folio:construirFolio(seq,'',hoyISO()),fecha:hoyISO(),items:{},porcentajes:{}})
    setModal(true)
  }
  function abrirEditar(r){setFolioManual(false);setForm({...CHECKLIST_NUEVO,folioSeq:r.folioSeq||siguienteSeq(),...r,items:{...r.items},porcentajes:{...r.porcentajes}});setModal(true)}
  function registrarEntrada(salida){
    const seq=siguienteSeq()
    const fecha=hoyISO()
    setFolioManual(false)
    setForm({
      ...CHECKLIST_NUEVO,id:uid(),folioSeq:seq,folio:construirFolio(seq,salida.cliente,fecha),
      tipo:'Entrada',ligadoA:salida.folio,fecha,
      cliente:salida.cliente,nombreContacto:salida.nombreContacto,telefono:salida.telefono,correo:salida.correo,
      equipo:salida.equipo,marca:salida.marca,modelo:salida.modelo,serie:salida.serie,
      accesorio:salida.accesorio,accMarca:salida.accMarca,accModelo:salida.accModelo,accSerie:salida.accSerie,accNA:!!salida.accNA,
      ubicacion:salida.ubicacion,items:{},porcentajes:{}
    })
    setModal(true)
  }
  const esNuevo=!registros.some(r=>r.id===form.id)
  function cambiarCliente(cliente){setForm(f=>({...f,cliente,...(esNuevo&&!folioManual?{folio:construirFolio(f.folioSeq,cliente,f.fecha)}:{})}))}
  function cambiarFecha(fecha){setForm(f=>({...f,fecha,...(esNuevo&&!folioManual?{folio:construirFolio(f.folioSeq,f.cliente,fecha)}:{})}))}
  function editarFolio(texto){
    const m=/^CH-(\d+)-/i.exec(texto)
    setForm(f=>({...f,folio:texto,...(m?{folioSeq:parseInt(m[1],10)}:{})}))
  }
  function folioAutomatico(){
    setFolioManual(false)
    setForm(f=>({...f,folio:construirFolio(f.folioSeq,f.cliente,f.fecha)}))
  }
  function alternarNA(grupo){
    setForm(f=>{
      if(grupo==='acc'){
        const on=!f.accNA
        return on?{...f,accNA:true,accesorio:'N/A',accMarca:'N/A',accModelo:'N/A',accSerie:'N/A'}
          :{...f,accNA:false,accesorio:'',accMarca:'',accModelo:'',accSerie:''}
      }
      if(grupo==='pre'){
        const on=!f.servPreNA
        return {...f,servPreNA:on,servPreEntregaFecha:'',servPreEntregaHorometro:''}
      }
      const on=!f.proxServNA
      return {...f,proxServNA:on,proximoServicioFecha:'',proximoServicioHorometro:''}
    })
  }
  function tomarEquipo(clave){
    const lista=[...internos.map(e=>({...e,origen:'internos'})),...externos.map(e=>({...e,origen:'externos'}))]
    const e=lista.find(x=>x.origen+':'+x.id===clave)
    if(!e)return
    setForm(f=>({...f,equipo:e.tipo||'',marca:e.marca||'',modelo:e.modelo||'',serie:e.serie||'',horometro:e.horometro||f.horometro,ubicacion:f.ubicacion||e.ubicacion||''}))
  }
  function guardarForm(){
    if(!form.cliente.trim()){alert('Indica el cliente.');return}
    if(!form.equipo.trim()){alert('Indica el equipo.');return}
    if(!form.folio.trim()){alert('El folio no puede quedar vacío.');return}
    if(registros.some(r=>r.id!==form.id&&(r.folio||'').trim().toLowerCase()===form.folio.trim().toLowerCase())){alert('Ya existe un checklist con el folio '+form.folio+'. Cámbialo para no repetirlo.');return}
    const existe=registros.some(r=>r.id===form.id)
    const lista=existe?registros.map(r=>r.id===form.id?{...r,...form}:r):[...registros,form]
    guardarRegistros(lista);setModal(false)
  }
  function eliminarRegistro(r){
    guardarRegistros(registros.filter(x=>x.id!==r.id))
  }
  function cambiarItem(clave,valor){setForm(f=>({...f,items:{...f.items,[clave]:f.items[clave]===valor?'':valor}}))}
  function cambiarPct(clave,valor){setForm(f=>({...f,porcentajes:{...f.porcentajes,[clave]:valor}}))}

  const clientes=[...new Set(registros.map(r=>r.cliente).filter(Boolean))].sort()

  const tipoCoincide=(a)=>!form.equipo||!a||String(a).toLowerCase()===form.equipo.toLowerCase()
  const opcionesTipo=unir(TIPOS_EQUIPO,registros.map(r=>r.equipo),internos.map(e=>e.tipo),externos.map(e=>e.tipo))
  const opcionesMarca=unir(
    registros.filter(r=>tipoCoincide(r.equipo)).map(r=>r.marca),
    [...internos,...externos].filter(e=>tipoCoincide(e.tipo)).map(e=>e.marca),
    marcasDe(form.equipo)
  )
  const mismaMarca=(a)=>!form.marca||String(a||'').toLowerCase()===form.marca.toLowerCase()
  const opcionesModelo=unir(
    registros.filter(r=>tipoCoincide(r.equipo)&&mismaMarca(r.marca)).map(r=>r.modelo),
    [...internos,...externos].filter(e=>tipoCoincide(e.tipo)&&mismaMarca(e.marca)).map(e=>e.modelo),
    modelosDe(form.equipo,form.marca)
  )
  const opcionesAccesorio=unir(ACCESORIOS,registros.map(r=>r.accesorio).filter(a=>a&&a!=='N/A'))
  const opcionesAccMarca=unir(registros.map(r=>r.accMarca).filter(a=>a&&a!=='N/A'),marcasDe(''))
  const opcionesUbicacion=unir(
    UBICACIONES_BASE,
    internos.map(e=>e.ubicacion),
    alquileres.flatMap(a=>[a.obra,a.direccionObra]),
    registros.map(r=>r.ubicacion)
  )
  const equiposRegistrados=[
    ...internos.map(e=>({clave:'internos:'+e.id,texto:[e.tipo,e.marca,e.modelo].filter(Boolean).join(' ')+' · '+(e.serie||'s/n')+' (propio)'})),
    ...externos.filter(e=>e.estado!=='Devuelto').map(e=>({clave:'externos:'+e.id,texto:[e.tipo,e.marca,e.modelo].filter(Boolean).join(' ')+' · '+(e.serie||'s/n')+' (externo)'}))
  ]

  const filtrados=registros.filter(r=>{
    const t=(r.folio+' '+r.cliente+' '+r.equipo+' '+r.marca+' '+r.serie).toLowerCase()
    return t.includes(busqueda.toLowerCase())&&(!fCliente||r.cliente===fCliente)&&(!fTipo||(r.tipo||'Salida')===fTipo)
  }).sort((a,b)=>(a.cliente||'').localeCompare(b.cliente||'')||(b.fecha||'').localeCompare(a.fecha||''))

  // ================= EXPORTES =================

  function descargarExcel(r){
    descargarChecklistExcel(r,[COL1,COL2,COL3,COL4],nombreArchivoFecha((r.tipo==='Entrada'?'CH-ENTRADA-':'CH-SALIDA-')+(r.folio||'equipo').toString().toUpperCase().replace(/[^A-Z0-9]/g,'')))
  }

  function descargarListaExcel(){
    const columnas=['Folio','Tipo','Ligado a','Cliente','Equipo','Marca','Serie','Fecha','Quién entrega','Quién recibe']
    const filas=filtrados.map(r=>[r.folio,r.tipo||'Salida',r.ligadoA||'',r.cliente,r.equipo,r.marca,r.serie,fFecha(r.fecha),r.quienEntrega,r.quienRecibe])
    descargarExcelBonito({
      titulo:'Entrega y Salida de Equipo',
      subtitulo:'MAQUINARIA SOPORTE Y LOGISTICA SA DE CV · '+filtrados.length+' registros',
      columnas,filas,
      nombreArchivo:nombreArchivoFecha('CH-LISTA')
    })
  }

  function descargarPDF(r){
    abrirChecklistPDF(r,[COL1,COL2,COL3,COL4])
  }

  return(
    <div style={{display:'flex',minHeight:'100vh'}}><Sidebar/><div style={S.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h1 style={S.h1}>Entrega y Salida de Equipo</h1><p style={S.sub}>Checklist de condición del equipo al entregar y al retirar · {registros.length} registrados</p></div>
        <div style={{display:'flex',gap:10}}><button style={S.btnGris} onClick={descargarListaExcel}>Descargar lista</button><button style={S.btn} onClick={abrirNuevo}>+ Nuevo checklist</button></div>
      </div>

      <div style={S.card}>
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr',gap:14,alignItems:'end'}}>
          <div><label style={S.label}>BUSCAR</label><input style={S.input} placeholder="Folio, cliente, equipo, marca o serie" value={busqueda} onChange={ev=>setBusqueda(ev.target.value)}/></div>
          <div><label style={S.label}>CLIENTE</label><select style={S.input} value={fCliente} onChange={ev=>setFCliente(ev.target.value)}><option value="">Todos</option>{clientes.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={S.label}>TIPO</label><select style={S.input} value={fTipo} onChange={ev=>setFTipo(ev.target.value)}><option value="">Todos</option><option>Salida</option><option>Entrada</option></select></div>
        </div>
      </div>

      <div style={{...S.card,padding:0,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1080}}>
          <thead><tr>
            <th style={S.th}>FOLIO</th><th style={S.th}>CLIENTE</th><th style={S.th}>TIPO</th><th style={S.th}>EQUIPO</th><th style={S.th}>FECHA</th>
            <th style={S.th}>ENTREGA</th><th style={S.th}>RECIBE</th><th style={{...S.th,width:260,textAlign:'center'}}></th>
          </tr></thead>
          <tbody>
            {filtrados.length===0?<tr><td style={{...S.td,textAlign:'center',color:'#999',padding:40}} colSpan={8}>No hay checklists registrados. Usa "+ Nuevo checklist".</td></tr>
            :filtrados.map(r=>(<tr key={r.id} onMouseOver={ev=>ev.currentTarget.style.background='#faf5f6'} onMouseOut={ev=>ev.currentTarget.style.background='transparent'}>
              <td style={{...S.td,fontWeight:700,cursor:'pointer'}} onClick={()=>abrirEditar(r)}>{r.folio}{r.ligadoA?<div style={{color:'#999',fontSize:11,fontWeight:400}}>Liga: {r.ligadoA}</div>:null}</td>
              <td style={S.td}>{r.cliente}</td>
              <td style={S.td}><BadgeTipo tipo={r.tipo}/></td>
              <td style={S.td}>{r.equipo}{r.serie?<div style={{color:'#999',fontSize:12}}>Serie: {r.serie}</div>:null}</td>
              <td style={S.td}>{fFecha(r.fecha)}</td>
              <td style={S.td}>{r.quienEntrega||'—'}</td>
              <td style={S.td}>{r.quienRecibe||'—'}</td>
              <td style={{...S.td,textAlign:'center',whiteSpace:'nowrap'}}>
                {(r.tipo||'Salida')==='Salida'&&<button style={S.btnSm} onClick={()=>registrarEntrada(r)}>+ Entrada</button>}
                <button style={{...S.btnGrisSm,marginLeft:6}} onClick={()=>abrirEditar(r)}>Editar</button>
                <button style={{...S.btnGrisSm,marginLeft:6}} onClick={()=>descargarPDF(r)}>PDF</button>
                <button style={{...S.btnGrisSm,marginLeft:6}} onClick={()=>descargarExcel(r)}>Excel</button>
                <span style={{marginLeft:6,display:'inline-block'}}><DeleteButton size="sm" title="Eliminar checklist" onConfirm={()=>eliminarRegistro(r)}/></span>
              </td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {pideNip&&<NipModal mensaje="Escribe el NIP para cambiar el folio." onCorrecto={()=>{setPideNip(false);setFolioManual(true)}} onCancelar={()=>setPideNip(false)}/>}

      {/* MODAL ALTA/EDICIÓN */}
      {modal&&(<div style={S.modalBg} onClick={()=>setModal(false)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{fontSize:22,fontWeight:800,margin:0}}>{registros.some(r=>r.id===form.id)?'Editar checklist':'Nuevo checklist'}</h2>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {form.ligadoA&&<span style={{fontSize:12,color:'#999'}}>Ligado a {form.ligadoA}</span>}
            <select translate="no" className="notranslate" style={{...S.input,width:120}} value={form.tipo} onChange={ev=>setForm({...form,tipo:ev.target.value})}><option>Salida</option><option>Entrada</option></select>
            {folioManual?(
              <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
                <span style={{fontWeight:700,color:VINO}}>Folio:</span>
                <input style={{...S.input,width:250,fontWeight:700}} value={form.folio} onChange={ev=>editarFolio(ev.target.value)}/>
                <button type="button" style={S.btnGrisSm} title="Volver al folio que asigna el sistema" onClick={folioAutomatico}>Automático</button>
              </span>
            ):(
              <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
                <span style={{fontWeight:700,color:VINO}}>Folio: {form.folio}</span>
                <button type="button" style={S.btnGrisSm} title="Cambiar el folio (pide NIP)" onClick={()=>setPideNip(true)}>✎ Cambiar</button>
              </span>
            )}
          </div>
        </div>

        <div style={S.seccion}>Datos generales</div>
        <div style={S.grid3}>
          <div><label style={S.label}>CLIENTE</label><input style={S.input} value={form.cliente} onChange={ev=>cambiarCliente(ev.target.value)}/></div>
          <div><label style={S.label}>FECHA</label><input type="date" style={S.input} value={form.fecha} onChange={ev=>cambiarFecha(ev.target.value)}/></div>
          <div><label style={S.label}>HORA</label><input type="time" style={S.input} value={form.hora} onChange={ev=>setForm({...form,hora:ev.target.value})}/></div>
        </div>
        <div style={S.grid3}>
          <div><label style={S.label}>ORDEN DE COMPRA</label><input style={S.input} value={form.ordenCompra} onChange={ev=>setForm({...form,ordenCompra:ev.target.value})}/></div>
          <div><label style={S.label}>NOMBRE CONTACTO</label><input style={S.input} value={form.nombreContacto} onChange={ev=>setForm({...form,nombreContacto:ev.target.value})}/></div>
          <div><label style={S.label}>TELÉFONO</label><input style={S.input} value={form.telefono} onChange={ev=>setForm({...form,telefono:ev.target.value})}/></div>
        </div>
        <div style={S.grid2}>
          <div><label style={S.label}>CORREO</label><input style={S.input} value={form.correo} onChange={ev=>setForm({...form,correo:ev.target.value})}/></div>
          <div><label style={S.label}>UBICACIÓN / OBRA</label><CampoOpciones opciones={opcionesUbicacion} valor={form.ubicacion} onChange={v=>setForm(f=>({...f,ubicacion:v}))} vacio="Selecciona la ubicación" placeholder="Escribe la obra o ubicación" textoOtro="Otra ubicación u obra (escribir)"/></div>
        </div>

        <div style={S.seccion}>Equipo</div>
        {equiposRegistrados.length>0&&(
          <div style={{marginBottom:12}}>
            <label style={S.label}>TOMAR DE EQUIPOS REGISTRADOS (llena equipo, marca, modelo y serie de un clic)</label>
            <select style={S.input} value="" onChange={ev=>tomarEquipo(ev.target.value)}>
              <option value="">— Elegir o llenar abajo —</option>
              {equiposRegistrados.map(e=><option key={e.clave} value={e.clave}>{e.texto}</option>)}
            </select>
          </div>
        )}
        <div style={S.grid4}>
          <div><label style={S.label}>EQUIPO</label><CampoOpciones opciones={opcionesTipo} valor={form.equipo} onChange={v=>setForm(f=>({...f,equipo:v}))} vacio="Selecciona el equipo" placeholder="Ej. Excavadora" textoOtro="Otro equipo (escribir)"/></div>
          <div><label style={S.label}>MARCA</label><CampoOpciones opciones={opcionesMarca} valor={form.marca} onChange={v=>setForm(f=>({...f,marca:v}))} vacio="Selecciona la marca" placeholder="Escribe la marca" textoOtro="Otra marca (escribir)"/></div>
          <div><label style={S.label}>MODELO</label><CampoOpciones opciones={opcionesModelo} valor={form.modelo} onChange={v=>setForm(f=>({...f,modelo:v}))} vacio="Selecciona el modelo" placeholder="Escribe el modelo" textoOtro="Otro modelo (escribir)"/></div>
          <div><label style={S.label}>SERIE</label><input style={S.input} value={form.serie} onChange={ev=>setForm({...form,serie:ev.target.value})}/></div>
        </div>
        <div style={S.grid4}>
          <div><label style={S.label}>NIVEL COMBUSTIBLE</label><select style={S.input} value={form.nivelCombustible} onChange={ev=>setForm({...form,nivelCombustible:ev.target.value})}><option value="">Selecciona</option>{NIVELES.map(n=><option key={n}>{n}</option>)}</select></div>
          <div><label style={S.label}>HORÓMETRO</label><input style={S.input} value={form.horometro} onChange={ev=>setForm({...form,horometro:ev.target.value})}/></div>
          <div><label style={S.label}>FLETE</label><input style={S.input} value={form.flete} onChange={ev=>setForm({...form,flete:ev.target.value})}/></div>
          <div></div>
        </div>

        <div style={{...S.seccion,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Accesorio (opcional)</span>
          <button type="button" onClick={()=>alternarNA('acc')} style={{...S.btnGrisSm,background:form.accNA?'#222':'#e9e9e9',color:form.accNA?'#fff':'#333'}}>{form.accNA?'✓ N/A · no lleva accesorio':'N/A · no lleva accesorio'}</button>
        </div>
        {form.accNA?(
          <p style={{color:'#888',fontSize:13,margin:'0 0 12px'}}>Sin accesorio: en el documento aparecerá N/A en todos sus datos.</p>
        ):(
          <div style={S.grid4}>
            <div><label style={S.label}>ACCESORIO</label><CampoOpciones opciones={opcionesAccesorio} valor={form.accesorio} onChange={v=>setForm(f=>({...f,accesorio:v}))} vacio="Selecciona" placeholder="Escribe el accesorio" textoOtro="Otro accesorio (escribir)"/></div>
            <div><label style={S.label}>MARCA</label><CampoOpciones opciones={opcionesAccMarca} valor={form.accMarca} onChange={v=>setForm(f=>({...f,accMarca:v}))} vacio="Selecciona" placeholder="Escribe la marca" textoOtro="Otra marca (escribir)"/></div>
            <div><label style={S.label}>MODELO</label><input style={S.input} value={form.accModelo} onChange={ev=>setForm({...form,accModelo:ev.target.value})}/></div>
            <div><label style={S.label}>SERIE</label><input style={S.input} value={form.accSerie} onChange={ev=>setForm({...form,accSerie:ev.target.value})}/></div>
          </div>
        )}

        <div style={S.seccion}>Entrega y retiro</div>
        <div style={S.grid4}>
          <div><label style={S.label}>HORA EN QUE SE ENTREGA</label><input type="time" style={S.input} value={form.horaEntrega} onChange={ev=>setForm({...form,horaEntrega:ev.target.value})}/></div>
          <div><label style={S.label}>FECHA DE ENTREGA</label><input type="date" style={S.input} value={form.fechaEntrega} onChange={ev=>setForm({...form,fechaEntrega:ev.target.value})}/></div>
          <div><label style={S.label}>FECHA DE RETIRO</label><input type="date" style={S.input} value={form.fechaRetiro} onChange={ev=>setForm({...form,fechaRetiro:ev.target.value})}/></div>
          <div><label style={S.label}>HORA DE RETIRO</label><input type="time" style={S.input} value={form.horaRetiro} onChange={ev=>setForm({...form,horaRetiro:ev.target.value})}/></div>
        </div>
        <div style={S.grid3}>
          <div><label style={S.label}>HORÓMETRO DE RETIRO</label><input style={S.input} value={form.horometroRetiro} onChange={ev=>setForm({...form,horometroRetiro:ev.target.value})}/></div>
          <div><label style={S.label}>NOMBRE DE QUIEN ENTREGA</label><input style={S.input} value={form.quienEntrega} onChange={ev=>setForm({...form,quienEntrega:ev.target.value})}/></div>
          <div><label style={S.label}>NOMBRE DE QUIEN RECIBE</label><input style={S.input} value={form.quienRecibe} onChange={ev=>setForm({...form,quienRecibe:ev.target.value})}/></div>
        </div>

        <div style={S.seccion}>Checklist de condición — B: Bueno · R: Regular · M: Malo</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
          <ColumnaChecklist titulo="ESTRUCTURA" items={COL1} valores={form.items} porcentajes={form.porcentajes} onCambiar={cambiarItem} onCambiarPct={cambiarPct}/>
          <ColumnaChecklist titulo="LLANTAS / BATERÍA" items={COL2} valores={form.items} porcentajes={form.porcentajes} onCambiar={cambiarItem} onCambiarPct={cambiarPct}/>
          <ColumnaChecklist titulo="NIVELES / MANDOS" items={COL3} valores={form.items} porcentajes={form.porcentajes} onCambiar={cambiarItem} onCambiarPct={cambiarPct}/>
          <ColumnaChecklist titulo="ACCESORIOS / SEGURIDAD" items={COL4} valores={form.items} porcentajes={form.porcentajes} onCambiar={cambiarItem} onCambiarPct={cambiarPct}/>
        </div>

        <div style={S.seccion}>Servicio</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {[
            {g:'pre',na:form.servPreNA,titulo:'SERVICIO DE PRE-ENTREGA',f:'servPreEntregaFecha',h:'servPreEntregaHorometro'},
            {g:'prox',na:form.proxServNA,titulo:'PRÓXIMO SERVICIO',f:'proximoServicioFecha',h:'proximoServicioHorometro'}
          ].map(x=>(
            <div key={x.g} style={{border:'1px solid #eee',borderRadius:8,padding:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <strong style={{fontSize:12,color:'#555'}}>{x.titulo}</strong>
                <button type="button" onClick={()=>alternarNA(x.g)} style={{...S.btnGrisSm,background:x.na?'#222':'#e9e9e9',color:x.na?'#fff':'#333'}}>{x.na?'✓ N/A':'N/A'}</button>
              </div>
              {x.na?(<p style={{color:'#888',fontSize:13,margin:0}}>No aplica: saldrá N/A en el documento.</p>):(
                <div style={S.grid2}>
                  <div><label style={S.label}>FECHA</label><input type="date" style={S.input} value={form[x.f]} onChange={ev=>setForm({...form,[x.f]:ev.target.value})}/></div>
                  <div><label style={S.label}>HORÓMETRO</label><input style={S.input} value={form[x.h]} onChange={ev=>setForm({...form,[x.h]:ev.target.value})}/></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={S.seccion}>Notas y conformidad</div>
        <div style={{marginBottom:12}}><label style={S.label}>REPARACIONES POR DAÑOS A CONSIDERAR</label><textarea style={{...S.input,minHeight:60,resize:'vertical'}} value={form.reparaciones} onChange={ev=>setForm({...form,reparaciones:ev.target.value})}/></div>
        <div style={{marginBottom:12}}><label style={S.label}>OBSERVACIONES / USO EN OBRA</label><textarea style={{...S.input,minHeight:60,resize:'vertical'}} value={form.observaciones} onChange={ev=>setForm({...form,observaciones:ev.target.value})}/></div>
        <div style={{marginBottom:12}}><label style={S.label}>FIRMA DE ENTERADO Y CONFORMIDAD (nombre de la persona encargada)</label><input style={S.input} value={form.firmaEnterado} onChange={ev=>setForm({...form,firmaEnterado:ev.target.value})}/></div>

        <div style={S.grid2}>
          <div><label style={S.label}>RECIBE EL EQUIPO (CLIENTE)</label><input style={S.input} value={form.recibeCliente} onChange={ev=>setForm({...form,recibeCliente:ev.target.value})}/></div>
          <div><label style={S.label}>RETIRA EL EQUIPO (CLIENTE)</label><input style={S.input} value={form.retiraCliente} onChange={ev=>setForm({...form,retiraCliente:ev.target.value})}/></div>
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:16}}>
          <button style={S.btnGris} onClick={()=>setModal(false)}>Cancelar</button>
          <button style={S.btn} onClick={guardarForm}>Guardar</button>
        </div>
      </div></div>)}

    </div></div>
  )
}
