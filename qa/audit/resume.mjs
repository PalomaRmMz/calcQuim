import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
const state=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));
const run=JSON.parse(await readFile(new URL('./latest.private.json',import.meta.url),'utf8'));
assert.equal(state.database.host,'127.0.0.1');assert.equal(state.database.port,55439);assert.equal(state.database.database,'nexo_audit_test');assert.equal(state.database.user,'nexo_audit_app');assert.match(state.schema,/^calcquim_test_audit_[a-f0-9]{20}$/);
const directory=new URL(`resume-${new Date().toISOString().replaceAll(/[:.]/g,'-')}/`,run.directory);await mkdir(directory);
const pool=new pg.Pool({...state.database,max:1,options:'-c default_transaction_read_only=on'});
const result={runId:state.id,at:new Date().toISOString()};
try{
 result.sql=(await pool.query("SELECT current_database() db,current_user role,inet_server_port() port,current_setting('transaction_read_only') read_only,rolsuper,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=current_user")).rows[0];
 assert.equal(result.sql.db,'nexo_audit_test');assert.equal(result.sql.port,55439);assert.equal(result.sql.read_only,'on');assert.equal(result.sql.rolsuper,false);
 result.databases=(await pool.query('SELECT datname FROM pg_database')).rows.map(r=>r.datname);assert.ok(!result.databases.some(n=>n.startsWith('calcquim')));
 result.dataset=(await pool.query(`SELECT purpose,generation,revision FROM ${state.schema}.dataset_state WHERE singleton`)).rows[0];assert.equal(result.dataset.purpose,'synthetic');assert.equal(result.dataset.generation,state.generation);
 result.identity=await fetch(state.base+'/audit/identity').then(r=>r.json());assert.equal(result.identity.generation,state.generation);assert.equal(result.identity.port,55439);
 const dataset=await fetch(state.base+'/api/v1/dataset').then(r=>r.json()),inventory=await fetch(state.base+'/api/v1/inventory').then(r=>r.json());
 assert.equal(dataset.generation,result.dataset.generation);assert.equal(dataset.revision,Number(result.dataset.revision));
 result.counts={products:dataset.data.products.length,categories:dataset.data.categories.length,suppliers:dataset.data.procurement.suppliers.length,services:dataset.data.procurement.services.length,purchases:dataset.data.procurement.purchases.length,sales:dataset.data.sales.length};
 result.sales=dataset.data.sales.map(s=>({id:s.id,folio:s.folio,total:s.total,version:s.commercialVersion??1,origin:s.origin,originalTotal:s.originalReceipt?.total,breakdowns:s.breakdowns}));
 result.balances=inventory.products.filter(p=>[31,32,72,73,119].includes(p.productId)).map(p=>({id:p.productId,name:p.name,quantity:p.quantity}));
 assert.ok(result.sales.find(s=>s.folio==='V-00002').version>=2);assert.equal(result.sales.find(s=>s.folio==='V-00002').originalTotal,5);
 result.stockLedger=(await pool.query(`SELECT product_id,sum(quantity)::text quantity,count(*)::int movements FROM ${state.schema}.inventory_movements WHERE product_id IN ('31','32','72','73','119') GROUP BY product_id ORDER BY product_id`)).rows;
 for(const balance of result.balances){assert.equal(Number(balance.quantity),Number(result.stockLedger.find(r=>r.product_id===String(balance.id)).quantity));assert.ok(Number(balance.quantity)>=0);}
}finally{await pool.end();}
await writeFile(new URL('resume.json',directory),JSON.stringify(result,null,2),{flag:'wx'});
await writeFile(new URL('ports.txt',directory),execFileSync('netstat',['-ano','-p','tcp'],{encoding:'utf8'}),{flag:'wx'});
console.log(JSON.stringify({...result,directory:directory.href},null,2));
