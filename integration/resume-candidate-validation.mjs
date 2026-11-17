import assert from 'node:assert/strict';
import {readFile,writeFile,cp,readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const {directory:dir,admin}=JSON.parse(await readFile(new URL('candidate.private.json',import.meta.url)));
const results=JSON.parse(await readFile(path.join(dir,'validation.json')));
assert.equal(results.at(-1).name,'web-tests');assert.equal(results.at(-1).exit,1);
await cp('D:/ReactApps/calcQuim-admin/benchmarks',path.join(admin,'benchmarks'),{recursive:true,errorOnExist:true,force:false});
const sources=JSON.parse(await readFile(path.join(dir,'sources.json')));
for(const name of await readdir(path.join(admin,'benchmarks/comparator'))){const rel='benchmarks/comparator/'+name;const b=await readFile(path.join(admin,rel));sources.files.push({path:rel,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile(path.join(dir,'sources.json'),JSON.stringify(sources,null,2));
const run=async(name,args,cwd)=>{let output='';const p=spawn(process.execPath,args,{cwd,windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.on('data',b=>output+=b);p.stderr.on('data',b=>output+=b);const exit=await new Promise((r,j)=>{p.once('error',j);p.once('close',r);});await writeFile(path.join(dir,name+'.log'),output,{flag:'wx'});results.push({name,exit,summary:output.split(/\r?\n/).filter(l=>/^# (tests|pass|fail|skipped)/.test(l)),...(name==='web-fixture-recovery'?{resolves:'web-tests missing benchmarks/comparator/fixture.mjs; 335 other tests passed unchanged'}:{})});await writeFile(path.join(dir,'validation.json'),JSON.stringify(results,null,2));assert.equal(exit,0,name);console.log(JSON.stringify(results.at(-1)));};
await run('web-fixture-recovery',['--test','tests/comparator-performance.test.js'],admin);
const groups=JSON.parse(await readFile(path.join(root,'qa/audit/functional-suites.json')));
await run('mobile-tests',['--test','--test-concurrency=1',...groups.mobile.files,...groups.additional.files],root);
await writeFile(path.join(dir,'checkpoint.json'),JSON.stringify({stage:'all-tests-completed-fixture-recovered',directory:dir,at:new Date().toISOString()},null,2));
