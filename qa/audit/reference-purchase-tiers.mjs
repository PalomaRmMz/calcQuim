import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
const config=await loadOperationalConfig('calcquim_operational');assert.equal(config.database.database,'calcquim_operational');assert.equal(config.database.host,'127.0.0.1');
const c=new pg.Client({...config.database,max:1,options:'-c default_transaction_read_only=on',statement_timeout:3000,application_name:'nexo-tier-reference-readonly'});
await c.connect();const result={at:new Date().toISOString(),source:'operational commercial tier metadata only; no purchases or personal evidence text'};
try{
 await c.query('BEGIN READ ONLY');result.identity=(await c.query("SELECT current_database() db,current_setting('transaction_read_only') readonly")).rows[0];assert.equal(result.identity.readonly,'on');
 result.tiers=(await c.query(`SELECT e.key AS supplier_id,jsonb_build_object('minimumQuantity',t->'minimumQuantity','presentationId',t->'presentationId','costPerPresentation',t->'costPerPresentation','quotedAt',t->'quotedAt','evidenceProvided',length(COALESCE(t->>'evidence',''))>0) AS tier FROM calcquim_operational.dataset_state d CROSS JOIN LATERAL jsonb_each(CASE WHEN jsonb_typeof(d.metadata->'supplierPurchaseTiers')='object' THEN d.metadata->'supplierPurchaseTiers' ELSE '{}'::jsonb END) e CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(e.value)='array' THEN e.value ELSE '[]'::jsonb END) t WHERE d.singleton=true LIMIT 100`)).rows;
 await c.query('COMMIT');
}finally{await c.end();}
const phase=JSON.parse(await readFile(new URL('functional-state.private.json',import.meta.url),'utf8'));
await writeFile(new URL('purchase-tier-reference.private.json',phase.directory),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({identity:result.identity,tiers:result.tiers.length,priced:result.tiers.filter(r=>r.tier.costPerPresentation!=null).length}));
