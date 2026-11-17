import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {migrate} from '../integrated/admin/server/src/db/migrate.mjs';
const s=JSON.parse(await readFile(new URL('state.private.json',import.meta.url),'utf8'));
assert.equal(s.database.host,'127.0.0.1');assert.equal(s.database.port,55439);assert.equal(s.database.database,'nexo_audit_test');assert.equal(s.database.user,'nexo_audit_app');assert.match(s.schema,/^calcquim_test_audit_[a-f0-9]{20}$/);
const p=new pg.Pool(s.database);
try{
 assert.deepEqual((await p.query('SELECT current_database() db,inet_server_port() port')).rows[0],{db:'nexo_audit_test',port:55439});
 assert.equal((await p.query(`SELECT generation FROM ${s.schema}.dataset_state WHERE singleton`)).rows[0].generation,s.generation);
 const sales=async()=>JSON.stringify((await p.query(`SELECT * FROM ${s.schema}.sales ORDER BY id`)).rows);
 const before=await sales();await migrate(p,s.schema);assert.equal(await sales(),before);
 const run=JSON.parse(await readFile(new URL('latest.private.json',import.meta.url),'utf8'));
 await writeFile(new URL('migration014-no-document-change.json',run.directory),JSON.stringify({generation:s.generation,migration:14,salesUnchanged:true,at:new Date().toISOString()}),{flag:'wx'});
 console.log('Migration014 QA only; all existing sale rows unchanged');
}finally{await p.end();}
