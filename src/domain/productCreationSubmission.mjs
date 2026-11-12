export const PRODUCT_ATTEMPTS_KEY='calcquim.hardware.creation.attempts.v1';
export const pendingProductCreation=rows=>rows.find(a=>['prepared','unknown'].includes(a.phase));
export function createProductAttemptStorage(storage){
 let queue=Promise.resolve();
 async function read(){const raw=await storage.getItem(PRODUCT_ATTEMPTS_KEY);if(raw===null)return [];const value=JSON.parse(raw);if(value.schema!==1||!Array.isArray(value.attempts)||value.attempts.some(a=>!a.key||!a.server||!a.body||!a.credentialFingerprint||!['prepared','unknown','confirmed','rejected'].includes(a.phase)))throw Error('El registro de altas requiere revisión; no se sobrescribió.');return value.attempts;}
 return {async all(){await queue;return read();},save(attempt){const task=queue.then(async()=>{const rows=await read(),i=rows.findIndex(a=>a.key===attempt.key&&a.server===attempt.server);if(i<0)rows.push(attempt);else rows[i]=attempt;await storage.setItem(PRODUCT_ATTEMPTS_KEY,JSON.stringify({schema:1,attempts:rows}));});queue=task.catch(()=>{});return task;}};
}
export async function resolveProductCreation({attempt,api,fingerprint,persist,allowSend=false}){
 if(attempt.server!==api.identity||attempt.credentialFingerprint!==fingerprint)throw Error('Usa la conexión y credencial originales para resolver el alta.');
 const save=async patch=>{const next={...attempt,...patch};await persist(next);return next;};
 await save({phase:'unknown'});let sending=false;
 try{
  let r=await api.productCreationStatus(attempt.key);
  if(r.status==='not_found'){
   if(!allowSend)return save({phase:'prepared',error:'Sin registro en el servidor. Reintenta explícitamente la misma alta.'});
   sending=true;r=await api.createHardware(attempt.key,attempt.body);
  }
  if(r.status!=='confirmed'||r.operationId!==attempt.key||!r.productId)throw Error('Respuesta sin evidencia de alta confirmada.');
  return save({phase:'confirmed',result:r,error:''});
 }catch(e){
  if(sending&&e.definitive){try{const r=await api.productCreationStatus(attempt.key);if(r.status==='confirmed')return save({phase:'confirmed',result:r,error:''});if(r.status==='not_found')return save({phase:'rejected',error:e.message});}catch{}}
  return save({phase:'unknown',error:e.message});
 }
}
