import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalogChoices,validateCatalog} from '../src/domain/catalog.mjs';
import {makeLine,requestBody,repriceLines} from '../src/domain/sale.mjs';
import {WHOLESALE_VERSION} from '../src/domain/wholesalePricing.mjs';
import {makeLine as serverLine} from '../../calcQuim-admin/server/src/mobile/sale.mjs';

const data={wholesalePricing:{version:WHOLESALE_VERSION,amountPolicy:'wholesale-threshold'},categories:[{id:1,name:'Sintética',active:true}],productLines:[],priceGroups:[{id:1,name:'Grupo sintético',price:20,wholesalePrice:15,active:true}],products:[{id:1,name:'Producto sintético',categoryId:1,priceGroupId:1,price:null,unit:'litro',active:true}]};
const choice=catalogChoices(data).find(c=>c.key==='product:1'),tariff=choice.tariffs[0];
test('móvil reutiliza exactamente el motor oficial y produce los mismos renglones que Express',async()=>{
 assert.equal(await readFile(new URL('../src/domain/wholesalePricing.mjs',import.meta.url),'utf8'),await readFile(new URL('../../calcQuim-admin/src/domain/wholesalePricing.mjs',import.meta.url),'utf8'));
 for(const [mode,value]of [['quantity','9.999999'],['quantity','10'],['amount','149.99'],['amount','150'],['amount','190.01']])assert.deepEqual(makeLine(choice,tariff,mode,value,'id'),serverLine(choice,tariff,mode,value,'id'));
});
test('mayoreo automático por litros e importe, sin cambiar centavos y con evidencia de tarifa',()=>{
 const line=makeLine(choice,tariff,'amount','150','id');assert.equal(line.quantity,10);assert.equal(line.amount,150);assert.equal(line.price,15);assert.equal(line.priceTier,'wholesale');assert.equal(line.discountRate,0);
 assert.equal(makeLine(choice,tariff,'amount','149.99','id').priceTier,'normal');assert.equal(makeLine(choice,tariff,'quantity','10','id').amount,150);
 const body=requestBody({lines:[line],payment:'Efectivo'},{revision:1,generation:'synthetic',pricingVersion:WHOLESALE_VERSION});assert.equal(body.items[0].priceTier,'wholesale');assert.equal(body.items[0].pricingVersion,WHOLESALE_VERSION);
 assert.equal(validateCatalog({data,revision:1,generation:'synthetic',pricingVersion:WHOLESALE_VERSION}).data,data);
 assert.throws(()=>validateCatalog({data:{...data,wholesalePricing:undefined},revision:1,generation:'synthetic',pricingVersion:WHOLESALE_VERSION}),/configuración/);
});
test('tarifa ausente conserva normal y avisa; caché normal no se altera al generar borrador',()=>{
 const before=JSON.stringify(data),missing={...tariff,wholesalePrice:null};const row=makeLine({...choice,tariffs:[missing]},missing,'quantity','10','id');assert.equal(row.amount,200);assert.match(row.pricingWarning,/Sin tarifa/);assert.equal(JSON.stringify(data),before);
});

test('borrador móvil: añadir, editar y quitar recalcula todos los renglones del grupo oficial',()=>{
 const d=structuredClone(data);d.products.push({...d.products[0],id:2,name:'Otra variante sintética'});d.priceGroups.push({...d.priceGroups[0],id:2,name:'Otro grupo de igual tarifa'});d.products.push({...d.products[0],id:3,name:'Otro grupo',priceGroupId:2});
 const choices=catalogChoices(d),make=(id,value)=>{const c=choices.find(c=>c.key==='product:'+id);return makeLine(c,c.tariffs[0],'quantity',value,String(id));};
 const one=make(1,'1'),nine=make(2,'9'),other=make(3,'9');
 assert.deepEqual(repriceLines([one,nine,other]).map(l=>l.price),[15,15,20]);assert.deepEqual(repriceLines([one,other]).map(l=>l.price),[20,20]);
 assert.deepEqual(repriceLines([one,make(2,'8')]).map(l=>l.price),[20,20]);
 assert.equal(choices.find(c=>c.key==='category:1').tariffs.length,2);
});
test('borrador móvil mixto bloquea dos soluciones sin alterar el importe',()=>{
 const fixed=makeLine(choice,tariff,'quantity','9','fixed'),amount=makeLine(choice,tariff,'amount','15','amount');
 assert.throws(()=>repriceLines([fixed,amount]),/mixta ambigua/);assert.equal(amount.amount,15);
 const unique=makeLine(choice,tariff,'amount','20','amount');const rows=repriceLines([fixed,unique]);assert.ok(rows.every(r=>r.price===15));assert.equal(rows[1].amount,20);
});
test('móvil confirma litros del importe conservando pesos y modo de captura',()=>{
 const fixed=makeLine(choice,tariff,'quantity','1','fixed'),amount=makeLine(choice,tariff,'amount','135','amount','9');
 const result=repriceLines([fixed,amount]);assert.deepEqual(result.map(r=>r.price),[15,15]);assert.equal(result[1].quantity,9);assert.equal(result[1].amount,135);assert.equal(result[1].entryMode,'amount');
 const body=requestBody({lines:result,payment:'Efectivo'},{revision:1,generation:'test',pricingVersion:WHOLESALE_VERSION});assert.equal(body.items[1].confirmedQuantity,'9');assert.equal(body.items[1].value,'135');
 assert.throws(()=>repriceLines([fixed,makeLine(choice,tariff,'amount','135','amount','8')]),/no coincide/);
});
