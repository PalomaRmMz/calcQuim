import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('QA NativeWind middleware avoids incompatible private Metro file-map hooks',()=>{
 const script=`const assert=require('node:assert/strict');const c=require('./metro.config.js');let privateCalls=0;const bundler={getDependencyGraph(){privateCalls++;throw Error('Incompatible virtual change hook reached');}};const middleware=c.server.enhanceMiddleware((_q,_s,next)=>next(),{getBundler:()=>({getBundler:()=>bundler})});assert.equal(typeof middleware,'function');assert.equal(privateCalls,0);console.log('QA file-output path active');`;
 const result=spawnSync(process.execPath,['-e',script],{cwd:new URL('../',import.meta.url),encoding:'utf8',windowsHide:true,env:{...process.env,EXPO_PUBLIC_CALCQUIM_QA:'1'}});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/file-output path active/);
});
