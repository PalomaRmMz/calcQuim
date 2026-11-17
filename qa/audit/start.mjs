import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import pg from '../integrated/admin/server/node_modules/pg/lib/index.js';
import express from '../integrated/admin/server/node_modules/express/index.js';
import {createDatasetService} from '../integrated/admin/server/src/services/dataset.mjs';
import {mobileRouter} from '../integrated/admin/server/src/mobile/router.mjs';
import {dataRouter} from '../integrated/admin/server/src/routes/data.mjs';
const state=JSON.parse(await readFile(new URL('./state.private.json',import.meta.url),'utf8'));
assert.equal(state.database.host,'127.0.0.1');assert.equal(state.database.port,55439);assert.equal(state.database.database,'nexo_audit_test');assert.equal(state.database.user,'nexo_audit_app');assert.match(state.schema,/^calcquim_test_audit_[a-f0-9]{20}$/);
const pool=new pg.Pool(state.database);
const identity=(await pool.query('SELECT current_database() db,current_user role,inet_server_port() port')).rows[0];assert.equal(identity.db,'nexo_audit_test');assert.equal(identity.port,55439);assert.equal(identity.role,'nexo_audit_app');
assert.deepEqual((await pool.query(`SELECT purpose,generation FROM ${state.schema}.dataset_state`)).rows[0],{purpose:'synthetic',generation:state.generation});
const service=createDatasetService(pool,state.schema),app=express();
const principal={id:'master-audit',name:'Auditor QA',permissions:['sales:read','sales:edit','sales:reconcile','hardware:create','inventory:initial','inventory:count']};
app.get('/audit/identity',(_req,res)=>res.json({...identity,schema:state.schema,generation:state.generation,environment:'synthetic'}));
let loseNextSaleResponse=false;
app.post('/audit/fault/lost-response',express.json(),(req,res)=>{
 if(req.get('authorization')!=='Bearer '+state.token)return res.sendStatus(403);
 if(req.body?.generation!==state.generation)return res.sendStatus(409);
 loseNextSaleResponse=true;res.json({armed:true,scope:'next successful mobile sale only'});
});
app.use((req,res,next)=>{
 if(loseNextSaleResponse&&req.method==='POST'&&req.path==='/api/mobile/v1/sales'){
  const json=res.json.bind(res);
  res.json=body=>{if(res.statusCode>=200&&res.statusCode<300){loseNextSaleResponse=false;res.socket.destroy();return res;}return json(body);};
 }
 next();
});
app.use('/api/mobile/v1',mobileRouter(service,{enabled:true,token:state.token,qaPrincipal:principal}));
app.use('/api/v1',express.json(),dataRouter(service,'synthetic'));
app.use((e,_req,res,_next)=>res.status(e.status||500).json({error:{code:e.code||'INTERNAL_ERROR',message:e.message}}));
const server=app.listen(63337,'127.0.0.1',()=>console.log('Auditoría QA aislada: '+state.base));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>pool.end().then(()=>process.exit(0))));
