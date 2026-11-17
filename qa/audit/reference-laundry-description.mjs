import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
const cfg=await loadOperationalConfig('calcquim_operational');assert.equal(cfg.database.database,'calcquim_operational');assert.equal(cfg.database.host,'127.0.0.1');
const c=new pg.Client({...cfg.database,options:'-c default_transaction_read_only=on',statement_timeout:3000,application_name:'nexo-laundry-description-readonly'});await c.connect();let rows;
try{assert.equal((await c.query('SHOW transaction_read_only')).rows[0].transaction_read_only,'on');rows=(await c.query("SELECT id,record->>'name' AS name,record->'descriptionRequired' AS description_required FROM calcquim_operational.commercial_services ORDER BY id")).rows;}finally{await c.end();}
const phase=JSON.parse(await readFile(new URL('functional-state.private.json',import.meta.url),'utf8'));await writeFile(new URL('laundry-description-reference.private.json',phase.directory),JSON.stringify({source:'operational READ ONLY commercial service flags',rows},null,2),{flag:'wx'});console.log(JSON.stringify(rows));
