// Produce a reviewable patch; never apply it to the running Admin repository.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),work=path.join(root,'qa/integrated/admin'),base='D:/ReactApps/calcQuim-admin';
const previous=JSON.parse(await readFile(new URL('../source-changes.json',import.meta.url),'utf8'));
const stability=JSON.parse(await readFile(new URL('../stability/source-changes.json',import.meta.url),'utf8'));
const selected=new Set([...previous.map(r=>r.path),...stability.filter(r=>r.copy==='admin').map(r=>r.path),
 'src/components/CommercialSaleForm.jsx','src/components/SaleFormModal.jsx','src/styles/components/SaleFormModal.css','src/ApplicationRoot.jsx','src/App.jsx','src/PostgresApplication.jsx','src/pages/DataManagementPage.jsx','tests/postgres-operational.test.js']);
const artifact=path.join(root,'.artifacts/integrated/admin-patch');await mkdir(artifact,{recursive:true});
const shared=['hardwareCreation','commerce','laundryPricing'];
const sha=b=>createHash('sha256').update(b).digest('hex');
let patch='';const manifest=[];
for(const name of [...selected].sort()){
 if(name.startsWith('vite.')||name==='scripts/vite-cache.mjs')continue;
 let before=Buffer.alloc(0);try{before=await readFile(path.join(base,name));}catch(e){if(e.code!=='ENOENT')throw e;}
 let after=await readFile(path.join(work,name));
 const domain=shared.find(d=>name===`src/domain/${d}.mjs`);if(domain)after=await readFile(path.join(root,'src/domain',domain+'.mjs'));
 if(before.equals(after))continue;
 const folder=path.join(artifact,sha(Buffer.from(name)).slice(0,16));await mkdir(folder,{recursive:true});
 const left=path.join(folder,'before'),right=path.join(folder,'after');await writeFile(left,before);await writeFile(right,after);
 let diff;try{diff=execFileSync('git',['diff','--no-index','--no-ext-diff','--text','--',left,right],{encoding:'utf8'});}catch(e){if(e.status!==1)throw e;diff=e.stdout;}
 const lines=diff.replaceAll('\r\n','\n').split('\n');const hunk=lines.findIndex(l=>l.startsWith('@@'));
 if(hunk<0)continue; // Git normalizes line endings; no source change to package.
 patch+=`diff --git a/${name} b/${name}\n${before.length?'':'new file mode 100644\n'}--- ${before.length?'a/'+name:'/dev/null'}\n+++ b/${name}\n`+lines.slice(hunk).join('\n');
 manifest.push({path:name,beforeSha256:before.length?sha(before):null,afterLfSha256:sha(Buffer.from(after.toString('utf8').replaceAll('\r\n','\n')))});
}
const destination=new URL('../../integration/admin-changes/',import.meta.url);await mkdir(destination,{recursive:true});
await writeFile(new URL('nexo-integrated.patch',destination),patch);
await writeFile(new URL('manifest.json',destination),JSON.stringify({base,scope:'Selective source integration; not deployed',files:manifest},null,2));
console.log(JSON.stringify({files:manifest.length,bytes:Buffer.byteLength(patch)}));
