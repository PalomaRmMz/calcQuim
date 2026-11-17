import test from 'node:test';
import assert from 'node:assert/strict';
import {purchasePresentationLabel} from '../qa/integrated/admin/src/domain/purchasePresentationLabel.mjs';
test('purchase selector distinguishes product variants without repeating full names',()=>{
 const products=[{id:1,name:'Mr. Big 600 hojas'},{id:2,name:'Mr. Big 800 hojas'}];
 assert.equal(purchasePresentationLabel({productId:'1',name:'Paquete de 4 piezas'},products),'Mr. Big 600 hojas · Paquete de 4 piezas');
 assert.notEqual(purchasePresentationLabel({productId:1,name:'Pieza individual'},products),purchasePresentationLabel({productId:2,name:'Pieza individual'},products));
 assert.equal(purchasePresentationLabel({productId:1,name:'Mr. Big 600 hojas · rollo'},products),'Mr. Big 600 hojas · rollo');
});
