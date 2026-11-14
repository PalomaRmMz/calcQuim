import {openStability,token} from './runtime.mjs';import {readFile,writeFile} from 'node:fs/promises';
let previous;try{previous=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const qa=await openStability({schema:previous?.schema,port:63327});await writeFile(new URL('./state.private.json',import.meta.url),JSON.stringify({database:'calcquim_activation_test',schema:qa.schema,base:qa.base,token},null,2));
console.log(`Estabilidad QA: ${qa.base}; calcquim_activation_test/${qa.schema}`);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>qa.close().then(()=>process.exit(0)));
