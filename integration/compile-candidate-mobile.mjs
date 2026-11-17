import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const {directory}=JSON.parse(await readFile(new URL('candidate.private.json',import.meta.url)));
const files=JSON.parse(await readFile(path.join(directory,'mobile-sources.json')));
for(const f of files)assert.equal(createHash('sha256').update(await readFile(path.join(root,f.path))).digest('hex'),f.sha256,'Mobile snapshot mismatch '+f.path);
// Compile the entire Android dependency graph with the existing isolated Metro, without APK or service restart.
const response=await fetch('http://127.0.0.1:8107/index.bundle?platform=android&dev=false&minify=true',{signal:AbortSignal.timeout(180000)});
const bundle=await response.text();
await writeFile(path.join(directory,'android-compiled.bundle'),bundle,{flag:'wx'});
assert.equal(response.status,200,bundle.slice(0,300));assert.ok(bundle.length>100000);
await writeFile(path.join(directory,'android-compile.json'),JSON.stringify({status:response.status,bytes:Buffer.byteLength(bundle),sha256:createHash('sha256').update(bundle).digest('hex'),sourceFiles:files.length,sourceSnapshotMatches:true,scope:'Android JavaScript full Metro graph; QA compile context, no APK, no native build, no deployment'},null,2),{flag:'wx'});
console.log(JSON.stringify({status:response.status,bytes:Buffer.byteLength(bundle),sourceSnapshotMatches:true}));
