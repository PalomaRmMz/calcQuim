import test from 'node:test';
import assert from 'node:assert/strict';
import {hardwareIdentity} from '../src/domain/hardwareCreation.mjs';
import {validateHardwareName} from '../qa/integrated/admin/src/domain/hardwareCatalog.mjs';
test('commercial names retain fractional size and detect equivalent fraction spelling',()=>{
 const data={products:[{id:1,name:'Roma empacado ½ kg',activity:'JARCERIA'}]};
 assert.notEqual(hardwareIdentity('Roma empacado ¼ kg'),hardwareIdentity('Roma empacado ½ kg'));
 assert.equal(hardwareIdentity('Roma empacado ¼ kg'),hardwareIdentity('Roma empacado 1/4 kg'));
 assert.doesNotThrow(()=>validateHardwareName(data,{name:'Roma empacado ¼ kg'}));
 assert.throws(()=>validateHardwareName(data,{name:'Roma empacado 1/2 kg'}),/Ya existe/);
 assert.equal(hardwareIdentity('Átomizador 500ml'),hardwareIdentity('atomizador 500 ml'));
});
