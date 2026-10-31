// Fixture exclusiva para pruebas manuales. Nunca lee ni escribe calcquim_operational.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = new URL('file:///D:/ReactApps/calcQuim-admin/');
const require = createRequire(new URL('server/package.json', root));
const { Pool } = require('pg');
const { loadOperationalConfig } = await import(new URL('server/src/config/operational.mjs', root));
const { migrate } = await import(new URL('server/src/db/migrate.mjs', root));
const { createDatasetService } = await import(new URL('server/src/services/dataset.mjs', root));
const { createApp } = await import(new URL('server/src/app.mjs', root));
const config = await loadOperationalConfig('calcquim_activation_test');
if (config.database.database !== 'calcquim_activation_test') throw new Error('Solo base de pruebas.');
const pool = new Pool(config.database), schema = `calcquim_test_mobile_${randomUUID().replaceAll('-', '')}`;
let server;
const port=Number(process.env.CALCQUIM_SYNTHETIC_PORT||3015);
if(![3015,3017].includes(port))throw new Error('Puerto de pruebas no permitido.');
async function cleanup() {
  if (server?.listening) await new Promise(resolve => server.close(resolve));
  if (/^calcquim_test_mobile_[a-f0-9]{32}$/.test(schema)) await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
}
try {
  await migrate(pool, schema);
  const service = createDatasetService(pool, schema); let state = await service.read();
  const cmd = async (name, ...args) => state = await service.command({ name, args, revision: state.revision, generation: state.generation, requestKey: randomUUID() });
  await cmd('addCategory', { name: 'Limpieza de prueba', active: true });
  await cmd('addProductLine', { name: 'Carisma de prueba', categoryId: 1, active: true });
  await cmd('addPriceGroup', { name: 'Lavatrastes de prueba', price: 20, active: true });
  for (const name of ['Limón de prueba', 'Lavanda de prueba']) await cmd('addProduct', { name, categoryId: 1, lineId: 1, priceGroupId: 1, price: null, unit: 'litro', active: true, available: true });
  await cmd('addProduct', { name: 'Individual de prueba', categoryId: 1, lineId: 1, price: 25, unit: 'litro', active: true, available: true });
  for (const productId of [1, 2, 3]) await cmd('inventoryEstimate', { productId, quantity: '100', unit: 'litro', reason: 'Inventario exclusivamente sintético' });
  process.env.CALCQUIM_MOBILE_ENABLED = 'yes';
  process.env.CALCQUIM_MOBILE_TOKEN = 'synthetic-local-demo-token-not-production';
  await cmd('addCategory',{name:'Suavizantes de prueba',active:true});
  await cmd('addCategory',{name:'Detergentes de prueba',active:true});
  await cmd('addPriceGroup',{name:'Fabulosos de prueba',price:10,active:true});
  await cmd('addPriceGroup',{name:'Pinol de prueba',price:10,active:true});
  await cmd('addPriceGroup',{name:'Suavizantes estándar de prueba',price:15,active:true});
  await cmd('addPriceGroup',{name:'Detergentes de prueba',price:19,active:true});
  await cmd('addProductLine',{name:'Fabuloso',categoryId:1,active:true});
  await cmd('addProductLine',{name:'Pinol',categoryId:1,active:true});
  for(const [name,lineId,priceGroupId] of [['Brisa',2,2],['Lavanda',2,2],['Limón',2,2],['Verde',3,3],['Blanco',3,3]])await cmd('addProduct',{name,categoryId:1,lineId,priceGroupId,price:null,unit:'litro',active:true,available:true});
  await cmd('addProduct',{name:'Carisma',categoryId:2,priceGroupId:4,price:null,unit:'litro',active:true,available:true});
  await cmd('addProduct',{name:'Carisma',categoryId:3,priceGroupId:5,price:null,unit:'litro',active:true,available:true});
  const express=require('express'),app=express(),commands=[],results=new Map();
  if(port===3017){
    const qa=express.Router();
    qa.use((req,res,next)=>req.get('Authorization')==='Bearer synthetic-local-demo-token-not-production'?next():res.sendStatus(401),express.json({limit:'30mb'}));
    qa.post('/command',(req,res)=>{const id=randomUUID();commands.push({...req.body,id});res.json({id});});
    qa.get('/next',(_req,res)=>res.json(commands.shift()||null));
    qa.post('/result',(req,res)=>{results.set(req.body.id,req.body);res.json({ok:true});});
    qa.get('/result/:id',(req,res)=>res.json(results.get(req.params.id)||{pending:true}));
    qa.post('/artifact',async(req,res)=>{
      const {name,base64}=req.body;
      if(!/^FullClean-[a-zA-Z0-9_-]+\.(png|pdf)$/.test(name)||typeof base64!=='string')return res.sendStatus(400);
      const dir=path.resolve('.artifacts/qa-exports');await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,name),Buffer.from(base64,'base64'));res.json({ok:true});
    });
    app.use('/__qa',qa);
  }
  app.use(createApp({ping:async()=>true},service));
  const listen=()=>server=app.listen(port,'127.0.0.1');
  listen();
  console.log(`Fixture SINTÉTICA: http://127.0.0.1:${port} · credencial de prueba en integration/synthetic-server.mjs`);
  await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); process.stdin.on('data', async data => {
    const action=String(data).trim();
    if(action==='stop')resolve();
    if(action==='offline'&&server?.listening){await new Promise(done=>server.close(done));console.log('Fixture temporalmente desconectada.');}
    if(action==='online'&&!server?.listening){listen();console.log('Fixture reconectada.');}
    if(action==='price'){state=await service.read();const group=state.data.priceGroups.find(g=>g.id===5);await cmd('updatePriceGroup',5,{...group,price:21});console.log('Tarifa sintética de detergentes actualizada.');}
  }); });
} finally { await cleanup(); process.stdin.pause(); }
