import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
const config=await loadOperationalConfig('calcquim_operational');
assert.equal(config.database.database,'calcquim_operational');assert.equal(config.database.host,'127.0.0.1');
const pool=new pg.Pool({...config.database,max:1,options:'-c default_transaction_read_only=on'});
const fields={purchased_items:['id','name','sourcingType','unit','active'],supply_sources:['id','purchasedItemId','supplierId','purchaseUnit','purchaseQuantity','presentation','active','yieldOverrides'],supply_conversions:['id','purchasedItemId','outputProductId','yield','active'],supplier_costs:['id','supplyItemId','date','quotedAt','price','priceQuantity','priceUnit','purchaseQuantity','cost','totalAmount','active']};
const result={at:new Date().toISOString(),source:'operational-read-only',historyCopied:false};
try{
 result.identity=(await pool.query("SELECT current_database() db,current_setting('transaction_read_only') read_only")).rows[0];assert.equal(result.identity.read_only,'on');
 for(const [table,keys] of Object.entries(fields))result[table]=(await pool.query(`SELECT jsonb_strip_nulls(jsonb_build_object(${keys.flatMap(k=>[`'${k}'`,`record->'${k}'`]).join(',')})) entry FROM calcquim_operational.${table} ORDER BY id LIMIT 1000`)).rows.map(r=>r.entry);
}finally{await pool.end();}
const run=JSON.parse(await readFile(new URL('./latest.private.json',import.meta.url),'utf8'));
await writeFile(new URL(`supply-reference-${Date.now()}.private.json`,run.directory),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({identity:result.identity,counts:Object.fromEntries(Object.keys(fields).map(k=>[k,result[k].length])),modalities:Object.fromEntries(Object.entries(Object.groupBy(result.purchased_items,a=>a.sourcingType)).map(([k,v])=>[k,v.length]))},null,2));
