export async function resolveSaleChange({attempt,api,persist,allowSend=false}){
 if(attempt.server!==api.identity)throw Error('Consulta la revisión con su conexión original.');
 const save=async patch=>{const next={...attempt,...patch};await persist(next);return next;};
 await save({phase:'unknown'});
 try{
  let result=await api.saleChangeStatus(attempt.key);
  if(result.status==='not_found'){
   if(!allowSend)return save({phase:'prepared',error:'Sin confirmación. Puedes reintentar la misma revisión.'});
   result=await api.saveSaleChange(attempt.saleId,attempt.key,attempt.body);
  }
  if(result.status!=='confirmed')throw Error('El resultado de la revisión todavía no se conoce.');
  return save({phase:'confirmed',result,error:''});
 }catch(e){return save({phase:e.definitive?'rejected':'unknown',error:e.message});}
}
