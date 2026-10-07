import { useState } from 'react'
import { useListaCompartida, useListaCatalogo } from '../../hooks/useSharedTable'
import Sidebar from '../../components/Sidebar'
import DeleteButton from '../../components/DeleteButton'
import { descargarExcelBonito, nombreArchivoSemana } from '../../utils/exportExcel'

const VINO = 'var(--acento)'
const KEY_FLETES = 'fletesMaqsol'
const KEY_EMPRESAS = 'empresasFleteMaqsol'

const FLETE_NUEVO = {
  id:'',folio:'',fecha:'',
  empresa:'',proveedor:'',equipo:'',serieEquipo:'',
  oc:'',numOC:'',horaMovimiento:'',
  origen:'',destino:'',
  costo:'',pagado:'Pendiente',
  estado:'Programado',observaciones:''
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
  stat:{flex:1,minWidth:130,background:'#fff',border:'1px solid #e6e6e6',borderRadius:10,padding:'16px 18px',boxShadow:'0 1px 3px rgba(0,0,0,.05)'},
  statN:{fontSize:26,fontWeight:800,color:VINO},
  statK:{fontSize:12,color:'#777',fontWeight:700,letterSpacing:0.3}
}

function IconoFlete({size=26,color=VINO}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="7" width="13" height="9" rx="1"/>
      <path d="M14 10h4l3 3v3h-7z"/>
      <circle cx="6" cy="18.5" r="1.6"/>
      <circle cx="17.5" cy="18.5" r="1.6"/>
      <path d="M1 11h9"/>
    </svg>
  )
}

function uid(){return 'x'+Date.now()+Math.random().toString(36).slice(2,6)}
function fFecha(f){return f?new Date(f+'T00:00:00').toLocaleDateString('es-MX'):'—'}
function hoyISO(){return new Date().toISOString().slice(0,10)}

function textoOC(f){
  if(f.oc==='enviada')return 'Enviada'+(f.numOC?' · N° '+f.numOC:'')
  if(f.oc==='sin')return 'No lleva orden'
  if(f.oc==='pendiente')return 'Pendiente de enviar'
  return '—'
}
function dinero(v){const n=parseFloat(String(v).replace(/[$,\s]/g,''));return isNaN(n)?(v||'—'):'$'+n.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function pdfFlete(f){
  const fila=(k,v)=>`<tr><th>${k}</th><td>${esc(v)||'—'}</td></tr>`
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(f.folio)}</title><style>
    @page{size:letter portrait;margin:0}
    body{font-family:Arial,sans-serif;margin:0;padding:16mm;color:#222}
    h1{color:#8f1d2c;font-size:22px;margin:0}
    .sub{color:#777;font-size:12px;margin:2px 0 14px}
    .bar{border-top:3px solid #8f1d2c;margin:8px 0 14px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{width:34%;text-align:left;background:#f4e9eb;color:#8f1d2c;padding:8px 10px;border:1px solid #e3d3d6}
    td{padding:8px 10px;border:1px solid #e3d3d6}
    .imp{font-size:16px;font-weight:700}
    .pie{margin-top:14px;font-size:10px;color:#999;text-align:center}
  </style></head><body>
    <h1>BITÁCORA DE FLETE · ${esc(f.folio)}</h1>
    <div class="sub">MAQUINARIA SOPORTE Y LOGÍSTICA SA DE CV · ${esc(fFecha(f.fecha))}</div><div class="bar"></div>
    <table>
      ${fila('Empresa (solicitó y pagó el flete)',f.empresa)}
      ${fila('Proveedor que dio el servicio',f.proveedor)}
      ${fila('Equipo movido',f.equipo)}
      ${fila('Serie del equipo',f.serieEquipo)}
      ${fila('Origen',f.origen)}
      ${fila('Destino',f.destino)}
      ${fila('Hora de movimiento del equipo',f.horaMovimiento)}
      ${fila('Orden de compra',textoOC(f))}
      <tr><th>Importe (sin impuestos)</th><td class="imp">${esc(f.costo?dinero(f.costo):'—')}</td></tr>
      ${fila('Pago',f.pagado||'Pendiente')}
      ${fila('Estado del viaje',f.estado==='En Ruta'?'Programado':f.estado)}
      ${fila('Observaciones',f.observaciones)}
    </table>
    <div class="pie">Documento generado desde MAQSISTEM · ${esc(f.folio)}</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
  </body></html>`
  const w=window.open('','_blank');if(!w){alert('Permite ventanas emergentes para ver el PDF.');return}
  w.document.write(html);w.document.close()
}

function BadgeEstado({estado}){
  const map={
    'Programado':{bg:'#fff3e0',c:'#c98a00'},
    'Entregado':{bg:'#e8f5e9',c:'#2e7d32'},
    'Cancelado':{bg:'#fce4ec',c:'#c62828'}
  }
  const e=estado==='En Ruta'?'Programado':estado
  const s=map[e]||map['Programado']
  return <span style={{background:s.bg,color:s.c,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{e}</span>
}
function BadgePago({pagado}){
  const ok=pagado==='Pagado'
  return <span style={{background:ok?'#e8f5e9':'#fce4ec',color:ok?'#2e7d32':'#c62828',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{pagado||'Pendiente'}</span>
}

export default function BitacoraFleteros(){
  const[fletes,guardarFletes]=useListaCompartida('fletes')
  const[empresas,guardarEmpresas]=useListaCatalogo('empresas_flete')
  const[clientesDB]=useListaCompartida('clientes')
  const[modal,setModal]=useState(false)
  const[form,setForm]=useState(FLETE_NUEVO)
  const[verFlete,setVerFlete]=useState(null)
  const[modoNuevaEmpresa,setModoNuevaEmpresa]=useState(false)
  const[nuevaEmpresa,setNuevaEmpresa]=useState('')
  const[busqueda,setBusqueda]=useState('')
  const[fEstado,setFEstado]=useState('')
  const[fPagado,setFPagado]=useState('')

  function siguienteFolio(){
    const n=fletes.reduce((max,f)=>{
      const m=/F-(\d+)/.exec(f.folio||'')
      return m?Math.max(max,parseInt(m[1],10)):max
    },0)
    const d=new Date()
    return 'F-'+String(n+1).padStart(3,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+d.getFullYear()
  }

  function abrirNuevo(){
    setForm({...FLETE_NUEVO,id:uid(),folio:siguienteFolio(),fecha:hoyISO()})
    setModoNuevaEmpresa(false);setModal(true)
  }
  function abrirEditar(f){setForm({...FLETE_NUEVO,...f});setModoNuevaEmpresa(false);setModal(true)}
  function guardarForm(){
    if(!form.fecha){alert('Indica la fecha del flete.');return}
    if(!form.destino.trim()){alert('Indica el destino del flete.');return}
    const existe=fletes.some(f=>f.id===form.id)
    const lista=existe?fletes.map(f=>f.id===form.id?{...f,...form}:f):[...fletes,form]
    guardarFletes(lista);setModal(false)
  }
  function eliminarFlete(f){
    guardarFletes(fletes.filter(x=>x.id!==f.id));setVerFlete(null)
  }
  function cambiarEstado(f,estado){guardarFletes(fletes.map(x=>x.id===f.id?{...x,estado}:x))}
  function cambiarPago(f,pagado){guardarFletes(fletes.map(x=>x.id===f.id?{...x,pagado}:x))}

  function agregarEmpresa(){const n=nuevaEmpresa.trim();if(!n)return;if(!empresas.includes(n))guardarEmpresas([...empresas,n].sort());setForm({...form,proveedor:n});setNuevaEmpresa('');setModoNuevaEmpresa(false)}
  function cambiarEmpresa(v){if(v==='__nueva__'){setModoNuevaEmpresa(true);return};setModoNuevaEmpresa(false);setForm({...form,proveedor:v})}

  const filtrados=fletes.filter(f=>{
    const t=(f.folio+' '+f.origen+' '+f.destino+' '+f.empresa+' '+f.equipo+' '+f.serieEquipo+' '+(f.proveedor||'')+' '+(f.numOC||'')).toLowerCase()
    return t.includes(busqueda.toLowerCase())&&(!fEstado||f.estado===fEstado)&&(!fPagado||f.pagado===fPagado)
  }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''))

  const stats={
    programados:fletes.filter(f=>f.estado==='Programado').length,
    pendientesPago:fletes.filter(f=>f.pagado!=='Pagado').length,
    total:fletes.length
  }

  function exportarLista(){
    const columnas=['Folio','Fecha','Empresa (cliente)','Proveedor del flete','Equipo','Serie','Origen','Destino','Hora','Orden de compra','Importe sin impuestos','Pagado','Estado','Observaciones']
    const filas=filtrados.map(f=>[f.folio,fFecha(f.fecha),f.empresa,f.proveedor,f.equipo,f.serieEquipo,f.origen,f.destino,f.horaMovimiento,textoOC(f),f.costo?'$'+f.costo:'',f.pagado,f.estado,f.observaciones])
    descargarExcelBonito({
      titulo:'Bitácora de Fleteros',
      subtitulo:'MAQUINARIA SOPORTE Y LOGISTICA SA DE CV · '+filtrados.length+' fletes',
      columnas,filas,
      nombreArchivo:nombreArchivoSemana('B-FLETES')
    })
  }

  return(
    <div style={{display:'flex',minHeight:'100vh'}}><Sidebar/><div style={S.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h1 style={{...S.h1,display:'flex',alignItems:'center',gap:10}}><IconoFlete/> Bitácora Fleteros</h1><p style={S.sub}>Fletes de equipo entre origen y destino · {fletes.length} registrados</p></div>
        <div style={{display:'flex',gap:10}}><button style={S.btnGris} onClick={exportarLista}>Descargar lista</button><button style={S.btn} onClick={abrirNuevo}>+ Agregar flete</button></div>
      </div>

      <div style={{display:'flex',gap:16,marginBottom:22,flexWrap:'wrap'}}>
        <div style={S.stat}><div style={S.statN}>{stats.programados}</div><div style={S.statK}>PROGRAMADOS</div></div>
        <div style={S.stat}><div style={S.statN}>{stats.pendientesPago}</div><div style={S.statK}>PENDIENTES DE PAGO</div></div>
        <div style={S.stat}><div style={S.statN}>{stats.total}</div><div style={S.statK}>TOTAL REGISTRADOS</div></div>
      </div>

      <div style={S.card}>
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr',gap:18,alignItems:'end'}}>
          <div><label style={S.label}>BUSCAR</label><input style={S.input} placeholder="Folio, empresa, equipo, serie, origen o destino" value={busqueda} onChange={ev=>setBusqueda(ev.target.value)}/></div>
          <div><label style={S.label}>ESTADO</label><select style={S.input} value={fEstado} onChange={ev=>setFEstado(ev.target.value)}><option value="">Todos</option><option>Programado</option><option>Entregado</option><option>Cancelado</option></select></div>
          <div><label style={S.label}>PAGO</label><select style={S.input} value={fPagado} onChange={ev=>setFPagado(ev.target.value)}><option value="">Todos</option><option>Pagado</option><option>Pendiente</option></select></div>
        </div>
      </div>

      <div style={{...S.card,padding:0,overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1250}}>
          <thead><tr>
            <th style={S.th}>FOLIO</th><th style={S.th}>FECHA</th><th style={S.th}>EMPRESA</th><th style={S.th}>EQUIPO</th>
            <th style={S.th}>ORIGEN → DESTINO</th><th style={S.th}>OC</th><th style={S.th}>PAGO</th><th style={S.th}>ESTADO</th><th style={{...S.th,width:120,textAlign:'center'}}></th>
          </tr></thead>
          <tbody>
            {filtrados.length===0?<tr><td style={{...S.td,textAlign:'center',color:'#999',padding:40}} colSpan={9}>No hay fletes registrados. Usa "+ Agregar flete".</td></tr>
            :filtrados.map(f=>(<tr key={f.id} onMouseOver={ev=>ev.currentTarget.style.background='#faf5f6'} onMouseOut={ev=>ev.currentTarget.style.background='transparent'}>
              <td style={{...S.td,fontWeight:700,cursor:'pointer'}} onClick={()=>setVerFlete(f)}>{f.folio}</td>
              <td style={S.td}>{fFecha(f.fecha)}</td>
              <td style={S.td}>{f.empresa||<span style={{color:'#bbb'}}>—</span>}</td>
              <td style={S.td}>{f.equipo||<span style={{color:'#bbb'}}>—</span>}{f.serieEquipo?<div style={{color:'#999',fontSize:12}}>Serie: {f.serieEquipo}</div>:null}</td>
              <td style={S.td}>{f.origen||'—'} → {f.destino}{f.horaMovimiento?<div style={{color:'#999',fontSize:12}}>{f.horaMovimiento} h</div>:null}</td>
              <td style={S.td}>{textoOC(f)}</td>
              <td style={S.td}><BadgePago pagado={f.pagado}/></td>
              <td style={S.td}><BadgeEstado estado={f.estado}/></td>
              <td style={{...S.td,textAlign:'center',whiteSpace:'nowrap'}}>
                <button style={S.btnGrisSm} onClick={()=>pdfFlete(f)}>PDF</button> <button style={S.btnGrisSm} onClick={()=>abrirEditar(f)}>Editar</button>
                <span style={{marginLeft:6,display:'inline-block'}}><DeleteButton size="sm" title="Eliminar flete" onConfirm={()=>eliminarFlete(f)}/></span>
              </td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {/* DETALLE / VER QUÉ HACER */}
      {verFlete&&(<div style={S.modalBg} onClick={()=>setVerFlete(null)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{fontSize:22,fontWeight:800,margin:0}}>Flete {verFlete.folio}</h2>
          <div style={{display:'flex',gap:8}}><BadgePago pagado={verFlete.pagado}/><BadgeEstado estado={verFlete.estado}/></div>
        </div>
        <p style={{color:'#888',fontSize:13,margin:'4px 0 18px'}}>{fFecha(verFlete.fecha)} · {verFlete.empresa||'Sin empresa registrada'}</p>
        <div style={S.grid2}>
          <div><div style={S.label}>EQUIPO MOVIDO</div><div>{verFlete.equipo||'—'}</div></div>
          <div><div style={S.label}>SERIE DEL EQUIPO</div><div>{verFlete.serieEquipo||'—'}</div></div>
          <div><div style={S.label}>ORIGEN</div><div>{verFlete.origen||'—'}</div></div>
          <div><div style={S.label}>DESTINO</div><div>{verFlete.destino||'—'}</div></div>
          <div><div style={S.label}>IMPORTE (SIN IMPUESTOS)</div><div>{verFlete.costo?dinero(verFlete.costo):'—'}</div></div>
          <div><div style={S.label}>EMPRESA (SOLICITÓ Y PAGÓ)</div><div>{verFlete.empresa||'—'}</div></div>
          <div><div style={S.label}>PROVEEDOR DEL SERVICIO</div><div>{verFlete.proveedor||'—'}</div></div>
          <div><div style={S.label}>HORA DE MOVIMIENTO</div><div>{verFlete.horaMovimiento||'—'}</div></div>
          <div><div style={S.label}>ORDEN DE COMPRA</div><div>{textoOC(verFlete)}</div></div>
        </div>
        {verFlete.observaciones&&<div style={{marginBottom:14}}><div style={S.label}>OBSERVACIONES</div><div style={{whiteSpace:'pre-wrap'}}>{verFlete.observaciones}</div></div>}

        <div style={{marginBottom:14}}>
          <div style={S.label}>¿YA SE PAGÓ?</div>
          <div style={{display:'flex',gap:8}}>
            {['Pendiente','Pagado'].map(p=>(
              <button key={p} style={verFlete.pagado===p?S.btnSm:S.btnGrisSm} onClick={()=>{cambiarPago(verFlete,p);setVerFlete({...verFlete,pagado:p})}}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:18}}>
          <div style={S.label}>¿QUÉ SIGUE? — ESTADO DEL VIAJE</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {['Programado','Entregado','Cancelado'].map(e=>(
              <button key={e} style={verFlete.estado===e?S.btnSm:S.btnGrisSm} onClick={()=>{cambiarEstado(verFlete,e);setVerFlete({...verFlete,estado:e})}}>{e}</button>
            ))}
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'space-between',gap:10}}>
          <DeleteButton title="Eliminar flete" onConfirm={()=>eliminarFlete(verFlete)}/>
          <div style={{display:'flex',gap:10}}>
            <button style={S.btnGris} onClick={()=>pdfFlete(verFlete)}>Ver PDF</button>
            <button style={S.btnGris} onClick={()=>setVerFlete(null)}>Cerrar</button>
            <button style={S.btn} onClick={()=>{abrirEditar(verFlete);setVerFlete(null)}}>Editar</button>
          </div>
        </div>
      </div></div>)}

      {/* MODAL ALTA/EDICIÓN */}
      {modal&&(<div style={S.modalBg} onClick={()=>setModal(false)}><div style={S.modal} onClick={ev=>ev.stopPropagation()}>
        <h2 style={{fontSize:22,fontWeight:800,margin:0}}>{fletes.some(f=>f.id===form.id)?'Editar flete':'Nuevo flete'}</h2>
        <p style={{color:'#888',fontSize:13,margin:'4px 0 18px'}}>Folio: <strong>{form.folio}</strong></p>

        <div style={S.grid2}>
          <div><label style={S.label}>FECHA</label><input type="date" style={S.input} value={form.fecha} onChange={ev=>setForm({...form,fecha:ev.target.value})}/></div>
          <div><label style={S.label}>HORA EN QUE SE MOVIÓ EL EQUIPO</label><input type="time" style={S.input} value={form.horaMovimiento||''} onChange={ev=>setForm({...form,horaMovimiento:ev.target.value})}/></div>
          <div><label style={S.label}>EMPRESA (QUE SOLICITÓ Y PAGÓ EL FLETE)</label>
            <input style={S.input} list="lista-empresas-cliente" value={form.empresa} onChange={ev=>setForm({...form,empresa:ev.target.value})} placeholder="Escribe o elige un cliente"/>
            <datalist id="lista-empresas-cliente">{[...new Set(clientesDB.map(c=>c.cliente).filter(Boolean))].map(n=><option key={n} value={n}/>)}</datalist>
          </div>
          <div><label style={S.label}>PROVEEDOR QUE DIO EL SERVICIO</label>
            {modoNuevaEmpresa?(<div style={{display:'flex',gap:8}}><input style={S.input} autoFocus placeholder="Nombre de la empresa" value={nuevaEmpresa} onChange={ev=>setNuevaEmpresa(ev.target.value)}/><button style={S.btnVerde} onClick={agregarEmpresa}>Guardar</button><button style={S.btnGris} onClick={()=>setModoNuevaEmpresa(false)}>✕</button></div>)
            :(<select style={S.input} value={form.proveedor} onChange={ev=>cambiarEmpresa(ev.target.value)}><option value="">Selecciona un proveedor</option>{empresas.map(e=><option key={e}>{e}</option>)}<option value="__nueva__">+ Agregar proveedor</option></select>)}
          </div>
        </div>

        <div style={S.grid2}>
          <div><label style={S.label}>EQUIPO QUE SE MOVIÓ</label><input style={S.input} value={form.equipo} onChange={ev=>setForm({...form,equipo:ev.target.value})} placeholder="Ej. Manipulador telescópico Genie GTH1056"/></div>
          <div><label style={S.label}>SERIE DEL EQUIPO</label><input style={S.input} value={form.serieEquipo} onChange={ev=>setForm({...form,serieEquipo:ev.target.value})}/></div>
        </div>

        <div style={S.grid2}>
          <div><label style={S.label}>ORIGEN</label><input style={S.input} value={form.origen} onChange={ev=>setForm({...form,origen:ev.target.value})} placeholder="Ej. Patio MAQSOL"/></div>
          <div><label style={S.label}>DESTINO</label><input style={S.input} value={form.destino} onChange={ev=>setForm({...form,destino:ev.target.value})} placeholder="Ej. Mérida"/></div>
        </div>

        <div style={{marginBottom:14}}>
          <label style={S.label}>ORDEN DE COMPRA (OC)</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            {[['enviada','Ya envió orden'],['pendiente','Aún no la envía'],['sin','No lleva orden']].map(([v,t])=>(
              <button key={v} type="button" style={form.oc===v?S.btnSm:S.btnGrisSm} onClick={()=>setForm({...form,oc:form.oc===v?'':v,numOC:v==='enviada'?form.numOC:''})}>{t}</button>
            ))}
            {form.oc==='enviada'&&<input style={{...S.input,maxWidth:240}} placeholder="N° de orden de compra" value={form.numOC||''} onChange={ev=>setForm({...form,numOC:ev.target.value})}/>}
          </div>
        </div>

        <div style={S.grid3}>
          <div><label style={S.label}>IMPORTE (SIN IMPUESTOS)</label><input style={S.input} value={form.costo} onChange={ev=>setForm({...form,costo:ev.target.value})} placeholder="Ej. 1500 antes de IVA"/></div>
          <div><label style={S.label}>PAGO</label><select style={S.input} value={form.pagado} onChange={ev=>setForm({...form,pagado:ev.target.value})}><option>Pendiente</option><option>Pagado</option></select></div>
          <div><label style={S.label}>ESTADO DEL VIAJE</label><select style={S.input} value={form.estado} onChange={ev=>setForm({...form,estado:ev.target.value})}><option>Programado</option><option>Entregado</option><option>Cancelado</option></select></div>
        </div>

        <div style={{marginBottom:20}}><label style={S.label}>OBSERVACIONES</label><textarea style={{...S.input,minHeight:70,resize:'vertical'}} value={form.observaciones} onChange={ev=>setForm({...form,observaciones:ev.target.value})}/></div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:10}}><button style={S.btnGris} onClick={()=>setModal(false)}>Cancelar</button><button style={S.btn} onClick={guardarForm}>Guardar</button></div>
      </div></div>)}

    </div></div>
  )
}
