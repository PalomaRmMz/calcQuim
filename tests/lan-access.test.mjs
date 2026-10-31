import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {allowedPeer,localLan,mobileLanApp} from '../integration/lan-access.mjs';
const require=createRequire(new URL('file:///D:/ReactApps/calcQuim-admin/server/package.json'));
const express=require('express');
test('LAN requiere la IP privada local y la subred autorizadas',()=>{
  const interfaces={wifi:[{address:'192.168.1.64',family:'IPv4',internal:false}]};
  assert.equal(localLan('192.168.1.64',interfaces).cidr,'192.168.1.0/24');
  for(const ip of ['0.0.0.0','8.8.8.8','192.168.2.1'])assert.throws(()=>localLan(ip,interfaces));
  assert.throws(()=>localLan('192.168.1.64',{}));
  assert.equal(allowedPeer('::ffff:192.168.1.50'),true);
  for(const ip of ['192.168.2.50','10.1.1.1','8.8.8.8'])assert.equal(allowedPeer(ip),false);
});
test('la API LAN no expone administración aunque se falsifique Host',async()=>{
  const router=express.Router();router.use((req,res)=>req.get('Authorization')==='Bearer test-token'?res.json({ok:true}):res.status(401).json({error:{code:'MOBILE_AUTH_REQUIRED'}}));
  const server=mobileLanApp(express,router).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await fetch(base+'/health')).status,200);
    assert.equal((await fetch(base+'/api/mobile/v1/catalog')).status,401);
    assert.equal((await fetch(base+'/api/mobile/v1/catalog',{headers:{Authorization:'Bearer test-token'}})).status,200);
    for(const path of ['/api/v1/dataset','/api/v1/commands/createSale','/api/v1/products'])assert.equal((await fetch(base+path,{headers:{Host:'localhost'}})).status,404);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
