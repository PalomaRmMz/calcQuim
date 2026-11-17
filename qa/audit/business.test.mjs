import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openStability,token} from './runtime.mjs';
import {hardwareCreationBundle} from '../../src/domain/hardwareCreation.mjs';
import {paymentAmounts as mobileAmounts} from '../../src/domain/payment.mjs';
import {paymentAmounts,WEB_PAYMENT_POLICY} from '../integrated/admin/src/domain/webPayment.mjs';

test('cash oracle: every cent 0–20 pesos and noncash payment, independent integer calculation',()=>{
 for(let cents=0;cents<=2000;cents++)for(const payment of ['Efectivo','Tarjeta','Transferencia']){
  const oracle=payment==='Efectivo'&&cents>0?Math.max(50,Math.floor((cents+25)/50)*50):cents;
  const actual=paymentAmounts([{amount:cents/100}],payment,WEB_PAYMENT_POLICY);
  assert.equal(actual.collectedCents,oracle,`${cents} ${payment}`);
  assert.deepEqual(mobileAmounts([{amount:cents/100}],payment),actual);
 }
});

test('60 purchase/sale cycles keep independent closed/loose/balance oracle and SQL ledger',async()=>{
 const q=await openStability();
 try{
  const id=(await q.command('saveHardwareProductBundle',hardwareCreationBundle({name:'Audit long sequence',saleMode:'both',packSize:'8',piecePrice:'5',packPrice:'21',initialEnabled:true,closedPackages:'40',looseUnits:'0'}))).result.id;
  const supplier=(await q.command('saveSupplier',{name:'Synthetic long sequence supplier',active:true,businessActivity:'JARCERIA'})).data.procurement.suppliers[0];
  const s=await q.service.read(),presentations=s.data.procurement.presentations.filter(p=>p.productId===id);
  const piece=presentations.find(p=>p.unit==='pieza'),pack=presentations.find(p=>p.unit==='paquete');
  const sale=p=>q.command('createCommercialSale',{commerceVersion:'fullclean-commerce-v1',payment:'Efectivo',items:[{reference:{kind:'presentation',id:p.id},tariffKey:'commerce:'+p.id,price:p.price,unit:p.unit,entryMode:'quantity',value:'1'}]});
  let closed=40,loose=0,total=320;
  for(let cycle=0;cycle<60;cycle++){
   await sale(piece);if(!loose){closed--;loose=8;}loose--;total--;
   await sale(pack);closed--;total-=8;
   await q.command('savePresentationPurchase',{supplierId:supplier.id,date:new Date().toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'}),presentationId:pack.id,quantity:'2',totalAmount:'30'});closed+=2;total+=16;
   const inventory=await q.service.inventory(),physical=inventory.packInventory.products.find(p=>p.productId===id);
   assert.equal(inventory.products.find(p=>p.productId===id).quantity,String(total));
   assert.equal(physical.closedPackages,String(closed));assert.equal(physical.looseUnits,String(loose));
   assert.equal(closed*8+loose,total);
  }
  assert.equal(total,740);
  const ledger=(await q.pool.query(`SELECT sum(quantity)::text total,count(*)::int movements FROM ${q.schema}.inventory_movements WHERE product_id=$1`,[String(id)])).rows[0];
  assert.equal(Number(ledger.total),740);assert.equal(ledger.movements,181);
  assert.equal((await q.service.read()).data.sales.length,120);
 }finally{await q.close();}
});

test('stale mobile product creation rejects atomically; fresh options retry creates exactly one',async()=>{
 const q=await openStability();
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const options=()=>fetch(q.base+'/api/mobile/v1/hardware/creation-options',{headers}).then(r=>r.json());
 try{
  const old=await options();
  await q.command('saveSupplier',{name:'Concurrent web supplier',active:true,businessActivity:'JARCERIA'});
  const bundle=hardwareCreationBundle({name:'Fresh options retry product',hardwareCategoryId:old.categories[0].id,saleMode:'both',packSize:'8',piecePrice:'5',packPrice:'21',initialEnabled:true,closedPackages:'4',looseUnits:'0'});
  const post=(o,key)=>fetch(q.base+'/api/mobile/v1/hardware/products',{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({confirmed:true,revision:o.revision,generation:o.generation,bundle})});
  assert.equal((await post(old,randomUUID())).status,412);
  assert.equal((await q.service.read()).data.products.filter(p=>p.name===bundle.product.name).length,0);
  const fresh=await options(),key=randomUUID(),first=await post(fresh,key),second=await post(fresh,key);
  assert.equal(first.status,200);assert.equal(second.status,200);assert.equal((await second.json()).replayed,true);
  assert.equal((await q.service.read()).data.products.filter(p=>p.name===bundle.product.name).length,1);
 }finally{await q.close();}
});
