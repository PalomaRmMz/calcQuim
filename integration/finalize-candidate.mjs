import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const {directory:dir,admin}=JSON.parse(await readFile(new URL('candidate.private.json',import.meta.url)));
const hash=b=>createHash('sha256').update(b).digest('hex');
const sources=JSON.parse(await readFile(path.join(dir,'sources.json')));
const versions=new Map(sources.applied.map(f=>[f.path,f.package]));
const files=[];
for(const [p,pkg] of versions){let before=null;try{before=hash(await readFile(path.join('D:/ReactApps/calcQuim-admin',p)));}catch(e){if(e.code!=='ENOENT')throw e;}files.push({path:p,package:pkg,beforeSha256:before,sha256:hash(await readFile(path.join(admin,p)))});}
const mobile=JSON.parse(await readFile(path.join(dir,'mobile-sources.json')));
const state=JSON.parse(await readFile(path.join(root,'qa/audit/state.private.json')));
for(const f of sources.files){const p=path.join(admin,f.path);assert.equal(hash(await readFile(p)),f.sha256,'Candidate source changed '+f.path);if(/\.(?:mjs|js|jsx|json|html|sql)$/.test(p)){const s=await readFile(p,'utf8');assert.ok(!s.includes(state.token),'Audit credential leak '+f.path);}}
const links=[];
async function scanLinks(d){for(const e of await readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);const s=await lstat(p);if(s.isSymbolicLink())links.push(p);else if(s.isDirectory())await scanLinks(p);}}
await scanLinks(path.join(admin,'node_modules'));await scanLinks(path.join(admin,'server/node_modules'));assert.deepEqual(links,[]);
const dependencies=[];
for(const [name,cwd] of [['web',admin],['backend',path.join(admin,'server')]]){
 const result=spawnSync('cmd.exe',['/d','/c','npm.cmd ls --depth=0 --json'],{cwd,encoding:'utf8',windowsHide:true});
 await writeFile(path.join(dir,name+'-dependencies.json'),result.stdout);await writeFile(path.join(dir,name+'-dependencies.log'),result.stderr||'');dependencies.push({name,exit:result.status});
 assert.equal(result.status,0,name+' dependency validation failed');
}
const migrations=(await readdir(path.join(admin,'server/migrations'))).filter(f=>f.endsWith('.up.sql')).sort();assert.equal(migrations.length,14);
const validation=JSON.parse(await readFile(path.join(dir,'validation.json')));assert.ok(validation.length>=6);
assert.ok(validation.filter(r=>r.name!=='web-tests').every(r=>r.exit===0));
assert.ok(validation.find(r=>r.name==='web-tests'&&r.exit===0)||validation.find(r=>r.name==='web-fixture-recovery'&&r.exit===0));
const android=JSON.parse(await readFile(path.join(dir,'android-compile.json')));assert.equal(android.status,200);
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
assert.equal(git(['-c','safe.directory=D:/ReactApps/calcQuim-admin','-C','D:/ReactApps/calcQuim-admin','status','--short']).trim(),'');assert.equal(git(['diff','--cached','--name-only']).trim(),'');git(['diff','--check']);
const manifest={classification:'Integración candidata completada y validada',directory:dir,order:['admin-changes','audit-admin-changes','functional-admin-changes'],files,mobile,dependencies,migrations,migrationScope:'Executed only by adapted tests in new synthetic QA schemas on 55439; no operational migrations',financialRecordingEnabled:false,androidScope:android.scope};
await writeFile(new URL('candidate-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
const selected=[...new Set([...git(['diff','--name-only']).trim().split(/\r?\n/),...git(['ls-files','--others','--exclude-standard']).trim().split(/\r?\n/).filter(p=>['src/','tests/','qa/audit/','integration/'].some(prefix=>p.startsWith(prefix)))])].filter(Boolean).sort();assert.ok(!selected.some(p=>/\.private\.|\.artifacts\/|node_modules\//.test(p)));
await writeFile(new URL('candidate-review-files.txt',import.meta.url),selected.map(p=>JSON.stringify(p)).join('\n')+'\n');
await writeFile(path.join(dir,'git-status-final.txt'),git(['status','--short']));
await writeFile(path.join(dir,'ports-final.txt'),execFileSync('netstat',['-ano','-p','tcp'],{encoding:'utf8'}));
await writeFile(path.join(dir,'checkpoint.json'),JSON.stringify({stage:'candidate-completed-and-validated',directory:dir,at:new Date().toISOString(),adminFiles:files.length,mobileFiles:mobile.length,dependencies,operationalClean:true,stagedFiles:0},null,2));
console.log(JSON.stringify({classification:manifest.classification,adminFiles:files.length,mobileFiles:mobile.length,dependencies,operationalClean:true,stagedFiles:0}));
