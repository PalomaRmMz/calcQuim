// Reuse reviewed suites against the independent cluster, preserving previous QA evidence.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const here=new URL('./',import.meta.url),old=new URL('../integrated/',import.meta.url);
let runtime=await readFile(new URL('runtime.mjs',old),'utf8');
runtime=runtime.replace("import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';","import {readFile} from 'node:fs/promises';\nconst auditState=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));\nassert.equal(auditState.database.port,55439);assert.equal(auditState.database.user,'nexo_audit_app');");
runtime=runtime.replace("await loadOperationalConfig('calcquim_activation_test')","{database:auditState.database}").replaceAll('calcquim_activation_test','nexo_audit_test').replaceAll('calcquim_test_integrated_','calcquim_test_auditreg_').replaceAll("'./admin/","'../integrated/admin/").replaceAll('nexo-integrated','nexo-master-audit-regression');
assert.ok(!runtime.includes('loadOperationalConfig'));
await writeFile(new URL('runtime.mjs',here),runtime,{flag:'wx'});
for(const name of ['regression.test.mjs','stability.test.mjs','recovery.test.mjs','web-cash.test.mjs']){
 const text=(await readFile(new URL(name,old),'utf8')).replaceAll("'./admin/","'../integrated/admin/").replaceAll('new Date().toISOString().slice(0,10)',"new Date().toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'})");
 await writeFile(new URL(name,here),text,{flag:'wx'});
}
console.log('Suites prepared: independent database only; historical scenarios untouched.');
