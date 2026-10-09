import { useEffect, useState } from 'react'
import { useListaCompartida, useSharedTable } from '../../hooks/useSharedTable'
import CampoOpciones from '../../components/CampoOpciones'
import NipModal from '../../components/NipModal'
import { TIPOS_EQUIPO, ACCESORIOS, UBICACIONES_BASE, unir, marcasDe, modelosDe } from '../../utils/catalogoEquipos'
import Sidebar from '../../components/Sidebar'
import DeleteButton from '../../components/DeleteButton'
import { descargarExcelBonito, nombreArchivoFecha } from '../../utils/exportExcel'
import { abrirChecklistPDF, descargarChecklistExcel } from '../../utils/checklistForma'
import { folioVisible, LARGO_NOMBRE_FOLIO } from '../../utils/folio'
import { supabase } from '../../supabaseClient'
import FirmaPad from '../../components/FirmaPad'
import ExpedienteCliente from '../../components/ExpedienteCliente'
import { estadoExpediente, buscarCliente } from '../../utils/expediente'
import { comprimirImagen, rutaUnica, extensionDe } from '../../utils/imagenes'
import { nuevoToken, urlBase } from '../../utils/qrEquipo'

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
  reparaciones:'',observaciones:'',
  recibeCliente:'',retiraCliente:'',
  accNA:false,servPreNA:false,proxServNA:false,ocNA:false,
  fotosToken:'',fotos:[],ineEntrega:[],ineRecibe:[],firmas:{}
}

const BUCKET_FOTOS='checklist-fotos'
const BUCKET_DOCS='checklist-docs'
const MAX_MB=15
const FIRMAS=[
  {k:'entrega',t:'Entrega / retira el equipo',s:'MAQSOL'},
  {k:'recibe',t:'Recibe el equipo',s:'Cliente'},
  {k:'retira',t:'Retira el equipo',s:'Cliente'},
  {k:'voBo',t:'Vo. Bo.',s:'MAQSOL'}
]

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

const estiloMiniatura={width:110,height:82,objectFit:'cover',borderRadius:8,display:'block'}
const estiloX={position:'absolute',top:-6,right:-6,width:22,height:22,borderRadius:'50%',border:'none',background:'#c62828',color:'#fff',cursor:'pointer',fontSize:12,lineHeight:1}
const estiloChipArchivo={background:'#f3f6f9',borderRadius:14,padding:'4px 10px',fontSize:12,display:'inline-flex',alignItems:'center',gap:6}
const estiloXChip={border:'none',background:'transparent',color:'#c62828',cursor:'pointer',fontSize:12,padding:0}
const chipExp=(color,fondo)=>({background:fondo,color,fontSize:11.5,fontWeight:700,padding:'3px 10px',borderRadius:20,whiteSpace:'nowrap'})

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
      width:28,height:26,flex:'0 0 auto',border:'1px solid #ccc',borderRadius:4,cursor:'pointer',fontWeight:800,fontSize:12,padding:0,
      background:activo?color:'#fff',color:activo?'#fff':'#888'
    }}>{children}</button>
  )
}

function ColumnaChecklist({titulo,items,valores,porcentajes,onCambiar,onCambiarPct}){
  return (
    <div style={{border:'1px solid #e6e6e6',borderRadius:8,overflow:'hidden'}}>
      <div style={{background:'#222',color:'#fff',fontSize:11,fontWeight:700,padding:'7px 10px'}}>{titulo}</div>
      {items.map(it=>(
        <div key={it.n} style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'4px 6px',padding:'6px 8px',borderBottom:'1px solid #f0f0f0',fontSize:11.5}}>
          <div style={it.pct?{flex:'1 1 100%',fontWeight:600}:{flex:'1 1 0',minWidth:0}}>{it.n}</div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:'auto',flex:'0 0 auto'}}>
          {it.pct&&<input value={porcentajes[it.n]||''} onChange={ev=>onCambiarPct(it.n,ev.target.value)} placeholder="%" style={{width:46,padding:'4px 5px',border:'1px solid #ddd',borderRadius:4,fontSize:11,textAlign:'center'}}/>}
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
  const{registros:clientesDB,guardar:guardarClienteDB}=useSharedTable('clientes')
  const[pend,setPend]=useState({fotos:[],ineEntrega:[],ineRecibe:[]})
  const[quitar,setQuitar]=useState([])
  const[urls,setUrls]=useState({})
  const[guardando,setGuardando]=useState(false)
  const[firmando,setFirmando]=useState(null)
  const[expedienteDe,setExpedienteDe]=useState(null)
  const[soloDocs,setSoloDocs]=useState(false)
  const[copiado,setCopiado]=useState(false)

  function limpiarNombre(s){
    return (s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z0-9]/g,'')
  }
  function mmAAAA(fechaISO){
    const f=fechaISO?new Date(fechaISO+'T00:00:00'):new Date()
    return String(f.getMonth()+1).padStart(2,'0')+f.getFullYear()
  }
  function construirFolio(seq,cliente,fecha){
    return 'CH-'+String(seq).padStart(3,'0')+'-'+(limpiarNombre(cliente)||'CLIENTE').slice(0,LARGO_NOMBRE_FOLIO)+'-'+mmAAAA(fecha)
  }
  function siguienteSeq(){
    const n=registros.reduce((max,r)=>{
      const m=/^CH-(\d+)-/.exec(r.folio||'')
      return m?Math.max(max,parseInt(m[1],10)):max
    },0)
    return n+1
  }

  function reiniciarArchivos(){
    pend.fotos.forEach(f=>f.preview&&URL.revokeObjectURL(f.preview))
    setPend({fotos:[],ineEntrega:[],ineRecibe:[]})
    setQuitar([])
  }
  function abrirNuevo(){
    const seq=siguienteSeq()
    reiniciarArchivos()
    setFolioManual(false)
    setForm({...CHECKLIST_NUEVO,id:uid(),folioSeq:seq,folio:construirFolio(seq,'',hoyISO()),fecha:hoyISO(),items:{},porcentajes:{}})
    setModal(true)
  }
  function abrirDocs(r){reiniciarArchivos();setSoloDocs(true);setFolioManual(false);setForm({...CHECKLIST_NUEVO,folioSeq:r.folioSeq||siguienteSeq(),...r,items:{...r.items},porcentajes:{...r.porcentajes}});setModal(true)}
  function cerrarModal(){reiniciarArchivos();setSoloDocs(false);setModal(false)}
  function abrirEditar(r){reiniciarArchivos();setSoloDocs(false);setFolioManual(false);setForm({...CHECKLIST_NUEVO,folioSeq:r.folioSeq||siguienteSeq(),...r,items:{...r.items},porcentajes:{...r.porcentajes}});setModal(true)}
  function registrarEntrada(salida){
    const seq=siguienteSeq()
    const fecha=hoyISO()
    reiniciarArchivos()
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
  function cambiarCliente(cliente){
    const conocido=buscarCliente(clientesDB,cliente)
    setForm(f=>({...f,cliente,
      ...(conocido?{nombreContacto:f.nombreContacto||conocido.contacto||'',telefono:f.telefono||conocido.telefono||'',correo:f.correo||conocido.correo||''}:{}),
      ...(esNuevo&&!folioManual?{folio:construirFolio(f.folioSeq,cliente,f.fecha)}:{})}))
  }
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
      if(grupo==='oc'){
        const on=!f.ocNA
        return {...f,ocNA:on,ordenCompra:on?'N/A':''}
      }
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
  async function guardarForm(){
    if(!form.cliente.trim()){alert('Indica el cliente.');return}
    if(!form.equipo.trim()){alert('Indica el equipo.');return}
    if(!form.folio.trim()){alert('El folio no puede quedar vacío.');return}
    if(registros.some(r=>r.id!==form.id&&(r.folio||'').trim().toLowerCase()===form.folio.trim().toLowerCase())){alert('Ya existe un checklist con el folio '+form.folio+'. Cámbialo para no repetirlo.');return}
    setGuardando(true)
    const subidos=[]
    try{
      const reg={...form,fotos:[...(form.fotos||[])],ineEntrega:[...(form.ineEntrega||[])],ineRecibe:[...(form.ineRecibe||[])]}
      const token=reg.fotosToken||(pend.fotos.length?nuevoToken():'')
      reg.fotosToken=token
      for(const f of pend.fotos){
        const blob=await comprimirImagen(f.file)
        const path=token+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.jpg'
        const{error}=await supabase.storage.from(BUCKET_FOTOS).upload(path,blob,{contentType:'image/jpeg'})
        if(error)throw error
        subidos.push({b:BUCKET_FOTOS,path})
        reg.fotos.push({path,nombre:f.file.name})
      }
      for(const grupo of ['ineEntrega','ineRecibe']){
        for(const f of pend[grupo]){
          const path=rutaUnica(reg.id,grupo,extensionDe(f.file.name))
          const{error}=await supabase.storage.from(BUCKET_DOCS).upload(path,f.file,{contentType:f.file.type})
          if(error)throw error
          subidos.push({b:BUCKET_DOCS,path})
          reg[grupo].push({path,nombre:f.file.name})
        }
      }
      const existe=registros.some(r=>r.id===reg.id)
      const lista=existe?registros.map(r=>r.id===reg.id?{...r,...reg}:r):[...registros,reg]
      await guardarRegistros(lista)
      for(const b of [BUCKET_FOTOS,BUCKET_DOCS]){
        const rutas=quitar.filter(q=>q.b===b).map(q=>q.path)
        if(rutas.length)await supabase.storage.from(b).remove(rutas)
      }
      reiniciarArchivos()
      setSoloDocs(false)
      setModal(false)
    }catch(e){
      for(const b of [BUCKET_FOTOS,BUCKET_DOCS]){
        const rutas=subidos.filter(x=>x.b===b).map(x=>x.path)
        if(rutas.length)await supabase.storage.from(b).remove(rutas)
      }
      alert('No se pudo guardar: '+(e.message||e)+'\n\nSi es la primera vez que usas fotos o INE, falta correr el SQL de almacenamiento en Supabase.')
    }finally{
      setGuardando(false)
    }
  }
  function agregarArchivos(grupo,archivos){
    const lista=Array.from(archivos)
    const validos=lista.filter(a=>{
      const ok=grupo==='fotos'?a.type.startsWith('image/'):(a.type==='application/pdf'||a.type.startsWith('image/'))
      if(!ok){alert('"'+a.name+'" no es un archivo válido ('+(grupo==='fotos'?'solo imágenes':'PDF o imagen')+'); se omitió.');return false}
      if(a.size>MAX_MB*1024*1024){alert('"'+a.name+'" pesa más de '+MAX_MB+' MB; se omitió.');return false}
      return true
    }).map(file=>({id:uid(),file,preview:file.type.startsWith('image/')?URL.createObjectURL(file):''}))
    if(!validos.length)return
    if(grupo==='fotos'&&!form.fotosToken)setForm(f=>({...f,fotosToken:nuevoToken()}))
    setPend(p=>({...p,[grupo]:[...p[grupo],...validos]}))
  }
  function quitarPendiente(grupo,id){
    setPend(p=>{
      const f=p[grupo].find(x=>x.id===id)
      if(f&&f.preview)URL.revokeObjectURL(f.preview)
      return {...p,[grupo]:p[grupo].filter(x=>x.id!==id)}
    })
  }
  function quitarGuardado(grupo,archivo){
    setForm(f=>({...f,[grupo]:(f[grupo]||[]).filter(x=>x.path!==archivo.path)}))
    setQuitar(q=>[...q,{b:grupo==='fotos'?BUCKET_FOTOS:BUCKET_DOCS,path:archivo.path}])
  }
  function guardarFirma(clave,dataUrl){
    setForm(f=>({...f,firmas:{...(f.firmas||{}),[clave]:dataUrl}}))
    setFirmando(null)
  }
  function quitarFirma(clave){
    setForm(f=>{const n={...(f.firmas||{})};delete n[clave];return {...f,firmas:n}})
  }
  const linkFotos=form.fotosToken?urlBase()+'/fotos/'+form.fotosToken:''
  async function copiarLink(){
    try{await navigator.clipboard.writeText(linkFotos);setCopiado(true);setTimeout(()=>setCopiado(false),2000)}
    catch{window.prompt('Copia este enlace:',linkFotos)}
  }
  function conLinkFotos(r){
    return {...r,fotosUrl:(r.fotos&&r.fotos.length&&r.fotosToken)?urlBase()+'/fotos/'+r.fotosToken:''}
  }
  function eliminarRegistro(r){
    guardarRegistros(registros.filter(x=>x.id!==r.id))
  }
  function cambiarItem(clave,valor){setForm(f=>({...f,items:{...f.items,[clave]:f.items[clave]===valor?'':valor}}))}
  function cambiarPct(clave,valor){setForm(f=>({...f,porcentajes:{...f.porcentajes,[clave]:valor}}))}

  const clientes=[...new Set(registros.map(r=>r.cliente).filter(Boolean))].sort()
  const opcionesCliente=unir(clientesDB.map(c=>c.cliente),registros.map(r=>r.cliente))
  const clienteDeForm=buscarCliente(clientesDB,form.cliente)
  const expForm=estadoExpediente(clienteDeForm)

  const rutasVisibles=modal?[...(form.fotos||[]).map(f=>BUCKET_FOTOS+'|'+f.path),...(form.ineEntrega||[]).map(f=>BUCKET_DOCS+'|'+f.path),...(form.ineRecibe||[]).map(f=>BUCKET_DOCS+'|'+f.path)]:[]
  const llaveRutas=[...new Set(rutasVisibles)].sort().join(',')
  useEffect(()=>{
    const faltan=llaveRutas.split(',').filter(x=>x&&!urls[x])
    if(!faltan.length)return
    let vivo=true
    ;(async()=>{
      const nuevos={}
      for(const b of [BUCKET_FOTOS,BUCKET_DOCS]){
        const paths=faltan.filter(x=>x.startsWith(b+'|')).map(x=>x.slice(b.length+1))
        if(!paths.length)continue
        const{data}=await supabase.storage.from(b).createSignedUrls(paths,3600)
        ;(data||[]).forEach(d=>{if(d.signedUrl)nuevos[b+'|'+d.path]=d.signedUrl})
      }
      if(vivo)setUrls(u=>({...u,...nuevos}))
    })()
    return()=>{vivo=false}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[llaveRutas])

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
    descargarChecklistExcel(conLinkFotos(r),[COL1,COL2,COL3,COL4],nombreArchivoFecha((r.tipo==='Entrada'?'CH-ENTRADA-':'CH-SALIDA-')+(r.folio||'equipo').toString().toUpperCase().replace(/[^A-Z0-9]/g,'')))
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
    abrirChecklistPDF(conLinkFotos(r),[COL1,COL2,COL3,COL4])
  }

  const seccionDocs=(<>
        <div style={S.seccion}>Fotos del equipo</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:10}}>
          {(form.fotos||[]).map(f=>{const u=urls[BUCKET_FOTOS+'|'+f.path];return(
            <div key={f.path} style={{position:'relative'}}>
              {u?<a href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt="" style={estiloMiniatura}/></a>:<div style={{...estiloMiniatura,background:'#f0f0f0'}}/>}
              <button type="button" title="Quitar foto" onClick={()=>quitarGuardado('fotos',f)} style={estiloX}>✕</button>
            </div>)})}
          {pend.fotos.map(f=>(
            <div key={f.id} style={{position:'relative'}}>
              <img src={f.preview} alt="" style={{...estiloMiniatura,outline:'2px dashed var(--acento)'}}/>
              <button type="button" title="Quitar foto" onClick={()=>quitarPendiente('fotos',f.id)} style={estiloX}>✕</button>
            </div>))}
          {!(form.fotos||[]).length&&!pend.fotos.length&&<span style={{color:'#aaa',fontSize:13,alignSelf:'center'}}>Sin fotos. Es opcional.</span>}
        </div>
        <label style={{...S.btnGris,display:'inline-block',cursor:'pointer'}}>+ Agregar fotos<input type="file" accept="image/*" multiple style={{display:'none'}} onChange={ev=>{agregarArchivos('fotos',ev.target.files);ev.target.value=''}}/></label>
        {linkFotos&&((form.fotos||[]).length>0||pend.fotos.length>0)&&(
          <div style={{marginTop:12,padding:'10px 12px',background:'#f1f7ff',border:'1px solid #cfe2ff',borderRadius:8}}>
            <div style={{fontSize:11.5,fontWeight:700,color:'#456'}}>ENLACE PARA VER LAS FOTOS · cualquiera que lo tenga puede abrirlo, sin iniciar sesión</div>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <input readOnly style={{...S.input,fontSize:12}} value={linkFotos} onFocus={ev=>ev.target.select()}/>
              <button type="button" style={{...S.btnGris,whiteSpace:'nowrap'}} onClick={copiarLink}>{copiado?'¡Copiado!':'Copiar'}</button>
            </div>
            {pend.fotos.length>0&&<div style={{fontSize:12,color:'#a8730a',marginTop:6}}>El enlace empieza a funcionar al guardar el checklist. También sale en el PDF.</div>}
          </div>
        )}

        <div style={S.seccion}>INE</div>
        {[['ineEntrega','INE de quien entrega el equipo'],['ineRecibe','INE de quien recibe el equipo']].map(([g,titulo])=>(
          <div key={g} style={{marginBottom:12}}>
            <label style={S.label}>{titulo.toUpperCase()}</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
              {(form[g]||[]).map(a=>{const u=urls[BUCKET_DOCS+'|'+a.path];return(
                <span key={a.path} style={estiloChipArchivo}>
                  {u?<a href={u} target="_blank" rel="noopener noreferrer" style={{color:'var(--acento)',fontWeight:700}}>📄 {a.nombre}</a>:'📄 '+a.nombre}
                  <button type="button" onClick={()=>quitarGuardado(g,a)} style={estiloXChip}>✕</button>
                </span>)})}
              {pend[g].map(a=>(
                <span key={a.id} style={{...estiloChipArchivo,outline:'1px dashed var(--acento)'}}>📄 {a.file.name}<button type="button" onClick={()=>quitarPendiente(g,a.id)} style={estiloXChip}>✕</button></span>))}
              <label style={{...S.btnGrisSm,cursor:'pointer'}}>+ Subir (foto o PDF)<input type="file" multiple accept="application/pdf,image/*" style={{display:'none'}} onChange={ev=>{agregarArchivos(g,ev.target.files);ev.target.value=''}}/></label>
            </div>
          </div>
        ))}
        <p style={{color:'#999',fontSize:12,margin:'0 0 4px'}}>Las INE se guardan en un espacio privado: solo las ven los usuarios con sesión iniciada.</p>

      </>)
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
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1380}}>
          <thead><tr>
            <th style={S.th}>FOLIO</th><th style={S.th}>CLIENTE</th><th style={S.th}>TIPO</th><th style={S.th}>EQUIPO</th><th style={S.th}>FECHA</th>
            <th style={S.th}>ENTREGA</th><th style={S.th}>RECIBE</th><th style={S.th}>EXPEDIENTE</th><th style={{...S.th,width:300,textAlign:'center'}}></th>
          </tr></thead>
          <tbody>
            {filtrados.length===0?<tr><td style={{...S.td,textAlign:'center',color:'#999',padding:40}} colSpan={9}>No hay checklists registrados. Usa "+ Nuevo checklist".</td></tr>
            :filtrados.map(r=>(<tr key={r.id} onMouseOver={ev=>ev.currentTarget.style.background='#faf5f6'} onMouseOut={ev=>ev.currentTarget.style.background='transparent'}>
              <td style={{...S.td,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}} title={r.folio} onClick={()=>abrirEditar(r)}>{folioVisible(r.folio)}{r.ligadoA?<div style={{color:'#999',fontSize:11,fontWeight:400}}>Liga: {folioVisible(r.ligadoA)}</div>:null}</td>
              <td style={S.td}>{r.cliente}</td>
              <td style={S.td}><BadgeTipo tipo={r.tipo}/></td>
              <td style={S.td}>{r.equipo}{r.serie?<div style={{color:'#999',fontSize:12}}>Serie: {r.serie}</div>:null}</td>
              <td style={S.td}>{fFecha(r.fecha)}</td>
              <td style={S.td}>{r.quienEntrega||'—'}</td>
              <td style={S.td}>{r.quienRecibe||'—'}</td>
              <td style={S.td}>{(()=>{
                const ex=estadoExpediente(buscarCliente(clientesDB,r.cliente))
                return(<button type="button" title="Ver o actualizar el expediente del cliente" onClick={()=>setExpedienteDe(r.cliente)} style={{border:'none',background:'transparent',cursor:'pointer',padding:0,textAlign:'left'}}>
                  {!ex?<span style={chipExp('#8a6d00','#fff6d8')}>Sin ficha</span>:(
                    <span style={{display:'inline-flex',flexDirection:'column',gap:3}}>
                      <span style={ex.contrato?chipExp('#1b7a3f','#e1f3e7'):chipExp('#b3202f','#fbe0e4')}>{ex.contrato?'Contrato ✓':'Contrato sin firmar'}</span>
                      <span style={!ex.tipo?chipExp('#666','#eee'):ex.entregados===ex.total?chipExp('#1b7a3f','#e1f3e7'):chipExp('#a8730a','#fdf0d4')}>{!ex.tipo?'Falta tipo de persona':(ex.tipo==='moral'?'Moral':'Física')+' · docs '+ex.entregados+'/'+ex.total}</span>
                    </span>
                  )}
                </button>)
              })()}</td>
              <td style={{...S.td,textAlign:'center',whiteSpace:'nowrap'}}>
                {(r.tipo||'Salida')==='Salida'&&<button style={S.btnSm} onClick={()=>registrarEntrada(r)}>+ Entrada</button>}
                <button style={{...S.btnGrisSm,marginLeft:6}} onClick={()=>abrirEditar(r)}>Editar</button>
                <button style={{...S.btnGrisSm,marginLeft:6}} onClick={()=>abrirDocs(r)}>Fotos e INE</button>
                <button style={{...S.btnGrisSm,marginLeft:6}} onClick={()=>descargarPDF(r)}>PDF</button>
                <button style={{...S.btnGrisSm,marginLeft:6}} onClick={()=>descargarExcel(r)}>Excel</button>
                {r.fotosToken&&(r.fotos||[]).length>0&&<a href={'/fotos/'+r.fotosToken} target="_blank" rel="noopener noreferrer" style={{...S.btnGrisSm,marginLeft:6,textDecoration:'none',display:'inline-block'}}>Fotos ({r.fotos.length})</a>}
                <span style={{marginLeft:6,display:'inline-block'}}><DeleteButton size="sm" title="Eliminar checklist" onConfirm={()=>eliminarRegistro(r)}/></span>
              </td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {pideNip&&<NipModal mensaje="Escribe el NIP para cambiar el folio." onCorrecto={()=>{setPideNip(false);setFolioManual(true)}} onCancelar={()=>setPideNip(false)}/>}

      {firmando&&<FirmaPad titulo={'Firma · '+firmando.t} subtitulo={firmando.s+' — firma con el dedo dentro del recuadro'} onGuardar={d=>guardarFirma(firmando.k,d)} onCancelar={()=>setFirmando(null)}/>}
      {expedienteDe&&<ExpedienteCliente nombreCliente={expedienteDe} clientes={clientesDB} onGuardar={guardarClienteDB} onCerrar={()=>setExpedienteDe(null)}/>}

      {/* FOTOS E INE (desde oficina) */}
      {modal&&soloDocs&&(<div style={S.modalBg} onClick={cerrarModal}><div style={{...S.modal,maxWidth:760}} onClick={ev=>ev.stopPropagation()}>
        <h2 style={{fontSize:22,fontWeight:800,margin:0}}>Fotos e INE</h2>
        <p style={{color:'#888',fontSize:13,margin:'4px 0 6px'}}>{folioVisible(form.folio)} · {form.cliente} · {form.equipo}</p>
        {seccionDocs}
        <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:16}}>
          <button style={S.btnGris} onClick={cerrarModal} disabled={guardando}>Cancelar</button>
          <button style={{...S.btn,opacity:guardando?0.6:1}} onClick={guardarForm} disabled={guardando}>{guardando?'Guardando…':'Guardar'}</button>
        </div>
      </div></div>)}

      {/* MODAL ALTA/EDICIÓN */}
      {modal&&!soloDocs&&(<div style={S.modalBg} onClick={()=>setModal(false)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{fontSize:22,fontWeight:800,margin:0}}>{registros.some(r=>r.id===form.id)?'Editar checklist':'Nuevo checklist'}</h2>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {form.ligadoA&&<span style={{fontSize:12,color:'#999',whiteSpace:'nowrap'}}>Ligado a {folioVisible(form.ligadoA)}</span>}
            <select translate="no" className="notranslate" style={{...S.input,width:120}} value={form.tipo} onChange={ev=>setForm({...form,tipo:ev.target.value})}><option>Salida</option><option>Entrada</option></select>
            {folioManual?(
              <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
                <span style={{fontWeight:700,color:VINO}}>Folio:</span>
                <input style={{...S.input,width:250,fontWeight:700}} value={form.folio} onChange={ev=>editarFolio(ev.target.value)}/>
                <button type="button" style={S.btnGrisSm} title="Volver al folio que asigna el sistema" onClick={folioAutomatico}>Automático</button>
              </span>
            ):(
              <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
                <span style={{fontWeight:700,color:VINO,whiteSpace:'nowrap'}} title={form.folio}>Folio: {folioVisible(form.folio)}</span>
                <button type="button" style={S.btnGrisSm} title="Cambiar el folio (pide NIP)" onClick={()=>setPideNip(true)}>✎ Cambiar</button>
              </span>
            )}
          </div>
        </div>

        <div style={S.seccion}>Datos generales</div>
        <div style={S.grid3}>
          <div><label style={S.label}>CLIENTE</label><CampoOpciones opciones={opcionesCliente} valor={form.cliente} onChange={cambiarCliente} vacio="Selecciona el cliente" placeholder="Escribe el nombre del cliente" textoOtro="Cliente nuevo (escribir)"/></div>
          <div><label style={S.label}>FECHA</label><input type="date" style={S.input} value={form.fecha} onChange={ev=>cambiarFecha(ev.target.value)}/></div>
          <div><label style={S.label}>HORA</label><input type="time" style={S.input} value={form.hora} onChange={ev=>setForm({...form,hora:ev.target.value})}/></div>
        </div>
        {form.cliente.trim()&&(
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',margin:'0 0 12px',padding:'8px 12px',background:'#f6f8fa',border:'1px solid #e8ecf0',borderRadius:8}}>
            <strong style={{fontSize:11.5,color:'#667'}}>EXPEDIENTE DEL CLIENTE</strong>
            {!clienteDeForm?<span style={chipExp('#8a6d00','#fff6d8')}>Sin ficha en Gestión de Clientes</span>:(
              <>
                <span style={expForm.contrato?chipExp('#1b7a3f','#e1f3e7'):chipExp('#b3202f','#fbe0e4')}>{expForm.contrato?'Contrato firmado':'Contrato sin firmar'}</span>
                {expForm.tipo?<span style={expForm.entregados===expForm.total?chipExp('#1b7a3f','#e1f3e7'):chipExp('#a8730a','#fdf0d4')}>{expForm.tipo==='moral'?'Persona moral':'Persona física'} · documentos {expForm.entregados}/{expForm.total}</span>:<span style={chipExp('#666','#eee')}>Falta indicar persona física o moral</span>}
              </>
            )}
            <button type="button" style={{...S.btnGrisSm,marginLeft:'auto'}} onClick={()=>setExpedienteDe(form.cliente)}>Ver / actualizar</button>
          </div>
        )}
        <div style={S.grid3}>
          <div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><label style={S.label}>ORDEN DE COMPRA</label><button type="button" onClick={()=>alternarNA('oc')} style={{...S.btnGrisSm,padding:'1px 10px',fontSize:11,marginBottom:4,background:form.ocNA?'#222':'#e9e9e9',color:form.ocNA?'#fff':'#333'}}>{form.ocNA?'✓ N/A':'N/A'}</button></div><input style={S.input} disabled={form.ocNA} value={form.ordenCompra} onChange={ev=>setForm({...form,ordenCompra:ev.target.value})}/></div>
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

        <div style={S.grid2}>
          <div><label style={S.label}>RECIBE EL EQUIPO (CLIENTE)</label><input style={S.input} value={form.recibeCliente} onChange={ev=>setForm({...form,recibeCliente:ev.target.value})}/></div>
          <div><label style={S.label}>RETIRA EL EQUIPO (CLIENTE)</label><input style={S.input} value={form.retiraCliente} onChange={ev=>setForm({...form,retiraCliente:ev.target.value})}/></div>
        </div>

        <div style={S.seccion}>Firmas digitales (opcional)</div>
        <p style={{color:'#888',fontSize:12.5,margin:'0 0 10px'}}>Cada quien firma con el dedo en la pantalla. La firma sale impresa en su recuadro del PDF y del Excel.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {FIRMAS.map(f=>{const img=(form.firmas||{})[f.k];return(
            <div key={f.k} style={{border:'1px solid #e3e6ea',borderRadius:8,padding:10,textAlign:'center'}}>
              <div style={{fontSize:11.5,fontWeight:800,color:VINO}}>{f.t.toUpperCase()}</div>
              <div style={{fontSize:10.5,color:'#999',marginBottom:6}}>{f.s}</div>
              <div style={{height:70,display:'flex',alignItems:'center',justifyContent:'center',background:'#fafbfc',border:'1px dashed #d5d9dd',borderRadius:6,marginBottom:8}}>
                {img?<img src={img} alt="Firma" style={{maxWidth:'100%',maxHeight:'100%'}}/>:<span style={{color:'#bbb',fontSize:12}}>Sin firma</span>}
              </div>
              <div style={{display:'flex',gap:6,justifyContent:'center'}}>
                <button type="button" style={{...S.btnSm,padding:'6px 10px'}} onClick={()=>setFirmando(f)}>{img?'Volver a firmar':'✍ Firmar'}</button>
                {img&&<button type="button" style={{...S.btnGrisSm,padding:'6px 10px'}} onClick={()=>quitarFirma(f.k)}>Quitar</button>}
              </div>
            </div>)})}
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:16}}>
          <button style={S.btnGris} onClick={()=>{reiniciarArchivos();setModal(false)}} disabled={guardando}>Cancelar</button>
          <button style={{...S.btn,opacity:guardando?0.6:1}} onClick={guardarForm} disabled={guardando}>{guardando?'Guardando…':'Guardar'}</button>
        </div>
      </div></div>)}

    </div></div>
  )
}
