import { useState } from 'react'
import { useListaCompartida } from '../../hooks/useSharedTable'
import Sidebar from '../../components/Sidebar'
import DeleteButton from '../../components/DeleteButton'
import logo from '../../assets/logo.png'
import { descargarExcelBonito, nombreArchivoFecha } from '../../utils/exportExcel'

const VINO = 'var(--acento)'
const VINO_IMPRESION = '#1d5c8f' // hex fijo para el PDF (ventana aparte, sin las variables CSS de la app)
const KEY_CHECKLISTS = 'checklistsEntregaSalida'

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

const TODOS_ITEMS = [...COL1,...COL2,...COL3,...COL4]

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
  recibeCliente:'',retiraCliente:''
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
    setForm({...CHECKLIST_NUEVO,id:uid(),folioSeq:seq,folio:construirFolio(seq,'',hoyISO()),fecha:hoyISO(),items:{},porcentajes:{}})
    setModal(true)
  }
  function abrirEditar(r){setForm({...CHECKLIST_NUEVO,folioSeq:r.folioSeq||siguienteSeq(),...r,items:{...r.items},porcentajes:{...r.porcentajes}});setModal(true)}
  function registrarEntrada(salida){
    const seq=siguienteSeq()
    const fecha=hoyISO()
    setForm({
      ...CHECKLIST_NUEVO,id:uid(),folioSeq:seq,folio:construirFolio(seq,salida.cliente,fecha),
      tipo:'Entrada',ligadoA:salida.folio,fecha,
      cliente:salida.cliente,nombreContacto:salida.nombreContacto,telefono:salida.telefono,correo:salida.correo,
      equipo:salida.equipo,marca:salida.marca,modelo:salida.modelo,serie:salida.serie,
      accesorio:salida.accesorio,accMarca:salida.accMarca,accModelo:salida.accModelo,accSerie:salida.accSerie,
      ubicacion:salida.ubicacion,items:{},porcentajes:{}
    })
    setModal(true)
  }
  function cambiarCliente(cliente){setForm(f=>({...f,cliente,folio:construirFolio(f.folioSeq,cliente,f.fecha)}))}
  function cambiarFecha(fecha){setForm(f=>({...f,fecha,folio:construirFolio(f.folioSeq,f.cliente,fecha)}))}
  function guardarForm(){
    if(!form.cliente.trim()){alert('Indica el cliente.');return}
    if(!form.equipo.trim()){alert('Indica el equipo.');return}
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

  const filtrados=registros.filter(r=>{
    const t=(r.folio+' '+r.cliente+' '+r.equipo+' '+r.marca+' '+r.serie).toLowerCase()
    return t.includes(busqueda.toLowerCase())&&(!fCliente||r.cliente===fCliente)&&(!fTipo||(r.tipo||'Salida')===fTipo)
  }).sort((a,b)=>(a.cliente||'').localeCompare(b.cliente||'')||(b.fecha||'').localeCompare(a.fecha||''))

  // ================= EXPORTES =================

  function descargarExcel(r){
    const columnas=['Campo','Valor']
    const filas=[
      ['Folio',r.folio],['Tipo',r.tipo||'Salida'],['Ligado a',r.ligadoA||''],['Cliente',r.cliente],['Fecha',r.fecha],['Hora',r.hora],['Orden de compra',r.ordenCompra],
      ['Equipo',r.equipo],['Nivel combustible',r.nivelCombustible],['Horómetro',r.horometro],['Marca',r.marca],['Modelo',r.modelo],['Serie',r.serie],
      ['Accesorio',r.accesorio],['Marca accesorio',r.accMarca],['Modelo accesorio',r.accModelo],['Serie accesorio',r.accSerie],['Flete',r.flete],
      ['Nombre contacto',r.nombreContacto],['Teléfono',r.telefono],['Correo',r.correo],
      ['Ubicación',r.ubicacion],['Hora de entrega',r.horaEntrega],['Fecha de entrega',r.fechaEntrega],['Fecha de retiro',r.fechaRetiro],['Hora de retiro',r.horaRetiro],['Horómetro retiro',r.horometroRetiro],
      ['Quién entrega',r.quienEntrega],['Quién recibe',r.quienRecibe],
      ...TODOS_ITEMS.map(it=>[it.n,(r.items&&r.items[it.n])||'']),
      ...TODOS_ITEMS.filter(it=>it.pct).map(it=>[it.n+' (%)',(r.porcentajes&&r.porcentajes[it.n])||'']),
      ['Servicio pre-entrega · fecha',r.servPreEntregaFecha],['Servicio pre-entrega · horómetro',r.servPreEntregaHorometro],
      ['Próximo servicio · fecha',r.proximoServicioFecha],['Próximo servicio · horómetro',r.proximoServicioHorometro],
      ['Reparaciones por daños a considerar',r.reparaciones],['Firma de enterado y conformidad',r.firmaEnterado],['Observaciones / uso en obra',r.observaciones],
      ['Recibe el equipo (cliente)',r.recibeCliente],['Retira el equipo (cliente)',r.retiraCliente]
    ]
    descargarExcelBonito({
      titulo:'Checklist de '+(r.tipo||'Salida')+' de Equipo',
      subtitulo:'Folio '+r.folio+' · '+(r.cliente||''),
      columnas,filas,
      nombreArchivo:nombreArchivoFecha((r.tipo==='Entrada'?'CH-ENTRADA-':'CH-SALIDA-')+(r.folio||'equipo').toString().toUpperCase().replace(/[^A-Z0-9]/g,''))
    })
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

  function celdaEstado(v){
    if(v==='B'||v==='SI')return '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:10px;font-weight:700;">'+v+'</span>'
    if(v==='R')return '<span style="background:#fff3e0;color:#c98a00;padding:2px 6px;border-radius:10px;font-weight:700;">'+v+'</span>'
    if(v==='M'||v==='NO')return '<span style="background:#fce4ec;color:#c62828;padding:2px 6px;border-radius:10px;font-weight:700;">'+v+'</span>'
    return '—'
  }

  function filaItems(cols,r){
    const maxLen=Math.max(...cols.map(c=>c.length))
    let html=''
    for(let i=0;i<maxLen;i++){
      html+='<tr>'
      cols.forEach(col=>{
        const it=col[i]
        if(!it){html+='<td colspan="2"></td>';return}
        const val=(r.items&&r.items[it.n])||''
        const pct=it.pct?((r.porcentajes&&r.porcentajes[it.n])?' ('+r.porcentajes[it.n]+'%)':''):''
        html+='<td>'+it.n+pct+'</td><td style="text-align:center;width:46px">'+celdaEstado(val)+'</td>'
      })
      html+='</tr>'
    }
    return html
  }

  function descargarPDF(r){
    const ventana=window.open('','_blank')
    ventana.document.write(`
      <html><head><title>Entrega y Salida ${r.folio}</title>
      <style>
        *{box-sizing:border-box;}
        @page{size:auto;margin:0;}
        body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:12mm 10mm;color:#000;font-size:11.5px;}
        table{width:100%;border-collapse:collapse;}
        td,th{border:1px solid #999;padding:5px 7px;}
        .cab{display:flex;align-items:center;gap:14px;border:2px solid #000;padding:10px;margin-bottom:10px;}
        .cab img{height:60px;}
        .cab h1{color:${VINO_IMPRESION};font-size:19px;margin:0;}
        .cab h2{font-size:12px;margin:4px 0 0;text-align:center;}
        .folio{margin-left:auto;border:1px solid #000;padding:6px 14px;text-align:center;font-weight:700;}
        .datos td{font-size:11px;}
        .datos .lbl{background:#eee;font-weight:700;width:16%;}
        h3.sec{background:${VINO_IMPRESION};color:#fff;padding:5px 8px;margin:14px 0 6px;font-size:12px;}
        .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .grid4 table td{font-size:10.5px;padding:3px 5px;}
        textarea,.caja{border:1px solid #999;min-height:50px;padding:6px;white-space:pre-wrap;}
        .firmas{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:16px;}
        .firmas div{border:1px solid #000;padding:8px;min-height:70px;font-size:11px;}
        .firmas .tit{background:#eee;font-weight:700;text-align:center;border-bottom:1px solid #000;}
        @media print{button{display:none}}
      </style></head>
      <body>
        <div class="cab">
          <img src="${logo}"/>
          <div style="flex:1"><h1>MAQUINARIA SOPORTE Y LOGISTICA SA DE CV</h1><h2>${(r.tipo||'Salida').toUpperCase()} DE EQUIPO${r.ligadoA?' · Ligado a '+r.ligadoA:''}</h2></div>
          <div class="folio">FOLIO<br><strong>${r.folio}</strong></div>
        </div>
        <table class="datos">
          <tr><td class="lbl">CLIENTE</td><td colspan="5">${r.cliente||''}</td></tr>
          <tr><td class="lbl">FECHA</td><td>${fFecha(r.fecha)}</td><td class="lbl">HORA</td><td>${r.hora||''}</td><td class="lbl">ORDEN DE COMPRA</td><td>${r.ordenCompra||''}</td></tr>
          <tr><td class="lbl">EQUIPO</td><td>${r.equipo||''}</td><td class="lbl">NIVEL COMBUSTIBLE</td><td>${r.nivelCombustible||''}</td><td class="lbl">HORÓMETRO</td><td>${r.horometro||''}</td></tr>
          <tr><td class="lbl">MARCA</td><td>${r.marca||''}</td><td class="lbl">MODELO</td><td>${r.modelo||''}</td><td class="lbl">SERIE</td><td>${r.serie||''}</td></tr>
          <tr><td class="lbl">ACCESORIO</td><td>${r.accesorio||''}</td><td class="lbl">MARCA/MODELO ACC.</td><td>${r.accMarca||''} ${r.accModelo||''}</td><td class="lbl">SERIE ACC. / FLETE</td><td>${r.accSerie||''} / ${r.flete||''}</td></tr>
          <tr><td class="lbl">CONTACTO</td><td>${r.nombreContacto||''}</td><td class="lbl">TELÉFONO</td><td>${r.telefono||''}</td><td class="lbl">CORREO</td><td>${r.correo||''}</td></tr>
          <tr><td class="lbl">UBICACIÓN</td><td>${r.ubicacion||''}</td><td class="lbl">ENTREGA</td><td>${fFecha(r.fechaEntrega)} ${r.horaEntrega||''}</td><td class="lbl">RETIRO</td><td>${fFecha(r.fechaRetiro)} ${r.horaRetiro||''} · ${r.horometroRetiro||''}</td></tr>
          <tr><td class="lbl">ENTREGA EL EQUIPO</td><td colspan="2">${r.quienEntrega||''}</td><td class="lbl">RECIBE EL EQUIPO</td><td colspan="2">${r.quienRecibe||''}</td></tr>
        </table>

        <h3 class="sec">CHECKLIST DE CONDICIÓN — B: Bueno · R: Regular · M: Malo</h3>
        <div class="grid4">
          <table>${filaItems([COL1],r)}</table>
          <table>${filaItems([COL2],r)}</table>
          <table>${filaItems([COL3],r)}</table>
          <table>${filaItems([COL4],r)}</table>
        </div>

        <table class="datos" style="margin-top:10px">
          <tr><td class="lbl">SERV. PRE-ENTREGA</td><td>${fFecha(r.servPreEntregaFecha)} · Hrm. ${r.servPreEntregaHorometro||'—'}</td><td class="lbl">PRÓXIMO SERVICIO</td><td>${fFecha(r.proximoServicioFecha)} · Hrm. ${r.proximoServicioHorometro||'—'}</td></tr>
        </table>

        <h3 class="sec">REPARACIONES POR DAÑOS A CONSIDERAR</h3>
        <div class="caja">${(r.reparaciones||'—').replace(/</g,'&lt;')}</div>
        <h3 class="sec">OBSERVACIONES / USO EN OBRA</h3>
        <div class="caja">${(r.observaciones||'—').replace(/</g,'&lt;')}</div>
        <h3 class="sec">FIRMA DE ENTERADO Y CONFORMIDAD DE LA PERSONA ENCARGADA DEL EQUIPO</h3>
        <div class="caja">${(r.firmaEnterado||'—').replace(/</g,'&lt;')}</div>

        <div class="firmas">
          <div><div class="tit">RECIBE EL EQUIPO<br>CLIENTE</div>${r.recibeCliente||''}</div>
          <div><div class="tit">ENTREGA/RETIRA EL EQUIPO<br>MAQUINARIA SOPORTE Y LOGISTICA</div>${r.quienEntrega||''}</div>
          <div><div class="tit">RETIRA EL EQUIPO (CLIENTE)</div>${r.retiraCliente||''}</div>
          <div><div class="tit">Vo. Bo.<br>MAQUINARIA SOPORTE Y LOGISTICA SA DE CV</div>LIC. FRANCISCO TORRES MORALES</div>
        </div>
      </body></html>
    `)
    ventana.document.close()
    ventana.print()
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

      {/* MODAL ALTA/EDICIÓN */}
      {modal&&(<div style={S.modalBg} onClick={()=>setModal(false)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{fontSize:22,fontWeight:800,margin:0}}>{registros.some(r=>r.id===form.id)?'Editar checklist':'Nuevo checklist'}</h2>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {form.ligadoA&&<span style={{fontSize:12,color:'#999'}}>Ligado a {form.ligadoA}</span>}
            <select translate="no" className="notranslate" style={{...S.input,width:120}} value={form.tipo} onChange={ev=>setForm({...form,tipo:ev.target.value})}><option>Salida</option><option>Entrada</option></select>
            <span style={{fontWeight:700,color:VINO}}>Folio: {form.folio}</span>
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
          <div><label style={S.label}>UBICACIÓN</label><input style={S.input} value={form.ubicacion} onChange={ev=>setForm({...form,ubicacion:ev.target.value})}/></div>
        </div>

        <div style={S.seccion}>Equipo</div>
        <div style={S.grid4}>
          <div><label style={S.label}>EQUIPO</label><input style={S.input} value={form.equipo} onChange={ev=>setForm({...form,equipo:ev.target.value})}/></div>
          <div><label style={S.label}>MARCA</label><input style={S.input} value={form.marca} onChange={ev=>setForm({...form,marca:ev.target.value})}/></div>
          <div><label style={S.label}>MODELO</label><input style={S.input} value={form.modelo} onChange={ev=>setForm({...form,modelo:ev.target.value})}/></div>
          <div><label style={S.label}>SERIE</label><input style={S.input} value={form.serie} onChange={ev=>setForm({...form,serie:ev.target.value})}/></div>
        </div>
        <div style={S.grid4}>
          <div><label style={S.label}>NIVEL COMBUSTIBLE</label><select style={S.input} value={form.nivelCombustible} onChange={ev=>setForm({...form,nivelCombustible:ev.target.value})}><option value="">Selecciona</option>{NIVELES.map(n=><option key={n}>{n}</option>)}</select></div>
          <div><label style={S.label}>HORÓMETRO</label><input style={S.input} value={form.horometro} onChange={ev=>setForm({...form,horometro:ev.target.value})}/></div>
          <div><label style={S.label}>FLETE</label><input style={S.input} value={form.flete} onChange={ev=>setForm({...form,flete:ev.target.value})}/></div>
          <div></div>
        </div>

        <div style={S.seccion}>Accesorio (opcional)</div>
        <div style={S.grid4}>
          <div><label style={S.label}>ACCESORIO</label><input style={S.input} value={form.accesorio} onChange={ev=>setForm({...form,accesorio:ev.target.value})}/></div>
          <div><label style={S.label}>MARCA</label><input style={S.input} value={form.accMarca} onChange={ev=>setForm({...form,accMarca:ev.target.value})}/></div>
          <div><label style={S.label}>MODELO</label><input style={S.input} value={form.accModelo} onChange={ev=>setForm({...form,accModelo:ev.target.value})}/></div>
          <div><label style={S.label}>SERIE</label><input style={S.input} value={form.accSerie} onChange={ev=>setForm({...form,accSerie:ev.target.value})}/></div>
        </div>

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
        <div style={S.grid4}>
          <div><label style={S.label}>SERV. PRE-ENTREGA · FECHA</label><input type="date" style={S.input} value={form.servPreEntregaFecha} onChange={ev=>setForm({...form,servPreEntregaFecha:ev.target.value})}/></div>
          <div><label style={S.label}>SERV. PRE-ENTREGA · HORÓMETRO</label><input style={S.input} value={form.servPreEntregaHorometro} onChange={ev=>setForm({...form,servPreEntregaHorometro:ev.target.value})}/></div>
          <div><label style={S.label}>PRÓXIMO SERVICIO · FECHA</label><input type="date" style={S.input} value={form.proximoServicioFecha} onChange={ev=>setForm({...form,proximoServicioFecha:ev.target.value})}/></div>
          <div><label style={S.label}>PRÓXIMO SERVICIO · HORÓMETRO</label><input style={S.input} value={form.proximoServicioHorometro} onChange={ev=>setForm({...form,proximoServicioHorometro:ev.target.value})}/></div>
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
