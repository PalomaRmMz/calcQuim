import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openStability,token} from './runtime.mjs';
import {catalogChoices,validateCatalog} from '../../src/domain/catalog.mjs';
import {makeLine,requestBody,payableTotal} from '../../src/domain/sale.mjs';
import {ticketModel,ticketHtml} from '../../src/domain/ticket.mjs';
import {WEB_PAYMENT_POLICY} from '../../src/domain/payment.mjs';
import {submitSale} from '../../src/domain/submission.mjs';
import {createMobileApi} from '../../src/services/mobileApi.mjs';
import {ticketModel as webTicketModel} from '../integrated/admin/src/domain/mobileReceipt/ticket.mjs';
test('mobile cash policy: capability, legacy rejection, exact receipts, replay and corrections',async()=>{
 const q=await openStability();
 try{
  await q.command('configureWebPaymentPolicy',{enabled:true,approved:true,policyVersion:WEB_PAYMENT_POLICY,reason:'Synthetic audit mobile parity'});
  const headers={Authorization:'Bearer '+token,'Content-Type':'application/json','X-CalcQuim-Capabilities':'fullclean-commerce-v1'};
  const catalog=()=>fetch(q.base+'/api/mobile/v1/catalog',{headers}).then(r=>r.json());
  const post=(key,body)=>fetch(q.base+'/api/mobile/v1/sales',{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify(body)});
  for(const [value,payment,expected]of [['17.75','Efectivo',18],['0.13','Efectivo',0.5],['0.13','Transferencia',0.13]]){
   const c=await catalog();assert.equal(c.mobilePaymentPolicy.version,WEB_PAYMENT_POLICY);validateCatalog(c);
   assert.throws(()=>validateCatalog({...c,mobilePaymentPolicy:{enabled:true,version:'unknown'}}),/incompatible/);
   const choice=catalogChoices(c.data).find(c=>c.kind==='product'),line=makeLine(choice,choice.tariffs[0],'amount',value,randomUUID());
   const draft={lines:[line],payment,generation:c.generation},body=requestBody(draft,c);
   assert.equal(payableTotal(draft.lines,payment,c),expected);
   const legacy={...body};delete legacy.mobilePaymentPolicyVersion;
   const rejected=await post(randomUUID(),legacy);assert.equal(rejected.status,409);assert.equal((await rejected.json()).error.code,'MOBILE_PAYMENT_CLIENT_UPDATE_REQUIRED');
   const key=randomUUID(),r=await post(key,body);const result=await r.json();assert.equal(r.status,200,JSON.stringify(result));assert.equal(result.receipt.total,expected);
   assert.equal(ticketModel(result.receipt).total,'$'+expected.toFixed(2));assert.equal(ticketHtml(result.receipt).includes('Redondeo'),result.receipt.monetary.roundingCents!==0);
   const replay=await post(key,body);assert.equal((await replay.json()).receipt.id,result.receipt.id);
   const altered=structuredClone(result.receipt);altered.total+=0.5;assert.throws(()=>ticketModel(altered));
  }
  assert.equal((await q.service.read()).data.sales.length,3);
  const original=(await q.service.read()).data.sales.find(s=>s.total===18);
  await q.command('correctMobileSale',original.id,{values:['18.25'],confirmedQuantities:['1.825'],physicalTreatment:'apply_difference',baselineTreatment:'apply_now',reason:'Synthetic correction; no settlement claimed'});
  const revised=(await q.service.read()).data.sales.find(s=>s.id===original.id);
  assert.equal(revised.total,18.5);assert.equal(revised.originalReceipt.total,18);
  assert.deepEqual(revised.monetarySettlement,{status:'not_recorded',lastConfirmedCollectedCents:1800,revisedDueCents:1850,differenceCents:50});
  assert.deepEqual(ticketModel(revised.updatedReceipt),webTicketModel(revised.updatedReceipt));
  assert.ok(ticketHtml(revised.updatedReceipt).includes('Su liquidación no está registrada'));
  const c=await q.pool.connect();
  try{
   await c.query('BEGIN');await c.query(`SET LOCAL search_path TO ${q.schema},pg_catalog`);
   await c.query("UPDATE sales SET record=jsonb_set(record,'{origin}','\"INVALID\"') WHERE id=$1",[original.id]);
   await assert.rejects(c.query('SET CONSTRAINTS ALL IMMEDIATE'),e=>e.code==='23514');
  }finally{await c.query('ROLLBACK');c.release();}
 }finally{await q.close();}
});
test('old prepared draft: definite policy rejection, explicit fresh retry, same key and one sale',async()=>{
 const q=await openStability();
 try{
  await q.command('configureWebPaymentPolicy',{enabled:true,approved:true,policyVersion:WEB_PAYMENT_POLICY,reason:'Synthetic old draft recovery'});
  const api=createMobileApi(q.base,token),fresh=await api.catalog(),old={...fresh};delete old.mobilePaymentPolicy;
  const choice=catalogChoices(old.data).find(c=>c.kind==='product'),line=makeLine(choice,choice.tariffs[0],'amount','17.75',randomUUID());
  const key=randomUUID(),draft={lines:[line],payment:'Efectivo',generation:old.generation,status:'draft'},saved=[];
  draft.attempt={delivery:'prepared',key,body:requestBody(draft,old),server:api.identity};
  const first=await submitSale({draft,catalog:fresh,api,persist:async d=>saved.push(d),uuid:randomUUID});
  assert.equal(first.status,'rejected');assert.equal(first.attempt.rejectionCode,'MOBILE_PAYMENT_CLIENT_UPDATE_REQUIRED');assert.equal((await q.service.read()).data.sales.length,0);
  const second=await submitSale({draft:first,catalog:await api.catalog(),api,persist:async d=>saved.push(d),uuid:randomUUID});
  assert.equal(second.status,'confirmed');assert.equal(second.attempt.key,key);assert.equal(second.receipt.total,18);assert.equal((await q.service.read()).data.sales.length,1);
 }finally{await q.close();}
});
