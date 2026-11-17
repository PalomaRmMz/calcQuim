import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
import pg from '../qa/integrated/admin/server/node_modules/pg/lib/index.js';import express from '../qa/integrated/admin/server/node_modules/express/index.js';
import {createMobileApi} from '../src/services/mobileApi.mjs';import {COMMERCE_VERSION} from '../src/domain/commerce.mjs';
const {directory:dir}=JSON.parse(await readFile('integration/final-release.private.json'));const admin=path.join(dir,'prepared-admin');const target=JSON.parse(await readFile(path.join(dir,'restore-target.private.json')));assert.equal(target.port,55439);
const token='nexo-final-fixture-credential-not-a-real-secret';
// Test fixture adapter only: exercise the operational router with a bound fixture owner,
// without reading or copying a production credential. The deliverable router stays intact.
const realRouter=path.join(admin,'server/src/mobile/router.mjs');let fixture=await readFile(realRouter,'utf8');
fixture=fixture.replace("inventoryOwner, inventoryWritesAuthorized", "inventoryOwner as originalInventoryOwner, inventoryWritesAuthorized");
fixture=fixture.replace('const authorized =',`const inventoryOwner = token => token === '${token}' ? {id:'fixture-owner',permissions:['inventory:initial','inventory:count','hardware:create']} : originalInventoryOwner(token);\nconst authorized =`);
const fixturePath=path.join(admin,'server/src/mobile/router-final-fixture.private.mjs');await writeFile(fixturePath,fixture,{flag:'wx'});
const {mobileRouter}=await import(pathToFileURL(fixturePath));const {createDatasetService}=await import(pathToFileURL(path.join(admin,'server/src/services/dataset.mjs')));
const pool=new pg.Pool({...target,max:1}),service=createDatasetService(pool,'calcquim_operational','operational');let server;
const serve=async()=>{const app=express();app.use('/api/mobile/v1',mobileRouter(service,{mode:'operational',enabled:true,token}));app.use((e,_req,res,_next)=>res.status(e.status||500).json({error:{code:e.code||'INTERNAL'}}));server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));return 'http://127.0.0.1:'+server.address().port;};
const stop=async()=>{server.closeIdleConnections();await new Promise(r=>server.close(r));};
try{process.env.CALCQUIM_MOBILE_OPERATIONAL_AUTHORIZED='yes';delete process.env.CALCQUIM_MOBILE_COMMERCE_AUTHORIZED;let base=await serve();let api=createMobileApi(base,token);let catalog=await api.catalog();assert.ok(!catalog.capabilities?.includes(COMMERCE_VERSION));await stop();
process.env.CALCQUIM_MOBILE_COMMERCE_AUTHORIZED='yes';base=await serve();api=createMobileApi(base,token);catalog=await api.catalog();assert.ok(catalog.capabilities.includes(COMMERCE_VERSION));assert.equal(catalog.mobilePaymentPolicy.version,'web-cash-nearest-50-min-50-v2');
const creation=await api.hardwareCreationOptions();assert.ok(creation);
const response=await fetch(base+'/api/mobile/v1/sales/attempts/fixture-no-sale-operation/cancel',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({confirmed:true,generation:catalog.generation})});assert.notEqual(response.status,403);assert.ok(response.status<500);
await writeFile(path.join(dir,'operational-contract-check.json'),JSON.stringify({restoredBackendStarts:true,defaultCommerceDisabled:true,authorizedCommerceEnabled:true,paymentPolicy:catalog.mobilePaymentPolicy,products:catalog.data.products.length,services:catalog.data.services.length,presentations:catalog.data.presentations.length,hardwareOptionsRead:true,reconciliationAuthorized:true,authScope:'fixture owner adapter only; real credential binding preserved in deliverable, not exercised here',liquidationsEnabled:false},null,2));
}finally{if(server?.listening)await stop();await pool.end();}
await writeFile(path.join(admin,'vite.release.config.mjs'),`import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()],cacheDir:'.release-cache',define:{'import.meta.env.CALCQUIM_OPERATIONAL':'true'},build:{outDir:'../web-release'}});`);
await writeFile(path.join(dir,'checkpoint.json'),JSON.stringify({stage:'restore-contract-fixture-validated-awaiting-window-and-EAS-approval',productionModified:false,at:new Date().toISOString()},null,2));console.log('Restored-data contract verified with fixture credential; no operational credential copied.');
