import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import pg from './admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
import {migrate} from './admin/server/src/db/migrate.mjs';
import {createDatasetService} from './admin/server/src/services/dataset.mjs';
import {mobileRouter} from './admin/server/src/mobile/router.mjs';
import {createApp} from './admin/server/src/app.mjs';
import {hardwareCreationBundle} from '../src/domain/hardwareCreation.mjs';
export const token='nexo-qa-isolated-token-not-production-20261114';
export async function openQa({existingSchema=null,port=0}={}){
 const config=await loadOperationalConfig('calcquim_activation_test');
 assert.equal(config.database.database,'calcquim_activation_test');assert.equal(config.database.host,'127.0.0.1');
 const pool=new pg.Pool({...config.database,application_name:'nexo-isolated-qa'});
 assert.equal((await pool.query('SELECT current_database() AS db')).rows[0].db,'calcquim_activation_test');
 const schema=existingSchema??'calcquim_test_nexo_'+randomUUID().replaceAll('-','').slice(0,20);
 assert.match(schema,/^calcquim_test_nexo_[a-f0-9]{20}$/);
 if(existingSchema)assert.equal((await pool.query(`SELECT purpose FROM ${schema}.dataset_state WHERE singleton=true`)).rows[0]?.purpose,'synthetic');
 await migrate(pool,schema);
 const service=createDatasetService(pool,schema);
 async function command(name,...args){const s=await service.read();return service.command({name,args,revision:s.revision,generation:s.generation,requestKey:randomUUID()});}
 if(!existingSchema){await command('configurePackInventory',{approved:true});await command('saveHardwareCategory',{name:'Higiene personal',active:true});}
 await command('configurePurchaseInventory',{acknowledgeHistorical:true});
 const principal={id:'nexo-qa',name:'Nexo QA',permissions:['hardware:create','inventory:initial','inventory:count']};
 
 // Install routes before createApp's terminal 404 by using a fresh Express application.
 const {default:express}=await import('./admin/server/node_modules/express/index.js');
 const serverApp=express();
 serverApp.use('/api/mobile/v1',mobileRouter(service,{enabled:true,token,qaPrincipal:principal}));
 const {dataRouter}=await import('./admin/server/src/routes/data.mjs');
 serverApp.use('/api/v1',express.json(),dataRouter(service,'synthetic'));
 serverApp.use((e,_q,r,_n)=>{console.error(e.code||e.message);r.status(e.status||500).json({error:{code:e.code,message:e.message}});});
 const server=serverApp.listen(port,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 return {pool,schema,service,command,base,close:async()=>{server.closeIdleConnections();await new Promise(r=>server.close(r));await pool.end();}};
}

