import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {openStability} from './runtime.mjs';
import {WEB_PAYMENT_POLICY} from '../integrated/admin/src/domain/webPayment.mjs';
test('web: efectivo redondea sin cambiar su politica al operar catalogo',async()=>{const q=await openStability();try{
 await q.command('configureWebPaymentPolicy',{approved:true,enabled:true,policyVersion:WEB_PAYMENT_POLICY,reason:'Validacion QA estabilidad'});
 let s=await q.command('createSale',{date:new Date().toLocaleDateString('en-CA',{timeZone:'America/Mexico_City'}),payment:'Efectivo',webPaymentPolicyVersion:WEB_PAYMENT_POLICY,items:[{productId:1,price:10,quantity:'1.33',unit:'litro'}]});
 const before=structuredClone(s.data.sales[0]);assert.equal(before.monetary.policyVersion,WEB_PAYMENT_POLICY);assert.equal(before.monetary.calculatedCents,1330);assert.equal(before.total,13.5);assert.equal(before.monetary.roundingCents,20);
 // The commercial correction engine requires a captured mobile/commercial receipt; ordinary web sales are untouched.
 const original=JSON.stringify((await q.service.read()).data.sales[0]);await q.command('saveSupplier',{name:'Proveedor QA estabilidad',active:true,businessActivity:'LIMPIEZA'});assert.equal(JSON.stringify((await q.service.read()).data.sales[0]),original);
}finally{await q.close();}});
