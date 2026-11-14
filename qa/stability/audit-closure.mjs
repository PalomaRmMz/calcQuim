// Closure audit: GET/SELECT only. Existing evidence and source files are never replaced.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import pg from './admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
import {createDatasetService} from './admin/server/src/services/dataset.mjs';

const exec=promisify(execFile),root=fileURLToPath(new URL('../../',import.meta.url));
const stamp=new Date().toISOString().replace(/[-:.]/g,'');
const directory=new URL('./closure-'+stamp+'/',import.meta.url);
await mkdir(directory,{recursive:false});
const save=(name,value)=>writeFile(new URL(name,directory),typeof value==='string'?value:JSON.stringify(value,null,2),{encoding:'utf8',flag:'wx'});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=async args=>(await exec('git',args,{cwd:root,windowsHide:true,maxBuffer:4e6})).stdout;
const branch=(await git(['branch','--show-current'])).trim();
assert.equal(branch,'dev');
const status=await git(['status','--porcelain=v1','--untracked-files=all']);
await save('git-status-before.txt',status);
const trackedNames=(await git(['diff','--name-only'])).trim().split(/\r?\n/).filter(Boolean);
const trackedHashes={};
for(const name of trackedNames)trackedHashes[name]=hash(await readFile(new URL('../../'+name,import.meta.url)));
const untracked=status.split(/\r?\n/).filter(s=>s.startsWith('?? ')).map(s=>s.slice(3));
const groups={};
for(const name of untracked){const group=name.startsWith('qa/stability/')?name.split('/').slice(0,3).join('/'):name.startsWith('qa/admin/')?'qa/admin':name.startsWith('src/')?'src':name.split('/')[0];groups[group]=(groups[group]||0)+1;}
const manifest=JSON.parse(await readFile(new URL('./source-changes.json',import.meta.url),'utf8'));
const sourceChecks=[];
for(const entry of manifest){const current=hash(await readFile(new URL('./'+entry.copy+'/'+entry.path,import.meta.url)));sourceChecks.push({path:entry.copy+'/'+entry.path,expected:entry.qaSha256,current,unchanged:current===entry.qaSha256});}
await save('source-checks.json',sourceChecks);
assert.ok(sourceChecks.every(s=>s.unchanged),'The recorded source manifest has drifted; reassess earlier tests.');
const historicalTests=[];
for(const name of ['stability-results.log','mobile-full-results.log','backend-regression.log','web-regression.log']){
 const file=new URL('./'+name,import.meta.url),bytes=await readFile(file);
 const body=bytes[0]===255&&bytes[1]===254?bytes.subarray(2).toString('utf16le'):bytes.toString('utf8');
 const number=label=>Number([...body.matchAll(new RegExp('^# '+label+' (\\d+)','gm'))].at(-1)?.[1]);
 const result={name,tests:number('tests'),passed:number('pass'),failed:number('fail'),sha256:hash(bytes),lastModified:(await stat(file)).mtime.toISOString()};
 assert.equal(result.failed,0);assert.equal(result.tests,result.passed);historicalTests.push(result);
}
await save('historical-tests.json',historicalTests);
const marker=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));
assert.equal(marker.database,'calcquim_activation_test');assert.equal(marker.base,'http://127.0.0.1:63317');assert.match(marker.schema,/^calcquim_test_stable_[a-f0-9]{20}$/);
const config=await loadOperationalConfig(marker.database);
assert.equal(config.database.database,marker.database);assert.equal(config.database.host,'127.0.0.1');
const pool=new pg.Pool({...config.database,application_name:'nexo-stability-closure-readonly',options:'-c default_transaction_read_only=on'});
let current;
try{
 const identity=(await pool.query("SELECT current_database() AS database,host(inet_server_addr()) AS host,current_setting('transaction_read_only') AS read_only")).rows[0];
 assert.equal(identity.database,marker.database);assert.equal(identity.host,'127.0.0.1');assert.equal(identity.read_only,'on');
 const state=(await pool.query(`SELECT purpose,revision::text,generation FROM ${marker.schema}.dataset_state WHERE singleton=true`)).rows[0];assert.equal(state.purpose,'synthetic');
 const service=createDatasetService(pool,marker.schema),view=await service.operations();
 async function get(path,authenticated=false){const response=await fetch(marker.base+path,{signal:AbortSignal.timeout(5000),headers:authenticated?{Authorization:'Bearer '+marker.token,'X-CalcQuim-Capabilities':'fullclean-commerce-v1'}:{}});assert.equal(response.status,200,path);return response.json();}
 const dataset=await get('/api/v1/dataset');assert.equal(dataset.generation,state.generation);
 const catalog=await get('/api/mobile/v1/catalog',true);assert.equal(catalog.environment,'synthetic');assert.equal(catalog.generation,state.generation);
 const history=await get('/api/mobile/v1/sales/history',true);assert.equal(history.source,'postgresql');assert.equal(history.generation,state.generation);
 const sale=view.data.sales.find(s=>s.id==='13bf5a64-a92d-410c-9bf0-6cbae9d18542');assert.ok(sale,'Historical emulator sale is missing; do not recreate it.');
 const editor=await get('/api/mobile/v1/sales/'+sale.id+'/editor',true);assert.equal(editor.generation,state.generation);assert.equal(editor.sale.id,sale.id);
 const original=JSON.parse(await readFile(new URL('./emulator-results.json',import.meta.url),'utf8'));
 const summary={id:sale.id,folio:sale.folio,total:sale.total,originalTotal:sale.originalReceipt?.total,version:sale.commercialVersion,revisions:sale.revisions?.length,lastAuditChannel:sale.history?.at(-1)?.channel};
 const known=original.sales[0];
 current={verifiedAt:new Date().toISOString(),identity,schema:marker.schema,dataset:state,apiBase:marker.base,apiMatchesDatabaseGeneration:true,saleCount:view.data.sales.length,sale:summary,inventory:view.inventory.products.map(p=>({productId:p.productId,name:p.name,quantity:p.quantity})),movements:view.inventory.movements.map(m=>({id:m.id,kind:m.kind,quantity:m.quantity,sale_id:m.sale_id})),matchesPriorEmulatorResult:summary.total===known.total&&summary.originalTotal===known.originalTotal&&summary.version===known.version&&summary.revisions===known.revisions.length};
 await save('current-qa.json',current);
}finally{await pool.end();}
const sourcePreserved={};for(const name of trackedNames)sourcePreserved[name]=trackedHashes[name]===hash(await readFile(new URL('../../'+name,import.meta.url)));
assert.ok(Object.values(sourcePreserved).every(Boolean),'A pre-existing tracked modification changed during this audit.');
await save('tracked-preservation.json',{before:trackedHashes,preserved:sourcePreserved});
const screenshots=[];
for(const name of ['edicion-confirmada.png','borrador-offline.png','borrador-descartado-offline.png','reinicio-sin-borrar-datos.png','web-venta-corregida.png']){const file=new URL('../../.artifacts/stability/screenshots/'+name,import.meta.url),bytes=await readFile(file);assert.equal(bytes.subarray(1,4).toString(),'PNG');screenshots.push({name,bytes:bytes.length,sha256:hash(bytes)});}
await save('screenshots.json',screenshots);
const summary={directory:fileURLToPath(directory),branch,trackedModifications:trackedNames.length,untrackedEntries:untracked.length,untrackedGroups:groups,manifestMatches:sourceChecks.length,historicalTests,currentQa:current.sale,inventory:current.inventory,allExistingTrackedChangesPreserved:true};
await save('summary.json',summary);console.log(JSON.stringify(summary,null,2));
