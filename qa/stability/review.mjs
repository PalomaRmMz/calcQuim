import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';import {readFile,mkdir,open} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {createMetroLoopbackProxy} from '../../integration/metro-loopback.mjs';
const run=promisify(execFile),root=fileURLToPath(new URL('../../',import.meta.url)),children=[];const wait=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir(new URL('../../.artifacts/stability/',import.meta.url),{recursive:true});
async function launch(name,args,cwd=root,env={}){const f=await open(new URL(`../../.artifacts/stability/${name}.log`,import.meta.url),'a');const p=spawn(process.execPath,args,{cwd,env:{...process.env,...env},windowsHide:true,stdio:['ignore',f.fd,f.fd]});children.push(p);}
async function responds(url){try{return (await fetch(url,{signal:AbortSignal.timeout(800)})).ok;}catch{return false;}}
if(!await responds('http://127.0.0.1:63317/api/v1/dataset')){await launch('backend',['qa/stability/start.mjs']);for(let n=0;n<40;n++){await wait(500);if(await responds('http://127.0.0.1:63317/api/v1/dataset'))break;}}
const state=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));if(state.database!=='calcquim_activation_test'||state.base!=='http://127.0.0.1:63317'||!/^calcquim_test_stable_[a-f0-9]{20}$/.test(state.schema))throw Error('QA isolation required');
const catalog=await (await fetch(state.base+'/api/mobile/v1/catalog',{headers:{Authorization:'Bearer '+state.token}})).json();if(catalog.environment!=='synthetic')throw Error('Synthetic QA required');
if(!await responds('http://127.0.0.1:5187'))await launch('web',['node_modules/vite/bin/vite.js','--config','vite.stability.config.mjs','--configLoader','native','--mode','postgres-sandbox'],fileURLToPath(new URL('./admin/',import.meta.url)));
let proxy;
if(!await responds('http://127.0.0.1:8087/status')){await launch('metro',['node_modules/expo/bin/cli','start','--localhost','--port','8087'],fileURLToPath(new URL('./mobile/',import.meta.url)),{EXPO_PUBLIC_CALCQUIM_QA:'1',EXPO_PUBLIC_CALCQUIM_API_URL:state.base,EXPO_PUBLIC_NEXO_QA_TOKEN:state.token,EXPO_OFFLINE:'1',REACT_NATIVE_PACKAGER_HOSTNAME:'127.0.0.1'});for(let n=0;n<60;n++){await wait(500);if(await responds('http://[::1]:8087/status'))break;}try{proxy=createMetroLoopbackProxy({port:8087});await proxy.start();}catch(e){if(e.code!=='EADDRINUSE')throw e;}}
const adb='C:/Android/Sdk/platform-tools/adb.exe',devices=(await run(adb,['devices'],{windowsHide:true})).stdout,serial=devices.split(/\r?\n/).map(s=>s.match(/^(emulator-\d+)\s+device$/)?.[1]).find(Boolean);if(!serial)throw Error('Inicia un emulador Android; no se selecciona ningun telefono fisico.');
for(const port of ['63317','8087'])await run(adb,['-s',serial,'reverse','tcp:'+port,'tcp:'+port],{windowsHide:true});await run(adb,['-s',serial,'shell','am','start','-a','android.intent.action.VIEW','-d','exp://127.0.0.1:8087'],{windowsHide:true});
console.log('Nexo QA Estabilidad abierto. Backend 63317; web http://127.0.0.1:5187/ventas. Ningun servicio operativo se detuvo.');
console.log('Mantener este comando abierto si inicio procesos. Ctrl+C detiene solamente sus procesos hijos.');
async function close(){for(const p of children)p.kill();await proxy?.close();process.exit(0);}process.once('SIGINT',close);process.once('SIGTERM',close);if(!children.length&&!proxy)process.exit(0);
