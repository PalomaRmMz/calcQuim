import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const file='D:/ReactApps/calcQuim-admin/server/integration/inventory.test.mjs';let text=readFileSync(file,'utf8');
const before="await migrate(pool,schema,'down');assert.equal((await createDatasetService(pool,schema).inventory()).enabled,false);";
if(!text.includes(before))throw new Error('Prueba cambió; revisar');
text=text.replace(before,"await migrate(pool,schema,'down');assert.equal((await createDatasetService(pool,schema).inventory()).enabled,true);await migrate(pool,schema,'down');assert.equal((await createDatasetService(pool,schema).inventory()).enabled,false);");
mkdirSync('integration/admin/server/integration',{recursive:true});writeFileSync('integration/admin/server/integration/inventory.test.mjs',text);
