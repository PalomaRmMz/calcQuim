import {useState} from 'react';
import {Alert,ScrollView,Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Field,styles} from '../components/BrandUI';
import ActionButton from '../components/ActionButton';
export default function DraftRecoveryScreen({model:m,navigation}){
 const [reference,setReference]=useState(''),[linked,setLinked]=useState(null),[reason,setReason]=useState('');
 const draft=m.state?.draft;
 async function check(){const result=await m.checkPending();if(result==='cancelled')navigation.goBack();}
 function confirm(){Alert.alert('Conciliar sin reenviar',linked?`Vincular manualmente con ${linked.folio} por $${Number(linked.total).toFixed(2)}. La venta web no se modifica.`:'Si el envío ya fue confirmado, se conservará su ticket. Si no existe, el servidor bloqueará cualquier creación tardía con la misma clave.',[{text:'Volver',style:'cancel'},{text:'Confirmar conciliación',onPress:async()=>{const result=await m.reconcile(reason,linked?.id||null);if(result==='cancelled')navigation.goBack();}}]);}
 if(draft?.status==='confirmed')return <SafeAreaView style={styles.root}><Text style={styles.notice}>El servidor confirmó la venta. Su ticket se conserva; no se descarta como borrador.</Text><ActionButton label="Ver ticket confirmado" onPress={()=>navigation.replace('SaleSummary',{receiptId:draft.receipt.id})}/></SafeAreaView>;
 return <SafeAreaView style={styles.root} edges={['bottom']}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
 <Text style={styles.title}>Revisar envío pendiente</Text>
 <Text style={styles.notice}>El resultado del envío es incierto. No se reenviará automáticamente. No borres los datos de la aplicación.</Text>
 <Text selectable style={styles.muted}>Operación: {draft?.attempt?.key||'Sin envío'}</Text>
 {!!m.error&&<Text accessibilityRole="alert" style={styles.notice}>{m.error}</Text>}
 <ActionButton label="Consultar estado sin reenviar" disabled={m.busy||!draft?.attempt} onPress={check}/>
 <Text style={styles.heading}>Si ya la registraste desde la web</Text>
 <Field label="Folio o ID exacto de la venta web (opcional)" value={reference} onChangeText={v=>{setReference(v);setLinked(null);}} editable={!m.busy}/>
 <ActionButton label="Buscar esa venta web" disabled={m.busy||!reference.trim()} onPress={async()=>setLinked(await m.lookupWebSale(reference.trim())||null)}/>
 {linked&&<Text style={styles.notice}>{linked.folio} · {linked.date} · ${Number(linked.total).toFixed(2)} · {linked.payment}. Confirma personalmente que corresponde a este pendiente.</Text>}
 <Field label="Motivo de conciliación" value={reason} onChangeText={setReason} editable={!m.busy}/>
 <ActionButton label="Conciliar y cerrar el pendiente" disabled={m.busy||!reason.trim()} onPress={confirm}/>
 <Text style={styles.muted}>No se buscan coincidencias automáticas por importe, hora o productos. La conciliación conserva un registro local y una marca auditable del servidor.</Text>
 </ScrollView></SafeAreaView>;
}
