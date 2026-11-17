import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const run=JSON.parse(await readFile(new URL('latest.private.json',import.meta.url),'utf8'));
const dir=new URL('review-'+new Date().toISOString().replaceAll(/[:.]/g,'-')+'/',run.directory);await mkdir(dir);
const git=args=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const packageRoot=new URL('../../integration/audit-admin-changes/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',packageRoot),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const f of manifest.files){
 assert.equal(hash(await readFile(new URL(f.path,packageRoot))),f.sha256,f.path);
 const source=f.path==='src/domain/hardwareCreation.mjs'?new URL('../../'+f.path,import.meta.url):new URL('../integrated/admin/'+f.path,import.meta.url);
 assert.equal(hash(await readFile(source)),f.sha256,'QA source diverged: '+f.path);
}
const tracked=git(['diff','--name-only']).trim().split(/\r?\n/).filter(Boolean);
const untracked=git(['ls-files','--others','--exclude-standard']).trim().split(/\r?\n/).filter(p=>!p.includes('.private.')&&['qa/audit/','integration/audit-admin-changes/','tests/','src/domain/'].some(prefix=>p.startsWith(prefix)));
const selected=[...new Set([...tracked,...untracked])].sort();
assert.ok(!selected.some(p=>/\.private\.|\.artifacts\/|node_modules\//.test(p)));
await writeFile(new URL('git-add-selective.txt',import.meta.url),selected.map(p=>JSON.stringify(p)).join('\n')+'\n');
assert.equal(git(['diff','--cached','--name-only']).trim(),'','Unexpected staged files; do not change staging');
const ignored=git(['check-ignore','qa/audit/state.private.json','qa/audit/postgres.private.json','.artifacts/audit/global-latest.log']);assert.equal(ignored.trim().split(/\r?\n/).length,3);
const adminStatus=git(['-c','safe.directory=D:/ReactApps/calcQuim-admin','-C','D:/ReactApps/calcQuim-admin','status','--short']);assert.equal(adminStatus.trim(),'');
git(['diff','--check']);
await writeFile(new URL('git-status.txt',dir),git(['status','--short']),{flag:'wx'});
await writeFile(new URL('diff-stat.txt',dir),git(['diff','--stat']),{flag:'wx'});
await writeFile(new URL('summary.json',dir),JSON.stringify({at:new Date().toISOString(),adminClean:true,stagedFiles:0,packageFiles:manifest.files.length,packageHashesMatch:true,selectiveFiles:selected.length,privateFilesIgnored:true},null,2),{flag:'wx'});
console.log(JSON.stringify({directory:dir.href,packageFiles:manifest.files.length,selectiveFiles:selected.length,adminClean:true,stagedFiles:0}));
