import test from 'node:test';import assert from 'node:assert/strict';
import {createProductAttemptStorage,resolveProductCreation} from '../src/domain/productCreationSubmission.mjs';
test('alta incierta recupera confirmación sin duplicar ni reenviar automáticamente',async()=>{
 let raw=null,sends=0,committed=false;const storage=createProductAttemptStorage({getItem:async()=>raw,setItem:async(k,v)=>{raw=v;}});
 const attempt={key:'creation-12345',server:'http://127.0.0.1:57712',credentialFingerprint:'same',body:{name:'QA'},phase:'prepared'};
 const api={identity:attempt.server,productCreationStatus:async()=>committed?{status:'confirmed',operationId:attempt.key,productId:123}:{status:'not_found'},createHardware:async()=>{assert.ok(raw);sends++;committed=true;throw Object.assign(Error('network'),{offline:true});}};
 const a=await resolveProductCreation({attempt,api,fingerprint:'same',persist:storage.save,allowSend:true});assert.equal(a.phase,'unknown');const b=await resolveProductCreation({attempt:(await storage.all())[0],api,fingerprint:'same',persist:storage.save});assert.equal(b.phase,'confirmed');assert.equal(sends,1);
 await assert.rejects(resolveProductCreation({attempt,api,fingerprint:'other',persist:storage.save}));
});
