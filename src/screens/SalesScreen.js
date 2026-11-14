import {useFocusEffect} from '@react-navigation/native';
import {useEffect,useMemo,useState,useRef,useCallback} from 'react';
import {BackHandler,Keyboard,Pressable,ScrollView,Share,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Feather} from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import {styles,Field} from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
import {createMobileApi} from '../services/mobileApi.mjs';
import {canonicalReceipt,createOfficialSalesSession} from '../domain/officialSales.mjs';
const money=v=>v==null?'Sin importe':Number(v).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
const moment=v=>v?new Date(v).toLocaleString('es-MX',{timeZone:'America/Mexico_City'}):'Sin consulta';
function Summary({sale:s}){return <><View style={styles.row}><Text style={[styles.heading,{flex:1}]}>{s.folio||'Sin folio registrado'}</Text><Text style={styles.price}>{money(s.monetary?s.monetary.collectedCents/100:s.total)}</Text></View><Text style={styles.muted}>{s.date}{s.voidedAt?' · Anulada':''}</Text></>;}
export default function SalesScreen({model:m,navigation,active=true}){
 const [group,setGroup]=useState('official'),[filters,setFilters]=useState({folio:''}),[cursors,setCursors]=useState([null]),[pageIndex,setPageIndex]=useState(0),[localPage,setLocalPage]=useState(0),[showLegacy,setShowLegacy]=useState(false);
 const session=useMemo(()=>createOfficialSalesSession(createMobileApi(m.state?.baseUrl||'http://127.0.0.1:3016',m.token)),[m.state?.baseUrl,m.token]);
 const [observed,setObserved]=useState({session,value:session.getState()});
 const h=observed.session===session?observed.value:session.getState();
 useEffect(()=>{setCursors([null]);setPageIndex(0);setObserved({session,value:session.getState()});const unsubscribe=session.subscribe(value=>setObserved({session,value}));return()=>{unsubscribe();session.dispose();};},[session]);
 useEffect(()=>{if(!active||!h.detail)return;const listener=BackHandler.addEventListener('hardwareBackPress',()=>{session.closeDetail();return true;});return()=>listener.remove();},[session,active,!!h.detail]);
 const detailId=useRef(null);detailId.current=h.detail?.sale.id||null;
 const syncRef=useRef(m.sync);syncRef.current=m.sync;
 useFocusEffect(useCallback(()=>{let alive=true;if(active&&detailId.current)syncRef.current().then(()=>{if(alive&&detailId.current)session.open(detailId.current);});return()=>{alive=false;};},[session,active]));
 const dirty=!!h.page&&['folio'].some(k=>(filters[k].trim()||null)!==h.page.filters[k]);
 async function query(cursor=null,index=0){Keyboard.dismiss();await m.sync();const result=await session.query({...filters,limit:20,...(cursor?{cursor}:{})});if(result){setPageIndex(index);if(index===0)setCursors([null]);else setCursors(rows=>[...rows.slice(0,index),cursor]);}}
 const listSnapshot=h.page?{revision:h.page.revision,generation:h.page.generation}:{};
 async function verifyLocal(receipt){Keyboard.dismiss();const fingerprint=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,canonicalReceipt(receipt));await session.open(String(receipt.id),{}, {receipt,fingerprint});}
 const receipts=m.state?.receipts||[];
 let previous;try{previous=JSON.parse(m.legacy?.currentSale||'[]');}catch{previous=null;}
 const stale=!h.current||m.connectionStatus==='offline'||!!h.detail&&h.detail.revision!==m.state?.catalog?.revision;
 return <SafeAreaView style={styles.root} edges={['top','left','right']}><ScrollView contentContainerStyle={[styles.page,{padding:14,gap:10}]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
 <View style={styles.row}><Text style={[styles.title,{flex:1}]}>Mis ventas</Text><Pressable accessibilityRole="button" accessibilityLabel="Configuración" hitSlop={12} onPress={()=>{Keyboard.dismiss();navigation.navigate('Connection');}}><Feather name="settings" size={24}/></Pressable></View>
 <View style={styles.wrap}>{[{id:'official',name:'Recientes'},{id:'local',name:'Tickets guardados'},{id:'legacy',name:'Datos anteriores'}].map(g=><Pressable key={g.id} accessibilityRole="tab" accessibilityState={{selected:group===g.id}} onPress={()=>{Keyboard.dismiss();session.closeDetail();setGroup(g.id);}} style={[styles.chip,group===g.id&&styles.selected]}><Text style={group===g.id?styles.white:styles.price}>{g.name}</Text></Pressable>)}</View>
 {!!h.error&&<Text accessibilityRole="alert" style={styles.notice}>{h.error}{h.page||h.detail?' La consulta anterior se muestra como no actual.':''}</Text>}
 {(h.page||h.detail)&&<Text style={styles.muted}>{stale?'Última consulta · no actual':'Última actualización'}: {moment(h.detail?.generatedAt||h.page?.generatedAt)}</Text>}
 {h.busy&&<Text accessibilityRole="progressbar" style={styles.muted}>Consultando ventas…</Text>}
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
  <ActionButton label="Editar o desglosar venta" disabled={h.busy||stale||!!h.detail.sale.voidedAt} onPress={()=>navigation.navigate('SaleEdit',{saleId:h.detail.sale.id})}/>
  <ActionButton label="Actualizar detalle" disabled={h.busy||['syncing','checking'].includes(m.connectionStatus)} onPress={async()=>{await m.sync();await session.open(h.detail.sale.id);}}/>
 </View>:group==='official'?<View style={{gap:8}}>
  <Text style={styles.heading}>Ventas capturadas desde Android</Text>
  <Field label="Buscar por folio" placeholder="Ej. V-00063" autoCapitalize="characters" value={filters.folio} onChangeText={v=>setFilters(f=>({...f,folio:v}))}/>
  <ActionButton label={h.page?'Actualizar consulta':'Ver mis ventas'} fullWidth disabled={h.busy||!m.token} onPress={()=>query()}/>
  {dirty&&<Text style={styles.muted}>Pulsa Actualizar consulta para buscar este folio.</Text>}
  {!h.page&&<Text style={styles.muted}>Consulta bajo demanda, hasta 20 ventas por página. Las más recientes primero, por fecha de venta.</Text>}
  {h.page?.sales.map(s=><Pressable key={s.id} accessibilityRole="button" accessibilityLabel={'Ver venta '+(s.folio||s.id)} disabled={h.busy} style={styles.result} onPress={()=>{Keyboard.dismiss();session.open(s.id,listSnapshot);}}><Summary sale={s}/></Pressable>)}
  {h.page&&!h.page.sales.length&&<Text style={styles.muted}>No hay ventas móviles verificadas para esta búsqueda. Puedes consultar Tickets guardados y Datos anteriores.</Text>}
  {h.page&&<View style={styles.row}><ActionButton label="Anterior" variant="secondary" disabled={h.busy||dirty||pageIndex===0||!!h.error} onPress={()=>query(cursors[pageIndex-1],pageIndex-1)}/><Text style={styles.muted}>Página {pageIndex+1}</Text><ActionButton label="Ver más ventas" variant="secondary" disabled={h.busy||dirty||!h.page.nextCursor||!!h.error} onPress={()=>query(h.page.nextCursor,pageIndex+1)}/></View>}
 </View>:group==='local'?<View style={{gap:8}}>
  <Text style={styles.heading}>Tickets guardados localmente</Text><Text style={styles.muted}>Comprobantes originales del dispositivo. No se envían ni se convierten en ventas oficiales.</Text>
  {receipts.slice(localPage*10,localPage*10+10).map(r=><View key={r.id} style={styles.result}><Pressable onPress={()=>navigation.navigate('SaleSummary',{receiptId:r.id})}><Text style={styles.link}>{r.folio||'Sin folio'} · {money(r.total)}</Text></Pressable><Text style={styles.muted}>Estado guardado: {r.status||'sin dato'}. Confirmación actual no consultada.</Text><ActionButton label="Comprobar vínculo oficial" variant="secondary" disabled={h.busy||!m.token} onPress={()=>verifyLocal(r)}/></View>)}
  {!receipts.length&&<Text style={styles.muted}>Sin tickets guardados.</Text>}
  <View style={styles.row}><ActionButton label="Tickets anteriores" disabled={!localPage} onPress={()=>setLocalPage(p=>p-1)}/><ActionButton label="Más tickets" disabled={(localPage+1)*10>=receipts.length} onPress={()=>setLocalPage(p=>p+1)}/></View>
 </View>:<View style={{gap:8}}><Text style={styles.heading}>Datos anteriores conservados</Text><Text style={styles.muted}>{Array.isArray(previous)?previous.length+' renglones en la venta local anterior.':'Formato anterior disponible para revisión.'} No se convierten ni se envían como ventas oficiales.</Text><ActionButton label={showLegacy?'Ocultar datos anteriores':'Consultar datos anteriores'} onPress={()=>setShowLegacy(v=>!v)}/>{showLegacy&&<><Text selectable>{JSON.stringify(m.legacy,null,2)}</Text><ActionButton label="Compartir respaldo anterior" onPress={()=>Share.share({message:JSON.stringify(m.legacy,null,2)}).catch(()=>{})}/></>}</View>}
 </ScrollView></SafeAreaView>;
}
