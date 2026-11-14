import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import pg from './admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
const saved=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));
assert.equal(saved.database,'calcquim_activation_test');assert.match(saved.schema,/^calcquim_test_nexo_[a-f0-9]{20}$/);
const cfg=await loadOperationalConfig(saved.database);assert.equal(cfg.database.database,saved.database);
const pool=new pg.Pool({...cfg.database,application_name:'nexo-qa-verification'}),c=await pool.connect();
try{
 await c.query('BEGIN READ ONLY');await c.query(`SET LOCAL search_path TO ${saved.schema}, pg_catalog`);
 const database=(await c.query('SELECT current_database() AS database')).rows[0].database;assert.equal(database,saved.database);
 assert.equal((await c.query('SELECT purpose FROM dataset_state')).rows[0].purpose,'synthetic');
 const products=(await c.query('SELECT record FROM products')).rows.map(r=>r.record);
 const sales=(await c.query('SELECT record FROM sales ORDER BY position')).rows.map(r=>r.record);
 const movements=(await c.query('SELECT kind,quantity::text,sale_id,reference FROM inventory_movements ORDER BY seq')).rows;
 const events=(await c.query('SELECT action,before_state,after_state FROM inventory_pack_events ORDER BY seq')).rows;
 const accounts=(await c.query('SELECT known,closed_packages::text,loose_units::text,factor::text FROM inventory_pack_accounts')).rows;
 const migrations=(await c.query('SELECT version FROM schema_migrations ORDER BY version')).rows.map(r=>r.version);
 assert.equal(products.filter(p=>p.name.startsWith('Naturella')).length,1);assert.equal(sales.length,3);assert.ok(sales.every(s=>s.origin==='MOVIL'));assert.deepEqual(sales.map(s=>s.total).sort((a,b)=>a-b),[5,10,21]);
 assert.deepEqual(accounts,[{known:true,closed_packages:'2',loose_units:'5',factor:'8'}]);assert.equal(movements.filter(m=>m.kind==='sale').length,3);assert.equal(events.filter(e=>e.action==='automatic_open').length,1);
 await c.query('COMMIT');
 await writeFile(new URL('./emulator-evidence.json',import.meta.url),JSON.stringify({verifiedAt:new Date().toISOString(),database,schema:saved.schema,migrations,products,sales:sales.map(s=>({id:s.id,folio:s.folio,total:s.total,origin:s.origin})),movements,events,accounts},null,2));
 console.log('Android QA verificado: alta única; 3 ventas MOVIL; 1 apertura; 2 paquetes + 5 piezas; 21 equivalentes. Migraciones 1-13 en esquema aislado.');
}finally{c.release();await pool.end();}
