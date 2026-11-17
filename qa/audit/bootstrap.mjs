import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {migrate} from '../integrated/admin/server/src/db/migrate.mjs';
const owner=JSON.parse(await readFile(new URL('./postgres.private.json',import.meta.url),'utf8'));
assert.equal(owner.port,55439);assert.equal(owner.user,'nexo_audit_owner');assert.equal(owner.host,'127.0.0.1');
const c=new pg.Client({...owner,max:1});await c.connect();
const password=randomBytes(32).toString('hex'),schema='calcquim_test_audit_'+randomUUID().replaceAll('-','').slice(0,20);
try{
 assert.equal((await c.query('SHOW data_directory')).rows[0].data_directory.replaceAll('\\','/').replace(/\/$/,''),owner.data.replaceAll('\\','/').replace(/\/$/,''));
 assert.equal((await c.query("SELECT count(*)::int n FROM pg_database WHERE datname LIKE 'calcquim%'")).rows[0].n,0);
 await c.query(`CREATE ROLE nexo_audit_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 4`);
 await c.query('CREATE DATABASE nexo_audit_test OWNER nexo_audit_app');
}finally{await c.end();}
const database={host:'127.0.0.1',port:55439,database:'nexo_audit_test',user:'nexo_audit_app',password,max:2,connectionTimeoutMillis:2000,statement_timeout:5000,lock_timeout:2000,application_name:'nexo-master-audit'};
const pool=new pg.Pool(database);
let identity;
try{
 identity=(await pool.query(`SELECT current_database() db,current_user AS role,inet_server_port() port,rolsuper,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=current_user`)).rows[0];
 assert.equal(identity.db,database.database);assert.equal(identity.role,database.user);assert.equal(identity.port,55439);assert.equal(identity.rolsuper,false);
 await migrate(pool,schema);
 const s=(await pool.query(`SELECT purpose,generation,revision FROM ${schema}.dataset_state`)).rows[0];assert.equal(s.purpose,'synthetic');
 const state={id:owner.id,database,schema,generation:s.generation,base:'http://127.0.0.1:63337',web:'http://127.0.0.1:5207',token:randomBytes(32).toString('hex')};
 await writeFile(new URL('./state.private.json',import.meta.url),JSON.stringify(state,null,2),{flag:'wx'});
 const run=JSON.parse(await readFile(new URL('./latest.private.json',import.meta.url),'utf8'));
 await writeFile(new URL('isolation.json',run.directory),JSON.stringify({identity,schema,synthetic:s,independentCluster:true,operationalDatabasesPresent:false},null,2),{flag:'wx'});
 console.log(JSON.stringify({identity,schema,empty:true,base:state.base,web:state.web}));
}finally{await pool.end();}
