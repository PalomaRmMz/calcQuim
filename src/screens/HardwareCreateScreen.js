import {useEffect,useRef,useState} from 'react';
import {Alert,BackHandler,ScrollView,Text,View,Switch} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as Crypto from 'expo-crypto';
import {SafeAreaView} from 'react-native-safe-area-context';
import {styles,Field} from '../components/BrandUI';
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
 const [form,setForm]=useState({name:'',variant:'',unit:'pieza',hardwareCategoryId:null,pricePending:false,initialEnabled:false,quantity:'',presentations:[presentation()]});
 const lock=useRef(false),server=useRef(model.state.baseUrl),manualCategory=useRef(false);
 const api=()=>createMobileApi(server.current,model.token);
 const pending=attempt&&['prepared','unknown'].includes(attempt.phase),done=attempt?.phase==='confirmed';
 const set=(key,value)=>setForm(f=>({...f,[key]:value}));
 async function load(){try{setOptions(await api().hardwareCreationOptions());}catch(e){setError(e.message);}}
 useEffect(()=>{load();productCreationAttempts.all().then(rows=>setAttempt(pendingProductCreation(rows)||null)).catch(e=>setError(e.message));},[]);
 useEffect(()=>{navigation.setOptions({gestureEnabled:!busy,headerBackVisible:!busy});const s=BackHandler.addEventListener('hardwareBackPress',()=>lock.current);return()=>s.remove();},[busy,navigation]);
 async function transmit(value,allowSend){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const fingerprint=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,model.token);const result=await resolveProductCreation({attempt:value,api:api(),fingerprint,persist:productCreationAttempts.save,allowSend});setAttempt(result);setError(result.error||'');}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 async function review(){if(lock.current||pending||done||!options)return;setError('');try{
  if(pendingProductCreation(await productCreationAttempts.all())||unresolvedInventory(await inventoryAttempts.all()).length)throw Error('Resuelve primero las operaciones pendientes antes de dar de alta.');
  const bundle=hardwareCreationBundle(form),zero=bundle.initialInventory?.quantity==='0';
  const category=options.categories.find(c=>String(c.id)===String(form.hardwareCategoryId))?.name||'Sin categoría';
  Alert.alert('Confirmar alta de Jarcería',`${bundle.product.name}\n${category}\nUnidad: ${form.unit}\n${form.pricePending?'Precio pendiente; no disponible para venta':bundle.presentations.map(p=>`${p.name}: $${p.price} / ${p.unit} · contenido ${p.factor}`).join('\n')}\n${form.initialEnabled?`Inicial: ${form.quantity} ${form.unit}${zero?' · Confirmas CERO existencias':''}`:'Sin inicial: saldo desconocido'}`,[{text:'Volver a revisar',style:'cancel'},{text:zero?'Confirmar alta e inicial cero':'Confirmar alta',onPress:async()=>{try{const fingerprint=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,model.token);const value={key:Crypto.randomUUID(),server:server.current,credentialFingerprint:fingerprint,body:{confirmed:true,zeroConfirmed:zero,revision:options.revision,generation:options.generation,bundle},phase:'prepared',createdAt:new Date().toISOString()};setAttempt(value);await transmit(value,true);}catch(e){setError(e.message);}}}],{cancelable:false});
 }catch(e){setError(e.message);}}
 const disabled=busy||pending||done;
 return <SafeAreaView style={styles.root} edges={['bottom','left','right']}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
  <Text style={styles.title}>Agregar producto</Text><Text style={styles.muted}>Jarcería · Cada talla conserva su existencia independiente.</Text>
  {!!error&&<Text accessibilityRole="alert" style={styles.notice}>{error}</Text>}
  {done?<Text style={styles.notice}>Alta confirmada por el servidor. Producto #{attempt.result.productId}.</Text>:<>
  <Field label="Nombre del producto" value={form.name} editable={!disabled} onChangeText={name=>setForm(f=>({...f,name,...(!manualCategory.current?{hardwareCategoryId:suggestHardwareCategory(name,options?.categories||[])}:{})}))}/>
  <Field label="Variante o talla (opcional)" value={form.variant} editable={!disabled} onChangeText={v=>set('variant',v)}/>
  <Text style={styles.label}>Categoría</Text><Picker enabled={!disabled} selectedValue={form.hardwareCategoryId??''} onValueChange={v=>{manualCategory.current=true;set('hardwareCategoryId',v||null);}}><Picker.Item label="Sin categoría" value=""/>{options?.categories.map(c=><Picker.Item key={c.id} label={c.name} value={c.id}/>)}</Picker>
  <Text style={styles.label}>Unidad de inventario</Text><Picker enabled={!disabled} selectedValue={form.unit} onValueChange={v=>set('unit',v)}>{['pieza','envase','botella','bolsa','kg','gramo'].map(u=><Picker.Item key={u} label={u} value={u}/>)}</Picker>
  <View style={styles.row}><Switch disabled={disabled} value={form.pricePending} onValueChange={v=>set('pricePending',v)}/><Text style={styles.muted}>Precio pendiente · No disponible para venta</Text></View>
  {!form.pricePending&&form.presentations.map((p,i)=><View style={styles.card} key={i}>
    <Field label={`Presentación ${i+1}`} editable={!disabled} value={p.name} onChangeText={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,name:v}:r))}/>
    <Picker enabled={!disabled} selectedValue={p.unit} onValueChange={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,unit:v}:r))}>{['pieza','envase','botella','bolsa','paquete','kg','gramo'].map(u=><Picker.Item key={u} label={u} value={u}/>)}</Picker>
    <Field label={`Contenido en ${form.unit}`} keyboardType="decimal-pad" editable={!disabled} value={p.factor} onChangeText={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,factor:v}:r))}/>
    <Field label="Precio MXN" keyboardType="decimal-pad" editable={!disabled} value={p.price} onChangeText={v=>set('presentations',form.presentations.map((r,j)=>j===i?{...r,price:v}:r))}/>
  </View>)}
  {!form.pricePending&&<ActionButton label="Agregar presentación" variant="secondary" disabled={disabled} onPress={()=>set('presentations',[...form.presentations,presentation()])}/>}
  <View style={styles.row}><Switch disabled={disabled} value={form.initialEnabled} onValueChange={v=>set('initialEnabled',v)}/><Text>Registrar inicial ahora (opcional)</Text></View>
  {form.initialEnabled&&<Field label={`Cantidad inicial en ${form.unit}`} keyboardType="decimal-pad" editable={!disabled} value={form.quantity} onChangeText={v=>set('quantity',v)}/>}
  {!pending&&<ActionButton label="Revisar y confirmar alta" fullWidth disabled={busy||!options} onPress={review}/>}
  {pending&&<><Text style={styles.notice}>Alta pendiente: consulta su resultado antes de crear otro producto.</Text><ActionButton label="Consultar resultado del alta" fullWidth disabled={busy} onPress={()=>transmit(attempt,false)}/>{attempt.phase==='prepared'&&<ActionButton label="Reintentar la misma alta" disabled={busy} onPress={()=>transmit(attempt,true)}/>}</>}
  {attempt?.phase==='rejected'&&<ActionButton label="Actualizar datos y revisar de nuevo" disabled={busy} onPress={()=>{setAttempt(null);load();}}/>}
  </>}
 </ScrollView></SafeAreaView>;
}
