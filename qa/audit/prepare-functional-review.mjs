import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const phase=JSON.parse(await readFile(new URL('functional-state.private.json',import.meta.url),'utf8'));
const directory=new URL('review-'+new Date().toISOString().replaceAll(/[:.]/g,'-')+'/',phase.directory);await mkdir(directory);
const root=new URL('../../',import.meta.url),pkg=new URL('integration/functional-admin-changes/',root);
const git=args=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(new URL('manifest.json',pkg),'utf8'));
for(const f of manifest.files){assert.equal(hash(await readFile(new URL(f.path,pkg))),f.sha256,f.path);assert.equal(hash(await readFile(new URL(f.source,root))),f.sha256,f.source);}
// The earlier immutable package remains valid against its own manifest, not newer sources.
const earlier=new URL('integration/audit-admin-changes/',root);
const prior=JSON.parse(await readFile(new URL('manifest.json',earlier),'utf8'));
for(const f of prior.files)assert.equal(hash(await readFile(new URL(f.path,earlier))),f.sha256,f.path);
assert.equal(git(['diff','--cached','--name-only']).trim(),'','Unexpected staging');
const adminStatus=git(['-c','safe.directory=D:/ReactApps/calcQuim-admin','-C','D:/ReactApps/calcQuim-admin','status','--short']);assert.equal(adminStatus.trim(),'');
git(['diff','--check']);
const tracked=git(['diff','--name-only']).trim().split(/\r?\n/).filter(Boolean);
const untracked=git(['ls-files','--others','--exclude-standard']).trim().split(/\r?\n/).filter(p=>['qa/audit/','integration/','tests/','src/'].some(prefix=>p.startsWith(prefix)));
const selected=[...new Set([...tracked,...untracked])].sort();
assert.ok(!selected.some(p=>/\.private\.|\.artifacts\/|node_modules\/|qa\/integrated\/admin\//.test(p)));
const sensitive=['qa/audit/state.private.json','qa/audit/functional-state.private.json','qa/audit/postgres.private.json','.artifacts/audit/global-latest.log','qa/integrated/admin/src/pages/LaundryPage.jsx'];
assert.equal(git(['check-ignore',...sensitive]).trim().split(/\r?\n/).length,sensitive.length);
await writeFile(new URL('git-add-selective.txt',import.meta.url),selected.map(p=>JSON.stringify(p)).join('\n')+'\n');
await writeFile(new URL('git-status.txt',directory),git(['status','--short']),{flag:'wx'});
await writeFile(new URL('diff-stat.txt',directory),git(['diff','--stat']),{flag:'wx'});
const result={directory:directory.href,functionalPackageFiles:manifest.files.length,priorPackageFiles:prior.files.length,hashesMatch:true,adminOperationalClean:true,stagedFiles:0,privateFilesIgnored:true,selectiveFiles:selected.length};
await writeFile(new URL('summary.json',directory),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
