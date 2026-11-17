import assert from 'node:assert/strict';
import {cp,mkdir,readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const base='D:/ReactApps/calcQuim-admin';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
assert.equal(git(['-c','safe.directory='+base,'-C',base,'status','--short']).trim(),'','Operational sources changed');
const id=new Date().toISOString().replaceAll(/[:.]/g,'-');
const relative='.artifacts/nexo-candidate-'+id;
const dir=path.join(root,relative),admin=path.join(dir,'admin');
await mkdir(admin,{recursive:true});
const checkpoint=async stage=>writeFile(path.join(dir,'checkpoint.json'),JSON.stringify({stage,directory:dir,at:new Date().toISOString()},null,2));
await checkpoint('copying-clean-base');
const first=JSON.parse(await readFile(path.join(root,'integration/admin-changes/manifest.json')));
for(const f of first.files)if(f.beforeSha256)assert.equal(sha(await readFile(path.join(base,f.path))),f.beforeSha256,'Incompatible base: '+f.path);
const exclude=/(?:^|[\\/])(?:node_modules|artifacts|\.git|backups|dist|coverage|\.cache)(?:[\\/]|$)|\.private\.|[\\/]\.env|\.log$|\.dump$|\.backup$/;
for(const name of ['src','public','tests','benchmarks','server','scripts','package.json','package-lock.json','index.html','vite.config.js','vite.postgres.config.js']){
 await cp(path.join(base,name),path.join(admin,name),{recursive:true,filter:async p=>!exclude.test(p)&&!(await lstat(p)).isSymbolicLink()});
}
git(['apply','--check','--directory='+relative+'/admin','integration/admin-changes/nexo-integrated.patch']);
git(['apply','--directory='+relative+'/admin','integration/admin-changes/nexo-integrated.patch']);
for(const f of first.files)assert.equal(sha((await readFile(path.join(admin,f.path),'utf8')).replaceAll('\r\n','\n')),f.afterLfSha256,f.path);
const applied=first.files.map(f=>({path:f.path,package:'admin-changes'}));
for(const pkg of ['audit-admin-changes','functional-admin-changes']){
 const manifest=JSON.parse(await readFile(path.join(root,'integration',pkg,'manifest.json')));
 for(const f of manifest.files){const bytes=await readFile(path.join(root,'integration',pkg,f.path));assert.equal(sha(bytes),f.sha256);await mkdir(path.dirname(path.join(admin,f.path)),{recursive:true});await writeFile(path.join(admin,f.path),bytes);applied.push({path:f.path,package:pkg});}
}
// Compare every final package path with the validated source; QA-only reexports are replaced by full engines.
for(const p of new Set(applied.map(f=>f.path))){
 const source=['src/domain/commerce.mjs','src/domain/laundryPricing.mjs','src/domain/hardwareCreation.mjs','src/domain/settlementLedger.mjs'].includes(p)?path.join(root,p):path.join(root,'qa/integrated/admin',p);
 assert.equal((await readFile(path.join(admin,p),'utf8')).replaceAll('\r\n','\n'),(await readFile(source,'utf8')).replaceAll('\r\n','\n'),'Final source differs from validated QA: '+p);
}
await checkpoint('sources-integrated-and-compared');
const walk=async d=>{const out=[];for(const e of await readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;};
const files=[...await walk(path.join(admin,'src')),...await walk(path.join(admin,'server/src'))];
for(const p of files){const s=await readFile(p,'utf8');assert.ok(!/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src|qa\/integrated|qa\/audit|63337|55439|nexo-master-audit|nexo_audit_test/.test(s),'Audit leak: '+p);}
const inventory=[];for(const p of await walk(admin))inventory.push({path:path.relative(admin,p).replaceAll('\\','/'),sha256:sha(await readFile(p))});
await writeFile(path.join(dir,'sources.json'),JSON.stringify({applied,files:inventory},null,2));
await checkpoint('copying-independent-dependencies');
await cp(path.join(root,'qa/integrated/admin/node_modules'),path.join(admin,'node_modules'),{recursive:true,dereference:true});
await cp(path.join(root,'qa/integrated/admin/server/node_modules'),path.join(admin,'server/node_modules'),{recursive:true,dereference:true});
await writeFile(path.join(admin,'vite.candidate.config.mjs'),`import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],cacheDir:'.candidate-cache',define:{'import.meta.env.CALCQUIM_OPERATIONAL':'false'},build:{outDir:'../web-build'}});
`);
await writeFile(path.join(root,'integration/candidate.private.json'),JSON.stringify({directory:dir,admin,relative},null,2));
await checkpoint('candidate-ready-for-validation');
console.log(JSON.stringify({directory:dir,applications:applied.length,uniqueChangedFiles:new Set(applied.map(f=>f.path)).size,sourceFiles:inventory.length,standaloneDependencies:true}));
