import {openQa,token} from './runtime.mjs';
import {readFile,writeFile} from 'node:fs/promises';
let previous;try{previous=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(previous&&previous.database!=='calcquim_activation_test')throw Error('QA only');
const qa=await openQa(previous?{existingSchema:previous.schema,port:Number(new URL(previous.base).port)}:{});
await writeFile(new URL('./state.private.json',import.meta.url),JSON.stringify({base:qa.base,token,schema:qa.schema,database:'calcquim_activation_test'},null,2));
console.log(`NEXO QA: ${qa.base}; calcquim_activation_test/${qa.schema}`);
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>qa.close().then(()=>process.exit(0)));
