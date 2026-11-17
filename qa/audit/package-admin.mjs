import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const destination=new URL('../../integration/audit-admin-changes/',import.meta.url);
await mkdir(destination,{recursive:true});
const files=['src/components/HardwarePurchases.jsx','src/components/CommercialSaleForm.jsx','src/components/LaundrySaleFields.jsx','src/domain/purchasePresentationLabel.mjs','src/domain/reportPayment.mjs','src/domain/operationsReport.mjs','src/domain/hardwareCreation.mjs'];
const manifest=[];
for(const path of files){
 const source=path==='src/domain/hardwareCreation.mjs'?new URL('../../'+path,import.meta.url):new URL('../integrated/admin/'+path,import.meta.url);
 const bytes=await readFile(source),target=new URL(path,destination);
 await mkdir(new URL('./',target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});
 manifest.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length});
}
await writeFile(new URL('manifest.json',destination),JSON.stringify({purpose:'QA corrections for review; no deployment or operational repository modification',files:manifest},null,2),{flag:'wx'});
const tracked=execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split(/\r?\n/);
const added=execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>!p.includes('.private.')&&(p.startsWith('qa/audit/')||p.startsWith('integration/audit-admin-changes/')||p.startsWith('tests/')||p.startsWith('src/domain/')));
await writeFile(new URL('./git-add-selective.txt',import.meta.url),[...new Set([...tracked,...added])].sort().map(p=>JSON.stringify(p)).join('\n')+'\n',{flag:'wx'});
console.log(JSON.stringify({files:manifest.length,versionableDestination:'integration/audit-admin-changes',selectiveList:'qa/audit/git-add-selective.txt'}));
