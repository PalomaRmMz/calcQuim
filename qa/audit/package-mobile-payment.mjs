import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dest=new URL('../../integration/audit-admin-changes/',import.meta.url),src=new URL('../integrated/admin/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(new URL('manifest.json',dest),'utf8'));
for(const f of manifest.files){assert.equal(hash(await readFile(new URL(f.path,dest))),f.sha256);}
const paths=['server/src/mobile/router.mjs','server/src/services/dataset.mjs','server/src/services/webPayment.mjs','server/src/services/commands.mjs','server/migrations/014_mobile_payment_policy.up.sql','server/migrations/014_mobile_payment_policy.down.sql'];
assert.ok(paths.every(p=>!manifest.files.some(f=>f.path===p)),'Already packaged; review before replacing');
const run=JSON.parse(await readFile(new URL('latest.private.json',import.meta.url),'utf8'));
await writeFile(new URL('admin-manifest-before-mobile-payment.json',run.directory),JSON.stringify(manifest,null,2),{flag:'wx'});
for(const path of paths){const bytes=await readFile(new URL(path,src));await mkdir(new URL('./',new URL(path,dest)),{recursive:true});await writeFile(new URL(path,dest),bytes,{flag:'wx'});manifest.files.push({path,sha256:hash(bytes),size:bytes.length});}
await writeFile(new URL('manifest.json',dest),JSON.stringify(manifest,null,2));
console.log('Packaged '+manifest.files.length+' verified Admin files; no operational changes');
