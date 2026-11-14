import {emptyDraft} from './persistence.mjs';
export function canDiscardLocally(draft){
  return draft.status!=='confirmed'&&(!draft.attempt||draft.attempt.delivery==='prepared'||draft.attempt.delivery==='rejected');
}
export function archiveDraft(state,{outcome,reason='',linkedSaleId=null,operationId=null},now=new Date().toISOString()){
  return {...state,draft:emptyDraft(),capture:null,draftResolutions:[...(state.draftResolutions||[]),{at:now,outcome,reason,linkedSaleId,operationId,draft:state.draft}]};
}
export function discardLocal(state){
  if(!canDiscardLocally(state.draft))throw Error('El envío pudo llegar al servidor. Revisa su estado o concílialo antes de descartarlo.');
  return archiveDraft(state,{outcome:'discarded_local'});
}
