import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),groups=JSON.parse(await readFile(new URL('functional-suites.json',import.meta.url),'utf8'));
const phase=JSON.parse(await readFile(new URL('functional-state.private.json',import.meta.url),'utf8'));
const dir=new URL('checks-'+new Date().toISOString().replaceAll(/[:.]/g,'-')+'/',phase.directory);await mkdir(dir);
const selected=process.argv.slice(2);if(!selected.length)throw Error('Specify explicit groups: mobile additional backend web integration');
const results=[];
for(const name of selected){
 const group=groups[name];assert.ok(group,name);assert.ok(group.files.every(f=>!/[\*?]/.test(f)&&!f.includes('..')));
 if(name==='integration'){const state=JSON.parse(await readFile(new URL('state.private.json',import.meta.url),'utf8'));assert.equal(state.database.port,55439);assert.equal(state.database.database,'nexo_audit_test');}
 let output='';const start=Date.now();
 const child=spawn(process.execPath,['--test','--test-concurrency=1',...group.files],{cwd:fileURLToPath(new URL(group.cwd+'/',root)),windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>{output+=b;});child.stderr.on('data',b=>{output+=b;});
 const code=await new Promise((r,j)=>{child.once('error',j);child.once('close',r);});
 await writeFile(new URL(name+'.log',dir),output,{flag:'wx'});results.push({name,files:group.files,exit:code,seconds:(Date.now()-start)/1000,summary:output.split(/\r?\n/).filter(l=>/^# (tests|pass|fail|skipped)/.test(l))});
 console.log(JSON.stringify(results.at(-1)));
}
await writeFile(new URL('results.json',dir),JSON.stringify(results,null,2),{flag:'wx'});console.log('Evidence: '+dir.href);if(results.some(r=>r.exit!==0))process.exitCode=1;
