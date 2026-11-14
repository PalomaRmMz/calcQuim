// One-time, hash-guarded integration of the reviewed stability changes.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,symlink,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const artifact=path.join(root,'.artifacts/integrated');await mkdir(artifact,{recursive:true});
const manifest=JSON.parse(await readFile(path.join(root,'qa/stability/source-changes.json'),'utf8'));
const git=execFileSync('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root,encoding:'utf8'});
await writeFile(path.join(artifact,'git-before.txt'),git,{flag:'wx'});
const integrated=[];
for(const row of manifest.filter(r=>r.copy==='mobile'&&!['app.json','metro.config.js','tests/inventory.test.mjs'].includes(r.path))){
 const source=path.join(root,'qa/stability/mobile',row.path),target=path.join(root,row.path),bytes=await readFile(source);
 assert.equal(hash(bytes),row.qaSha256,'QA source changed: '+row.path);
 let before=null;try{before=await readFile(target);}catch(e){if(e.code!=='ENOENT')throw e;}
 assert.equal(before?hash(before):null,row.baselineSha256,'Review local changes before integrating: '+row.path);
 if(before){const backup=path.join(artifact,'before',row.path);await mkdir(path.dirname(backup),{recursive:true});await writeFile(backup,before,{flag:'wx'});}
 await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes);
 integrated.push({path:row.path,before:row.baselineSha256,integrated:hash(bytes)});
}
await writeFile(path.join(artifact,'mobile-integration.json'),JSON.stringify(integrated,null,2),{flag:'wx'});
// Disposable Admin work tree: never edit the repository serving real sales.
const source=path.join(root,'qa/stability/admin'),target=path.join(root,'qa/integrated/admin');
await cp(source,target,{recursive:true,filter:async p=>!(await lstat(p)).isSymbolicLink()&&!/(?:^|[\\/])(?:node_modules|\.git|\.\w*vite[^\\/]*|dist|build)(?:[\\/]|$)/.test(p)});
await symlink('D:/ReactApps/calcQuim/qa/admin/node_modules',path.join(target,'node_modules'),'junction');
await symlink('D:/ReactApps/calcQuim-admin/server/node_modules',path.join(target,'server/node_modules'),'junction');
for(const name of ['hardwareCreation','commerce','laundryPricing'])await writeFile(path.join(target,'src/domain',name+'.mjs'),`export * from '../../../../../src/domain/${name}.mjs';\n`);
console.log(JSON.stringify({mobileFiles:integrated.length,admin:target,backups:artifact}));
