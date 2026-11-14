import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const artifact=new URL('../../.artifacts/integrated/',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex');
const logs=[];
for(const name of ['mobile-tests-final.log','integration-tests-final.log','backend-tests.log','web-tests-complete.log']){
 const bytes=await readFile(new URL(name,artifact));const text=bytes[0]===255&&bytes[1]===254?bytes.subarray(2).toString('utf16le'):bytes.toString('utf8');
 const n=label=>Number([...text.matchAll(new RegExp('^# '+label+' (\\d+)','gm'))].at(-1)?.[1]);
 logs.push({name,tests:n('tests'),passed:n('pass'),failed:n('fail'),sha256:sha(bytes)});
}
const sources=execFileSync('git',['diff','--name-only'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const untracked=execFileSync('git',['ls-files','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const selected=[...new Set([...sources,...untracked.filter(p=>/^(src\/|docs\/|integration\/admin-changes\/|qa\/)/.test(p)&&/\.(?:js|jsx|mjs|json|md|patch)$/.test(p)),'qa/integrated/git-add-selective.txt'])].sort();
await writeFile(new URL('git-add-selective.txt',import.meta.url),selected.join('\n')+'\n');
const hashes={};for(const name of selected)hashes[name]=sha(await readFile(new URL('../../'+name,import.meta.url)));
const screenshots=[];for(const name of await readdir(new URL('screenshots/',artifact))){const b=await readFile(new URL('screenshots/'+name,artifact));screenshots.push({name,bytes:b.length,sha256:sha(b)});}
const result={verifiedAt:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),logs,sourceHashes:hashes,screenshots};
await writeFile(new URL('verification-summary.json',artifact),JSON.stringify(result,null,2));
console.log(JSON.stringify({logs,sources:selected.length,screenshots:screenshots.length}));
