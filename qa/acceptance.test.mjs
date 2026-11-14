import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {openQa,token} from './runtime.mjs';
import {hardwareCreationBundle} from '../src/domain/hardwareCreation.mjs';
import {COMMERCE_VERSION} from './admin/src/domain/commerce.mjs';
const rows=[];
test('Nexo QA: alta Android por HTTP, transacciones y Naturella A-F',async t=>{
 const qa=await openQa();
 async function request(path,body,key=randomUUID()){
  const r=await fetch(qa.base+'/api/mobile/v1'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Idempotency-Key':key},...(body?{body:JSON.stringify(body)}:{})});
  const value=await r.json();if(!r.ok)throw Object.assign(Error(value.error?.message),{status:r.status});return value;
 }
 async function stock(id){const inv=await qa.service.inventory();return {...inv.products.find(p=>String(p.productId)===String(id)),pack:inv.packInventory?.products.find(p=>String(p.productId)===String(id))};}
 async function record(label,id,expected){const p=await stock(id);assert.equal(p.quantity,String(expected[2]));assert.equal(p.pack.closedPackages,String(expected[0]));assert.equal(p.pack.looseUnits,String(expected[1]));rows.push({label,...p.pack,quantity:p.quantity});}
 async function sale(id,unit,quantity){const s=await qa.service.read(),p=s.data.procurement.presentations.find(p=>String(p.productId)===String(id)&&p.unit===unit);return qa.command('createCommercialSale',{payment:'Efectivo',commerceVersion:COMMERCE_VERSION,items:[{reference:{kind:'presentation',id:p.id},tariffKey:'commerce:'+p.id,entryMode:'quantity',value:String(quantity),price:p.price,unit:p.unit}]});}
 try{
  const options=await request('/hardware/creation-options');assert.equal(options.creationVersion,2);
  const bundle=hardwareCreationBundle({name:'Naturella',variant:'Nocturna S\u00faper Abundante',hardwareCategoryId:options.categories[0].id,saleMode:'both',packSize:'8',packPrice:'21',piecePrice:'5',initialEnabled:true,closedPackages:'4',looseUnits:'0'});
  const body={confirmed:true,revision:options.revision,generation:options.generation,bundle};const key=randomUUID();let id;
  await t.test('A: alta y reintento exactamente una vez',async()=>{const a=await request('/hardware/products',body,key),b=await request('/hardware/products',body,key);id=a.productId;assert.equal(a.productId,b.productId);assert.equal(b.replayed,true);const s=await qa.service.read();assert.equal(s.data.products.filter(p=>p.name.startsWith('Naturella')).length,1);assert.deepEqual(s.data.procurement.presentations.filter(p=>p.productId===id).map(p=>p.price).sort((a,b)=>a-b),[5,21]);});
  await record('A',id,[4,0,32]);
  await t.test('B: una pieza cuesta $5, apertura de un paquete',async()=>{const s=await sale(id,'pieza',1);assert.equal(s.data.sales[0].total,5);await record('B',id,[3,7,31]);});
  await t.test('C: dos piezas adicionales',async()=>{await sale(id,'pieza',2);await record('C',id,[3,5,29]);});
  await t.test('D: paquete cuesta $21',async()=>{const s=await sale(id,'paquete',1);assert.equal(s.data.sales[0].total,21);await record('D',id,[2,5,21]);});
  await t.test('E: rechazo sin efectos parciales',async()=>{const before=await qa.service.operations();await assert.rejects(sale(id,'pieza',22));assert.deepEqual(await qa.service.operations(),before);await record('E',id,[2,5,21]);});
  await t.test('alta con composici?n inv?lida revierte producto y precios',async()=>{
    const options=await request('/hardware/creation-options');
    const invalid=structuredClone(bundle);invalid.product.name='Alta invalida QA';invalid.initialInventory.physicalComposition.closedPackages='-1';
    const before=await qa.service.operations();await assert.rejects(request('/hardware/products',{confirmed:true,revision:options.revision,generation:options.generation,bundle:invalid}));assert.deepEqual(await qa.service.operations(),before);
  });
  await t.test('F: ventas y movimientos sin doble descuento',async()=>{const s=await qa.service.read();assert.equal(s.data.sales.length,3);const q=await qa.pool.query(`SELECT kind,count(*)::integer AS count FROM ${qa.schema}.inventory_movements GROUP BY kind`);assert.deepEqual(Object.fromEntries(q.rows.map(r=>[r.kind,r.count])),{estimate:1,sale:3});const events=await qa.pool.query(`SELECT count(*)::integer AS count FROM ${qa.schema}.inventory_pack_events WHERE action='automatic_open'`);assert.equal(events.rows[0].count,1);});
 }finally{await writeFile(new URL('./naturella-results.json',import.meta.url),JSON.stringify({database:'calcquim_activation_test',schema:qa.schema,rows},null,2));await qa.close();}
});
