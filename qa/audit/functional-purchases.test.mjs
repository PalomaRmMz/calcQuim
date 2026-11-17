import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openStability} from './runtime.mjs';
import {hardwareCreationBundle} from '../../src/domain/hardwareCreation.mjs';

test('presentation purchase cost correction preserves quantity, ledger, receipt and revision; replay is unique',async()=>{
 const q=await openStability();
 try{
  const id=(await q.command('saveHardwareProductBundle',hardwareCreationBundle({name:'Synthetic cost correction',saleMode:'both',packSize:'4',piecePrice:'10',packPrice:'31',initialEnabled:true,closedPackages:'2',looseUnits:'0'}))).result.id;
  const supplier=(await q.command('saveSupplier',{name:'Synthetic QA supplier',active:true,businessActivity:'JARCERIA'})).data.procurement.suppliers[0];
  const p=(await q.service.read()).data.procurement.presentations.find(p=>p.productId===id&&p.unit==='paquete');
  await q.command('savePresentationPurchase',{supplierId:supplier.id,date:new Date().toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'}),presentationId:p.id,quantity:'2',totalAmount:'50'});
  const s=await q.service.read(),purchase=s.data.procurement.purchases[0],inventory=await q.service.inventory();
  const request={name:'correctPresentationPurchase',args:[purchase.id,{reason:'Actual paid total corrected; quantity unchanged',items:[{id:purchase.items[0].id,totalAmount:'48'}]}],revision:s.revision,generation:s.generation,requestKey:randomUUID()};
  await q.service.command(request);const replay=await q.service.command(request);assert.equal(replay.replayed,true);
  const after=(await q.service.read()).data.procurement.purchases[0];assert.equal(after.id,purchase.id);assert.equal(after.total,48);assert.equal(after.revisions.length,1);assert.equal(after.revisions[0].total,50);assert.equal(after.items[0].quantity,8);assert.equal(after.items[0].commercialPurchase.costPerPresentation,24);
  const next=await q.service.inventory();assert.deepEqual(next.products,inventory.products);assert.deepEqual(next.movements,inventory.movements);
  const view=await q.service.purchaseInventory();assert.equal(view.rows.find(r=>r.purchase_id===purchase.id).source.total,48);
  await assert.rejects(q.command('correctPresentationPurchase',purchase.id,{reason:'Attempt to alter quantity',items:[{id:purchase.items[0].id,totalAmount:'40',quantity:'9'}]}));assert.equal((await q.service.read()).data.procurement.purchases[0].total,48);
 }finally{await q.close();}
});
