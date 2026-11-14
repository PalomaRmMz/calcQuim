import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {writeFile} from 'node:fs/promises';
import pg from './admin/server/node_modules/pg/lib/index.js';
import {loadOperationalConfig} from 'file:///D:/ReactApps/calcQuim-admin/server/src/config/operational.mjs';
import {migrate} from './admin/server/src/db/migrate.mjs';
import {createDatasetService} from './admin/server/src/services/dataset.mjs';
import {mobileRouter} from './admin/server/src/mobile/router.mjs';
import {dataRouter} from './admin/server/src/routes/data.mjs';
import express from './admin/server/node_modules/express/index.js';
export const token='nexo-stability-isolated-qa-token-20261114';
export async function openStability({schema=null,port=0}={}){
 const config=await loadOperationalConfig('calcquim_activation_test');assert.equal(config.database.database,'calcquim_activation_test');assert.equal(config.database.host,'127.0.0.1');
 const pool=new pg.Pool({...config.database,application_name:'nexo-stability-qa'});assert.equal((await pool.query('SELECT current_database() AS db')).rows[0].db,'calcquim_activation_test');
 const fresh=!schema;schema??='calcquim_test_stable_'+randomUUID().replaceAll('-','').slice(0,20);assert.match(schema,/^calcquim_test_stable_[a-f0-9]{20}$/);
 if(!fresh)assert.equal((await pool.query(`SELECT purpose FROM ${schema}.dataset_state WHERE singleton=true`)).rows[0]?.purpose,'synthetic');
 await migrate(pool,schema);const service=createDatasetService(pool,schema);
 async function command(name,...args){const s=await service.read();return service.command({name,args,revision:s.revision,generation:s.generation,requestKey:randomUUID()});}
 if(fresh){await command('addCategory',{name:'Limpieza QA estabilidad',active:true,useAsProductPrefix:false});await command('addProductLine',{name:'Limpieza QA',categoryId:1,active:true});await command('addProduct',{name:'Limpiador QA estabilidad',unit:'litro',price:10,categoryId:1,lineId:1,active:true,available:true});await command('inventoryInitial',{productId:1,quantity:'100',unit:'litro'});}
 const principal={id:'qa-stability',name:'Operador QA estabilidad',permissions:['sales:read','sales:edit','sales:reconcile']};
 const app=express();let fault=null;const probes=[];
 app.use((req,res,next)=>{probes.push({method:req.method,path:req.path});if(fault==='unavailable')return res.status(503).json({error:{code:'QA_UNAVAILABLE',message:'Backend QA temporalmente no disponible.'}});if(fault==='lost-response'&&req.method==='POST'&&req.path==='/api/mobile/v1/sales'){fault=null;res.json=()=>{res.socket.destroy();return res;};}next();});
 app.use('/api/mobile/v1',mobileRouter(service,{enabled:true,token,qaPrincipal:principal}));app.use('/api/v1',express.json(),dataRouter(service,'synthetic'));
 app.use((e,_req,res,_next)=>res.status(e.status||500).json({error:{code:e.code||'INTERNAL_ERROR',message:e.message}}));
 let server;
 async function listen(nextPort=port){server=app.listen(nextPort,'127.0.0.1');await new Promise((r,j)=>{server.once('listening',r);server.once('error',j);});return server.address().port;}
 const used=await listen();return {pool,schema,service,command,base:'http://127.0.0.1:'+used,probes,setFault:v=>{fault=v;},stop:async()=>{server.closeIdleConnections();await new Promise(r=>server.close(r));},start:()=>listen(used),close:async()=>{if(server.listening){server.closeIdleConnections();await new Promise(r=>server.close(r));}await pool.end();}};
}
