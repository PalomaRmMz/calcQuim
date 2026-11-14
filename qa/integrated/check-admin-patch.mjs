import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),relative='.artifacts/integrated/patch-check-'+Date.now(),target=path.join(root,relative);
await mkdir(target,{recursive:false});
const manifest=JSON.parse(await readFile(new URL('../../integration/admin-changes/manifest.json',import.meta.url),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const row of manifest.files){if(!row.beforeSha256)continue;const bytes=await readFile(path.join(manifest.base,row.path));assert.equal(sha(bytes),row.beforeSha256);const destination=path.join(target,row.path);await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,bytes,{flag:'wx'});}
const args=['apply','--directory='+relative,'integration/admin-changes/nexo-integrated.patch'];
execFileSync('git',[args[0],'--check',...args.slice(1)],{cwd:root,stdio:'pipe'});
execFileSync('git',args,{cwd:root,stdio:'pipe'});
for(const row of manifest.files)assert.equal(sha(Buffer.from((await readFile(path.join(target,row.path),'utf8')).replaceAll('\r\n','\n'))),row.afterLfSha256,row.path);
await writeFile(new URL('../../.artifacts/integrated/patch-check.json',import.meta.url),JSON.stringify({verifiedAt:new Date().toISOString(),files:manifest.files.length,appliedOnlyTo:target,allHashesMatch:true},null,2));
console.log(`Patch applies cleanly to ${manifest.files.length} isolated files; hashes match.`);
