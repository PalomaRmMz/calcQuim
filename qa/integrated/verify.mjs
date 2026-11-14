import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import pg from './admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
import {createDatasetService} from './admin/server/src/services/dataset.mjs';
import {officialCommercialChoices,searchCommercial} from '../../src/domain/commercial.mjs';
const state=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));
assert.equal(state.database,'calcquim_activation_test');assert.equal(state.base,'http://127.0.0.1:63327');assert.match(state.schema,/^calcquim_test_integrated_[a-f0-9]{20}$/);
const config=await loadOperationalConfig(state.database);assert.equal(config.database.database,state.database);assert.equal(config.database.host,'127.0.0.1');
const pool=new pg.Pool({...config.database,application_name:'nexo-integrated-readonly',options:'-c default_transaction_read_only=on'});
try{
 const identity=(await pool.query("SELECT current_database() AS database,current_setting('transaction_read_only') AS read_only")).rows[0];assert.equal(identity.database,state.database);assert.equal(identity.read_only,'on');
 const marker=(await pool.query(`SELECT purpose,generation FROM ${state.schema}.dataset_state WHERE singleton`)).rows[0];assert.equal(marker.purpose,'synthetic');
 const service=createDatasetService(pool,state.schema),snapshot=await service.read(),inventory=await service.inventory();
 const products=snapshot.data.products.filter(p=>p.name==='Naturella Nocturna Súper Abundante');assert.equal(products.length,1);const product=products[0];
 const balance=inventory.products.find(p=>p.productId===product.id),pack=inventory.packInventory.products.find(p=>p.productId===product.id);
 const presentations=snapshot.data.procurement.presentations.filter(p=>p.productId===product.id);assert.deepEqual(presentations.map(p=>p.price).sort((a,b)=>a-b),[5,21]);
 assert.equal(snapshot.data.procurement.hardwareCategories.filter(c=>c.name==='Higiene personal').length,1);
 const catalog=await(await fetch(state.base+'/api/mobile/v1/catalog',{headers:{Authorization:'Bearer '+state.token,'X-CalcQuim-Capabilities':'fullclean-commerce-v1'}})).json();assert.equal(catalog.environment,'synthetic');assert.equal(catalog.generation,snapshot.generation);
 assert.equal(searchCommercial(officialCommercialChoices(catalog),'Naturella').length,2,'Both sellable Naturella presentations must survive a catalog refresh.');
 const packEvents=(await pool.query(`SELECT product_id,action FROM ${state.schema}.inventory_pack_events WHERE product_id=$1`,[product.id])).rows;
 const movements=(await pool.query(`SELECT kind,quantity::text,sale_id FROM ${state.schema}.inventory_movements WHERE product_id=$1`,[product.id])).rows;
 const result={verifiedAt:new Date().toISOString(),identity,schema:state.schema,purpose:marker.purpose,apiMatchesSqlGeneration:true,product,presentations,balance,pack,packEvents,movements,sales:snapshot.data.sales.map(s=>({id:s.id,folio:s.folio,origin:s.origin,total:s.total,version:s.commercialVersion,originalTotal:s.originalReceipt?.total,revisions:s.revisions,items:s.items,history:s.history}))};
 const label=process.argv[2]||'snapshot';assert.match(label,/^[a-z0-9-]+$/);
 if(label==='initial'){assert.equal(balance.quantity,'32');assert.equal(pack.closedPackages,'4');assert.equal(pack.looseUnits,'0');assert.equal(result.sales.length,0);}
 if(label==='after-piece'){assert.equal(balance.quantity,'31');assert.equal(pack.closedPackages,'3');assert.equal(pack.looseUnits,'7');assert.equal(result.sales.length,1);assert.equal(result.sales[0].total,5);assert.equal(packEvents.filter(e=>e.action==='automatic_open').length,1);assert.equal(movements.filter(m=>m.kind==='sale').length,1);}
 if(['after-edit','after-reopen'].includes(label)){
  assert.equal(balance.quantity,'31');assert.equal(pack.closedPackages,'3');assert.equal(pack.looseUnits,'7');assert.equal(result.sales.length,2);
  const fixture=JSON.parse(await readFile(new URL('../../.artifacts/integrated/editor-fixture.json',import.meta.url),'utf8'));
  const edited=result.sales.find(s=>s.id===fixture.receipt.id);assert.ok(edited);assert.equal(edited.folio,'V-00002');assert.equal(edited.total,20);assert.equal(edited.originalTotal,10);assert.equal(edited.version,2);assert.equal(edited.revisions.length,1);assert.equal(edited.history.at(-1).channel,'MOVIL');
  assert.equal(inventory.products.find(p=>p.productId===1).quantity,'98');assert.equal(packEvents.filter(e=>e.action==='automatic_open').length,1);assert.equal(movements.filter(m=>m.kind==='sale').length,1);
 }
 const folder=new URL('../../.artifacts/integrated/',import.meta.url);await mkdir(folder,{recursive:true});await writeFile(new URL(label+'-'+Date.now()+'.json',folder),JSON.stringify(result,null,2),{flag:'wx'});
 console.log(JSON.stringify({label,product:product.name,closed:pack.closedPackages,loose:pack.looseUnits,equivalent:balance.quantity,sales:result.sales.map(s=>({folio:s.folio,total:s.total,version:s.version})),automaticOpen:packEvents.filter(e=>e.action==='automatic_open').length}));
}finally{await pool.end();}
