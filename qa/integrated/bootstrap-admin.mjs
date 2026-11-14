// Rebuild disposable QA from the local Admin sources plus the selective patch.
import {cp,mkdir,readFile,writeFile,lstat,symlink,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),work=path.join(root,'qa/integrated/admin');
try{await access(work);console.log('Admin QA ya existe; no se sobrescribe.');process.exit(0);}catch(e){if(e.code!=='ENOENT')throw e;}
const manifest=JSON.parse(await readFile(new URL('../../integration/admin-changes/manifest.json',import.meta.url),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const row of manifest.files){if(row.beforeSha256&&sha(await readFile(path.join(manifest.base,row.path)))!==row.beforeSha256)throw Error('Admin cambió: revisar el parche antes de continuar: '+row.path);}
await mkdir(work,{recursive:false});
for(const name of ['src','public','tests','server','package.json','index.html','scripts','vite.config.js','vite.postgres.config.js']){
 await cp(path.join(manifest.base,name),path.join(work,name),{recursive:true,filter:async p=>!(await lstat(p)).isSymbolicLink()&&!/(?:^|[\\/])(?:node_modules|artifacts|\.git|backups|dist|coverage)(?:[\\/]|$)/.test(p)&&!/(?:\.private\.|[\\/]\.env|\.log$|\.dump$|\.backup$)/.test(p)});
}
execFileSync('git',['apply','--check','--directory=qa/integrated/admin','integration/admin-changes/nexo-integrated.patch'],{cwd:root,stdio:'inherit'});
execFileSync('git',['apply','--directory=qa/integrated/admin','integration/admin-changes/nexo-integrated.patch'],{cwd:root,stdio:'inherit'});
await symlink(path.join(root,'qa/admin/node_modules'),path.join(work,'node_modules'),'junction');
await symlink('D:/ReactApps/calcQuim-admin/server/node_modules',path.join(work,'server/node_modules'),'junction');
await writeFile(path.join(work,'vite.integrated.config.mjs'),`import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({cacheDir:'.integrated-vite-cache',plugins:[react()],define:{'import.meta.env.CALCQUIM_OPERATIONAL':'false'},server:{host:'127.0.0.1',port:5197,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:63327',changeOrigin:true}}}});\n`);
console.log('Admin integrado únicamente en QA. Dependencias locales compartidas en lectura; caché Vite dentro de QA.');
