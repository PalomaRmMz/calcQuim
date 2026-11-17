import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openStability,token} from './runtime.mjs';
import {officialServices} from '../integrated/admin/src/domain/officialLaundryServices.mjs';
import {serviceEditorValue} from '../integrated/admin/src/domain/serviceEditor.mjs';
import {catalogChoices} from '../../src/domain/catalog.mjs';
import {officialCommercialChoices} from '../../src/domain/commercial.mjs';
import {saleCorrectionPreview} from '../../src/domain/saleCorrectionPreview.mjs';
import {makeLine,requestBody} from '../../src/domain/sale.mjs';
import {createMobileApi} from '../../src/services/mobileApi.mjs';
import {ticketModel} from '../../src/domain/ticket.mjs';
import {ticketModel as webTicket} from '../integrated/admin/src/domain/mobileReceipt/ticket.mjs';
import {WEB_PAYMENT_POLICY} from '../../src/domain/payment.mjs';

test('service editor preserves rules, validates combinations and missing amounts',()=>{
 const wash=structuredClone(officialServices[0]);
 assert.deepEqual(serviceEditorValue(wash),wash);
 const bad=structuredClone(wash);bad.loadPricing.options[0].half='';assert.throws(()=>serviceEditorValue(bad));
 bad.loadPricing.options[0].half=30;bad.loadPricing.options[1].addons=[];assert.throws(()=>serviceEditorValue(bad));
});

test('Android laundry: 8 approved prices, mixed cash, historical correction, receipts and no service stock',async()=>{
 const q=await openStability();
 try{
  for(const service of officialServices)await q.command('saveService',serviceEditorValue(service));
  await q.command('configureWebPaymentPolicy',{enabled:true,approved:true,policyVersion:WEB_PAYMENT_POLICY,reason:'Synthetic functional laundry'});
  const api=createMobileApi(q.base,token),snapshot=await api.catalog();
  const choices=officialCommercialChoices(snapshot),wash=choices.find(c=>c.kind==='service'&&c.name==='Lavado por carga');assert.ok(wash);
  const tariff=wash.tariffs[0],expected=[[60,30],[70,40],[90,60],[100,50]];
  for(const [index,option]of tariff.service.loadPricing.options.entries())for(const [n,quantity]of ['1','0.5'].entries()){
   const line=makeLine(wash,tariff,'quantity',quantity,randomUUID(),null,{addons:option.addons});assert.equal(line.amount,expected[index][n]);
   const body=requestBody({lines:[line],payment:'Efectivo'},snapshot);assert.deepEqual(body.items[0].addons,option.addons);
  }
  const dry=choices.find(c=>c.name==='Solo secado');assert.throws(()=>makeLine(dry,dry.tariffs[0],'quantity','0.5',randomUUID()),/completas/);
  const custom=choices.find(c=>c.name==='Servicio a medida');assert.throws(()=>makeLine(custom,custom.tariffs[0],'amount','25',randomUUID()),/Describe/);
  const customLine=makeLine(custom,custom.tariffs[0],'amount','25',randomUUID(),null,{description:'Trabajo sintético QA'});assert.equal(customLine.amount,25);
  const physical=catalogChoices(snapshot.data).find(c=>c.kind==='line'),serviceLine=makeLine(wash,tariff,'quantity','0.5',randomUUID(),null,{addons:['insumos','secado']}),productLine=makeLine(physical,physical.tariffs[0],'amount','13.30',randomUUID());
  const before=await q.service.inventory(),key=randomUUID();const body=requestBody({lines:[serviceLine,productLine],payment:'Efectivo'},snapshot);
  const first=await api.register(key,body),again=await api.register(key,body);assert.equal(first.receipt.id,again.receipt.id);assert.equal(first.receipt.total,63.5);
  assert.deepEqual(ticketModel(first.receipt),webTicket(first.receipt));assert.ok(ticketModel(first.receipt).items[0].service.includes('Servicio completo'));
  const after=await q.service.inventory();assert.deepEqual(after.products,before.products);assert.equal(after.pending.filter(p=>p.state==='pending').length,1);
  const editor=await api.saleEditor(first.receipt.id),correctionKey=randomUUID();
  const change={kind:'correction',revision:editor.revision,generation:editor.generation,change:{values:['1','13.30'],serviceOptions:[{addons:['insumos'],description:''},{}],confirmedQuantities:['',''],reason:'Synthetic change of approved historical modality',physicalTreatment:'apply_difference',baselineTreatment:'apply_now'}};
  assert.equal(saleCorrectionPreview(editor.sale,change.change.values,change.change.serviceOptions).total,83.5);
  const corrected=await api.saveSaleChange(first.receipt.id,correctionKey,change);assert.equal(corrected.status,'confirmed');
  const revised=(await q.service.read()).data.sales[0];assert.equal(revised.items[0].amount,70);assert.equal(revised.total,83.5);assert.equal(revised.originalReceipt.total,63.5);assert.equal(revised.monetarySettlement.differenceCents,2000);assert.deepEqual(ticketModel(revised.updatedReceipt),webTicket(revised.updatedReceipt));
  const official=await api.officialSale(revised.id);assert.equal(official.sale.collection.confirmedCents,6350);assert.equal(official.sale.collection.collectedCents,null);
  assert.equal((await q.service.inventory()).movements.some(m=>String(m.product_id).startsWith('fc:service')),false);
  const originalSales=JSON.stringify((await q.service.read()).data.sales);
  await q.command('saveService',{...officialServices[0],active:false});
  assert.equal(JSON.stringify((await q.service.read()).data.sales),originalSales);
  assert.equal(officialCommercialChoices(await api.catalog()).some(c=>c.refId===wash.refId),false);
  const saved=(await q.service.read()).data.procurement.services.find(s=>s.id===wash.refId);assert.equal(saved.configurationHistory.at(-1).before.active,true);assert.equal(saved.configurationHistory.at(-1).after.active,false);
 }finally{await q.close();}
});
