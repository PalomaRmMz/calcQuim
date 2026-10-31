import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { localLan,mobileLanApp } from './lan-access.mjs';
const root=new URL('file:///D:/ReactApps/calcQuim-admin/');
const {loadOperationalConfig,requireActivation}=await import(new URL('server/src/config/operational.mjs',root));
const {startServer}=await import(new URL('server/src/runtime.mjs',root));
const {createDatabase}=await import(new URL('server/src/db/pool.mjs',root));
const {createDatasetService}=await import(new URL('server/src/services/dataset.mjs',root));
const {mobileRouter}=await import(new URL('server/src/mobile/router.mjs',root));
const require=createRequire(new URL('server/package.json',root));
const express=require('express');
await requireActivation();
const config=await loadOperationalConfig();
if(config.database.database!=='calcquim_operational')throw new Error('La conexión no es operativa.');
const evidence=JSON.parse(await readFile(new URL('../.artifacts/mobile-operational-activation.private.json',import.meta.url),'utf8'));
if(!evidence.applied||!evidence.backupVerified)throw new Error('Migración operativa pendiente de aplicación autorizada.');
const settingsFile=new URL('../.artifacts/mobile-real-connection.private.json',import.meta.url);
let settings;
try{settings=JSON.parse(await readFile(settingsFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(!settings){
  settings={serverUrl:'http://127.0.0.1:3016',credential:randomBytes(32).toString('hex'),database:'calcquim_operational'};
  await mkdir(new URL('../.artifacts/',import.meta.url),{recursive:true});
  await writeFile(settingsFile,JSON.stringify(settings,null,2),{mode:0o600,flag:'wx'});
}
if(settings.serverUrl!=='http://127.0.0.1:3016'||typeof settings.credential!=='string'||settings.credential.length<32)throw new Error('Configuración móvil privada inválida.');
process.env.CALCQUIM_MOBILE_ENABLED='yes';
process.env.CALCQUIM_MOBILE_OPERATIONAL_AUTHORIZED='yes';
process.env.CALCQUIM_MOBILE_TOKEN=settings.credential;
const hostIndex=process.argv.indexOf('--lan-host');
const lan=hostIndex<0?null:localLan(process.argv[hostIndex+1]);
const database=createDatabase(config);
const runtime=await startServer({...config,port:3016},database);
let lanServer;
if(lan){
  try{
    const service=createDatasetService(database.pool,config.schema,'operational');
    const app=mobileLanApp(express,mobileRouter(service,{mode:'operational',token:settings.credential,enabled:true}),lan);
    lanServer=app.listen(3016,lan.host);
    await new Promise((resolve,reject)=>{lanServer.once('listening',resolve);lanServer.once('error',reject);});
    settings.lanUrl=`http://${lan.host}:3016`;settings.lanSubnet=lan.cidr;
    await writeFile(settingsFile,JSON.stringify(settings,null,2),{mode:0o600});
  }catch(error){await runtime.close();throw error;}
}
console.log(`MÓVIL REAL: ${lan?settings.lanUrl:settings.serverUrl} → calcquim_operational. Registro real habilitado.`);
if(lan)console.log(`Wi-Fi: solo ${lan.host}:3016 y clientes de ${lan.cidr}. Las rutas administrativas no se exponen por red.`);
console.log('Credencial privada guardada en .artifacts/mobile-real-connection.private.json (no compartir).');
await new Promise(resolve=>{
  process.once('SIGINT',resolve);process.once('SIGTERM',resolve);
  process.stdin.on('data',data=>{if(String(data).trim()==='stop')resolve();});
});
if(lanServer)await new Promise(resolve=>lanServer.close(resolve));
await runtime.close();
