import {useEffect,useRef,useState} from 'react';
import {Alert,BackHandler,ScrollView,Text,View,Switch} from 'react-native';
import ItemSelect from '../components/ItemSelect';
import * as Crypto from 'expo-crypto';
import {SafeAreaView} from 'react-native-safe-area-context';
import {styles,Field,ToggleField} from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
import {createMobileApi} from '../services/mobileApi.mjs';
import {hardwareCreationBundle,suggestHardwareCategory} from '../domain/hardwareCreation.mjs';
import {pendingProductCreation,resolveProductCreation} from '../domain/productCreationSubmission.mjs';
import {productCreationAttempts} from '../services/productCreationStorage';
import {inventoryAttempts} from '../services/inventoryStorage';
import {unresolvedInventory} from '../domain/inventorySubmission.mjs';
const presentation=()=>({name:'',unit:'pieza',factor:'1',price:''});
export default function HardwareCreateScreen({model,navigation}){
 const [options,setOptions]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(null),[busy,setBusy]=useState(false);
 const [form,setForm]=useState({name:'',unit:'pieza',hardwareCategoryId:null,pricePending:false,initialEnabled:false,quantity:'',saleMode:'piece',packSize:'',packPrice:'',piecePrice:'',closedPackages:'',looseUnits:'0',presentations:[presentation()]});
 const lock=useRef(false),server=useRef(model.state.baseUrl),manualCategory=useRef(false);
 const api=()=>createMobileApi(server.current,model.token);
 const pending=attempt&&['prepared','unknown'].includes(attempt.phase),done=attempt?.phase==='confirmed';
 const set=(key,value)=>setForm(f=>({...f,[key]:value}));
 async function load(){try{const value=await api().hardwareCreationOptions();if(value.creationVersion!==2)throw Error('Este servidor requiere la actualizaci\u00f3n de altas Nexo. Conecta al entorno QA actualizado.');setOptions(value);}catch(e){setError(e.message);}}
 useEffect(()=>{load();productCreationAttempts.all().then(rows=>setAttempt(pendingProductCreation(rows)||null)).catch(e=>setError(e.message));},[]);
 useEffect(()=>{navigation.setOptions({gestureEnabled:!busy,headerBackVisible:!busy});const s=BackHandler.addEventListener('hardwareBackPress',()=>lock.current);return()=>s.remove();},[busy,navigation]);
 async function transmit(value,allowSend){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const fingerprint=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,model.token);const result=await resolveProductCreation({attempt:value,api:api(),fingerprint,persist:productCreationAttempts.save,allowSend});setAttempt(result);setError(result.error||'');if(result.phase==='confirmed')await model.sync();}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 async function review(){if(lock.current||pending||done||!options)return;setError('');try{
  if(pendingProductCreation(await productCreationAttempts.all())||unresolvedInventory(await inventoryAttempts.all()).length)throw Error('Resuelve primero las operaciones pendientes antes de dar de alta.');
  const bundle=hardwareCreationBundle(form),zero=bundle.initialInventory?.quantity==='0';
  const fresh=await api().hardwareCreationOptions();
  if(fresh.creationVersion!==2||fresh.generation!==options.generation)throw Error('El conjunto de datos cambió. Revisa la conexión antes de dar de alta.');
  setOptions(fresh);
  const category=fresh.categories.find(c=>String(c.id)===String(form.hardwareCategoryId))?.name||'Sin categoría';
  Alert.alert('Confirmar alta de Jarcería',`${bundle.product.name}\n${category}\nUnidad: ${form.unit}\n${form.pricePending?'Precio pendiente; no disponible para venta':bundle.presentations.map(p=>`${p.name}: $${p.price} / ${p.unit} · contenido ${p.factor}`).join('\n')}\n${form.initialEnabled?`Inicial: ${bundle.initialInventory?.quantity} ${bundle.product.unit}${zero?' · Confirmas CERO existencias':''}`:'Sin inicial: saldo desconocido'}`,[{text:'Volver a revisar',style:'cancel'},{text:zero?'Confirmar alta e inicial cero':'Confirmar alta',onPress:async()=>{try{const fingerprint=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,model.token);const value={key:Crypto.randomUUID(),server:server.current,credentialFingerprint:fingerprint,body:{confirmed:true,zeroConfirmed:zero,revision:fresh.revision,generation:fresh.generation,bundle},phase:'prepared',createdAt:new Date().toISOString()};setAttempt(value);await transmit(value,true);}catch(e){setError(e.message);}}}],{cancelable:false});
 }catch(e){setError(e.message);}}
 const disabled=busy||pending||done;
 const advancedPacks=form.saleMode==='advanced'&&form.unit==='pieza'?form.presentations.map((p,index)=>({...p,index})).filter(p=>p.unit==='paquete'):[];
 return <SafeAreaView style={styles.root} edges={['bottom','left','right']}><ScrollView contentContainerStyle={[styles.page,{gap:10}]} keyboardShouldPersistTaps="handled">
  <Text style={styles.title}>Agregar producto</Text><Text style={styles.muted}>Nombre comercial completo · Un producto, varias presentaciones.</Text>
  {!!error&&<Text accessibilityRole="alert" style={styles.notice}>{error}</Text>}
  {done?<Text style={styles.notice}>Alta confirmada por el servidor. Producto #{attempt.result.productId}.</Text>:<>
  <Field label="Nombre comercial completo" value={form.name} editable={!disabled} onChangeText={name=>setForm(f=>({...f,name,...(!manualCategory.current?{hardwareCategoryId:suggestHardwareCategory(name,options?.categories||[])}:{})}))}/>
  <ItemSelect label="Categoría" enabled={!disabled} selectedValue={form.hardwareCategoryId??''} onValueChange={v=>{manualCategory.current=true;set('hardwareCategoryId',v||null);}}><ItemSelect.Item label="Sin categoría" value=""/>{options?.categories.map(c=><ItemSelect.Item key={c.id} label={c.name} value={c.id}/>)}</ItemSelect>
  <ItemSelect label="Forma de venta" enabled={!disabled} selectedValue={form.saleMode} onValueChange={v=>set('saleMode',v)}>
    <ItemSelect.Item label="Solo por pieza" value="piece"/><ItemSelect.Item label="Solo por paquete" value="pack"/><ItemSelect.Item label="Por paquete y pieza" value="both"/><ItemSelect.Item label="Más opciones" value="advanced"/>
  </ItemSelect>
  {form.saleMode==='advanced'&&<ItemSelect label="Unidad de inventario" enabled={!disabled} selectedValue={form.unit} onValueChange={v=>set('unit',v)}>{['pieza','envase','botella','bolsa','kg','gramo'].map(u=><ItemSelect.Item key={u} label={u} value={u}/>)}</ItemSelect>}
  {['pack','both'].includes(form.saleMode)&&<Field label="Piezas por paquete" keyboardType="number-pad" editable={!disabled} value={form.packSize} onChangeText={v=>set('packSize',v)}/>}
  {!form.pricePending&&form.saleMode!=='advanced'&&<>
    {form.saleMode!=='piece'&&<Field label="Precio por paquete (MXN)" keyboardType="decimal-pad" editable={!disabled} value={form.packPrice} onChangeText={v=>set('packPrice',v)}/>}
    {form.saleMode!=='pack'&&<Field label="Precio por pieza (MXN)" keyboardType="decimal-pad" editable={!disabled} value={form.piecePrice} onChangeText={v=>set('piecePrice',v)}/>}
  </>}
  <ToggleField disabled={disabled} value={form.pricePending} onValueChange={v=>set('pricePending',v)} label="Precio pendiente" description="Conserva las presentaciones; el producto no puede venderse hasta confirmar precios."/>
  {form.saleMode==='advanced'&&form.presentations.map((p,i)=><View style={[styles.card,{padding:12,gap:8}]} key={i}>
    <Field label={`Presentación ${i+1}`} editable={!disabled} value={p.name} onChangeText={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,name:v}:r))}/>
    <ItemSelect label="Unidad de presentación" enabled={!disabled} selectedValue={p.unit} onValueChange={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,unit:v}:r))}>{['pieza','envase','botella','bolsa','paquete','kg','gramo'].map(u=><ItemSelect.Item key={u} label={u} value={u}/>)}</ItemSelect>
    <Field label={`Contenido en ${form.unit}`} keyboardType="decimal-pad" editable={!disabled} value={p.factor} onChangeText={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,factor:v}:r))}/>
    <View style={styles.row}><Switch disabled={disabled} value={p.saleEnabled!==false} onValueChange={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,saleEnabled:v}:r))}/><Text>Disponible para venta</Text></View>
    <View style={styles.row}><Switch disabled={disabled} value={p.purchaseEnabled!==false} onValueChange={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,purchaseEnabled:v}:r))}/><Text>Disponible para compras</Text></View>
    {!form.pricePending&&p.saleEnabled!==false&&<Field label="Precio MXN" keyboardType="decimal-pad" editable={!disabled} value={p.price} onChangeText={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,price:v}:r))}/>}
  </View>)}
  {form.saleMode==='advanced'&&<View style={styles.row}><Switch disabled={disabled} value={form.autoOpenPackages===true} onValueChange={v=>set('autoOpenPackages',v)}/><Text style={styles.muted}>Abrir paquetes para atender piezas</Text></View>}
  {form.saleMode==='advanced'&&<ActionButton label="Agregar presentación" variant="secondary" disabled={disabled} onPress={()=>set('presentations',[...form.presentations,presentation()])}/>}
  <ToggleField disabled={disabled} value={form.initialEnabled} onValueChange={v=>set('initialEnabled',v)} label="Registrar inventario inicial" description="Opcional. Captura las existencias que tienes ahora."/>
  {form.initialEnabled&&advancedPacks.length>0&&<ItemSelect label="Paquete que contaste" enabled={!disabled} selectedValue={form.initialPresentationIndex??''} onValueChange={v=>set('initialPresentationIndex',v)}><ItemSelect.Item label="Selecciona el paquete" value=""/>{advancedPacks.map(p=><ItemSelect.Item key={p.index} label={`${p.name||'Paquete'} (${p.factor} piezas)`} value={p.index}/>)}</ItemSelect>}
  {form.initialEnabled&&(['pack','both'].includes(form.saleMode)||advancedPacks.length>0)&&<>
  <Field label="Paquetes cerrados" keyboardType="number-pad" editable={!disabled} value={form.closedPackages} onChangeText={v=>set('closedPackages',v)}/>
  {form.saleMode!=='pack'&&<Field label="Piezas sueltas" keyboardType="number-pad" editable={!disabled} value={form.looseUnits} onChangeText={v=>set('looseUnits',v)}/>}
  <Text style={styles.notice}>Total equivalente: {Number(form.closedPackages||0)*Number(advancedPacks.length?form.presentations[form.initialPresentationIndex]?.factor||0:form.packSize||0)+Number(form.saleMode!=='pack'?form.looseUnits||0:0)} piezas</Text></>}
  {form.initialEnabled&&!['pack','both'].includes(form.saleMode)&&!advancedPacks.length&&<Field label={`Cantidad inicial en ${form.unit}`} keyboardType={['kg','gramo'].includes(form.unit)?'decimal-pad':'number-pad'} editable={!disabled} value={form.quantity} onChangeText={v=>set('quantity',v)}/>}
  {!pending&&<ActionButton label="Revisar y confirmar alta" fullWidth disabled={disabled||!options} onPress={review}/>}
  {pending&&<><Text style={styles.notice}>Alta pendiente: consulta su resultado antes de crear otro producto.</Text><ActionButton label="Consultar resultado del alta" fullWidth disabled={busy} onPress={()=>transmit(attempt,false)}/>{attempt.phase==='prepared'&&<ActionButton label="Reintentar la misma alta" disabled={busy} onPress={()=>transmit(attempt,true)}/>}</>}
  {attempt?.phase==='rejected'&&<ActionButton label="Actualizar datos y revisar de nuevo" disabled={busy} onPress={()=>{setAttempt(null);load();}}/>}
  </>}
 </ScrollView></SafeAreaView>;
}
