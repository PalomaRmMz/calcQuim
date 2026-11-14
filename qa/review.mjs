import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,mkdir,open} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createMetroLoopbackProxy} from '../integration/metro-loopback.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),run=promisify(execFile),children=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir(new URL('../.artifacts/nexo-qa/',import.meta.url),{recursive:true});
async function launch(label,args,cwd=root,extra={}){const log=await open(new URL(`../.artifacts/nexo-qa/${label}.log`,import.meta.url),'a');const child=spawn(process.execPath,args,{cwd,env:{...process.env,...extra},windowsHide:true,stdio:['ignore',log.fd,log.fd]});children.push(child);return child;}
async function responds(url){try{return (await fetch(url,{signal:AbortSignal.timeout(1000)})).ok;}catch{return false;}}
let saved;try{saved=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(saved&&(saved.database!=='calcquim_activation_test'||!/^calcquim_test_nexo_[a-f0-9]{20}$/.test(saved.schema)))throw Error('QA isolation required');
if(!saved||!await responds(saved.base+'/api/v1/dataset')){
 await launch('server',['qa/start.mjs']);
 for(let n=0;n<40;n++){await wait(500);try{saved=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));if(await responds(saved.base+'/api/v1/dataset'))break;}catch{}}
}
const catalog=await (await fetch(saved.base+'/api/mobile/v1/catalog',{headers:{Authorization:'Bearer '+saved.token}})).json();
if(catalog.environment!=='synthetic')throw Error('QA server required');
if(!await responds('http://127.0.0.1:5185'))await launch('web',['node_modules/vite/bin/vite.js','--config','vite.qa.config.mjs','--configLoader','native','--mode','postgres-sandbox'],fileURLToPath(new URL('./admin/',import.meta.url)));
let proxy;
if(!await responds('http://127.0.0.1:8085/status')){
 await launch('metro',['node_modules/expo/bin/cli','start','--localhost','--port','8085'],root,{EXPO_PUBLIC_CALCQUIM_QA:'1',EXPO_PUBLIC_CALCQUIM_API_URL:saved.base,EXPO_PUBLIC_NEXO_QA_TOKEN:saved.token,CALCQUIM_BUILD_VARIANT:'tests',EXPO_OFFLINE:'1',REACT_NATIVE_PACKAGER_HOSTNAME:'127.0.0.1'});
 for(let n=0;n<60;n++){await wait(500);if(await responds('http://[::1]:8085/status'))break;}
 try{proxy=createMetroLoopbackProxy({port:8085});await proxy.start();}catch(e){if(e.code!=='EADDRINUSE')throw e;}
}
const adb='C:/Android/Sdk/platform-tools/adb.exe',devices=(await run(adb,['devices'],{windowsHide:true})).stdout;
const serial=devices.split(/\r?\n/).map(s=>s.match(/^(emulator-\d+)\s+device$/)?.[1]).find(Boolean);
if(!serial)throw Error('No Android emulator is running; QA web remains available.');
const port=String(new URL(saved.base).port);
for(const p of ['8085',port])await run(adb,['-s',serial,'reverse','tcp:'+p,'tcp:'+p],{windowsHide:true});
await run(adb,['-s',serial,'shell','am','start','-a','android.intent.action.VIEW','-d','exp://127.0.0.1:8085'],{windowsHide:true});
console.log('Nexo QA: emulador abierto. Inventario > Agregar producto. Web: http://127.0.0.1:5185/productos-jarceria');
console.log('QA permanece aislado en '+saved.database+'/'+saved.schema+'. Ctrl+C detiene los procesos iniciados por este comando.');
async function close(){for(const c of children)c.kill();await proxy?.close();process.exit(0);}
process.once('SIGINT',close);process.once('SIGTERM',close);
if(!children.length&&!proxy)process.exit(0);
