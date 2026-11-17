import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';

const id=new Date().toISOString().replaceAll(/[:.]/g,'-')+'_'+randomUUID().slice(0,8);
const directory=new URL(`../../.artifacts/audit/${id}/`,import.meta.url);
await mkdir(directory,{recursive:true});
const save=(name,value)=>writeFile(new URL(name,directory),typeof value==='string'?value:JSON.stringify(value,null,2),{flag:'wx'});
await save('ports-before.txt',execFileSync('netstat',['-ano','-p','tcp'],{encoding:'utf8'}));
for(const [name,cwd] of [['mobile','D:/ReactApps/calcQuim'],['admin','D:/ReactApps/calcQuim-admin']]){
 await save(`git-${name}-before.txt`,execFileSync('git',['-c',`safe.directory=${cwd}`,'status','--porcelain=v1','--untracked-files=all'],{cwd,encoding:'utf8'}));
}
const config=await loadOperationalConfig('calcquim_activation_test');
assert.equal(config.database.database,'calcquim_activation_test');assert.equal(config.database.host,'127.0.0.1');
const pool=new pg.Pool({...config.database,max:1,options:'-c default_transaction_read_only=on',application_name:'nexo-master-audit-preflight'});
const result={id,createdAt:new Date().toISOString(),directory:directory.pathname,mutations:false};
try{
 result.identity=(await pool.query(`SELECT current_database() db,current_user AS role,current_setting('transaction_read_only') read_only,rolsuper,rolcreaterole,rolcreatedb,rolbypassrls FROM pg_roles WHERE rolname=current_user`)).rows[0];
 assert.equal(result.identity.db,'calcquim_activation_test');assert.equal(result.identity.read_only,'on');
 result.memberships=(await pool.query('SELECT r.rolname FROM pg_roles r WHERE pg_has_role(current_user,r.oid,\'MEMBER\')')).rows;
 result.schemas=(await pool.query(`SELECT nspname,pg_get_userbyid(nspowner) owner,has_schema_privilege(current_user,oid,'CREATE') can_create,has_schema_privilege(current_user,oid,'USAGE') can_use FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema' ORDER BY nspname`)).rows;
 result.databases=(await pool.query(`SELECT datname,pg_get_userbyid(datdba) owner,has_database_privilege(current_user,oid,'CONNECT') can_connect,has_database_privilege(current_user,oid,'CREATE') can_create FROM pg_database WHERE datname LIKE 'calcquim%'`)).rows;
 result.qaRoles=(await pool.query(`SELECT rolname,rolsuper,rolcreaterole,rolcreatedb,rolcanlogin FROM pg_roles WHERE rolname ILIKE '%qa%' OR rolname ILIKE '%test%' OR rolname ILIKE '%sandbox%'`)).rows;
 const old=JSON.parse(await readFile(new URL('../integrated/state.private.json',import.meta.url),'utf8'));
 assert.match(old.schema,/^calcquim_test_integrated_[a-f0-9]{20}$/);
 result.historicalQA=(await pool.query(`SELECT purpose,generation,revision FROM ${old.schema}.dataset_state WHERE singleton=true`)).rows;
 result.operationalCredentialShared=result.identity.role==='calcquim_operational_app';
}finally{await pool.end();}
await save('preflight.json',result);
await writeFile(new URL('./latest.private.json',import.meta.url),JSON.stringify({id,directory:directory.href},null,2));
console.log(JSON.stringify(result,null,2));
