import test from 'node:test';
import assert from 'node:assert/strict';
import {receiptForView} from '../src/domain/receiptView.mjs';
const original={id:'qa',folio:'V-QA',createdAt:'2026-11-15T20:00:00Z',status:'confirmed',version:1,total:5,items:[{name:'Service QA',quantity:1,price:5,amount:5,unit:'servicio'}]};
test('official revised receipt can be viewed without overwriting the original local evidence',()=>{const receipts=Object.freeze([Object.freeze(original)]),before=JSON.stringify(receipts),revised={...original,version:2,corrected:true,total:10,items:[{...original.items[0],quantity:2,amount:10}]};assert.equal(receiptForView(receipts,{receiptId:'qa',officialReceipt:revised}),revised);assert.equal(receiptForView(receipts,{receiptId:'qa'}),original);assert.equal(JSON.stringify(receipts),before);});
test('receipt view rejects another sale, unconfirmed data and unidentified revisions',()=>{assert.throws(()=>receiptForView([],{receiptId:'other',officialReceipt:original}));assert.throws(()=>receiptForView([],{receiptId:'qa',officialReceipt:{...original,status:'pending'}}));assert.throws(()=>receiptForView([],{receiptId:'qa',officialReceipt:{...original,version:2}}));});
