import {readFile,writeFile} from 'node:fs/promises';
const old=new URL('../stability/',import.meta.url),here=new URL('./',import.meta.url);
let runtime=await readFile(new URL('runtime.mjs',old),'utf8');
runtime=runtime.replaceAll('nexo-stability','nexo-integrated').replaceAll('calcquim_test_stable_','calcquim_test_integrated_');
runtime=runtime.replace("'sales:read','sales:edit','sales:reconcile'","'sales:read','sales:edit','sales:reconcile','hardware:create','inventory:initial','inventory:count'");
runtime=runtime.replace("if(fresh){await command('addCategory'","if(fresh){await command('configurePackInventory',{approved:true});await command('saveHardwareCategory',{name:'Higiene personal',active:true});await command('configurePurchaseInventory',{acknowledgeHistorical:true});await command('addCategory'");
await writeFile(new URL('runtime.mjs',here),runtime);
for(const name of ['stability.test.mjs','recovery.test.mjs','web-cash.test.mjs']){
 const body=(await readFile(new URL(name,old),'utf8')).replaceAll('./mobile/src/','../../src/');
 await writeFile(new URL(name,here),body);
}
// Existing comprehensive product regression suite, using the integrated backend.
let acceptance=await readFile(new URL('../acceptance.test.mjs',here),'utf8');
acceptance=acceptance.replace("{openQa,token}","{openStability as openQa,token}").replace("'../src/domain/","'../../src/domain/");
acceptance=acceptance.replace("name:'Naturella',variant:'Nocturna S\\u00faper Abundante'","name:'Naturella Nocturna S\\u00faper Abundante'");
// Integrated fixture also includes one cleaning product with its initial inventory.
acceptance=acceptance.replace("{estimate:1,sale:3}","{estimate:2,sale:3}");
await writeFile(new URL('acceptance.test.mjs',here),acceptance);
let regression=await readFile(new URL('../regression.test.mjs',here),'utf8');
regression=regression.replace("{openQa,token}","{openStability as openQa,token}").replace("{openQa}","{openStability as openQa}").replaceAll("'../src/","'../../src/");
await writeFile(new URL('regression.test.mjs',here),regression);
let start=await readFile(new URL('start.mjs',old),'utf8');start=start.replace('port:63317','port:63327');
await writeFile(new URL('start.mjs',here),start);
await writeFile(new URL('admin/vite.integrated.config.mjs',here),`import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({cacheDir:'.integrated-vite-cache',plugins:[react()],define:{'import.meta.env.CALCQUIM_OPERATIONAL':'false'},server:{host:'127.0.0.1',port:5197,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:63327',changeOrigin:true}}}});\n`);
console.log('Integrated tests target principal mobile sources and isolated Admin.');
