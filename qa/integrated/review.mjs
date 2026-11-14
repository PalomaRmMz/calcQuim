import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,mkdir,open} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createMetroLoopbackProxy} from '../../integration/metro-loopback.mjs';
const run=promisify(execFile),root=fileURLToPath(new URL('../../',import.meta.url)),children=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir(new URL('../../.artifacts/integrated/',import.meta.url),{recursive:true});
async function launch(name,args,cwd=root,env={}){const f=await open(new URL(`../../.artifacts/integrated/${name}.log`,import.meta.url),'a');const p=spawn(process.execPath,args,{cwd,env:{...process.env,...env},windowsHide:true,stdio:['ignore',f.fd,f.fd]});children.push(p);}
async function responds(url){try{return(await fetch(url,{signal:AbortSignal.timeout(800)})).ok;}catch{return false;}}
if(!await responds('http://127.0.0.1:63327/api/v1/dataset')){await launch('backend',['qa/integrated/start.mjs']);for(let n=0;n<40;n++){await wait(500);if(await responds('http://127.0.0.1:63327/api/v1/dataset'))break;}}
const state=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));
if(state.database!=='calcquim_activation_test'||state.base!=='http://127.0.0.1:63327'||!/^calcquim_test_integrated_[a-f0-9]{20}$/.test(state.schema))throw Error('Se requiere aislamiento QA.');
const catalog=await(await fetch(state.base+'/api/mobile/v1/catalog',{headers:{Authorization:'Bearer '+state.token}})).json();if(catalog.environment!=='synthetic')throw Error('Se requiere catálogo sintético.');
if(!await responds('http://127.0.0.1:5197'))await launch('web',['node_modules/vite/bin/vite.js','--config','vite.integrated.config.mjs','--configLoader','native','--mode','postgres-sandbox'],fileURLToPath(new URL('./admin/',import.meta.url)));
let proxy;
if(!await responds('http://127.0.0.1:8097/status')){
 if(!await responds('http://[::1]:8097/status')){await launch('metro',['node_modules/expo/bin/cli','start','--localhost','--port','8097'],root,{EXPO_PUBLIC_CALCQUIM_QA:'1',EXPO_PUBLIC_CALCQUIM_API_URL:state.base,EXPO_PUBLIC_NEXO_QA_TOKEN:state.token,EXPO_OFFLINE:'1',REACT_NATIVE_PACKAGER_HOSTNAME:'127.0.0.1'});for(let n=0;n<60;n++){await wait(500);if(await responds('http://[::1]:8097/status'))break;}}
 try{proxy=createMetroLoopbackProxy({port:8097});await proxy.start();}catch(e){if(e.code!=='EADDRINUSE')throw e;}
}
const adb='C:/Android/Sdk/platform-tools/adb.exe';const devices=(await run(adb,['devices'],{windowsHide:true})).stdout;
const serial=devices.split(/\r?\n/).map(s=>s.match(/^(emulator-\d+)\s+device$/)?.[1]).find(Boolean);if(!serial)throw Error('Inicia un emulador Android. No se seleccionan teléfonos físicos.');
for(const port of ['63327','8097'])await run(adb,['-s',serial,'reverse','tcp:'+port,'tcp:'+port],{windowsHide:true});
await run(adb,['-s',serial,'shell','am','start','-a','android.intent.action.VIEW','-d','exp://127.0.0.1:8097'],{windowsHide:true});
console.log('Nexo integrado: emulador 8097; web http://127.0.0.1:5197/ventas; API QA 63327.');
async function close(){for(const p of children)p.kill();await proxy?.close();process.exit(0);}process.once('SIGINT',close);process.once('SIGTERM',close);
if(!children.length&&!proxy)process.exit(0);else console.log('Mantén esta consola abierta; Ctrl+C detiene solo sus procesos hijos.');
