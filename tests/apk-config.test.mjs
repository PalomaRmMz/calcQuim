import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const configFactory=require('../app.config.js');
const base=JSON.parse(readFileSync(new URL('../app.json',import.meta.url),'utf8')).expo;
test('APK de pruebas usa paquete separado y conserva el paquete original',()=>{
  const before=process.env.CALCQUIM_BUILD_VARIANT;
  try{
    process.env.CALCQUIM_BUILD_VARIANT='tests';
    const tests=configFactory({config:base});
    assert.equal(tests.name,'CalcQuim Pruebas');assert.equal(tests.android.package,'com.pamrm2089.calcQuim.pruebas');
    delete process.env.CALCQUIM_BUILD_VARIANT;
    assert.equal(configFactory({config:base}).android.package,base.android.package);
    assert.equal(base.android.package,'com.pamrm2089.calcQuim');
  }finally{if(before===undefined)delete process.env.CALCQUIM_BUILD_VARIANT;else process.env.CALCQUIM_BUILD_VARIANT=before;}
});
test('archivo de EAS excluye respaldos y credenciales locales',()=>{
  const ignore=readFileSync(new URL('../.easignore',import.meta.url),'utf8').split(/\r?\n/);
  for(const entry of ['.artifacts/','integration/','credentials.json','**/*.private.json','.env.*'])assert.ok(ignore.includes(entry));
  const eas=JSON.parse(readFileSync(new URL('../eas.json',import.meta.url),'utf8'));
  assert.equal(eas.build.apk.android.buildType,'apk');
  assert.equal(eas.build.apk.env.EXPO_PUBLIC_CALCQUIM_API_URL,'http://192.168.1.64:3016');
});
