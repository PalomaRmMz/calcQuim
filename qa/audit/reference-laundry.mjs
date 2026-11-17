import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
const config=await loadOperationalConfig('calcquim_operational');assert.equal(config.database.host,'127.0.0.1');
const c=new pg.Client({...config.database,options:'-c default_transaction_read_only=on'});await c.connect();
let rows;
try{assert.equal((await c.query("SHOW transaction_read_only")).rows[0].transaction_read_only,'on');rows=(await c.query("SELECT jsonb_build_object('id',id,'name',record->'name','price',record->'price','unit',record->'unit','priceMode',record->'priceMode','addons',record->'addons','loadPricing',record->'loadPricing') entry FROM calcquim_operational.commercial_services ORDER BY id")).rows.map(r=>r.entry);}finally{await c.end();}
const run=JSON.parse(await readFile(new URL('./latest.private.json',import.meta.url),'utf8'));
await writeFile(new URL(`laundry-reference-${Date.now()}.private.json`,run.directory),JSON.stringify(rows,null,2),{flag:'wx'});console.log(JSON.stringify(rows,null,2));
