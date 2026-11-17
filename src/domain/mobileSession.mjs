import {emptyDraft} from './persistence.mjs';
import {validateCatalog} from './catalog.mjs';
import {repriceLines} from './sale.mjs';
import {submitSale} from './submission.mjs';
import {canDiscardLocally,discardLocal,archiveDraft} from './draftRecovery.mjs';
import {createReconnection} from './reconnection.mjs';
export function createMobileSession({storage,credentials,apiFactory,uuid,qaToken='',beforeConfigure=async()=>{},retryDelays,delay}){
 let state=null,token='',busy=false,error='',lastConnectionError='',activity='',connectionStatus='cached',disposed=false,queue=Promise.resolve();
 const listeners=new Set();const snapshot=()=>({state,token,busy,error,activity,connectionStatus});
 const emit=()=>{if(!disposed)for(const fn of listeners)fn(snapshot());};
 function update(fn){const work=queue.then(async()=>{const next=fn(state);await storage.save(next);state=next;emit();return next;});queue=work.catch(()=>{});return work;}
 async function run(task,label='Procesando…'){if(busy){error='Espera a que termine la operación actual.';emit();return;}busy=true;activity=label;error='';emit();try{return await task();}catch(e){error=e.message;emit();return undefined;}finally{busy=false;activity='';emit();}}
 const api=()=>apiFactory(state.baseUrl,token);
 const editable=()=>{if(!canDiscardLocally(state.draft))throw Error('Verifica el envío pendiente antes de editar sus conceptos.');};
 async function acceptEvidence(evidence){
  if(evidence.receipt){const receipt=evidence.receipt;if(!receipt.id||!receipt.folio||receipt.status!=='confirmed'||!Array.isArray(receipt.items)||!Number.isFinite(receipt.total))throw Error('Respuesta sin evidencia de confirmaci\u00f3n.');await update(s=>({...s,draft:{...s.draft,status:'confirmed',receipt},receipts:s.receipts.some(r=>r.id===receipt.id)?s.receipts:[receipt,...s.receipts]}));return 'confirmed';}
  if(evidence.status==='cancelled'){await update(s=>archiveDraft(s,{outcome:'reconciled',operationId:s.draft.attempt.key,reason:evidence.reason,linkedSaleId:evidence.linkedSaleId}));return 'cancelled';}
  if(evidence.status!=='not_found')throw Error('No se pudo verificar el resultado del envío.');
  error='No se encontró una venta confirmada. Puedes reintentar expresamente o conciliar el pendiente; no se enviará automáticamente.';emit();return 'not_found';
 }
 const reconnect=createReconnection({delays:retryDelays,delay,
  probe:()=>{const client=api();return {result:client.catalog().then(data=>({catalog:validateCatalog(data),server:client.identity})),abort:()=>client.abort?.()};},
  apply:({catalog,server})=>update(s=>{
   if(s.baseUrl!==server)return s;
   if(s.draft.lines.length&&s.draft.status!=='confirmed'&&s.draft.generation&&s.draft.generation!==catalog.generation)return s;
   return {...s,catalog:{...catalog,syncedAt:new Date().toISOString()}};
  }),status:v=>{connectionStatus=v;emit();},error:v=>{if(v){lastConnectionError=v;error=v;}else{if(error===lastConnectionError)error='';lastConnectionError='';}emit();},
 });
 const model={snapshot,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  async load(){state=await storage.load();token=qaToken||await credentials.get()||'';emit();return snapshot();},
  sync:()=>state&&token?reconnect.recover():Promise.resolve(false),
  resume(){return model.sync().then(async ok=>{if(ok&&state.draft.attempt&&!canDiscardLocally(state.draft)&&state.draft.status!=='confirmed'&&!busy)await model.checkPending();return ok;});},
  suspend:()=>reconnect.suspend(),network:connected=>connected===false?reconnect.offline():connected===true?model.resume():undefined,
  dispose(){disposed=true;reconnect.dispose();listeners.clear();},
  configure:(url,secret)=>run(async()=>{
   const next=apiFactory(url,secret.trim()).identity;
   if((next!==state.baseUrl||secret.trim()!==token)&&state.draft.attempt&&!canDiscardLocally(state.draft))throw Error('Conserva la conexión original hasta verificar o conciliar el envío pendiente.');
   if(next!==state.baseUrl&&state.draft.lines.length&&state.draft.status!=='confirmed')throw Error('Descarta explícitamente el borrador local antes de cambiar de servidor.');
   reconnect.suspend();await beforeConfigure(next,secret.trim(),state,token);await credentials.set(secret.trim());token=secret.trim();await update(s=>({...s,baseUrl:next,catalog:next===s.baseUrl?s.catalog:null}));
  }).then(()=>model.sync()),
  capture:patch=>update(s=>({...s,capture:{...s.capture,...patch}})),
  mode:value=>run(()=>update(s=>({...s,mode:value}))),
  payment:value=>run(()=>{editable();return update(s=>({...s,draft:{...s.draft,payment:value,status:'draft',attempt:null}}));}),
  add:(line,editingId)=>run(async()=>{editable();await update(s=>({...s,usage:{...s.usage,[`${line.reference.kind}:${line.reference.id}`]:{count:(s.usage[`${line.reference.kind}:${line.reference.id}`]?.count||0)+1,at:new Date().toISOString()}},draft:{...s.draft,generation:s.catalog.generation,lines:repriceLines(editingId?s.draft.lines.map(l=>l.id===editingId?line:l):[...s.draft.lines,line]),status:'draft',attempt:null}}));return true;}),
  remove:id=>run(()=>{editable();return update(s=>({...s,draft:{...s.draft,lines:repriceLines(s.draft.lines.filter(l=>l.id!==id)),status:'draft',attempt:null}}));}),
  cancel:()=>run(()=>update(discardLocal)),
  checkPending:()=>run(async()=>{if(!state.draft.attempt)throw Error('El borrador todavía no se ha enviado.');return acceptEvidence(await api().status(state.draft.attempt.key));},'Verificando envío…'),
  lookupWebSale:reference=>run(()=>api().reconciliationSale(reference)),
  reconcile:(reason,linkedSaleId=null)=>run(async()=>{
   if(!reason?.trim())throw Error('Escribe el motivo de la conciliación.');
   if(canDiscardLocally(state.draft)){await update(s=>archiveDraft(s,{outcome:'discarded_local',reason,linkedSaleId}));return 'cancelled';}
   const a=state.draft.attempt;if(!a)throw Error('No hay un envío pendiente.');
   return acceptEvidence(await api().cancelAttempt(a.key,{generation:a.body.generation,reason,linkedSaleId,confirmed:true}));
  },'Conciliando sin reenviar…'),
  submit:()=>run(async()=>{
   if(state.draft.status==='confirmed')return state.draft;
   if(!state.catalog)throw Error('No hay catálogo guardado. Reintenta la conexión.');
   const result=await submitSale({draft:state.draft,catalog:state.catalog,api:api(),uuid,persist:draft=>update(s=>({...s,draft,receipts:draft.receipt&&!s.receipts.some(r=>r.id===draft.receipt.id)?[draft.receipt,...s.receipts]:s.receipts,catalog:draft.status==='confirmed'&&draft.serverGeneration===s.catalog?.generation?{...s.catalog,revision:draft.serverRevision}:s.catalog}))});
   if(result.status==='cancelled'){await update(s=>archiveDraft(s,{outcome:'reconciled',operationId:result.attempt.key}));return result;}
   if(result.status==='confirmed')connectionStatus='connected';else{error=result.error||'Envío pendiente de verificación.';if(result.status==='offline')connectionStatus='offline';}emit();if(result.status==='rejected'&&['STALE_DATA','MOBILE_PAYMENT_CLIENT_UPDATE_REQUIRED'].includes(result.attempt?.rejectionCode))await model.sync();return result;
  },'Enviando…'),
  newSale:()=>run(async()=>{if(state.draft.status!=='confirmed')throw Error('Confirma o descarta el borrador antes de iniciar otro.');await update(s=>({...s,draft:emptyDraft(),capture:null}));return true;}),
 };
 return model;
}
