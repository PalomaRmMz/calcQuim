import {readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
const {directory:dir}=JSON.parse(await readFile('integration/final-release.private.json'));const dest=path.join(dir,'previous-runtime-config');await mkdir(dest);
// Explicitly authorized local recovery backup; never a code, APK, EAS or Git input.
const entries=[['.artifacts/mobile-real-connection.private.json','mobile-real-connection.private.json'],['.artifacts/mobile-operational-activation.private.json','mobile-operational-activation.private.json'],['D:/ReactApps/calcQuim-admin/server/artifacts/operational/activation.private.json','admin-activation.private.json']];const manifest=[];
for(const [source,name]of entries){const bytes=await readFile(source);await writeFile(path.join(dest,name),bytes,{flag:'wx'});manifest.push({source,name,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(path.join(dest,'manifest.private.json'),JSON.stringify(manifest,null,2));console.log('Runtime configuration preserved in authorized private local recovery backup only.');
