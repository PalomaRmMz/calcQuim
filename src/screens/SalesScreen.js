import {useEffect,useMemo,useState} from 'react';
import {BackHandler,Keyboard,Pressable,ScrollView,Share,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import {styles,Field} from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
import {createMobileApi} from '../services/mobileApi.mjs';
import {canonicalReceipt,createOfficialSalesSession} from '../domain/officialSales.mjs';
const money=v=>v==null?'Sin importe':Number(v).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
const origin=s=>({WEB:'Web',MOVIL:'Móvil'})[s.captureOrigin]||'Origen no verificable';
const activities=s=>s.activities?.map(a=>({LIMPIEZA:'Limpieza',JARCERIA:'Jarcería',LAVANDERIA:'Lavandería'})[a]).join(' · ')||'Actividad no registrada';
const moment=v=>v?new Date(v).toLocaleString('es-MX',{timeZone:'America/Mexico_City'}):'Sin consulta';
function Summary({sale:s}){return <><View style={styles.row}><Text style={[styles.heading,{flex:1}]}>{s.folio||'Sin folio registrado'}</Text><Text style={styles.price}>{money(s.total)}</Text></View><Text style={styles.muted}>{s.date} · {s.payment||'Pago no registrado'}</Text><Text style={styles.muted}>{origin(s)} · {activities(s)}{s.voidedAt?' · Anulada':''}</Text>{s.partial&&<Text style={styles.muted}>Información parcial: {s.issues.join('. ')}.</Text>}</>;}
export default function SalesScreen({model:m,navigation,active=true}){
 const [group,setGroup]=useState('official'),[filters,setFilters]=useState({folio:'',from:'',to:''}),[cursors,setCursors]=useState([null]),[pageIndex,setPageIndex]=useState(0),[localPage,setLocalPage]=useState(0),[showLegacy,setShowLegacy]=useState(false);
 const session=useMemo(()=>createOfficialSalesSession(createMobileApi(m.state?.baseUrl||'http://127.0.0.1:3016',m.token)),[m.state?.baseUrl,m.token]);
 const [observed,setObserved]=useState({session,value:session.getState()});
 const h=observed.session===session?observed.value:session.getState();
 useEffect(()=>{setCursors([null]);setPageIndex(0);setObserved({session,value:session.getState()});const unsubscribe=session.subscribe(value=>setObserved({session,value}));return()=>{unsubscribe();session.dispose();};},[session]);
 useEffect(()=>{if(!active||!h.detail)return;const listener=BackHandler.addEventListener('hardwareBackPress',()=>{session.closeDetail();return true;});return()=>listener.remove();},[session,active,!!h.detail]);
 const dirty=!!h.page&&['folio','from','to'].some(k=>(filters[k].trim()||null)!==h.page.filters[k]);
 async function query(cursor=null,index=0){Keyboard.dismiss();const result=await session.query({...filters,limit:20,...(cursor?{cursor}:{})});if(result){setPageIndex(index);if(index===0)setCursors([null]);else setCursors(rows=>[...rows.slice(0,index),cursor]);}}
 const listSnapshot=h.page?{revision:h.page.revision,generation:h.page.generation}:{};
 async function verifyLocal(receipt){Keyboard.dismiss();const fingerprint=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,canonicalReceipt(receipt));await session.open(String(receipt.id),{}, {receipt,fingerprint});}
 const receipts=m.state?.receipts||[];
 let previous;try{previous=JSON.parse(m.legacy?.currentSale||'[]');}catch{previous=null;}
 const stale=!h.current||m.connectionStatus==='offline';
 return <SafeAreaView style={styles.root} edges={['top','left','right']}><ScrollView contentContainerStyle={[styles.page,{padding:14,gap:10}]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
 <View style={styles.row}><Text style={[styles.title,{flex:1}]}>Ventas</Text><ActionButton label="Configuración" variant="secondary" onPress={()=>{Keyboard.dismiss();navigation.navigate('Connection');}}/></View>
 <Text style={styles.muted}>{({connected:'Servidor conectado',offline:'Sin conexión al servidor',syncing:'Actualizando catálogo',cached:'Conexión aún no comprobada'})[m.connectionStatus]||'Conexión aún no comprobada'} · Catálogo: {moment(m.state?.catalog?.syncedAt)}</Text>
 <Text style={styles.muted}>{({draft:'Borrador local sin enviar',unknown:'Envío incierto; consulta su resultado en Venta rápida',offline:'Envío sin conexión; consulta su resultado en Venta rápida',sending:'Envío en curso',rejected:'Envío rechazado; revisa Venta rápida',confirmed:'Confirmación guardada de la última venta'})[m.state?.draft?.status]||'Estado de venta no disponible'}. Consultar historial no envía ventas.</Text>
 <View style={styles.wrap}>{[{id:'official',name:'Oficiales'},{id:'local',name:'Tickets locales'},{id:'legacy',name:'Datos anteriores'}].map(g=><Pressable key={g.id} accessibilityRole="tab" accessibilityState={{selected:group===g.id}} onPress={()=>{Keyboard.dismiss();session.closeDetail();setGroup(g.id);}} style={[styles.chip,group===g.id&&styles.selected]}><Text style={group===g.id?styles.white:styles.price}>{g.name}</Text></Pressable>)}</View>
 {!!h.error&&<Text accessibilityRole="alert" style={styles.notice}>{h.error}{h.page||h.detail?' La consulta anterior se muestra como no actual.':''}</Text>}
 {(h.page||h.detail)&&<Text style={styles.muted}>{stale?'Última consulta · no actual':'Consulta oficial obtenida'}: {moment(h.detail?.generatedAt||h.page?.generatedAt)}</Text>}
 {h.busy&&<Text accessibilityRole="progressbar" style={styles.muted}>Consultando PostgreSQL…</Text>}
 {h.detail?<View style={[styles.card,{padding:12,gap:8}]}>
  <ActionButton label="Volver al listado" variant="secondary" onPress={()=>session.closeDetail()}/>
  <Summary sale={h.detail.sale}/>
  {h.detail.sale.capturedAt&&<Text style={styles.muted}>Captura: {moment(h.detail.sale.capturedAt)} (Ciudad de México)</Text>}
  {h.linkedLocal&&<Text style={styles.notice}>Vínculo verificado por ID y comprobante original. El ticket local conserva su contenido; la venta oficial puede contener revisiones posteriores.</Text>}
  {!!h.detail.sale.monetary&&<Text style={styles.muted}>Calculado: {money(h.detail.sale.monetary.calculatedCents/100)} · Ajuste registrado: {money(h.detail.sale.monetary.roundingCents/100)} · Cobrado: {money(h.detail.sale.monetary.collectedCents/100)}</Text>}
  <Text style={styles.heading}>Renglones registrados ({h.detail.itemCount})</Text>
  {h.detail.items.map(i=><View key={i.ordinal} style={styles.result}><Text style={styles.price}>{i.name||'Nombre no registrado'}</Text>{i.presentationName&&<Text style={styles.muted}>{i.presentationName}</Text>}<Text style={styles.muted}>{i.quantity} {i.unit} × {money(i.price)} · {money(i.amount)}</Text>{i.partial&&<Text style={styles.muted}>{i.issues.join('. ')}</Text>}</View>)}
  {!h.detail.items.length&&<Text style={styles.muted}>Sin renglones históricos disponibles.</Text>}
  {!!h.detail.nextCursor&&<ActionButton label="Siguientes renglones" disabled={h.busy} onPress={()=>session.open(h.detail.sale.id,{cursor:h.detail.nextCursor,revision:h.detail.revision,generation:h.detail.generation})}/>}
  {h.detail.items[0]?.ordinal>0&&<ActionButton label="Primeros renglones" disabled={h.busy} onPress={()=>session.open(h.detail.sale.id,{revision:h.detail.revision,generation:h.detail.generation})}/>}
  <Text style={styles.muted}>Solo consulta. No se recalculan precios ni se modifica esta venta.</Text>
 </View>:group==='official'?<View style={{gap:8}}>
  <Text style={styles.heading}>Ventas oficiales</Text>
  <Field label="Folio exacto (opcional)" placeholder="Ej. V-00063" autoCapitalize="characters" value={filters.folio} onChangeText={v=>setFilters(f=>({...f,folio:v}))}/>
  <View style={styles.row}><View style={{flex:1}}><Field label="Desde (AAAA-MM-DD)" placeholder="2026-11-01" value={filters.from} onChangeText={v=>setFilters(f=>({...f,from:v}))}/></View><View style={{flex:1}}><Field label="Hasta (AAAA-MM-DD)" placeholder="2026-11-30" value={filters.to} onChangeText={v=>setFilters(f=>({...f,to:v}))}/></View></View>
  <ActionButton label={h.page?'Actualizar consulta':'Consultar ventas oficiales'} fullWidth disabled={h.busy||!m.token} onPress={()=>query()}/>
  {dirty&&<Text style={styles.muted}>Filtros modificados. Pulsa Actualizar consulta para aplicarlos.</Text>}
  {!h.page&&<Text style={styles.muted}>Consulta bajo demanda, hasta 20 ventas por página. Las más recientes primero, por fecha de venta.</Text>}
  {h.page?.sales.map(s=><Pressable key={s.id} accessibilityRole="button" accessibilityLabel={'Ver venta '+(s.folio||s.id)} disabled={h.busy} style={styles.result} onPress={()=>{Keyboard.dismiss();session.open(s.id,listSnapshot);}}><Summary sale={s}/></Pressable>)}
  {h.page&&!h.page.sales.length&&<Text style={styles.muted}>No hay ventas para estos filtros.</Text>}
  {h.page&&<View style={styles.row}><ActionButton label="Anterior" variant="secondary" disabled={h.busy||dirty||pageIndex===0||!!h.error} onPress={()=>query(cursors[pageIndex-1],pageIndex-1)}/><Text style={styles.muted}>Página {pageIndex+1}</Text><ActionButton label="Siguiente" variant="secondary" disabled={h.busy||dirty||!h.page.nextCursor||!!h.error} onPress={()=>query(h.page.nextCursor,pageIndex+1)}/></View>}
 </View>:group==='local'?<View style={{gap:8}}>
  <Text style={styles.heading}>Tickets guardados localmente</Text><Text style={styles.muted}>Comprobantes originales del dispositivo. No se envían ni se convierten en ventas oficiales.</Text>
  {receipts.slice(localPage*10,localPage*10+10).map(r=><View key={r.id} style={styles.result}><Pressable onPress={()=>navigation.navigate('SaleSummary',{receiptId:r.id})}><Text style={styles.link}>{r.folio||'Sin folio'} · {money(r.total)}</Text></Pressable><Text style={styles.muted}>Estado guardado: {r.status||'sin dato'}. Confirmación actual no consultada.</Text><ActionButton label="Comprobar vínculo oficial" variant="secondary" disabled={h.busy||!m.token} onPress={()=>verifyLocal(r)}/></View>)}
  {!receipts.length&&<Text style={styles.muted}>Sin tickets guardados.</Text>}
  <View style={styles.row}><ActionButton label="Tickets anteriores" disabled={!localPage} onPress={()=>setLocalPage(p=>p-1)}/><ActionButton label="Más tickets" disabled={(localPage+1)*10>=receipts.length} onPress={()=>setLocalPage(p=>p+1)}/></View>
 </View>:<View style={{gap:8}}><Text style={styles.heading}>Datos anteriores conservados</Text><Text style={styles.muted}>{Array.isArray(previous)?previous.length+' renglones en la venta local anterior.':'Formato anterior disponible para revisión.'} No se convierten ni se envían como ventas oficiales.</Text><ActionButton label={showLegacy?'Ocultar datos anteriores':'Consultar datos anteriores'} onPress={()=>setShowLegacy(v=>!v)}/>{showLegacy&&<><Text selectable>{JSON.stringify(m.legacy,null,2)}</Text><ActionButton label="Compartir respaldo anterior" onPress={()=>Share.share({message:JSON.stringify(m.legacy,null,2)}).catch(()=>{})}/></>}</View>}
 </ScrollView></SafeAreaView>;
}
