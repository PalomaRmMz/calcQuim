import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir,cp} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const state=JSON.parse(await readFile(new URL('candidate.private.json',import.meta.url)));
const {directory:dir,admin}=state;
const walk=async d=>{const out=[];for(const e of await readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;};
const results=[];
const save=async stage=>{await writeFile(path.join(dir,'validation.json'),JSON.stringify(results,null,2));await writeFile(path.join(dir,'checkpoint.json'),JSON.stringify({stage,directory:dir,at:new Date().toISOString()},null,2));};
const run=async(name,args,cwd=admin,env=process.env)=>{let output='';const p=spawn(process.execPath,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.on('data',b=>output+=b);p.stderr.on('data',b=>output+=b);const exit=await new Promise((r,j)=>{p.once('error',j);p.once('close',r);});await writeFile(path.join(dir,name+'.log'),output,{flag:'wx'});results.push({name,exit,summary:output.split(/\r?\n/).filter(l=>/^# (tests|pass|fail|skipped)/.test(l))});await save(name);console.log(JSON.stringify(results.at(-1)));assert.equal(exit,0,name+' failed: inspect log');};
// Ensure no approved source outside the three package manifests has been omitted.
const differences=[];
for(const sub of ['src','server/src','server/migrations'])for(const p of await walk(path.join(root,'qa/integrated/admin',sub))){const rel=path.relative(path.join(root,'qa/integrated/admin'),p);let a=await readFile(p,'utf8');if(/^export \* from '\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src\//.test(a))a=await readFile(path.join(root,'src/domain',path.basename(p)),'utf8');try{const b=await readFile(path.join(admin,rel),'utf8');if(a.replaceAll('\r\n','\n')!==b.replaceAll('\r\n','\n'))differences.push(rel);}catch{differences.push(rel);}}
await writeFile(path.join(dir,'source-differences.json'),JSON.stringify(differences));assert.deepEqual(differences,[],'Approved source mismatch');
await save('all-approved-sources-match');
// A mobile source snapshot accompanies this candidate; no credentials, QA config or generated output.
const mobile=path.join(dir,'mobile');await mkdir(mobile);
for(const name of ['src','assets','App.js','index.js','app.json','package.json','package-lock.json','babel.config.js','metro.config.js','tailwind.config.js','global.css'])await cp(path.join(root,name),path.join(mobile,name),{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const mobileFiles=[];for(const p of await walk(mobile))mobileFiles.push({path:path.relative(mobile,p).replaceAll('\\','/'),sha256:hash(await readFile(p))});await writeFile(path.join(dir,'mobile-sources.json'),JSON.stringify(mobileFiles,null,2));
await run('web-build',['node_modules/vite/bin/vite.js','build','--config','vite.candidate.config.mjs']);
const backendFiles=(await walk(path.join(admin,'server/src'))).filter(p=>p.endsWith('.mjs'));
for(const p of backendFiles)execFileSync(process.execPath,['--check',p],{stdio:'pipe'});
results.push({name:'backend-syntax',exit:0,files:backendFiles.length});await save('backend-syntax');
// Reuse the approved integration tests with candidate imports; the fixture credentials stay outside the application.
const tests=path.join(dir,'validation');await mkdir(tests);
const adminUrl=pathToFileURL(admin+'/').href,mobileUrl=pathToFileURL(mobile+'/src/').href;
let runtime=await readFile(path.join(root,'qa/audit/runtime.mjs'),'utf8');runtime=runtime.replaceAll('../integrated/admin/',adminUrl).replaceAll("'./state.private.json'",JSON.stringify(pathToFileURL(path.join(root,'qa/audit/state.private.json')).href));
await writeFile(path.join(tests,'runtime.mjs'),runtime);
const groups=JSON.parse(await readFile(path.join(root,'qa/audit/functional-suites.json')));
const testFiles=[];
for(const f of groups.integration.files){let s=await readFile(path.join(root,f),'utf8');s=s.replaceAll('../integrated/admin/',adminUrl).replaceAll('../../src/',mobileUrl);const dest=path.join(tests,path.basename(f));await writeFile(dest,s);testFiles.push(dest);}
await run('critical-integration',['--test','--test-concurrency=1',...testFiles]);
await run('backend-tests',['--test','--test-concurrency=1',...groups.backend.files],path.join(admin,'server'));
await run('web-tests',['--test','--test-concurrency=1',...groups.web.files],admin);
await run('mobile-tests',['--test','--test-concurrency=1',...groups.mobile.files,...groups.additional.files],root);
await save('validated-except-android-bundle');
console.log('Candidate: '+dir);
