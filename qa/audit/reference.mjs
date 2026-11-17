// Only catalog fields required for reconstruction; never tickets, sales or personal contacts.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
const config=await loadOperationalConfig('calcquim_operational');
assert.equal(config.database.host,'127.0.0.1');assert.equal(config.database.database,'calcquim_operational');
const c=new pg.Client({...config.database,max:1,options:'-c default_transaction_read_only=on',application_name:'nexo-catalog-reference-readonly'});
await c.connect();const result={source:'operational_catalog_readonly',capturedAt:new Date().toISOString(),historyCopied:false};
try{
 await c.query('BEGIN READ ONLY');
 result.identity=(await c.query("SELECT current_database() db,current_setting('transaction_read_only') read_only")).rows[0];assert.equal(result.identity.read_only,'on');
 for(const table of ['categories','product_lines','price_groups','products','suppliers','commercial_presentations','commercial_services']){
  const fields=table==='suppliers'?['id','name','active','businessActivity']:table==='products'?['id','name','unit','price','priceGroupId','categoryId','lineId','active','available','activity','hardwareCategoryId','pricePending']:table==='commercial_presentations'?['id','productId','name','unit','factor','price','saleEnabled','purchaseEnabled','active']:['id','name','categoryId','price','active','unit','priceMode','pricing','useAsProductPrefix'];
  const expression=fields.flatMap(k=>[`'${k}'`,`record->'${k}'`]).join(',');
  result[table]=(await c.query(`SELECT jsonb_strip_nulls(jsonb_build_object(${expression})) entry FROM calcquim_operational.${table} ORDER BY id LIMIT 500`)).rows.map(r=>r.entry);
 }
 result.hardwareCategories=(await c.query("SELECT metadata->'hardwareCategories' AS entries FROM calcquim_operational.dataset_state WHERE singleton=true")).rows[0].entries;
 await c.query('COMMIT');
}finally{await c.end();}
const run=JSON.parse(await readFile(new URL('./latest.private.json',import.meta.url),'utf8'));
await writeFile(new URL('catalog-reference-v3.private.json',run.directory),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({identity:result.identity,counts:Object.fromEntries(Object.entries(result).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length])),products:result.products.map(p=>({name:p.name,price:p.price,unit:p.unit,activity:p.activity})),suppliers:result.suppliers.map(p=>p.name)},null,2));
