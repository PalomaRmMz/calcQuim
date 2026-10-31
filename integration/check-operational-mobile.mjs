import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const settings=JSON.parse(await readFile(new URL('../.artifacts/mobile-real-connection.private.json',import.meta.url),'utf8'));
const base=process.argv.includes('--lan')?settings.lanUrl:settings.serverUrl;
assert.ok(base,'Falta configurar la dirección de red.');
const response=await fetch(`${base}/api/mobile/v1/catalog`,{headers:{Authorization:`Bearer ${settings.credential}`},signal:AbortSignal.timeout(12000)});
assert.equal(response.status,200);
const catalog=await response.json();assert.equal(catalog.environment,'operational');
assert.equal(catalog.salesEnabled,true);assert.ok(catalog.data.products.length>0);
const unauthorized=await fetch(`${base}/api/mobile/v1/catalog`,{signal:AbortSignal.timeout(5000)});
assert.equal(unauthorized.status,401);
if(process.argv.includes('--lan')){
  for(const path of ['/api/v1/dataset','/api/v1/products','/api/v1/commands/createSale'])assert.equal((await fetch(`${base}${path}`,{headers:{Host:'localhost'},signal:AbortSignal.timeout(5000)})).status,404);
}
console.log(JSON.stringify({connected:true,serverUrl:base,database:settings.database,products:catalog.data.products.length,categories:catalog.data.categories.length,productLines:catalog.data.productLines.length,priceGroups:catalog.data.priceGroups.length,authenticated:true,salesEnabled:catalog.salesEnabled,adminOverLan:process.argv.includes('--lan')?false:undefined}));
